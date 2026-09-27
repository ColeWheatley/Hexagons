#!/usr/bin/env python3
"""Publish brotli-compressed split parts of a release's GSP3 terrain tiles.

GSP3 tiles are 280,166 raw bytes: bytes [0, 44,864) hold every aggregate
level (L5..L1) and [44,864, 280,166) the 16,807 unit records. HTTP Range
prefixes of the raw object serve far/coarse tiles, but Range and
Content-Encoding cannot be combined, so near tiles used to pay full raw
size. This writes, per tile, `<name>.agg.bin` and `<name>.units.bin`, each
the brotli-11 encoding of exactly that span, stored with
`Content-Encoding: br` (browsers decode transparently), under a NEW prefix —
never the live app's. The viewer switches to them when the manifest's
`binary.split` block is present (see stage_next.py --tile-split).

Steps (resumable; each skips work already done):
  1. aws s3 sync the release's tiles_bin/ into WORKDIR/raw/
  2. validate + split + brotli into WORKDIR/split/ (parallel)
  3. aws s3 cp --recursive WORKDIR/split/ -> s3://BUCKET/DEST_PREFIX/ with
     Content-Encoding br, immutable caching

usage: publish_tile_split.py --manifest live|PATH --workdir DIR
       [--dest-prefix hexagons/next/releases/<release>/tiles_split] [--skip-upload]
"""
from __future__ import annotations

import argparse
import concurrent.futures as futures
import json
import os
import shutil
import struct
import subprocess
import sys
import urllib.request
from pathlib import Path

REGION = "eu-central-2"
BUCKET = "wheatley.cloud"
LIVE = "https://wheatley.cloud/hexagons/app/tile_manifest.json"
USER_AGENT = "hexagons-stage-next/1.0"
BOUNDARY = 44_864
TOTAL = 280_166
IMMUTABLE = "public, max-age=31536000, immutable"


def brotli_exe() -> str:
    return shutil.which("brotli") or "/Users/cole/dev/ml-env/.pixi/envs/default/bin/brotli"


def load_manifest(source: str) -> dict:
    if source == "live":
        request = urllib.request.Request(LIVE, headers={"User-Agent": USER_AGENT, "Cache-Control": "no-cache"})
        with urllib.request.urlopen(request, timeout=120) as response:
            return json.loads(response.read())
    return json.loads(Path(source).read_text())


def split_one(args: tuple[str, str, str]) -> tuple[str, int, int]:
    raw_path, out_dir, exe = args
    raw = Path(raw_path).read_bytes()
    if len(raw) != TOTAL or raw[:4] != b"GSP3":
        raise ValueError(f"{raw_path}: not a {TOTAL}-byte GSP3 tile")
    # depth-5 count sits exactly at the boundary: the split must be there.
    if struct.unpack_from("<I", raw, BOUNDARY)[0] != 16_807:
        raise ValueError(f"{raw_path}: unexpected layout at the aggregate/unit boundary")
    stem = Path(raw_path).stem
    sizes = []
    for part, data in (("agg", raw[:BOUNDARY]), ("units", raw[BOUNDARY:])):
        dest = Path(out_dir) / f"{stem}.{part}.bin"
        if not dest.exists():
            encoded = subprocess.run([exe, "-c", "-q", "11", "-w", "24"], input=data,
                                     capture_output=True, check=True).stdout
            tmp = dest.with_suffix(".tmp")
            tmp.write_bytes(encoded)
            os.replace(tmp, dest)
        sizes.append(dest.stat().st_size)
    return stem, sizes[0], sizes[1]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--manifest", default="live")
    parser.add_argument("--workdir", type=Path, required=True)
    parser.add_argument("--dest-prefix", default=None)
    parser.add_argument("--skip-download", action="store_true")
    parser.add_argument("--skip-upload", action="store_true")
    parser.add_argument("--jobs", type=int, default=max(2, (os.cpu_count() or 4) - 2))
    args = parser.parse_args()

    manifest = load_manifest(args.manifest)
    release = manifest["release"]["asset_release"]
    template = manifest["binary"]["url_template"]            # releases/<id>/tiles_bin/gosper_{yq}_{yr}.bin
    source_prefix = "hexagons/app/" + template.rsplit("/", 1)[0]
    dest_prefix = args.dest_prefix or f"hexagons/next/releases/{release}/tiles_split"
    if dest_prefix.startswith("hexagons/app/"):
        raise SystemExit("refusing to write into the live app prefix")
    raw_dir = args.workdir / "raw"
    split_dir = args.workdir / "split"
    raw_dir.mkdir(parents=True, exist_ok=True)
    split_dir.mkdir(parents=True, exist_ok=True)
    expected = {f"gosper_{t['yq']}_{t['yr']}.bin" for t in manifest["tiles"] if int(t.get("gspVersion", 3)) == 3}
    print(f"release {release}: {len(expected)} GSP3 tiles; s3://{BUCKET}/{source_prefix}/ -> s3://{BUCKET}/{dest_prefix}/", flush=True)

    if not args.skip_download:
        subprocess.run(["aws", "s3", "sync", f"s3://{BUCKET}/{source_prefix}/", str(raw_dir),
                        "--region", REGION, "--only-show-errors", "--exclude", "*", "--include", "gosper_*.bin"],
                       check=True)
    present = {p.name for p in raw_dir.glob("gosper_*.bin")}
    missing = expected - present
    if missing:
        raise SystemExit(f"{len(missing)} tiles missing after download, e.g. {sorted(missing)[:3]}")

    exe = brotli_exe()
    jobs = [(str(raw_dir / name), str(split_dir), exe) for name in sorted(expected)]
    agg_total = units_total = 0
    with futures.ProcessPoolExecutor(max_workers=args.jobs) as pool:
        for index, (stem, agg, units) in enumerate(pool.map(split_one, jobs, chunksize=16), 1):
            agg_total += agg
            units_total += units
            if index % 1000 == 0:
                print(f"  split {index}/{len(jobs)}", flush=True)
    raw_total = len(jobs) * TOTAL
    print(f"split done: raw {raw_total/1e9:.2f} GB -> agg {agg_total/1e6:.0f} MB + units {units_total/1e6:.0f} MB "
          f"({(agg_total + units_total) / raw_total:.1%})", flush=True)

    if not args.skip_upload:
        subprocess.run(["aws", "s3", "cp", str(split_dir), f"s3://{BUCKET}/{dest_prefix}/", "--recursive",
                        "--region", REGION, "--only-show-errors", "--exclude", "*.tmp",
                        "--content-type", "application/octet-stream", "--content-encoding", "br",
                        "--cache-control", IMMUTABLE], check=True)
        sample = sorted(expected)[0].removesuffix(".bin")
        url = f"https://wheatley.cloud/{dest_prefix}/{sample}.units.bin"
        request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept-Encoding": "br"})
        with urllib.request.urlopen(request, timeout=60) as response:
            wire = response.read()
            print(f"verify {url}: HTTP {response.status} enc={response.headers.get('Content-Encoding')} "
                  f"wire={len(wire)} B", flush=True)
    print(json.dumps({"release": release, "dest_prefix": dest_prefix, "boundary": BOUNDARY, "total": TOTAL}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
