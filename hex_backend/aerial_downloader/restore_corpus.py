#!/usr/bin/env python3
"""Restore the audited Tirol orthophoto corpus transactionally.

The source inventory records the filename, byte count, and full SHA-256 of the
3,486-file corpus that was verified on Rechner.  Existing files and optional
seed directories are accepted only after size and digest validation. Downloads
use stable partial files, HTTP range resumption, bounded concurrency, and an
atomic final rename on the destination filesystem.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import hashlib
import json
import os
import shutil
import threading
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import requests


DEFAULT_BASE_URL = "https://gis.tirol.gv.at/geo/dop/m28"
EXPECTED_FILES = 3_486
EXPECTED_BYTES = 26_417_719_175
CHUNK_BYTES = 4 * 1024 * 1024


@dataclass(frozen=True)
class SourceAsset:
    name: str
    size: int
    sha256: str


def load_inventory(path: Path) -> list[SourceAsset]:
    assets: list[SourceAsset] = []
    seen: set[str] = set()
    for line_number, raw in enumerate(path.read_text().splitlines(), 1):
        parts = raw.split("\t")
        if len(parts) != 3:
            raise ValueError(f"{path}:{line_number}: expected name, bytes, sha256")
        name, size_text, digest = parts
        if name in seen:
            raise ValueError(f"{path}:{line_number}: duplicate {name}")
        if not name.startswith("dop_") or not name.endswith("_2023.tif"):
            raise ValueError(f"{path}:{line_number}: unexpected filename {name!r}")
        if len(digest) != 64 or any(char not in "0123456789abcdef" for char in digest):
            raise ValueError(f"{path}:{line_number}: invalid SHA-256")
        assets.append(SourceAsset(name=name, size=int(size_text), sha256=digest))
        seen.add(name)
    if len(assets) != EXPECTED_FILES or sum(asset.size for asset in assets) != EXPECTED_BYTES:
        raise ValueError(
            f"inventory identity mismatch: expected {EXPECTED_FILES} files / "
            f"{EXPECTED_BYTES} bytes, found {len(assets)} / {sum(a.size for a in assets)}"
        )
    return assets


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        while chunk := source.read(CHUNK_BYTES):
            digest.update(chunk)
    return digest.hexdigest()


def valid_asset(path: Path, asset: SourceAsset) -> bool:
    return path.is_file() and path.stat().st_size == asset.size and sha256_file(path) == asset.sha256


def write_json_atomic(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    temporary.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n")
    os.replace(temporary, path)


class RestoreState:
    def __init__(self, report: Path, total_files: int, total_bytes: int) -> None:
        self.report = report
        self.lock = threading.Lock()
        self.started = time.time()
        self.data: dict[str, Any] = {
            "schema_version": 1,
            "started_at_epoch": self.started,
            "total_files": total_files,
            "total_bytes": total_bytes,
            "verified_files": 0,
            "verified_bytes": 0,
            "existing_files": 0,
            "seeded_files": 0,
            "downloaded_files": 0,
            "resumed_files": 0,
            "failed_files": 0,
            "failures": {},
            "completed": False,
        }
        write_json_atomic(self.report, self.snapshot())

    def snapshot(self) -> dict[str, Any]:
        now = time.time()
        result = dict(self.data)
        elapsed = max(now - self.started, 0.001)
        result["updated_at_epoch"] = now
        result["elapsed_seconds"] = elapsed
        result["verified_mib_per_second"] = result["verified_bytes"] / (1024**2) / elapsed
        remaining = max(result["total_bytes"] - result["verified_bytes"], 0)
        rate = result["verified_bytes"] / elapsed
        result["eta_seconds"] = remaining / rate if rate > 0 else None
        return result

    def record(self, asset: SourceAsset, outcome: str, error: str | None = None) -> None:
        with self.lock:
            if error is None:
                self.data["verified_files"] += 1
                self.data["verified_bytes"] += asset.size
                self.data[f"{outcome}_files"] += 1
                self.data["failures"].pop(asset.name, None)
            else:
                self.data["failed_files"] += 1
                self.data["failures"][asset.name] = error
            write_json_atomic(self.report, self.snapshot())
            done = self.data["verified_files"] + self.data["failed_files"]
            if done == 1 or done % 25 == 0 or error:
                snapshot = self.snapshot()
                print(
                    f"[{done}/{snapshot['total_files']}] verified="
                    f"{snapshot['verified_files']} failed={snapshot['failed_files']} "
                    f"rate={snapshot['verified_mib_per_second']:.1f} MiB/s "
                    f"eta={snapshot['eta_seconds'] or 0:.0f}s",
                    flush=True,
                )

    def finish(self) -> None:
        with self.lock:
            self.data["completed"] = self.data["verified_files"] == self.data["total_files"]
            self.data["completed_at_epoch"] = time.time()
            write_json_atomic(self.report, self.snapshot())


def seed_asset(asset: SourceAsset, destination: Path, seeds: list[Path]) -> bool:
    for directory in seeds:
        candidate = directory / asset.name
        if not valid_asset(candidate, asset):
            continue
        partial = destination.with_name(f".{destination.name}.seed.{os.getpid()}.{threading.get_ident()}")
        try:
            try:
                os.link(candidate, partial)
            except OSError:
                shutil.copyfile(candidate, partial)
            if not valid_asset(partial, asset):
                raise RuntimeError("seed changed during copy")
            os.replace(partial, destination)
            return True
        finally:
            partial.unlink(missing_ok=True)
    return False


def download_asset(
    asset: SourceAsset,
    destination: Path,
    *,
    base_url: str,
    retries: int,
    timeout: float,
) -> bool:
    partial = destination.with_name(f".{destination.name}.part")
    resumed = False
    for attempt in range(1, retries + 1):
        try:
            offset = partial.stat().st_size if partial.exists() else 0
            if offset > asset.size:
                partial.unlink()
                offset = 0
            headers = {"Range": f"bytes={offset}-"} if offset else {}
            with requests.get(
                f"{base_url.rstrip('/')}/{asset.name}",
                headers=headers,
                stream=True,
                timeout=(10, timeout),
            ) as response:
                if offset and response.status_code == 206:
                    mode = "ab"
                    resumed = True
                elif response.status_code == 200:
                    mode = "wb"
                    offset = 0
                else:
                    response.raise_for_status()
                    raise RuntimeError(f"unexpected HTTP status {response.status_code}")
                with partial.open(mode) as target:
                    for chunk in response.iter_content(chunk_size=CHUNK_BYTES):
                        if chunk:
                            target.write(chunk)
                    target.flush()
                    os.fsync(target.fileno())
            if partial.stat().st_size != asset.size:
                raise RuntimeError(
                    f"size mismatch: expected {asset.size}, received {partial.stat().st_size}"
                )
            digest = sha256_file(partial)
            if digest != asset.sha256:
                partial.unlink(missing_ok=True)
                raise RuntimeError(f"SHA-256 mismatch: expected {asset.sha256}, received {digest}")
            os.replace(partial, destination)
            return resumed
        except Exception:
            if attempt == retries:
                raise
            time.sleep(min(2 ** (attempt - 1), 30))
    raise AssertionError("unreachable")


def restore_one(
    asset: SourceAsset,
    *,
    destination_dir: Path,
    seeds: list[Path],
    base_url: str,
    retries: int,
    timeout: float,
) -> str:
    destination = destination_dir / asset.name
    if valid_asset(destination, asset):
        return "existing"
    if destination.exists():
        destination.unlink()
    if seed_asset(asset, destination, seeds):
        return "seeded"
    resumed = download_asset(
        asset,
        destination,
        base_url=base_url,
        retries=retries,
        timeout=timeout,
    )
    return "resumed" if resumed else "downloaded"


def main() -> int:
    repo = Path(__file__).resolve().parents[2]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--inventory", type=Path, default=repo / "hex_backend/aerial_source_inventory.tsv"
    )
    parser.add_argument("--destination", type=Path, required=True)
    parser.add_argument("--seed", type=Path, action="append", default=[])
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    parser.add_argument("--workers", type=int, default=8)
    parser.add_argument("--retries", type=int, default=5)
    parser.add_argument("--timeout", type=float, default=120.0)
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()
    if args.workers < 1 or args.workers > 32:
        parser.error("--workers must be between 1 and 32")

    assets = load_inventory(args.inventory.resolve())
    destination = args.destination.resolve()
    destination.mkdir(parents=True, exist_ok=True)
    report = (args.report or destination / "restore-report.json").resolve()
    state = RestoreState(report, len(assets), sum(asset.size for asset in assets))
    print(
        f"Restoring {len(assets)} files / {sum(a.size for a in assets)} bytes "
        f"to {destination} with {args.workers} workers",
        flush=True,
    )

    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {
            executor.submit(
                restore_one,
                asset,
                destination_dir=destination,
                seeds=[path.resolve() for path in args.seed],
                base_url=args.base_url,
                retries=args.retries,
                timeout=args.timeout,
            ): asset
            for asset in assets
        }
        for future in concurrent.futures.as_completed(futures):
            asset = futures[future]
            try:
                state.record(asset, future.result())
            except Exception as exc:
                state.record(asset, "downloaded", error=f"{type(exc).__name__}: {exc}")

    state.finish()
    snapshot = state.snapshot()
    print(json.dumps(snapshot, indent=2, sort_keys=True), flush=True)
    return 0 if snapshot["completed"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
