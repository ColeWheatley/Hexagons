#!/usr/bin/env python3
"""
Downloader for the Tirol 0.5 m ALS DGM/DOM GeoTIFF mosaic (the tiris
"Laserscan Download Tirol" web viewer).

This is the high-resolution sibling of the existing aerial downloaders in
../aerial_downloader/. Where the aerials are 1250x1000 m DOP tiles on the same
XXYY-SS Blattschnitt, this grabs the 0.5 m elevation model for the same sheets:
10x finer than the current DGM_Tirol_5m_*.tif (~100x the pixels).

Data source : Amt der Tiroler Landesregierung - Abteilung Geoinformation
License      : CC BY 4.0  (attribution required, e.g. "Datenquelle: Land Tirol - data.tirol.gv.at")
Viewer       : https://tiris.maps.arcgis.com/apps/webappviewer/index.html?id=5e3071044cb44e76843d110baef8b138

How it works
------------
The viewer's clickable sheets come from an ArcGIS FeatureServer. Each sheet
feature carries a direct download URL in its `URL` attribute, e.g.:
    https://gis.tirol.gv.at/geo/als/mosaik_50cm/m28/geotiff/geotiff_50cm_2322-04.zip
So we:
  1. Page through the FeatureServer to build the authoritative tile manifest
     (only sheets that actually exist - no 404 guessing).
  2. Download each .zip, skipping ones already on disk, with retries + a polite
     delay so we don't hammer the government server.
  3. Optionally unzip each tile.

Scale (all of Tirol, product "DGM/DOM 50cm (GeoTiff) + Hillshade"):
    M28 (EPSG:31254): 6,607 sheets
    M31 (EPSG:31255): 4,669 sheets
    total           : 11,276 sheets  ~=  275 GB zipped  (~25 MB / tile)

Examples
--------
    # Enumerate only - writes manifest.json, downloads nothing
    python download_dem_50cm.py --dry-run

    # Smoke test: grab a single tile and unzip it (what CI / "does it work" uses)
    python download_dem_50cm.py --limit 1 --extract --out ./_smoke

    # Full M28 (west/central Tirol, matches the current 5 m DEM's CRS)
    python download_dem_50cm.py --zone m28 --out ../../local_data/dem_50cm

    # Everything
    python download_dem_50cm.py --out ../../local_data/dem_50cm
"""

import argparse
import json
import os
import sys
import time
import zipfile

import requests

# --- CONFIG ---------------------------------------------------------------
FEATURESERVER = (
    "https://services3.arcgis.com/hG7UfxX49PQ8XkXh/arcgis/rest/services/"
    "als_tif_3857/FeatureServer/0/query"
)
PRODUCT = "DGM/DOM 50cm (GeoTiff) + Hillshade"
PAGE_SIZE = 2000          # FeatureServer maxRecordCount
AVG_TILE_MB = 25.0        # measured average .zip size, for estimates only
DEFAULT_OUT = os.path.join(os.path.dirname(__file__), "..", "..", "local_data", "dem_50cm")

# The product label lives in a per-zone column (M28 / M31). The download URL
# itself encodes the zone, so the column just tells us which sheets to take.
ZONES = {
    "m28": {"field": "M28", "epsg": 31254},
    "m31": {"field": "M31", "epsg": 31255},
}


# --- ENUMERATION ----------------------------------------------------------
def fetch_zone(zone, session):
    """Page through the FeatureServer and yield tile dicts for one zone."""
    field = ZONES[zone]["field"]
    where = f"{field}='{PRODUCT}'"
    offset = 0
    while True:
        params = {
            "where": where,
            "outFields": "NAME,URL,EPSG",
            "returnGeometry": "false",
            "orderByFields": "NAME",
            "resultOffset": offset,
            "resultRecordCount": PAGE_SIZE,
            "f": "json",
        }
        r = session.get(FEATURESERVER, params=params, timeout=60)
        r.raise_for_status()
        data = r.json()
        if "error" in data:
            raise RuntimeError(f"FeatureServer error: {data['error']}")
        feats = data.get("features", [])
        for f in feats:
            a = f["attributes"]
            url = a.get("URL")
            if not url:
                continue
            yield {
                "name": a.get("NAME"),
                "url": url,
                "epsg": a.get("EPSG") or ZONES[zone]["epsg"],
                "zone": zone,
            }
        if len(feats) < PAGE_SIZE:
            break
        offset += PAGE_SIZE


def build_manifest(zones, session):
    tiles = []
    seen = set()
    for zone in zones:
        n = 0
        for tile in fetch_zone(zone, session):
            if tile["url"] in seen:
                continue
            seen.add(tile["url"])
            tiles.append(tile)
            n += 1
        print(f"  {zone}: {n} tiles")
    return tiles


# --- DOWNLOAD -------------------------------------------------------------
def download_one(tile, out_dir, session, extract=False, retries=3, timeout=120):
    """Download (and optionally unzip) a single tile. Returns a status string."""
    url = tile["url"]
    fname = os.path.basename(url)
    dest = os.path.join(out_dir, fname)
    tmp = dest + ".part"

    # Skip if a complete file already exists (size matches remote).
    if os.path.exists(dest):
        try:
            head = session.head(url, timeout=timeout, allow_redirects=True)
            remote = int(head.headers.get("Content-Length", 0))
        except Exception:
            remote = 0
        local = os.path.getsize(dest)
        if remote == 0 or local == remote:
            if extract:
                _extract(dest, out_dir)
            return "skip_exists"

    last_err = None
    for attempt in range(1, retries + 1):
        try:
            with session.get(url, stream=True, timeout=timeout) as r:
                if r.status_code != 200:
                    return f"http_{r.status_code}"
                with open(tmp, "wb") as fh:
                    for chunk in r.iter_content(chunk_size=1 << 20):
                        fh.write(chunk)
            os.replace(tmp, dest)
            if extract:
                _extract(dest, out_dir)
            return "ok"
        except Exception as e:  # network blip -> back off and retry
            last_err = e
            if os.path.exists(tmp):
                os.remove(tmp)
            time.sleep(2 * attempt)
    return f"failed:{last_err}"


def _extract(zip_path, out_dir):
    target = os.path.join(out_dir, os.path.splitext(os.path.basename(zip_path))[0])
    os.makedirs(target, exist_ok=True)
    with zipfile.ZipFile(zip_path) as zf:
        zf.extractall(target)


# --- MAIN -----------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser(description="Download Tirol 0.5 m ALS DGM/DOM GeoTIFF tiles.")
    ap.add_argument("--out", default=DEFAULT_OUT, help="output directory for .zip tiles")
    ap.add_argument("--zone", choices=["m28", "m31", "all"], default="all",
                    help="m28 = west/central Tirol (EPSG:31254, same as current 5 m DEM), "
                         "m31 = east Tirol (EPSG:31255), all = both")
    ap.add_argument("--limit", type=int, default=0, help="only process the first N tiles (0 = no limit)")
    ap.add_argument("--dry-run", action="store_true", help="build manifest + estimate, download nothing")
    ap.add_argument("--extract", action="store_true", help="unzip each tile after download")
    ap.add_argument("--delay", type=float, default=1.0, help="seconds to pause between downloads")
    ap.add_argument("--retries", type=int, default=3, help="download attempts per tile")
    args = ap.parse_args()

    out_dir = os.path.abspath(args.out)
    zones = ["m28", "m31"] if args.zone == "all" else [args.zone]

    session = requests.Session()
    session.headers.update({"User-Agent": "hexagons-dem-downloader/1.0"})

    print(f"Building tile manifest ({PRODUCT}) for zone(s): {', '.join(zones)} ...")
    tiles = build_manifest(zones, session)
    if args.limit:
        tiles = tiles[: args.limit]

    total = len(tiles)
    est_gb = total * AVG_TILE_MB / 1024
    print(f"\nTiles to process: {total}")
    print(f"Estimated size:   ~{est_gb:.1f} GB  (avg {AVG_TILE_MB:.0f} MB/tile)")
    print(f"Destination:      {out_dir}")

    # Persist the manifest next to the data so a re-run / audit is cheap.
    os.makedirs(out_dir, exist_ok=True)
    manifest_path = os.path.join(out_dir, "manifest.json")
    with open(manifest_path, "w") as fh:
        json.dump({"product": PRODUCT, "zones": zones, "count": total, "tiles": tiles}, fh, indent=2)
    print(f"Manifest written: {manifest_path}")

    if args.dry_run:
        print("\n--dry-run: nothing downloaded.")
        return

    print("\nStarting downloads ...\n")
    counts = {"ok": 0, "skip_exists": 0, "failed": 0, "other": 0}
    bytes_got = 0
    t0 = time.time()
    for i, tile in enumerate(tiles, 1):
        status = download_one(tile, out_dir, session, extract=args.extract, retries=args.retries)
        fname = os.path.basename(tile["url"])
        if status == "ok":
            counts["ok"] += 1
            bytes_got += os.path.getsize(os.path.join(out_dir, fname))
            mark = "✓"
        elif status == "skip_exists":
            counts["skip_exists"] += 1
            mark = "-"
        elif status.startswith("failed") or status.startswith("http_"):
            counts["failed"] += 1
            mark = "✗"
        else:
            counts["other"] += 1
            mark = "?"
        print(f"[{i}/{total}] {mark} {fname} ({status})")
        if status == "ok" and args.delay:
            time.sleep(args.delay)

    dt = time.time() - t0
    print("\n--- DONE ---")
    print(f"Downloaded: {counts['ok']}   Skipped: {counts['skip_exists']}   "
          f"Failed: {counts['failed']}   Other: {counts['other']}")
    print(f"New bytes:  {bytes_got / (1024**3):.2f} GB in {dt/60:.1f} min")
    if counts["failed"]:
        print("Some tiles failed - re-run the same command to resume (existing files are skipped).")
        sys.exit(1)


if __name__ == "__main__":
    main()
