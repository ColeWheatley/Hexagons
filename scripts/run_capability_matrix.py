#!/usr/bin/env python3
"""Run the AA-11 capability policy against the real viewer in headless Chrome.

Every row uses a fresh Chrome profile. Standard browser capability properties
are overridden at document creation time, before any application module runs.
The resulting report records both the injected values and the values observed
by the page so an emulation failure cannot masquerade as a policy result.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import shutil
import socket
import subprocess
import tempfile
import time
import urllib.request
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import websockets

try:
    # Direct script execution places scripts/ on sys.path.
    from run_bench import CHROME, CDP, summarize_network_events, wait_for_report
except ModuleNotFoundError:  # Imported as scripts.run_capability_matrix in tests/tools.
    from scripts.run_bench import CHROME, CDP, summarize_network_events, wait_for_report


MATRIX = (
    {
        "name": "low-device",
        "expectedProfile": "low",
        "signals": {"deviceMemory": 2, "hardwareConcurrency": 4, "effectiveType": "4g", "saveData": False},
    },
    {
        "name": "mid-device",
        "expectedProfile": "mid",
        "signals": {"deviceMemory": 4, "hardwareConcurrency": 4, "effectiveType": "4g", "saveData": False},
    },
    {
        "name": "high-device",
        "expectedProfile": "high",
        "signals": {"deviceMemory": 16, "hardwareConcurrency": 12, "effectiveType": "4g", "saveData": False},
    },
    {
        "name": "save-data",
        "expectedProfile": "low",
        "signals": {"deviceMemory": 16, "hardwareConcurrency": 12, "effectiveType": "4g", "saveData": True},
    },
    {
        "name": "constrained-network",
        "expectedProfile": "low",
        "signals": {"deviceMemory": 16, "hardwareConcurrency": 12, "effectiveType": "3g", "saveData": False},
    },
)


OBSERVED_SIGNALS = """JSON.stringify({
  deviceMemory: navigator.deviceMemory,
  hardwareConcurrency: navigator.hardwareConcurrency,
  effectiveType: navigator.connection?.effectiveType ?? null,
  saveData: navigator.connection?.saveData ?? null,
  provenance: window.__AA11_SIGNAL_PROVENANCE__ || null,
})"""

DETAILED_STATS = "JSON.stringify(window.pistonViewer?.getDetailedStats?.('aa11-capability-gate') || null)"


def _free_port() -> int:
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def _scenario_url(base_url: str, duration: float, case_name: str) -> str:
    parts = urlsplit(base_url)
    query = dict(parse_qsl(parts.query, keep_blank_values=True))
    query.update(bench="capability", benchDuration=f"{duration:g}", aa11Gate=case_name)
    return urlunsplit((parts.scheme, parts.netloc, parts.path or "/", urlencode(query), parts.fragment))


def _injection(case: dict) -> str:
    signals = json.dumps(case["signals"], separators=(",", ":"))
    provenance = json.dumps(
        {
            "method": "Page.addScriptToEvaluateOnNewDocument",
            "signalSurface": "standard navigator properties",
            "case": case["name"],
        },
        separators=(",", ":"),
    )
    return f"""(() => {{
      const signals = Object.freeze({signals});
      const define = (name, value) => Object.defineProperty(navigator, name, {{
        configurable: true, enumerable: true, get: () => value,
      }});
      define('deviceMemory', signals.deviceMemory);
      define('hardwareConcurrency', signals.hardwareConcurrency);
      const connection = Object.freeze({{
        effectiveType: signals.effectiveType,
        saveData: signals.saveData,
        downlink: signals.effectiveType === '3g' ? 1.2 : 10,
        rtt: signals.effectiveType === '3g' ? 350 : 50,
        addEventListener() {{}}, removeEventListener() {{}},
      }});
      define('connection', connection);
      Object.defineProperty(window, '__AA11_SIGNAL_PROVENANCE__', {{
        configurable: false, enumerable: false, value: Object.freeze({provenance}),
      }});
    }})()"""


async def _run_case(base_url: str, case: dict, timeout: float, duration: float, viewport: str) -> dict:
    profile = tempfile.mkdtemp(prefix=f"chrome-aa11-{case['name']}-")
    port = _free_port()
    proc = subprocess.Popen(
        [
            CHROME,
            "--headless=new",
            f"--remote-debugging-port={port}",
            f"--user-data-dir={profile}",
            "--no-first-run",
            f"--window-size={viewport}",
            "--hide-crash-restore-bubble",
            "about:blank",
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    try:
        target = None
        deadline = time.monotonic() + 30
        while time.monotonic() < deadline:
            try:
                with urllib.request.urlopen(f"http://127.0.0.1:{port}/json", timeout=1) as response:
                    targets = json.load(response)
                target = next((row for row in targets if row.get("type") == "page"), None)
                if target:
                    break
            except (OSError, ValueError):
                pass
            await asyncio.sleep(0.25)
        if not target:
            raise RuntimeError(f"Chrome page target never appeared for {case['name']}")

        async with websockets.connect(target["webSocketDebuggerUrl"], max_size=64 * 1024 * 1024) as websocket:
            cdp = CDP(websocket)
            await cdp.call("Runtime.enable")
            await cdp.call("Page.enable")
            await cdp.call("Network.enable")
            width, height = (int(value) for value in viewport.split(",", 1))
            await cdp.call(
                "Emulation.setDeviceMetricsOverride",
                {"width": width, "height": height, "deviceScaleFactor": 1, "mobile": False},
            )
            await cdp.call("Page.addScriptToEvaluateOnNewDocument", {"source": _injection(case)})
            url = _scenario_url(base_url, duration, case["name"])
            await cdp.call("Page.navigate", {"url": url})
            benchmark = await wait_for_report(cdp, timeout, label=case["name"])
            observed_raw = await cdp.js(OBSERVED_SIGNALS)
            detailed_raw = await cdp.js(DETAILED_STATS)
            observed = json.loads(observed_raw) if observed_raw else None
            detailed = json.loads(detailed_raw) if detailed_raw else None
            if not observed or not detailed:
                raise RuntimeError(f"missing viewer snapshot for {case['name']}")
            return {
                "name": case["name"],
                "expectedProfile": case["expectedProfile"],
                "url": url,
                "injected": case["signals"],
                "observed": observed,
                "benchmark": benchmark,
                "detailedStats": detailed,
                "networkResponses": summarize_network_events(cdp.events),
            }
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.wait(timeout=5)
        shutil.rmtree(profile, ignore_errors=True)


async def run_matrix(base_url: str, timeout: float, duration: float, viewport: str) -> dict:
    rows = []
    for case in MATRIX:
        print(f"[aa11] {case['name']} signals={case['signals']}", flush=True)
        row = await _run_case(base_url, case, timeout, duration, viewport)
        stats = row["detailedStats"]
        print(
            f"  observed={row['observed']} selected={stats['capability']} "
            f"textureBytes={stats['network']['texBytes']} "
            f"context={stats['failures']['context']}",
            flush=True,
        )
        rows.append(row)
    return {
        "schemaVersion": 1,
        "kind": "aa11-capability-matrix",
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "provenance": {
            "runner": "headless Chrome via CDP",
            "injection": "Page.addScriptToEvaluateOnNewDocument",
            "signalSurface": "standard navigator capability properties",
            "freshProfilePerCase": True,
            "scenario": "capability",
            "scenarioDurationSeconds": duration,
            "viewport": viewport,
        },
        "cases": rows,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("url")
    parser.add_argument("output", type=Path)
    parser.add_argument("--timeout", type=float, default=150)
    parser.add_argument("--scenario-duration", type=float, default=20)
    parser.add_argument("--viewport", default="1440,900")
    args = parser.parse_args()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    report = asyncio.run(run_matrix(args.url, args.timeout, args.scenario_duration, args.viewport))
    args.output.write_text(json.dumps(report, indent=2) + "\n")
    print(f"[aa11] wrote {args.output}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
