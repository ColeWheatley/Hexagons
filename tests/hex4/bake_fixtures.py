#!/usr/bin/env python3
"""Bake deterministic HEX4 binary fixtures without invoking texture code."""

from __future__ import annotations

import json
import os
import shutil
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import rasterio

from hex4_common import (
    BINS_DIR,
    DEM_PATH,
    FIXTURES_DIR,
    REPO_ROOT,
    bin_path_for_sector,
    ensure_repo_on_path,
    sector_bounds,
    sector_center,
    sha256_file,
)


ensure_repo_on_path()

import coordinate_utility as coord_util  # noqa: E402
import waffle_iron  # noqa: E402


@dataclass(frozen=True)
class FixtureSpec:
    label: str
    sx: int
    sy: int
    reason: str

    @property
    def bin_name(self) -> str:
        return f"sector_{self.sx}_{self.sy}.bin"

    @property
    def gradient_name(self) -> str:
        return f"gradient_{self.sx}_{self.sy}.tif"


def _stubai_center_sector() -> tuple[int, int]:
    wx, wy = waffle_iron.latlon_to_world_meters(waffle_iron.STUBAI_LAT, waffle_iron.STUBAI_LON)
    return coord_util.world_to_sector_id(wx, wy)


def fixture_specs() -> list[FixtureSpec]:
    """Return the fixed sectors used by every suite.

    The Stubai center is computed from waffle_iron.STUBAI_LAT/LON as a guard
    against accidental drift in the documented center sector. The high-relief
    sector was chosen by a one-time coarse DEM scan; it is fully inside the DEM,
    has roughly 1.1 km of sampled relief inside one sector, and triggers the
    current writer's >400m edge-delta clamp.
    """
    stubai_sx, stubai_sy = _stubai_center_sector()
    if (stubai_sx, stubai_sy) != (73, 252):
        raise RuntimeError(f"Stubai center moved: expected (73, 252), got {(stubai_sx, stubai_sy)}")

    return [
        FixtureSpec("stubai_center", stubai_sx, stubai_sy, "normal interior sector at Stubai"),
        FixtureSpec("stubai_east", stubai_sx + 1, stubai_sy, "normal interior neighbor east of Stubai"),
        FixtureSpec("stubai_north", stubai_sx, stubai_sy + 1, "normal interior neighbor north of Stubai"),
        FixtureSpec("dem_west_edge", -28, stubai_sy, "sector straddling the DEM western boundary"),
        FixtureSpec("high_relief", 109, 305, "fully interior steep high-relief terrain with clamp edges"),
    ]


def _dem_fingerprint() -> dict[str, Any]:
    real = DEM_PATH.resolve()
    st = real.stat()
    return {
        "path": str(real),
        "size": st.st_size,
        "mtime_ns": st.st_mtime_ns,
    }


def _gradient_meta_path(path: Path) -> Path:
    return path.with_suffix(path.suffix + ".meta.json")


def _gradient_current(path: Path, spec: FixtureSpec, fingerprint: dict[str, Any]) -> bool:
    meta_path = _gradient_meta_path(path)
    if not path.exists() or not meta_path.exists():
        return False
    try:
        meta = json.loads(meta_path.read_text())
    except Exception:
        return False
    return meta.get("dem") == fingerprint and meta.get("sector") == [spec.sx, spec.sy]


def _write_gradient_meta(path: Path, spec: FixtureSpec, fingerprint: dict[str, Any]) -> None:
    meta = {
        "dem": fingerprint,
        "sector": [spec.sx, spec.sy],
        "bounds": list(sector_bounds(spec.sx, spec.sy)),
    }
    _gradient_meta_path(path).write_text(json.dumps(meta, indent=2, sort_keys=True) + "\n")


def _open_gradient_for_sector(dem_ds: rasterio.io.DatasetReader, spec: FixtureSpec, fingerprint: dict[str, Any]):
    gradients_dir = FIXTURES_DIR / "gradients"
    gradients_dir.mkdir(parents=True, exist_ok=True)
    gradient_path = gradients_dir / spec.gradient_name

    if not _gradient_current(gradient_path, spec, fingerprint):
        if gradient_path.exists():
            gradient_path.unlink()
        meta_path = _gradient_meta_path(gradient_path)
        if meta_path.exists():
            meta_path.unlink()
        ds = waffle_iron.generate_regional_gradient(
            dem_ds,
            sector_bounds(spec.sx, spec.sy),
            upsample_factor=2,
            output_path=str(gradient_path),
        )
        _write_gradient_meta(gradient_path, spec, fingerprint)
        return ds

    return rasterio.open(gradient_path)


def _fixture_manifest(baked: list[dict[str, Any]], fingerprint: dict[str, Any]) -> dict[str, Any]:
    return {
        "dem": fingerprint,
        "stubai_lat_lon": [waffle_iron.STUBAI_LAT, waffle_iron.STUBAI_LON],
        "fixtures": baked,
    }


def ensure_fixtures(force: bool = True, quiet: bool = False) -> list[Path]:
    """Bake or refresh all fixture bins and return their paths.

    Binary fixtures are intentionally refreshed by default so writer changes are
    reflected immediately. Per-sector gradient TIFs are cached with a DEM stat
    fingerprint because they are large enough to be annoying and independent of
    the HEX4 byte layout.
    """
    FIXTURES_DIR.mkdir(parents=True, exist_ok=True)
    BINS_DIR.mkdir(parents=True, exist_ok=True)
    fingerprint = _dem_fingerprint()
    baked: list[dict[str, Any]] = []
    paths: list[Path] = []

    old_cwd = Path.cwd()
    os.chdir(REPO_ROOT)
    try:
        waffle_iron.S3_ENABLED = False
        with rasterio.open(DEM_PATH) as dem_ds:
            for spec in fixture_specs():
                bin_path = bin_path_for_sector(spec.sx, spec.sy)
                if force and bin_path.exists():
                    bin_path.unlink()

                grad_ds = _open_gradient_for_sector(dem_ds, spec, fingerprint)
                try:
                    waffle_iron.bake_sector_binary(spec.sx, spec.sy, dem_ds, grad_ds, output_dir=str(BINS_DIR))
                finally:
                    grad_ds.close()

                if not bin_path.exists():
                    raise RuntimeError(f"bake did not create {bin_path}")

                min_x, min_y, max_x, max_y = sector_bounds(spec.sx, spec.sy)
                cx, cy = sector_center(spec.sx, spec.sy)
                entry = {
                    "label": spec.label,
                    "sector": [spec.sx, spec.sy],
                    "reason": spec.reason,
                    "bounds": [min_x, min_y, max_x, max_y],
                    "center": [cx, cy],
                    "bin": str(bin_path.relative_to(REPO_ROOT)),
                    "sha256": sha256_file(bin_path),
                    "bytes": bin_path.stat().st_size,
                }
                baked.append(entry)
                paths.append(bin_path)
                if not quiet:
                    print(f"{spec.label:14s} sector=({spec.sx},{spec.sy}) bytes={entry['bytes']}")
    finally:
        os.chdir(old_cwd)

    manifest_path = FIXTURES_DIR / "manifest.json"
    manifest_path.write_text(json.dumps(_fixture_manifest(baked, fingerprint), indent=2, sort_keys=True) + "\n")
    return paths


def clean_fixtures() -> None:
    if FIXTURES_DIR.exists():
        shutil.rmtree(FIXTURES_DIR)


def main(argv: list[str] | None = None) -> int:
    argv = argv if argv is not None else sys.argv[1:]
    force = "--cached" not in argv
    ensure_fixtures(force=force)
    print(f"wrote fixtures under {FIXTURES_DIR.relative_to(REPO_ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
