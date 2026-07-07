#!/usr/bin/env python3
"""Golden SHA256 and compact stats checks for HEX4 fixtures."""

from __future__ import annotations

import json
import statistics
import sys
from collections import Counter
from pathlib import Path
from typing import Any

from hex4_common import GOLDEN_DIR, LAYER_SCALES, SuiteResult, fixture_bin_paths, print_single_suite, sha256_file
from parse_hex4 import parse_file


def _round_float(value: float) -> float:
    return round(float(value), 12)


def _histogram(values: list[int]) -> dict[str, int]:
    return {str(key): count for key, count in sorted(Counter(values).items())}


def stats_for_file(path: Path) -> dict[str, Any]:
    parsed = parse_file(path, strict=True)
    layers = []
    for layer_index, layer in enumerate(parsed["layers"]):
        heights = [record["h"] for record in layer]
        layers.append(
            {
                "index": layer_index,
                "scale": LAYER_SCALES[layer_index],
                "count": len(layer),
                "height": {
                    "min": _round_float(min(heights)),
                    "max": _round_float(max(heights)),
                    "mean": _round_float(statistics.fmean(heights)),
                },
                "deltaHistograms": [
                    _histogram([record["deltas"][edge_index] for record in layer])
                    for edge_index in range(3)
                ],
            }
        )

    return {
        "fixture": path.name,
        "sha256": sha256_file(path),
        "byteLength": parsed["byteLength"],
        "sx": parsed["sx"],
        "sy": parsed["sy"],
        "header": {
            "minZ": _round_float(parsed["header"]["minZ"]),
            "maxZ": _round_float(parsed["header"]["maxZ"]),
            "scale": _round_float(parsed["header"]["scale"]),
            "cq": parsed["header"]["cq"],
            "cr": parsed["header"]["cr"],
        },
        "layers": layers,
    }


def golden_path_for(path: Path) -> Path:
    return GOLDEN_DIR / f"{path.stem}.json"


def write_golden(path: Path) -> None:
    GOLDEN_DIR.mkdir(parents=True, exist_ok=True)
    data = stats_for_file(path)
    golden_path_for(path).write_text(json.dumps(data, indent=2, sort_keys=True) + "\n")


def _summarize_hist_diff(expected: dict[str, int], actual: dict[str, int]) -> list[str]:
    lines: list[str] = []
    exp_keys = set(expected)
    act_keys = set(actual)
    missing = sorted(exp_keys - act_keys, key=int)
    extra = sorted(act_keys - exp_keys, key=int)
    changed = sorted((key for key in exp_keys & act_keys if expected[key] != actual[key]), key=int)
    if missing:
        lines.append(f"missing delta bins {missing[:8]}{' ...' if len(missing) > 8 else ''}")
    if extra:
        lines.append(f"extra delta bins {extra[:8]}{' ...' if len(extra) > 8 else ''}")
    if changed:
        preview = [f"{key}:{expected[key]}->{actual[key]}" for key in changed[:8]]
        lines.append(f"changed delta counts {preview}{' ...' if len(changed) > 8 else ''}")
    return lines


def _diff(expected: Any, actual: Any, prefix: str = "") -> list[str]:
    if isinstance(expected, dict) and isinstance(actual, dict):
        if expected and all(isinstance(v, int) for v in expected.values()) and all(k.lstrip("-").isdigit() for k in expected):
            if expected == actual:
                return []
            return [f"{prefix}: {line}" for line in _summarize_hist_diff(expected, actual)]
        lines: list[str] = []
        for key in sorted(set(expected) | set(actual)):
            child = f"{prefix}.{key}" if prefix else str(key)
            if key not in expected:
                lines.append(f"{child}: unexpected {actual[key]!r}")
            elif key not in actual:
                lines.append(f"{child}: missing expected {expected[key]!r}")
            else:
                lines.extend(_diff(expected[key], actual[key], child))
        return lines
    if isinstance(expected, list) and isinstance(actual, list):
        lines = []
        if len(expected) != len(actual):
            lines.append(f"{prefix}: length {len(expected)} -> {len(actual)}")
        for index, (exp_item, act_item) in enumerate(zip(expected, actual)):
            lines.extend(_diff(exp_item, act_item, f"{prefix}[{index}]"))
        return lines
    if expected != actual:
        return [f"{prefix}: {expected!r} -> {actual!r}"]
    return []


def compare_golden(path: Path) -> SuiteResult:
    result = SuiteResult("golden")
    golden_path = golden_path_for(path)
    if not golden_path.exists():
        result.fail(f"{path.name} golden exists", f"missing {golden_path}")
        return result
    expected = json.loads(golden_path.read_text())
    actual = stats_for_file(path)
    diffs = _diff(expected, actual)
    result.check(not diffs, f"{path.name} matches golden stats", "\n".join(diffs[:40]))
    result.check(expected.get("sha256") == actual.get("sha256"), f"{path.name} SHA256 matches golden")
    return result


def regen(paths: list[Path]) -> SuiteResult:
    result = SuiteResult("golden")
    for path in paths:
        write_golden(path)
        result.check(golden_path_for(path).exists(), f"{path.name} regenerated")
    return result


def run(paths: list[Path] | None = None, *, regen_goldens: bool = False) -> SuiteResult:
    paths = paths or fixture_bin_paths()
    result = SuiteResult("golden")
    if not paths:
        result.fail("fixtures exist", "run bake_fixtures.py first")
        return result
    if regen_goldens:
        return regen(paths)
    for path in paths:
        result.merge(compare_golden(path))
    return result


def main(argv: list[str] | None = None) -> int:
    argv = argv if argv is not None else sys.argv[1:]
    regen_flag = "--regen" in argv
    paths = [Path(item) for item in argv if item != "--regen"] or None
    if not fixture_bin_paths():
        from bake_fixtures import ensure_fixtures

        ensure_fixtures(force=True, quiet=True)
    return print_single_suite(run(paths, regen_goldens=regen_flag))


if __name__ == "__main__":
    raise SystemExit(main())
