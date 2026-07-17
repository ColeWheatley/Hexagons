#!/usr/bin/env python3
"""Run a real beta-mode profiler soak without enabling ``?bench``.

Unlike scripted benchmarks, this opens the named beta release normally, so
the release policy must select ``bounded-recovery``.  It records start/end
reports plus browser heap snapshots, allowing AA-3 to prove that telemetry
does not grow with a long-lived Stubai session.
"""
from __future__ import annotations

import asyncio
import json
import os
import signal
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path
from urllib.parse import urlsplit

import websockets

from run_bench import CDP, CHROME, EXT_PROBE, free_debugging_port

SNAPSHOT = """JSON.stringify((() => {
  const profiler = window.pistonViewer?.profiler;
  const report = profiler?.getReport?.();
  const memory = performance.memory || null;
  return {
    profilerPresent: !!profiler,
    profilerMode: profiler?.mode || null,
    report,
    heap: memory ? {usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize, jsHeapSizeLimit: memory.jsHeapSizeLimit} : null,
    timestampMs: performance.now(),
  };
})())"""


async def soak(url: str, output: Path, seconds: int) -> None:
    profile = tempfile.mkdtemp(prefix="hexagons-beta-soak-")
    debug_port = free_debugging_port()
    target_host = urlsplit(url).hostname
    proc = subprocess.Popen([
        CHROME, "--headless=new", f"--remote-debugging-port={debug_port}",
        f"--user-data-dir={profile}", "--no-first-run", "--window-size=1440,900",
        "--hide-crash-restore-bubble", url,
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
    try:
        ws_url = None
        for _ in range(60):
            try:
                with urllib.request.urlopen(f"http://127.0.0.1:{debug_port}/json") as response:
                    pages = json.load(response)
                page = next((
                    item for item in pages
                    if item.get("type") == "page" and urlsplit(item.get("url", "")).hostname == target_host
                ), None)
                if page:
                    ws_url = page["webSocketDebuggerUrl"]
                    break
            except Exception:
                pass
            await asyncio.sleep(0.5)
        if not ws_url:
            raise RuntimeError("Chrome page target never appeared")
        async with websockets.connect(ws_url, max_size=64 * 1024 * 1024) as ws:
            cdp = CDP(ws)
            await cdp.call("Runtime.enable")
            await cdp.call("Page.enable")
            # Wait for the app/profiler rather than treating document load as ready.
            start = None
            for _ in range(120):
                raw = await cdp.js(SNAPSHOT)
                if raw:
                    candidate = json.loads(raw)
                    if candidate["profilerPresent"]:
                        start = candidate
                        break
                await asyncio.sleep(1)
            if not start:
                raise RuntimeError("beta profiler did not initialize")
            if start["profilerMode"] != "bounded-recovery":
                raise RuntimeError(f"expected bounded-recovery, got {start['profilerMode']!r}")
            gl = json.loads(await cdp.js(EXT_PROBE))
            print(f"[soak] started mode={start['profilerMode']} gl={gl}", flush=True)
            deadline = time.monotonic() + seconds
            while time.monotonic() < deadline:
                await asyncio.sleep(min(60, deadline - time.monotonic()))
                elapsed = seconds - max(0, deadline - time.monotonic())
                print(f"[soak] {elapsed:.0f}/{seconds}s", flush=True)
            end = json.loads(await cdp.js(SNAPSHOT))
            payload = {
                "kind": "aa3-stubai-beta-profiler-soak",
                "url": url,
                "requestedDurationSeconds": seconds,
                "headlessGL": gl,
                "start": start,
                "end": end,
                "verdict": {
                    "boundedRecovery": end["profilerMode"] == "bounded-recovery",
                    "sampleCap": len(end["report"]["samples"]) <= 180,
                    "noContextLoss": end["report"]["memory"]["contextLostCount"] == 0,
                    "noGlOutOfMemory": end["report"]["memory"]["glOutOfMemoryCount"] == 0,
                },
            }
            payload["verdict"]["passed"] = all(payload["verdict"].values())
            output.parent.mkdir(parents=True, exist_ok=True)
            output.write_text(json.dumps(payload, indent=2) + "\n")
            if not payload["verdict"]["passed"]:
                raise RuntimeError(f"AA-3 soak failed: {payload['verdict']}")
            print(f"[soak] PASS -> {output}", flush=True)
    finally:
        try:
            os.killpg(proc.pid, signal.SIGTERM)
        except ProcessLookupError:
            pass
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            try:
                os.killpg(proc.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
            proc.wait(timeout=5)
        shutil.rmtree(profile, ignore_errors=True)


def main() -> None:
    if len(sys.argv) != 4:
        raise SystemExit(f"usage: {Path(sys.argv[0]).name} URL OUT.json SECONDS")
    asyncio.run(soak(sys.argv[1], Path(sys.argv[2]), int(sys.argv[3])))


if __name__ == "__main__":
    main()
