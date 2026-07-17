#!/usr/bin/env python3
"""Validate retained profiler/heap boundedness for the AA-20 30-minute soak."""
from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path


def slope_per_minute(points):
    points = [(float(x), float(y)) for x, y in points if isinstance(x, (int, float)) and isinstance(y, (int, float))]
    if len(points) < 2:
        return None
    xs = [x / 60 for x, _ in points]
    ys = [y for _, y in points]
    x_mean = sum(xs) / len(xs)
    y_mean = sum(ys) / len(ys)
    denominator = sum((x - x_mean) ** 2 for x in xs)
    if denominator == 0:
        return None
    return sum((x - x_mean) * (y - y_mean) for x, y in zip(xs, ys)) / denominator


def evaluate(report, *, min_duration_seconds=1800, max_profiler_bytes=524288,
             max_profiler_tail_slope_bytes_per_minute=4096,
             max_heap_slope_bytes_per_minute=524288, max_heap_growth_bytes=16777216):
    samples = report.get("samples") or []
    checks = []

    def add(name, passed, detail):
        checks.append({"name": name, "passed": bool(passed), "detail": detail})

    requested = report.get("requestedDurationSeconds")
    observed = samples[-1].get("elapsedSeconds") if samples else None
    add("faithful-soak-duration", isinstance(requested, (int, float)) and requested >= min_duration_seconds
        and isinstance(observed, (int, float)) and observed >= requested - 2,
        f"requested={requested}s observed={observed}s required>={min_duration_seconds}s")
    add("retained-memory-timeline-present", len(samples) >= 10,
        f"captured {len(samples)} points")
    modes = [sample.get("profilerMode") for sample in samples]
    add("bounded-recovery-mode", bool(samples) and all(mode == "bounded-recovery" for mode in modes),
        f"modes={sorted(set(map(str, modes)))}")
    counts = [sample.get("profilerSampleCount") for sample in samples]
    add("profiler-ring-buffer-bounded", bool(counts) and all(isinstance(value, int) and value <= 180 for value in counts),
        f"sample counts min/max={min(counts, default=None)}/{max(counts, default=None)} limit=180")

    sizes = [sample.get("profilerSerializedBytes") for sample in samples]
    add("profiler-serialized-size-bounded", bool(sizes) and all(isinstance(value, (int, float)) for value in sizes)
        and max(sizes) <= max_profiler_bytes,
        f"max={max((value for value in sizes if isinstance(value, (int, float))), default=None)} bytes; limit={max_profiler_bytes}")
    tail = samples[len(samples) // 2:]
    profiler_slope = slope_per_minute((sample.get("elapsedSeconds"), sample.get("profilerSerializedBytes")) for sample in tail)
    add("profiler-memory-tail-slope-flat", profiler_slope is not None
        and profiler_slope <= max_profiler_tail_slope_bytes_per_minute,
        f"tail slope={profiler_slope} bytes/min; limit={max_profiler_tail_slope_bytes_per_minute}")

    heap_points = [(sample.get("elapsedSeconds"), (sample.get("heap") or {}).get("usedJSHeapSize")) for sample in samples]
    heap_slope = slope_per_minute(heap_points)
    heap_values = [value for _, value in heap_points if isinstance(value, (int, float))]
    heap_growth = heap_values[-1] - heap_values[0] if len(heap_values) >= 2 else None
    add("retained-js-heap-slope-bounded", heap_slope is not None and heap_slope <= max_heap_slope_bytes_per_minute,
        f"GC-normalized slope={heap_slope} bytes/min; limit={max_heap_slope_bytes_per_minute}")
    add("retained-js-heap-growth-bounded", heap_growth is not None and heap_growth <= max_heap_growth_bytes,
        f"start-to-end growth={heap_growth} bytes; limit={max_heap_growth_bytes}")

    memories = [(sample.get("report") or {}).get("memory") or {} for sample in samples]
    add("no-context-loss-or-gl-oom", bool(memories) and all(
        memory.get("contextLostCount") == 0 and memory.get("glOutOfMemoryCount") == 0
        for memory in memories), "all profiler samples report zero context loss and GL OOM")
    return checks


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("report", type=Path)
    parser.add_argument("--min-duration-seconds", type=float, default=1800)
    parser.add_argument("--max-profiler-bytes", type=float, default=524288)
    parser.add_argument("--max-profiler-tail-slope-bytes-per-minute", type=float, default=4096)
    parser.add_argument("--max-heap-slope-bytes-per-minute", type=float, default=524288)
    parser.add_argument("--max-heap-growth-bytes", type=float, default=16777216)
    args = parser.parse_args()
    report = json.loads(args.report.read_text())
    checks = evaluate(report, min_duration_seconds=args.min_duration_seconds,
        max_profiler_bytes=args.max_profiler_bytes,
        max_profiler_tail_slope_bytes_per_minute=args.max_profiler_tail_slope_bytes_per_minute,
        max_heap_slope_bytes_per_minute=args.max_heap_slope_bytes_per_minute,
        max_heap_growth_bytes=args.max_heap_growth_bytes)
    report["checks"] = checks
    report["passed"] = all(check["passed"] for check in checks)
    args.report.write_text(json.dumps(report, indent=2) + "\n")
    for check in checks:
        stream = sys.stdout if check["passed"] else sys.stderr
        print(f"{'PASS' if check['passed'] else 'FAIL'} {check['name']}: {check['detail']}", file=stream)
    return 0 if report["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
