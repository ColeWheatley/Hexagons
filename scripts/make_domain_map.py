#!/usr/bin/env python3
"""Write the canonical West Tirol high-resolution domain as GeoJSON + a map PNG.

The domain is the imagery union of the v2 corpus (one sheet per footprint); the bake
further intersects it with valid DEM, so every baked hex lies inside this footprint.
Layers are split by source: M28 2023, M28 2025, and M31 2022 (reprojected onto the
M28 grid).  Geometry is exact sheet rectangles: no simplification, no cutline.

usage: make_domain_map.py CORPUS_DIR OUT_DIR [--skigebiete skigebiete.json]
"""
import argparse
import glob
import json
import os
from multiprocessing import Pool

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import rasterio
from matplotlib.patches import PathPatch
from matplotlib.path import Path as MPath
from pyproj import Transformer
from shapely.geometry import box, mapping
from shapely.ops import transform, unary_union


def bounds(path):
    with rasterio.open(path) as r:
        return os.path.basename(path), tuple(r.bounds)


def layer_of(name):
    if name.startswith("dop_m31w_"):
        return "M31 2022 (reprojected to M28 grid)"
    return "M28 " + name.rsplit("_", 1)[1][:4]


def draw(ax, geom, **kw):
    for poly in getattr(geom, "geoms", [geom]):
        if poly.geom_type != "Polygon":
            continue
        verts, codes = [], []
        for ring in [poly.exterior, *poly.interiors]:
            c = np.asarray(ring.coords)
            verts += list(c)
            codes += [MPath.MOVETO] + [MPath.LINETO] * (len(c) - 2) + [MPath.CLOSEPOLY]
        ax.add_patch(PathPatch(MPath(verts, codes), **kw))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("corpus_dir")
    ap.add_argument("out_dir")
    ap.add_argument("--skigebiete")
    args = ap.parse_args()
    os.makedirs(args.out_dir, exist_ok=True)
    paths = sorted(glob.glob(os.path.join(args.corpus_dir, "*.tif")))
    with Pool(24) as pool:
        items = pool.map(bounds, paths, chunksize=50)
    layers = {}
    for name, b in items:
        layers.setdefault(layer_of(name), []).append(box(*b))
    to_ll = Transformer.from_crs(31254, 4326, always_xy=True).transform
    union_m = unary_union([g for gs in layers.values() for g in gs])
    feats = []

    def feature(geom_m, props):
        g = transform(to_ll, geom_m.segmentize(100))
        return {"type": "Feature", "properties": props, "geometry": mapping(g)}

    layer_u = {k: unary_union(v) for k, v in layers.items()}
    feats.append(feature(union_m, {
        "name": "Hexagons West Tirol high-resolution domain (imagery union)",
        "role": "domain", "sheets": len(items), "area_km2": round(union_m.area / 1e6, 1),
        "sheet_m": [1250, 1000], "pixel_m": 0.2, "crs_source": "EPSG:31254",
        "note": "Baked terrain is this footprint intersected with valid 5 m DGM Tirol.",
    }))
    for k, u in sorted(layer_u.items()):
        feats.append(feature(u, {"role": "source_layer", "source": k,
                                 "sheets": len(layers[k]), "area_km2": round(u.area / 1e6, 1)}))
    fc = {"type": "FeatureCollection", "features": feats}
    out_geo = os.path.join(args.out_dir, "hexagons_domain_v2.geojson")
    json.dump(fc, open(out_geo, "w"), separators=(",", ":"))
    summary = {f["properties"].get("source", "domain"): {"sheets": f["properties"]["sheets"],
               "area_km2": f["properties"]["area_km2"]} for f in feats}
    json.dump(summary, open(os.path.join(args.out_dir, "hexagons_domain_v2_summary.json"), "w"), indent=1)
    print(json.dumps(summary, indent=1))

    colors = {"M28 2023": "#6baed6", "M28 2025": "#74c476", "M31 2022 (reprojected to M28 grid)": "#fd8d3c"}
    fig, ax = plt.subplots(figsize=(15, 9.5), dpi=120)
    for k, u in sorted(layer_u.items()):
        draw(ax, transform(to_ll, u.segmentize(100)), fc=colors.get(k, "#999"), ec="none", alpha=.9, zorder=2,
             label=f"{k}: {len(layers[k])} sheets")
    draw(ax, transform(to_ll, union_m.segmentize(100)), fc="none", ec="k", lw=1.0, zorder=4)
    if args.skigebiete and os.path.exists(args.skigebiete):
        doc = json.load(open(args.skigebiete))
        areas = doc if isinstance(doc, list) else next(v for v in doc.values() if isinstance(v, list))
        for a in areas:
            if "gps" in a:
                lon, lat = a["gps"]["lon"], a["gps"]["lat"]
                ax.plot(lon, lat, "o", ms=3.5, color="#222", zorder=6)
                ax.annotate(a["name"].split(" am ")[0], (lon, lat), xytext=(3, 3), textcoords="offset points",
                            fontsize=6.5, zorder=6)
    for name, (lon, lat) in {"Innsbruck": (11.3945, 47.2692), "Zillertal (Mayrhofen)": (11.8586, 47.1522),
                             "Kitzbühel (not included)": (12.3925, 47.4467)}.items():
        ax.plot(lon, lat, "*", ms=11, color="magenta", mec="k", zorder=7)
        ax.annotate(name, (lon, lat), xytext=(6, -10), textcoords="offset points", fontsize=8, weight="bold", zorder=7)
    from matplotlib.patches import Patch
    ax.legend(handles=[Patch(fc=colors.get(k, "#999"), label=f"{k}: {len(layers[k])} sheets") for k in sorted(layer_u)],
              loc="lower right", fontsize=9, title="Imagery source")
    ax.set_aspect(1 / np.cos(np.radians(47.2)))
    ax.grid(alpha=.25)
    ax.set_title(f"Hexagons canonical West Tirol high-resolution domain: {len(items)} sheets, "
                 f"{union_m.area / 1e6:,.0f} km² of 20 cm imagery (terrain = this ∩ valid 5 m DEM)")
    plt.tight_layout()
    plt.savefig(os.path.join(args.out_dir, "hexagons_domain_v2.png"))
    print("wrote", args.out_dir)


if __name__ == "__main__":
    main()
