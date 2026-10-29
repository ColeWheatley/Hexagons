#!/usr/bin/env python3
"""Fetch the Land Tirol orthophoto sheets missing from the Hexagons corpus.

Two sets, both from https://gis.tirol.gv.at/geo/dop/<zone>/<name>:
  m28  sheets (EPSG:31254) -> aerial_tifs/        (south border block)
  m31  sheets (EPSG:31255) -> aerial_tifs_m31/    (Zillertal / east strip)

M31 sheets are kept out of aerial_tifs on purpose: the bake pipeline reads that
directory assuming EPSG:31254, so a 31255 sheet dropped there would be placed
in the wrong spot.

Idempotent and resumable: stable .part files with HTTP Range resume, size check
against Content-Length, SHA-256 recorded in a manifest, atomic rename. Network
errors (hotspot drops) are retried with backoff and never counted as failures.

usage: fetch_zillertal_sheets.py PLAN.json
PLAN.json: [{"zone": "m28"|"m31", "name": "dop_XXXX-NN_YYYY.tif"}, ...]
"""
import concurrent.futures as cf
import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.request

BASE = "https://gis.tirol.gv.at/geo/dop"
ROOT = os.path.expanduser("~/data/Hexagons")
DEST = {"m28": os.path.join(ROOT, "aerial_tifs"), "m31": os.path.join(ROOT, "aerial_tifs_m31")}
MANIFEST = os.path.join(ROOT, "zillertal_fetch_manifest.jsonl")
CHUNK = 1 << 20


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for b in iter(lambda: f.read(CHUNK), b""):
            h.update(b)
    return h.hexdigest()


def remote_size(url):
    for attempt in range(8):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, method="HEAD"), timeout=30) as r:
                return int(r.headers["Content-Length"])
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            time.sleep(2 * (attempt + 1))
        except Exception:
            time.sleep(2 * (attempt + 1))
    raise RuntimeError(f"unreachable: {url}")


def fetch(url, dest, size):
    part = dest + ".part"
    while True:
        have = os.path.getsize(part) if os.path.exists(part) else 0
        if have > size:
            os.remove(part)
            have = 0
        if have == size:
            break
        req = urllib.request.Request(url, headers={"Range": f"bytes={have}-"} if have else {})
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                if have and r.status != 206:
                    os.remove(part)
                    continue
                with open(part, "ab" if have else "wb") as f:
                    while True:
                        b = r.read(CHUNK)
                        if not b:
                            break
                        f.write(b)
        except Exception:
            time.sleep(5)  # offline / dropped connection: pause and resume, not a failure
    os.replace(part, dest)


def one(item):
    zone, name = item["zone"], item["name"]
    d = DEST[zone]
    os.makedirs(d, exist_ok=True)
    out = {"zone": zone, "name": name}
    for ext in (".tif", ".tfw"):
        fn = name[:-4] + ext
        url = f"{BASE}/{zone}/{fn}"
        dest = os.path.join(d, fn)
        size = remote_size(url)
        if size is None:
            if ext == ".tif":
                return {**out, "status": "not_found"}
            continue
        if os.path.exists(dest) and os.path.getsize(dest) == size:
            pass
        else:
            fetch(url, dest, size)
        out[ext[1:]] = {"bytes": size, "sha256": sha256(dest)}
    out["status"] = "ok"
    return out


def main():
    plan = json.load(open(sys.argv[1]))
    done = set()
    if os.path.exists(MANIFEST):
        done = {json.loads(l)["name"] for l in open(MANIFEST) if '"status": "ok"' in l}
    todo = [p for p in plan if p["name"] not in done]
    print(f"plan {len(plan)}, already done {len(plan) - len(todo)}, to fetch {len(todo)}", flush=True)
    n = 0
    with cf.ThreadPoolExecutor(6) as ex, open(MANIFEST, "a") as mf:
        for r in ex.map(one, todo):
            mf.write(json.dumps(r) + "\n")
            mf.flush()
            n += 1
            if n % 25 == 0:
                print(f"{n}/{len(todo)}", flush=True)
    print("finished", flush=True)


if __name__ == "__main__":
    main()
