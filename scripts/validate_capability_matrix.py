#!/usr/bin/env python3
"""Validate the objective AA-11 browser capability matrix report."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


MIB = 1024 * 1024
EXPECTED = {
    "low-device": ("low", 2, 64 * MIB, 1, None, 0.12),
    "mid-device": ("mid", 3, 128 * MIB, 1, 768, 0.18),
    "high-device": ("high", 6, 256 * MIB, 2, 512, 0.25),
    "save-data": ("low", 2, 64 * MIB, 1, None, 0.12),
    "constrained-network": ("low", 2, 64 * MIB, 1, None, 0.12),
}


def _same_signal(expected, actual) -> bool:
    if isinstance(expected, bool):
        return actual is expected
    return actual == expected


def _check_case(row: dict) -> tuple[list[str], dict]:
    name = row.get("name")
    problems = []
    if name not in EXPECTED:
        return [f"unexpected matrix row {name!r}"], {}
    profile, workers, cache_bytes, texture_jobs, high_enter, guard_scale = EXPECTED[name]
    injected = row.get("injected", {})
    observed = row.get("observed", {})
    for signal in ("deviceMemory", "hardwareConcurrency", "effectiveType", "saveData"):
        if not _same_signal(injected.get(signal), observed.get(signal)):
            problems.append(
                f"{name}: browser observed {signal}={observed.get(signal)!r}, "
                f"not injected {injected.get(signal)!r}"
            )
    provenance = observed.get("provenance", {})
    if provenance.get("method") != "Page.addScriptToEvaluateOnNewDocument":
        problems.append(f"{name}: missing truthful CDP injection provenance")

    benchmark = row.get("benchmark", {})
    meta = benchmark.get("meta", {})
    if meta.get("finished") is not True:
        problems.append(f"{name}: benchmark did not finish")
    if meta.get("crashed") is True:
        problems.append(f"{name}: benchmark crashed")
    memory = benchmark.get("memory", {})
    if memory.get("contextLostCount") != 0:
        problems.append(f"{name}: profiler observed WebGL context loss")
    if memory.get("glOutOfMemoryCount") != 0:
        problems.append(f"{name}: profiler observed GL_OUT_OF_MEMORY")

    stats = row.get("detailedStats", {})
    capability = stats.get("capability", {})
    actuals = {
        "profile": capability.get("profile"),
        "workers": capability.get("workers"),
        "textureBudgetBytes": capability.get("textureBudgetBytes"),
        "maxTextureJobs": capability.get("maxTextureJobs"),
        "highTextureEnterPx": capability.get("highTextureEnterPx"),
        "guardMarginScale": capability.get("guardMarginScale"),
    }
    expected = {
        "profile": profile,
        "workers": workers,
        "textureBudgetBytes": cache_bytes,
        "maxTextureJobs": texture_jobs,
        # JSON.stringify represents Infinity as null for constrained profiles.
        "highTextureEnterPx": high_enter,
        "guardMarginScale": guard_scale,
    }
    for field, value in expected.items():
        if actuals.get(field) != value:
            problems.append(f"{name}: {field}={actuals.get(field)!r}, expected {value!r}")
    if row.get("expectedProfile") != profile:
        problems.append(f"{name}: harness expectation drifted from validator policy")

    vram = stats.get("vram", {})
    if vram.get("highTextureBudgetBytes") != cache_bytes:
        problems.append(f"{name}: live cache budget does not match selected capability budget")
    high_texture_bytes = vram.get("highTextureBytes")
    utilization = vram.get("highTextureBudgetUtilization")
    if not isinstance(high_texture_bytes, int) or high_texture_bytes > cache_bytes:
        problems.append(
            f"{name}: high texture residency {high_texture_bytes!r} exceeds {cache_bytes} byte budget"
        )
    if not isinstance(utilization, (int, float)) or utilization < 0 or utilization > 1:
        problems.append(f"{name}: invalid/out-of-budget cache utilization {utilization!r}")
    lanes = stats.get("workerLanes", {})
    actual_lane_workers = sum(lanes.get(lane, {}).get("workers", 0) for lane in ("geometry", "texture"))
    if actual_lane_workers != workers:
        problems.append(f"{name}: live worker lanes total {actual_lane_workers}, expected {workers}")

    context = stats.get("failures", {}).get("context", {})
    if context.get("lost") != 0 or context.get("recoveryFailures") != 0 or context.get("recovering") is True:
        problems.append(f"{name}: viewer context counters are not clean: {context}")

    texture_bytes = stats.get("network", {}).get("texBytes")
    if not isinstance(texture_bytes, int) or texture_bytes <= 0:
        problems.append(f"{name}: missing positive measured texture payload bytes")
    residency = stats.get("textureResidency", {})
    if profile == "low":
        if residency.get("desired", {}).get("high4096") != 0:
            problems.append(f"{name}: constrained profile still demanded high textures")
        if residency.get("resident", {}).get("high4096") != 0:
            problems.append(f"{name}: constrained profile still transferred/resided high textures")
    return problems, {
        "name": name,
        "profile": capability.get("profile"),
        "workers": capability.get("workers"),
        "cacheBytes": capability.get("textureBudgetBytes"),
        "cacheUsedBytes": high_texture_bytes,
        "cacheUtilization": utilization,
        "textureBytes": texture_bytes,
        "highSourceSize": stats.get("textureResidency", {}).get("highSourceSize"),
        "highUploadSize": stats.get("textureResidency", {}).get("highUploadSize"),
        "highSkippedTopMips": stats.get("textureResidency", {}).get("highSkippedTopMips"),
        "desiredHigh": residency.get("desired", {}).get("high4096"),
        "residentHigh": residency.get("resident", {}).get("high4096"),
    }


def validate_report(report: dict, min_transfer_reduction_percent: float = 20.0) -> dict:
    problems = []
    if report.get("kind") != "aa11-capability-matrix":
        problems.append("not an AA-11 capability matrix report")
    provenance = report.get("provenance", {})
    if provenance.get("freshProfilePerCase") is not True:
        problems.append("matrix cases did not use fresh browser profiles")
    if provenance.get("injection") != "Page.addScriptToEvaluateOnNewDocument":
        problems.append("matrix lacks pre-navigation CDP signal injection provenance")

    cases = report.get("cases", [])
    names = [row.get("name") for row in cases]
    missing = sorted(set(EXPECTED) - set(names))
    duplicates = sorted(name for name in set(names) if names.count(name) > 1)
    if missing:
        problems.append(f"missing rows: {', '.join(missing)}")
    if duplicates:
        problems.append(f"duplicate rows: {', '.join(duplicates)}")

    summaries = {}
    for row in cases:
        row_problems, summary = _check_case(row)
        problems.extend(row_problems)
        if summary:
            summaries[summary["name"]] = summary

    high = summaries.get("high-device", {})
    if (
        high.get("highSourceSize") != 4096
        or high.get("highUploadSize") != 4096
        or high.get("highSkippedTopMips") != 0
    ):
        problems.append(
            "high-device: full 4096px source/upload quality was not exercised unchanged "
            f"(source={high.get('highSourceSize')}, upload={high.get('highUploadSize')}, "
            f"skipped={high.get('highSkippedTopMips')})"
        )

    high_bytes = high.get("textureBytes")
    reductions = {}
    for name in ("save-data", "constrained-network"):
        constrained_bytes = summaries.get(name, {}).get("textureBytes")
        if isinstance(high_bytes, int) and high_bytes > 0 and isinstance(constrained_bytes, int):
            reduction = (high_bytes - constrained_bytes) / high_bytes * 100
            reductions[name] = reduction
            if reduction < min_transfer_reduction_percent:
                problems.append(
                    f"{name}: texture transfer reduction {reduction:.1f}% is below "
                    f"{min_transfer_reduction_percent:.1f}% (high={high_bytes}, constrained={constrained_bytes})"
                )
        else:
            problems.append(f"{name}: cannot compare measured texture payload bytes")

    if problems:
        raise ValueError("; ".join(problems))
    return {"cases": summaries, "transferReductionPercent": reductions}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("report", type=Path)
    parser.add_argument("--min-transfer-reduction-percent", type=float, default=20)
    args = parser.parse_args()
    try:
        result = validate_report(
            json.loads(args.report.read_text()),
            min_transfer_reduction_percent=args.min_transfer_reduction_percent,
        )
    except (OSError, json.JSONDecodeError, ValueError) as error:
        print(f"FAIL {error}")
        return 1

    for name in EXPECTED:
        row = result["cases"][name]
        print(
            f"PASS {name}: profile={row['profile']} workers={row['workers']} "
            f"cache={row['cacheBytes']} textureBytes={row['textureBytes']}"
        )
    for name, reduction in result["transferReductionPercent"].items():
        print(f"PASS {name}: {reduction:.1f}% fewer texture bytes than high-device")
    print("PASS high-device: 4096px source/upload quality unchanged; zero context-loss/OOM across matrix")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
