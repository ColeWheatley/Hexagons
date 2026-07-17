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
import argparse
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
  const serialized = report ? JSON.stringify(report) : '';
  const memory = performance.memory || null;
  return {
    profilerPresent: !!profiler,
    profilerMode: profiler?.mode || null,
    report,
    profilerSerializedBytes: new TextEncoder().encode(serialized).byteLength,
    profilerSampleCount: report?.samples?.length ?? null,
    heap: memory ? {usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize, jsHeapSizeLimit: memory.jsHeapSizeLimit} : null,
    timestampMs: performance.now(),
  };
})())"""


async def capture(cdp: CDP, elapsed_seconds: float) -> dict:
    # GC before each heap point makes the slope about retained memory instead
    # of arbitrary young-generation timing. Unsupported CDP implementations
    # still emit a sample; the validator records that limitation via null heap.
    try:
        await cdp.call("HeapProfiler.collectGarbage")
    except RuntimeError:
        pass
    snapshot = json.loads(await cdp.js(SNAPSHOT))
    snapshot["elapsedSeconds"] = round(elapsed_seconds, 3)
    return snapshot


async def soak(url: str, output: Path, seconds: int, sample_interval: int) -> None:
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
            started = time.monotonic()
            samples = [await capture(cdp, 0)]
            deadline = time.monotonic() + seconds
            while time.monotonic() < deadline:
                await asyncio.sleep(min(sample_interval, deadline - time.monotonic()))
                elapsed = seconds - max(0, deadline - time.monotonic())
                print(f"[soak] {elapsed:.0f}/{seconds}s", flush=True)
                samples.append(await capture(cdp, time.monotonic() - started))
            end = samples[-1]
            payload = {
                "kind": "aa3-stubai-beta-profiler-soak",
                "url": url,
                "requestedDurationSeconds": seconds,
                "sampleIntervalSeconds": sample_interval,
                "headlessGL": gl,
                "start": samples[0],
                "end": end,
                "samples": samples,
            }
            output.parent.mkdir(parents=True, exist_ok=True)
            output.write_text(json.dumps(payload, indent=2) + "\n")
            print(f"[soak] captured {len(samples)} retained-memory points -> {output}", flush=True)
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
    parser = argparse.ArgumentParser()
    parser.add_argument("url")
    parser.add_argument("output", type=Path)
    parser.add_argument("seconds", type=int)
    parser.add_argument("--sample-interval-seconds", type=int, default=60)
    args = parser.parse_args()
    if args.seconds <= 0 or args.sample_interval_seconds <= 0:
        parser.error("duration and sample interval must be positive")
    asyncio.run(soak(args.url, args.output, args.seconds, args.sample_interval_seconds))


if __name__ == "__main__":
    main()
