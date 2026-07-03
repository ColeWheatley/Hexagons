#!/usr/bin/env python3
"""Report whether the local browser texture stack is ready for XUASTC KTX2."""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
TEST_ROOT = REPO_ROOT / "ktx2_nonrect_texture_test"
BASISU_BIN = os.environ.get("BASISU", "basisu")
THREE_PACKAGE = REPO_ROOT / "node_modules" / "three" / "package.json"
THREE_KTX2_LOADER = REPO_ROOT / "node_modules" / "three" / "examples" / "jsm" / "loaders" / "KTX2Loader.js"
THREE_BASIS_JS = REPO_ROOT / "node_modules" / "three" / "examples" / "jsm" / "libs" / "basis" / "basis_transcoder.js"
EXPERIMENT_LOADER = TEST_ROOT / "BasisV2KTX2Loader.js"
VENDORED_BASIS_JS = TEST_ROOT / "vendor" / "basisu_v2" / "basis_transcoder.js"
VENDORED_BASIS_WASM = TEST_ROOT / "vendor" / "basisu_v2" / "basis_transcoder.wasm"
APP_INDEX = REPO_ROOT / "frontend" / "app" / "index.html"


def run(command: list[str]) -> tuple[int, str]:
    try:
        result = subprocess.run(command, cwd=REPO_ROOT, check=False, capture_output=True, text=True)
    except FileNotFoundError:
        return 127, ""
    return result.returncode, f"{result.stdout}\n{result.stderr}".strip()


def read_text(path: Path) -> str:
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8", errors="replace")


def three_version() -> str:
    if not THREE_PACKAGE.exists():
        return "not installed"
    return json.loads(THREE_PACKAGE.read_text(encoding="utf-8")).get("version", "unknown")


def app_three_import() -> str:
    text = read_text(APP_INDEX)
    match = re.search(r"unpkg\.com/three@([^/]+)/", text)
    return match.group(1) if match else "not found"


def yes_no(value: bool) -> str:
    return "yes" if value else "no"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--require-xuastc", action="store_true", help="exit nonzero unless the experiment can encode and browser-load XUASTC")
    args = parser.parse_args()

    basisu_path = shutil.which(BASISU_BIN)
    version_code, version_text = run([BASISU_BIN, "-version"])
    help_code, help_text = run([BASISU_BIN, "-help"])
    loader_text = read_text(THREE_KTX2_LOADER)
    transcoder_text = read_text(THREE_BASIS_JS)
    experiment_loader_text = read_text(EXPERIMENT_LOADER)

    encoder_xuastc = "-ldr_6x6i" in help_text or "-xuastc_ldr_6x6" in help_text
    stock_loader_xuastc = "XUASTC" in loader_text or "xuastc" in loader_text
    stock_transcoder_xuastc = "XUASTC" in transcoder_text or "xuastc" in transcoder_text
    experiment_loader_xuastc = "isXUASTC_LDR" in experiment_loader_text and "cTFASTC_LDR_6x6_RGBA" in experiment_loader_text
    vendored_transcoder = VENDORED_BASIS_JS.exists() and VENDORED_BASIS_WASM.exists()
    current_loader_basis_only = "BasisFormat = {" in loader_text and "UASTC_4x4" in loader_text
    ready = encoder_xuastc and experiment_loader_xuastc and vendored_transcoder

    rows = [
        ("basisu binary", basisu_path or "not found"),
        ("basisu version", version_text.splitlines()[0] if version_code == 0 and version_text else "not runnable"),
        ("basisu exposes XUASTC", yes_no(encoder_xuastc)),
        ("three package", three_version()),
        ("frontend/app CDN three", app_three_import()),
        ("stock KTX2Loader mentions XUASTC", yes_no(stock_loader_xuastc)),
        ("stock basis_transcoder.js mentions XUASTC", yes_no(stock_transcoder_xuastc)),
        ("KTX2Loader Basis path", "ETC1S/UASTC" if current_loader_basis_only else "unknown"),
        ("experiment Basis v2 loader", yes_no(experiment_loader_xuastc)),
        ("vendored Basis v2 transcoder", yes_no(vendored_transcoder)),
    ]

    width = max(len(key) for key, _value in rows)
    for key, value in rows:
        print(f"{key:<{width}}  {value}")

    print()
    if ready:
        print("XUASTC experiment status: ready to generate and browser-load with the experimental Basis v2 loader.")
        if not stock_loader_xuastc:
            print("- Stock Three KTX2Loader still does not expose XUASTC; xuastc_* payloads are routed through ktx2_nonrect_texture_test/BasisV2KTX2Loader.js.")
        return 0

    print("XUASTC experiment status: not fully ready yet.")
    if not encoder_xuastc:
        print("- Install/build Basis Universal v2.x so `basisu -help` exposes `-ldr_6x6i` or `-xuastc_ldr_6x6`.")
    if not experiment_loader_xuastc:
        print("- Add/repair the experiment loader so it calls Basis v2 KTX2File.isXUASTC_LDR() and targets ASTC LDR block formats.")
    if not vendored_transcoder:
        print("- Vendor Basis Universal v2 `basis_transcoder.js` and `basis_transcoder.wasm` into ktx2_nonrect_texture_test/vendor/basisu_v2/.")
    if encoder_xuastc:
        print("- Generators can produce XUASTC, but browser loading still needs the missing loader/transcoder piece above.")
    else:
        print("- Generators will fall back to UASTC while recording the skipped XUASTC payload in manifests.")

    return 1 if args.require_xuastc else 0


if __name__ == "__main__":
    sys.exit(main())
