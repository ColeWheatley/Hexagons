#!/usr/bin/env python3
"""Validate three cold starts and three orbit runs against AA-20 budgets.

The release matrix reuses the cold phase of its three service-worker warm-pair
runs for ready/TTFTF. Orbit reports provide active frame timing; a moving orbit
does not necessarily reach the stationary visible-coverage milestone.
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


def evaluate(orbit_reports, cold_reports=None, *, max_ready_ms=15000, max_ttftf_ms=30000,
             max_frame_p95_ms=100, max_frame_p99_ms=150):
    cold_reports = cold_reports or orbit_reports
    checks = []
    for reports, label, dotted, limit in (
        (cold_reports, "cold ready", "milestones.loaderHidden", max_ready_ms),
        (cold_reports, "cold TTFTF", "milestones.visibleTexturedCoverage", max_ttftf_ms),
        (orbit_reports, "orbit frame p95", "frames.p95_ms", max_frame_p95_ms),
        (orbit_reports, "orbit frame p99", "frames.p99_ms", max_frame_p99_ms),
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
    parser.add_argument("--cold-reports", nargs=3, type=Path,
                        help="warm-pair reports whose nested cold phases gate ready/TTFTF")
    parser.add_argument("--max-ready-ms", type=float, default=15000)
    parser.add_argument("--max-ttftf-ms", type=float, default=30000)
    parser.add_argument("--max-frame-p95-ms", type=float, default=100)
    parser.add_argument("--max-frame-p99-ms", type=float, default=150)
    args = parser.parse_args()
    reports = [json.loads(path.read_text()) for path in args.reports]
    for path, report in zip(args.reports, reports):
        if report.get("meta", {}).get("crashed") or not report.get("meta", {}).get("finished"):
            raise SystemExit(f"FAIL {path}: benchmark did not finish cleanly")
    cold_reports = None
    if args.cold_reports:
        warm_pairs = [json.loads(path.read_text()) for path in args.cold_reports]
        cold_reports = [pair.get("cold") for pair in warm_pairs]
        for path, report in zip(args.cold_reports, cold_reports):
            if not isinstance(report, dict) or report.get("meta", {}).get("crashed") or not report.get("meta", {}).get("finished"):
                raise SystemExit(f"FAIL {path}: cold phase did not finish cleanly")
    checks = evaluate(
        reports,
        cold_reports,
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
