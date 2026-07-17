#!/usr/bin/env python3
"""Evaluate AA-8 browser measurements without depending on Chrome.

The runner records activity during equal-duration active and settled intervals.
This module keeps the acceptance policy deterministic and unit-testable.
"""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path


def _number(value, default=0.0):
    return float(value) if isinstance(value, (int, float)) and math.isfinite(value) else default


def evaluate_idle_browser_report(report: dict) -> list[dict]:
    intervals = report.get("intervals") or {}
    active = intervals.get("active") or {}
    idle = intervals.get("idle") or {}
    visibility = report.get("visibility") or {}

    active_frames = int(_number(active.get("viewerFrames")))
    active_renders = int(_number(active.get("renderCalls")))
    idle_frames = int(_number(idle.get("viewerFrames")))
    idle_renders = int(_number(idle.get("renderCalls")))
    active_task_ms = _number(active.get("taskDurationMs"))
    idle_task_ms = _number(idle.get("taskDurationMs"))

    checks = []

    def add(name: str, passed: bool, detail: str):
        checks.append({"name": name, "passed": bool(passed), "detail": detail})

    add(
        "active-control-produced-work",
        active_frames >= 12 and active_renders >= 8,
        f"active interval: {active_frames} viewer frames, {active_renders} renders",
    )
    max_idle_frames = max(1, math.floor(active_frames * 0.10))
    add(
        "settled-frame-activity-reduced-at-least-90-percent",
        idle_frames <= max_idle_frames,
        f"idle {idle_frames} vs active {active_frames} frames (limit {max_idle_frames})",
    )
    add(
        "settled-scene-does-not-render",
        idle_renders == 0,
        f"idle interval rendered {idle_renders} times",
    )
    # TaskDuration is Chrome's cumulative main-thread busy-time metric. Requiring
    # a relative reduction makes the check portable across fast and slow runners.
    add(
        "settled-main-thread-time-reduced-at-least-50-percent",
        active_task_ms > 0 and idle_task_ms <= active_task_ms * 0.50,
        f"idle {idle_task_ms:.3f} ms vs active {active_task_ms:.3f} ms task time",
    )

    if visibility.get("supported"):
        hidden = intervals.get("hidden") or {}
        recovery = intervals.get("recovery") or {}
        hidden_frames = int(_number(hidden.get("viewerFrames")))
        hidden_renders = int(_number(hidden.get("renderCalls")))
        recovery_frames = int(_number(recovery.get("viewerFrames")))
        recovery_renders = int(_number(recovery.get("renderCalls")))
        add(
            "hidden-tab-suspends-viewer-work",
            hidden_frames == 0 and hidden_renders == 0,
            f"hidden interval: {hidden_frames} viewer frames, {hidden_renders} renders",
        )
        add(
            "visible-transition-recovers-rendering",
            recovery_frames >= 1 and recovery_renders >= 1,
            f"recovery: {recovery_frames} viewer frames, {recovery_renders} renders",
        )

    return checks


def validate(report: dict) -> bool:
    checks = evaluate_idle_browser_report(report)
    report["checks"] = checks
    report["passed"] = all(check["passed"] for check in checks)
    return report["passed"]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("report", type=Path)
    args = parser.parse_args()
    report = json.loads(args.report.read_text())
    passed = validate(report)
    args.report.write_text(json.dumps(report, indent=2) + "\n")
    for check in report["checks"]:
        print(f"{'PASS' if check['passed'] else 'FAIL'} {check['name']}: {check['detail']}")
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
