#!/usr/bin/env python3
"""Fixture-testable policy for the AA-20 UX and axe browser report."""
import argparse
import json
import sys
from pathlib import Path


def evaluate(report):
    search = report.get("search") or {}
    controls = report.get("controls") or {}
    navigation = report.get("navigation") or {}
    persistence = report.get("persistence") or {}
    reload = report.get("reload") or {}
    reduced = report.get("reducedMotion") or {}
    axe = report.get("axe") or {}
    rows = [
        ("search task", search.get("results", 0) >= 1 and search.get("maxLongTaskMs", float("inf")) <= 50),
        ("truthful control", controls.get("after") == 0),
        ("keyboard navigation", navigation.get("moved") is True and navigation.get("urlUpdated") is True and navigation.get("inputIsolated") is True),
        ("view persistence", persistence.get("stored") is True and reload.get("stored") is True),
        ("reduced motion", reduced.get("matches") is True),
        ("axe serious/critical", isinstance(axe.get("seriousCritical"), list) and not axe["seriousCritical"]),
    ]
    return [{"name": name, "passed": passed} for name, passed in rows]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("report", type=Path)
    args = parser.parse_args()
    report = json.loads(args.report.read_text())
    checks = evaluate(report)
    report["checks"] = checks
    report["passed"] = all(row["passed"] for row in checks)
    args.report.write_text(json.dumps(report, indent=2) + "\n")
    for row in checks:
        print(f"{'PASS' if row['passed'] else 'FAIL'} {row['name']}", file=sys.stdout if row["passed"] else sys.stderr)
    return 0 if report["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
