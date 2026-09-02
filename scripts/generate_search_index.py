#!/usr/bin/env python3
"""Build the compact browser search index from the tracked source datasets."""

from __future__ import annotations

import argparse
import json
import math
import unicodedata
from pathlib import Path

from pyproj import Transformer


ROOT = Path(__file__).resolve().parents[1]
PEAKS_PATH = ROOT / "frontend/app/assets/tirol_peaks.geojson"
SKI_PATH = ROOT / "frontend/app/assets/skigebiete.json"
MANIFEST_PATH = ROOT / "frontend/app/tile_manifest.json"
OUTPUT_PATH = ROOT / "frontend/app/assets/search_index.json"

UNIT_HEX_WIDTH_METERS = 6.4
GOSPER_TILE_LEVEL = 5
GOSPER_NEIGHBORS = (
    (0, 0),
    (0, 1),
    (1, 0),
    (1, -1),
    (0, -1),
    (-1, 0),
    (-1, 1),
)
NAME_KEYS = (
    "alt_name",
    "alt_name:de",
    "alt_name:it",
    "alt_name:rm",
    "loc_name",
    "old_name",
    "short_name",
    "official_name",
    "name:alt",
    "name:at",
    "name:bar",
    "name:de",
    "name:de_AT",
    "name:en",
    "name:it",
    "name:local",
    "name:rm",
)


def normalize(value: str) -> str:
    value = value.casefold().replace("æ", "ae").replace("œ", "oe")
    value = unicodedata.normalize("NFKD", value)
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    return " ".join("".join(ch if ch.isalnum() else " " for ch in value).split())


def aliases(properties: dict, name: str) -> str:
    terms = [normalize(name)]
    for key in NAME_KEYS:
        for value in str(properties.get(key, "")).split(";"):
            folded = normalize(value)
            if folded and folded not in terms:
                terms.append(folded)
    return "|".join(terms)


def round_axial(q: float, r: float) -> tuple[int, int]:
    x_cube, z_cube, y_cube = q, r, -q - r
    rx, ry, rz = round(x_cube), round(y_cube), round(z_cube)
    x_diff = abs(rx - x_cube)
    y_diff = abs(ry - y_cube)
    z_diff = abs(rz - z_cube)
    if x_diff > y_diff and x_diff > z_diff:
        rx = -ry - rz
    elif y_diff > z_diff:
        ry = -rx - rz
    else:
        rz = -rx - ry
    return int(rx), int(rz)


def gosper_mul_m(q: int, r: int) -> tuple[int, int]:
    return 2 * q - r, q + 3 * r


def gosper_parent(q: int, r: int) -> tuple[int, int]:
    cq, cr = round_axial((3 * q + r) / 7, (-q + 2 * r) / 7)
    for dq, dr in GOSPER_NEIGHBORS:
        yq, yr = cq + dq, cr + dr
        pq, pr = gosper_mul_m(yq, yr)
        if (q - pq, r - pr) in GOSPER_NEIGHBORS:
            return yq, yr
    raise RuntimeError(f"No Gosper parent for ({q}, {r})")


def world_to_tile(x: float, y: float) -> tuple[int, int]:
    q = x / ((math.sqrt(3) / 2) * UNIT_HEX_WIDTH_METERS)
    r = (y - q * 0.5 * UNIT_HEX_WIDTH_METERS) / UNIT_HEX_WIDTH_METERS
    q_int, r_int = round_axial(q, r)
    for _ in range(GOSPER_TILE_LEVEL):
        q_int, r_int = gosper_parent(q_int, r_int)
    return q_int, r_int


# World metres are EPSG:31254. This was previously approximated by scaling a
# baseline between two ski areas' recorded coordinates, which put peaks up to
# 19 km from their true position -- far enough that their baked-coverage flag
# was computed against the wrong tile entirely. The frontend uses the matching
# exact transform in frontend/app/epsg31254.js; both agree with PROJ to well
# under a millimetre.
_TRANSFORMER = Transformer.from_crs("EPSG:4326", "EPSG:31254", always_xy=True)


def lat_lon_to_world(lat: float, lon: float) -> tuple[float, float]:
    return _TRANSFORMER.transform(lon, lat)


def is_available(x: float, y: float, tile_keys: set[tuple[int, int]]) -> int:
    return int(world_to_tile(x, y) in tile_keys)


def build_index() -> dict:
    peaks = json.loads(PEAKS_PATH.read_text())["features"]
    ski_areas = json.loads(SKI_PATH.read_text())["ski_areas"]
    manifest = json.loads(MANIFEST_PATH.read_text())
    tile_keys = {(tile["yq"], tile["yr"]) for tile in manifest["tiles"]}
    items = []

    for feature in peaks:
        props = feature.get("properties", {})
        name = props.get("name")
        if not name:
            continue
        lon, lat = feature["geometry"]["coordinates"][:2]
        x, y = lat_lon_to_world(lat, lon)
        try:
            elevation = int(round(float(props.get("ele", 0))))
        except (TypeError, ValueError):
            elevation = 0
        # [display name, folded name/aliases, elevation, lat, lon, type,
        #  baked coverage, optional exact x, optional exact y]
        items.append(
            [name, aliases(props, name), elevation, round(lat, 6), round(lon, 6), "p", is_available(x, y, tile_keys)]
        )

    for area in ski_areas:
        name = area["name"]
        lat, lon = area["gps"]["lat"], area["gps"]["lon"]
        # Projected from GPS rather than read from the file's recorded
        # epsg_31254 field: only two of those entries were actually derived
        # from their coordinates, and the rest are hand-rounded to 100 m,
        # putting them up to 2.1 km off (see docs note in the commit).
        x, y = lat_lon_to_world(lat, lon)
        items.append(
            [name, normalize(name), 0, round(lat, 6), round(lon, 6), "s", is_available(x, y, tile_keys), x, y]
        )

    items.sort(key=lambda item: (item[5], item[0].casefold()))
    return {
        "version": 1,
        "fields": ["name", "terms", "elevation", "lat", "lon", "type", "available", "x", "y"],
        "items": items,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="fail if the generated file is stale")
    args = parser.parse_args()
    encoded = json.dumps(build_index(), ensure_ascii=False, separators=(",", ":")) + "\n"
    if args.check:
        if not OUTPUT_PATH.exists() or OUTPUT_PATH.read_text() != encoded:
            raise SystemExit(f"stale generated search index: run {Path(__file__).relative_to(ROOT)}")
        print(f"search index is current: {len(encoded.encode()):,} bytes")
        return
    OUTPUT_PATH.write_text(encoded)
    print(f"wrote {OUTPUT_PATH.relative_to(ROOT)}: {len(encoded.encode()):,} bytes")


if __name__ == "__main__":
    main()
