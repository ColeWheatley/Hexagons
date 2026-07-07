#!/usr/bin/env python3
"""Semantic checks against independent DEM sampling."""

from __future__ import annotations

import math
import random
import sys
from pathlib import Path

import rasterio
import rasterio.windows

from hex4_common import (
    DEM_PATH,
    LAYER_SCALES,
    SuiteResult,
    axial_to_world_scale,
    fixture_bin_paths,
    print_single_suite,
    sector_bounds,
)
from parse_hex4 import parse_file


SAMPLES_PER_LAYER = 50
RANDOM_SEED = 0x48455834
NEIGHBOR_OFFSETS = ((1, -1), (0, -1), (-1, 0))


class DemWindowSampler:
    def __init__(self, dem_ds: rasterio.io.DatasetReader, sx: int, sy: int):
        min_x, min_y, max_x, max_y = sector_bounds(sx, sy)
        padding_m = 200.0
        window = rasterio.windows.from_bounds(
            min_x - padding_m,
            min_y - padding_m,
            max_x + padding_m,
            max_y + padding_m,
            dem_ds.transform,
        )
        window = window.intersection(rasterio.windows.Window(0, 0, dem_ds.width, dem_ds.height))
        self.data = dem_ds.read(1, window=window)
        self.transform = dem_ds.window_transform(window)
        self._inv_a = 1.0 / self.transform.a
        self._inv_e = 1.0 / self.transform.e

    def _clamped_height(self, row: int, col: int) -> float:
        row = max(0, min(self.data.shape[0] - 1, row))
        col = max(0, min(self.data.shape[1] - 1, col))
        return float(self.data[row, col])

    def center_height(self, x: float, y: float) -> float:
        row, col = rasterio.transform.rowcol(self.transform, x, y)
        return self._clamped_height(row, col)

    def neighbor_height(self, x: float, y: float) -> float:
        if self.transform.b != 0 or self.transform.d != 0:
            row, col = rasterio.transform.rowcol(self.transform, x, y)
        else:
            row = math.floor((y - self.transform.f) * self._inv_e)
            col = math.floor((x - self.transform.c) * self._inv_a)
        return self._clamped_height(row, col)


def _expected_delta(own_h: float, neighbor_h: float) -> tuple[int, bool]:
    raw = own_h - neighbor_h
    if abs(raw) > 400.0:
        return 0, True
    return int(round(raw * 10.0)), False


def _normal_ok(norm: list[int]) -> tuple[bool, str]:
    nx = (norm[0] - 128.0) / 127.0
    nz = (norm[1] - 128.0) / 127.0
    xz_sq = nx * nx + nz * nz
    if xz_sq > 1.025:
        return False, f"packed xz length too large: {math.sqrt(xz_sq):.6f} from {norm}"
    ny = math.sqrt(max(0.0, 1.0 - xz_sq))
    length = math.sqrt(xz_sq + ny * ny)
    if abs(length - 1.0) > 0.02:
        return False, f"decoded length {length:.6f} from {norm}"
    return True, ""


def _sample_records(layer: list[dict], rng: random.Random) -> list[dict]:
    if not layer:
        return []
    return [rng.choice(layer) for _ in range(SAMPLES_PER_LAYER)]


def _check_record(
    result: SuiteResult,
    path: Path,
    sampler: DemWindowSampler,
    header: dict,
    layer_index: int,
    record: dict,
) -> int:
    scale = LAYER_SCALES[layer_index]
    wx, wy = axial_to_world_scale(record["q"], record["r"], scale)
    h_eff = 6.4 * scale
    dx_dq = (math.sqrt(3.0) / 2.0) * h_eff
    dy_dq = 0.5 * h_eff
    dy_dr = h_eff
    own_h = sampler.center_height(wx, wy)
    quant_tol = (header["maxZ"] - header["minZ"]) / 65535.0 + 1e-3
    prefix = f"{path.name} layer {layer_index} q={record['q']} r={record['r']}"

    result.check(
        abs(record["h"] - own_h) <= quant_tol,
        f"{prefix} reconstructed height within quantization",
        f"got {record['h']:.9f}, expected {own_h:.9f}, tol {quant_tol:.9f}",
    )

    clamp_cases = 0
    for edge_index, (dq, dr) in enumerate(NEIGHBOR_OFFSETS):
        odx = dq * dx_dq
        ody = (dr * dy_dr) + (dq * dy_dq)
        nwx = wx + odx
        nwy = wy + ody
        neighbor_h = sampler.neighbor_height(nwx, nwy)
        expected_delta, clamped = _expected_delta(own_h, neighbor_h)
        if clamped:
            clamp_cases += 1
        actual_delta = record["deltas"][edge_index]
        result.check(
            abs(actual_delta - expected_delta) <= 1,
            f"{prefix} delta {edge_index}",
            f"got {actual_delta}, expected {expected_delta}, own {own_h:.3f}, neighbor {neighbor_h:.3f}",
        )

    ok, detail = _normal_ok(record["norm"])
    result.check(ok, f"{prefix} packed normal unit-ish", detail)
    return clamp_cases


def _check_clamp_cases(path: Path, parsed: dict, sampler: DemWindowSampler, result: SuiteResult) -> int:
    clamp_cases = 0
    for layer_index, layer in enumerate(parsed["layers"]):
        scale = LAYER_SCALES[layer_index]
        h_eff = 6.4 * scale
        dx_dq = (math.sqrt(3.0) / 2.0) * h_eff
        dy_dq = 0.5 * h_eff
        dy_dr = h_eff
        for record in layer:
            wx, wy = axial_to_world_scale(record["q"], record["r"], scale)
            own_h = sampler.center_height(wx, wy)
            for edge_index, (dq, dr) in enumerate(NEIGHBOR_OFFSETS):
                odx = dq * dx_dq
                ody = (dr * dy_dr) + (dq * dy_dq)
                nwx = wx + odx
                nwy = wy + ody
                expected_delta, clamped = _expected_delta(own_h, sampler.neighbor_height(nwx, nwy))
                if not clamped:
                    continue
                clamp_cases += 1
                result.check(
                    record["deltas"][edge_index] == 0,
                    f"{path.name} >400m clamp layer {layer_index} edge {edge_index}",
                    f"got {record['deltas'][edge_index]}, expected {expected_delta}",
                )
    return clamp_cases


def compare_fixture(path: Path, dem_ds: rasterio.io.DatasetReader, rng: random.Random) -> SuiteResult:
    result = SuiteResult("semantics")
    parsed = parse_file(path, strict=True)
    sampler = DemWindowSampler(dem_ds, parsed["sx"], parsed["sy"])
    sampled_clamps = 0

    for layer_index, layer in enumerate(parsed["layers"]):
        result.check(bool(layer), f"{path.name} layer {layer_index} has records")
        for record in _sample_records(layer, rng):
            sampled_clamps += _check_record(result, path, sampler, parsed["header"], layer_index, record)

    exhaustive_clamps = _check_clamp_cases(path, parsed, sampler, result)
    if "109_305" in path.name:
        result.check(exhaustive_clamps > 0, f"{path.name} exercises >400m clamp", "no clamp cases found")
    return result


def run(paths: list[Path] | None = None) -> SuiteResult:
    paths = paths or fixture_bin_paths()
    result = SuiteResult("semantics")
    if not paths:
        result.fail("fixtures exist", "run bake_fixtures.py first")
        return result
    rng = random.Random(RANDOM_SEED)
    with rasterio.open(DEM_PATH) as dem_ds:
        for path in paths:
            result.merge(compare_fixture(path, dem_ds, rng))
    return result


def main(argv: list[str] | None = None) -> int:
    argv = argv if argv is not None else sys.argv[1:]
    if not fixture_bin_paths():
        from bake_fixtures import ensure_fixtures

        ensure_fixtures(force=True, quiet=True)
    paths = [Path(item) for item in argv] if argv else None
    return print_single_suite(run(paths))


if __name__ == "__main__":
    raise SystemExit(main())
