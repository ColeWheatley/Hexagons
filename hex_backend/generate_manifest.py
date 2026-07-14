# @atlas: Gosper manifest generator. Scans rolling GSP1/GSP2/current GSP3 island binaries and emits explicit per-tile versions plus the global texture-page contract.
import json
import os
import re
import struct
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import coordinate_utility as coord_util
from texture_contract import (
    TEXTURE_PAGE_RECIPE_VERSION,
    manifest_texture_page_contract,
)
from gosper_texture_page_adapter import (
    exact_pages_for_tiles,
    page_intersects_render_caps,
    tile_coverage_bounds,
)
from gsp_binary import read_unit_valid
from texture_page_grid import pages_for_bounds


BINARY_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/app/tiles_bin"))
OUTPUT_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/app/tile_manifest.json"))
METADATA_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/app/tiles_bin/metadata.json"))
TEXTURE_PAGE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/app/aerial_pages"))

GSP_HEADER = struct.Struct("<4sHHiiiifffBBBBBxxxI")
GSP1_PATTERN = re.compile(r"gosper_(-?\d+)_(-?\d+)\.bin$")
SUPPORTED_GSP_FORMATS = {(b"GSP1", 1), (b"GSP2", 2), (b"GSP3", 3)}


def _read_header(path):
    with open(path, "rb") as fh:
        data = fh.read(GSP_HEADER.size)
    if len(data) != GSP_HEADER.size:
        raise ValueError("short GSP header")
    return GSP_HEADER.unpack(data)


def _read_bake_metadata():
    try:
        with open(METADATA_FILE, "r", encoding="utf-8") as source:
            return json.load(source)
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        return {}


def _read_page_padding_stats(page):
    path = os.path.join(TEXTURE_PAGE_DIR, ".coverage", f"{page.asset_stem}.json")
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


def write_json_atomic(path, payload):
    """Publish JSON by same-directory temp+fsync+replace."""
    directory = os.path.dirname(os.path.abspath(path))
    os.makedirs(directory, exist_ok=True)
    temporary = os.path.join(directory, f".{os.path.basename(path)}.{os.getpid()}.tmp")
    try:
        with open(temporary, "w", encoding="utf-8") as target:
            json.dump(payload, target, separators=(",", ":"))
            target.flush()
            os.fsync(target.fileno())
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def scan_binary_tiles():
    """Return validated GSP tiles without assigning imagery ownership."""
    tiles = []

    if not os.path.exists(BINARY_DIR):
        return tiles

    for filename in sorted(os.listdir(BINARY_DIR)):
        match = GSP1_PATTERN.match(filename)
        if not match:
            continue
        file_yq, file_yr = int(match.group(1)), int(match.group(2))
        path = os.path.join(BINARY_DIR, filename)

        try:
            (magic, version, tile_level, center_q, center_r, yq, yr,
             h_mean, h_min, h_max, s_mean, s_max, nx, nz, flags, reserved) = _read_header(path)
        except Exception as exc:
            print(f"⚠️  Skipping {filename}: {exc}")
            continue

        expected_center_q, expected_center_r = coord_util.gosper_lattice_to_center(file_yq, file_yr)
        if (
            (magic, version) not in SUPPORTED_GSP_FORMATS or tile_level != coord_util.GOSPER_TILE_LEVEL or
            yq != file_yq or yr != file_yr or
            center_q != expected_center_q or center_r != expected_center_r or
            reserved != 0 or not (flags & 1)
        ):
            print(f"⚠️  Skipping {filename}: header does not match the GSP lattice contract")
            continue

        x, y = coord_util.axial_to_world_meters(expected_center_q, expected_center_r)
        tiles.append({
            "yq": yq,
            "yr": yr,
            "gspVersion": int(version),
            "x": round(x, 2),
            "y": round(y, 2),
            "hMean": round(float(h_mean), 1),
            "hMin": round(float(h_min), 1),
            "hMax": round(float(h_max), 1),
            "sMean": int(s_mean),
            "sMax": int(s_max),
            "nx": int(nx),
            "nz": int(nz),
        })
    return tiles


def generate_manifest():
    print(f"🔍 Manifest Generator looking in: {BINARY_DIR}")

    if not os.path.exists(BINARY_DIR):
        print("❌ Error: Binary directory not found.")
        return

    geom = coord_util.gosper_tile_geometry()
    # Preserve the established scene/world-origin envelope during the texture
    # migration. This is manifest framing only; imagery ownership comes solely
    # from the absolute page grid below.
    manifest_half_m = float(geom["tex_half_m"])
    render_half_x_m = float(geom["render_half_x_m"])
    render_half_y_m = float(geom["render_half_y_m"])
    tiles = scan_binary_tiles()
    unit_valid_by_tile = {
        (tile["yq"], tile["yr"]): read_unit_valid(
            os.path.join(BINARY_DIR, f"gosper_{tile['yq']}_{tile['yr']}.bin")
        )
        for tile in tiles
    }
    texture_pages = exact_pages_for_tiles(
        tiles, render_half_x_m, render_half_y_m, unit_valid_by_tile
    )
    page_padding_stats = {page.key: _read_page_padding_stats(page) for page in texture_pages}
    page_vertical_bounds = {}
    for tile in tiles:
        for page in pages_for_bounds(
            tile_coverage_bounds(tile, render_half_x_m, render_half_y_m)
        ):
            if page not in texture_pages or not page_intersects_render_caps(
                page, tile, unit_valid_by_tile[(tile["yq"], tile["yr"])]
            ):
                continue
            previous = page_vertical_bounds.get(page.key)
            if previous is None:
                page_vertical_bounds[page.key] = [tile["hMin"], tile["hMax"], 1]
            else:
                previous[0] = min(previous[0], tile["hMin"])
                previous[1] = max(previous[1], tile["hMax"])
                previous[2] += 1

    margin = 2000.0
    if tiles:
        min_x = min(t["x"] - manifest_half_m for t in tiles)
        max_x = max(t["x"] + manifest_half_m for t in tiles)
        min_y = min(t["y"] - manifest_half_m for t in tiles)
        max_y = max(t["y"] + manifest_half_m for t in tiles)
    else:
        min_x = max_x = min_y = max_y = 0.0

    bake_metadata = _read_bake_metadata()
    texture_page_recipe = bake_metadata.get("texture_page_version", TEXTURE_PAGE_RECIPE_VERSION)
    manifest = {
        "type": "gosper_l5",
        "tile_level": coord_util.GOSPER_TILE_LEVEL,
        "unit_hex_m": coord_util.UNIT_HEX_WIDTH_METERS,
        "tile_pitch_m": float(geom["tile_pitch_m"]),
        "geometry": {
            # One-way translation shim into geometry-independent consumers.
            # This conservative footprint covers every cap at every GSP LOD;
            # it is not a texture size or asset ownership relationship.
            "tile_source_footprint_half_m": {
                "x": render_half_x_m,
                "y": render_half_y_m,
            },
            "footprint_semantics": "conservative_render_coverage",
        },
        "binary": {
            "default_format": "GSP3",
            "default_version": 3,
            # Asset URLs stay stable across bakes, so the baker recipe is the
            # explicit browser-cache identity.  Per-tile GSP versions are
            # still appended by the frontend during rolling migrations.
            "cache_key": bake_metadata.get("baker_version", "gsp3-v3"),
            "supported_versions": [1, 2, 3],
            "header_bytes": GSP_HEADER.size,
            "aggregate_record_bytes": {"1": 8, "2": 12, "3": 16},
            "unit_record_bytes": 14,
            "extent_quantum_m": 0.1,
        },
        # Geometry-independent absolute imagery pages are the only texture
        # identity. Geometry contributes coverage bounds, never asset ownership.
        "texture_pages": manifest_texture_page_contract(
            texture_pages,
            recipe_version=texture_page_recipe,
            diagnostic_tattoos=bake_metadata.get("texture_page_tattoos", False),
            page_vertical_bounds=page_vertical_bounds,
            page_padding_stats=page_padding_stats,
        ),
        "bounds": {
            "min_x": round(min_x - margin, 2),
            "max_x": round(max_x + margin, 2),
            "min_y": round(min_y - margin, 2),
            "max_y": round(max_y + margin, 2),
        },
        "tiles": tiles,
    }

    write_json_atomic(OUTPUT_FILE, manifest)

    print(f"✅ Generated manifest for {len(tiles)} Gosper islands and {len(texture_pages)} imagery pages.")
    print(f"   Bounds: X[{min_x:.0f}, {max_x:.0f}], Y[{min_y:.0f}, {max_y:.0f}]")
    print(f"   Saved to: {OUTPUT_FILE}")


if __name__ == "__main__":
    generate_manifest()
