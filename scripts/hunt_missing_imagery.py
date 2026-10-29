#!/usr/bin/env python3
"""Find places where the published Hexagons release has no imagery/terrain.

The bake only emits terrain where a source orthophoto sheet exists, so a sheet
missing from the bake corpus shows up in the app as a black void, not as a
textureless patch.  This compares three things and draws them on one map:

  baked    sheets the release was baked from (inventory.json -> sources.aerial_files)
  disk     sheets currently on disk (every --aerial-dir, EPSG:31254 headers only)
  target   optional cutline (GeoJSON, WGS84) the display area should cover

and reports, with areas:
  - sheets on disk that the release never used  (cheap fix: rebake)
  - target area with no sheet anywhere on disk   (needs a download)
  - gaps (interior holes + notches closed by --close-m) inside the baked footprint
  - for each --probe-point, which set covers it

Outputs <out>/gaps.png, gaps.json, unbaked_sheets.txt, missing_cells.txt.
Reads headers only; downloads nothing.  M31 (EPSG:31255) sheets in other
directories are reprojected to a footprint for the map but flagged as such.
"""
from __future__ import annotations

import argparse
import glob
import json
import os
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import rasterio
from matplotlib.patches import PathPatch
from matplotlib.path import Path as MPath
from pyproj import CRS, Transformer
from shapely.geometry import Point, box, shape
from shapely.ops import transform, unary_union

SHEET_W, SHEET_H = 1250.0, 1000.0


_EPSG_CACHE: dict[str, int | None] = {}


def _epsg(wkt: str) -> int | None:
    if wkt not in _EPSG_CACHE:
        _EPSG_CACHE[wkt] = CRS.from_wkt(wkt).to_epsg(min_confidence=20)
    return _EPSG_CACHE[wkt]


def footprints(directory: str) -> dict[str, tuple]:
    out = {}
    for path in sorted(glob.glob(os.path.join(directory, "*.tif"))):
        with rasterio.open(path) as r:
            # Some sheets carry the projection as bare WKT with no EPSG authority;
            # to_epsg() then needs a lower confidence to recognise 31254.
            epsg = _epsg(r.crs.to_wkt()) if r.crs else None
            out[os.path.basename(path)] = (tuple(r.bounds), epsg)
    return out


def to_wgs84(geom, epsg):
    t = Transformer.from_crs(epsg, 4326, always_xy=True).transform
    return transform(t, geom.segmentize(100))


def draw(ax, geom, **kw):
    for poly in getattr(geom, "geoms", [geom]):
        if poly.is_empty or poly.geom_type != "Polygon":
            continue
        verts, codes = [], []
        for ring in [poly.exterior, *poly.interiors]:
            c = np.asarray(ring.coords)
            verts += list(c)
            codes += [MPath.MOVETO] + [MPath.LINETO] * (len(c) - 2) + [MPath.CLOSEPOLY]
        ax.add_patch(PathPatch(MPath(verts, codes), **kw))


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--inventory", required=True, help="bake inventory.json of the published release")
    ap.add_argument("--aerial-dir", action="append", required=True, help="directory of *.tif sheets (repeatable)")
    ap.add_argument("--cutline", help="WGS84 GeoJSON of the area the display should cover")
    ap.add_argument("--probe-point", action="append", default=[], metavar="NAME=LON,LAT")
    ap.add_argument("--close-m", type=float, default=3000.0, help="closing radius for notch/strip gaps")
    ap.add_argument("--min-gap-km2", type=float, default=0.25)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    inv = json.load(open(args.inventory))
    baked_names = {os.path.basename(f["path"]) for f in inv["sources"]["aerial_files"]}
    baked = unary_union([box(*f["bounds"]) for f in inv["sources"]["aerial_files"]])

    disk, disk_geoms, other_crs = {}, [], 0
    for d in args.aerial_dir:
        for name, (b, epsg) in footprints(d).items():
            disk[name] = (b, epsg)
            if epsg == 31254:
                disk_geoms.append(box(*b))
            else:
                other_crs += 1
    disk_u = unary_union(disk_geoms)
    unbaked = {n: v for n, v in disk.items() if n not in baked_names and v[1] == 31254}
    unbaked_u = unary_union([box(*v[0]) for v in unbaked.values()]) if unbaked else box(0, 0, 0, 0)

    # gaps inside what the release shows: enclosed holes + notches/strips narrower than 2*close-m
    closed = baked.buffer(args.close_m, join_style=2).buffer(-args.close_m, join_style=2)
    gaps = closed.difference(baked)
    gap_polys = [g for g in getattr(gaps, "geoms", [gaps]) if g.area > args.min_gap_km2 * 1e6]
    gaps = unary_union(gap_polys) if gap_polys else box(0, 0, 0, 0)
    fixed_by_disk = gaps.intersection(disk_u)
    still_gap = gaps.difference(disk_u)

    report = {
        "baked_sheets": len(baked_names), "disk_sheets_31254": len(disk_geoms), "disk_sheets_other_crs": other_crs,
        "baked_km2": round(baked.area / 1e6, 1), "disk_km2": round(disk_u.area / 1e6, 1),
        "disk_sheets_not_in_release": len(unbaked), "unbaked_km2": round(unbaked_u.area / 1e6, 1),
        "baked_footprint_gaps_km2": round(gaps.area / 1e6, 1),
        "gaps_fillable_by_rebake_with_disk_sheets_km2": round(fixed_by_disk.area / 1e6, 1),
        "gaps_needing_new_sheets_km2": round(still_gap.area / 1e6, 1),
        "excluded_geometry_tiles_in_bake": len(inv.get("excluded_geometry", [])),
    }

    cut_m = cut_ll = None
    if args.cutline:
        doc = json.load(open(args.cutline))
        cut_ll = shape(doc["geometry"] if "geometry" in doc else doc)
        cut_m = transform(Transformer.from_crs(4326, 31254, always_xy=True).transform, cut_ll.segmentize(0.002))
        no_sheet = cut_m.difference(disk_u)
        report["target_km2"] = round(cut_m.area / 1e6, 1)
        report["target_covered_by_release_km2"] = round(cut_m.intersection(baked).area / 1e6, 1)
        report["target_covered_by_disk_km2"] = round(cut_m.intersection(disk_u).area / 1e6, 1)
        report["target_with_no_sheet_on_disk_km2"] = round(no_sheet.area / 1e6, 1)
        # grid cells of the target that have no sheet anywhere on disk
        cells = []
        minx, miny, maxx, maxy = no_sheet.bounds
        for i in range(int(minx // SHEET_W), int(maxx // SHEET_W) + 1):
            for j in range(int(miny // SHEET_H), int(maxy // SHEET_H) + 1):
                c = box(i * SHEET_W, j * SHEET_H, (i + 1) * SHEET_W, (j + 1) * SHEET_H)
                if c.intersection(no_sheet).area > 1000:
                    cells.append(f"{i * SHEET_W:.0f} {j * SHEET_H:.0f}")
        (out / "missing_cells.txt").write_text("\n".join(cells) + "\n")
        report["target_cells_without_a_sheet"] = len(cells)

    to_m = Transformer.from_crs(4326, 31254, always_xy=True).transform
    probes = {}
    for spec in args.probe_point:
        name, lonlat = spec.split("=")
        lon, lat = map(float, lonlat.split(","))
        p = Point(to_m(lon, lat))
        probes[name] = {"in_release": bool(baked.contains(p)), "on_disk": bool(disk_u.contains(p)),
                        "on_disk_but_not_in_release": bool(unbaked_u.contains(p))}
    report["probe_points"] = probes
    (out / "unbaked_sheets.txt").write_text("\n".join(sorted(unbaked)) + "\n")
    (out / "gaps.json").write_text(json.dumps(report, indent=1))
    print(json.dumps(report, indent=1))

    fig, ax = plt.subplots(figsize=(15, 10), dpi=110)
    draw(ax, to_wgs84(baked, 31254), fc="#9ecae1", ec="#08519c", lw=.6, zorder=2)
    draw(ax, to_wgs84(unbaked_u, 31254), fc="#74c476", ec="none", alpha=.9, zorder=3)
    if gaps.area:
        draw(ax, to_wgs84(still_gap, 31254), fc="#e31a1c", ec="#99000d", lw=.5, zorder=5)
        draw(ax, to_wgs84(fixed_by_disk, 31254), fc="#ff7f00", ec="#a63603", lw=.5, zorder=4)
    if cut_ll is not None:
        for poly in getattr(cut_ll, "geoms", [cut_ll]):
            c = np.asarray(poly.exterior.coords)
            ax.plot(c[:, 0], c[:, 1], color="k", lw=1.4, zorder=6)
    for name, spec in zip(probes, args.probe_point):
        lon, lat = map(float, spec.split("=")[1].split(","))
        ax.plot(lon, lat, "*", ms=14, color="magenta", mec="k", zorder=8)
        ax.annotate(name, (lon, lat), xytext=(6, 6), textcoords="offset points", fontsize=9, weight="bold", zorder=8)
    ax.set_aspect(1 / np.cos(np.radians(47.2)))
    ax.grid(alpha=.25)
    from matplotlib.lines import Line2D
    from matplotlib.patches import Patch
    ax.legend(handles=[
        Patch(fc="#9ecae1", ec="#08519c", label=f"in the published release ({len(baked_names)} sheets)"),
        Patch(fc="#74c476", label=f"on disk, never baked ({len(unbaked)} sheets)"),
        Patch(fc="#ff7f00", label="gap in release, fillable by rebake"),
        Patch(fc="#e31a1c", label="gap in release, no sheet on disk"),
        Line2D([0], [0], color="k", label="target cutline"),
        Line2D([0], [0], marker="*", color="magenta", mec="k", ls="", label="probe point")], loc="lower right")
    ax.set_title("Hexagons imagery gap hunt: release vs disk vs target")
    plt.tight_layout()
    plt.savefig(out / "gaps.png")
    print("wrote", out)


if __name__ == "__main__":
    main()
