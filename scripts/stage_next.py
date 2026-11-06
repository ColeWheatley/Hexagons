#!/usr/bin/env python3
"""Stage a candidate app shell at /hexagons/next/ that reuses a live release.

Writes ONLY under <bucket>/<base-prefix>/next/ (Cloudflare R2, see r2_target.py) — never the live /app/.
The candidate shell reads a compact, content-addressed manifest whose asset
url templates point at the existing immutable release under /hexagons/app/,
so no terrain or imagery is copied.

  1. compact the source manifest (default: the live release's) with
     --asset-base /hexagons/app/ and verify the round trip;
  2. upload it pre-brotli'd as next/releases/<release>/manifest.<sha12>.json
     (immutable, Content-Encoding: br);
  3. upload the built dist shell (html/js/css/wasm/fonts; never data symlinks
     or manifests) with the same metadata rules as scripts/publish_site.py;
  4. write the no-store pointer next/tile_manifest.json LAST;
  5. verify through the public URL.

Usage: stage_next.py [--source-manifest URL|PATH] [--dist frontend/app/dist] [--dry-run]
"""
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import compact_manifest  # noqa: E402
import r2_target  # noqa: E402
from publish_site import IMMUTABLE, REVALIDATE, metadata, sha256  # noqa: E402

LIVE_MANIFEST = "https://wheatley.cloud/hexagons/app/tile_manifest.json"
PUBLIC = "https://wheatley.cloud"
# Cloudflare rejects Python's default urllib user agent with 403.
USER_AGENT = "hexagons-stage-next/1.0"


# Hashed, immutable shell assets are uploaded as max-quality brotli with
# Content-Encoding: br instead of relying on Cloudflare's on-the-fly level
# (measured: main.js 268 -> 220 KB, transcoder wasm 408 -> 326 KB on the wire).
PRECOMPRESS_SUFFIXES = {".js", ".wasm", ".css", ".json", ".svg"}


def precompress(path: Path, cache: str, encoding: str | None) -> bool:
    return cache == IMMUTABLE and not encoding and path.suffix in PRECOMPRESS_SUFFIXES


def run(args: list[str], dry: bool) -> None:
    if args[:1] == ["aws"] and "--endpoint-url" not in args:
        args = r2_target.aws(*args[1:])  # R2 endpoint/profile/region; the one place is r2_target.py
    print(("DRY " if dry else "") + " ".join(args))
    if not dry:
        result = subprocess.run(args, capture_output=True, text=True, env=r2_target.aws_env())
        if result.returncode != 0:
            raise SystemExit(f"command failed ({result.returncode}): {' '.join(args)}\n{result.stderr.strip()}")


def load_manifest(source: str) -> dict:
    if source.startswith("http"):
        request = urllib.request.Request(source, headers={"Cache-Control": "no-cache", "User-Agent": USER_AGENT})
        with urllib.request.urlopen(request, timeout=120) as response:
            return json.loads(response.read())
    return json.loads(Path(source).read_text())


def brotli(data: bytes) -> bytes:
    exe = shutil.which("brotli") or "/Users/cole/dev/ml-env/.pixi/envs/default/bin/brotli"
    return subprocess.run([exe, "-c", "-q", "11", "-w", "24"], input=data, capture_output=True, check=True).stdout


def put_bytes(bucket: str, key: str, data: bytes, *, content_type: str, cache: str,
              encoding: str | None, dry: bool) -> None:
    with tempfile.NamedTemporaryFile(delete=False) as handle:
        handle.write(data)
        path = handle.name
    command = ["aws", "s3", "cp", path, f"s3://{bucket}/{key}", "--only-show-errors",
               "--content-type", content_type, "--cache-control", cache,
               "--metadata", f"sha256={hashlib.sha256(data).hexdigest()}"]
    if encoding:
        command += ["--content-encoding", encoding]
    run(command, dry)
    Path(path).unlink(missing_ok=True)


def upload_shell(bucket: str, prefix: str, dist: Path, dry: bool, manifest_rel: str | None = None) -> int:
    count = 0
    # index.html goes LAST: it is the atomic switch. Uploading it before the
    # hashed bundles it references would 404 anyone loading in between.
    files = sorted((p for p in dist.rglob("*") if p.is_file()),
                   key=lambda p: (p.relative_to(dist).as_posix() == "index.html", p.as_posix()))
    for path in files:
        rel = path.relative_to(dist)
        # Never data (symlinked tiles/pages) or manifests: the pointer is ours.
        if any(part in {"tiles_bin", "aerial_pages", ".DS_Store"} for part in rel.parts):
            continue
        if rel.name.startswith("tile_manifest.json"):
            continue
        if any(parent.is_symlink() for parent in [dist / Path(*rel.parts[:i]) for i in range(1, len(rel.parts))]):
            continue
        # Browsers never request the .br/.gz siblings (the bucket cannot negotiate);
        # Cloudflare compresses text on the fly.
        if path.suffix in {".br", ".gz"}:
            continue
        if rel.as_posix() == "index.html" and manifest_rel:
            staged_html = Path(tempfile.mkdtemp()) / "index.html"
            staged_html.write_text(declare_manifest(path.read_text(), manifest_rel))
            path = staged_html
        content_type, cache, encoding = metadata(path)
        if precompress(path, cache, encoding):
            put_bytes(bucket, f"{prefix}/{rel.as_posix()}", brotli(path.read_bytes()),
                      content_type=content_type, cache=cache, encoding="br", dry=dry)
            count += 1
            continue
        command = ["aws", "s3", "cp", str(path), f"s3://{bucket}/{prefix}/{rel.as_posix()}",
                   "--only-show-errors", "--content-type", content_type, "--cache-control", cache,
                   "--metadata", f"sha256={sha256(path)}"]
        if encoding:
            command += ["--content-encoding", encoding]
        run(command, dry)
        count += 1
    return count


def declare_manifest(html: str, manifest_rel: str) -> str:
    """Point the shell straight at the immutable manifest and preload it."""
    import re
    tags = (f'<meta name="hexagons-manifest" content="{manifest_rel}">\n    '
            f'<link rel="preload" href="{manifest_rel}" as="fetch" crossorigin="anonymous" fetchpriority="high">')
    html, count = re.subn(r'<link rel="preload" href="tile_manifest\.json[^"]*"[^>]*>', tags, html, count=1)
    if count != 1:
        raise SystemExit("could not find the manifest preload in index.html")
    return html


def write_local(out: Path, dist: Path, manifest_rel: str, payload: bytes, encoded: bytes,
                pointer: dict, skip_shell: bool) -> int:
    out.mkdir(parents=True, exist_ok=True)
    if not skip_shell:
        for path in sorted(p for p in dist.rglob("*") if p.is_file()):
            rel = path.relative_to(dist)
            if any(part in {"tiles_bin", "aerial_pages", ".DS_Store"} for part in rel.parts):
                continue
            if rel.name.startswith("tile_manifest.json"):
                continue
            if rel.name in {"index.html.br", "index.html.gz"}:
                continue
            target = out / rel
            target.parent.mkdir(parents=True, exist_ok=True)
            if rel.as_posix() == "index.html":
                target.write_text(declare_manifest(path.read_text(), manifest_rel))
                continue
            shutil.copy2(path, target)
            content_type, cache, encoding = metadata(path)
            sibling = target.with_name(target.name + ".br")
            if precompress(path, cache, encoding) and not (dist / rel).with_name(rel.name + ".br").exists():
                sibling.write_bytes(brotli(path.read_bytes()))  # what the bucket object will carry
    manifest_path = out / manifest_rel
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_bytes(payload)
    manifest_path.with_name(manifest_path.name + ".br").write_bytes(encoded)
    (out / "tile_manifest.json").write_text(json.dumps(pointer, separators=(",", ":")))
    print(f"staged locally at {out}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--bucket", default=r2_target.BUCKET)
    parser.add_argument("--base-prefix", default="hexagons")
    parser.add_argument("--source-manifest", default=LIVE_MANIFEST)
    parser.add_argument("--asset-base", default="/hexagons/app/")
    parser.add_argument("--dist", type=Path, default=ROOT / "frontend/app/dist")
    parser.add_argument("--skip-shell", action="store_true", help="only (re)publish the manifest + pointer")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--target", choices=("next", "app"), default="next",
                        help="publish path under --base-prefix; 'app' is the LIVE site")
    parser.add_argument("--promote-live", action="store_true",
                        help="required together with --target app")
    parser.add_argument("--tile-split", default=None,
                        help="URL template of brotli split tile parts published by publish_tile_split.py, "
                             "e.g. /hexagons/next/releases/<release>/tiles_split/gosper_{yq}_{yr}.{part}.bin")
    parser.add_argument("--local-out", type=Path, default=None,
                        help="write the staged tree to this directory instead of the bucket (for netlab A/B)")
    args = parser.parse_args()
    prefix = f"{args.base_prefix}/{args.target}"
    if args.target == "app" and not args.promote_live:
        raise SystemExit("refusing to publish to the LIVE app prefix without --promote-live")

    source = load_manifest(args.source_manifest)
    release = source.get("release", {}).get("asset_release")
    if not release:
        raise SystemExit("source manifest has no release.asset_release")
    full = json.loads(json.dumps(source))
    compact_manifest.rebase_urls(full, args.asset_base)
    if args.tile_split:
        full.setdefault("binary", {})["split"] = {
            "url_template": args.tile_split.replace("<release>", release),
            "boundary": 44_864,        # end of the depth-4 aggregate block
            "total": 280_166,          # GSP3 tile size
            "range_max_end": 6_444,    # up to depth 3, raw Range prefixes are cheaper
            "encoding": "br",
        }
    compact = compact_manifest.compact(full)
    payload = json.dumps(compact, separators=(",", ":")).encode()
    diffs = compact_manifest.equivalent(full, compact_manifest.expand(json.loads(payload)))
    if diffs:
        raise SystemExit("compact manifest round trip failed:\n  " + "\n  ".join(diffs[:10]))
    digest = hashlib.sha256(payload).hexdigest()[:12]
    manifest_rel = f"releases/{release}/manifest.{digest}.json"
    encoded = brotli(payload)
    print(f"compact manifest {len(payload):,} B raw, {len(encoded):,} B br -> {prefix}/{manifest_rel}")

    pointer = {"manifest_url": manifest_rel, "release": {"asset_release": release},
               "source": args.source_manifest}
    if args.local_out:
        return write_local(args.local_out, args.dist, manifest_rel, payload, encoded, pointer, args.skip_shell)

    put_bytes(args.bucket, f"{prefix}/{manifest_rel}", encoded, content_type="application/json",
              cache=IMMUTABLE, encoding="br", dry=args.dry_run)
    if not args.skip_shell:
        if not (args.dist / "index.html").is_file():
            raise SystemExit(f"no built shell at {args.dist}; run `node frontend/app/build.mjs` first")
        count = upload_shell(args.bucket, prefix, args.dist, args.dry_run, manifest_rel)
        print(f"uploaded {count} shell objects")
    if args.target == "app":
        # Old (v1) shells still open in browsers fetch app/tile_manifest.json
        # and need the FULL manifest; the new shell reads the manifest URL
        # from index.html, so leave the live pointer/manifest untouched.
        print("target app: leaving hexagons/app/tile_manifest.json untouched for old shells")
    else:
        put_bytes(args.bucket, f"{prefix}/tile_manifest.json",
                  json.dumps(pointer, separators=(",", ":")).encode(), content_type="application/json",
                  cache=REVALIDATE, encoding=None, dry=args.dry_run)
    if args.dry_run:
        return 0

    # Verify through the public edge exactly as a browser would.
    checks = [(f"{prefix}/{manifest_rel}", "manifest"), (f"{prefix}/", "index.html")]
    if args.target != "app":
        checks.insert(0, (f"{prefix}/tile_manifest.json", "pointer"))
    for rel, check in checks:
        request = urllib.request.Request(f"{PUBLIC}/{rel}", headers={"Accept-Encoding": "br", "User-Agent": USER_AGENT})
        with urllib.request.urlopen(request, timeout=60) as response:
            body = response.read()
            print(f"verify {check}: HTTP {response.status} {len(body):,} B "
                  f"encoding={response.headers.get('Content-Encoding')} cache={response.headers.get('Cache-Control')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
