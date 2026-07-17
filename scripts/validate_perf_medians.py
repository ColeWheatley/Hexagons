#!/usr/bin/env python3
"""Validate three benchmark reports using medians, not a single noisy run."""
import argparse
import json
import statistics
import sys
from pathlib import Path


def value(report, dotted):
    current = report
    for part in dotted.split("."):
        current = current.get(part) if isinstance(current, dict) else None
    return current


def median(reports, dotted):
    values = [value(report, dotted) for report in reports]
    if any(not isinstance(item, (int, float)) for item in values):
        raise ValueError(f"missing numeric metric {dotted}: {values}")
    return statistics.median(values)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("reports", nargs=3, type=Path)
    parser.add_argument("--max-ready-ms", type=float, default=15000)
    parser.add_argument("--max-ttftf-ms", type=float, default=30000)
    parser.add_argument("--max-orbit-p95-ms", type=float, default=100)
    args = parser.parse_args()
    reports = [json.loads(path.read_text()) for path in args.reports]
    for path, report in zip(args.reports, reports):
        if report.get("meta", {}).get("crashed") or not report.get("meta", {}).get("finished"):
            raise SystemExit(f"FAIL {path}: benchmark did not finish cleanly")
    checks = [("ready", "milestones.loaderHidden", args.max_ready_ms), ("TTFTF", "milestones.visibleTexturedCoverage", args.max_ttftf_ms), ("orbit p95", "frames.p95_ms", args.max_orbit_p95_ms)]
    failed = False
    for label, dotted, limit in checks:
        try:
            observed = median(reports, dotted)
        except ValueError as error:
            print(f"FAIL {error}", file=sys.stderr)
            failed = True
            continue
        print(f"{label}: median {observed:.1f} ms (limit {limit:.1f} ms)")
        failed |= observed > limit
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
