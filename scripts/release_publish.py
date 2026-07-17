#!/usr/bin/env python3
"""Atomic S3 publication for baked Hexagons assets.

Assets are copied below ``releases/<sha256>/`` and verified before the one
mutable object, ``tile_manifest.json``, is replaced.  An interrupted publish
therefore leaves the previously live manifest (and its immutable assets) live.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import mimetypes
import os
import shutil
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any

IMMUTABLE = "public, max-age=31536000, immutable"
NO_CACHE = "no-cache, no-store, must-revalidate"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def content_type(path: Path) -> str:
    return {".ktx2": "image/ktx2", ".bin": "application/octet-stream", ".json": "application/json"}.get(
        path.suffix, mimetypes.guess_type(path.name)[0] or "application/octet-stream")


class Store:
    def put(self, source: Path, key: str, *, cache_control: str, content_type: str) -> None: raise NotImplementedError
    def head(self, key: str) -> dict[str, Any]: raise NotImplementedError
    def get(self, key: str) -> bytes: raise NotImplementedError


class LocalStore(Store):
    """Filesystem fake S3 used by tests and ``--dry-run``."""
    def __init__(self, root: Path): self.root = root
    def _path(self, key: str) -> Path: return self.root / key
    def put(self, source: Path, key: str, *, cache_control: str, content_type: str) -> None:
        target = self._path(key); target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, target)
        target.with_name(target.name + ".meta.json").write_text(json.dumps({"ContentLength": target.stat().st_size, "ContentType": content_type, "CacheControl": cache_control, "Metadata": {"sha256": sha256(target)}}))
    def head(self, key: str) -> dict[str, Any]:
        target = self._path(key)
        if not target.exists(): raise FileNotFoundError(key)
        return json.loads(target.with_name(target.name + ".meta.json").read_text())
    def get(self, key: str) -> bytes: return self._path(key).read_bytes()


class AwsStore(Store):
    def __init__(self, bucket: str, prefix: str): self.bucket, self.prefix = bucket, prefix.strip("/")
    def _url(self, key: str) -> str: return f"s3://{self.bucket}/{self.prefix}/{key}"
    def _run(self, args: list[str]) -> bytes: return subprocess.run(args, check=True, capture_output=True).stdout
    def put(self, source: Path, key: str, *, cache_control: str, content_type: str) -> None:
        self._run(["aws", "s3", "cp", str(source), self._url(key), "--only-show-errors", "--cache-control", cache_control, "--content-type", content_type, "--metadata", f"sha256={sha256(source)}"])
    def head(self, key: str) -> dict[str, Any]:
        return json.loads(self._run(["aws", "s3api", "head-object", "--bucket", self.bucket, "--key", f"{self.prefix}/{key}"]))
    def get(self, key: str) -> bytes: return self._run(["aws", "s3", "cp", self._url(key), "-"])


@dataclass(frozen=True)
class Asset:
    local: Path
    logical: str


def referenced_assets(manifest: dict[str, Any], root: Path) -> list[Asset]:
    assets = [Asset(root / "tiles_bin" / f"gosper_{tile['yq']}_{tile['yr']}.bin", f"tiles_bin/gosper_{tile['yq']}_{tile['yr']}.bin") for tile in manifest.get("tiles", [])]
    contract = manifest.get("texture_pages", {})
    for page in contract.get("pages", []):
        for tier in contract.get("tiers", []):
            name = f"texture_{page['page_x']}_{page['page_y']}.ktx2"
            assets.append(Asset(root / "aerial_pages" / tier["name"] / name, f"aerial_pages/{tier['name']}/{name}"))
    return assets


def reject_diagnostics(manifest: dict[str, Any]) -> None:
    if manifest.get("texture_pages", {}).get("diagnostic_tattoos"):
        raise ValueError("refusing diagnostic-tattoo manifest")


def decode_sample(asset: Asset, payload: bytes) -> None:
    if asset.logical.endswith(".ktx2") and payload[:12] != b"\xabKTX 20\xbb\r\n\x1a\n":
        raise ValueError(f"{asset.logical}: not a KTX2 payload")
    if asset.logical.endswith(".bin") and payload[:4] not in {b"GSP1", b"GSP2", b"GSP3"}:
        raise ValueError(f"{asset.logical}: not a GSP payload")


def release_id(manifest_path: Path, assets: list[Asset]) -> str:
    digest = hashlib.sha256(manifest_path.read_bytes())
    for asset in sorted(assets, key=lambda item: item.logical): digest.update(asset.logical.encode() + bytes.fromhex(sha256(asset.local)))
    return digest.hexdigest()[:20]


def version_manifest(manifest: dict[str, Any], release: str) -> dict[str, Any]:
    result = json.loads(json.dumps(manifest))
    result.setdefault("release", {})["asset_release"] = release
    result.setdefault("binary", {})["url_template"] = f"releases/{release}/tiles_bin/gosper_{{yq}}_{{yr}}.bin"
    result.setdefault("texture_pages", {})["url_template"] = f"releases/{release}/aerial_pages/{{tier}}/texture_{{page_x}}_{{page_y}}.ktx2"
    return result


def verify(store: Store, key: str, asset: Asset, cache_control: str) -> None:
    head = store.head(key)
    if int(head["ContentLength"]) != asset.local.stat().st_size or head.get("ContentType") != content_type(asset.local) or head.get("CacheControl") != cache_control:
        raise ValueError(f"head verification failed for {key}")
    if head.get("Metadata", {}).get("sha256") != sha256(asset.local) or sha256_bytes(store.get(key)) != sha256(asset.local):
        raise ValueError(f"hash verification failed for {key}")
    decode_sample(asset, store.get(key))


def sha256_bytes(payload: bytes) -> str: return hashlib.sha256(payload).hexdigest()


def publish(manifest_path: Path, app_root: Path, store: Store, *, interrupt_after: int | None = None) -> str:
    manifest = json.loads(manifest_path.read_text())
    reject_diagnostics(manifest)
    assets = referenced_assets(manifest, app_root)
    missing = [str(item.local) for item in assets if not item.local.is_file()]
    if missing: raise FileNotFoundError("manifest references missing assets: " + ", ".join(missing))
    release = release_id(manifest_path, assets)
    staged = version_manifest(manifest, release)
    with tempfile.TemporaryDirectory() as temp:
        staged_path = Path(temp) / "tile_manifest.json"; staged_path.write_text(json.dumps(staged, separators=(",", ":")))
        staged_asset = Asset(staged_path, "tile_manifest.json")
        for index, asset in enumerate(assets, 1):
            key = f"releases/{release}/{asset.logical}"
            store.put(asset.local, key, cache_control=IMMUTABLE, content_type=content_type(asset.local))
            verify(store, key, asset, IMMUTABLE)
            if interrupt_after == index: raise RuntimeError("simulated interrupted upload")
        staged_key = f"releases/{release}/tile_manifest.json"
        store.put(staged_path, staged_key, cache_control=IMMUTABLE, content_type="application/json")
        verify(store, staged_key, staged_asset, IMMUTABLE)
        # This is intentionally the only mutable write and happens last.
        store.put(staged_path, "tile_manifest.json", cache_control=NO_CACHE, content_type="application/json")
        verify(store, "tile_manifest.json", staged_asset, NO_CACHE)
    return release


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, default=Path("frontend/app/tile_manifest.json"))
    parser.add_argument("--app-root", type=Path, default=Path("frontend/app"))
    parser.add_argument("--bucket"); parser.add_argument("--prefix", default="powfinder/app")
    parser.add_argument("--dry-run", action="store_true", help="publish to a temporary local fake-S3 only")
    parser.add_argument("--fake-s3", type=Path, help="filesystem fake-S3 root (never contacts AWS)")
    args = parser.parse_args()
    if args.fake_s3: store: Store = LocalStore(args.fake_s3)
    elif args.dry_run: store = LocalStore(Path(tempfile.mkdtemp(prefix="hexagons-fake-s3-")))
    elif args.bucket: store = AwsStore(args.bucket, args.prefix)
    else: parser.error("provide --bucket for S3 or --dry-run/--fake-s3 for local verification")
    print(f"published release {publish(args.manifest, args.app_root, store)}")

if __name__ == "__main__": main()
