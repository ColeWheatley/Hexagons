#!/usr/bin/env python3
"""Shared helpers for the HEX4 regression harness."""

from __future__ import annotations

import hashlib
import json
import math
import os
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Iterable


THIS_DIR = Path(__file__).resolve().parent
REPO_ROOT = THIS_DIR.parents[1]
HEX_BACKEND = REPO_ROOT / "hex_backend"
FIXTURES_DIR = THIS_DIR / "fixtures"
BINS_DIR = FIXTURES_DIR / "bins"
GOLDEN_DIR = THIS_DIR / "golden"
DEM_PATH = REPO_ROOT / "hex_backend" / "DGM_Tirol_5m_epsg31254_2006_2020.tif"

SECTOR_SIZE_METERS = 819.2
UNIT_HEX_WIDTH_METERS = 6.4
LAYER_SCALES = (24.0, 6.0, 3.0, 1.0)
RECORD_SIZE = 16
HEADER_SIZE = 32


def ensure_repo_on_path() -> None:
    """Make repo-local imports work when a test file is run directly."""
    for path in (str(REPO_ROOT), str(HEX_BACKEND), str(THIS_DIR)):
        if path not in sys.path:
            sys.path.insert(0, path)


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def canonical_json(data: Any) -> str:
    return json.dumps(data, sort_keys=True, separators=(",", ":"), allow_nan=False)


def sector_bounds(sx: int, sy: int) -> tuple[float, float, float, float]:
    min_x = sx * SECTOR_SIZE_METERS
    min_y = sy * SECTOR_SIZE_METERS
    return min_x, min_y, min_x + SECTOR_SIZE_METERS, min_y + SECTOR_SIZE_METERS


def sector_center(sx: int, sy: int) -> tuple[float, float]:
    min_x, min_y, max_x, max_y = sector_bounds(sx, sy)
    return (min_x + max_x) * 0.5, (min_y + max_y) * 0.5


def world_to_axial_scale(x: float, y: float, scale: float) -> tuple[float, float]:
    h = UNIT_HEX_WIDTH_METERS * scale
    a = (math.sqrt(3.0) / 2.0) * h
    q = x / a
    r = (y - (q * 0.5 * h)) / h
    return q, r


def axial_to_world_scale(q: int, r: int, scale: float) -> tuple[float, float]:
    h = UNIT_HEX_WIDTH_METERS * scale
    return q * (math.sqrt(3.0) / 2.0) * h, r * h + q * 0.5 * h


def layer_center_axial(sx: int, sy: int, scale: float) -> tuple[int, int]:
    cx, cy = sector_center(sx, sy)
    q, r = world_to_axial_scale(cx, cy, scale)
    return round(q), round(r)


def fixture_bin_paths() -> list[Path]:
    return sorted(BINS_DIR.glob("sector_*.bin"))


def bin_path_for_sector(sx: int, sy: int) -> Path:
    return BINS_DIR / f"sector_{sx}_{sy}.bin"


def run_node_parser(path: Path) -> dict[str, Any]:
    cmd = ["node", str(THIS_DIR / "parse_hex4.mjs"), str(path)]
    proc = subprocess.run(cmd, cwd=REPO_ROOT, text=True, capture_output=True)
    if proc.returncode != 0:
        detail = proc.stderr.strip() or proc.stdout.strip() or f"exit {proc.returncode}"
        raise RuntimeError(f"JS parser failed for {path.name}: {detail}")
    return json.loads(proc.stdout)


@dataclass
class SuiteResult:
    suite: str
    checks: int = 0
    passed: int = 0
    failed: int = 0
    failures: list[str] = field(default_factory=list)

    def check(self, condition: bool, label: str, detail: str = "") -> None:
        self.checks += 1
        if condition:
            self.passed += 1
            return
        self.failed += 1
        self.failures.append(f"{label}: {detail}" if detail else label)

    def fail(self, label: str, detail: str = "") -> None:
        self.check(False, label, detail)

    def merge(self, other: "SuiteResult") -> None:
        self.checks += other.checks
        self.passed += other.passed
        self.failed += other.failed
        self.failures.extend(other.failures)

    @property
    def ok(self) -> bool:
        return self.failed == 0


def assert_no_failures(result: SuiteResult) -> None:
    if result.ok:
        return
    joined = "\n".join(f"- {item}" for item in result.failures)
    raise AssertionError(f"{result.suite} failed {result.failed}/{result.checks} checks:\n{joined}")


def print_single_suite(result: SuiteResult) -> int:
    print(f"{result.suite}: {result.passed}/{result.checks} passed")
    if result.failures:
        for failure in result.failures:
            print(f"  FAIL {failure}")
    return 0 if result.ok else 1


def iter_records(parsed: dict[str, Any]) -> Iterable[tuple[int, int, dict[str, Any]]]:
    for layer_index, layer in enumerate(parsed["layers"]):
        for record_index, record in enumerate(layer):
            yield layer_index, record_index, record

