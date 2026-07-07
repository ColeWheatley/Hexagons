#!/usr/bin/env python3
"""Round-trip bake determinism checks."""

from __future__ import annotations

import os
import shutil
import sys
import tempfile
from pathlib import Path

import rasterio

from hex4_common import DEM_PATH, REPO_ROOT, SuiteResult, ensure_repo_on_path, print_single_suite, sector_bounds, sha256_file


ensure_repo_on_path()

import waffle_iron  # noqa: E402
from bake_fixtures import fixture_specs  # noqa: E402


def _bake_once(dem_ds, grad_ds, sx: int, sy: int, out_dir: Path) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    waffle_iron.bake_sector_binary(sx, sy, dem_ds, grad_ds, output_dir=str(out_dir))
    return out_dir / f"sector_{sx}_{sy}.bin"


def run(paths: list[Path] | None = None) -> SuiteResult:
    del paths
    result = SuiteResult("determinism")
    spec = fixture_specs()[0]
    tmp_parent = Path(__file__).resolve().parent / "tmp"
    tmp_parent.mkdir(parents=True, exist_ok=True)
    tmp_root = Path(tempfile.mkdtemp(prefix="determinism_", dir=tmp_parent))
    old_cwd = Path.cwd()
    os.chdir(REPO_ROOT)
    try:
        waffle_iron.S3_ENABLED = False
        with rasterio.open(DEM_PATH) as dem_ds:
            gradient_path = tmp_root / "gradient.tif"
            grad_ds = waffle_iron.generate_regional_gradient(
                dem_ds,
                sector_bounds(spec.sx, spec.sy),
                upsample_factor=2,
                output_path=str(gradient_path),
            )
            try:
                first = _bake_once(dem_ds, grad_ds, spec.sx, spec.sy, tmp_root / "first")
                second = _bake_once(dem_ds, grad_ds, spec.sx, spec.sy, tmp_root / "second")
            finally:
                grad_ds.close()

        result.check(first.exists(), "first deterministic bake exists", str(first))
        result.check(second.exists(), "second deterministic bake exists", str(second))
        first_bytes = first.read_bytes()
        second_bytes = second.read_bytes()
        result.check(first_bytes == second_bytes, "same sector bakes byte-identically")
        result.check(sha256_file(first) == sha256_file(second), "same sector SHA256 matches")
    except Exception as exc:
        result.fail("determinism bake completes", str(exc))
    finally:
        os.chdir(old_cwd)
        shutil.rmtree(tmp_root, ignore_errors=True)
    return result


def main(argv: list[str] | None = None) -> int:
    del argv
    return print_single_suite(run())


if __name__ == "__main__":
    raise SystemExit(main())
