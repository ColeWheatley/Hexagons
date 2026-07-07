# @atlas: Gosper tile manifest generator. Scans baked GSP1 island binaries, reads their locked 48-byte headers, and emits frontend/app/tile_manifest.json for Gosper L5 streaming.
import json
import os
import re
import struct
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import coordinate_utility as coord_util


BINARY_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/app/tiles_bin"))
OUTPUT_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/app/tile_manifest.json"))

GSP1_HEADER = struct.Struct("<4sHHiiiifffBBBBBxxxI")
GSP1_PATTERN = re.compile(r"gosper_(-?\d+)_(-?\d+)\.bin$")


def _read_header(path):
    with open(path, "rb") as fh:
        data = fh.read(GSP1_HEADER.size)
    if len(data) != GSP1_HEADER.size:
        raise ValueError("short GSP1 header")
    return GSP1_HEADER.unpack(data)


def generate_manifest():
    print(f"🔍 Manifest Generator looking in: {BINARY_DIR}")

    if not os.path.exists(BINARY_DIR):
        print("❌ Error: Binary directory not found.")
        return

    geom = coord_util.gosper_tile_geometry()
    tex_half_m = float(geom["tex_half_m"])
    tiles = []

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
            magic != b"GSP1" or version != 1 or tile_level != coord_util.GOSPER_TILE_LEVEL or
            yq != file_yq or yr != file_yr or
            center_q != expected_center_q or center_r != expected_center_r or
            reserved != 0 or not (flags & 1)
        ):
            print(f"⚠️  Skipping {filename}: header does not match GSP1 lattice contract")
            continue

        x, y = coord_util.axial_to_world_meters(expected_center_q, expected_center_r)
        tiles.append({
            "yq": yq,
            "yr": yr,
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

    margin = 2000.0
    if tiles:
        min_x = min(t["x"] - tex_half_m for t in tiles)
        max_x = max(t["x"] + tex_half_m for t in tiles)
        min_y = min(t["y"] - tex_half_m for t in tiles)
        max_y = max(t["y"] + tex_half_m for t in tiles)
    else:
        min_x = max_x = min_y = max_y = 0.0

    manifest = {
        "type": "gosper_l5",
        "tile_level": coord_util.GOSPER_TILE_LEVEL,
        "unit_hex_m": coord_util.UNIT_HEX_WIDTH_METERS,
        "tile_pitch_m": float(geom["tile_pitch_m"]),
        "tex_world_side_m": tex_half_m * 2.0,
        "bounds": {
            "min_x": round(min_x - margin, 2),
            "max_x": round(max_x + margin, 2),
            "min_y": round(min_y - margin, 2),
            "max_y": round(max_y + margin, 2),
        },
        "tiles": tiles,
    }

    with open(OUTPUT_FILE, "w") as fh:
        json.dump(manifest, fh, separators=(",", ":"))

    print(f"✅ Generated manifest for {len(tiles)} Gosper islands.")
    print(f"   Bounds: X[{min_x:.0f}, {max_x:.0f}], Y[{min_y:.0f}, {max_y:.0f}]")
    print(f"   Saved to: {OUTPUT_FILE}")


if __name__ == "__main__":
    generate_manifest()
