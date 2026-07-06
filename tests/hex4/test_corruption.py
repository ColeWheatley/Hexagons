#!/usr/bin/env python3
"""Corruption-detection checks for HEX4 parsers and structure validation."""

from __future__ import annotations

import shutil
import struct
import subprocess
import sys
import tempfile
from pathlib import Path

from hex4_common import REPO_ROOT, THIS_DIR, SuiteResult, fixture_bin_paths, print_single_suite
from parse_hex4 import parse_file
from test_structure import validate_structure


KNOWN_GAPS = [
    "The JS worker parser accepts garbage tail bytes because parseBinaryV3 never checks the final offset.",
]


def _write_case(src: Path, tmp_root: Path, name: str, mutate) -> Path:
    out = tmp_root / f"{src.stem}_{name}.bin"
    data = bytearray(src.read_bytes())
    mutate(data)
    out.write_bytes(data)
    return out


def _python_fails(path: Path) -> bool:
    try:
        parse_file(path, strict=True)
    except Exception:
        return True
    return False


def _js_fails(path: Path) -> bool:
    cmd = ["node", str(THIS_DIR / "parse_hex4.mjs"), str(path)]
    proc = subprocess.run(cmd, cwd=REPO_ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
    return proc.returncode != 0


def _structure_fails(path: Path) -> bool:
    return not validate_structure(path).ok


def _mutations(src: Path, tmp_root: Path) -> dict[str, Path]:
    cases: dict[str, Path] = {}
    cases["signature"] = _write_case(src, tmp_root, "bad_signature", lambda data: data.__setitem__(0, data[0] ^ 0xFF))

    def bad_count(data: bytearray) -> None:
        data[32:36] = struct.pack("<I", 0xFFFFFFFF)

    cases["count_field"] = _write_case(src, tmp_root, "bad_count", bad_count)

    def truncate_mid_layer(data: bytearray) -> None:
        keep = 32 + 4 + 23
        del data[keep:]

    cases["truncation_mid_layer"] = _write_case(src, tmp_root, "truncated", truncate_mid_layer)
    cases["garbage_tail"] = _write_case(src, tmp_root, "garbage_tail", lambda data: data.extend(b"HEX4TAIL"))
    return cases


def run(paths: list[Path] | None = None) -> SuiteResult:
    paths = paths or fixture_bin_paths()
    result = SuiteResult("corruption")
    if not paths:
        result.fail("fixtures exist", "run bake_fixtures.py first")
        return result

    src = paths[0]
    tmp_parent = THIS_DIR / "tmp"
    tmp_parent.mkdir(parents=True, exist_ok=True)
    tmp_root = Path(tempfile.mkdtemp(prefix="corruption_", dir=tmp_parent))
    try:
        cases = _mutations(src, tmp_root)
        for name, path in cases.items():
            py_failed = _python_fails(path)
            js_failed = _js_fails(path)
            structure_failed = _structure_fails(path)
            result.check(py_failed, f"{name} Python parser rejects corruption")
            if name == "garbage_tail":
                result.check(not js_failed, f"{name} documents JS silent acceptance")
                result.check(structure_failed, f"{name} structural validation catches tail bytes")
            else:
                result.check(js_failed, f"{name} JS parser rejects corruption")
            result.check(
                (py_failed and js_failed) or structure_failed,
                f"{name} detected by parsers or structural suite",
                f"py_failed={py_failed} js_failed={js_failed} structure_failed={structure_failed}",
            )
    finally:
        shutil.rmtree(tmp_root, ignore_errors=True)
    return result


def main(argv: list[str] | None = None) -> int:
    argv = argv if argv is not None else sys.argv[1:]
    if not fixture_bin_paths():
        from bake_fixtures import ensure_fixtures

        ensure_fixtures(force=True, quiet=True)
    paths = [Path(item) for item in argv] if argv else None
    return print_single_suite(run(paths))


if __name__ == "__main__":
    raise SystemExit(main())
