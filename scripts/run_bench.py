#!/usr/bin/env python3.14
"""Headless-Chrome benchmark runner for the PowFinder viewer.

Launches Chrome --headless=new with a fresh profile, opens ?bench=<scenario>,
polls the profiler's localStorage report until meta.finished === true, saves
the report JSON, grabs a final screenshot, and tears everything down.

Headless mode side-steps the tab-visibility problem entirely (hidden tabs
suspend rAF, which freezes the app's render loop AND the benchmark driver),
and gives baseline/candidate runs an identical environment.

Usage:
  python3.14 scripts/run_bench.py <url> <out.json> [--screenshot out.png] [--timeout 300]
      [--warm-reload]

With --warm-reload, the first navigation seeds the service worker and Cache
Storage. The runner waits for that page to be controlled, then navigates the
same tab to the same URL and records a second benchmark without destroying the
Chrome profile. The output contains cold/warm reports and service-worker
diagnostics instead of a single benchmark report.

Requires: pip install websockets (python3.14 user site on this machine).
"""
import asyncio
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.request

import websockets

CHROME = os.environ.get("CHROME_BIN") or shutil.which("google-chrome") or shutil.which("chromium") or "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PORT = 9333
LS_KEY = "hexagons:perfProfiler:lastRun"

EXT_PROBE = """(() => {
  const c = document.createElement('canvas');
  const gl = c.getContext('webgl2') || c.getContext('webgl');
  if (!gl) return JSON.stringify({error: 'no webgl'});
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  return JSON.stringify({
    renderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'masked',
    astc: !!gl.getExtension('WEBGL_compressed_texture_astc'),
    bptc: !!gl.getExtension('EXT_texture_compression_bptc'),
    s3tc: !!gl.getExtension('WEBGL_compressed_texture_s3tc'),
    etc: !!gl.getExtension('WEBGL_compressed_texture_etc'),
  });
})()"""

POLL = f"""(() => {{
  const raw = localStorage.getItem('{LS_KEY}');
  if (!raw) return JSON.stringify({{state: 'no-run'}});
  const r = JSON.parse(raw);
  if (r.meta && r.meta.finished === true) return JSON.stringify({{state: 'done', runId:r.meta.runId}});
  const v = window.pistonViewer;
  return JSON.stringify({{
    state: 'running',
    runId: r.meta ? r.meta.runId : null,
    frames: r.frames ? r.frames.total : 0,
    tiles: v && v.tiles ? v.tiles.size : 0,
    duration: r.meta ? r.meta.duration_s : 0,
  }});
}})()"""

FETCH_REPORT = f"localStorage.getItem('{LS_KEY}')"
STATIC_BUFFER_STATS = "JSON.stringify(window.pistonViewer?.getStaticBufferInstrumentation?.() || null)"
MATERIAL_CHURN_STATS = "JSON.stringify(window.__HEXAGONS_MATERIAL_CHURN_BENCHMARK__ || null)"
BOOTSTRAP_DIAGNOSTICS = "JSON.stringify(window.pistonViewer?.bootstrapDiagnostics || null)"
RESOURCE_TIMINGS = """JSON.stringify(performance.getEntriesByType('resource').map(entry => ({
  name: entry.name, startTime: entry.startTime, responseEnd: entry.responseEnd,
  transferSize: entry.transferSize, encodedBodySize: entry.encodedBodySize
})))"""
VIEWPORT_AUDIT = """(() => {
  const selectors = ['#main-panel', '#hex-search-container'];
  const visible = el => !!el && !el.hidden && getComputedStyle(el).display !== 'none'
    && getComputedStyle(el).visibility !== 'hidden';
  const rects = selectors.map(selector => {
    const el = document.querySelector(selector);
    if (!visible(el)) return null;
    const r = el.getBoundingClientRect();
    return {selector, left:r.left, top:r.top, right:r.right, bottom:r.bottom, width:r.width, height:r.height};
  }).filter(Boolean);
  const outOfViewport = rects.filter(r => r.left < -1 || r.top < -1
    || r.right > innerWidth + 1 || r.bottom > innerHeight + 1).map(r => r.selector);
  const overlaps = [];
  for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
    const a = rects[i], b = rects[j];
    if (Math.min(a.right,b.right) - Math.max(a.left,b.left) > 1
      && Math.min(a.bottom,b.bottom) - Math.max(a.top,b.top) > 1) overlaps.push([a.selector,b.selector]);
  }
  return JSON.stringify({width:innerWidth, height:innerHeight,
    horizontalOverflow:document.documentElement.scrollWidth > innerWidth + 1,
    outOfViewport, overlaps, rects});
})()"""


class CDP:
    def __init__(self, ws):
        self.ws = ws
        self.n = 0
        self.events = []

    async def call(self, method, params=None):
        self.n += 1
        my_id = self.n
        await self.ws.send(json.dumps({"id": my_id, "method": method, "params": params or {}}))
        while True:
            msg = json.loads(await self.ws.recv())
            if msg.get("id") == my_id:
                if "error" in msg:
                    raise RuntimeError(f"CDP {method}: {msg['error']}")
                return msg.get("result", {})
            if msg.get("method"):
                self.events.append(msg)

    async def js(self, expr, await_promise=False):
        res = await self.call("Runtime.evaluate", {
            "expression": expr,
            "returnByValue": True,
            "awaitPromise": await_promise,
        })
        return res.get("result", {}).get("value")


SERVICE_WORKER_STATUS = """(async () => {
  if (!('serviceWorker' in navigator)) {
    return JSON.stringify({supported:false, ready:false, controlled:false, caches:[]});
  }
  let registration = null;
  try {
    registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, reject) => setTimeout(() => reject(new Error('ready timeout')), 15000)),
    ]);
  } catch (error) {
    return JSON.stringify({supported:true, ready:false,
      controlled:!!navigator.serviceWorker.controller, error:String(error), caches:[]});
  }
  const deadline = performance.now() + 15000;
  while (!navigator.serviceWorker.controller && performance.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  const cacheRows = [];
  for (const name of await caches.keys()) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    cacheRows.push({name, entries:keys.length, urls:keys.map(request => request.url)});
  }
  const controller = navigator.serviceWorker.controller;
  return JSON.stringify({
    supported:true,
    ready:!!registration,
    controlled:!!controller,
    controllerScriptURL:controller?.scriptURL || null,
    activeScriptURL:registration?.active?.scriptURL || null,
    caches:cacheRows,
  });
})()"""


def summarize_network_events(events):
    rows = []
    for event in events:
        if event.get("method") != "Network.responseReceived":
            continue
        response = event.get("params", {}).get("response", {})
        rows.append({
            "url": response.get("url"),
            "status": response.get("status"),
            "mimeType": response.get("mimeType"),
            "fromServiceWorker": bool(response.get("fromServiceWorker")),
            "fromDiskCache": bool(response.get("fromDiskCache")),
            "fromPrefetchCache": bool(response.get("fromPrefetchCache")),
            "serviceWorkerResponseSource": response.get("serviceWorkerResponseSource"),
        })
    return rows


def ttftf(report):
    return report.get("milestones", {}).get("visibleTexturedCoverage")


async def wait_for_report(cdp, timeout, excluded_run_id=None, label="benchmark"):
    ext = None
    deadline = time.time() + timeout
    last_note = 0.0
    while time.time() < deadline:
        try:
            if ext is None:
                raw_ext = await cdp.js(EXT_PROBE)
                if raw_ext:
                    candidate = json.loads(raw_ext)
                    if candidate.get("error") != "no webgl":
                        ext = candidate
                        print(f"  gl: {ext}", flush=True)
            raw = await cdp.js(POLL)
        except RuntimeError as error:
            # Page.navigate briefly destroys the old execution context. Wait
            # for the new document instead of treating that as a failed run.
            if "context" not in str(error).lower():
                raise
            await asyncio.sleep(0.1)
            continue

        state = json.loads(raw) if raw else {"state": "no-page"}
        run_id = state.get("runId")
        is_new_run = excluded_run_id is None or run_id != excluded_run_id
        if is_new_run and state.get("state") == "done":
            report = json.loads(await cdp.js(FETCH_REPORT))
            report["headlessGL"] = ext
            raw_buffer_stats = await cdp.js(STATIC_BUFFER_STATS)
            report["staticBufferInstrumentation"] = (
                json.loads(raw_buffer_stats) if raw_buffer_stats else None
            )
            raw_material_churn = await cdp.js(MATERIAL_CHURN_STATS)
            report["materialChurn"] = (
                json.loads(raw_material_churn) if raw_material_churn else None
            )
            raw_bootstrap_diagnostics = await cdp.js(BOOTSTRAP_DIAGNOSTICS)
            report["bootstrapDiagnostics"] = (
                json.loads(raw_bootstrap_diagnostics) if raw_bootstrap_diagnostics else None
            )
            raw_resource_timings = await cdp.js(RESOURCE_TIMINGS)
            report["resourceTimings"] = (
                json.loads(raw_resource_timings) if raw_resource_timings else []
            )
            raw_viewport_audit = await cdp.js(VIEWPORT_AUDIT)
            report["viewportAudit"] = (
                json.loads(raw_viewport_audit) if raw_viewport_audit else None
            )
            return report

        if time.time() - last_note > 15:
            display_state = "waiting-new-run" if not is_new_run else state.get("state", "running")
            print(f"  ... {label}: {{'state': '{display_state}', 'runId': {run_id!r}, "
                  f"'frames': {state.get('frames', 0)}}}", flush=True)
            last_note = time.time()
        # Detect the new document promptly without polling a live benchmark at
        # high frequency. Once its run ID appears, retain the historical 2 s
        # polling cadence so the harness itself does not tax frame timing.
        await asyncio.sleep(0.25 if excluded_run_id is not None and not is_new_run else 2)
    raise RuntimeError(f"Timed out after {timeout}s waiting for finished {label} report")


def print_done(report, out_json, label=""):
    m, fr = report.get("meta", {}), report.get("frames", {})
    milestones = report.get("milestones", {})
    prefix = f"{label} " if label else ""
    print(f"  DONE {prefix}scenario={m.get('scenario')} pipeline={m.get('texturePipeline')} "
          f"dur={m.get('duration_s')}s fps={fr.get('fps_avg_active')} "
          f"p95={fr.get('p95_ms')}ms over33={fr.get('over33')} "
          f"ttftf={milestones.get('visibleTexturedCoverage')} "
          f"ready={milestones.get('loaderHidden')} "
          f"staticBuffers={report['staticBufferInstrumentation']} -> {out_json}", flush=True)


async def run(url, out_json, screenshot=None, timeout=300, viewport="1440,900", warm_reload=False):
    profile = tempfile.mkdtemp(prefix="chrome-bench-")
    proc = subprocess.Popen(
        [CHROME, "--headless=new", f"--remote-debugging-port={PORT}",
         f"--user-data-dir={profile}", "--no-first-run", f"--window-size={viewport}",
         "--hide-crash-restore-bubble", url],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    try:
        # Find the page target
        ws_url = None
        for _ in range(60):
            try:
                with urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json") as f:
                    targets = json.load(f)
                pages = [t for t in targets if t.get("type") == "page" and "localhost" in t.get("url", "")]
                if pages:
                    ws_url = pages[0]["webSocketDebuggerUrl"]
                    break
            except Exception:
                pass
            time.sleep(0.5)
        if not ws_url:
            raise RuntimeError("Chrome page target never appeared")

        async with websockets.connect(ws_url, max_size=64 * 1024 * 1024) as ws:
            cdp = CDP(ws)
            await cdp.call("Runtime.enable")
            await cdp.call("Page.enable")
            await cdp.call("Network.enable")

            cold = await wait_for_report(cdp, timeout, label="cold")
            if not warm_reload:
                output = cold
                print_done(cold, out_json)
            else:
                before_raw = await cdp.js(SERVICE_WORKER_STATUS, await_promise=True)
                before = json.loads(before_raw)
                if not before.get("controlled"):
                    raise RuntimeError(
                        "Service worker did not control the seeded page before warm navigation: "
                        f"{before}"
                    )

                cdp.events.clear()
                await cdp.call("Page.navigate", {"url": url})
                warm = await wait_for_report(
                    cdp,
                    timeout,
                    excluded_run_id=cold.get("meta", {}).get("runId"),
                    label="warm",
                )
                after_raw = await cdp.js(SERVICE_WORKER_STATUS, await_promise=True)
                after = json.loads(after_raw)
                cold_ttftf, warm_ttftf = ttftf(cold), ttftf(warm)
                improvement = None
                if isinstance(cold_ttftf, (int, float)) and cold_ttftf > 0 and isinstance(warm_ttftf, (int, float)):
                    improvement = (cold_ttftf - warm_ttftf) / cold_ttftf * 100
                output = {
                    "meta": {
                        "kind": "service-worker-warm-reload",
                        "url": url,
                        "sameProfile": True,
                        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    },
                    "cold": cold,
                    "warm": warm,
                    "comparison": {
                        "coldTTFTFMs": cold_ttftf,
                        "warmTTFTFMs": warm_ttftf,
                        "improvementMs": cold_ttftf - warm_ttftf
                            if isinstance(cold_ttftf, (int, float)) and isinstance(warm_ttftf, (int, float))
                            else None,
                        "improvementPercent": improvement,
                    },
                    "serviceWorker": {
                        "beforeWarmNavigation": before,
                        "afterWarmNavigation": after,
                    },
                    "warmResponses": summarize_network_events(cdp.events),
                }
                print_done(cold, out_json, "cold")
                print_done(warm, out_json, "warm")
                improvement_text = f"{improvement:.1f}%" if improvement is not None else "unavailable"
                print(f"  service worker controlled before/after={before.get('controlled')}/"
                      f"{after.get('controlled')} warm improvement={improvement_text}", flush=True)

            with open(out_json, "w") as f:
                json.dump(output, f, indent=1)
            if screenshot:
                shot = await cdp.call("Page.captureScreenshot", {"format": "png"})
                import base64
                with open(screenshot, "wb") as f:
                    f.write(base64.b64decode(shot["data"]))
            return 0
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
        shutil.rmtree(profile, ignore_errors=True)


def main():
    args = sys.argv[1:]
    if len(args) < 2:
        print(__doc__)
        return 2
    url, out_json = args[0], args[1]
    screenshot = args[args.index("--screenshot") + 1] if "--screenshot" in args else None
    timeout = int(args[args.index("--timeout") + 1]) if "--timeout" in args else 300
    viewport = args[args.index("--viewport") + 1] if "--viewport" in args else "1440,900"
    warm_reload = "--warm-reload" in args
    print(f"[bench] {url}", flush=True)
    return asyncio.run(run(url, out_json, screenshot, timeout, viewport, warm_reload))


if __name__ == "__main__":
    sys.exit(main())
