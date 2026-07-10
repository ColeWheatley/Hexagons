# @atlas: The central Gosper terrain baking pipeline ('Waffle Iron' v5.0). Ingests EPSG:31254 DEMs and high-res orthophotos (TIFs), baking per-island GSP1 binary tiles plus island-centered XUASTC LDR 6x6 KTX2 textures with incremental caching.
# 🧇 Waffle Iron v5.0 - Gosper Island Bake Edition
# =============================================================================
# FEATURES:
#   - GSP1 per-island binary layout (locked frontend contract)
#   - Gapless "Partial Skirt" Topology (SE, S, SW ownership)
#   - "Diamond" Area Sampling for faithful edge slopes
#   - Baked-in Center Normals (Nx, Nz) for smooth Cap lighting
#   - Int16 Vertical Deltas (Decimeter precision)
#   - Incremental baking with BAKER_VERSION skip logic
#   - Configurable region size (--grid 1..16) and island center (--center yq,yr)
#   - Regional DEM/gradient cache for mini-bake (memory-efficient)
#
# DATA SPECS (files NOT in git — too large):
#   Aerial TIFs:     3,486 files, 2.4–12.9 MB each (avg 7.2 MB), 24.6 GB total
#                    RGB orthophotos, EPSG:31254, ~0.2m/px
#   DEM:             DGM_Tirol_5m_epsg31254_2006_2020.tif
#                    1.1 GB on disk, 4.85 GB uncompressed (26612×45538, float32, 5m res)
#   Gradient Cache:  DGM_Tirol_gradient_cached.tif
#                    14 GB on disk, 38.78 GB uncompressed (53224×91076, 2 bands float32)
#                    Generated on first run from the DEM (2× upsampled dx/dy gradients)
#
# OUTPUT FORMATS (baked per Gosper L5 island, also NOT in git):
#   .bin:   GSP1 header + 5 heap-ordered Gosper depth blocks
#   .ktx2:  Aerial texture, XUASTC LDR 6x6 supercompressed (basisu v2.x, transcoded
#           client-side to ASTC/BC7/BC1/ETC1/PVRTC). 4096px canvas = 980m square
#           centered on the island. Saved at full res + 1/16 "low" res for LOD streaming.
#
# HARDWARE PROFILE (reference machine):
#   MacBook M1, 16 GB shared memory
#   Mini-bake 4×4 region: roughly 12–25 intersecting Gosper islands
#   Mini-bake regional cache: ~19 MB DEM + ~149 MB gradient (vs 1.1 GB + 14 GB full)
# =============================================================================

import os
import glob
import math
import time
import json
import numpy as np
import rasterio
import rasterio.enums
import rasterio.windows
import gc
import re
from shapely.geometry import Polygon, box
import argparse
import shutil
import sys
import struct
import subprocess
import tempfile
from pyproj import Transformer

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import coordinate_utility as coord_util
import generate_manifest

def latlon_to_world_meters(lat, lon):
    transformer = Transformer.from_crs("EPSG:4326", "EPSG:31254", always_xy=True)
    return transformer.transform(lon, lat)

# =============================================================================
# GLOBAL CONFIG (Modified by args)
# =============================================================================
S3_ENABLED = False # Default to False
S3_BUCKET = "wheatley.cloud"
S3_PREFIX = "powfinder/app"

# =============================================================================
# CONSTANTS & CONFIGURATION
# =============================================================================
# Texture canvas is locked to 4096px total (GPU MAX_TEXTURE_SIZE floor, PoT mips).
# Gosper islands use one uniform world-metric square; the shader maps
# uv = local_xz / 980 + 0.5.
TEXTURE_CANVAS_PX = 4096
XUASTC_QUALITY = 75  # basisu -quality (0-100); tradeoff vs bitrate — never reduce this for speed
# basisu -effort (0-10); tradeoff vs encode speed. Benchmarked full-res (4096x4096)
# single-file encodes on the reference M1: effort=4 -> ~45s, effort=2 -> ~23s,
# effort=1 -> ~8s (file size differs by <2% across all three at fixed quality=75 —
# effort mostly buys robustness against harder blocks, not raw size). effort=4
# alone blows the ~30s/sector bake budget; effort=1 keeps a full sector (canvas
# composite + full + low encode + .bin bake) at ~11s, matching run_lil_bake.sh's
# "rapid iteration" intent. Lowered per the "reduce effort, never quality/block
# size" rule — see run_basisu_encode() for a second, unrelated speed fix
# (dropping -parallel, which disables intra-image multithreading for
# single-file invocations and was independently costing ~3.4x).
XUASTC_EFFORT = 1
DEBUG_MODE = False

# Stubai Center (For Mini-Bake) — precise coordinates for sector (73, 252)
STUBAI_LAT = 46.996315457481984
STUBAI_LON = 11.119477646985764

BAKER_VERSION = "5.0.0"  # bump this when you change .bin baking logic to trigger re-bake
TEXTURE_VERSION = "2.0.0"  # clean production texture recipe/cache version
TEXTURE_TATTOO_VERSION = "1"  # diagnostic recipe version; deliberately separate from clean textures

# Mini-bake-only texture registration marks.  The motif is anchored in EPSG:31254
# world metres, so overlapping island textures paint the same strokes at the
# same terrain locations.  A 3.8 m stroke is one low-res pixel and sixteen
# full-res pixels at the production 980 m / {256,4096}px sizes: thin in the
# landscape, but equally visible after either texture is sampled.
TEXTURE_TATTOO_COLORS = {
    "low": (0, 80, 255),      # electric blue
    "full": (255, 0, 170),   # hot pink
}
TEXTURE_TATTOO_SPACING_M = 128.0
TEXTURE_TATTOO_RADIUS_M = 24.0
TEXTURE_TATTOO_STROKE_M = 3.8

DEFAULT_GRID_SIZE = 12  # 12×12 grid for mini-bake (configurable via --grid)

DEM_PATH = "hex_backend/DGM_Tirol_5m_epsg31254_2006_2020.tif"
GRADIENT_PATH = "hex_backend/DGM_Tirol_gradient_cached.tif"
AERIAL_DIR = "hex_backend/aerial_tifs"
METADATA_PATH = "frontend/app/tiles_bin/metadata.json"

# Resolved once in main() at bake start — no fallback codec exists, so a bake
# either has a working XUASTC-capable basisu binary or it fails loudly before
# baking anything.
BASISU_BINARY = None

GSP1_HEADER_STRUCT = struct.Struct("<4sHHiiiifffBBBBBxxxI")
GSP1_AGG_STRUCT = struct.Struct("<hBBBBBB")
GSP1_UNIT_STRUCT = struct.Struct("<hhhhBBBBBB")
GSP1_MAGIC = b"GSP1"
GSP1_VERSION = 1
GSP1_TILE_LEVEL = coord_util.GOSPER_TILE_LEVEL
GSP1_UNIT_DTYPE = np.dtype([
    ("dH", "<i2"), ("d1", "<i2"), ("d2", "<i2"), ("d3", "<i2"),
    ("s1", "u1"), ("s2", "u1"), ("s3", "u1"),
    ("nx", "u1"), ("nz", "u1"), ("flags", "u1"),
])
GSP1_AGG_DTYPE = np.dtype([
    ("dH", "<i2"), ("slopeMean", "u1"), ("slopeMax", "u1"),
    ("nx", "u1"), ("nz", "u1"), ("relief", "u1"), ("flags", "u1"),
])


def texture_tattoos_enabled(full_bake, disable_requested=False):
    """Diagnostic tattoos default on only for mini-bakes and cannot enter a full bake."""
    return not full_bake and not disable_requested


def texture_cache_version(tattoos_enabled):
    """Use distinct cache identities so clean and diagnostic assets never cross-reuse."""
    if tattoos_enabled:
        return f"{TEXTURE_VERSION}+tattoo-{TEXTURE_TATTOO_VERSION}"
    return TEXTURE_VERSION


def texture_recipe_marker_path(latQ, latR, output_dir="frontend/app/aerial_tiles"):
    """Per-island recipe marker; kept local and never uploaded as a texture asset."""
    return os.path.join(output_dir, ".recipes", gosper_asset_name(latQ, latR, "txt"))


def read_texture_recipe_marker(marker_path, unmarked_texture_version=""):
    """Read an island's recipe, falling back to the pre-marker cache generation."""
    try:
        with open(marker_path, "r", encoding="utf-8") as marker:
            return marker.read().strip()
    except FileNotFoundError:
        return unmarked_texture_version


def write_texture_recipe_marker(marker_path, recipe_version):
    """Atomically stamp an island only after both texture encodes succeed."""
    os.makedirs(os.path.dirname(marker_path), exist_ok=True)
    temporary_path = f"{marker_path}.{os.getpid()}.tmp"
    try:
        with open(temporary_path, "w", encoding="utf-8") as marker:
            marker.write(f"{recipe_version}\n")
        os.replace(temporary_path, marker_path)
    finally:
        if os.path.exists(temporary_path):
            os.unlink(temporary_path)


def _texture_tattoo_world_paths(bounds):
    """Yield deterministic, world-anchored henna-like registration motifs."""
    min_x, min_y, max_x, max_y = map(float, bounds)
    spacing = TEXTURE_TATTOO_SPACING_M
    radius = TEXTURE_TATTOO_RADIUS_M

    # Include off-canvas motif centers whose strokes enter this texture.  This
    # makes an overlap render identically even when a motif straddles a canvas.
    min_i = math.floor((min_x - radius) / spacing - 0.5)
    max_i = math.ceil((max_x + radius) / spacing - 0.5)
    min_j = math.floor((min_y - radius) / spacing - 0.5)
    max_j = math.ceil((max_y + radius) / spacing - 0.5)

    # Three sparse polylines form a small vine/leaf glyph rather than a tile
    # outline.  Per-cell rotation makes the pattern easy to register visually
    # without relying on terrain features.
    motif_paths = (
        ((-24.0, 0.0), (-16.0, -3.0), (-8.0, -2.0), (0.0, 0.0),
         (8.0, 2.0), (16.0, 3.0), (24.0, 0.0)),
        ((-8.0, -2.0), (-7.0, -10.0), (-1.0, -15.0), (6.0, -10.0),
         (4.0, -4.0), (-1.0, -2.0)),
        ((8.0, 2.0), (7.0, 10.0), (1.0, 15.0), (-6.0, 10.0),
         (-4.0, 4.0), (1.0, 2.0)),
    )

    for j in range(min_j, max_j + 1):
        center_y = (j + 0.5) * spacing
        for i in range(min_i, max_i + 1):
            center_x = (i + 0.5) * spacing
            angle = ((i * 13 + j * 7) % 8) * (math.pi / 4.0)
            cos_a, sin_a = math.cos(angle), math.sin(angle)
            transformed = []
            for path in motif_paths:
                transformed.append(tuple(
                    (
                        center_x + x * cos_a - y * sin_a,
                        center_y + x * sin_a + y * cos_a,
                    )
                    for x, y in path
                ))
            yield tuple(transformed)


def apply_texture_tattoo(image, bounds, resolution_kind):
    """Draw a solid diagnostic motif onto a pre-encode PIL image in place."""
    from PIL import ImageDraw

    if resolution_kind not in TEXTURE_TATTOO_COLORS:
        raise ValueError(f"Unknown texture tattoo resolution kind: {resolution_kind}")

    min_x, min_y, max_x, max_y = map(float, bounds)
    world_width = max_x - min_x
    world_height = max_y - min_y
    if world_width <= 0 or world_height <= 0:
        raise ValueError(f"Texture tattoo bounds must have positive area: {bounds}")

    px_per_m_x = image.width / world_width
    px_per_m_y = image.height / world_height
    stroke_px = max(1, round(TEXTURE_TATTOO_STROKE_M * min(px_per_m_x, px_per_m_y)))
    color = TEXTURE_TATTOO_COLORS[resolution_kind]
    draw = ImageDraw.Draw(image)

    def to_pixel(point):
        world_x, world_y = point
        return (
            round((world_x - min_x) * px_per_m_x),
            round((max_y - world_y) * px_per_m_y),
        )

    for motif in _texture_tattoo_world_paths(bounds):
        for path in motif:
            draw.line(tuple(to_pixel(point) for point in path), fill=color, width=stroke_px, joint="curve")
    return image


def prepare_texture_variants(canvas, bounds, tattoos_enabled=False):
    """Build the full/low pre-encode images, adding diagnostics after low-res sampling."""
    from PIL import Image

    low = canvas.resize((TEXTURE_CANVAS_PX // 16, TEXTURE_CANVAS_PX // 16), Image.Resampling.LANCZOS)
    if tattoos_enabled:
        # Resize first: otherwise pink full-res pixels would bleed into blue low
        # diagnostics.  Each variant must carry exactly one unambiguous color.
        apply_texture_tattoo(canvas, bounds, "full")
        apply_texture_tattoo(low, bounds, "low")
    return canvas, low


def resolve_basisu_binary():
    """
    Resolve the basisu v2 binary used to encode XUASTC LDR 6x6 KTX2 textures.
    Order: $BASISU env var -> ktx2_nonrect_texture_test/.basisu_v2/source/bin/basisu
    (relative to repo root) -> raise. The system basisu (v1.60) does NOT support
    XUASTC — there is no fallback codec.
    """
    env_path = os.environ.get("BASISU")
    if env_path:
        return env_path
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    default_path = os.path.join(repo_root, "ktx2_nonrect_texture_test", ".basisu_v2", "source", "bin", "basisu")
    if os.path.exists(default_path):
        return default_path
    raise RuntimeError(
        "No XUASTC-capable basisu v2 binary found. Set $BASISU to its path, or build one with "
        "`pixi run texture-build-basisu-v2` (requires Basis Universal v2.x — the system basisu "
        "v1.60 does not expose XUASTC). There is no fallback codec."
    )


def verify_basisu_xuastc(basisu_bin):
    """Fail loudly at bake start if the resolved basisu binary can't encode XUASTC LDR 6x6."""
    try:
        result = subprocess.run([basisu_bin, "-help"], capture_output=True, text=True, check=False)
        help_text = f"{result.stdout}\n{result.stderr}"
    except FileNotFoundError:
        raise RuntimeError(f"basisu binary not found or not executable: {basisu_bin}")
    if "-ldr_6x6i" not in help_text:
        raise RuntimeError(
            f"basisu binary at {basisu_bin} does not expose -ldr_6x6i (XUASTC LDR 6x6). "
            "This pipeline requires Basis Universal v2.x — build one with "
            "`pixi run texture-build-basisu-v2`. There is no fallback codec."
        )


def run_basisu_encode(input_png, output_ktx2):
    """
    Encode a PNG to XUASTC LDR 6x6 KTX2. Raises loudly on failure — no fallback codec.

    Deliberately omits -parallel: that flag means "compress multiple textures
    simultaneously, one thread per texture" (for multi -file invocations). We
    always encode exactly one file per call, so -parallel does not add
    parallelism here — it was measured to *disable* basisu's default
    intra-image multithreading instead, taking a single 4096x4096 encode from
    ~8s to ~27s on the reference M1. -max_threads still caps the (default,
    already-multithreaded) single-image compressor's thread count.
    """
    cmd = [
        BASISU_BINARY,
        "-ldr_6x6i",
        "-quality", str(XUASTC_QUALITY),
        "-effort", str(XUASTC_EFFORT),
        "-ktx2",
        "-mipmap",
        "-mip_srgb",
        "-no_alpha",
        "-y_flip",
        "-max_threads", str(os.cpu_count() or 4),
        "-file", str(input_png),
        "-output_file", str(output_ktx2),
    ]
    try:
        subprocess.run(cmd, check=True, capture_output=True, text=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ basisu encode failed for {output_ktx2}:\n{e.stdout}\n{e.stderr}")
        raise


def upload_to_s3(local_path):
    """
    Uploads a file to S3 immediately.
    Maps local 'frontend/app/...' to S3 'powfinder/app/...'
    """
    if not S3_ENABLED: return
    
    # Standardize path
    local_path = os.path.normpath(local_path)
    
    # Find relative path from the app root
    # local_path is like /Users/.../frontend/hexagons/app/tiles_bin/gosper_1_2.bin
    # We want the part after 'hexagons/app/'
    parts = local_path.split(os.sep)
    try:
        idx = parts.index("app")
        rel_path = "/".join(parts[idx+1:])
    except ValueError:
        rel_path = os.path.basename(local_path)

    s3_url = f"s3://{S3_BUCKET}/{S3_PREFIX}/{rel_path}"
    
    cmd = ["aws", "s3", "cp", local_path, s3_url, "--quiet"]
    
    # Set Cache-Control for immutable assets
    if local_path.endswith(('.ktx2', '.bin')):
        cmd += ["--cache-control", "max-age=31536000"]
    if local_path.endswith('.ktx2'):
        cmd += ["--content-type", "image/ktx2"]

    try:
        # Launch in background, do not wait
        subprocess.Popen(cmd)
    except Exception as e:
        print(f"⚠️  S3 Upload failed for {local_path}: {e}")

# =============================================================================
# BAKING FUNCTIONS
# =============================================================================

def get_or_create_gradient_map(dem_path, output_path, upsample_factor=1):
    """
    Generates a 2-Band Float32 TIF containing terrain gradients (dx, dy).
    Band 1: dx (Slope in X direction)
    Band 2: dy (Slope in Y direction)
    Used to derive Slope, Aspect, and Normals on the fly.
    """
    if os.path.exists(output_path):
        print(f"✅ Found cached gradient map: {output_path}")
        return rasterio.open(output_path)

    print(f"⚠️  Gradient map not found. Generating from {dem_path}...")
    start_time = time.time()

    with rasterio.open(dem_path) as src:
        new_width = src.width * upsample_factor
        new_height = src.height * upsample_factor
        
        new_transform = src.transform * src.transform.scale(
            (src.width / new_width),
            (src.height / new_height)
        )

        profile = src.profile.copy()
        profile.update(
            dtype=rasterio.float32, 
            count=2, # Two bands: dx, dy
            driver='GTiff',
            width=new_width,
            height=new_height,
            transform=new_transform,
            compress='lzw',
            tiled=True,
            blockxsize=512,
            blockysize=512,
            predictor=3,
            BIGTIFF='YES'
        )
        
        res_x = abs(new_transform[0])
        res_y = abs(new_transform[4])

        print(f"   -> Processing Gradients (Total: {new_width}x{new_height}, Res: {res_x:.2f}m)...")
        
        with rasterio.open(output_path, 'w', **profile) as dst:
            for jt, window in dst.block_windows(1):
                pad = 2
                src_window = rasterio.windows.Window(
                    window.col_off / upsample_factor - pad,
                    window.row_off / upsample_factor - pad,
                    window.width / upsample_factor + 2*pad,
                    window.height / upsample_factor + 2*pad
                ).intersection(rasterio.windows.Window(0, 0, src.width, src.height))
                
                chunk_dem = src.read(
                    1, 
                    window=src_window, 
                    out_shape=(int(src_window.height * upsample_factor), int(src_window.width * upsample_factor)),
                    resampling=rasterio.enums.Resampling.lanczos
                )
                
                if chunk_dem.size == 0: continue

                # Calculate Gradients
                # np.gradient returns (gradient_axis_0, gradient_axis_1) -> (dy, dx)
                dy, dx = np.gradient(chunk_dem, res_y, res_x)
                
                # Careful with signage: raster rows increase DOWN (-Y), but index increases UP?
                # Usually DEMs are top-left origin. +Row = -Y.
                # So gradient in row index is -dy/dPixel.
                # We want standard world space (dx, dy).
                # If TIF transform is standard (dy negative), we need to account for it.
                # simpler: keep them as raster-space gradients and handle "World Z" later?
                # Let's store pure geometric gradients: dZ/dWorldX, dZ/dWorldY.
                # If dy is negative in transform (N->S), then pixel_y+1 is South.
                # np.gradient gives change per index step.
                # if row i -> i+1 is moving South (lower Y), and logic is (z[i+1]-z[i]).
                # That is dZ / d(-Y). So dZ/dY = -(z[i+1]-z[i]) / step.
                # We passed positive step sizes (res_y, res_x) to np.gradient.
                # So `dy` output from np.gradient is dZ per Meter-Down-Screen.
                # That equals -dZ/dY.
                # So stored band 2 should be -dy.
                
                real_dy = -dy 
                real_dx = dx # X usually increases right, same as col index.
                
                # Crop encoding logic
                off_x = int(round(window.col_off - (src_window.col_off * upsample_factor)))
                off_y = int(round(window.row_off - (src_window.row_off * upsample_factor)))
                
                h, w = window.height, window.width
                
                final_dx = real_dx[off_y:off_y+int(h), off_x:off_x+int(w)]
                final_dy = real_dy[off_y:off_y+int(h), off_x:off_x+int(w)]
                
                dst.write(final_dx, 1, window=window)
                dst.write(final_dy, 2, window=window)
                
                if jt[0] % 20 == 0 and jt[1] == 0:
                    current_block = jt[0] * (dst.width // 512 + 1) + jt[1]
                    # print(f"   -> Progress...") 

    print(f"✅ Generated Gradient Map in {time.time() - start_time:.2f}s")
    return rasterio.open(output_path)

def generate_regional_gradient(dem_ds, bounds, upsample_factor=2, output_path="hex_backend/mini_bake_gradient.tif"):
    """
    Generate a small gradient TIF covering only the specified bounding box.
    Much faster and lighter than the full Tirol gradient cache (~150MB vs 14GB).
    Args:
        dem_ds: already-opened rasterio DEM dataset
        bounds: (min_x, min_y, max_x, max_y) in DEM CRS
        upsample_factor: resolution multiplier (2 = 2.5m from 5m DEM)
        output_path: where to write the gradient TIF
    """
    padding_m = 500.0  # extra padding for edge gradients
    min_x, min_y, max_x, max_y = bounds
    
    # Read the DEM window with padding
    dem_window = rasterio.windows.from_bounds(
        min_x - padding_m, min_y - padding_m,
        max_x + padding_m, max_y + padding_m, dem_ds.transform)
    dem_window = dem_window.intersection(
        rasterio.windows.Window(0, 0, dem_ds.width, dem_ds.height))
    
    out_h = int(dem_window.height * upsample_factor)
    out_w = int(dem_window.width * upsample_factor)
    
    print(f"   Generating regional gradient ({out_w}×{out_h} px)...")
    t0 = time.time()
    
    chunk_dem = dem_ds.read(
        1, window=dem_window,
        out_shape=(out_h, out_w),
        resampling=rasterio.enums.Resampling.lanczos)
    
    # Compute transform for the output
    win_transform = dem_ds.window_transform(dem_window)
    out_transform = win_transform * win_transform.scale(
        dem_window.width / out_w, dem_window.height / out_h)
    
    res_x = abs(out_transform[0])
    res_y = abs(out_transform[4])
    
    dy, dx = np.gradient(chunk_dem, res_y, res_x)
    real_dy = -dy  # flip for world-space Y
    real_dx = dx
    
    profile = dem_ds.profile.copy()
    profile.update(
        dtype=rasterio.float32, count=2, driver='GTiff',
        width=out_w, height=out_h, transform=out_transform,
        compress='lzw', tiled=True, blockxsize=256, blockysize=256,
        predictor=3)
    
    with rasterio.open(output_path, 'w', **profile) as dst:
        dst.write(real_dx, 1)
        dst.write(real_dy, 2)
    
    elapsed = time.time() - t0
    size_mb = os.path.getsize(output_path) / 1e6
    print(f"   ✅ Regional gradient: {size_mb:.1f} MB in {elapsed:.1f}s")
    return rasterio.open(output_path)

def load_tif_bounds(tif_list):
    """
    Returns [{"path", "poly"}] for every readable TIF, using a persistent
    bounds cache. rasterio.open on all ~3,486 aerial TIFs costs ~5s of pure
    header I/O per bake invocation (measured: 4.8s of a 5.9s single-sector
    run); bounds never change for a given file, so cache them keyed on
    (size, mtime). Cache lives inside AERIAL_DIR, which is gitignored.
    """
    cache_path = os.path.join(AERIAL_DIR, ".tif_bounds_cache.json")
    try:
        with open(cache_path) as fh:
            cache = json.load(fh)
    except Exception:
        cache = {}

    out, dirty = [], False
    for f in tif_list:
        try:
            st = os.stat(f)
        except OSError:
            continue
        key = os.path.basename(f)
        ent = cache.get(key)
        if not ent or ent.get("size") != st.st_size or ent.get("mtime") != st.st_mtime:
            try:
                with rasterio.open(f) as src:
                    bounds = list(src.bounds)
            except Exception:
                continue
            ent = {"size": st.st_size, "mtime": st.st_mtime, "bounds": bounds}
            cache[key] = ent
            dirty = True
        out.append({"path": f, "poly": box(*ent["bounds"])})

    if dirty:
        try:
            with open(cache_path, "w") as fh:
                json.dump(cache, fh)
        except Exception:
            pass  # cache is an optimization; never fail the bake over it
    return out

def _clipped_window(ds, bounds, pixel_aligned=False):
    try:
        window = rasterio.windows.from_bounds(*bounds, ds.transform)
        if pixel_aligned:
            col0 = max(0, math.floor(window.col_off))
            row0 = max(0, math.floor(window.row_off))
            col1 = min(ds.width, math.ceil(window.col_off + window.width))
            row1 = min(ds.height, math.ceil(window.row_off + window.height))
            if col1 <= col0 or row1 <= row0:
                return None
            return rasterio.windows.Window(col0, row0, col1 - col0, row1 - row0)
        return window.intersection(rasterio.windows.Window(0, 0, ds.width, ds.height))
    except Exception:
        return None


def _window_has_pixels(window):
    return window is not None and window.width >= 1 and window.height >= 1


def make_fast_rowcol(transform):
    # rasterio.transform.rowcol wraps every lookup in array coercion plus a
    # 2x2 linalg solve. Our rasters are axis-aligned north-up, so this is the
    # same floor semantics with much less per-edge overhead.
    if transform.b != 0 or transform.d != 0:
        return lambda x, y: rasterio.transform.rowcol(transform, x, y)
    inv_a, inv_e = 1.0 / transform.a, 1.0 / transform.e
    c0, f0 = transform.c, transform.f

    def _rowcol(x, y):
        return math.floor((y - f0) * inv_e), math.floor((x - c0) * inv_a)

    return _rowcol


def make_fast_rowcol_arrays(transform):
    if transform.b != 0 or transform.d != 0:
        def _rowcol(xs, ys):
            rows, cols = rasterio.transform.rowcol(transform, xs, ys)
            return np.asarray(rows, dtype=np.int64), np.asarray(cols, dtype=np.int64)
        return _rowcol
    inv_a, inv_e = 1.0 / transform.a, 1.0 / transform.e
    c0, f0 = transform.c, transform.f

    def _rowcol(xs, ys):
        return (
            np.floor((ys - f0) * inv_e).astype(np.int64),
            np.floor((xs - c0) * inv_a).astype(np.int64),
        )

    return _rowcol


def _pack_u8_round(values):
    return np.clip(np.rint(values), 0, 255).astype(np.uint8)


def _pack_i16_dm(values):
    return np.clip(np.rint(values), -32767, 32767).astype(np.int16)


def _pack_normals_round(nx, nz):
    return (
        _pack_u8_round(nx * 127.0 + 128.0),
        _pack_u8_round(nz * 127.0 + 128.0),
    )


def _pack_normals_trunc(nx, nz):
    return (
        np.clip((nx * 127.0 + 128.0).astype(np.int16), 0, 255).astype(np.uint8),
        np.clip((nz * 127.0 + 128.0).astype(np.int16), 0, 255).astype(np.uint8),
    )


def _unpack_normals(px, pz):
    nx = (px.astype(np.float64) - 128.0) / 127.0
    nz = (pz.astype(np.float64) - 128.0) / 127.0
    ny = np.sqrt(np.maximum(0.0, 1.0 - nx * nx - nz * nz))
    return nx, ny, nz


def _aggregate_normals(child_nx, child_nz, child_valid):
    px = child_nx.reshape(-1, 7)
    pz = child_nz.reshape(-1, 7)
    valid = child_valid.reshape(-1, 7)
    nx, ny, nz = _unpack_normals(px, pz)
    weights = valid.astype(np.float64)
    counts = weights.sum(axis=1)
    out_nx = np.full(len(counts), 128, dtype=np.uint8)
    out_nz = np.full(len(counts), 128, dtype=np.uint8)
    has_data = counts > 0
    if not np.any(has_data):
        return out_nx, out_nz

    avg_x = np.zeros(len(counts), dtype=np.float64)
    avg_y = np.ones(len(counts), dtype=np.float64)
    avg_z = np.zeros(len(counts), dtype=np.float64)
    avg_x[has_data] = (nx * weights).sum(axis=1)[has_data] / counts[has_data]
    avg_y[has_data] = (ny * weights).sum(axis=1)[has_data] / counts[has_data]
    avg_z[has_data] = (nz * weights).sum(axis=1)[has_data] / counts[has_data]
    length = np.sqrt(avg_x * avg_x + avg_y * avg_y + avg_z * avg_z)
    length = np.where(length > 0, length, 1.0)
    packed_x, packed_z = _pack_normals_round(avg_x / length, avg_z / length)
    out_nx[has_data] = packed_x[has_data]
    out_nz[has_data] = packed_z[has_data]
    return out_nx, out_nz


def _float32(value):
    return struct.unpack("<f", struct.pack("<f", float(value)))[0]


def gosper_island_info(latQ, latR):
    geom = coord_util.gosper_tile_geometry()
    centerQ, centerR = coord_util.gosper_lattice_to_center(latQ, latR)
    center_x, center_y = coord_util.axial_to_world_meters(centerQ, centerR)
    half = float(geom["tex_half_m"])
    return {
        "latQ": int(latQ),
        "latR": int(latR),
        "centerQ": int(centerQ),
        "centerR": int(centerR),
        "centerX": float(center_x),
        "centerY": float(center_y),
        "bounds": (center_x - half, center_y - half, center_x + half, center_y + half),
        "poly": box(center_x - half, center_y - half, center_x + half, center_y + half),
    }


def gosper_asset_name(latQ, latR, ext):
    return f"gosper_{latQ}_{latR}.{ext}"


def bake_gosper_textures(
    latQ,
    latR,
    valid_tifs,
    output_dir="frontend/app/aerial_tiles",
    texture_tattoos=False,
    texture_recipe_version=None,
):
    import PIL.Image as Image
    from rasterio.windows import from_bounds
    if not os.path.exists(output_dir): os.makedirs(output_dir)

    info = gosper_island_info(latQ, latR)
    min_x, min_y, max_x, max_y = info["bounds"]
    tex_world_side_m = max_x - min_x
    tex_mpp = tex_world_side_m / TEXTURE_CANVAS_PX
    target_poly = info["poly"]

    canvas = Image.new("RGB", (TEXTURE_CANVAS_PX, TEXTURE_CANVAS_PX), (0, 0, 0))
    intersecting = [t for t in valid_tifs if t["poly"].intersects(target_poly)]

    for t in intersecting:
        with rasterio.open(t["path"]) as src:
            ix_min_x, ix_max_x = max(min_x, src.bounds.left), min(max_x, src.bounds.right)
            ix_min_y, ix_max_y = max(min_y, src.bounds.bottom), min(max_y, src.bounds.top)
            if ix_min_x >= ix_max_x or ix_min_y >= ix_max_y:
                continue

            window = from_bounds(ix_min_x, ix_min_y, ix_max_x, ix_max_y, src.transform)
            # Round canvas-space edges so adjacent TIF patches share the same seam.
            px0 = round((ix_min_x - min_x) / tex_mpp)
            px1 = round((ix_max_x - min_x) / tex_mpp)
            py0 = round((max_y - ix_max_y) / tex_mpp)
            py1 = round((max_y - ix_min_y) / tex_mpp)
            w_px, h_px = px1 - px0, py1 - py0
            if w_px <= 0 or h_px <= 0:
                continue

            try:
                data = src.read(window=window, out_shape=(src.count, h_px, w_px), resampling=rasterio.enums.Resampling.lanczos)
                patch = Image.fromarray(np.moveaxis(data, 0, -1).astype("uint8"), "RGB")
                canvas.paste(patch, (px0, py0))
            except Exception:
                pass

    res_dirs = {k: os.path.join(output_dir, k) for k in ["full", "low"]}
    for d in res_dirs.values():
        if not os.path.exists(d): os.makedirs(d)

    f_name = gosper_asset_name(latQ, latR, "ktx2")
    full_path = os.path.join(res_dirs["full"], f_name)
    low_path = os.path.join(res_dirs["low"], f_name)

    canvas, c_low = prepare_texture_variants(canvas, info["bounds"], texture_tattoos)

    with tempfile.TemporaryDirectory(prefix="waffle_ktx2_") as tmp_dir:
        full_png = os.path.join(tmp_dir, "full.png")
        low_png = os.path.join(tmp_dir, "low.png")
        canvas.save(full_png, "PNG")
        c_low.save(low_png, "PNG")

        run_basisu_encode(full_png, full_path)
        run_basisu_encode(low_png, low_path)

    recipe_version = texture_recipe_version or texture_cache_version(texture_tattoos)
    write_texture_recipe_marker(texture_recipe_marker_path(latQ, latR, output_dir), recipe_version)
    upload_to_s3(full_path)
    upload_to_s3(low_path)


def _read_unit_dem_samples(latQ, latR, dem_ds):
    geom = coord_util.gosper_tile_geometry()
    info = gosper_island_info(latQ, latR)
    center_x, center_y = info["centerX"], info["centerY"]
    unit_x = center_x + geom["offx"]
    unit_y = center_y + geom["offy"]

    min_x, min_y, max_x, max_y = info["bounds"]
    dem_window = _clipped_window(
        dem_ds,
        (min_x - 40.0, min_y - 40.0, max_x + 40.0, max_y + 40.0),
        pixel_aligned=True,
    )
    if not _window_has_pixels(dem_window):
        return None

    dem_data = dem_ds.read(1, window=dem_window)
    if dem_data.size == 0:
        return None
    dem_transform = dem_ds.window_transform(dem_window)
    rowcol_arrays = make_fast_rowcol_arrays(dem_transform)
    rows, cols = rowcol_arrays(unit_x, unit_y)
    inside = (rows >= 0) & (rows < dem_data.shape[0]) & (cols >= 0) & (cols < dem_data.shape[1])

    h = np.full(len(unit_x), np.nan, dtype=np.float64)
    h[inside] = dem_data[rows[inside], cols[inside]].astype(np.float64)
    valid = inside & np.isfinite(h)
    if dem_ds.nodata is not None:
        valid &= h != dem_ds.nodata
    valid &= (h > -500.0) & (h < 9000.0)
    if not np.any(valid):
        return None

    mean_valid = float(np.mean(h[valid], dtype=np.float64))
    h_filled = h.copy()
    h_filled[~valid] = mean_valid
    return info, unit_x, unit_y, dem_data, dem_transform, h_filled, valid


def _sample_unit_edges_and_normals(unit_x, unit_y, h_filled, valid, dem_data, dem_transform, grad_ds, island_bounds):
    count = len(unit_x)
    unit_deltas = np.zeros((count, 3), dtype=np.int16)
    unit_slopes = np.zeros((count, 3), dtype=np.uint8)
    unit_nx = np.full(count, 128, dtype=np.uint8)
    unit_nz = np.full(count, 128, dtype=np.uint8)

    rowcol_arrays = make_fast_rowcol_arrays(dem_transform)
    hex_w = coord_util.UNIT_HEX_WIDTH_METERS
    dx_dq = (math.sqrt(3) / 2.0) * hex_w
    dy_dq = 0.5 * hex_w
    dy_dr = hex_w
    owned_offsets = [(1, -1), (0, -1), (-1, 0)]

    for edge_idx, (dq, dr) in enumerate(owned_offsets):
        nwx = unit_x + dq * dx_dq
        nwy = unit_y + dr * dy_dr + dq * dy_dq
        n_rows, n_cols = rowcol_arrays(nwx, nwy)
        n_rows = np.clip(n_rows, 0, dem_data.shape[0] - 1)
        n_cols = np.clip(n_cols, 0, dem_data.shape[1] - 1)
        nh = dem_data[n_rows, n_cols].astype(np.float64)
        d_m = h_filled - nh
        ok = valid & np.isfinite(d_m) & (np.abs(d_m) <= 400.0)
        edge_delta = np.zeros(count, dtype=np.int16)
        edge_delta[ok] = _pack_i16_dm(d_m[ok] * 10.0)
        unit_deltas[:, edge_idx] = edge_delta

    min_x, min_y, max_x, max_y = island_bounds
    g_window = _clipped_window(grad_ds, (min_x - 40.0, min_y - 40.0, max_x + 40.0, max_y + 40.0))
    if not _window_has_pixels(g_window):
        return unit_deltas, unit_slopes, unit_nx, unit_nz

    island_grads = grad_ds.read(window=g_window)
    if island_grads.size == 0:
        return unit_deltas, unit_slopes, unit_nx, unit_nz
    grad_transform = grad_ds.window_transform(g_window)
    grad_rowcol = make_fast_rowcol(grad_transform)
    grad_rowcol_arrays = make_fast_rowcol_arrays(grad_transform)

    def fast_diamond_slope(wx1, wy1, wx2, wy2):
        r1, c1 = grad_rowcol(wx1, wy1)
        r2, c2 = grad_rowcol(wx2, wy2)
        r_min, r_max = min(r1, r2), max(r1, r2)
        c_min, c_max = min(c1, c2), max(c1, c2)
        r_min = max(0, r_min); r_max = min(island_grads.shape[1], r_max + 1)
        c_min = max(0, c_min); c_max = min(island_grads.shape[2], c_max + 1)
        if r_max <= r_min or c_max <= c_min:
            return 0.0
        sub_dx = island_grads[0, r_min:r_max, c_min:c_max]
        sub_dy = island_grads[1, r_min:r_max, c_min:c_max]
        mdx = np.mean(sub_dx)
        mdy = np.mean(sub_dy)
        if not np.isfinite(mdx) or not np.isfinite(mdy):
            return 0.0
        return math.degrees(math.atan(math.sqrt(mdx * mdx + mdy * mdy)))

    valid_indices = np.flatnonzero(valid)
    for edge_idx, (dq, dr) in enumerate(owned_offsets):
        nwx = unit_x + dq * dx_dq
        nwy = unit_y + dr * dy_dr + dq * dy_dq
        for i in valid_indices:
            slope = fast_diamond_slope(float(unit_x[i]), float(unit_y[i]), float(nwx[i]), float(nwy[i]))
            unit_slopes[i, edge_idx] = int(np.clip(round(slope), 0, 255))

    g_rows, g_cols = grad_rowcol_arrays(unit_x, unit_y)
    g_rows = np.clip(g_rows, 0, island_grads.shape[1] - 1)
    g_cols = np.clip(g_cols, 0, island_grads.shape[2] - 1)
    dx = island_grads[0, g_rows, g_cols].astype(np.float64)
    dy = island_grads[1, g_rows, g_cols].astype(np.float64)
    length = np.sqrt(dx * dx + dy * dy + 1.0)
    normal_ok = valid & np.isfinite(length) & (length > 0)
    px, pz = _pack_normals_trunc(-dx[normal_ok] / length[normal_ok], -dy[normal_ok] / length[normal_ok])
    unit_nx[normal_ok] = px
    unit_nz[normal_ok] = pz
    return unit_deltas, unit_slopes, unit_nx, unit_nz


def _build_gsp1_nodes(h_unit, valid_unit, unit_slopes, unit_nx, unit_nz):
    mean_valid = float(np.mean(h_unit[valid_unit], dtype=np.float64))
    nodes = {
        5: {
            "count": valid_unit.astype(np.int32),
            "h_sum": np.where(valid_unit, h_unit, 0.0).astype(np.float64),
            "h_true": h_unit.astype(np.float64),
            "h_min": np.where(valid_unit, h_unit, np.inf).astype(np.float64),
            "h_max": np.where(valid_unit, h_unit, -np.inf).astype(np.float64),
            "slope_sum": np.where(valid_unit, unit_slopes.mean(axis=1), 0.0).astype(np.float64),
            "slope_mean": unit_slopes.mean(axis=1).astype(np.float64),
            "slope_max": unit_slopes.max(axis=1).astype(np.uint8),
            "nx": unit_nx.astype(np.uint8),
            "nz": unit_nz.astype(np.uint8),
            "flags": valid_unit.astype(np.uint8),
        }
    }

    for depth in range(4, -1, -1):
        child = nodes[depth + 1]
        child_count = child["count"].reshape(-1, 7)
        count = child_count.sum(axis=1).astype(np.int32)
        flags = (count > 0).astype(np.uint8)

        h_sum = child["h_sum"].reshape(-1, 7).sum(axis=1)
        h_true = np.full(len(count), mean_valid, dtype=np.float64)
        has_data = count > 0
        h_true[has_data] = h_sum[has_data] / count[has_data]

        h_min = child["h_min"].reshape(-1, 7).min(axis=1)
        h_max = child["h_max"].reshape(-1, 7).max(axis=1)
        h_min[~has_data] = mean_valid
        h_max[~has_data] = mean_valid

        slope_sum = child["slope_sum"].reshape(-1, 7).sum(axis=1)
        slope_mean = np.zeros(len(count), dtype=np.float64)
        slope_mean[has_data] = slope_sum[has_data] / count[has_data]
        slope_max = child["slope_max"].reshape(-1, 7).max(axis=1).astype(np.uint8)
        nx, nz = _aggregate_normals(child["nx"], child["nz"], child["flags"].astype(bool))

        nodes[depth] = {
            "count": count,
            "h_sum": h_sum,
            "h_true": h_true,
            "h_min": h_min,
            "h_max": h_max,
            "slope_sum": slope_sum,
            "slope_mean": slope_mean,
            "slope_max": slope_max,
            "nx": nx,
            "nz": nz,
            "flags": flags,
        }
    return nodes


def _pack_gsp1_blob(info, nodes, unit_deltas, unit_slopes, unit_nx, unit_nz, unit_valid):
    root_h = _float32(nodes[0]["h_true"][0])
    h_min = _float32(nodes[0]["h_min"][0])
    h_max = _float32(nodes[0]["h_max"][0])
    root_slope_mean = int(_pack_u8_round(nodes[0]["slope_mean"])[0])
    root_slope_max = int(nodes[0]["slope_max"][0])
    root_nx = int(nodes[0]["nx"][0])
    root_nz = int(nodes[0]["nz"][0])
    root_flags = int(nodes[0]["flags"][0])

    dH_by_depth = {}
    recon = {0: np.array([root_h], dtype=np.float64)}
    for depth in range(1, GSP1_TILE_LEVEL + 1):
        parent_recon = np.repeat(recon[depth - 1], 7)
        dH = _pack_i16_dm((nodes[depth]["h_true"] - parent_recon) * 10.0)
        dH_by_depth[depth] = dH
        recon[depth] = parent_recon + dH.astype(np.float64) * 0.1

    blob = bytearray(GSP1_HEADER_STRUCT.pack(
        GSP1_MAGIC,
        GSP1_VERSION,
        GSP1_TILE_LEVEL,
        info["centerQ"],
        info["centerR"],
        info["latQ"],
        info["latR"],
        root_h,
        h_min,
        h_max,
        root_slope_mean,
        root_slope_max,
        root_nx,
        root_nz,
        root_flags,
        0,
    ))

    for depth in range(1, GSP1_TILE_LEVEL):
        node = nodes[depth]
        count = 7 ** depth
        records = np.empty(count, dtype=GSP1_AGG_DTYPE)
        records["dH"] = dH_by_depth[depth]
        records["slopeMean"] = _pack_u8_round(node["slope_mean"])
        records["slopeMax"] = node["slope_max"]
        records["nx"] = node["nx"]
        records["nz"] = node["nz"]
        relief = np.where(node["flags"].astype(bool), (node["h_max"] - node["h_min"]) / 4.0, 0.0)
        records["relief"] = _pack_u8_round(relief)
        records["flags"] = node["flags"]
        blob.extend(struct.pack("<I", count))
        blob.extend(records.tobytes())

    count = 7 ** GSP1_TILE_LEVEL
    records = np.empty(count, dtype=GSP1_UNIT_DTYPE)
    records["dH"] = dH_by_depth[GSP1_TILE_LEVEL]
    records["d1"] = unit_deltas[:, 0]
    records["d2"] = unit_deltas[:, 1]
    records["d3"] = unit_deltas[:, 2]
    records["s1"] = unit_slopes[:, 0]
    records["s2"] = unit_slopes[:, 1]
    records["s3"] = unit_slopes[:, 2]
    records["nx"] = unit_nx
    records["nz"] = unit_nz
    records["flags"] = unit_valid.astype(np.uint8)
    blob.extend(struct.pack("<I", count))
    blob.extend(records.tobytes())
    return blob


def bake_gosper_binary(latQ, latR, dem_ds, grad_ds, output_dir="frontend/app/tiles_bin"):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    dem_sample = _read_unit_dem_samples(latQ, latR, dem_ds)
    if dem_sample is None:
        return False

    info, unit_x, unit_y, dem_data, dem_transform, h_unit, unit_valid = dem_sample
    unit_deltas, unit_slopes, unit_nx, unit_nz = _sample_unit_edges_and_normals(
        unit_x, unit_y, h_unit, unit_valid, dem_data, dem_transform, grad_ds, info["bounds"])
    nodes = _build_gsp1_nodes(h_unit, unit_valid, unit_slopes, unit_nx, unit_nz)
    blob = _pack_gsp1_blob(info, nodes, unit_deltas, unit_slopes, unit_nx, unit_nz, unit_valid)

    bin_path = os.path.join(output_dir, gosper_asset_name(latQ, latR, "bin"))
    with open(bin_path, "wb") as f:
        f.write(blob)
    upload_to_s3(bin_path)
    return True


def _lattice_world_basis():
    qx, qr = coord_util.gosper_lattice_to_center(1, 0)
    rx, rr = coord_util.gosper_lattice_to_center(0, 1)
    bq_x, bq_y = coord_util.axial_to_world_meters(qx, qr)
    br_x, br_y = coord_util.axial_to_world_meters(rx, rr)
    return np.array([[bq_x, br_x], [bq_y, br_y]], dtype=np.float64)


def enumerate_gosper_islands_for_bbox(region_bounds):
    min_x, min_y, max_x, max_y = region_bounds
    geom = coord_util.gosper_tile_geometry()
    half = float(geom["tex_half_m"])
    basis_inv = np.linalg.inv(_lattice_world_basis())
    search_corners = np.array([
        [min_x - half, min_y - half],
        [max_x + half, min_y - half],
        [max_x + half, max_y + half],
        [min_x - half, max_y + half],
    ], dtype=np.float64)
    lattice = (basis_inv @ search_corners.T).T
    min_yq = math.floor(float(lattice[:, 0].min())) - 2
    max_yq = math.ceil(float(lattice[:, 0].max())) + 2
    min_yr = math.floor(float(lattice[:, 1].min())) - 2
    max_yr = math.ceil(float(lattice[:, 1].max())) + 2

    islands = []
    for yq in range(min_yq, max_yq + 1):
        for yr in range(min_yr, max_yr + 1):
            info = gosper_island_info(yq, yr)
            ix0, iy0, ix1, iy1 = info["bounds"]
            intersects = ix1 >= min_x and ix0 <= max_x and iy1 >= min_y and iy0 <= max_y
            if intersects:
                islands.append(info)
    islands.sort(key=lambda t: (t["latQ"], t["latR"]))
    return islands


def _bounds_union(bounds_iter):
    bounds = list(bounds_iter)
    if not bounds:
        return None
    min_x = min(b[0] for b in bounds)
    min_y = min(b[1] for b in bounds)
    max_x = max(b[2] for b in bounds)
    max_y = max(b[3] for b in bounds)
    return (min_x, min_y, max_x, max_y)

def main():
    global S3_ENABLED, BASISU_BINARY
    parser = argparse.ArgumentParser(description="🧇 Waffle Iron v5.0 — Gosper Island Incremental Bake")
    parser.add_argument("--full", action="store_true", help="Run full global bake (defaults to Mini-Bake)")
    parser.add_argument("--center", type=str, help="Center island lattice coords as 'yq,yr' (e.g. 0,0)")
    parser.add_argument("--grid", type=int, default=DEFAULT_GRID_SIZE,
                        help=f"Region side in sector units, N*819.2 meters (1-16, default {DEFAULT_GRID_SIZE})")
    parser.add_argument("--force", action="store_true", help="Force re-bake of all islands in range")
    parser.add_argument(
        "--no-texture-tattoos",
        action="store_true",
        help="Disable the mini-bake's default blue-low/pink-full texture registration marks",
    )
    args = parser.parse_args()

    # Validate grid size
    grid_size = max(1, min(16, args.grid))
    texture_tattoos = texture_tattoos_enabled(args.full, args.no_texture_tattoos)
    effective_texture_version = texture_cache_version(texture_tattoos)

    # Load existing metadata for skip logic
    metadata = {}
    if os.path.exists(METADATA_PATH):
        try:
            with open(METADATA_PATH, "r") as f:
                metadata = json.load(f)
        except: pass
    
    prev_baker_version = metadata.get("baker_version", "")
    prev_texture_version = metadata.get("texture_version", "")
    # Before per-island markers existed, metadata's global version described
    # every unmarked file.  Preserve that baseline across partial mini-bakes;
    # otherwise the first tattooed region could make clean files elsewhere look
    # tattooed (or vice versa) and incorrectly skip them on a later run.
    unmarked_texture_version = metadata.get("unmarked_texture_version", prev_texture_version)
    can_skip_bin = (prev_baker_version == BAKER_VERSION) and not args.force
    if args.force:
        print(f"🔥 Force re-bake enabled (bin + textures).")
    else:
        if can_skip_bin:
            print(f"🔄 Incremental bake: BAKER_VERSION {BAKER_VERSION} matches. Will skip existing .bin files.")
        else:
            print(f"✨ New baker version detected ({prev_baker_version} -> {BAKER_VERSION}). Re-baking all .bin files in range.")
        if prev_texture_version == effective_texture_version:
            print(f"🔄 Incremental bake: selected texture recipe {effective_texture_version} matches the last run; checking per-island markers.")
        else:
            print(f"✨ Texture recipe changed ({prev_texture_version} -> {effective_texture_version}); checking per-island markers.")

    # Resolve + verify the XUASTC encoder up front — fail loudly before doing any
    # other work. There is no fallback codec.
    BASISU_BINARY = resolve_basisu_binary()
    verify_basisu_xuastc(BASISU_BINARY)
    print(f"🎨 basisu (XUASTC-capable): {BASISU_BINARY}")

    # Disk Space Check
    import shutil as disk_check
    total, used, free = disk_check.disk_usage("/")
    free_gb = free / (1024**3)
    if free_gb < 5.0:
        print(f"⚠️  WARNING: Only {free_gb:.1f}GB of free disk space available!")
        print(f"   The bake may fail if disk fills up. Consider freeing space first.")
        response = input("   Continue anyway? (y/N): ")
        if response.lower() != 'y':
            print("Aborting.")
            return

    if args.full:
        print("🚀 RUNNING FULL GLOBAL BAKE (S3 Enabled)")
        print("⚠️  This will process ~3,486 TIFs and may take several hours.")
        print("🎨 Texture tattoos: OFF (production bake)")
        S3_ENABLED = True
    else:
        print(f"🧪 RUNNING MINI-BAKE ({grid_size}×{grid_size} grid, S3 Disabled)")
        if texture_tattoos:
            print("🎨 Texture tattoos: ON (electric blue low-res / hot pink full-res)")
        else:
            print("🎨 Texture tattoos: OFF (--no-texture-tattoos)")
        S3_ENABLED = False

    # --- CLEANUP (Non-destructive) ---
    dirs_to_ensure = ["frontend/app/tiles_bin", "frontend/app/aerial_tiles", 
                      "frontend/app/aerial_tiles/full", "frontend/app/aerial_tiles/low"]
    for d in dirs_to_ensure:
        os.makedirs(d, exist_ok=True)

    # --- OPEN DEM (not read into memory — windowed reads per sector) ---
    print("Opening DEM...")
    dem = rasterio.open(DEM_PATH)
    dem_poly = box(*dem.bounds)
    print(f"✅ DEM: {dem.width}×{dem.height}, bounds: {dem.bounds}")

    upsample = 2
    # Gradient map: deferred until we know the bake region (mini-bake generates a small one)
    grad_ds = None

    valid_tifs = []
    geom = coord_util.gosper_tile_geometry()
    tex_half_m = float(geom["tex_half_m"])

    # Calculate Bounds
    if args.full:
        print("Scanning ALL TIFs (cached bounds)...")
        valid_tifs = load_tif_bounds(glob.glob(os.path.join(AERIAL_DIR, "*.tif")))

        all_min_x, all_min_y = 1e12, 1e12
        all_max_x, all_max_y = -1e12, -1e12
        for t in valid_tifs:
            b = t["poly"].bounds
            all_min_x, all_min_y = min(all_min_x, b[0]), min(all_min_y, b[1])
            all_max_x, all_max_y = max(all_max_x, b[2]), max(all_max_y, b[3])
        region_bounds = (all_min_x, all_min_y, all_max_x, all_max_y)
    else:
        # Mini-Bake Range
        if args.center:
            try:
                center_yq, center_yr = map(int, args.center.split(","))
                center_info = gosper_island_info(center_yq, center_yr)
                cx, cy = center_info["centerX"], center_info["centerY"]
                print(f"📍 Using custom center island: ({center_yq}, {center_yr})")
            except Exception:
                print(f"⚠️  Invalid center format '{args.center}'. Expected 'yq,yr'. Falling back to Stubai.")
                cx, cy = latlon_to_world_meters(STUBAI_LAT, STUBAI_LON)
        else:
            cx, cy = latlon_to_world_meters(STUBAI_LAT, STUBAI_LON)
            print(f"📍 Using default Stubai center point ({cx:.1f}, {cy:.1f}m)")

        half_side = (grid_size * coord_util.SECTOR_SIZE_METERS) * 0.5
        m_x1, m_y1, m_x2, m_y2 = cx - half_side, cy - half_side, cx + half_side, cy + half_side
        region_bounds = (m_x1, m_y1, m_x2, m_y2)
        mini_box = box(m_x1 - tex_half_m, m_y1 - tex_half_m, m_x2 + tex_half_m, m_y2 + tex_half_m)

        # Only load intersecting TIFs
        print("Filtering TIFs for Mini-Bake area (cached bounds)...")
        tif_list = glob.glob(os.path.join(AERIAL_DIR, "*.tif"))
        valid_tifs = [t for t in load_tif_bounds(tif_list) if t["poly"].intersects(mini_box)]
        print(f"✅ Found {len(valid_tifs)} intersecting TIFs (of {len(tif_list)} total).")

    islands = enumerate_gosper_islands_for_bbox(region_bounds)
    print(f"Island candidates intersecting region: {len(islands)}")

    if not args.full:
        # Generate a lightweight regional gradient over every candidate island,
        # not just the center region, because border island squares intentionally
        # extend outside the requested bbox.
        gradient_bounds = _bounds_union(info["bounds"] for info in islands) or region_bounds
        grad_ds = generate_regional_gradient(dem, gradient_bounds, upsample_factor=upsample)

    # For full bake, use the pre-computed full gradient cache
    if grad_ds is None:
        grad_ds = get_or_create_gradient_map(DEM_PATH, GRADIENT_PATH, upsample_factor=upsample)

    print(f"Region bounds: X[{region_bounds[0]:.1f}..{region_bounds[2]:.1f}], "
          f"Y[{region_bounds[1]:.1f}..{region_bounds[3]:.1f}]")

    bake_times = []
    skipped = 0
    skipped_no_dem = 0
    skipped_no_imagery = 0
    skipped_no_unit_data = 0
    total_bake_start = time.time()

    for info in islands:
        yq, yr = info["latQ"], info["latR"]
        island_poly = info["poly"]
        if not dem_poly.intersects(island_poly):
            skipped_no_dem += 1
            continue
        has_imagery = any(t["poly"].intersects(island_poly) for t in valid_tifs)
        if not has_imagery:
            skipped_no_imagery += 1
            continue

        # Skip logic (already baked) — .bin and textures are versioned/skipped
        # independently, so an island can re-bake one without the other.
        bin_file = f"frontend/app/tiles_bin/{gosper_asset_name(yq, yr, 'bin')}"
        tex_full_file = f"frontend/app/aerial_tiles/full/{gosper_asset_name(yq, yr, 'ktx2')}"
        tex_low_file = f"frontend/app/aerial_tiles/low/{gosper_asset_name(yq, yr, 'ktx2')}"
        tex_recipe_file = texture_recipe_marker_path(yq, yr)
        island_texture_version = read_texture_recipe_marker(tex_recipe_file, unmarked_texture_version)
        skip_bin = can_skip_bin and os.path.exists(bin_file)
        skip_tex = (
            not args.force
            and island_texture_version == effective_texture_version
            and os.path.exists(tex_full_file)
            and os.path.exists(tex_low_file)
        )
        if skip_bin and skip_tex:
            skipped += 1
            continue

        t0 = time.time()
        print(f"Cooking Gosper island {yq}, {yr}...")
        if not skip_bin:
            wrote_bin = bake_gosper_binary(yq, yr, dem, grad_ds)
            if not wrote_bin:
                skipped_no_unit_data += 1
                print("   ⏭️  no valid DEM unit samples")
                continue
        if not skip_tex:
            bake_gosper_textures(
                yq,
                yr,
                valid_tifs,
                texture_tattoos=texture_tattoos,
                texture_recipe_version=effective_texture_version,
            )
        elapsed = time.time() - t0
        bake_times.append(elapsed)
        print(f"   ⏱️  {elapsed:.1f}s")
        gc.collect()

    total_elapsed = time.time() - total_bake_start
    skip_parts = []
    if skipped: skip_parts.append(f"{skipped} cached")
    if skipped_no_dem: skip_parts.append(f"{skipped_no_dem} no-DEM")
    if skipped_no_imagery: skip_parts.append(f"{skipped_no_imagery} no-imagery")
    if skipped_no_unit_data: skip_parts.append(f"{skipped_no_unit_data} no-unit-data")
    skip_summary = f"  ⏭️  Skipped: {', '.join(skip_parts)}" if skip_parts else ""
    if bake_times:
        avg = sum(bake_times) / len(bake_times)
        print(f"\n📊 Bake Stats: {len(bake_times)} islands in {total_elapsed:.1f}s "
              f"(avg {avg:.1f}s/island){skip_summary}")
    elif skip_parts:
        print(f"\n⏩ Nothing to bake.{skip_summary}")

    if grad_ds is not None:
        grad_ds.close()
    dem.close()

    # Update metadata
    with open(METADATA_PATH, "w") as f:
        json.dump({"baker_version": BAKER_VERSION, "texture_version": effective_texture_version,
                   "texture_tattoos": texture_tattoos,
                   "unmarked_texture_version": unmarked_texture_version,
                   "last_bake": time.ctime(),
                   "grid_size": grid_size, "islands_baked": len(bake_times)}, f)

    generate_manifest.generate_manifest()
    # Upload manifest last
    manifest_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/app/tile_manifest.json"))
    upload_to_s3(manifest_path)
    print("Done.")

if __name__ == "__main__": main()
