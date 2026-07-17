#!/usr/bin/env python3
"""Run AA-2 deterministic request and WebGL recovery checks in Chrome.

This is an opt-in, full-corpus browser gate. It deliberately refuses to run
unless ``--full-assets`` is supplied; asset-free CI exercises only the policy
in ``validate_fault_recovery_gate.py``.
"""

from __future__ import annotations

import argparse
import asyncio
import base64
import json
import os
import shutil
import socket
import subprocess
import tempfile
import time
import urllib.request
from pathlib import Path

import websockets

from validate_fault_recovery_gate import validate


CHROME = (
    os.environ.get("CHROME_BIN")
    or shutil.which("google-chrome")
    or shutil.which("chromium")
    or "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
)

SNAPSHOT = r"""(() => {
  const v = window.pistonViewer;
  if (!v?.manifest || !v?.renderer) return null;
  const stats = v.getDetailedStats?.('aa2-fault-gate') || null;
  const active = stats?.textureResidency?.active || {};
  const activeTexturePages = Object.entries(active)
    .filter(([tier]) => tier !== 'none')
    .reduce((sum, [, count]) => sum + (Number(count) || 0), 0);
  return {
    nowMs: performance.now(),
    loaderHidden: !!v.loaderHidden,
    fatalState: v.fatalState || null,
    visibleTexturedCoverage: v.profiler?.milestones?.visibleTexturedCoverage !== undefined,
    activeTexturePages,
    viewerFrames: v._frameCounter || 0,
    renderCalls: window.__AA2_FAULT_GATE__?.renderCalls || 0,
    faultInjection: v.getFaultGateDiagnostics?.() || null,
    stats,
  };
})()"""

INSTALL_RENDER_COUNTER = r"""(() => {
  const v = window.pistonViewer;
  if (!v?.renderer) return false;
  if (!window.__AA2_FAULT_GATE__) {
    const gate = window.__AA2_FAULT_GATE__ = {renderCalls: 0};
    const original = v.renderer.render;
    v.renderer.render = function(...args) {
      gate.renderCalls++;
      return original.apply(this, args);
    };
  }
  return true;
})()"""

LOSE_AND_RESTORE = r"""(() => {
  const v = window.pistonViewer;
  const gate = window.__AA2_FAULT_GATE__;
  if (!v?.renderer || !gate) return {supported:false};
  const gl = v.renderer.getContext();
  const extension = gl.getExtension('WEBGL_lose_context');
  if (!extension) return {supported:false};
  gate.lossRequestedAt = performance.now();
  gate.renderCallsBeforeLoss = gate.renderCalls;
  extension.loseContext();
  setTimeout(() => extension.restoreContext(), 100);
  return {supported:true, requestedAt:gate.lossRequestedAt,
    renderCallsBeforeLoss:gate.renderCallsBeforeLoss};
})()"""


class CDP:
    """Flattened CDP session with one reader and concurrent command support."""

    def __init__(self, websocket):
        self.websocket = websocket
        self.next_id = 0
        self.pending = {}
        self.events = asyncio.Queue()
        self.reader_task = None

    async def start(self):
        self.reader_task = asyncio.create_task(self._reader())

    async def _reader(self):
        try:
            async for raw in self.websocket:
                message = json.loads(raw)
                call_id = message.get("id")
                if call_id is not None and call_id in self.pending:
                    future = self.pending.pop(call_id)
                    if "error" in message:
                        future.set_exception(RuntimeError(f"CDP error: {message['error']}"))
                    else:
                        future.set_result(message.get("result", {}))
                elif message.get("method"):
                    await self.events.put(message)
        except Exception as error:
            for future in self.pending.values():
                if not future.done():
                    future.set_exception(error)
            self.pending.clear()

    async def call(self, method: str, params: dict | None = None, session_id: str | None = None):
        self.next_id += 1
        call_id = self.next_id
        future = asyncio.get_running_loop().create_future()
        self.pending[call_id] = future
        message = {"id": call_id, "method": method, "params": params or {}}
        if session_id:
            message["sessionId"] = session_id
        await self.websocket.send(json.dumps(message))
        try:
            return await asyncio.wait_for(asyncio.shield(future), 15)
        except TimeoutError as error:
            reader_error = None
            if self.reader_task and self.reader_task.done():
                reader_error = self.reader_task.exception()
            raise RuntimeError(
                f"CDP {method} timed out (readerError={reader_error!r}, pending={len(self.pending)})"
            ) from error

    async def js(self, expression: str):
        result = await self.call("Runtime.evaluate", {
            "expression": expression,
            "returnByValue": True,
            "awaitPromise": True,
        })
        remote = result.get("result", {})
        if remote.get("subtype") == "error":
            raise RuntimeError(f"JavaScript evaluation failed: {remote.get('description')}")
        return remote.get("value")

    async def close(self):
        if self.reader_task:
            self.reader_task.cancel()
            try:
                await self.reader_task
            except asyncio.CancelledError:
                pass


async def wait_for_viewer(cdp: CDP, deadline: float) -> dict:
    installed = False
    last = None
    while time.monotonic() < deadline:
        try:
            if not installed:
                installed = bool(await cdp.js(INSTALL_RENDER_COUNTER))
            last = await cdp.js(SNAPSHOT)
        except RuntimeError as error:
            if "context" not in str(error).lower():
                raise
            await asyncio.sleep(0.1)
            continue
        if last:
            stats = last.get("stats") or {}
            visible = ((stats.get("tileClassification") or {}).get("visible") or {}).get("count", 0)
            if (
                installed
                and last.get("loaderHidden")
                and last.get("visibleTexturedCoverage")
                and visible > 0
                and last.get("activeTexturePages", 0) > 0
            ):
                return last
        await asyncio.sleep(0.2)
    raise RuntimeError(f"viewer did not paint visible textured terrain before timeout; last={last}")


async def wait_for_retries(cdp: CDP, deadline: float) -> dict:
    last = None
    while time.monotonic() < deadline:
        last = await cdp.js(SNAPSHOT)
        fault_report = (last or {}).get("faultInjection") or {}
        recovered = True
        sampled = True
        for kind in ("terrain", "texture"):
            row = fault_report.get(kind) or {}
            attempts = row.get("attemptsByResource") or {}
            successful = set(row.get("successfulResources") or [])
            dropped = row.get("droppedResources") or []
            sampled = sampled and row.get("uniqueResources", 0) >= 10 and len(dropped) >= 1
            recovered = recovered and all(attempts.get(url, 0) >= 2 and url in successful for url in dropped)
        if sampled and recovered:
            return last
        await asyncio.sleep(0.1)
    raise RuntimeError(f"injected requests did not recover or lacked a full sample: {last}")


async def force_context_recovery(cdp: CDP, before: dict, deadline: float) -> dict:
    request = await cdp.js(LOSE_AND_RESTORE)
    if not request or not request.get("supported"):
        return {
            "extensionSupported": False,
            "lossObserved": False,
            "restoreObserved": False,
            "renderedAfterRestore": False,
            "observedRecoveryMs": None,
            "before": before,
            "after": before,
        }

    started = time.monotonic()
    loss_observed = False
    after = before
    while time.monotonic() < deadline and time.monotonic() - started <= 5.0:
        try:
            candidate = await cdp.js(SNAPSHOT)
        except RuntimeError as error:
            if "context" in str(error).lower():
                await asyncio.sleep(0.05)
                continue
            raise
        if candidate:
            after = candidate
            context = (((candidate.get("stats") or {}).get("failures") or {}).get("context") or {})
            loss_observed = loss_observed or context.get("lost", 0) >= 1
            restored = context.get("restored", 0) >= 1 and not context.get("recovering")
            repainted = candidate.get("renderCalls", 0) > request.get("renderCallsBeforeLoss", 0)
            if loss_observed and restored and repainted and candidate.get("loaderHidden"):
                return {
                    "extensionSupported": True,
                    "lossObserved": True,
                    "restoreObserved": True,
                    "renderedAfterRestore": True,
                    "observedRecoveryMs": round((time.monotonic() - started) * 1000, 3),
                    "before": before,
                    "after": after,
                }
        await asyncio.sleep(0.05)

    return {
        "extensionSupported": True,
        "lossObserved": loss_observed,
        "restoreObserved": False,
        "renderedAfterRestore": after.get("renderCalls", 0) > request.get("renderCallsBeforeLoss", 0),
        "observedRecoveryMs": round((time.monotonic() - started) * 1000, 3),
        "before": before,
        "after": after,
    }


async def run(args) -> int:
    profile = tempfile.mkdtemp(prefix="chrome-aa2-fault-")
    proc = subprocess.Popen(
        [
            CHROME,
            "--headless=new",
            f"--remote-debugging-port={args.port}",
            f"--user-data-dir={profile}",
            "--no-first-run",
            "--window-size=1440,900",
            "--hide-crash-restore-bubble",
            "about:blank",
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    cdp = None
    try:
        ws_url = None
        for _ in range(80):
            try:
                with urllib.request.urlopen(f"http://127.0.0.1:{args.port}/json") as response:
                    targets = json.load(response)
                pages = [target for target in targets if target.get("type") == "page"]
                if pages:
                    ws_url = pages[0]["webSocketDebuggerUrl"]
                    break
            except Exception:
                pass
            await asyncio.sleep(0.1)
        if not ws_url:
            raise RuntimeError("Chrome page target never appeared")

        async with websockets.connect(ws_url, max_size=64 * 1024 * 1024) as websocket:
            cdp = CDP(websocket)
            await cdp.start()
            await cdp.call("Runtime.enable")
            await cdp.call("Page.enable")
            await cdp.call("Page.navigate", {"url": args.url})

            deadline = time.monotonic() + args.timeout
            ready = await wait_for_viewer(cdp, deadline)
            ready = await wait_for_retries(cdp, min(deadline, time.monotonic() + 15))
            fault_report = ready.get("faultInjection") or {}

            context = await force_context_recovery(cdp, ready, deadline)
            report = {
                "meta": {
                    "kind": "aa2-fault-recovery",
                    "fullAssets": True,
                    "url": args.url,
                    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    "dropPolicy": "each-kind-every-tenth-unique-first-attempt",
                },
                "faultInjection": fault_report,
                "ready": ready,
                "contextRecovery": context,
            }
            passed = validate(report)
            args.output.parent.mkdir(parents=True, exist_ok=True)
            args.output.write_text(json.dumps(report, indent=2) + "\n")
            if args.screenshot:
                shot = await cdp.call("Page.captureScreenshot", {"format": "png"})
                args.screenshot.parent.mkdir(parents=True, exist_ok=True)
                args.screenshot.write_bytes(base64.b64decode(shot["data"]))
            for check in report["checks"]:
                print(f"{'PASS' if check['passed'] else 'FAIL'} {check['name']}: {check['detail']}")
            await cdp.close()
            cdp = None
            return 0 if passed else 1
    finally:
        if cdp:
            await cdp.close()
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.wait(timeout=5)
        shutil.rmtree(profile, ignore_errors=True)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("url")
    parser.add_argument("output", type=Path)
    parser.add_argument("--full-assets", action="store_true")
    parser.add_argument("--screenshot", type=Path)
    parser.add_argument("--timeout", type=float, default=150)
    parser.add_argument("--port", type=int, default=9342)
    args = parser.parse_args()
    if not args.full_assets:
        parser.error("refusing partial/synthetic run: pass --full-assets after verifying the complete baked corpus")
    try:
        with socket.create_connection(("127.0.0.1", args.port), timeout=0.2):
            parser.error(f"CDP port {args.port} is already in use; refusing to attach to an unrelated Chrome")
    except (ConnectionRefusedError, TimeoutError, OSError):
        pass
    return asyncio.run(run(args))


if __name__ == "__main__":
    raise SystemExit(main())
