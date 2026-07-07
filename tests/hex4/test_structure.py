#!/usr/bin/env python3
"""Structural invariants for current HEX4 binaries."""

from __future__ import annotations

import re
import sys
from pathlib import Path

from hex4_common import (
    HEADER_SIZE,
    LAYER_SCALES,
    RECORD_SIZE,
    SuiteResult,
    fixture_bin_paths,
    print_single_suite,
)
from parse_hex4 import Hex4ParseError, parse_file


SECTOR_RE = re.compile(r"sector_(-?\d+)_(-?\d+)\.bin$")


def sector_from_filename(path: Path) -> tuple[int, int]:
    match = SECTOR_RE.match(path.name)
    if not match:
        raise ValueError(f"not a sector bin path: {path}")
    return int(match.group(1)), int(match.group(2))


def validate_structure(path: Path, *, suite_name: str = "structure") -> SuiteResult:
    result = SuiteResult(suite_name)
    try:
        parsed = parse_file(path, strict=True)
    except Exception as exc:
        result.fail(f"{path.name} parses strictly", str(exc))
        return result

    expected_sx, expected_sy = sector_from_filename(path)
    header = parsed["header"]
    counts = parsed["layerCounts"]
    expected_len = HEADER_SIZE + sum(4 + (count * RECORD_SIZE) for count in counts)

    result.check(header["signature"] == "HEX4", f"{path.name} signature", repr(header["signature"]))
    result.check(parsed["sx"] == expected_sx, f"{path.name} sx echo", f"{parsed['sx']} != {expected_sx}")
    result.check(parsed["sy"] == expected_sy, f"{path.name} sy echo", f"{parsed['sy']} != {expected_sy}")
    result.check(header["minZ"] < header["maxZ"], f"{path.name} minZ < maxZ", f"{header['minZ']} >= {header['maxZ']}")
    result.check(header["scale"] > 0.0, f"{path.name} scale > 0", str(header["scale"]))
    result.check(len(parsed["layers"]) == 4, f"{path.name} has four layers", str(len(parsed["layers"])))
    result.check(len(counts) == 4, f"{path.name} has four count fields", str(len(counts)))
    result.check(parsed["byteLength"] == expected_len, f"{path.name} exact byte length", f"{parsed['byteLength']} != {expected_len}")
    result.check(parsed["consumedBytes"] == parsed["byteLength"], f"{path.name} no trailing bytes")

    for layer_index, layer in enumerate(parsed["layers"]):
        result.check(
            len(layer) == counts[layer_index],
            f"{path.name} layer {layer_index} count matches records",
            f"{len(layer)} != {counts[layer_index]}",
        )
        result.check(
            parsed["layerScales"][layer_index] == LAYER_SCALES[layer_index],
            f"{path.name} layer {layer_index} scale marker",
        )
        for record_index, record in enumerate(layer):
            label = f"{path.name} layer {layer_index} record {record_index}"
            result.check(-128 <= record["dq"] <= 127, f"{label} dq int8", str(record["dq"]))
            result.check(-128 <= record["dr"] <= 127, f"{label} dr int8", str(record["dr"]))
            result.check(0 <= record["hScaled"] <= 65535, f"{label} hScaled uint16", str(record["hScaled"]))
            for delta_index, delta in enumerate(record["deltas"]):
                result.check(-32768 <= delta <= 32767, f"{label} delta {delta_index} int16", str(delta))
            for slope_index, slope in enumerate(record["slopes"]):
                result.check(0 <= slope <= 255, f"{label} slope {slope_index} uint8", str(slope))
            for norm_index, norm in enumerate(record["norm"]):
                result.check(0 <= norm <= 255, f"{label} norm {norm_index} uint8", str(norm))
    return result


def run(paths: list[Path] | None = None) -> SuiteResult:
    paths = paths or fixture_bin_paths()
    result = SuiteResult("structure")
    if not paths:
        result.fail("fixtures exist", "run bake_fixtures.py first")
        return result
    for path in paths:
        result.merge(validate_structure(path))
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
