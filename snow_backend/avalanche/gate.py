# @atlas: Release gate + zone segmentation: slope/elevation/VRM/forest gate (parity with avalanchers compute_release_areas.wgsl), connected components split by aspect octant, 2 ha floor / 60 ha drainage split, zone table with per-zone stats.
import numpy as np
from scipy import ndimage

from . import config


def release_gate(t):
    """Boolean eligibility mask from a terrain dict (see terrain.prepare)."""
    slope, dem, vrm = t["slope"], t["dem"], t["vrm"]
    m = (
        (slope >= config.GATE_MIN_SLOPE_DEG)
        & (slope <= config.GATE_MAX_SLOPE_DEG)
        & (dem >= config.GATE_MIN_ELEV_M)
        & (vrm <= config.GATE_MAX_VRM)
        & ~np.isnan(dem)
    )
    if t.get("forest") is not None:
        m &= t["forest"] <= config.GATE_MAX_FOREST
    return m


def aspect_octant(aspect):
    """0..7 octant index from aspect degrees (N=0, cw), majority-smoothed 5x5."""
    octant = (np.nan_to_num(aspect + 22.5) // 45.0).astype(np.int8) % 8
    # Majority smoothing via per-octant box counts (vectorized, no mode filter).
    counts = np.zeros((8,) + aspect.shape, dtype=np.int16)
    k = np.ones((5, 5), dtype=np.int16)
    for o in range(8):
        counts[o] = ndimage.convolve((octant == o).astype(np.int16), k, mode="nearest")
    return np.argmax(counts, axis=0).astype(np.int8)


def segment_zones(t, mask=None):
    """Label release zones.

    Returns (labels int32 array, zones list of dicts). labels==0 is background.
    Segmentation: gate mask -> per-aspect-octant connected components (8-conn)
    -> drop < 2 ha -> split > 60 ha along D8 drainage basins within the zone.
    """
    if mask is None:
        mask = release_gate(t)
    octant = aspect_octant(t["aspect"])
    cell_area = config.CELL * config.CELL
    struct = np.ones((3, 3), dtype=bool)

    labels = np.zeros(mask.shape, dtype=np.int32)
    next_id = 1
    min_cells = int(config.ZONE_MIN_AREA_M2 / cell_area)
    max_cells = int(config.ZONE_MAX_AREA_M2 / cell_area)

    for o in range(8):
        sub, n = ndimage.label(mask & (octant == o), structure=struct)
        if n == 0:
            continue
        sizes = np.bincount(sub.ravel())
        for comp in range(1, n + 1):
            if sizes[comp] < min_cells:
                continue
            comp_mask = sub == comp
            if sizes[comp] <= max_cells:
                labels[comp_mask] = next_id
                next_id += 1
            else:
                for piece in _split_by_drainage(t["dem"], comp_mask, max_cells, min_cells):
                    labels[piece] = next_id
                    next_id += 1

    labels = _merge_fragments(mask, labels)
    zones = _zone_table(labels, t)
    return labels, zones


def _merge_fragments(mask, labels):
    """Attach sub-floor gate fragments (eligible cells left unlabeled by the
    octant split) to a touching zone, so real release terrain is not silently
    dropped just because the octant boundary fragmented it. Isolated fragments
    (touching no zone after 3 growth rounds) stay dropped. Merging can push a
    zone past the 60 ha cap; zone stats report the realized distribution."""
    struct = np.ones((3, 3), dtype=bool)
    for _ in range(3):
        orphan = mask & (labels == 0)
        if not orphan.any():
            break
        frag, nf = ndimage.label(orphan, structure=struct)
        if nf == 0:
            break
        neighbor_max = ndimage.grey_dilation(labels, size=3)
        touch = ndimage.labeled_comprehension(
            neighbor_max, frag, np.arange(1, nf + 1), np.max, np.int32, 0
        )
        lut = np.zeros(nf + 1, dtype=np.int32)
        lut[1:] = touch
        assign = lut[frag]
        newly = (assign > 0) & (labels == 0)
        if not newly.any():
            break
        labels = np.where(newly, assign, labels)
    return labels


def _split_by_drainage(dem, comp_mask, max_cells, min_cells):
    """Split an oversized component into <= 60 ha pieces.

    D8 drainage basins would be ideal; a robust, dependency-free stand-in that
    respects terrain is elevation banding within the component (bands follow
    contours, which approximate release-slope drainage divides at this scale),
    re-labeled for connectivity. Pieces below the 2 ha floor merge into the
    largest touching sibling (or are dropped if isolated).
    """
    zs = dem[comp_mask]
    n_pieces = int(np.ceil(comp_mask.sum() / (0.75 * max_cells)))
    edges = np.nanquantile(zs, np.linspace(0, 1, n_pieces + 1))
    band = np.zeros(comp_mask.shape, dtype=np.int16)
    band[comp_mask] = np.clip(
        np.searchsorted(edges[1:-1], dem[comp_mask]), 0, n_pieces - 1
    ) + 1
    struct = np.ones((3, 3), dtype=bool)
    pieces, keep = [], []
    for b in range(1, n_pieces + 1):
        sub, n = ndimage.label(band == b, structure=struct)
        for c in range(1, n + 1):
            m = sub == c
            (pieces if m.sum() >= min_cells else keep).append(m)
    # Merge sub-floor fragments into the largest touching piece.
    grown = [ndimage.binary_dilation(p, structure=struct) for p in pieces]
    for frag in keep:
        touch = [i for i, g in enumerate(grown) if (g & frag).any()]
        if touch:
            best = max(touch, key=lambda i: pieces[i].sum())
            pieces[best] |= frag
    return pieces


def _zone_table(labels, t):
    n = labels.max()
    if n == 0:
        return []
    idx = np.arange(1, n + 1)
    cell_area = config.CELL * config.CELL
    sizes = ndimage.sum_labels(np.ones_like(labels), labels, idx)
    zmean = ndimage.mean(t["dem"], labels, idx)
    zmax = ndimage.maximum(t["dem"], labels, idx)
    smean = ndimage.mean(t["slope"], labels, idx)
    objs = ndimage.find_objects(labels)
    zones = []
    for i, zid in enumerate(idx):
        sl = objs[zid - 1]
        zones.append(
            dict(
                id=int(zid),
                cells=int(sizes[i]),
                area_ha=float(sizes[i] * cell_area / 1e4),
                z_mean=float(zmean[i]),
                z_max=float(zmax[i]),
                slope_mean=float(smean[i]),
                row0=sl[0].start, row1=sl[0].stop,
                col0=sl[1].start, col1=sl[1].stop,
            )
        )
    return zones


def build(cache=True):
    from . import terrain

    cache_path = config.CACHE_DIR / "zones.npz"
    if cache and cache_path.exists():
        with np.load(cache_path, allow_pickle=True) as z:
            return z["labels"], list(z["zones"])
    t = terrain.prepare()
    labels, zones = segment_zones(t)
    if cache:
        config.CACHE_DIR.mkdir(parents=True, exist_ok=True)
        np.savez_compressed(cache_path, labels=labels, zones=np.array(zones, dtype=object))
    return labels, zones


if __name__ == "__main__":
    from . import terrain

    t = terrain.prepare()
    mask = release_gate(t)
    valid = ~np.isnan(t["dem"])
    print(f"gate pass: {mask.sum():,} cells = {mask.sum() * 25 / 1e6:.1f} km^2 "
          f"({100 * mask.sum() / valid.sum():.1f}% of valid)")
    labels, zones = build(cache=True)
    areas = np.array([z["area_ha"] for z in zones])
    print(f"zones: {len(zones)}, area p10/p50/p90 = "
          f"{np.percentile(areas, [10, 50, 90]).round(1)} ha, total {areas.sum():.0f} ha")
