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
      [--warm-reload] [--dpr 1|2|3] [--render-cap capped|native]

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
import socket
import signal
import subprocess
import sys
import tempfile
import time
import urllib.request
from urllib.parse import urlsplit

import websockets

CHROME = os.environ.get("CHROME_BIN") or shutil.which("google-chrome") or shutil.which("chromium") or "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
LS_KEY = "hexagons:perfProfiler:lastRun"

# A fixed, production-like "good LTE" profile. 100 ms request latency with a
# 10/5 Mbit/s pipe is deliberately faster than many mobile lab presets: the
# gate measures the value of caching for a healthy real connection, not a
# pathological 3G strawman. Localhost is explicitly restored before warm load.
COLD_NETWORK_PROFILE = {
    "name": "good-lte",
    "latencyMs": 100,
    "downloadMbps": 10,
    "uploadMbps": 5,
}
WARM_NETWORK_PROFILE = {
    "name": "unthrottled-local",
    "latencyMs": 0,
    "downloadMbps": None,
    "uploadMbps": None,
}

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
RENDER_RESOLUTION = """JSON.stringify((() => {
  const v = window.pistonViewer, c = v?.renderer?.domElement;
  return v && c ? {devicePixelRatio, renderPixelRatio:v.renderPixelRatio,
    configuredCap:v.renderDprCap, canvasCssWidth:c.clientWidth, canvasCssHeight:c.clientHeight,
    drawingBufferWidth:c.width, drawingBufferHeight:c.height} : null;
})())"""
MATERIAL_CHURN_STATS = "JSON.stringify(window.__HEXAGONS_MATERIAL_CHURN_BENCHMARK__ || null)"
BOOTSTRAP_DIAGNOSTICS = "JSON.stringify(window.pistonViewer?.bootstrapDiagnostics || null)"
RESOURCE_TIMINGS = """JSON.stringify(performance.getEntriesByType('resource').map(entry => ({
  name: entry.name, startTime: entry.startTime, responseEnd: entry.responseEnd,
  transferSize: entry.transferSize, encodedBodySize: entry.encodedBodySize
})))"""
NAVIGATION_TIMING = """(() => {
  const n = performance.getEntriesByType('navigation')[0];
  const c = navigator.connection;
  if (!n) return JSON.stringify(null);
  return JSON.stringify({
    type:n.type,
    fetchStart:n.fetchStart,
    requestStart:n.requestStart,
    responseStart:n.responseStart,
    responseEnd:n.responseEnd,
    requestToResponseMs:n.responseStart - n.requestStart,
    transferSize:n.transferSize,
    encodedBodySize:n.encodedBodySize,
    decodedBodySize:n.decodedBodySize,
    connection:c ? {effectiveType:c.effectiveType, downlink:c.downlink, rtt:c.rtt, saveData:c.saveData} : null,
  });
})()"""
BENCHMARK_TIMING = """(() => {
  const profiler = window.pistonViewer?.profiler;
  if (!profiler || !Number.isFinite(profiler.startTime)) return JSON.stringify(null);
  const relative = profiler.milestones?.visibleTexturedCoverage;
  return JSON.stringify({
    profilerStartFromNavigationMs:profiler.startTime,
    visibleTexturedCoverageProfilerRelativeMs:Number.isFinite(relative) ? relative : null,
    visibleTexturedCoverageFromNavigationMs:Number.isFinite(relative) ? profiler.startTime + relative : null,
  });
})()"""
VIEWPORT_AUDIT = """(() => {
  // Keep this a real hit-test audit: controls that are merely drawn but sit
  // behind a canvas/overlay are just as unusable as controls off-screen.
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
  const controls = Array.from(document.querySelectorAll('button,input,select,textarea')).filter(visible).map(el => {
    const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    const hit = document.elementFromPoint(x, y);
    return {id:el.id || null, tag:el.tagName, left:r.left, top:r.top, right:r.right, bottom:r.bottom,
      width:r.width, height:r.height, hit:hit === el || el.contains(hit)};
  });
  const missedHitTargets = controls.filter(control => !control.hit).map(control => control.id || control.tag);
  const controlOutOfViewport = controls.filter(control => control.left < -1 || control.top < -1 || control.right > innerWidth + 1 || control.bottom > innerHeight + 1).map(control => control.id || control.tag);
  return JSON.stringify({width:innerWidth, height:innerHeight,
    horizontalOverflow:document.documentElement.scrollWidth > innerWidth + 1,
    outOfViewport, overlaps, rects, controls, missedHitTargets, controlOutOfViewport});
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


def free_debugging_port():
    """Avoid attaching to another concurrent benchmark's Chrome instance."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
        probe.bind(("127.0.0.1", 0))
        return probe.getsockname()[1]


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
    requested = {
        event.get("params", {}).get("requestId"): event.get("params", {})
        for event in events
        if event.get("method") == "Network.requestWillBeSent"
    }
    finished = {
        event.get("params", {}).get("requestId"): event.get("params", {})
        for event in events
        if event.get("method") == "Network.loadingFinished"
    }
    rows = []
    for event in events:
        if event.get("method") != "Network.responseReceived":
            continue
        params = event.get("params", {})
        response = params.get("response", {})
        end = finished.get(params.get("requestId"), {})
        start = requested.get(params.get("requestId"), {})
        request_timestamp = start.get("timestamp")
        response_timestamp = params.get("timestamp")
        finished_timestamp = end.get("timestamp")
        receive_duration_ms = None
        if isinstance(response_timestamp, (int, float)) and isinstance(finished_timestamp, (int, float)):
            receive_duration_ms = max(0, (finished_timestamp - response_timestamp) * 1000)
        encoded_bytes = end.get("encodedDataLength")
        observed_mbps = None
        if isinstance(encoded_bytes, (int, float)) and receive_duration_ms and receive_duration_ms > 0:
            observed_mbps = encoded_bytes * 8 / (receive_duration_ms * 1000)
        request_to_response_ms = None
        if isinstance(request_timestamp, (int, float)) and isinstance(response_timestamp, (int, float)):
            request_to_response_ms = max(0, (response_timestamp - request_timestamp) * 1000)
        rows.append({
            "requestId": params.get("requestId"),
            "resourceType": params.get("type"),
            "url": response.get("url"),
            "status": response.get("status"),
            "mimeType": response.get("mimeType"),
            "fromServiceWorker": bool(response.get("fromServiceWorker")),
            "fromDiskCache": bool(response.get("fromDiskCache")),
            "fromPrefetchCache": bool(response.get("fromPrefetchCache")),
            "serviceWorkerResponseSource": response.get("serviceWorkerResponseSource"),
            "encodedDataLength": encoded_bytes,
            "requestToResponseMs": request_to_response_ms,
            "receiveDurationMs": receive_duration_ms,
            "observedReceiveMbps": observed_mbps,
        })
    return rows


def ttftf(report):
    # AA-7 is about repeat visits, so its meaningful clock starts at document
    # navigation and includes the shell/bundle that the service worker caches.
    # The profiler-relative milestone remains in report.milestones for all
    # historical cold-load and rendering comparisons.
    absolute = report.get("benchmarkTiming", {}).get("visibleTexturedCoverageFromNavigationMs")
    if isinstance(absolute, (int, float)):
        return absolute
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
            raw_render_resolution = await cdp.js(RENDER_RESOLUTION)
            report["renderResolution"] = (
                json.loads(raw_render_resolution) if raw_render_resolution else None
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
            raw_navigation_timing = await cdp.js(NAVIGATION_TIMING)
            report["navigationTiming"] = (
                json.loads(raw_navigation_timing) if raw_navigation_timing else None
            )
            raw_benchmark_timing = await cdp.js(BENCHMARK_TIMING)
            report["benchmarkTiming"] = (
                json.loads(raw_benchmark_timing) if raw_benchmark_timing else None
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
          f"ttftf={ttftf(report)} (navigation clock; profiler-relative "
          f"{milestones.get('visibleTexturedCoverage')}) "
          f"ready={milestones.get('loaderHidden')} "
          f"staticBuffers={report['staticBufferInstrumentation']} -> {out_json}", flush=True)


async def run(url, out_json, screenshot=None, timeout=300, viewport="1440,900", warm_reload=False,
               device_scale_factor=1, render_cap="capped"):
    if render_cap not in ("capped", "native"):
        raise ValueError("--render-cap must be capped or native")
    if device_scale_factor <= 0:
        raise ValueError("--dpr must be positive")
    if render_cap == "native":
        separator = "&" if "?" in url else "?"
        url = f"{url}{separator}benchRenderDprCap=native"
    profile = tempfile.mkdtemp(prefix="chrome-bench-")
    launch_url = "about:blank" if warm_reload else url
    target_host = urlsplit(url).hostname
    debug_port = free_debugging_port()
    proc = subprocess.Popen(
        [CHROME, "--headless=new", f"--remote-debugging-port={debug_port}",
         f"--user-data-dir={profile}", "--no-first-run", f"--window-size={viewport}",
         "--hide-crash-restore-bubble", launch_url],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True,
    )
    try:
        # Find the page target
        ws_url = None
        for _ in range(60):
            try:
                with urllib.request.urlopen(f"http://127.0.0.1:{debug_port}/json") as f:
                    targets = json.load(f)
                pages = [t for t in targets if t.get("type") == "page" and (
                    (warm_reload and t.get("url") == "about:blank")
                    or (not warm_reload and urlsplit(t.get("url", "")).hostname == target_host)
                )]
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
            # Headless Chrome clamps --window-size below roughly 500 CSS px.
            # CDP emulation is authoritative, so the 320/390 release audits
            # actually exercise their named responsive breakpoints.
            viewport_width, viewport_height = (int(value) for value in viewport.split(",", 1))
            await cdp.call("Emulation.setDeviceMetricsOverride", {
                "width": viewport_width,
                "height": viewport_height,
                "deviceScaleFactor": device_scale_factor,
                "mobile": False,
            })

            cache_reset = None
            if warm_reload:
                split_url = urlsplit(url)
                origin = f"{split_url.scheme}://{split_url.netloc}"
                # The temporary profile is already fresh; these explicit CDP
                # clears make that precondition observable and future-proof.
                await cdp.call("Network.clearBrowserCache")
                await cdp.call("Network.clearBrowserCookies")
                await cdp.call("Storage.clearDataForOrigin", {
                    "origin": origin,
                    "storageTypes": "all",
                })
                cache_reset = {
                    "temporaryProfile": True,
                    "browserCacheCleared": True,
                    "browserCookiesCleared": True,
                    "originStorageCleared": True,
                    "origin": origin,
                }
                await cdp.call("Network.emulateNetworkConditions", {
                    "offline": False,
                    "latency": COLD_NETWORK_PROFILE["latencyMs"],
                    "downloadThroughput": COLD_NETWORK_PROFILE["downloadMbps"] * 1_000_000 / 8,
                    "uploadThroughput": COLD_NETWORK_PROFILE["uploadMbps"] * 1_000_000 / 8,
                    "connectionType": "cellular4g",
                })
                cdp.events.clear()
                await cdp.call("Page.navigate", {"url": url})

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

                cold_responses = summarize_network_events(cdp.events)
                # The initial cold document necessarily loads its shell before
                # the newly installed worker controls it. Seed Cache Storage
                # with one *unmeasured*, worker-controlled navigation before
                # measuring the returning-visitor navigation below.
                await cdp.call("Network.clearBrowserCache")
                cdp.events.clear()
                await cdp.call("Page.navigate", {"url": url})
                seed = await wait_for_report(
                    cdp, timeout, excluded_run_id=cold.get("meta", {}).get("runId"), label="sw-seed",
                )
                await cdp.call("Network.emulateNetworkConditions", {
                    "offline": False,
                    "latency": 0,
                    "downloadThroughput": -1,
                    "uploadThroughput": -1,
                    "connectionType": "none",
                })
                # Do not let Chrome's HTTP cache masquerade as the service-
                # worker result. Cache Storage remains intact; clearing only
                # the browser cache makes the warm provenance/timing check
                # deterministic and proves latency emulation is gone.
                await cdp.call("Network.clearBrowserCache")
                cdp.events.clear()
                await cdp.call("Page.navigate", {"url": url})
                warm = await wait_for_report(
                    cdp, timeout, excluded_run_id=seed.get("meta", {}).get("runId"), label="warm",
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
                        "ttftfBasis": "navigation-start-to-visible-textured-coverage",
                        "coldNetworkProfile": COLD_NETWORK_PROFILE,
                        "warmNetworkProfile": WARM_NETWORK_PROFILE,
                        "networkEmulationClearedBeforeWarm": True,
                        "cacheResetBeforeCold": cache_reset,
                        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    },
                    "cold": cold,
                    "serviceWorkerSeed": seed,
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
                    "coldResponses": cold_responses,
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
        # Chrome forks renderers/GPU workers. Killing only the browser parent
        # leaks those workers into later matrix trials and eventually OOMs the
        # host; this private process group is safe to reap as a unit.
        try: os.killpg(proc.pid, signal.SIGTERM)
        except ProcessLookupError: pass
        try: proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            try: os.killpg(proc.pid, signal.SIGKILL)
            except ProcessLookupError: pass
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
    dpr = float(args[args.index("--dpr") + 1]) if "--dpr" in args else 1
    render_cap = args[args.index("--render-cap") + 1] if "--render-cap" in args else "capped"
    print(f"[bench] {url} dpr={dpr:g} render-cap={render_cap}", flush=True)
    return asyncio.run(run(url, out_json, screenshot, timeout, viewport, warm_reload, dpr, render_cap))


if __name__ == "__main__":
    sys.exit(main())
