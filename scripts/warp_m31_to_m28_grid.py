#!/usr/bin/env python3
"""Reproject Land Tirol M31 (EPSG:31255) orthophoto sheets onto the M28 sheet grid.

The bake pipeline expects 6250 x 5000 px, 0.2 m, EPSG:31254 sheets aligned to the
1250 x 1000 m grid.  The east of Tirol is published in M31 sheets that are tilted
about 2 degrees against that grid, so each target cell is assembled from every M31
sheet that touches it.  Only cells that are 100% covered by M31 imagery are written,
so there are no black corner wedges; ragged outer edges simply stay empty.

Originals are never modified.  Output names: dop_m31w_<x0>_<y0>_<year>.tif where
x0,y0 are the cell's south-west corner in EPSG:31254 metres.  A JSONL manifest records
the M31 sources of every output cell.

usage: warp_m31_to_m28_grid.py M31_DIR OUT_DIR M28_DIR [M28_DIR ...]
Cells already covered by any M28 sheet in the M28 dirs are skipped.
"""
import glob
import json
import os
import sys
from multiprocessing import Pool

import numpy as np
import rasterio
from pyproj import CRS, Transformer
from rasterio.enums import Resampling
from rasterio.transform import from_origin
from rasterio.warp import reproject
from shapely.geometry import box
from shapely.ops import transform, unary_union

W, H, PX = 6250, 5000, 0.2
CELL_W, CELL_H = 1250.0, 1000.0
CRS_54 = CRS.from_epsg(31254)
CRS_55 = CRS.from_epsg(31255)
TO_55 = Transformer.from_crs(CRS_54, CRS_55, always_xy=True).transform
SOURCES = []  # (name, bounds, path) in EPSG:31255, filled in main()
OUT = None


def build_cell(args):
    x0, y0 = args
    cell55 = transform(TO_55, box(x0, y0, x0 + CELL_W, y0 + CELL_H).segmentize(50))
    srcs = [s for s in SOURCES if box(*s[1]).intersects(cell55)]
    if not srcs:
        return None
    dst = np.zeros((3, H, W), np.uint8)
    have = np.zeros((H, W), bool)
    dst_t = from_origin(x0, y0 + CELL_H, PX, PX)
    for name, _, path in sorted(srcs):
        with rasterio.open(path) as r:
            band = np.zeros((4, H, W), np.uint8)
            src = np.concatenate([r.read([1, 2, 3]), np.full((1, r.height, r.width), 255, np.uint8)])
            reproject(
                src, band, src_transform=r.transform, src_crs=CRS_55, dst_transform=dst_t,
                dst_crs=CRS_54, resampling=Resampling.bilinear, src_nodata=None, dst_nodata=0,
            )
        valid = band[3] == 255
        take = valid & ~have
        for i in range(3):
            dst[i][take] = band[i][take]
        have |= valid
    if not have.all():
        return {"cell": [x0, y0], "skipped": "partial", "valid_fraction": float(have.mean())}
    year = sorted({n.rsplit("_", 1)[1][:4] for n, _, _ in srcs})[-1]
    name = f"dop_m31w_{int(x0)}_{int(y0)}_{year}.tif"
    path = os.path.join(OUT, name)
    tmp = path + ".part"
    with rasterio.open(
        tmp, "w", driver="GTiff", width=W, height=H, count=3, dtype="uint8", crs=CRS_54,
        transform=dst_t, tiled=True, blockxsize=256, blockysize=256, compress="JPEG",
        photometric="YCBCR", jpeg_quality=95,
    ) as w:
        w.write(dst)
    os.replace(tmp, path)
    return {"cell": [x0, y0], "name": name, "sources": sorted(n for n, _, _ in srcs)}


def main():
    global OUT
    m31_dir, OUT = sys.argv[1], sys.argv[2]
    m28_dirs = sys.argv[3:]
    os.makedirs(OUT, exist_ok=True)
    for p in sorted(glob.glob(os.path.join(m31_dir, "*.tif"))):
        with rasterio.open(p) as r:
            assert CRS.from_wkt(r.crs.to_wkt()).to_epsg(min_confidence=20) == 31255, p
            SOURCES.append((os.path.basename(p), tuple(r.bounds), p))
    m28 = []
    for d in m28_dirs:
        for p in glob.glob(os.path.join(d, "*.tif")):
            with rasterio.open(p) as r:
                m28.append(box(*r.bounds))
    m28_u = unary_union(m28)
    # candidate cells: the 31254 grid cells whose centre lies inside the M31 sheet union
    to_54 = Transformer.from_crs(CRS_55, CRS_54, always_xy=True).transform
    union54 = unary_union([transform(to_54, box(*s[1]).segmentize(50)) for s in SOURCES])
    minx, miny, maxx, maxy = union54.bounds
    cells = []
    for i in range(int(minx // CELL_W) - 1, int(maxx // CELL_W) + 2):
        for j in range(int(miny // CELL_H) - 1, int(maxy // CELL_H) + 2):
            c = box(i * CELL_W, j * CELL_H, (i + 1) * CELL_W, (j + 1) * CELL_H)
            if c.within(union54.buffer(1.0)) and not m28_u.intersects(c.buffer(-1)):
                cells.append((i * CELL_W, j * CELL_H))
    print(f"{len(SOURCES)} M31 sheets, {len(cells)} candidate cells", flush=True)
    manifest = os.path.join(OUT, "warp_manifest.jsonl")
    done = set()
    if os.path.exists(manifest):
        done = {tuple(json.loads(l)["cell"]) for l in open(manifest)}
    todo = [c for c in cells if c not in done]
    with Pool(20) as pool, open(manifest, "a") as mf:
        for n, res in enumerate(pool.imap_unordered(build_cell, todo, chunksize=1), 1):
            if res:
                mf.write(json.dumps(res) + "\n")
                mf.flush()
            if n % 25 == 0:
                print(f"{n}/{len(todo)}", flush=True)
    print("finished", flush=True)


if __name__ == "__main__":
    main()
