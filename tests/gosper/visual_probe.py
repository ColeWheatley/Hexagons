#!/usr/bin/env python3.14
"""Headless visual probe for the gosper viewer.

Loads the app in headless Chrome (rAF runs unthrottled there — a visible-but-
unfocused tab suspends rAF and fakes deadlock), waits for tiles to stream +
sinter, then drives the camera through a fixed set of poses and saves a PNG
per pose for eyeball review.

Usage: python3.14 tests/gosper/visual_probe.py http://localhost:8123/ outdir/
"""
import asyncio
import base64
import json
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.request

import websockets

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PORT = 9337


class CDP:
    def __init__(self, ws):
        self.ws = ws
        self.n = 0

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

    async def js(self, expr):
        res = await self.call("Runtime.evaluate", {
            "expression": expr, "returnByValue": True, "awaitPromise": True})
        return res.get("result", {}).get("value")

    async def shot(self, path):
        r = await self.call("Page.captureScreenshot", {"format": "png"})
        with open(path, "wb") as f:
            f.write(base64.b64decode(r["data"]))
        print(f"  saved {path}", flush=True)


# Each pose: (name, js to position the camera / tweak state, settle seconds)
POSES = [
    ("settle_aerial", """
        const v = window.pistonViewer; const t = v.controls.target;
        v.camera.position.set(t.x + 200, 850, t.z + 1100);
        v.controls.update(); v.needsRender = true; v.needsLODUpdate = true; 'ok'
    """, 25),
    ("closeup_units", """
        const v = window.pistonViewer; const t = v.controls.target;
        v.camera.position.set(t.x + 60, 380, t.z + 320);
        v.controls.update(); v.needsRender = true; v.needsLODUpdate = true; 'ok'
    """, 12),
    ("moving_coarse", """
        const v = window.pistonViewer;
        v._savedMaxFrame = v.maxFrameTime; v.maxFrameTime = -1;  // block refinement
        v.qualityScale = v.movingCoarseness; v.isRefining = false;
        const t = v.controls.target;
        v.camera.position.set(t.x - 900, 1500, t.z + 1600);
        v.controls.update(); v.needsRender = true; v.needsLODUpdate = true; 'ok'
    """, 4),
    ("topdown_2d", """
        const v = window.pistonViewer;
        v.maxFrameTime = v._savedMaxFrame ?? 500;   // re-enable refinement
        const t = v.controls.target;
        v.camera.position.set(t.x, 2600, t.z + 22); // near-vertical: flat 2D mode
        v.controls.update(); v.needsRender = true; v.needsLODUpdate = true; 'ok'
    """, 15),
    ("horizon_far", """
        const v = window.pistonViewer; const t = v.controls.target;
        v.camera.position.set(t.x + 300, 2500, t.z + 5200);
        v.controls.update(); v.needsRender = true; v.needsLODUpdate = true; 'ok'
    """, 12),
]

STATUS = """(() => { const v = window.pistonViewer;
  return JSON.stringify({tiles: v.tiles.size, instQ: v.instantiateQueue.length,
    q: +v.qualityScale.toFixed(2), state: v.engineState,
    sintered: [...v.tiles.values()].filter(t=>!t.needsSinteredBuild).length,
    tex: v.texStats.count, texFail: v._texErrorCount,
    tris: v.renderer.info.render.triangles}); })()"""


async def run(url, outdir):
    profile = tempfile.mkdtemp(prefix="chrome-probe-")
    proc = subprocess.Popen(
        [CHROME, "--headless=new", f"--remote-debugging-port={PORT}",
         f"--user-data-dir={profile}", "--no-first-run", "--window-size=1440,900",
         "--hide-crash-restore-bubble", url],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
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
            raise RuntimeError("page target never appeared")

        async with websockets.connect(ws_url, max_size=64 * 1024 * 1024) as ws:
            cdp = CDP(ws)
            await cdp.call("Runtime.enable")
            await cdp.call("Page.enable")

            # Wait for initial stream: viewer exists and >= 30 tiles resident
            deadline = time.time() + 180
            while time.time() < deadline:
                st = await cdp.js(STATUS + " /* poll */")
                if st:
                    s = json.loads(st)
                    print(f"  boot: {s}", flush=True)
                    if s["tiles"] >= 30 and s["instQ"] == 0:
                        break
                await asyncio.sleep(3)

            for name, setup, settle in POSES:
                await cdp.js(f"(() => {{ {setup} }})()")
                await asyncio.sleep(settle)
                st = await cdp.js(STATUS)
                print(f"  {name}: {st}", flush=True)
                await cdp.shot(f"{outdir}/{name}.png")
            return 0
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
        shutil.rmtree(profile, ignore_errors=True)


if __name__ == "__main__":
    sys.exit(asyncio.run(run(sys.argv[1], sys.argv[2])))
