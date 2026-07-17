#!/usr/bin/env python3
"""Run the AA-8 settled/hidden-tab acceptance gate in headless Chrome."""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import shutil
import subprocess
import tempfile
import time
import urllib.request
from pathlib import Path

import websockets

from validate_idle_browser_gate import validate


CHROME = (
    os.environ.get("CHROME_BIN")
    or shutil.which("google-chrome")
    or shutil.which("chromium")
    or "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
)

INSTALL_PROBE = r"""(() => {
  const v = window.pistonViewer;
  if (!v?.renderer || !v?.frameScheduler) return false;
  if (!window.__AA8_IDLE_GATE__) {
    const gate = window.__AA8_IDLE_GATE__ = { renderCalls: 0, driver: null, phase: 0 };
    const originalRender = v.renderer.render;
    v.renderer.render = function(...args) {
      gate.renderCalls++;
      return originalRender.apply(this, args);
    };
  }
  return true;
})()"""

SNAPSHOT = r"""(() => {
  const v = window.pistonViewer;
  const g = window.__AA8_IDLE_GATE__;
  if (!v || !g) return null;
  const residencyLoading = v.textureStates
    ? Array.from(v.textureStates.values()).reduce((n, state) => n + (state.loading?.size || 0), 0)
    : 0;
  return {
    nowMs: performance.now(),
    visibilityState: document.visibilityState,
    loaderHidden: !!v.loaderHidden,
    manifestReady: !!v.manifest,
    viewerFrames: v._frameCounter || 0,
    renderCalls: g.renderCalls,
    scheduler: {
      hasWork: !!v._schedulerHasWork?.(),
      rafPending: v.frameScheduler.rafId !== null,
      timerPending: v.frameScheduler.wakeTimer !== null,
    },
    queues: {
      load: v.loadQueue?.length || 0,
      rebuild: v.geometryRebuildQueue?.length || 0,
      instantiate: v.instantiateQueue?.length || 0,
      texture: v.textureQueue?.length || 0,
      textureResults: v.textureResultQueue?.length || 0,
      pendingJobs: v.pendingJobs?.size || 0,
      activeWorkers: v.activeWorkerCount || 0,
      residencyLoading,
    },
  };
})()"""

START_ACTIVE_DRIVER = r"""(() => {
  const v = window.pistonViewer;
  const g = window.__AA8_IDLE_GATE__;
  if (!v || !g) return false;
  if (g.driver !== null) clearInterval(g.driver);
  g.driver = setInterval(() => {
    g.phase++;
    v.camera.position.x += (g.phase & 1) ? 1 : -1;
    v.notifyCameraMotion(performance.now());
    v.needsRender = true;
    v.needsLODUpdate = true;
    v.frameScheduler.wake('aa8-active-control');
  }, 32);
  return true;
})()"""

STOP_ACTIVE_DRIVER = r"""(() => {
  const g = window.__AA8_IDLE_GATE__;
  if (!g) return false;
  if (g.driver !== null) clearInterval(g.driver);
  g.driver = null;
  return true;
})()"""

REQUEST_HIDDEN_RENDER = r"""(() => {
  const v = window.pistonViewer;
  if (!v) return false;
  v.needsRender = true;
  v.needsLODUpdate = true;
  v.frameScheduler.wake('aa8-hidden-request');
  return true;
})()"""


class CDP:
    def __init__(self, websocket):
        self.websocket = websocket
        self.next_id = 0

    async def call(self, method: str, params: dict | None = None):
        self.next_id += 1
        call_id = self.next_id
        await self.websocket.send(json.dumps({"id": call_id, "method": method, "params": params or {}}))
        while True:
            message = json.loads(await self.websocket.recv())
            if message.get("id") != call_id:
                continue
            if "error" in message:
                raise RuntimeError(f"CDP {method}: {message['error']}")
            return message.get("result", {})

    async def js(self, expression: str):
        result = await self.call(
            "Runtime.evaluate",
            {"expression": expression, "returnByValue": True, "awaitPromise": True},
        )
        remote = result.get("result", {})
        if remote.get("subtype") == "error":
            raise RuntimeError(f"JavaScript evaluation failed: {remote.get('description')}")
        return remote.get("value")


def _metric_map(result: dict) -> dict[str, float]:
    return {item["name"]: item["value"] for item in result.get("metrics", [])}


def _interval(start: dict, end: dict, metrics_start: dict, metrics_end: dict) -> dict:
    return {
        "durationMs": round(end["nowMs"] - start["nowMs"], 3),
        "viewerFrames": end["viewerFrames"] - start["viewerFrames"],
        "renderCalls": end["renderCalls"] - start["renderCalls"],
        "taskDurationMs": round(1000 * (metrics_end.get("TaskDuration", 0) - metrics_start.get("TaskDuration", 0)), 3),
        "scriptDurationMs": round(1000 * (metrics_end.get("ScriptDuration", 0) - metrics_start.get("ScriptDuration", 0)), 3),
        "start": start,
        "end": end,
    }


async def _snapshot(cdp: CDP) -> dict:
    snapshot = await cdp.js(SNAPSHOT)
    if not snapshot:
        raise RuntimeError("viewer disappeared while collecting AA-8 gate data")
    return snapshot


async def _metrics(cdp: CDP) -> dict[str, float]:
    return _metric_map(await cdp.call("Performance.getMetrics"))


async def _measure(cdp: CDP, seconds: float) -> dict:
    start = await _snapshot(cdp)
    metrics_start = await _metrics(cdp)
    await asyncio.sleep(seconds)
    metrics_end = await _metrics(cdp)
    end = await _snapshot(cdp)
    return _interval(start, end, metrics_start, metrics_end)


async def _wait_for_settled(cdp: CDP, deadline: float, quiet_seconds: float = 1.5) -> dict:
    stable_since = None
    previous_counts = None
    last_snapshot = None
    while time.monotonic() < deadline:
        snapshot = await _snapshot(cdp)
        last_snapshot = snapshot
        ready = snapshot["loaderHidden"] and snapshot["manifestReady"]
        scheduler_idle = not any(snapshot["scheduler"].values())
        counts = (snapshot["viewerFrames"], snapshot["renderCalls"])
        # The demand planner may deliberately retain deferred texture tasks
        # that are outside the current residency budget. They are not runnable
        # work and `_schedulerHasWork()` intentionally excludes them. The real
        # idle contract is therefore a sleeping scheduler plus stable counters,
        # not empty bookkeeping arrays.
        if ready and scheduler_idle and counts == previous_counts:
            stable_since = stable_since or time.monotonic()
            if time.monotonic() - stable_since >= quiet_seconds:
                return snapshot
        else:
            stable_since = None
        previous_counts = counts
        await asyncio.sleep(0.25)
    raise RuntimeError(
        "viewer did not reach a stable, scheduler-idle state before timeout; "
        f"last snapshot={json.dumps(last_snapshot, sort_keys=True)}"
    )


async def _wait_for(cdp: CDP, predicate, deadline: float, description: str) -> dict:
    while time.monotonic() < deadline:
        snapshot = await _snapshot(cdp)
        if predicate(snapshot):
            return snapshot
        await asyncio.sleep(0.05)
    raise RuntimeError(f"timed out waiting for {description}")


async def _run_gate(cdp: CDP, target_id: str, timeout: float, interval_seconds: float) -> dict:
    deadline = time.monotonic() + timeout
    await cdp.call("Runtime.enable")
    await cdp.call("Page.enable")
    await cdp.call("Performance.enable")

    while time.monotonic() < deadline:
        if await cdp.js(INSTALL_PROBE):
            break
        await asyncio.sleep(0.1)
    else:
        raise RuntimeError("viewer never initialized")

    initial_settled = await _wait_for_settled(cdp, deadline)

    await cdp.js(START_ACTIVE_DRIVER)
    active = await _measure(cdp, interval_seconds)
    await cdp.js(STOP_ACTIVE_DRIVER)
    post_active_settled = await _wait_for_settled(cdp, deadline)
    idle = await _measure(cdp, interval_seconds)

    visibility = {"supported": False, "method": None}
    hidden = None
    recovery = None
    restore_method = None
    foreground_target = None
    try:
        try:
            await cdp.call("Emulation.setPageVisibilityOverride", {"visibilityState": "hidden"})
            visibility.update(supported=True, method="Emulation.setPageVisibilityOverride")
            restore_method = ("Emulation.setPageVisibilityOverride", {"visibilityState": "visible"})
        except RuntimeError as override_error:
            visibility["overrideUnavailable"] = str(override_error)
            # Stable Chrome omits the newer override command, but foreground
            # tab selection gives us the real browser behavior: opening a
            # second active target hides this page; activating this target
            # again restores it and dispatches `visibilitychange`.
            created = await cdp.call(
                "Target.createTarget", {"url": "about:blank", "background": False}
            )
            foreground_target = created["targetId"]
            visibility.update(supported=True, method="Target.activateTarget")
            restore_method = ("Target.activateTarget", {"targetId": target_id})
        await _wait_for(cdp, lambda s: s["visibilityState"] == "hidden", deadline, "document.visibilityState=hidden")
        await cdp.js(REQUEST_HIDDEN_RENDER)
        hidden = await _measure(cdp, min(2.0, interval_seconds))
        hidden_end = hidden["end"]
        await cdp.call(*restore_method)
        recovered = await _wait_for(
            cdp,
            lambda s: s["visibilityState"] == "visible"
            and s["viewerFrames"] > hidden_end["viewerFrames"]
            and s["renderCalls"] > hidden_end["renderCalls"],
            deadline,
            "visible-tab recovery render",
        )
        recovery = {
            "elapsedMs": round(recovered["nowMs"] - hidden_end["nowMs"], 3),
            "viewerFrames": recovered["viewerFrames"] - hidden_end["viewerFrames"],
            "renderCalls": recovered["renderCalls"] - hidden_end["renderCalls"],
            "end": recovered,
        }
        if foreground_target:
            await cdp.call("Target.closeTarget", {"targetId": foreground_target})
            foreground_target = None
    except RuntimeError as error:
        visibility["error"] = str(error)
        try:
            if restore_method:
                await cdp.call(*restore_method)
            if foreground_target:
                await cdp.call("Target.closeTarget", {"targetId": foreground_target})
                foreground_target = None
        except RuntimeError:
            pass
        # A recognized CDP mechanism that fails to hide/recover is a failed
        # behavior check, not an unsupported runner. Keep zeroed intervals so
        # the validator reports the regression clearly.
        if visibility["supported"]:
            hidden = hidden or {"viewerFrames": -1, "renderCalls": -1}
            recovery = recovery or {"viewerFrames": 0, "renderCalls": 0}
        else:
            visibility["reason"] = str(error)

    report = {
        "schemaVersion": 1,
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "intervalSeconds": interval_seconds,
        "initialSettled": initial_settled,
        "postActiveSettled": post_active_settled,
        "visibility": visibility,
        "intervals": {"active": active, "idle": idle},
    }
    if hidden is not None:
        report["intervals"]["hidden"] = hidden
    if recovery is not None:
        report["intervals"]["recovery"] = recovery
    validate(report)
    return report


async def run(url: str, output: Path, timeout: float, interval_seconds: float) -> int:
    profile = Path(tempfile.mkdtemp(prefix="chrome-aa8-idle-"))
    process = subprocess.Popen(
        [
            CHROME,
            "--headless=new",
            "--remote-debugging-port=0",
            f"--user-data-dir={profile}",
            "--no-first-run",
            "--window-size=1440,900",
            "--hide-crash-restore-bubble",
            url,
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    try:
        active_port_file = profile / "DevToolsActivePort"
        deadline = time.monotonic() + min(timeout, 30)
        while time.monotonic() < deadline and not active_port_file.exists():
            await asyncio.sleep(0.1)
        if not active_port_file.exists():
            raise RuntimeError("Chrome DevTools endpoint never appeared")
        port = int(active_port_file.read_text().splitlines()[0])

        websocket_url = None
        while time.monotonic() < deadline:
            try:
                with urllib.request.urlopen(f"http://127.0.0.1:{port}/json", timeout=1) as response:
                    pages = [item for item in json.load(response) if item.get("type") == "page"]
                if pages:
                    websocket_url = pages[0]["webSocketDebuggerUrl"]
                    break
            except (OSError, ValueError):
                pass
            await asyncio.sleep(0.1)
        if not websocket_url:
            raise RuntimeError("Chrome page target never appeared")

        async with websockets.connect(websocket_url, max_size=64 * 1024 * 1024) as websocket:
            report = await _run_gate(CDP(websocket), pages[0]["id"], timeout, interval_seconds)
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(json.dumps(report, indent=2) + "\n")
        for check in report["checks"]:
            print(f"{'PASS' if check['passed'] else 'FAIL'} {check['name']}: {check['detail']}")
        print(f"AA-8 idle browser report: {output}")
        return 0 if report["passed"] else 1
    finally:
        process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
        shutil.rmtree(profile, ignore_errors=True)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("url")
    parser.add_argument("output", type=Path)
    parser.add_argument("--timeout", type=float, default=120)
    parser.add_argument("--interval-seconds", type=float, default=3)
    args = parser.parse_args()
    return asyncio.run(run(args.url, args.output, args.timeout, args.interval_seconds))


if __name__ == "__main__":
    raise SystemExit(main())
