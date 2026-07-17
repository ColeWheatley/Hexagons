#!/usr/bin/env python3
"""Validate same-profile service-worker cold/warm benchmark pairs."""

import argparse
import json
import statistics
from pathlib import Path


def metric(report, name):
    value = report.get("comparison", {}).get(name)
    if not isinstance(value, (int, float)):
        raise ValueError(f"missing numeric comparison.{name}")
    return float(value)


def validate_pair(report, path):
    problems = []
    if report.get("meta", {}).get("kind") != "service-worker-warm-reload":
        problems.append("not a service-worker warm-reload report")
    if report.get("meta", {}).get("sameProfile") is not True:
        problems.append("cold and warm navigations did not share a browser profile")

    for phase in ("cold", "warm"):
        meta = report.get(phase, {}).get("meta", {})
        if meta.get("finished") is not True:
            problems.append(f"{phase} benchmark did not finish")
        if meta.get("crashed") is True:
            problems.append(f"{phase} benchmark crashed")

    sw = report.get("serviceWorker", {})
    before = sw.get("beforeWarmNavigation", {})
    after = sw.get("afterWarmNavigation", {})
    if not before.get("ready"):
        problems.append("service worker was not ready before warm navigation")
    if not before.get("controlled"):
        problems.append("service worker did not control the page before warm navigation")
    if not after.get("controlled"):
        problems.append("service worker did not control the warm page")
    if before.get("controllerScriptURL") != after.get("controllerScriptURL"):
        problems.append("service-worker controller changed across the warm navigation")

    try:
        cold = metric(report, "coldTTFTFMs")
        warm = metric(report, "warmTTFTFMs")
        improvement = metric(report, "improvementPercent")
        if cold <= 0 or warm < 0:
            problems.append(f"invalid TTFTF values cold={cold} warm={warm}")
    except ValueError as error:
        cold = warm = improvement = None
        problems.append(str(error))

    if problems:
        raise ValueError(f"{path}: " + "; ".join(problems))
    return {"cold": cold, "warm": warm, "improvement": improvement}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("reports", nargs="+", type=Path)
    parser.add_argument("--min-improvement-percent", type=float, default=60.0)
    args = parser.parse_args()

    rows = []
    failed = False
    for path in args.reports:
        try:
            row = validate_pair(json.loads(path.read_text()), path)
            rows.append(row)
            print(
                f"{path}: cold {row['cold']:.1f} ms -> warm {row['warm']:.1f} ms "
                f"({row['improvement']:.1f}% faster; controlled)",
            )
        except (OSError, json.JSONDecodeError, ValueError) as error:
            print(f"FAIL {error}")
            failed = True

    if rows:
        improvement = statistics.median(row["improvement"] for row in rows)
        cold = statistics.median(row["cold"] for row in rows)
        warm = statistics.median(row["warm"] for row in rows)
        print(
            f"median cold {cold:.1f} ms -> warm {warm:.1f} ms; improvement "
            f"{improvement:.1f}% (required {args.min_improvement_percent:.1f}%)",
        )
        if improvement < args.min_improvement_percent:
            print(
                f"FAIL median warm-reload TTFTF improvement {improvement:.1f}% is below "
                f"{args.min_improvement_percent:.1f}%",
            )
            failed = True
    else:
        failed = True
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
