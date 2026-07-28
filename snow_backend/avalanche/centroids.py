# @atlas: L1 hex centroid table: loads the task-7 file (snow_backend/data/l1_centroids.npy or per-tile variant) when present, else self-generates from tile_manifest.json + hex_backend/coordinate_utility.py (child 0 is concentric, so an L1 center is unit offset 7*i). Either path is pitch- and footprint-validated.
import json
import sys
from pathlib import Path

import numpy as np

from . import config

sys.path.insert(0, str(config.REPO / "hex_backend"))


def load_manifest_tiles():
    """Manifest tile list (order defines the packed-blob tile order)."""
    m = json.loads(config.TILE_MANIFEST.read_text())
    return m["tiles"], m


def _generate_from_manifest():
    """(n_tiles, 2401, 2) from the Gosper tables — reference implementation
    and mock for the task-7 file."""
    import coordinate_utility as cu

    offs = cu.generate_gosper_offsets(cu.GOSPER_TILE_LEVEL)
    rel = np.empty((config.TILE_BYTES, 2), dtype=np.float64)
    for i in range(config.TILE_BYTES):
        q, r = offs[7 * i]  # L1 node center = its concentric child-0 unit
        rel[i] = cu.axial_to_world_meters(q, r)

    tiles, _ = load_manifest_tiles()
    xy = np.empty((len(tiles), config.TILE_BYTES, 2), dtype=np.float64)
    for t, tile in enumerate(tiles):
        xy[t, :, 0] = tile["x"] + rel[:, 0]
        xy[t, :, 1] = tile["y"] + rel[:, 1]
    return xy


def _load_external():
    """Task-7 centroid file(s), or None if absent."""
    if config.CENTROID_FILE.exists():
        return np.load(config.CENTROID_FILE)
    first = Path(config.CENTROID_TILE_PATTERN.format(t=0))
    if first.exists():
        tiles, _ = load_manifest_tiles()
        return np.stack([
            np.load(config.CENTROID_TILE_PATTERN.format(t=t))
            for t in range(len(tiles))
        ])
    return None


def _validate(xy, m):
    tiles = m["tiles"]
    assert xy.shape == (len(tiles), config.TILE_BYTES, 2), f"bad shape {xy.shape}"
    import coordinate_utility as cu

    pitch = cu.gosper_level_size(1)  # ~16.93 m L1 flat-to-flat
    d01 = float(np.hypot(*(xy[0, 1] - xy[0, 0])))
    assert abs(d01 - pitch) < 0.05, f"L1 pitch {d01:.3f} != {pitch:.3f}"
    half = m["geometry"]["tile_source_footprint_half_m"]
    centers = np.array([[t["x"], t["y"]] for t in tiles])[:, None, :]
    assert np.abs(xy - centers).max() <= max(half["x"], half["y"]) + 1e-6, \
        "centroid outside tile footprint"


def build_centroid_table(cache=True):
    """(n_tiles, 2401, 2) float64 EPSG:31254 (x, y) L1 centroids, heap order."""
    cache_path = config.CACHE_DIR / "l1_centroids.npz"
    if cache and cache_path.exists():
        with np.load(cache_path) as z:
            return z["xy"]

    _, m = load_manifest_tiles()
    xy = _load_external()
    if xy is None:
        xy = _generate_from_manifest()
    _validate(xy, m)

    if cache:
        config.CACHE_DIR.mkdir(parents=True, exist_ok=True)
        np.savez_compressed(cache_path, xy=xy)
    return xy


if __name__ == "__main__":
    src = "external" if _load_external() is not None else "manifest-generated"
    xy = build_centroid_table(cache=True)
    print(f"centroids ({src}): {xy.shape}, "
          f"x [{xy[..., 0].min():.1f}, {xy[..., 0].max():.1f}], "
          f"y [{xy[..., 1].min():.1f}, {xy[..., 1].max():.1f}]")
