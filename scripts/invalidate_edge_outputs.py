#!/usr/bin/env python3
"""Mark old bake outputs stale where newly added orthophoto sheets reach them.

The bake treats an island/page as done when its recipe marker exists and never
records which sheets it used, so geometry and pages baked against the old, smaller
corpus keep their clipped or padded edges unless their markers are removed.

Given the old inventory.json (sheets + geometry/page bounds), the new audited TSV and
the corpus directory, this finds every old island/page whose footprint, grown by
--margin-m, touches a sheet that is not in the old bake, and deletes only that unit's
recipe marker inside the NEW output root.  Nothing outside the new root is touched.

usage: invalidate_edge_outputs.py OLD_INVENTORY NEW_APP_ROOT CORPUS_DIR [--margin-m 1500] [--dry-run]
"""
import argparse
import json
import os

import rasterio
from shapely.geometry import box
from shapely.ops import unary_union


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("old_inventory")
    ap.add_argument("new_app_root")
    ap.add_argument("corpus_dir")
    ap.add_argument("--margin-m", type=float, default=1500.0)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    inv = json.load(open(args.old_inventory))
    old_names = {os.path.basename(f["path"]) for f in inv["sources"]["aerial_files"]}
    new_boxes = []
    for name in sorted(os.listdir(args.corpus_dir)):
        if name.endswith(".tif") and name not in old_names:
            with rasterio.open(os.path.join(args.corpus_dir, name)) as r:
                new_boxes.append(box(*r.bounds))
    new_union = unary_union(new_boxes)
    print(f"{len(new_boxes)} sheets are new relative to the old bake")

    stale_islands, stale_pages = [], []
    for g in inv["geometry"]:
        if box(*g["bounds"]).buffer(args.margin_m).intersects(new_union):
            stale_islands.append(g)
    for p in inv["texture_pages"]:
        if box(*p["bounds"]).buffer(args.margin_m).intersects(new_union):
            stale_pages.append(p)
    print(f"stale: {len(stale_islands)} of {len(inv['geometry'])} islands, "
          f"{len(stale_pages)} of {len(inv['texture_pages'])} pages")

    removed = 0
    for g in stale_islands:
        key = f"gosper_{g['yq']}_{g['yr']}"
        marker = os.path.join(args.new_app_root, "tiles_bin", ".recipes", f"{key}.txt")
        if os.path.exists(marker):
            removed += 1
            if not args.dry_run:
                os.remove(marker)
    for p in stale_pages:
        marker = os.path.join(args.new_app_root, "aerial_pages", ".recipes", f"texture_{p['page_x']}_{p['page_y']}.txt")
        if os.path.exists(marker):
            removed += 1
            if not args.dry_run:
                os.remove(marker)
    print(("would remove" if args.dry_run else "removed"), removed, "markers")


if __name__ == "__main__":
    main()
