"""Build the per-column terrain table + EPSG:31254 centroid export.

CANONICAL COLUMN ORDER (shared by every sidecar, the engine state, and the
frontend contract): tiles in **tile_manifest.json `tiles[]` order** (NOT
sorted), depth-4 heap order within each tile — identical to the GSP3 depth-4
block, so engine output packing is a cast+slice and sidecar bodies are
`concat(tiles[])` with no re-indexing.  Global column id =
tile_slot * 2401 + depth4_heap_index.

Outputs (default snow_backend/data/):
  terrain_columns.npz          per-column terrain + per-tile tables (see meta)
  centroids_l1_epsg31254.npz   avalanche-driver export: per-tile heap-order
                               [2401, 2] float64 EPSG:31254 (x, y); combined
                               xy[n_tiles, 2401, 2] + per-tile keys t{yq}_{yr}
"""

from __future__ import annotations

import json
import os
import subprocess
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gsp3_reader import N_COLUMNS, l1_terrain, read_gsp3  # noqa: E402
from gosper_geometry import REPO_ROOT, l1_centroids_epsg31254, tile_center_world  # noqa: E402

S3_TILE_PREFIX = "s3://wheatley.cloud/hexagons/beta/tiles_bin"
DEFAULT_MANIFEST = os.path.join(REPO_ROOT, "frontend/app/tile_manifest.json")
DEFAULT_DATA_DIR = os.path.join(REPO_ROOT, "snow_backend/data")


def load_tile_list(manifest_path: str = DEFAULT_MANIFEST):
    """Canonical tile registry: manifest tiles[] IN FILE ORDER (frontend
    sidecar contract: 'tiles in tile_manifest.json tiles[] order')."""
    with open(manifest_path) as fh:
        manifest = json.load(fh)
    return list(manifest["tiles"]), manifest


def manifest_hash_u32(manifest_path: str) -> int:
    """PFL1 manifestHash — ruled: CRC32 of the raw manifest FILE BYTES
    (delegates to the shared registry; beta-stubai: 3511903013)."""
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
    from pfl_enums import manifest_hash
    return manifest_hash(manifest_path)


def ensure_tiles_local(tiles, tiles_dir: str) -> list[str]:
    os.makedirs(tiles_dir, exist_ok=True)
    paths, missing = [], []
    for t in tiles:
        p = os.path.join(tiles_dir, f"gosper_{t['yq']}_{t['yr']}.bin")
        paths.append(p)
        if not os.path.exists(p):
            missing.append(os.path.basename(p))
    if missing:
        cmd = ["aws", "s3", "sync", S3_TILE_PREFIX, tiles_dir, "--exclude", "*"]
        for m in missing:
            cmd += ["--include", m]
        subprocess.run(cmd, check=True)
    for p in paths:
        if not os.path.exists(p):
            raise FileNotFoundError(p)
    return paths


def build(tiles_dir: str | None = None, out_dir: str | None = None,
          manifest_path: str = DEFAULT_MANIFEST):
    from pyproj import Transformer
    to_wgs84 = Transformer.from_crs("EPSG:31254", "EPSG:4326", always_xy=True)

    tiles_dir = tiles_dir or os.path.join(DEFAULT_DATA_DIR, "tiles_bin")
    out_dir = out_dir or DEFAULT_DATA_DIR
    tiles, manifest = load_tile_list(manifest_path)
    paths = ensure_tiles_local(tiles, tiles_dir)
    n_tiles = len(tiles)
    n_cols = n_tiles * N_COLUMNS

    tile_yq = np.array([t["yq"] for t in tiles], dtype=np.int32)
    tile_yr = np.array([t["yr"] for t in tiles], dtype=np.int32)
    tile_x = np.empty(n_tiles); tile_y = np.empty(n_tiles)
    tile_node_elev = np.empty(n_tiles)

    col = {
        "elev_m": np.empty(n_cols, np.float32),
        "dz_node_m": np.empty(n_cols, np.float32),
        "slope_mean_deg": np.empty(n_cols, np.uint8),
        "slope_max_deg": np.empty(n_cols, np.uint8),
        "n_east": np.empty(n_cols, np.float32),
        "n_north": np.empty(n_cols, np.float32),
        "n_up": np.empty(n_cols, np.float32),
        "aspect_rad": np.empty(n_cols, np.float32),
        "svf": np.empty(n_cols, np.float32),
        "valid": np.empty(n_cols, bool),
    }
    centroids = np.empty((n_tiles, N_COLUMNS, 2), dtype=np.float64)

    for slot, (t, path) in enumerate(zip(tiles, paths)):
        tile = read_gsp3(path)
        hd = tile.header
        if (hd.lat_q, hd.lat_r) != (t["yq"], t["yr"]):
            raise ValueError(f"{path}: header lattice {(hd.lat_q, hd.lat_r)} != manifest")
        cx, cy = tile_center_world(hd.lat_q, hd.lat_r)
        if abs(cx - t["x"]) > 0.02 or abs(cy - t["y"]) > 0.02:
            raise ValueError(f"{path}: centre {(cx, cy)} != manifest {(t['x'], t['y'])}")
        tile_x[slot], tile_y[slot] = cx, cy

        terr = l1_terrain(tile)
        sl = slice(slot * N_COLUMNS, (slot + 1) * N_COLUMNS)
        valid = terr["valid"]
        node_elev = float(terr["elev_m"][valid].mean()) if valid.any() else float(hd.root_h)
        tile_node_elev[slot] = node_elev
        col["elev_m"][sl] = terr["elev_m"]
        col["dz_node_m"][sl] = terr["elev_m"] - node_elev
        col["slope_mean_deg"][sl] = terr["slope_mean_deg"]
        col["slope_max_deg"][sl] = terr["slope_max_deg"]
        col["n_east"][sl] = terr["n_east"]
        col["n_north"][sl] = terr["n_north"]
        col["n_up"][sl] = terr["n_up"]
        col["aspect_rad"][sl] = terr["aspect_rad"]
        col["svf"][sl] = terr["svf"]
        col["valid"][sl] = valid
        centroids[slot] = l1_centroids_epsg31254(hd.lat_q, hd.lat_r)

    lon, lat = to_wgs84.transform(tile_x, tile_y)

    meta = {
        "format": "snowpack-terrain-pack",
        "version": 2,
        "crs": "EPSG:31254",
        "column_order": "tile_manifest.json tiles[] order (tile_slot), "
                        "depth-4 heap order within tile (GSP3 depth-4 block); "
                        "global column id = tile_slot*2401 + heap_index",
        "n_tiles": n_tiles, "columns_per_tile": N_COLUMNS,
        "manifest_hash_u32": manifest_hash_u32(manifest_path),
        "release_profile": manifest.get("release", {}),
        "aspect_convention": "atan2(n_east, n_north), radians clockwise from "
                             "north; 0 where packed normal is vertical",
    }

    os.makedirs(out_dir, exist_ok=True)
    terr_path = os.path.join(out_dir, "terrain_columns.npz")
    np.savez_compressed(
        terr_path, meta=json.dumps(meta),
        tile_yq=tile_yq, tile_yr=tile_yr, tile_x=tile_x, tile_y=tile_y,
        tile_node_elev_m=tile_node_elev, tile_lat=lat, tile_lon=lon, **col,
    )

    cent_path = os.path.join(out_dir, "centroids_l1_epsg31254.npz")
    per_tile = {f"t{q}_{r}": centroids[i]
                for i, (q, r) in enumerate(zip(tile_yq, tile_yr))}
    np.savez_compressed(
        cent_path, meta=json.dumps(meta), tile_yq=tile_yq, tile_yr=tile_yr,
        xy=centroids, **per_tile,
    )
    # avalanche pipeline's documented interface (config.CENTROID_FILE)
    np.save(os.path.join(out_dir, "l1_centroids.npy"), centroids)
    return terr_path, cent_path
