#!/usr/bin/env python3
"""Fail when benchmark reports show shell overflow or primary UI overlap."""
import json
import sys
from pathlib import Path


def main() -> int:
    failed = False
    for path_arg in sys.argv[1:]:
        path = Path(path_arg)
        audit = json.loads(path.read_text()).get("viewportAudit")
        if not isinstance(audit, dict):
            print(f"FAIL {path}: missing viewportAudit", file=sys.stderr)
            failed = True
            continue
        problems = []
        if audit.get("horizontalOverflow"):
            problems.append("horizontal overflow")
        if audit.get("outOfViewport"):
            problems.append(f"out of viewport: {audit['outOfViewport']}")
        if audit.get("overlaps"):
            problems.append(f"overlaps: {audit['overlaps']}")
        if audit.get("controlOutOfViewport"):
            problems.append(f"controls out of viewport: {audit['controlOutOfViewport']}")
        if audit.get("missedHitTargets"):
            problems.append(f"controls fail center hit-test: {audit['missedHitTargets']}")
        if problems:
            print(f"FAIL {path}: {'; '.join(problems)}", file=sys.stderr)
            failed = True
        else:
            print(f"viewport {audit.get('width')}x{audit.get('height')}: no shell overlap")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
