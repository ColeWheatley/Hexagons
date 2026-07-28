# @atlas: Terrain prep for the avalanche layer: 5 m DEM mosaic windowed from the Tirol DGM over the beta footprint + reach margin (nodata -> NaN), Horn slope/aspect, 3x3 VRM roughness, optional forest raster resample. Cached as npz.
import json

import numpy as np
import rasterio
from rasterio.windows import from_bounds

from . import config
from .centroids import load_manifest_tiles


def mosaic_bounds():
    """(xmin, ymin, xmax, ymax) of the beta tiles + reach margin, 5 m aligned."""
    tiles, _ = load_manifest_tiles()
    xs = np.array([t["x"] for t in tiles])
    ys = np.array([t["y"] for t in tiles])
    pad = config.TILE_HALF_M + config.REACH_MARGIN_M
    c = config.CELL
    xmin = np.floor((xs.min() - pad) / c) * c
    xmax = np.ceil((xs.max() + pad) / c) * c
    ymin = np.floor((ys.min() - pad) / c) * c
    ymax = np.ceil((ys.max() + pad) / c) * c
    return float(xmin), float(ymin), float(xmax), float(ymax)


def load_dem_mosaic():
    """(dem, transform) — float32 (rows, cols), row 0 = north, NaN where nodata."""
    xmin, ymin, xmax, ymax = mosaic_bounds()
    with rasterio.open(config.DGM_PATH) as src:
        win = from_bounds(xmin, ymin, xmax, ymax, src.transform)
        dem = src.read(1, window=win).astype(np.float32)
        transform = src.window_transform(win)
        nodata = src.nodata if src.nodata is not None else -9999.0
    dem[dem == nodata] = np.nan
    dem[dem < -1000] = np.nan  # belt and braces for sentinel variants
    return dem, transform


def horn_slope_aspect(dem, cell=config.CELL):
    """Horn (1981) 3x3 slope (deg) and aspect (deg from north, clockwise,
    direction of steepest descent). Row 0 = north. NaN-padded edges."""
    z = dem
    p = np.pad(z, 1, mode="edge")
    # 8 neighbors; rows: 0=N edge at top, so "up" in array = north.
    nw, n_, ne = p[:-2, :-2], p[:-2, 1:-1], p[:-2, 2:]
    w_, e_ = p[1:-1, :-2], p[1:-1, 2:]
    sw, s_, se = p[2:, :-2], p[2:, 1:-1], p[2:, 2:]
    dzdx = ((ne + 2 * e_ + se) - (nw + 2 * w_ + sw)) / (8 * cell)
    dzdy = ((nw + 2 * n_ + ne) - (sw + 2 * s_ + se)) / (8 * cell)  # +y = north
    slope = np.degrees(np.arctan(np.hypot(dzdx, dzdy)))
    # Aspect: azimuth of steepest descent (downhill direction).
    aspect = np.degrees(np.arctan2(-dzdx, -dzdy))  # 0 = north, cw positive
    aspect = np.mod(aspect, 360.0)
    return slope.astype(np.float32), aspect.astype(np.float32)


def vrm_roughness(dem, cell=config.CELL):
    """3x3 vector ruggedness measure on unit normals (parity with
    compute_roughness.wgsl: 1 - |sum of normals| / n over the 3x3 stencil)."""
    z = dem
    dzdy, dzdx = np.gradient(z, cell)  # rows increase southward: dzdy is d/d(-north)
    # Unit normal components (sign conventions cancel inside |sum|).
    norm = np.sqrt(dzdx * dzdx + dzdy * dzdy + 1.0)
    nx, ny, nz = dzdx / norm, dzdy / norm, 1.0 / norm

    def box3(a):
        p = np.pad(a, 1, mode="edge")
        return sum(
            p[i : i + a.shape[0], j : j + a.shape[1]]
            for i in range(3)
            for j in range(3)
        )

    sx, sy, sz = box3(nx), box3(ny), box3(nz)
    vrm = 1.0 - np.sqrt(sx * sx + sy * sy + sz * sz) / 9.0
    return vrm.astype(np.float32)


def load_forest(transform, shape):
    """Forest fraction [0,1] on the mosaic grid, or None if no source is set."""
    if not config.FOREST_PATH:
        return None
    from rasterio.warp import Resampling, reproject

    dst = np.zeros(shape, dtype=np.float32)
    with rasterio.open(config.FOREST_PATH) as src:
        reproject(
            rasterio.band(src, 1),
            dst,
            dst_transform=transform,
            dst_crs="EPSG:31254",
            resampling=Resampling.average,
        )
    return dst


def prepare(cache=True):
    """Returns dict(dem, slope, aspect, vrm, forest|None, transform, bounds)."""
    cache_path = config.CACHE_DIR / "terrain.npz"
    meta_path = config.CACHE_DIR / "terrain_meta.json"
    if cache and cache_path.exists() and meta_path.exists():
        with np.load(cache_path, allow_pickle=False) as z:
            out = {k: z[k] for k in z.files}
        meta = json.loads(meta_path.read_text())
        out["transform"] = rasterio.Affine(*meta["transform"])
        out["bounds"] = tuple(meta["bounds"])
        if "forest" not in out:
            out["forest"] = None
        return out

    dem, transform = load_dem_mosaic()
    slope, aspect = horn_slope_aspect(dem)
    vrm = vrm_roughness(dem)
    forest = load_forest(transform, dem.shape)
    bounds = mosaic_bounds()

    if cache:
        config.CACHE_DIR.mkdir(parents=True, exist_ok=True)
        arrays = dict(dem=dem, slope=slope, aspect=aspect, vrm=vrm)
        if forest is not None:
            arrays["forest"] = forest
        np.savez_compressed(cache_path, **arrays)
        meta_path.write_text(
            json.dumps({"transform": list(transform)[:6], "bounds": list(bounds)})
        )
    return dict(
        dem=dem, slope=slope, aspect=aspect, vrm=vrm, forest=forest,
        transform=transform, bounds=bounds,
    )


if __name__ == "__main__":
    t = prepare(cache=True)
    dem = t["dem"]
    print(f"mosaic {dem.shape}, bounds {t['bounds']}")
    print(f"elev [{np.nanmin(dem):.0f}, {np.nanmax(dem):.0f}] m, "
          f"NaN {np.isnan(dem).mean() * 100:.2f}%")
    print(f"slope p50/p95 {np.nanpercentile(t['slope'], [50, 95])}")
    print(f"vrm p50/p95 {np.nanpercentile(t['vrm'], [50, 95])}")
