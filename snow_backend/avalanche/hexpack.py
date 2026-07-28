# @atlas: 5 m byte mosaic -> per-tile L1 hex layers (2,401 B, heap order): precomputed hex->cell gather index (cells whose centers fall within ~9 m of the L1 centroid), max-pooled per hex — safety-conservative (worst cell wins) and NODATA=0 loses to any simulated value.
import numpy as np

from . import config
from .centroids import build_centroid_table

HEX_SAMPLE_RADIUS_M = 9.0  # between L1 apothem (8.46) and circumradius (9.77)


def build_gather_index(transform, shape, cache=True):
    """Per (tile, hex): flat mosaic indices of 5 m cells sampled by that hex.

    Returns (idx int64 (n_tiles, 2401, k), valid bool same shape); invalid
    slots point at index 0 with valid=False.
    """
    cache_path = config.CACHE_DIR / "gather_index.npz"
    if cache and cache_path.exists():
        with np.load(cache_path) as z:
            return z["idx"], z["valid"]

    xy = build_centroid_table()
    n_tiles = xy.shape[0]
    inv = ~transform  # world -> (col, row) fractional
    r = HEX_SAMPLE_RADIUS_M
    c = config.CELL
    span = int(np.ceil(r / c))
    offs = [
        (di, dj)
        for di in range(-span, span + 1)
        for dj in range(-span, span + 1)
        if (di * c) ** 2 + (dj * c) ** 2 <= (r + 0.5 * c) ** 2
    ]
    offs = np.array(offs, dtype=np.int64)  # (k, 2) row, col offsets

    cols, rows = inv * (xy[..., 0].ravel(), xy[..., 1].ravel())
    base_r = np.round(rows - 0.5).astype(np.int64)
    base_c = np.round(cols - 0.5).astype(np.int64)

    rr = base_r[:, None] + offs[None, :, 0]
    cc = base_c[:, None] + offs[None, :, 1]
    inside = (rr >= 0) & (rr < shape[0]) & (cc >= 0) & (cc < shape[1])
    cell_x, cell_y = transform * (cc + 0.5, rr + 0.5)
    d2 = (cell_x - xy[..., 0].ravel()[:, None]) ** 2 + (
        cell_y - xy[..., 1].ravel()[:, None]
    ) ** 2
    valid = inside & (d2 <= r * r)
    flat = np.where(valid, rr * shape[1] + cc, 0).astype(np.int64)

    idx = flat.reshape(n_tiles, config.TILE_BYTES, -1)
    valid = valid.reshape(n_tiles, config.TILE_BYTES, -1)
    assert valid.any(axis=2).all(), "some L1 hex samples no mosaic cells"

    if cache:
        config.CACHE_DIR.mkdir(parents=True, exist_ok=True)
        np.savez_compressed(cache_path, idx=idx, valid=valid)
    return idx, valid


def pack_tiles(byte_mosaic, idx, valid):
    """(n_tiles, 2401) uint8: max byte over each hex's sampled cells.

    Max is the safety-conservative reducer (a narrow runout tongue survives the
    17 m resample) and makes NODATA handling automatic: a hex whose cells are
    all NODATA (0) stays 0; any simulated cell (>= 1) wins over NODATA."""
    flat = byte_mosaic.ravel()
    vals = flat[idx]
    vals = np.where(valid, vals, 0)
    return vals.max(axis=2).astype(np.uint8)
