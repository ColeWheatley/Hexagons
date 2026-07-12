# @atlas: The central Gosper terrain baking pipeline ('Waffle Iron' v6.0). Ingests EPSG:31254 DEMs and high-res orthophotos (TIFs), baking per-island GSP3 binary tiles with separate terrain/render aggregate bounds plus island-centered three-tier XUASTC LDR 6x6 KTX2 textures.
# 🧇 Waffle Iron v6.0 - Gosper Island Bake Edition
# =============================================================================
# FEATURES:
#   - GSP3 per-island binary layout with separate terrain and rendered bounds
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
#   .bin:   GSP3 header + 5 heap-ordered Gosper depth blocks
#   .ktx2:  Aerial texture, XUASTC LDR 6x6 supercompressed (basisu v2.x, transcoded
#           client-side to ASTC/BC7/BC1/ETC1/PVRTC). Globally anchored 1024m
#           EPSG:31254 pages, shared across geometry, emitted as low/medium/high
#           KTX2 tiers at 128/256/4096px with full mips. Legacy 980m island
#           assets are retained only as the migration rollback path.
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
import rasterio.features
import rasterio.windows
import gc
import re
from shapely.geometry import Polygon, box
from shapely.ops import unary_union
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
from texture_contract import (
    TEXTURE_PAGE_RECIPE_VERSION,
    TEXTURE_RECIPE_VERSION,
    TEXTURE_TIERS,
    TEXTURE_TIER_SIZES,
)
from gosper_texture_page_adapter import (
    exact_pages_for_tiles,
    page_intersects_render_caps,
    tile_coverage_bounds,
)
from texture_page_grid import PAGE_SIZE_M, TexturePage, pages_for_bounds

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
# The composite is built once at the high-tier size. Smaller tiers are derived
# from it before diagnostics are applied, preventing cross-tier color bleed.
# High includes a complete mip chain and fits the WebGL2 4096 minimum maximum
# texture size without a duplicate fallback asset.
TEXTURE_CANVAS_PX = TEXTURE_TIER_SIZES["high"]
XUASTC_QUALITY = 75  # basisu -quality (0-100); tradeoff vs bitrate — never reduce this for speed
# basisu -effort (0-10); tradeoff vs encode speed. Benchmarked at 4096x4096
# single-file encodes on the reference M1: effort=4 -> ~45s, effort=2 -> ~23s,
# effort=1 -> ~8s (file size differs by <2% across all three at fixed quality=75 —
# effort mostly buys robustness against harder blocks, not raw size). effort=4
# alone blows the ~30s/sector bake budget; effort=1 keeps a full sector (canvas
# composite + texture encodes + .bin bake) at ~11s, matching run_lil_bake.sh's
# "rapid iteration" intent. Lowered per the "reduce effort, never quality/block
# size" rule — see run_basisu_encode() for a second, unrelated speed fix
# (dropping -parallel, which disables intra-image multithreading for
# single-file invocations and was independently costing ~3.4x).
XUASTC_EFFORT = 1
DEBUG_MODE = False

# Stubai Center (For Mini-Bake) — precise coordinates for sector (73, 252)
STUBAI_LAT = 46.996315457481984
STUBAI_LON = 11.119477646985764

BAKER_VERSION = "6.0.1"  # GSP3 splits terrain relief from exact rendered bounds
TEXTURE_VERSION = TEXTURE_RECIPE_VERSION
TEXTURE_PAGE_VERSION = TEXTURE_PAGE_RECIPE_VERSION
TEXTURE_TATTOO_VERSION = "2"  # three-tier colors/sizes; separate from clean textures

# Mini-bake-only texture registration marks.  The motif is anchored in EPSG:31254
# world metres, so overlapping island textures paint the same strokes at the
# same terrain locations.  A 7.7m stroke is approximately 1/2/64 pixels at the
# global 1024m / {128,256,4096}px pages (and migration-era 980m canvases):
# sparse in the landscape, with comparable world-space weight in every tier.
TEXTURE_TATTOO_COLORS = {
    "low": (0, 255, 48),       # very vibrant green postage tier
    "medium": (0, 96, 255),    # electric blue medium tier
    "high": (255, 0, 170),     # hot pink high tier
}
TEXTURE_TATTOO_SPACING_M = 128.0
TEXTURE_TATTOO_RADIUS_M = 24.0
TEXTURE_TATTOO_STROKE_M = 7.7
SHADER_SKIRT_EXTENSION_M = 12.0
AGGREGATE_SKIRT_BASE_EXTENSION_M = 12.0

DEFAULT_GRID_SIZE = 12  # 12×12 grid for mini-bake (configurable via --grid)

DEM_PATH = "hex_backend/DGM_Tirol_5m_epsg31254_2006_2020.tif"
GRADIENT_PATH = "hex_backend/DGM_Tirol_gradient_cached.tif"
AERIAL_DIR = "hex_backend/aerial_tifs"
METADATA_PATH = "frontend/app/tiles_bin/metadata.json"
TEXTURE_PAGE_OUTPUT_DIR = "frontend/app/aerial_pages"

# Resolved once in main() at bake start — no fallback codec exists, so a bake
# either has a working XUASTC-capable basisu binary or it fails loudly before
# baking anything.
BASISU_BINARY = None

# GSP1/GSP2/GSP3 share the 48-byte header and 14-byte unit record. GSP3 keeps
# GSP2's terrain-only down/up extents for aggregate skirt sizing and adds
# independent rendered down/up extents for hierarchical culling. The latter
# enclose signed unit-skirt endpoints, aggregate skirts, and descendants.
GSP_HEADER_STRUCT = struct.Struct("<4sHHiiiifffBBBBBxxxI")
GSP1_AGG_STRUCT = struct.Struct("<hBBBBBB")
GSP2_AGG_STRUCT = struct.Struct("<hBBBBHHBB")
GSP3_AGG_STRUCT = struct.Struct("<hBBBBHHHHBB")
GSP_UNIT_STRUCT = struct.Struct("<hhhhBBBBBB")
GSP1_MAGIC = b"GSP1"
GSP1_VERSION = 1
GSP2_MAGIC = b"GSP2"
GSP2_VERSION = 2
GSP3_MAGIC = b"GSP3"
GSP3_VERSION = 3
GSP1_TILE_LEVEL = coord_util.GOSPER_TILE_LEVEL
# Compatibility aliases retained for tooling that only needs the unchanged
# header/unit layouts. New bakes always write GSP3.
GSP1_HEADER_STRUCT = GSP_HEADER_STRUCT
GSP1_UNIT_STRUCT = GSP_UNIT_STRUCT
GSP1_UNIT_DTYPE = np.dtype([
    ("dH", "<i2"), ("d1", "<i2"), ("d2", "<i2"), ("d3", "<i2"),
    ("s1", "u1"), ("s2", "u1"), ("s3", "u1"),
    ("nx", "u1"), ("nz", "u1"), ("flags", "u1"),
])
GSP1_AGG_DTYPE = np.dtype([
    ("dH", "<i2"), ("slopeMean", "u1"), ("slopeMax", "u1"),
    ("nx", "u1"), ("nz", "u1"), ("relief", "u1"), ("flags", "u1"),
])
GSP2_AGG_DTYPE = np.dtype([
    ("dH", "<i2"), ("slopeMean", "u1"), ("slopeMax", "u1"),
    ("nx", "u1"), ("nz", "u1"),
    ("downExtent", "<u2"), ("upExtent", "<u2"),
    ("flags", "u1"), ("reserved", "u1"),
])
GSP3_AGG_DTYPE = np.dtype([
    ("dH", "<i2"), ("slopeMean", "u1"), ("slopeMax", "u1"),
    ("nx", "u1"), ("nz", "u1"),
    ("downExtent", "<u2"), ("upExtent", "<u2"),
    ("renderDown", "<u2"), ("renderUp", "<u2"),
    ("flags", "u1"), ("reserved", "u1"),
])


def texture_tattoos_enabled(full_bake, disable_requested=False):
    """Diagnostic tattoos default on only for mini-bakes and cannot enter a full bake."""
    return not full_bake and not disable_requested


def texture_cache_version(tattoos_enabled):
    """Use distinct cache identities so clean and diagnostic assets never cross-reuse."""
    if tattoos_enabled:
        return f"{TEXTURE_VERSION}+tattoo-{TEXTURE_TATTOO_VERSION}"
    return TEXTURE_VERSION


def texture_page_cache_version(tattoos_enabled):
    """Cache identity for global pages, independent of legacy island assets."""
    if tattoos_enabled:
        return f"{TEXTURE_PAGE_VERSION}+tattoo-{TEXTURE_TATTOO_VERSION}"
    return TEXTURE_PAGE_VERSION


def texture_recipe_marker_path(latQ, latR, output_dir="frontend/app/aerial_tiles"):
    """Per-island recipe marker; kept local and never uploaded as a texture asset."""
    return os.path.join(output_dir, ".recipes", gosper_asset_name(latQ, latR, "txt"))


def texture_page_recipe_marker_path(page, output_dir=TEXTURE_PAGE_OUTPUT_DIR):
    """Per-page marker written only after all three KTX2 tiers are published."""
    return os.path.join(output_dir, ".recipes", f"{page.asset_stem}.txt")


def texture_page_padding_stats_path(page, output_dir=TEXTURE_PAGE_OUTPUT_DIR):
    """Auditable boundary-padding record, separate from the recipe marker."""
    return os.path.join(output_dir, ".coverage", f"{page.asset_stem}.json")


def write_texture_page_padding_stats(path, stats):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    temporary_path = f"{path}.{os.getpid()}.tmp"
    try:
        with open(temporary_path, "w", encoding="utf-8") as target:
            json.dump(stats, target, sort_keys=True, separators=(",", ":"))
            target.write("\n")
        os.replace(temporary_path, path)
    finally:
        if os.path.exists(temporary_path):
            os.unlink(temporary_path)


def read_texture_page_padding_stats(path):
    try:
        with open(path, "r", encoding="utf-8") as source:
            stats = json.load(source)
        return {
            "padded_pixels": int(stats.get("padded_pixels", 0)),
            "padded_area_m2": float(stats.get("padded_area_m2", 0.0)),
            "max_distance_m": float(stats.get("max_distance_m", 0.0)),
        }
    except (FileNotFoundError, OSError, ValueError, TypeError, json.JSONDecodeError):
        return {"padded_pixels": 0, "padded_area_m2": 0.0, "max_distance_m": 0.0}


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


def prepare_texture_variants(canvas, bounds, tattoos_enabled=False, tier_sizes=None):
    """Build all pre-encode tiers, adding diagnostics after each resize.

    ``tier_sizes`` is injectable for lightweight unit tests; production callers
    use the locked 128/256/4096 contract. The high canvas is returned by
    reference rather than copied, which avoids a redundant ~48 MiB RGB image.
    """
    from PIL import Image

    sizes = dict(tier_sizes or TEXTURE_TIER_SIZES)
    required = {tier["name"] for tier in TEXTURE_TIERS}
    if set(sizes) != required:
        raise ValueError(f"Texture tier sizes must define exactly {sorted(required)}")
    expected_high = int(sizes["high"])
    if canvas.size != (expected_high, expected_high):
        raise ValueError(f"High texture canvas must be {expected_high}x{expected_high}, got {canvas.size}")

    variants = {
        "low": canvas.resize((int(sizes["low"]), int(sizes["low"])), Image.Resampling.LANCZOS),
        "medium": canvas.resize((int(sizes["medium"]), int(sizes["medium"])), Image.Resampling.LANCZOS),
        "high": canvas,
    }
    if tattoos_enabled:
        # Resize first: otherwise high-tier pink pixels would bleed into the
        # lower tiers. Each variant carries exactly one unambiguous color.
        for tier_name, image in variants.items():
            apply_texture_tattoo(image, bounds, tier_name)
    return variants


def select_aerial_tifs_for_islands(all_tifs, islands):
    """Keep every aerial source touching the exact union of candidate texture squares."""
    island_polys = [info["poly"] for info in islands]
    if not island_polys:
        return []
    texture_footprint = unary_union(island_polys)
    return [tif for tif in all_tifs if tif["poly"].intersects(texture_footprint)]


def validate_geometry_texture_coverage(coverage, bounds, unit_x, unit_y, unit_valid, tile_label="tile"):
    """Reject an aerial composite that leaves any valid unit cap unpainted.

    ``coverage`` records successful source-image pastes, independently of RGB
    values (real aerial pixels may legitimately be very dark).  A unit cap is
    considered covered only when its center and all six vertices land on
    painted pixels.  Invalid/off-DEM units are deliberately ignored, so a
    partial dataset-edge island is accepted when all geometry it can actually
    render has imagery.
    """
    coverage = np.asarray(coverage, dtype=bool)
    unit_x = np.asarray(unit_x, dtype=np.float64)
    unit_y = np.asarray(unit_y, dtype=np.float64)
    unit_valid = np.asarray(unit_valid, dtype=bool)
    if coverage.ndim != 2 or coverage.size == 0:
        raise ValueError("texture coverage mask must be a non-empty 2D array")
    if unit_x.shape != unit_y.shape or unit_x.shape != unit_valid.shape:
        raise ValueError("unit coordinate and validity arrays must have identical shapes")

    valid_indices = np.flatnonzero(unit_valid)
    if valid_indices.size == 0:
        raise ValueError(f"{tile_label}: texture coverage validation has no valid terrain units")

    min_x, min_y, max_x, max_y = map(float, bounds)
    if min_x >= max_x or min_y >= max_y:
        raise ValueError(f"{tile_label}: texture coverage bounds must have positive area")

    radius = coord_util.UNIT_HEX_WIDTH_METERS / math.sqrt(3.0)
    angles = np.arange(6, dtype=np.float64) * (math.pi / 3.0)
    sample_dx = np.concatenate(([0.0], np.cos(angles) * radius))
    sample_dy = np.concatenate(([0.0], np.sin(angles) * radius))
    sample_x = unit_x[valid_indices, None] + sample_dx[None, :]
    sample_y = unit_y[valid_indices, None] + sample_dy[None, :]

    height, width = coverage.shape
    cols = np.floor((sample_x - min_x) * width / (max_x - min_x)).astype(np.int64)
    rows = np.floor((max_y - sample_y) * height / (max_y - min_y)).astype(np.int64)
    inside = (cols >= 0) & (cols < width) & (rows >= 0) & (rows < height)
    safe_cols = np.clip(cols, 0, width - 1)
    safe_rows = np.clip(rows, 0, height - 1)
    sample_covered = inside & coverage[safe_rows, safe_cols]
    missing_cells = ~sample_covered.all(axis=1)
    if np.any(missing_cells):
        missing_indices = valid_indices[missing_cells]
        preview = ",".join(str(int(i)) for i in missing_indices[:8])
        raise RuntimeError(
            f"{tile_label}: aerial composite leaves {missing_indices.size}/{valid_indices.size} "
            f"valid terrain hexes unpainted (unit indices: {preview})"
        )

    return int(valid_indices.size)


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
    for f in sorted(tif_list):
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


def _pack_u16_extent_dm(values_m):
    """Conservatively ceil non-negative metre extents into uint16 decimetres."""
    values_m = np.asarray(values_m, dtype=np.float64)
    if not np.all(np.isfinite(values_m)):
        raise ValueError("GSP vertical extents must be finite")
    scaled = np.ceil(np.maximum(values_m, 0.0) * 10.0)
    if np.any(scaled > np.iinfo(np.uint16).max):
        raise OverflowError("GSP vertical extent exceeds uint16 decimetre range")
    return scaled.astype(np.uint16)


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


def _float32_outward(value, direction):
    """Round a bound to float32 without ever moving it toward the interval."""
    packed = np.float32(value)
    if direction < 0 and float(packed) > float(value):
        packed = np.nextafter(packed, np.float32(-np.inf), dtype=np.float32)
    elif direction > 0 and float(packed) < float(value):
        packed = np.nextafter(packed, np.float32(np.inf), dtype=np.float32)
    return float(packed)


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


def composite_aerial_texture(bounds, valid_tifs):
    """Composite one absolute EPSG:31254 square at the high-tier resolution.

    The function knows only world bounds and imagery sources. It is shared by
    the migration-era island baker and the permanent global page baker so
    resampling and seam semantics cannot drift.
    """
    import PIL.Image as Image
    from rasterio.windows import from_bounds

    min_x, min_y, max_x, max_y = map(float, bounds)
    if min_x >= max_x or min_y >= max_y:
        raise ValueError("aerial composite bounds must have positive area")
    mpp_x = (max_x - min_x) / TEXTURE_CANVAS_PX
    mpp_y = (max_y - min_y) / TEXTURE_CANVAS_PX
    target_poly = box(min_x, min_y, max_x, max_y)
    canvas = Image.new("RGB", (TEXTURE_CANVAS_PX, TEXTURE_CANVAS_PX), (0, 0, 0))
    coverage = np.zeros((TEXTURE_CANVAS_PX, TEXTURE_CANVAS_PX), dtype=bool)
    source_domain = np.zeros((TEXTURE_CANVAS_PX, TEXTURE_CANVAS_PX), dtype=bool)

    intersecting_sources = sorted(
        (item for item in valid_tifs if item["poly"].intersects(target_poly)),
        key=lambda item: item["path"],
    )
    for source in intersecting_sources:
        with rasterio.open(source["path"]) as src:
            ix_min_x = max(min_x, src.bounds.left)
            ix_max_x = min(max_x, src.bounds.right)
            ix_min_y = max(min_y, src.bounds.bottom)
            ix_max_y = min(max_y, src.bounds.top)
            if ix_min_x >= ix_max_x or ix_min_y >= ix_max_y:
                continue

            window = from_bounds(ix_min_x, ix_min_y, ix_max_x, ix_max_y, src.transform)
            # Round page-space edges consistently so adjacent source TIFs and
            # adjacent global pages meet on the same absolute pixel seam.
            px0 = round((ix_min_x - min_x) / mpp_x)
            px1 = round((ix_max_x - min_x) / mpp_x)
            py0 = round((max_y - ix_max_y) / mpp_y)
            py1 = round((max_y - ix_min_y) / mpp_y)
            w_px, h_px = px1 - px0, py1 - py0
            if w_px <= 0 or h_px <= 0:
                continue

            # Mark intended source coverage before reading. A failed/corrupt
            # TIF remains distinguishable from legal exterior state-boundary
            # overdraw and can never be silently edge-padded.
            source_domain[py0:py1, px0:px1] = True

            try:
                data = src.read(
                    window=window,
                    out_shape=(src.count, h_px, w_px),
                    resampling=rasterio.enums.Resampling.lanczos,
                )
                patch = Image.fromarray(
                    np.moveaxis(data, 0, -1).astype("uint8", copy=False), "RGB"
                )
                canvas.paste(patch, (px0, py0))
                coverage[py0:py1, px0:px1] = True
                patch.close()
                del patch, data
            except Exception as exc:
                print(f"   ⚠️ aerial source failed for {source['path']}: {exc}")

    return canvas, coverage, source_domain


def encode_texture_tiers(canvas, bounds, asset_stem, output_dir, texture_tattoos):
    """Encode/publish all tiers as one restart-safe transaction."""
    tier_names = tuple(tier["name"] for tier in TEXTURE_TIERS)
    res_dirs = {tier: os.path.join(output_dir, tier) for tier in tier_names}
    for directory in res_dirs.values():
        os.makedirs(directory, exist_ok=True)
    final_paths = {
        tier: os.path.join(res_dirs[tier], f"{asset_stem}.ktx2")
        for tier in tier_names
    }
    variants = prepare_texture_variants(canvas, bounds, texture_tattoos)

    # Temporary files live beside the destination. All three final names are
    # replaced only after every encode succeeds, so a killed bake can resume
    # without ever advertising a mixed-generation page.
    with tempfile.TemporaryDirectory(prefix=".waffle_ktx2_", dir=output_dir) as tmp_dir:
        input_paths = {tier: os.path.join(tmp_dir, f"{tier}.png") for tier in tier_names}
        encoded_paths = {tier: os.path.join(tmp_dir, f"{tier}.ktx2") for tier in tier_names}
        for tier in tier_names:
            variants[tier].save(input_paths[tier], "PNG")

        for image in variants.values():
            image.close()
        variants.clear()
        canvas = None
        gc.collect()

        for tier in tier_names:
            run_basisu_encode(input_paths[tier], encoded_paths[tier])
        for tier in tier_names:
            os.replace(encoded_paths[tier], final_paths[tier])

    return final_paths


def bake_gosper_textures(
    latQ,
    latR,
    valid_tifs,
    unit_valid,
    output_dir="frontend/app/aerial_tiles",
    texture_tattoos=False,
    texture_recipe_version=None,
):
    if not os.path.exists(output_dir): os.makedirs(output_dir)

    info = gosper_island_info(latQ, latR)
    canvas, coverage, _source_domain = composite_aerial_texture(info["bounds"], valid_tifs)

    geom = coord_util.gosper_tile_geometry()
    validate_geometry_texture_coverage(
        coverage,
        info["bounds"],
        info["centerX"] + geom["offx"],
        info["centerY"] + geom["offy"],
        unit_valid,
        tile_label=f"gosper_{latQ}_{latR}",
    )
    # The 4096² coverage mask is ~16 MiB and is not needed during PNG/KTX2
    # encoding, where the external encoder has its own substantial working set.
    del coverage

    final_paths = encode_texture_tiers(
        canvas,
        info["bounds"],
        gosper_asset_name(latQ, latR, "ktx2").removesuffix(".ktx2"),
        output_dir,
        texture_tattoos,
    )

    recipe_version = texture_recipe_version or texture_cache_version(texture_tattoos)
    write_texture_recipe_marker(texture_recipe_marker_path(latQ, latR, output_dir), recipe_version)
    for path in final_paths.values():
        upload_to_s3(path)


def texture_page_asset_paths(page, output_dir=TEXTURE_PAGE_OUTPUT_DIR):
    return {
        tier["name"]: os.path.join(
            output_dir, tier["name"], f"{page.asset_stem}.ktx2"
        )
        for tier in TEXTURE_TIERS
    }


def texture_page_is_current(page, recipe_version, output_dir=TEXTURE_PAGE_OUTPUT_DIR):
    """True only after the page's complete three-tier transaction committed."""
    paths = texture_page_asset_paths(page, output_dir)
    marker = read_texture_recipe_marker(texture_page_recipe_marker_path(page, output_dir))
    return (
        marker == recipe_version
        and all(os.path.exists(path) for path in paths.values())
        and os.path.exists(texture_page_padding_stats_path(page, output_dir))
    )


def invalidate_texture_page_transaction(page, output_dir=TEXTURE_PAGE_OUTPUT_DIR):
    """Invalidate a page before any same-URL tier is replaced.

    Final tier renames are necessarily sequential. Removing the commit marker
    first guarantees a killed same-recipe publish is rebaked instead of being
    mistaken for a coherent transaction on restart.
    """
    try:
        os.unlink(texture_page_recipe_marker_path(page, output_dir))
    except FileNotFoundError:
        pass


def select_aerial_tifs_for_pages(all_tifs, pages, padding_m=0.0):
    """Keep sources touching pages or their bounded aggregate-padding halo."""
    page_polys = [box(*page.bounds) for page in pages]
    if not page_polys:
        return []
    footprint = unary_union(page_polys)
    if padding_m:
        footprint = footprint.buffer(float(padding_m), cap_style="square", join_style="mitre")
    return [source for source in all_tifs if source["poly"].intersects(footprint)]


def orthophoto_internal_holes(all_tifs):
    """Return corpus-internal holes from the global source topology.

    This is computed from all known orthophoto rectangles, not page-local
    masks, so a hole crossing a page seam cannot masquerade as an exterior
    boundary on either page.
    """
    if not all_tifs:
        return Polygon()
    coverage_union = unary_union([source["poly"] for source in all_tifs])
    holes = []

    def collect(geometry):
        if geometry.geom_type == "Polygon":
            holes.extend(Polygon(ring) for ring in geometry.interiors)
        elif hasattr(geometry, "geoms"):
            for child in geometry.geoms:
                collect(child)

    collect(coverage_union)
    return unary_union(holes) if holes else Polygon()


def rasterize_world_geometry(geometry, page, shape):
    height, width = map(int, shape)
    if geometry is None or geometry.is_empty:
        return np.zeros((height, width), dtype=bool)
    clipped = geometry.intersection(box(*page.bounds))
    if clipped.is_empty:
        return np.zeros((height, width), dtype=bool)
    min_x, min_y, max_x, max_y = page.bounds
    transform = rasterio.transform.from_bounds(min_x, min_y, max_x, max_y, width, height)
    return rasterio.features.rasterize(
        [(clipped, 1)],
        out_shape=(height, width),
        transform=transform,
        fill=0,
        dtype="uint8",
    ).astype(bool)


def validate_texture_page_geometry_coverage(
    coverage, page, tile_sources, allow_aggregate_boundary_missing=False
):
    """Reject missing aerial pixels under every renderable cap on one page.

    This is a migration adapter only: page compositing itself is geometry
    blind. Every valid aggregate/unit cap center and its six rendered vertices
    are assigned by absolute coordinate to exactly one half-open global page
    and checked against that page's successful-source coverage mask.
    """
    coverage = np.asarray(coverage, dtype=bool)
    if coverage.ndim != 2 or coverage.size == 0:
        raise ValueError("texture page coverage mask must be a non-empty 2D array")
    min_x, min_y, max_x, max_y = page.bounds
    height, width = coverage.shape
    geom = coord_util.gosper_tile_geometry()
    angles = np.arange(6, dtype=np.float64) * (math.pi / 3.0)
    checked = 0
    missing = 0
    unit_missing = 0
    missing_preview = []

    for source in tile_sources:
        unit_valid = np.asarray(source["unit_valid"], dtype=bool)
        if unit_valid.size != 7 ** coord_util.GOSPER_TILE_LEVEL:
            raise ValueError("Gosper unit validity mask has the wrong length")

        for depth in range(coord_util.GOSPER_TILE_LEVEL + 1):
            cap_level = coord_util.GOSPER_TILE_LEVEL - depth
            stride = 7 ** cap_level
            node_indices = np.arange(0, unit_valid.size, stride)
            # A parent cap is renderable exactly when any descendant unit is
            # valid. Heap ordering keeps each subtree contiguous.
            node_valid = unit_valid.reshape(-1, stride).any(axis=1)
            overscan = 1.0 if cap_level == 0 else coord_util.GOSPER_CAP_RENDER_OVERSCAN
            radius = coord_util.gosper_level_size(cap_level) / math.sqrt(3.0) * overscan
            rotation = cap_level * coord_util.GOSPER_ROT_PER_LEVEL
            angles = rotation + np.arange(6, dtype=np.float64) * (math.pi / 3.0)
            node_x = float(source["x"]) + geom["offx"][node_indices]
            node_y = float(source["y"]) + geom["offy"][node_indices]
            near = node_valid & (
                (node_x + radius >= min_x) & (node_x - radius < max_x) &
                (node_y + radius >= min_y) & (node_y - radius < max_y)
            )
            if not np.any(near):
                continue

            sample_dx = np.concatenate(([0.0], np.cos(angles) * radius))
            sample_dy = np.concatenate(([0.0], np.sin(angles) * radius))
            sample_x = node_x[near, None] + sample_dx[None, :]
            sample_y = node_y[near, None] + sample_dy[None, :]
            inside = (
                (sample_x >= min_x) & (sample_x < max_x) &
                (sample_y >= min_y) & (sample_y < max_y)
            )
            if not np.any(inside):
                continue
            cols = np.floor((sample_x - min_x) * width / (max_x - min_x)).astype(np.int64)
            rows = np.floor((max_y - sample_y) * height / (max_y - min_y)).astype(np.int64)
            cols = np.clip(cols, 0, width - 1)
            rows = np.clip(rows, 0, height - 1)
            covered = coverage[rows, cols]
            checked += int(np.count_nonzero(inside))
            missing_mask = inside & ~covered
            missing_count = int(np.count_nonzero(missing_mask))
            missing += missing_count
            if cap_level == 0:
                unit_missing += missing_count
            if np.any(missing_mask) and len(missing_preview) < 8:
                for node_i, sample_i in np.argwhere(missing_mask):
                    missing_preview.append(
                        f"{source.get('label', 'tile')}/L{cap_level}@"
                        f"{sample_x[node_i, sample_i]:.3f},{sample_y[node_i, sample_i]:.3f}"
                    )
                    if len(missing_preview) >= 8:
                        break

    if unit_missing:
        raise RuntimeError(
            f"{page.asset_stem}: aerial composite leaves {unit_missing}/{checked} "
            f"valid unit-cap samples unpainted ({'; '.join(missing_preview)})"
        )
    if missing and not allow_aggregate_boundary_missing:
        raise RuntimeError(
            f"{page.asset_stem}: aerial composite leaves {missing}/{checked} "
            f"valid terrain cap samples unpainted ({'; '.join(missing_preview)})"
        )
    return checked


def geometry_padding_masks(page, tile_sources, shape):
    """Rasterize L0 hard coverage and L1+ padding extension limits.

    Unit caps are deliberately excluded: missing L0 imagery is always a hard
    bake failure. Each aggregate pixel may be padded no farther than the
    radius of a renderable aggregate cap that actually covers it.
    """
    from PIL import Image, ImageDraw

    height, width = map(int, shape)
    min_x, min_y, max_x, max_y = page.bounds
    px_per_m_x = width / (max_x - min_x)
    px_per_m_y = height / (max_y - min_y)
    geom = coord_util.gosper_tile_geometry()
    unit_required = np.zeros((height, width), dtype=bool)
    allowed = np.zeros((height, width), dtype=np.float32)

    def to_pixel(x, y):
        return ((x - min_x) * px_per_m_x, (max_y - y) * px_per_m_y)

    for cap_level in range(coord_util.GOSPER_TILE_LEVEL + 1):
        overscan = 1.0 if cap_level == 0 else coord_util.GOSPER_CAP_RENDER_OVERSCAN
        radius = (
            coord_util.gosper_level_size(cap_level)
            / math.sqrt(3.0)
            * overscan
        )
        rotation = cap_level * coord_util.GOSPER_ROT_PER_LEVEL
        angles = rotation + np.arange(6, dtype=np.float64) * (math.pi / 3.0)
        mask_image = Image.new("1", (width, height), 0)
        draw = ImageDraw.Draw(mask_image)
        stride = 7 ** cap_level
        node_indices = np.arange(0, 7 ** coord_util.GOSPER_TILE_LEVEL, stride)

        for source in tile_sources:
            unit_valid = np.asarray(source["unit_valid"], dtype=bool)
            node_valid = unit_valid.reshape(-1, stride).any(axis=1)
            node_x = float(source["x"]) + geom["offx"][node_indices]
            node_y = float(source["y"]) + geom["offy"][node_indices]
            near = node_valid & (
                (node_x + radius >= min_x) & (node_x - radius < max_x) &
                (node_y + radius >= min_y) & (node_y - radius < max_y)
            )
            for center_x, center_y in zip(node_x[near], node_y[near]):
                polygon = [
                    to_pixel(
                        center_x + math.cos(angle) * radius,
                        center_y + math.sin(angle) * radius,
                    )
                    for angle in angles
                ]
                draw.polygon(polygon, fill=1)

        mask = np.asarray(mask_image, dtype=bool)
        if cap_level == 0:
            unit_required |= mask
        else:
            allowed[mask] = np.maximum(allowed[mask], np.float32(radius))
        mask_image.close()

    # Parent masks overlap their unit descendants. Clearing them explicitly is
    # the hard guarantee that no L0 interior pixel can ever be edge-padded.
    allowed[unit_required] = 0.0
    return unit_required, allowed


def fill_from_nearest_global_aerial(
    pixels, query_coords, page, aerial_sources, permitted_distance_m
):
    """Fill page-exterior pixels from the nearest authoritative source edge.

    Used only when the nearest source lies across a page seam and therefore is
    absent from the page-local successful-pixel tree. Query batches remain
    small; no global raster or distance-index tensor is allocated.
    """
    if not aerial_sources:
        raise RuntimeError(f"{page.asset_stem}: no global aerial source available for padding")
    min_x, min_y, max_x, max_y = page.bounds
    height, width = pixels.shape[:2]
    world_x = min_x + (query_coords[:, 1] + 0.5) * (max_x - min_x) / width
    world_y = max_y - (query_coords[:, 0] + 0.5) * (max_y - min_y) / height
    best_d2 = np.full(len(query_coords), np.inf, dtype=np.float64)
    best_source = np.full(len(query_coords), -1, dtype=np.int32)
    best_x = np.zeros(len(query_coords), dtype=np.float64)
    best_y = np.zeros(len(query_coords), dtype=np.float64)

    for source_index, source in enumerate(aerial_sources):
        left, bottom, right, top = source["poly"].bounds
        sample_x = np.clip(world_x, left, right)
        sample_y = np.clip(world_y, bottom, top)
        d2 = (world_x - sample_x) ** 2 + (world_y - sample_y) ** 2
        better = d2 < best_d2
        if np.any(better):
            best_d2[better] = d2[better]
            best_source[better] = source_index
            best_x[better] = sample_x[better]
            best_y[better] = sample_y[better]

    distances_m = np.sqrt(best_d2)
    too_far = distances_m > permitted_distance_m + max(
        (max_x - min_x) / width, (max_y - min_y) / height
    ) * math.sqrt(2.0)
    if np.any(too_far):
        raise RuntimeError(
            f"{page.asset_stem}: nearest global source exceeds aggregate cap radius "
            f"by {float(np.max(distances_m[too_far] - permitted_distance_m[too_far])):.2f}m"
        )

    for source_index in np.unique(best_source):
        if source_index < 0:
            raise RuntimeError(f"{page.asset_stem}: failed to resolve nearest global aerial source")
        selected = best_source == source_index
        source = aerial_sources[int(source_index)]
        with rasterio.open(source["path"]) as dataset:
            if dataset.count < 3:
                raise RuntimeError(f"{source['path']}: nearest-edge source is not RGB")
            epsilon_x = max(abs(dataset.transform.a) * 0.5, 1e-6)
            epsilon_y = max(abs(dataset.transform.e) * 0.5, 1e-6)
            xs = np.clip(best_x[selected], dataset.bounds.left + epsilon_x, dataset.bounds.right - epsilon_x)
            ys = np.clip(best_y[selected], dataset.bounds.bottom + epsilon_y, dataset.bounds.top - epsilon_y)
            values = np.asarray(list(dataset.sample(zip(xs, ys), indexes=(1, 2, 3))))
            if values.shape != (int(np.count_nonzero(selected)), 3):
                raise RuntimeError(f"{source['path']}: nearest-edge RGB sampling failed")
            pixels[query_coords[selected, 0], query_coords[selected, 1]] = np.clip(
                values, 0, 255
            ).astype(np.uint8)
    return distances_m


def pad_aggregate_boundary_overdraw(
    canvas,
    coverage,
    source_domain,
    page,
    tile_sources,
    internal_holes=None,
    aerial_sources=None,
):
    """Nearest-edge pad only exterior aggregate-cap overdraw.

    Guardrails:
      * valid unit-cap sample gaps fail before padding;
      * enclosed/internal imagery holes fail;
      * every filled pixel must be within a covering aggregate cap's radius;
      * nearest covered source pixels are queried in bounded row chunks, not a
        page-sized distance-transform/index tensor.
    """
    from scipy import ndimage
    from scipy.spatial import cKDTree
    from PIL import Image

    coverage = np.asarray(coverage, dtype=bool)
    source_domain = np.asarray(source_domain, dtype=bool)
    if source_domain.shape != coverage.shape:
        raise ValueError("source-domain and successful-coverage masks must match")
    validate_texture_page_geometry_coverage(
        coverage, page, tile_sources, allow_aggregate_boundary_missing=True
    )
    unit_required, allowed_distance_m = geometry_padding_masks(page, tile_sources, coverage.shape)
    if not np.any(unit_required) and not np.any(allowed_distance_m > 0.0):
        raise RuntimeError(f"{page.asset_stem}: exact page has an empty rasterized geometry mask")
    missing_unit_pixels = unit_required & ~coverage
    if np.any(missing_unit_pixels):
        raise RuntimeError(
            f"{page.asset_stem}: aerial composite leaves "
            f"{int(np.count_nonzero(missing_unit_pixels))} valid L0 cap pixels unpainted; "
            "boundary padding forbidden"
        )
    missing = (allowed_distance_m > 0.0) & ~coverage
    if not np.any(missing):
        return canvas, coverage, {
            "padded_pixels": 0,
            "padded_area_m2": 0.0,
            "max_distance_m": 0.0,
        }

    failed_source = missing & source_domain
    if np.any(failed_source):
        raise RuntimeError(
            f"{page.asset_stem}: aggregate cap intersects unread internal source coverage "
            f"({int(np.count_nonzero(failed_source))} pixels); boundary padding forbidden"
        )

    # Global topology, not a page-local fill operation, decides whether a
    # source-domain absence is an internal corpus hole.
    internal_hole_mask = rasterize_world_geometry(internal_holes, page, coverage.shape)
    internal_missing = missing & internal_hole_mask
    if np.any(internal_missing):
        raise RuntimeError(
            f"{page.asset_stem}: aggregate cap intersects an internal orthophoto gap "
            f"({int(np.count_nonzero(internal_missing))} pixels); boundary padding forbidden"
        )
    del internal_hole_mask, internal_missing, failed_source

    covered_boundary = coverage & ~ndimage.binary_erosion(coverage)
    boundary_coords = np.argwhere(covered_boundary)
    tree = cKDTree(boundary_coords) if boundary_coords.size else None
    pixels = np.array(canvas, dtype=np.uint8, copy=True)
    min_x, min_y, max_x, max_y = page.bounds
    metres_per_pixel = max((max_x - min_x) / coverage.shape[1], (max_y - min_y) / coverage.shape[0])
    padded_pixels = 0
    max_distance_m = 0.0

    # Row chunks cap query/output memory even when a coarse cap crosses a long
    # ragged state boundary.
    for row0 in range(0, coverage.shape[0], 128):
        row1 = min(row0 + 128, coverage.shape[0])
        local_coords = np.argwhere(missing[row0:row1])
        if local_coords.size == 0:
            continue
        query_coords = local_coords.astype(np.int64, copy=False)
        query_coords[:, 0] += row0
        permitted = allowed_distance_m[query_coords[:, 0], query_coords[:, 1]]
        if tree is None:
            distances_m = fill_from_nearest_global_aerial(
                pixels, query_coords, page, aerial_sources or [], permitted
            )
        else:
            distances_px, nearest_indices = tree.query(query_coords, k=1, workers=1)
            distances_m = distances_px * metres_per_pixel
            too_far = distances_m > permitted + metres_per_pixel * math.sqrt(2.0)
            if np.any(too_far):
                # A closer source may sit just across this page's boundary.
                distances_m[too_far] = fill_from_nearest_global_aerial(
                    pixels, query_coords[too_far], page, aerial_sources or [], permitted[too_far]
                )
            local = ~too_far
            if np.any(local):
                source_coords = boundary_coords[
                    np.asarray(nearest_indices[local], dtype=np.int64)
                ]
                pixels[query_coords[local, 0], query_coords[local, 1]] = pixels[
                    source_coords[:, 0], source_coords[:, 1]
                ]
        coverage[query_coords[:, 0], query_coords[:, 1]] = True
        padded_pixels += len(query_coords)
        max_distance_m = max(max_distance_m, float(np.max(distances_m)))

    canvas.close()
    padded_canvas = Image.fromarray(pixels, "RGB")
    pixel_area_m2 = (
        (max_x - min_x) / coverage.shape[1]
        * (max_y - min_y) / coverage.shape[0]
    )
    return padded_canvas, coverage, {
        "padded_pixels": padded_pixels,
        "padded_area_m2": round(padded_pixels * pixel_area_m2, 3),
        "max_distance_m": round(max_distance_m, 3),
    }


def bake_texture_page(
    page,
    valid_tifs,
    tile_sources,
    output_dir=TEXTURE_PAGE_OUTPUT_DIR,
    texture_tattoos=False,
    texture_recipe_version=None,
    internal_holes=None,
):
    """Bake one shared absolute imagery page and atomically publish its tiers."""
    os.makedirs(output_dir, exist_ok=True)
    invalidate_texture_page_transaction(page, output_dir)
    canvas, coverage, source_domain = composite_aerial_texture(page.bounds, valid_tifs)
    canvas, coverage, padding_stats = pad_aggregate_boundary_overdraw(
        canvas,
        coverage,
        source_domain,
        page,
        tile_sources,
        internal_holes,
        valid_tifs,
    )
    checked = validate_texture_page_geometry_coverage(coverage, page, tile_sources)
    if checked == 0 and not np.any(coverage):
        raise RuntimeError(f"{page.asset_stem}: page has neither geometry samples nor aerial imagery")
    del coverage

    final_paths = encode_texture_tiers(
        canvas, page.bounds, page.asset_stem, output_dir, texture_tattoos
    )
    recipe_version = texture_recipe_version or texture_page_cache_version(texture_tattoos)
    write_texture_page_padding_stats(
        texture_page_padding_stats_path(page, output_dir), padding_stats
    )
    write_texture_recipe_marker(
        texture_page_recipe_marker_path(page, output_dir), recipe_version
    )
    for path in final_paths.values():
        upload_to_s3(path)
    return final_paths, padding_stats


def map_gosper_sources_to_texture_pages(
    pages, tiles, tile_sources, half_extent_x_m, half_extent_y_m
):
    """Return exact page-key -> non-empty render-source lists."""
    expected_keys = {page.key for page in pages}
    mapped = {key: [] for key in expected_keys}
    for tile in tiles:
        source = tile_sources[(tile["yq"], tile["yr"])]
        for page in pages_for_bounds(
            tile_coverage_bounds(tile, half_extent_x_m, half_extent_y_m)
        ):
            if page.key not in expected_keys or not page_intersects_render_caps(
                page, tile, source["unit_valid"]
            ):
                continue
            mapped[page.key].append(source)
    if set(mapped) != expected_keys:
        raise RuntimeError("texture page/source mapping key set drifted from exact inventory")
    empty = [key for key, sources in mapped.items() if not sources]
    if empty:
        raise RuntimeError(f"exact texture pages lack render sources: {empty[:8]}")
    return mapped


def bake_global_texture_pages(
    force=False,
    texture_tattoos=False,
    output_dir=TEXTURE_PAGE_OUTPUT_DIR,
):
    """Incrementally bake the global page union for every current GSP binary."""
    tiles = generate_manifest.scan_binary_tiles()
    geom = coord_util.gosper_tile_geometry()
    render_half_x_m = float(geom["render_half_x_m"])
    render_half_y_m = float(geom["render_half_y_m"])
    recipe_version = texture_page_cache_version(texture_tattoos)

    # Read validity once per binary. Page demand remains shared/absolute; this
    # adapter is used solely to reject black source gaps under renderable caps.
    tile_sources = {}
    for tile in tiles:
        binary_path = os.path.join(
            generate_manifest.BINARY_DIR,
            gosper_asset_name(tile["yq"], tile["yr"], "bin"),
        )
        tile_sources[(tile["yq"], tile["yr"])] = {
            "label": f"gosper_{tile['yq']}_{tile['yr']}",
            "x": tile["x"],
            "y": tile["y"],
            "unit_valid": read_gsp_unit_valid(binary_path),
        }

    unit_valid_by_tile = {
        key: source["unit_valid"] for key, source in tile_sources.items()
    }
    pages = exact_pages_for_tiles(
        tiles, render_half_x_m, render_half_y_m, unit_valid_by_tile
    )
    print(
        f"🗺️  Global texture grid: {len(pages)} exact pages, 1024m, EPSG:31254 origin (0,0)"
    )
    if not pages:
        return {
            "pages": [], "baked": 0, "skipped": 0, "source_count": 0,
            "padding": {"page_count": 0, "padded_pixels": 0, "padded_area_m2": 0.0, "max_distance_m": 0.0},
        }

    sources_by_page = map_gosper_sources_to_texture_pages(
        pages,
        tiles,
        tile_sources,
        render_half_x_m,
        render_half_y_m,
    )

    tif_list = sorted(glob.glob(os.path.join(AERIAL_DIR, "*.tif")))
    all_tifs = sorted(load_tif_bounds(tif_list), key=lambda source: source["path"])
    max_aggregate_radius = (
        coord_util.gosper_level_size(coord_util.GOSPER_TILE_LEVEL)
        / math.sqrt(3.0)
        * coord_util.GOSPER_CAP_RENDER_OVERSCAN
    )
    valid_tifs = sorted(
        select_aerial_tifs_for_pages(
            all_tifs, pages, padding_m=max_aggregate_radius
        ),
        key=lambda source: source["path"],
    )
    internal_holes = orthophoto_internal_holes(all_tifs)
    print(f"   Aerial sources: {len(valid_tifs)} intersecting ({len(tif_list)} indexed)")

    baked = 0
    skipped = 0
    started = time.time()
    for index, page in enumerate(pages, start=1):
        if not force and texture_page_is_current(page, recipe_version, output_dir):
            skipped += 1
            continue
        print(f"   [{index}/{len(pages)}] Baking {page.asset_stem}...")
        _paths, padding_stats = bake_texture_page(
            page,
            valid_tifs,
            sources_by_page[page.key],
            output_dir=output_dir,
            texture_tattoos=texture_tattoos,
            texture_recipe_version=recipe_version,
            internal_holes=internal_holes,
        )
        if padding_stats["padded_pixels"]:
            print(
                f"      boundary pad: {padding_stats['padded_pixels']} px / "
                f"{padding_stats['padded_area_m2']:.1f} m² / "
                f"max {padding_stats['max_distance_m']:.2f} m"
            )
        baked += 1
        gc.collect()

    # A marker is the transaction commit record; never generate/upload a new
    # manifest unless the complete expected page set is present and current.
    incomplete = []
    for page in pages:
        if not texture_page_is_current(page, recipe_version, output_dir):
            incomplete.append(page.key)
    if incomplete:
        raise RuntimeError(
            f"global texture page bake incomplete ({len(incomplete)} pages; first: {incomplete[:5]})"
        )

    padding_by_page = {
        page.key: read_texture_page_padding_stats(
            texture_page_padding_stats_path(page, output_dir)
        )
        for page in pages
    }
    padded_pages = {
        key: stats for key, stats in padding_by_page.items() if stats["padded_pixels"] > 0
    }
    padding_summary = {
        "page_count": len(padded_pages),
        "padded_pixels": sum(stats["padded_pixels"] for stats in padded_pages.values()),
        "padded_area_m2": round(
            sum(stats["padded_area_m2"] for stats in padded_pages.values()), 3
        ),
        "max_distance_m": round(
            max((stats["max_distance_m"] for stats in padded_pages.values()), default=0.0), 3
        ),
    }

    elapsed = time.time() - started
    print(
        f"✅ Global pages complete: {baked} baked, {skipped} cached, "
        f"{len(pages)} total in {elapsed:.1f}s"
    )
    if padding_summary["page_count"]:
        print(
            f"   Boundary padding: {padding_summary['page_count']} pages, "
            f"{padding_summary['padded_pixels']} px / "
            f"{padding_summary['padded_area_m2']:.1f} m², "
            f"max {padding_summary['max_distance_m']:.2f} m"
        )
    return {
        "pages": pages,
        "baked": baked,
        "skipped": skipped,
        "source_count": len(valid_tifs),
        "padding": padding_summary,
    }


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

        # Empty descendants carry the island-wide mean as their convenient
        # representative height. That placeholder must never participate in
        # a partially populated parent's terrain extrema: near DEM boundaries
        # it can inflate local relief by hundreds of metres.
        child_has_data = child_count > 0
        h_min = np.where(
            child_has_data,
            child["h_min"].reshape(-1, 7),
            np.inf,
        ).min(axis=1)
        h_max = np.where(
            child_has_data,
            child["h_max"].reshape(-1, 7),
            -np.inf,
        ).max(axis=1)
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


def _pack_gsp3_blob(info, nodes, unit_deltas, unit_slopes, unit_nx, unit_nz, unit_valid):
    root_h = _float32(nodes[0]["h_true"][0])
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

    # Terrain extents remain terrain-only because the renderer uses their sum
    # as aggregate skirt relief. Include source extrema and reconstructed unit
    # centers, but never signed skirt endpoints.
    reconstructed_unit_heights = recon[GSP1_TILE_LEVEL]
    terrain_bounds = {}
    terrain_packed = {}
    for depth in range(1, GSP1_TILE_LEVEL):
        count = 7 ** depth
        descendants_per_node = 7 ** (GSP1_TILE_LEVEL - depth)
        descendant_valid = unit_valid.reshape(count, descendants_per_node)
        descendant_heights = reconstructed_unit_heights.reshape(count, descendants_per_node)
        reconstructed_min = np.where(descendant_valid, descendant_heights, np.inf).min(axis=1)
        reconstructed_max = np.where(descendant_valid, descendant_heights, -np.inf).max(axis=1)
        has_data = nodes[depth]["flags"].astype(bool)
        reconstructed_min[~has_data] = nodes[depth]["h_true"][~has_data]
        reconstructed_max[~has_data] = nodes[depth]["h_true"][~has_data]
        terrain_min = np.minimum(nodes[depth]["h_min"], reconstructed_min)
        terrain_max = np.maximum(nodes[depth]["h_max"], reconstructed_max)
        terrain_bounds[depth] = (terrain_min, terrain_max)
        terrain_packed[depth] = (
            _pack_u16_extent_dm(np.where(has_data, recon[depth] - terrain_min, 0.0)),
            _pack_u16_extent_dm(np.where(has_data, terrain_max - recon[depth], 0.0)),
        )

    # Render extents are a distinct culling contract. Start at exact signed
    # unit-skirt endpoints, then fold upward recursively so a rejected parent
    # encloses every possible descendant LOD plus its own aggregate skirt.
    reconstructed_edge_endpoints = (
        reconstructed_unit_heights[:, np.newaxis]
        - unit_deltas.astype(np.float64) * 0.1
    )
    unit_render_min = np.minimum(
        reconstructed_unit_heights,
        reconstructed_edge_endpoints.min(axis=1) - SHADER_SKIRT_EXTENSION_M,
    )
    unit_render_max = np.maximum(
        reconstructed_unit_heights,
        reconstructed_edge_endpoints.max(axis=1),
    )
    render_bounds = {GSP1_TILE_LEVEL: (unit_render_min, unit_render_max)}
    for depth in range(GSP1_TILE_LEVEL - 1, 0, -1):
        child_min, child_max = render_bounds[depth + 1]
        child_valid = unit_valid if depth + 1 == GSP1_TILE_LEVEL else nodes[depth + 1]["flags"].astype(bool)
        child_valid = child_valid.reshape(-1, 7)
        descendant_min = np.where(child_valid, child_min.reshape(-1, 7), np.inf).min(axis=1)
        descendant_max = np.where(child_valid, child_max.reshape(-1, 7), -np.inf).max(axis=1)
        has_data = nodes[depth]["flags"].astype(bool)
        terrain_down, terrain_up = terrain_packed[depth]
        encoded_relief_m = (terrain_down.astype(np.float64) + terrain_up.astype(np.float64)) * 0.1
        own_skirt_min = (
            recon[depth]
            - encoded_relief_m
            - AGGREGATE_SKIRT_BASE_EXTENSION_M
            - SHADER_SKIRT_EXTENSION_M
        )
        render_min = np.minimum(descendant_min, own_skirt_min)
        render_max = np.maximum(descendant_max, recon[depth])
        render_min[~has_data] = recon[depth][~has_data]
        render_max[~has_data] = recon[depth][~has_data]
        render_bounds[depth] = (render_min, render_max)

    reconstructed_units = recon[GSP1_TILE_LEVEL][unit_valid]
    root_bound_min = min(float(nodes[0]["h_min"][0]), float(reconstructed_units.min()))
    root_bound_max = max(float(nodes[0]["h_max"][0]), float(reconstructed_units.max()))
    h_min = _float32_outward(root_bound_min, -1)
    h_max = _float32_outward(root_bound_max, 1)

    blob = bytearray(GSP_HEADER_STRUCT.pack(
        GSP3_MAGIC,
        GSP3_VERSION,
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
        records = np.empty(count, dtype=GSP3_AGG_DTYPE)
        records["dH"] = dH_by_depth[depth]
        records["slopeMean"] = _pack_u8_round(node["slope_mean"])
        records["slopeMax"] = node["slope_max"]
        records["nx"] = node["nx"]
        records["nz"] = node["nz"]
        valid = node["flags"].astype(bool)
        records["downExtent"], records["upExtent"] = terrain_packed[depth]
        render_min, render_max = render_bounds[depth]
        records["renderDown"] = _pack_u16_extent_dm(
            np.where(valid, recon[depth] - render_min, 0.0)
        )
        records["renderUp"] = _pack_u16_extent_dm(
            np.where(valid, render_max - recon[depth], 0.0)
        )
        records["flags"] = node["flags"]
        records["reserved"] = 0
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


def read_gsp_unit_valid(path):
    """Read final-depth validity flags from GSP1, GSP2, or current GSP3."""
    with open(path, "rb") as source:
        blob = source.read()
    if len(blob) < GSP_HEADER_STRUCT.size:
        raise ValueError(f"short GSP file: {path}")
    header = GSP_HEADER_STRUCT.unpack_from(blob)
    format_key = (header[0], header[1])
    if format_key == (GSP1_MAGIC, GSP1_VERSION):
        aggregate_dtype = GSP1_AGG_DTYPE
    elif format_key == (GSP2_MAGIC, GSP2_VERSION):
        aggregate_dtype = GSP2_AGG_DTYPE
    elif format_key == (GSP3_MAGIC, GSP3_VERSION):
        aggregate_dtype = GSP3_AGG_DTYPE
    else:
        raise ValueError(f"unsupported GSP header: {path}")
    if header[2] != GSP1_TILE_LEVEL:
        raise ValueError(f"unsupported GSP tile level {header[2]}: {path}")

    offset = GSP_HEADER_STRUCT.size
    for depth in range(1, GSP1_TILE_LEVEL):
        if offset + 4 > len(blob):
            raise ValueError(f"truncated GSP depth {depth}: {path}")
        count = struct.unpack_from("<I", blob, offset)[0]
        expected = 7 ** depth
        if count != expected:
            raise ValueError(f"GSP depth {depth} count {count}, expected {expected}: {path}")
        offset += 4 + count * aggregate_dtype.itemsize

    if offset + 4 > len(blob):
        raise ValueError(f"truncated GSP unit count: {path}")
    count = struct.unpack_from("<I", blob, offset)[0]
    expected = 7 ** GSP1_TILE_LEVEL
    if count != expected:
        raise ValueError(f"GSP unit count {count}, expected {expected}: {path}")
    offset += 4
    byte_count = count * GSP1_UNIT_DTYPE.itemsize
    if offset + byte_count != len(blob):
        raise ValueError(f"GSP unit payload length mismatch: {path}")
    records = np.frombuffer(blob, dtype=GSP1_UNIT_DTYPE, count=count, offset=offset)
    return (records["flags"] & 1).astype(bool, copy=True)


# Compatibility entry point for scripts written before the rolling GSP formats. It accepts every
# version because the final unit record layout did not change.
read_gsp1_unit_valid = read_gsp_unit_valid


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
    blob = _pack_gsp3_blob(info, nodes, unit_deltas, unit_slopes, unit_nx, unit_nz, unit_valid)

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
    parser = argparse.ArgumentParser(description="🧇 Waffle Iron v6.0 — Gosper Island Incremental Bake")
    parser.add_argument("--full", action="store_true", help="Run full global bake (defaults to Mini-Bake)")
    parser.add_argument("--center", type=str, help="Center island lattice coords as 'yq,yr' (e.g. 0,0)")
    parser.add_argument("--grid", type=int, default=DEFAULT_GRID_SIZE,
                        help=f"Region side in sector units, N*819.2 meters (1-16, default {DEFAULT_GRID_SIZE})")
    parser.add_argument("--force", action="store_true", help="Force re-bake of all islands in range")
    parser.add_argument(
        "--texture-pages-only",
        action="store_true",
        help="Bake/resume only the global 1024m imagery pages from existing GSP binaries",
    )
    parser.add_argument(
        "--no-texture-tattoos",
        action="store_true",
        help="Disable the mini-bake's default green-low/blue-medium/pink-high registration marks",
    )
    args = parser.parse_args()

    # Validate grid size
    grid_size = max(1, min(16, args.grid))
    texture_tattoos = texture_tattoos_enabled(args.full, args.no_texture_tattoos)
    effective_texture_version = texture_cache_version(texture_tattoos)
    effective_texture_page_version = texture_page_cache_version(texture_tattoos)

    # Load existing metadata for skip logic
    metadata = {}
    if os.path.exists(METADATA_PATH):
        try:
            with open(METADATA_PATH, "r") as f:
                metadata = json.load(f)
        except: pass
    
    prev_baker_version = metadata.get("baker_version", "")
    prev_texture_version = metadata.get("texture_version", "")
    prev_texture_page_version = metadata.get("texture_page_version", "")
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
        if prev_texture_page_version == effective_texture_page_version:
            print(f"🔄 Global page recipe {effective_texture_page_version} matches; checking per-page transactions.")
        else:
            print(
                f"✨ Global page recipe changed ({prev_texture_page_version} -> "
                f"{effective_texture_page_version}); every stale page will rebake."
            )

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

    if args.texture_pages_only:
        mode = "production" if args.full else "mini-bake diagnostics"
        print(f"🗺️  RUNNING GLOBAL TEXTURE PAGES ONLY ({mode})")
        S3_ENABLED = bool(args.full)
    elif args.full:
        print("🚀 RUNNING FULL GLOBAL BAKE (S3 Enabled)")
        print("⚠️  This will process ~3,486 TIFs and may take several hours.")
        print("🎨 Texture tattoos: OFF (production bake)")
        S3_ENABLED = True
    else:
        print(f"🧪 RUNNING MINI-BAKE ({grid_size}×{grid_size} grid, S3 Disabled)")
        if texture_tattoos:
            print("🎨 Texture tattoos: ON (green low / blue medium / pink high)")
        else:
            print("🎨 Texture tattoos: OFF (--no-texture-tattoos)")
        S3_ENABLED = False

    # --- CLEANUP (Non-destructive) ---
    dirs_to_ensure = ["frontend/app/tiles_bin", "frontend/app/aerial_tiles", TEXTURE_PAGE_OUTPUT_DIR]
    dirs_to_ensure.extend(f"frontend/app/aerial_tiles/{tier['name']}" for tier in TEXTURE_TIERS)
    dirs_to_ensure.extend(os.path.join(TEXTURE_PAGE_OUTPUT_DIR, tier["name"]) for tier in TEXTURE_TIERS)
    for d in dirs_to_ensure:
        os.makedirs(d, exist_ok=True)

    if args.texture_pages_only:
        page_results = bake_global_texture_pages(
            force=args.force,
            texture_tattoos=texture_tattoos,
        )
        metadata.update({
            "texture_page_version": effective_texture_page_version,
            "texture_page_tattoos": texture_tattoos,
            "texture_page_tiers": {tier["name"]: tier["size_px"] for tier in TEXTURE_TIERS},
            "texture_page_size_m": PAGE_SIZE_M,
            "texture_pages_baked": len(page_results["pages"]),
            "texture_page_boundary_padding": page_results["padding"],
            "last_page_bake": time.ctime(),
        })
        generate_manifest.write_json_atomic(METADATA_PATH, metadata)
        generate_manifest.generate_manifest()
        manifest_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/app/tile_manifest.json"))
        upload_to_s3(manifest_path)
        print("Done.")
        return

    # --- OPEN DEM (not read into memory — windowed reads per sector) ---
    print("Opening DEM...")
    dem = rasterio.open(DEM_PATH)
    dem_poly = box(*dem.bounds)
    print(f"✅ DEM: {dem.width}×{dem.height}, bounds: {dem.bounds}")

    upsample = 2
    # Gradient map: deferred until we know the bake region (mini-bake generates a small one)
    grad_ds = None

    valid_tifs = []

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

    islands = enumerate_gosper_islands_for_bbox(region_bounds)
    print(f"Island candidates intersecting region: {len(islands)}")

    if not args.full:
        # Candidate island squares may extend by nearly a full texture width
        # beyond the requested mini-bake bbox. Filtering aerials against only
        # region + tex_half silently omitted the far strip of those edge
        # squares, which then encoded as valid black KTX2 pixels. Select
        # against the exact union of the squares we are actually about to bake.
        print("Filtering TIFs for candidate island texture coverage (cached bounds)...")
        tif_list = glob.glob(os.path.join(AERIAL_DIR, "*.tif"))
        all_tifs = load_tif_bounds(tif_list)
        valid_tifs = select_aerial_tifs_for_islands(all_tifs, islands)
        print(f"✅ Found {len(valid_tifs)} intersecting TIFs (of {len(tif_list)} total).")

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
        texture_files = {
            tier["name"]: f"frontend/app/aerial_tiles/{tier['name']}/{gosper_asset_name(yq, yr, 'ktx2')}"
            for tier in TEXTURE_TIERS
        }
        tex_recipe_file = texture_recipe_marker_path(yq, yr)
        island_texture_version = read_texture_recipe_marker(tex_recipe_file, unmarked_texture_version)
        skip_bin = can_skip_bin and os.path.exists(bin_file)
        skip_tex = (
            not args.force
            and island_texture_version == effective_texture_version
            and all(os.path.exists(path) for path in texture_files.values())
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
            unit_valid = read_gsp_unit_valid(bin_file)
            bake_gosper_textures(
                yq,
                yr,
                valid_tifs,
                unit_valid,
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

    # Build shared imagery only after every selected geometry binary is safe.
    # Existing island textures remain untouched for rollback during migration.
    page_results = bake_global_texture_pages(
        force=args.force,
        texture_tattoos=texture_tattoos,
    )

    # Update metadata
    generate_manifest.write_json_atomic(
        METADATA_PATH,
        {"baker_version": BAKER_VERSION, "texture_version": effective_texture_version,
                   "texture_tattoos": texture_tattoos,
                   "texture_tiers": {tier["name"]: tier["size_px"] for tier in TEXTURE_TIERS},
                   "unmarked_texture_version": unmarked_texture_version,
                   "texture_page_version": effective_texture_page_version,
                   "texture_page_tattoos": texture_tattoos,
                   "texture_page_tiers": {tier["name"]: tier["size_px"] for tier in TEXTURE_TIERS},
                   "texture_page_size_m": PAGE_SIZE_M,
                   "texture_pages_baked": len(page_results["pages"]),
                   "texture_page_boundary_padding": page_results["padding"],
                   "last_bake": time.ctime(),
                   "grid_size": grid_size, "islands_baked": len(bake_times)},
    )

    generate_manifest.generate_manifest()
    # Upload manifest last
    manifest_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/app/tile_manifest.json"))
    upload_to_s3(manifest_path)
    print("Done.")

if __name__ == "__main__": main()
