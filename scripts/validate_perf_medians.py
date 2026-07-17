#!/usr/bin/env python3
"""Validate three cold-start orbit reports against AA-20 release budgets.

One fresh-profile orbit run supplies both cold ready/TTFTF milestones and active
orbit frame timing.  Reusing those reports avoids six browser launches while
still making every verdict a three-trial median.
"""
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


def evaluate(reports, *, max_ready_ms=15000, max_ttftf_ms=30000,
             max_frame_p95_ms=100, max_frame_p99_ms=150):
    checks = []
    for label, dotted, limit in (
        ("cold ready", "milestones.loaderHidden", max_ready_ms),
        ("cold TTFTF", "milestones.visibleTexturedCoverage", max_ttftf_ms),
        ("orbit frame p95", "frames.p95_ms", max_frame_p95_ms),
        ("orbit frame p99", "frames.p99_ms", max_frame_p99_ms),
    ):
        try:
            observed = median(reports, dotted)
            passed = observed <= limit
            detail = f"median {observed:.1f} ms (release budget {limit:.1f} ms)"
        except ValueError as error:
            observed = None
            passed = False
            detail = str(error)
        checks.append({"name": label, "passed": passed, "observed": observed,
                       "limit": limit, "detail": detail})
    return checks


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("reports", nargs=3, type=Path)
    parser.add_argument("--max-ready-ms", type=float, default=15000)
    parser.add_argument("--max-ttftf-ms", type=float, default=30000)
    parser.add_argument("--max-frame-p95-ms", type=float, default=100)
    parser.add_argument("--max-frame-p99-ms", type=float, default=150)
    args = parser.parse_args()
    reports = [json.loads(path.read_text()) for path in args.reports]
    for path, report in zip(args.reports, reports):
        if report.get("meta", {}).get("crashed") or not report.get("meta", {}).get("finished"):
            raise SystemExit(f"FAIL {path}: benchmark did not finish cleanly")
    checks = evaluate(
        reports,
        max_ready_ms=args.max_ready_ms,
        max_ttftf_ms=args.max_ttftf_ms,
        max_frame_p95_ms=args.max_frame_p95_ms,
        max_frame_p99_ms=args.max_frame_p99_ms,
    )
    for check in checks:
        stream = sys.stdout if check["passed"] else sys.stderr
        print(f"{'PASS' if check['passed'] else 'FAIL'} {check['name']}: {check['detail']}", file=stream)
    return 0 if all(check["passed"] for check in checks) else 1


if __name__ == "__main__":
    raise SystemExit(main())
