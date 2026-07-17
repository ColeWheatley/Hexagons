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
    return {".ktx2": "image/ktx2", ".webp": "image/webp", ".bin": "application/octet-stream", ".json": "application/json"}.get(
        path.suffix, mimetypes.guess_type(path.name)[0] or "application/octet-stream")


class Store:
    def put(self, source: Path, key: str, *, cache_control: str, content_type: str,
            sha256_hex: str | None = None) -> None: raise NotImplementedError
    def head(self, key: str) -> dict[str, Any]: raise NotImplementedError
    def get(self, key: str) -> bytes: raise NotImplementedError


class LocalStore(Store):
    """Filesystem fake S3 used by tests and ``--dry-run``."""
    def __init__(self, root: Path): self.root = root
    def _path(self, key: str) -> Path: return self.root / key
    def put(self, source: Path, key: str, *, cache_control: str, content_type: str,
            sha256_hex: str | None = None) -> None:
        target = self._path(key); target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, target)
        target.with_name(target.name + ".meta.json").write_text(json.dumps({"ContentLength": target.stat().st_size, "ContentType": content_type, "CacheControl": cache_control, "Metadata": {"sha256": sha256_hex or sha256(target)}}))
    def head(self, key: str) -> dict[str, Any]:
        target = self._path(key)
        if not target.exists(): raise FileNotFoundError(key)
        return json.loads(target.with_name(target.name + ".meta.json").read_text())
    def get(self, key: str) -> bytes: return self._path(key).read_bytes()


class AwsStore(Store):
    def __init__(self, bucket: str, prefix: str): self.bucket, self.prefix = bucket, prefix.strip("/")
    def _url(self, key: str) -> str: return f"s3://{self.bucket}/{self.prefix}/{key}"
    def _run(self, args: list[str]) -> bytes: return subprocess.run(args, check=True, capture_output=True).stdout
    def put(self, source: Path, key: str, *, cache_control: str, content_type: str,
            sha256_hex: str | None = None) -> None:
        digest = sha256_hex or sha256(source)
        self._run(["aws", "s3", "cp", str(source), self._url(key), "--only-show-errors", "--cache-control", cache_control, "--content-type", content_type, "--metadata", f"sha256={digest}"])
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
        if contract.get("bootstrap"):
            name = f"texture_{page['page_x']}_{page['page_y']}.webp"
            assets.append(Asset(root / "aerial_pages" / "bootstrap" / name,
                                f"aerial_pages/bootstrap/{name}"))
        for tier in contract.get("tiers", []):
            name = f"texture_{page['page_x']}_{page['page_y']}.ktx2"
            assets.append(Asset(root / "aerial_pages" / tier["name"] / name, f"aerial_pages/{tier['name']}/{name}"))
    return assets


def reject_diagnostics(manifest: dict[str, Any], *, allow_beta_diagnostics: bool = False) -> None:
    """Keep diagnostics out of production, with an explicit beta-only escape hatch."""
    if not manifest.get("texture_pages", {}).get("diagnostic_tattoos"):
        return
    release = manifest.get("release", {})
    is_beta_stubai = (
        release.get("mode") == "beta"
        and release.get("profile") == "beta-stubai"
        and release.get("coverage_profile") == "stubai-small-square"
    )
    if not (allow_beta_diagnostics and is_beta_stubai):
        raise ValueError("refusing diagnostic-tattoo manifest")


def decode_sample(asset: Asset, payload: bytes) -> None:
    if asset.logical.endswith(".ktx2") and payload[:12] != b"\xabKTX 20\xbb\r\n\x1a\n":
        raise ValueError(f"{asset.logical}: not a KTX2 payload")
    if asset.logical.endswith(".bin") and payload[:4] not in {b"GSP1", b"GSP2", b"GSP3"}:
        raise ValueError(f"{asset.logical}: not a GSP payload")
    if asset.logical.endswith(".webp") and not (
        payload[:4] == b"RIFF" and payload[8:12] == b"WEBP"
    ):
        raise ValueError(f"{asset.logical}: not a WebP payload")


def release_id(manifest_path: Path, assets: list[Asset], digests: dict[str, str]) -> str:
    digest = hashlib.sha256(manifest_path.read_bytes())
    for asset in sorted(assets, key=lambda item: item.logical):
        digest.update(asset.logical.encode() + bytes.fromhex(digests[asset.logical]))
    return digest.hexdigest()[:20]


def version_manifest(manifest: dict[str, Any], release: str) -> dict[str, Any]:
    result = json.loads(json.dumps(manifest))
    result.setdefault("release", {})["asset_release"] = release
    result.setdefault("binary", {})["url_template"] = f"releases/{release}/tiles_bin/gosper_{{yq}}_{{yr}}.bin"
    texture_contract = result.setdefault("texture_pages", {})
    texture_contract["url_template"] = f"releases/{release}/aerial_pages/{{tier}}/texture_{{page_x}}_{{page_y}}.ktx2"
    if texture_contract.get("bootstrap"):
        texture_contract["bootstrap"]["url_template"] = (
            f"releases/{release}/aerial_pages/bootstrap/texture_{{page_x}}_{{page_y}}.webp"
        )
    tier_names = [tier["name"] for tier in texture_contract.get("tiers", [])]
    for page in texture_contract.get("pages", []):
        page["urls"] = {
            tier: f"releases/{release}/aerial_pages/{tier}/texture_{page['page_x']}_{page['page_y']}.ktx2"
            for tier in tier_names
        }
        if texture_contract.get("bootstrap"):
            page["urls"]["bootstrap"] = (
                f"releases/{release}/aerial_pages/bootstrap/texture_{page['page_x']}_{page['page_y']}.webp"
            )
    return result


def verify(store: Store, key: str, asset: Asset, cache_control: str,
           expected_sha: str | None = None, *, decode: bool = False) -> None:
    expected_sha = expected_sha or sha256(asset.local)
    head = store.head(key)
    if int(head["ContentLength"]) != asset.local.stat().st_size or head.get("ContentType") != content_type(asset.local) or head.get("CacheControl") != cache_control:
        raise ValueError(f"head verification failed for {key}")
    payload = store.get(key)
    if head.get("Metadata", {}).get("sha256") != expected_sha or sha256_bytes(payload) != expected_sha:
        raise ValueError(f"hash verification failed for {key}")
    if decode:
        decode_sample(asset, payload)


def sha256_bytes(payload: bytes) -> str: return hashlib.sha256(payload).hexdigest()


def publish(manifest_path: Path, app_root: Path, store: Store, *, interrupt_after: int | None = None,
            allow_beta_diagnostics: bool = False) -> str:
    manifest = json.loads(manifest_path.read_text())
    reject_diagnostics(manifest, allow_beta_diagnostics=allow_beta_diagnostics)
    assets = referenced_assets(manifest, app_root)
    missing = [str(item.local) for item in assets if not item.local.is_file()]
    if missing: raise FileNotFoundError("manifest references missing assets: " + ", ".join(missing))
    digests = {asset.logical: sha256(asset.local) for asset in assets}
    release = release_id(manifest_path, assets, digests)
    staged = version_manifest(manifest, release)
    with tempfile.TemporaryDirectory() as temp:
        staged_path = Path(temp) / "tile_manifest.json"; staged_path.write_text(json.dumps(staged, separators=(",", ":")))
        staged_asset = Asset(staged_path, "tile_manifest.json")
        staged_sha = sha256(staged_path)
        decoded_types: set[str] = set()
        for index, asset in enumerate(assets, 1):
            key = f"releases/{release}/{asset.logical}"
            digest = digests[asset.logical]
            store.put(asset.local, key, cache_control=IMMUTABLE,
                      content_type=content_type(asset.local), sha256_hex=digest)
            suffix = asset.local.suffix.lower()
            verify(store, key, asset, IMMUTABLE, digest,
                   decode=suffix in {".bin", ".ktx2", ".webp"} and suffix not in decoded_types)
            decoded_types.add(suffix)
            if interrupt_after == index: raise RuntimeError("simulated interrupted upload")
        staged_key = f"releases/{release}/tile_manifest.json"
        store.put(staged_path, staged_key, cache_control=IMMUTABLE,
                  content_type="application/json", sha256_hex=staged_sha)
        verify(store, staged_key, staged_asset, IMMUTABLE, staged_sha)
        # This is intentionally the only mutable write and happens last.
        store.put(staged_path, "tile_manifest.json", cache_control=NO_CACHE,
                  content_type="application/json", sha256_hex=staged_sha)
        verify(store, "tile_manifest.json", staged_asset, NO_CACHE, staged_sha)
    return release


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, default=Path("frontend/app/tile_manifest.json"))
    parser.add_argument("--app-root", type=Path, default=Path("frontend/app"))
    parser.add_argument("--bucket"); parser.add_argument("--prefix", default="powfinder/app")
    parser.add_argument("--allow-beta-diagnostics", action="store_true",
                        help="allow diagnostic tattoos only for the beta-stubai manifest")
    parser.add_argument("--dry-run", action="store_true", help="publish to a temporary local fake-S3 only")
    parser.add_argument("--fake-s3", type=Path, help="filesystem fake-S3 root (never contacts AWS)")
    args = parser.parse_args()
    if args.fake_s3: store: Store = LocalStore(args.fake_s3)
    elif args.dry_run: store = LocalStore(Path(tempfile.mkdtemp(prefix="hexagons-fake-s3-")))
    elif args.bucket: store = AwsStore(args.bucket, args.prefix)
    else: parser.error("provide --bucket for S3 or --dry-run/--fake-s3 for local verification")
    print(f"published release {publish(args.manifest, args.app_root, store, allow_beta_diagnostics=args.allow_beta_diagnostics)}")

if __name__ == "__main__": main()
