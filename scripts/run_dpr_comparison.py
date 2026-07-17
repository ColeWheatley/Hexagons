#!/usr/bin/env python3
"""Run an auditable DPR>2 capped-vs-native pair using the same benchmark.

Example (with a built app served at localhost):
  python3 scripts/run_dpr_comparison.py http://localhost:8099/?bench=orbit perf_reports/dpr3 --dpr 3

The native arm is intentionally available only through the benchmark-only
``benchRenderDprCap=native`` URL.  It is not a production rendering setting.
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RUNNER = ROOT / "scripts" / "run_bench.py"


def run_arm(url, output, screenshot, dpr, cap):
    command = [sys.executable, str(RUNNER), url, str(output), "--screenshot", str(screenshot),
               "--dpr", str(dpr), "--render-cap", cap]
    subprocess.run(command, check=True, cwd=ROOT)
    return json.loads(output.read_text())


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("url", help="served viewer URL; include ?bench=<scenario>")
    parser.add_argument("output_dir", type=Path)
    parser.add_argument("--dpr", type=float, default=3)
    parser.add_argument("--from-existing", action="store_true",
                        help="validate capped.json/native.json already in output_dir and write comparison.json")
    args = parser.parse_args()
    if args.dpr <= 2:
        parser.error("--dpr must be greater than 2 for the AA-10 comparison")
    if "bench=" not in args.url:
        parser.error("URL must select a deterministic ?bench=<scenario>")

    args.output_dir.mkdir(parents=True, exist_ok=True)
    if args.from_existing:
        capped = json.loads((args.output_dir / "capped.json").read_text())
        native = json.loads((args.output_dir / "native.json").read_text())
    else:
        capped = run_arm(args.url, args.output_dir / "capped.json", args.output_dir / "capped.png", args.dpr, "capped")
        native = run_arm(args.url, args.output_dir / "native.json", args.output_dir / "native.png", args.dpr, "native")
    capped_resolution, native_resolution = capped.get("renderResolution"), native.get("renderResolution")
    if not capped_resolution or not native_resolution:
        raise RuntimeError("benchmark did not expose renderer resolution")
    if capped_resolution["renderPixelRatio"] > 2 or native_resolution["renderPixelRatio"] != args.dpr:
        raise RuntimeError(f"unexpected DPR arms: capped={capped_resolution}, native={native_resolution}")
    static = capped.get("staticBufferInstrumentation") or {}
    if static.get("avoidedStaticAttributeUploads", 0) <= 0:
        raise RuntimeError(f"static buffer sharing was not observed: {static}")

    capped_p95 = capped.get("frames", {}).get("p95_ms")
    native_p95 = native.get("frames", {}).get("p95_ms")
    comparison = {
        "kind": "aa10-dpr-capped-vs-native",
        "dpr": args.dpr,
        "capped": {"report": "capped.json", "screenshot": "capped.png", "renderResolution": capped_resolution},
        "native": {"report": "native.json", "screenshot": "native.png", "renderResolution": native_resolution},
        "p95Ms": {"capped": capped_p95, "native": native_p95,
                  "deltaNativeMinusCapped": native_p95 - capped_p95
                  if isinstance(capped_p95, (int, float)) and isinstance(native_p95, (int, float)) else None},
        "staticBufferInstrumentation": static,
        "visualSignoff": "not assessed; captures are for human DPR-2/native review",
    }
    (args.output_dir / "comparison.json").write_text(json.dumps(comparison, indent=2) + "\n")
    print(json.dumps(comparison, indent=2))


if __name__ == "__main__":
    main()
