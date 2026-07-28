# @atlas: Adapter for the snowpack terrain pack (terrain_columns.npz / centroids npz): reorders canonical slot order (tiles sorted by (yq,yr)) to the frontend contract's manifest tiles[] order, exposes per-column elev/aspect/valid in (n_tiles, 2401) manifest order for the bulletin prior and NODATA masking.
import json

import numpy as np

from . import config


def manifest_perm(tile_yq, tile_yr):
    """Permutation p with pack[p] in manifest tiles[] order.

    The snowpack terrain pack's 'canonical slot' order is tiles sorted by
    (yq, yr), which is NOT the manifest tiles[] order the frontend contract
    (and our PFL bodies) use. Every consumer of pack arrays must reorder.
    """
    m = json.loads(config.TILE_MANIFEST.read_text())["tiles"]
    pos = {(int(q), int(r)): i for i, (q, r) in enumerate(zip(tile_yq, tile_yr))}
    return np.array([pos[(t["yq"], t["yr"])] for t in m], dtype=np.int64)


def load_terrain_columns(path=None):
    """dict(elev, aspect_rad, valid, ...) as (n_tiles, 2401) arrays in
    manifest tile order, or None if the pack is not available."""
    path = path or config.TERRAIN_COLUMNS_NPZ
    if path is None or not path.exists():
        return None
    z = np.load(path, allow_pickle=True)
    perm = manifest_perm(z["tile_yq"], z["tile_yr"])
    n = len(perm)

    def grid(key):
        return z[key].reshape(n, config.TILE_BYTES)[perm]

    return dict(
        elev=grid("elev_m").astype(np.float32),
        aspect_rad=grid("aspect_rad").astype(np.float32),
        slope_mean=grid("slope_mean_deg").astype(np.float32),
        valid=grid("valid").astype(bool),
    )
