# @atlas: Gosper manifest generator. Scans rolling GSP1/GSP2/current GSP3 island binaries and emits explicit per-tile versions plus the global texture-page contract.
import json
import os
import re
import struct
import sys
from pathlib import Path

from PIL import Image

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import coordinate_utility as coord_util
from release_profiles import manifest_release_descriptor
from texture_contract import (
    DEFAULT_TEXTURE_ENCODING_PROFILE,
    TEXTURE_BOOTSTRAP_SIZE,
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


def _read_bake_metadata(metadata_file=None):
    metadata_file = metadata_file or METADATA_FILE
    try:
        with open(metadata_file, "r", encoding="utf-8") as source:
            return json.load(source)
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        return {}


def _read_page_padding_stats(page, texture_page_dir=None):
    path = os.path.join(texture_page_dir or TEXTURE_PAGE_DIR, ".coverage", f"{page.asset_stem}.json")
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


def scan_binary_tiles(binary_dir=None, expected_tiles=None, reject_unexpected=False):
    """Return validated GSP tiles, optionally constrained by an explicit inventory."""
    binary_dir = binary_dir or BINARY_DIR
    expected = set(expected_tiles) if expected_tiles is not None else None
    tiles = []

    if not os.path.exists(binary_dir):
        return tiles

    present_keys = set()
    unexpected = []
    for filename in sorted(os.listdir(binary_dir)):
        match = GSP1_PATTERN.match(filename)
        if not match:
            continue
        file_yq, file_yr = int(match.group(1)), int(match.group(2))
        key = (file_yq, file_yr)
        if expected is not None and key not in expected:
            unexpected.append(filename)
            continue
        path = os.path.join(binary_dir, filename)

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
        present_keys.add(key)
    if reject_unexpected and unexpected:
        raise ValueError(f"unexpected GSP files outside run inventory: {unexpected[:8]}")
    if expected is not None:
        missing = sorted(expected - present_keys)
        if missing:
            raise ValueError(f"run inventory GSP outputs are missing or invalid: {missing[:8]}")
    return tiles


def _validate_inventory_texture_assets(texture_page_dir, pages, recipe_version):
    expected_stems = {page.asset_stem for page in pages}
    suffixes = {"bootstrap": ".webp", "low": ".ktx2", "medium": ".ktx2", "high": ".ktx2"}
    for directory, suffix in suffixes.items():
        path = Path(texture_page_dir) / directory
        found = {item.stem for item in path.glob(f"*{suffix}")} if path.exists() else set()
        unexpected = sorted(found - expected_stems)
        missing = sorted(expected_stems - found)
        if unexpected:
            raise ValueError(f"unexpected {directory} assets outside run inventory: {unexpected[:8]}")
        if missing:
            raise ValueError(f"missing {directory} assets required by run inventory: {missing[:8]}")
    for directory, suffix in ((".recipes", ".txt"), (".coverage", ".json")):
        path = Path(texture_page_dir) / directory
        found = {item.stem for item in path.glob(f"*{suffix}")} if path.exists() else set()
        unexpected = sorted(found - expected_stems)
        if unexpected:
            raise ValueError(f"unexpected {directory} metadata outside run inventory: {unexpected[:8]}")
    for page in pages:
        marker = Path(texture_page_dir) / ".recipes" / f"{page.asset_stem}.txt"
        coverage = Path(texture_page_dir) / ".coverage" / f"{page.asset_stem}.json"
        if not marker.is_file() or marker.read_text().strip() != recipe_version:
            raise ValueError(f"{page.asset_stem}: missing or stale texture recipe marker")
        if not coverage.is_file():
            raise ValueError(f"{page.asset_stem}: missing coverage transaction metadata")
        bootstrap = Path(texture_page_dir) / "bootstrap" / f"{page.asset_stem}.webp"
        with Image.open(bootstrap) as image:
            expected_size = TEXTURE_BOOTSTRAP_SIZE
            if image.format != "WEBP" or image.size != (expected_size, expected_size):
                raise ValueError(
                    f"{page.asset_stem}: bootstrap must be exactly "
                    f"{expected_size}x{expected_size} WebP"
                )
        for tier in ("low", "medium", "high"):
            payload = (Path(texture_page_dir) / tier / f"{page.asset_stem}.ktx2").read_bytes()[:12]
            if payload != b"\xabKTX 20\xbb\r\n\x1a\n":
                raise ValueError(f"{page.asset_stem}: invalid {tier} KTX2")


def generate_manifest(
    inventory_path=None, *, binary_dir=None, texture_page_dir=None,
    output_file=None, metadata_file=None,
):
    binary_dir = binary_dir or BINARY_DIR
    texture_page_dir = texture_page_dir or TEXTURE_PAGE_DIR
    output_file = output_file or OUTPUT_FILE
    metadata_file = metadata_file or METADATA_FILE
    inventory = None
    expected_tiles = None
    if inventory_path is not None:
        from bake_inventory import geometry_keys, load_inventory, texture_page_keys
        inventory = load_inventory(inventory_path)
        expected_tiles = geometry_keys(inventory)
        incomplete_geometry = [
            (item["yq"], item["yr"]) for item in inventory["geometry"]
            if item.get("status") != "complete"
        ]
        if incomplete_geometry:
            raise ValueError(f"refusing manifest with incomplete inventory geometry: {incomplete_geometry[:8]}")
    print(f"🔍 Manifest Generator looking in: {binary_dir}")

    if not os.path.exists(binary_dir):
        print("❌ Error: Binary directory not found.")
        return

    geom = coord_util.gosper_tile_geometry()
    # Preserve the established scene/world-origin envelope during the texture
    # migration. This is manifest framing only; imagery ownership comes solely
    # from the absolute page grid below.
    manifest_half_m = float(geom["tex_half_m"])
    render_half_x_m = float(geom["render_half_x_m"])
    render_half_y_m = float(geom["render_half_y_m"])
    tiles = scan_binary_tiles(
        binary_dir, expected_tiles=expected_tiles,
        reject_unexpected=inventory is not None,
    )
    unit_valid_by_tile = {
        (tile["yq"], tile["yr"]): read_unit_valid(
            os.path.join(binary_dir, f"gosper_{tile['yq']}_{tile['yr']}.bin")
        )
        for tile in tiles
    }
    texture_pages = exact_pages_for_tiles(
        tiles, render_half_x_m, render_half_y_m, unit_valid_by_tile
    )
    if inventory is not None:
        expected_pages = texture_page_keys(inventory)
        actual_pages = {(page.page_x, page.page_y) for page in texture_pages}
        if actual_pages != expected_pages:
            raise ValueError(
                "manifest texture pages differ from authoritative run inventory "
                f"(missing={sorted(expected_pages - actual_pages)[:8]}, "
                f"unexpected={sorted(actual_pages - expected_pages)[:8]})"
            )
        recipe = inventory["texture_recipe"]
        if recipe.get("diagnostic_tattoos"):
            raise ValueError("production inventory contains diagnostic mode metadata")
        _validate_inventory_texture_assets(texture_page_dir, texture_pages, recipe["version"])
    page_padding_stats = {
        page.key: _read_page_padding_stats(page, texture_page_dir) for page in texture_pages
    }
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

    bake_metadata = _read_bake_metadata(metadata_file)
    if inventory is not None:
        bake_metadata = {
            "release_profile": inventory["release_profile"],
            "baker_version": inventory.get("geometry_recipe", {}).get("version", "gsp3-v3"),
            "texture_page_version": inventory["texture_recipe"]["version"],
            "texture_encoding_profile": inventory["texture_recipe"]["encoding_profile"],
            "texture_encoding_effort": inventory["texture_recipe"]["encoding_effort"],
            "texture_page_tattoos": inventory["texture_recipe"]["diagnostic_tattoos"],
        }
    release_profile = bake_metadata.get("release_profile")
    if not isinstance(release_profile, str):
        raise ValueError(
            "Bake metadata is missing explicit release_profile; choose beta-stubai "
            "or production-selected-tirol before generating a manifest"
        )
    texture_page_recipe = bake_metadata.get("texture_page_version", TEXTURE_PAGE_RECIPE_VERSION)
    texture_encoding_profile = bake_metadata.get(
        "texture_encoding_profile", DEFAULT_TEXTURE_ENCODING_PROFILE
    )
    texture_encoding_effort = bake_metadata.get("texture_encoding_effort")
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
        "release": manifest_release_descriptor(release_profile),
        "build": ({
            "run_id": inventory["run_id"],
            "git_commit": inventory["git_commit"],
            "execution_profile": inventory["execution_profile"]["name"],
            "source_intersection_bounds": inventory["sources"].get("intersection_bounds"),
        } if inventory is not None else {}),
        # Geometry-independent absolute imagery pages are the only texture
        # identity. Geometry contributes coverage bounds, never asset ownership.
        "texture_pages": manifest_texture_page_contract(
            texture_pages,
            recipe_version=texture_page_recipe,
            encoding_profile=texture_encoding_profile,
            encoding_effort=texture_encoding_effort,
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

    write_json_atomic(output_file, manifest)

    print(f"✅ Generated manifest for {len(tiles)} Gosper islands and {len(texture_pages)} imagery pages.")
    print(f"   Bounds: X[{min_x:.0f}, {max_x:.0f}], Y[{min_y:.0f}, {max_y:.0f}]")
    print(f"   Saved to: {output_file}")
    return manifest


if __name__ == "__main__":
    generate_manifest()
