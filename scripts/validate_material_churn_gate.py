#!/usr/bin/env python3
"""Validate the A*-3 before/after render-cycle, pixel, and LOD gate."""

import argparse
import json
import statistics
from pathlib import Path


def load(path):
    with path.open() as handle:
        return json.load(handle)


def cycle_average(report):
    return report["materialChurn"]["counters"]["renderCycleAverageMs"]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("report_dir", type=Path)
    parser.add_argument("--min-improvement-percent", type=float, default=10.0)
    args = parser.parse_args()

    baseline_paths = [args.report_dir / name for name in (
        "baseline-1.json", "baseline-2.json", "baseline-proof.json",
    )]
    candidate_paths = [args.report_dir / name for name in (
        "candidate-1.json", "candidate-2.json", "candidate-proof.json",
    )]
    baseline = [load(path) for path in baseline_paths]
    candidate = [load(path) for path in candidate_paths]
    baseline_values = [cycle_average(report) for report in baseline]
    candidate_values = [cycle_average(report) for report in candidate]
    baseline_median = statistics.median(baseline_values)
    candidate_median = statistics.median(candidate_values)
    improvement = (baseline_median - candidate_median) / baseline_median * 100

    control = baseline[-1]["materialChurn"]
    optimized = candidate[-1]["materialChurn"]
    checks = {
        "three_trials_each": len(baseline) == len(candidate) == 3,
        "render_cycle_improvement": improvement >= args.min_improvement_percent,
        "pixel_identical": optimized["pixels"]["identical"],
        "lod_replay_identical": optimized["pixels"]["lodIdentical"],
        "timed_lod_identical": control["timedLod"] == optimized["timedLod"],
        "draw_calls_identical": control["renderInfo"]["calls"] == optimized["renderInfo"]["calls"],
        "triangles_identical": control["renderInfo"]["triangles"] == optimized["renderInfo"]["triangles"],
        "program_count_identical": control["renderInfo"]["programs"] == optimized["renderInfo"]["programs"],
        "zero_texture_serialization_warnings": all(
            report["materialChurn"]["counters"]["textureSerializationWarnings"] == 0
            for report in baseline + candidate
        ),
    }
    result = {
        "baselineRenderCycleAverageMs": baseline_values,
        "candidateRenderCycleAverageMs": candidate_values,
        "baselineMedianMs": baseline_median,
        "candidateMedianMs": candidate_median,
        "improvementPercent": improvement,
        "baselineMedianUniformWrites": statistics.median(
            report["materialChurn"]["counters"]["uniformWrites"] for report in baseline
        ),
        "candidateMedianUniformWrites": statistics.median(
            report["materialChurn"]["counters"]["uniformWrites"] for report in candidate
        ),
        "timedLodTileCount": len(optimized["timedLod"]["tiles"]),
        "renderInfo": optimized["renderInfo"],
        "pixelFingerprint": optimized["pixels"]["optimized"],
        "checks": checks,
        "passed": all(checks.values()),
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
