#!/usr/bin/env python3
"""Validate three cold starts and three orbit runs against AA-20 budgets.

The release matrix reuses the cold phase of its three service-worker warm-pair
runs for ready/TTFTF. Orbit reports provide active frame timing; a moving orbit
does not necessarily reach the stationary visible-coverage milestone.
"""
import argparse
import json
import math
import statistics
import sys
from pathlib import Path


# Three-trial medians on the fixed M1 Pro runner use a 25% envelope. This is
# wide enough for cold-start/browser noise but narrow enough to reject a
# material slowdown long before the hard safety ceilings.
DEFAULT_ALLOWED_REGRESSION_PERCENT = 25.0
METRICS = (
    ("cold ready", "milestones.loaderHidden", "max_ready_ms"),
    ("cold TTFTF", "milestones.visibleTexturedCoverage", "max_ttftf_ms"),
    ("orbit frame p95", "frames.p95_ms", "max_frame_p95_ms"),
    ("orbit frame p99", "frames.p99_ms", "max_frame_p99_ms"),
)


def numeric(value):
    return (isinstance(value, (int, float)) and not isinstance(value, bool)
            and math.isfinite(value) and value >= 0)


def load_baseline(path):
    """Load the versioned AA-20 median reference, rejecting ambiguous input."""
    try:
        raw = json.loads(Path(path).read_text())
    except (OSError, json.JSONDecodeError) as error:
        raise ValueError(f"cannot read baseline {path}: {error}") from error
    if not isinstance(raw, dict) or raw.get("version") != 1:
        raise ValueError("baseline must be an object with version 1")
    allowance = raw.get("allowedRegressionPercent", DEFAULT_ALLOWED_REGRESSION_PERCENT)
    if not numeric(allowance) or allowance > 1000:
        raise ValueError("baseline allowedRegressionPercent must be a finite non-negative number <= 1000")
    medians = raw.get("medians")
    expected = {dotted for _, dotted, _ in METRICS}
    if not isinstance(medians, dict) or set(medians) != expected:
        raise ValueError(f"baseline medians must contain exactly: {', '.join(sorted(expected))}")
    if any(not numeric(item) or item <= 0 for item in medians.values()):
        raise ValueError("baseline medians must all be finite positive numbers")
    return {"allowedRegressionPercent": float(allowance), "medians": medians}


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


def evaluate(orbit_reports, cold_reports=None, *, baseline, max_ready_ms=15000, max_ttftf_ms=30000,
             max_frame_p95_ms=100, max_frame_p99_ms=150):
    cold_reports = cold_reports or orbit_reports
    checks = []
    limits = locals()
    allowance = baseline["allowedRegressionPercent"]
    for label, dotted, limit_name in METRICS:
        reports = cold_reports if label.startswith("cold") else orbit_reports
        limit = limits[limit_name]
        reference = baseline["medians"][dotted]
        regression_limit = reference * (1 + allowance / 100)
        try:
            observed = median(reports, dotted)
            passed = observed <= limit and observed <= regression_limit
            detail = (f"median {observed:.1f} ms (release budget {limit:.1f} ms; "
                      f"baseline {reference:.1f} ms +{allowance:.1f}% = {regression_limit:.1f} ms)")
        except ValueError as error:
            observed = None
            passed = False
            detail = str(error)
        checks.append({"name": label, "passed": passed, "observed": observed,
                       "limit": limit, "baseline": reference,
                       "regression_limit": regression_limit, "detail": detail})
    return checks


def main(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument("reports", nargs=3, type=Path)
    parser.add_argument("--cold-reports", nargs=3, type=Path,
                        help="warm-pair reports whose nested cold phases gate ready/TTFTF")
    parser.add_argument("--max-ready-ms", type=float, default=15000)
    parser.add_argument("--max-ttftf-ms", type=float, default=30000)
    parser.add_argument("--max-frame-p95-ms", type=float, default=100)
    parser.add_argument("--max-frame-p99-ms", type=float, default=150)
    parser.add_argument("--baseline", required=True, type=Path,
                        help="versioned AA-20 median reference; required for release gating")
    args = parser.parse_args(argv)
    try:
        baseline = load_baseline(args.baseline)
    except ValueError as error:
        print(f"FAIL performance baseline: {error}", file=sys.stderr)
        return 1
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
        baseline=baseline,
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
