#!/usr/bin/env python3
"""Fail when benchmark reports show shell overflow or primary UI overlap."""
import json
import sys
from pathlib import Path

REQUIRED_WIDTHS = (320, 390, 768, 1280)


def evaluate(rows, required_widths=REQUIRED_WIDTHS):
    results = []
    observed = []
    for label, report in rows:
        audit = report.get("viewportAudit")
        problems = []
        if not isinstance(audit, dict):
            problems.append("missing viewportAudit")
        else:
            width = audit.get("width")
            observed.append(width)
            if audit.get("horizontalOverflow"): problems.append("horizontal overflow")
            if audit.get("outOfViewport"): problems.append(f"out of viewport: {audit['outOfViewport']}")
            if audit.get("overlaps"): problems.append(f"overlaps: {audit['overlaps']}")
            if audit.get("controlOutOfViewport"): problems.append(f"controls out of viewport: {audit['controlOutOfViewport']}")
            if audit.get("missedHitTargets"): problems.append(f"controls fail center hit-test: {audit['missedHitTargets']}")
        results.append({"name": str(label), "passed": not problems, "detail": "; ".join(problems) or "no shell overlap"})
    expected = list(required_widths)
    results.append({"name": "required viewport coverage", "passed": sorted(observed) == sorted(expected),
        "detail": f"observed={sorted(observed, key=lambda x: (x is None, x))} required={sorted(expected)}"})
    return results


def main() -> int:
    rows = [(path, json.loads(path.read_text())) for path in map(Path, sys.argv[1:])]
    checks = evaluate(rows)
    for check in checks:
        print(f"{'PASS' if check['passed'] else 'FAIL'} {check['name']}: {check['detail']}",
              file=sys.stdout if check["passed"] else sys.stderr)
    return 0 if all(check["passed"] for check in checks) else 1


if __name__ == "__main__":
    raise SystemExit(main())
