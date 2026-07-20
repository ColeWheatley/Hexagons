#!/usr/bin/env python3
"""Publish landing and built app shells without deleting any existing S3 key."""

from __future__ import annotations

import argparse
import hashlib
import json
import mimetypes
import re
import subprocess
from pathlib import Path

IMMUTABLE = "public, max-age=31536000, immutable"
REVALIDATE = "no-cache, no-store, must-revalidate"
SHORT = "public, max-age=300, must-revalidate"
HASHED = re.compile(r"\.[0-9a-f]{12}\.")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def metadata(path: Path) -> tuple[str, str, str | None]:
    encoding = None
    logical = path
    if path.suffix in {".br", ".gz"}:
        encoding = "br" if path.suffix == ".br" else "gzip"
        logical = path.with_suffix("")
    content_type = {
        ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
        ".json": "application/json", ".geojson": "application/geo+json",
        ".wasm": "application/wasm", ".webp": "image/webp", ".png": "image/png",
        ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".ktx2": "image/ktx2",
        ".bin": "application/octet-stream", ".woff2": "font/woff2",
    }.get(logical.suffix.lower(), mimetypes.guess_type(logical.name)[0] or "application/octet-stream")
    if logical.suffix.lower() == ".html":
        cache = REVALIDATE
    elif HASHED.search(logical.name):
        cache = IMMUTABLE
    else:
        cache = SHORT
    return content_type, cache, encoding


def run(args: list[str]) -> bytes:
    return subprocess.run(args, check=True, capture_output=True).stdout


def upload_tree(bucket: str, prefix: str, root: Path, *, exclude: set[str] | None = None) -> int:
    exclude = exclude or set()
    count = 0
    for path in sorted(item for item in root.rglob("*") if item.is_file()):
        relative = path.relative_to(root).as_posix()
        if relative in exclude or any(part == ".DS_Store" for part in path.relative_to(root).parts):
            continue
        key = f"{prefix.strip('/')}/{relative}"
        content_type, cache, encoding = metadata(path)
        digest = sha256(path)
        command = [
            "aws", "s3", "cp", str(path), f"s3://{bucket}/{key}",
            "--only-show-errors", "--content-type", content_type,
            "--cache-control", cache, "--metadata", f"sha256={digest}",
        ]
        if encoding:
            command += ["--content-encoding", encoding]
        run(command)
        head = json.loads(run([
            "aws", "s3api", "head-object", "--bucket", bucket, "--key", key,
        ]))
        if (
            int(head["ContentLength"]) != path.stat().st_size
            or head.get("ContentType") != content_type
            or head.get("CacheControl") != cache
            or head.get("Metadata", {}).get("sha256") != digest
        ):
            raise RuntimeError(f"uploaded object metadata mismatch: {key}")
        count += 1
    return count


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    root = Path(__file__).resolve().parents[1]
    parser.add_argument("--bucket", default="wheatley.cloud")
    parser.add_argument("--base-prefix", default="hexagons")
    parser.add_argument("--landing", type=Path, default=root / "frontend/landing")
    parser.add_argument("--app-dist", type=Path, default=root / "frontend/app/dist")
    args = parser.parse_args()
    landing_count = upload_tree(args.bucket, args.base_prefix, args.landing)
    # release_publish owns the mutable app manifest and flips it only after all
    # immutable run assets validate.
    app_count = upload_tree(
        args.bucket, f"{args.base_prefix}/app", args.app_dist,
        exclude={"tile_manifest.json", "tile_manifest.json.br", "tile_manifest.json.gz"},
    )
    print(json.dumps({"landing_objects": landing_count, "app_objects": app_count}))


if __name__ == "__main__":
    main()
