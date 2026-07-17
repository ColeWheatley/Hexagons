#!/usr/bin/env python3
"""Deterministic, asset-free acceptance policy for the AA-2 browser gate."""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path


def _number(value, default=0.0):
    return float(value) if isinstance(value, (int, float)) and math.isfinite(value) else default


def evaluate_fault_recovery_report(report: dict) -> list[dict]:
    checks = []

    def add(name: str, passed: bool, detail: str):
        checks.append({"name": name, "passed": bool(passed), "detail": detail})

    meta = report.get("meta") or {}
    add(
        "explicit-full-assets-run",
        meta.get("kind") == "aa2-fault-recovery" and meta.get("fullAssets") is True,
        f"kind={meta.get('kind')!r}, fullAssets={meta.get('fullAssets')!r}",
    )

    faults = report.get("faultInjection") or {}
    total_unique = 0
    total_dropped = 0
    total_attempts = 0
    max_attempts = 0
    for kind in ("terrain", "texture"):
        row = faults.get(kind) or {}
        unique = int(_number(row.get("uniqueResources")))
        dropped = int(_number(row.get("droppedFirstAttempts")))
        attempts = int(_number(row.get("requestAttempts")))
        per_resource = row.get("attemptsByResource") or {}
        dropped_urls = row.get("droppedResources") or []
        successful_urls = set(row.get("successfulResources") or [])
        local_max = max((int(_number(value)) for value in per_resource.values()), default=0)
        rate = (100.0 * dropped / unique) if unique else 0.0

        add(
            f"{kind}-fault-sample-is-large-enough",
            unique >= 10 and dropped >= 1,
            f"{unique} unique resources, {dropped} deterministic first-attempt drops",
        )
        add(
            f"{kind}-drop-rate-approximates-ten-percent",
            5.0 <= rate <= 12.5,
            f"{dropped}/{unique} = {rate:.1f}% (accepted 5.0-12.5% discrete range)",
        )
        recovered = [url for url in dropped_urls if int(_number(per_resource.get(url))) >= 2 and url in successful_urls]
        add(
            f"{kind}-all-injected-drops-recovered",
            len(recovered) == len(dropped_urls) == dropped,
            f"{len(recovered)}/{dropped} dropped resources retried and received a successful response",
        )
        add(
            f"{kind}-retry-budget-is-bounded",
            local_max <= 3 and attempts <= unique + (2 * dropped),
            f"max {local_max} attempts/resource; {attempts} total vs limit {unique + 2 * dropped}",
        )
        total_unique += unique
        total_dropped += dropped
        total_attempts += attempts
        max_attempts = max(max_attempts, local_max)

    add(
        "fault-injection-observed",
        total_unique >= 20 and total_dropped >= 2,
        f"tracked {total_unique} unique assets, dropped {total_dropped}, observed {total_attempts} attempts",
    )

    ready = report.get("ready") or {}
    ready_stats = ready.get("stats") or {}
    failures = ready_stats.get("failures") or {}
    visible_tiles = int(_number((ready_stats.get("tileClassification") or {}).get("visible", {}).get("count")))
    active_textures = int(_number(ready.get("activeTexturePages")))
    add(
        "faulted-load-painted-visible-textured-terrain",
        ready.get("loaderHidden") is True
        and ready.get("visibleTexturedCoverage") is True
        and visible_tiles > 0
        and active_textures > 0,
        f"loaderHidden={ready.get('loaderHidden')}, milestone={ready.get('visibleTexturedCoverage')}, "
        f"visibleTiles={visible_tiles}, activeTexturePages={active_textures}",
    )
    tiles_failed = int(_number((failures.get("tiles") or {}).get("failed")))
    textures_failed = int(_number((failures.get("textures") or {}).get("failed")))
    add(
        "no-spinner-hang-or-final-resource-failure",
        ready.get("fatalState") is None
        and tiles_failed == 0
        and textures_failed == 0
        and int(_number(failures.get("globalErrors"))) == 0
        and int(_number(failures.get("unhandledRejections"))) == 0,
        f"fatal={ready.get('fatalState')!r}, failed tiles/textures={tiles_failed}/{textures_failed}, "
        f"global/unhandled={failures.get('globalErrors', 0)}/{failures.get('unhandledRejections', 0)}",
    )

    context = report.get("contextRecovery") or {}
    after = context.get("after") or {}
    after_stats = after.get("stats") or {}
    context_stats = (after_stats.get("failures") or {}).get("context") or {}
    observed_ms = _number(context.get("observedRecoveryMs"), float("inf"))
    app_ms = _number(context_stats.get("recoveryDurationMs"), float("inf"))
    add(
        "webgl-lose-context-supported-and-observed",
        context.get("extensionSupported") is True
        and context.get("lossObserved") is True
        and int(_number(context_stats.get("lost"))) >= 1,
        f"extension={context.get('extensionSupported')}, lossObserved={context.get('lossObserved')}, "
        f"lostCount={context_stats.get('lost')}",
    )
    add(
        "webgl-context-restored-within-five-seconds",
        context.get("restoreObserved") is True
        and context_stats.get("recovering") is False
        and int(_number(context_stats.get("restored"))) >= 1
        and int(_number(context_stats.get("recoveryFailures"))) == 0
        and observed_ms <= 5000
        and app_ms <= 5000,
        f"observed={observed_ms:.1f} ms, app={app_ms:.1f} ms, restored={context_stats.get('restored')}, "
        f"failures={context_stats.get('recoveryFailures')}",
    )
    add(
        "context-restore-repainted-terrain-and-cleared-loader",
        context.get("renderedAfterRestore") is True
        and after.get("loaderHidden") is True
        and after.get("visibleTexturedCoverage") is True
        and int(_number(after.get("activeTexturePages"))) > 0,
        f"rendered={context.get('renderedAfterRestore')}, loaderHidden={after.get('loaderHidden')}, "
        f"textured={after.get('visibleTexturedCoverage')}, activeTexturePages={after.get('activeTexturePages')}",
    )

    return checks


def validate(report: dict) -> bool:
    checks = evaluate_fault_recovery_report(report)
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
