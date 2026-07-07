#!/usr/bin/env python3
"""Python parser to JavaScript worker-parser parity checks."""

from __future__ import annotations

import math
import sys
from pathlib import Path

from hex4_common import SuiteResult, fixture_bin_paths, print_single_suite, run_node_parser
from parse_hex4 import parse_file


FLOAT_TOLERANCE = 1e-9


def _same_float(a: float, b: float) -> bool:
    return math.isclose(a, b, rel_tol=0.0, abs_tol=FLOAT_TOLERANCE)


def _check_equal(result: SuiteResult, label: str, left, right) -> None:
    result.check(left == right, label, f"python={left!r} js={right!r}")


def _check_float(result: SuiteResult, label: str, left: float, right: float) -> None:
    result.check(_same_float(left, right), label, f"python={left!r} js={right!r}")


def compare_fixture(path: Path) -> SuiteResult:
    result = SuiteResult("parity")
    py = parse_file(path, strict=True)
    js = run_node_parser(path)

    _check_equal(result, f"{path.name} sx", py["sx"], js["sx"])
    _check_equal(result, f"{path.name} sy", py["sy"], js["sy"])
    _check_equal(result, f"{path.name} byte length", py["byteLength"], js["byteLength"])
    _check_equal(result, f"{path.name} consumed bytes", py["consumedBytes"], js["consumedBytes"])
    _check_equal(result, f"{path.name} layer counts", py["layerCounts"], js["layerCounts"])
    _check_equal(result, f"{path.name} layer scales", py["layerScales"], js["layerScales"])

    for key in ("signature", "cq", "cr"):
        _check_equal(result, f"{path.name} header {key}", py["header"][key], js["header"][key])
    for key in ("minZ", "maxZ", "scale"):
        _check_float(result, f"{path.name} header {key}", py["header"][key], js["header"][key])
    for key in ("min", "max", "avg", "base"):
        _check_float(result, f"{path.name} stats {key}", py["stats"][key], js["stats"][key])

    for layer_index, (py_layer, js_layer) in enumerate(zip(py["layers"], js["layers"])):
        _check_equal(result, f"{path.name} layer {layer_index} record count", len(py_layer), len(js_layer))
        for record_index, (py_record, js_record) in enumerate(zip(py_layer, js_layer)):
            prefix = f"{path.name} layer {layer_index} record {record_index}"
            for key in ("dq", "dr", "q", "r", "hScaled"):
                _check_equal(result, f"{prefix} {key}", py_record[key], js_record[key])
            _check_float(result, f"{prefix} h", py_record["h"], js_record["h"])
            _check_equal(result, f"{prefix} deltas", py_record["deltas"], js_record["deltas"])
            _check_equal(result, f"{prefix} slopes", py_record["slopes"], js_record["slopes"])
            _check_equal(result, f"{prefix} norm", py_record["norm"], js_record["norm"])
    return result


def run(paths: list[Path] | None = None) -> SuiteResult:
    paths = paths or fixture_bin_paths()
    result = SuiteResult("parity")
    if not paths:
        result.fail("fixtures exist", "run bake_fixtures.py first")
        return result
    for path in paths:
        result.merge(compare_fixture(path))
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
