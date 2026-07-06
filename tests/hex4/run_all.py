#!/usr/bin/env python3
"""Single entry point for the HEX4 binary-format regression harness."""

from __future__ import annotations

import sys
from pathlib import Path

from bake_fixtures import ensure_fixtures
from hex4_common import SuiteResult
import test_corruption
import test_determinism
import test_golden
import test_parity
import test_semantics
import test_structure


def _print_summary(results: list[SuiteResult]) -> None:
    rows = [(result.suite, result.checks, result.passed, result.failed) for result in results]
    total = SuiteResult("total")
    for result in results:
        total.merge(result)
    rows.append((total.suite, total.checks, total.passed, total.failed))

    print("\nHEX4 regression summary")
    print(f"{'suite':<14} {'checks':>10} {'passed':>10} {'failed':>10}")
    print("-" * 49)
    for suite, checks, passed, failed in rows:
        print(f"{suite:<14} {checks:>10} {passed:>10} {failed:>10}")

    failures = [failure for result in results for failure in result.failures]
    if failures:
        print("\nFailures")
        for failure in failures[:80]:
            print(f"- {failure}")
        if len(failures) > 80:
            print(f"- ... {len(failures) - 80} more")


def run_all(*, regen_goldens: bool = False) -> list[SuiteResult]:
    print("Baking HEX4 fixtures...")
    paths = ensure_fixtures(force=True)
    print(f"Baked {len(paths)} fixtures.")

    suites = [
        test_structure.run(paths),
        test_parity.run(paths),
        test_semantics.run(paths),
        test_determinism.run(paths),
        test_golden.run(paths, regen_goldens=regen_goldens),
        test_corruption.run(paths),
    ]
    return suites


def main(argv: list[str] | None = None) -> int:
    argv = argv if argv is not None else sys.argv[1:]
    regen_goldens = "--regen" in argv
    unknown = [arg for arg in argv if arg != "--regen"]
    if unknown:
        print(f"usage: python3 tests/hex4/run_all.py [--regen]", file=sys.stderr)
        print(f"unknown arguments: {', '.join(unknown)}", file=sys.stderr)
        return 2

    results = run_all(regen_goldens=regen_goldens)
    _print_summary(results)
    return 0 if all(result.ok for result in results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
