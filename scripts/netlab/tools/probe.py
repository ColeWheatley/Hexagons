#!/opt/homebrew/bin/python3.14
"""Minimal CDP probe: open a URL in headless Chrome, sample viewer state.

usage: probe.py URL SECONDS [SAMPLE_EVERY]
Prints one JSON line per sample with texture/geometry/network scheduler state.
Profile dir lives under Hexagons-codex/tmp (the external tripwire keys on it).
"""
from pathlib import Path
import asyncio, json, os, shutil, signal, socket, subprocess, sys, tempfile, time, urllib.request
import websockets

CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
STATE_JS = r"""(() => {
  const v = window.pistonViewer; if (!v) return {ready:false};
  const tiers = {}; const desired = {}; const levels = {}; let demanded = 0, lowPending = 0;
  for (const s of v.textureStates?.values?.() || []) {
    for (const [t, a] of s.assets) { const k = t + (a.level != null ? '@' + a.level : ''); tiers[k] = (tiers[k]||0)+1; }
    if (s.classification !== 'outside') {
      demanded++; desired[s.desiredTier] = (desired[s.desiredTier]||0)+1;
      if (s.desiredHighLevel != null) levels[s.desiredHighLevel] = (levels[s.desiredHighLevel]||0)+1;
      if (!s.assets.has('low128') && s.tierStates.get('low128') !== 'failed') lowPending++;
    }
  }
  const q = {}; for (const t of v.textureQueue) q[t.tier] = (q[t.tier]||0)+1;
  const tileDepth = {}; let hidden = 0;
  for (const t of v.tiles.values()) { tileDepth[t.availableDepth] = (tileDepth[t.availableDepth]||0)+1; if (t.hidden) hidden++; }
  return {ready:true, t: Math.round(performance.now()), loaderHidden: v.loaderHidden, moving: v.isMovingView,
    frames: v._frameCounter, boot: v.bootstrapPhaseActive, tiles: v.tiles.size, hidden, tileDepth,
    loadQueue: v.loadQueue.length, activeWorkers: v.activeWorkerCount,
    texAssets: tiers, demanded, desired, desiredLevels: levels, lowPending, texQueue: q,
    activeTexJobs: v.activeTextureJobs, results: v.textureResultQueue.length,
    net: v.netScheduler?.snapshot?.(), texStore: v.textureByteStore?.snapshot?.(),
    tileStore: v.tileByteStore?.snapshot?.(), prefetch: [v.texturePrefetchStats, v.tilePrefetchStats],
    errors: v._texErrorCount, fatal: v.fatalState || null, profile: v.capabilityProfile?.name,
    dpr: window.devicePixelRatio, canvas: [v.renderer?.domElement?.width, v.renderer?.domElement?.height],
    rebuildQueue: v.geometryRebuildQueue?.length, needsLOD: v.needsLODUpdate, engine: v.engineState,
    pendingRebuilds: [...v.tiles.values()].filter(t => t.geometryRebuildPending).length,
    queuedRebuilds: [...v.tiles.values()].filter(t => t.geometryRebuildQueued).length,
    awaitingFinal: [...v.tiles.values()].filter(t => t.geometryAwaitingFinal).length,
    sample: [...v.tiles.entries()].slice(0, 3).map(([k, t]) => {
      const m = v.manifestGrid.get(k); let req = null;
      try { req = v._tileRequiredDepth(m, k, t.geometryDesiredSelection || t.geometrySelection); } catch (e) { req = String(e).slice(0, 80); }
      return {k, avail: t.availableDepth, dist: Math.round(v.visibilityByKey.get(k)?.distanceMeters), cls: v.visibilityByKey.get(k)?.classification, req, sig: String(t.geometryDesiredSignature).slice(-12), bv: t.binaryVersion};
    })};
})()"""


def free_port():
    s = socket.socket(); s.bind(('127.0.0.1', 0)); p = s.getsockname()[1]; s.close(); return p


async def main(url, seconds, every):
    port = free_port()
    profile = tempfile.mkdtemp(prefix='probe-', dir=os.environ.get('HEXAGONS_PROFILE_DIR', str(Path(__file__).resolve().parents[1] / 'tmp')))
    proc = subprocess.Popen([CHROME, '--headless=new', f'--remote-debugging-port={port}',
                             f'--user-data-dir={profile}', '--ignore-certificate-errors',
                             '--allow-insecure-localhost', '--window-size=1440,900',
                             '--force-device-scale-factor=1', '--no-first-run', 'about:blank'],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
    try:
        for _ in range(100):
            try:
                tabs = json.load(urllib.request.urlopen(f'http://127.0.0.1:{port}/json'))
                page = next(t for t in tabs if t['type'] == 'page'); break
            except Exception:
                time.sleep(0.1)
        async with websockets.connect(page['webSocketDebuggerUrl'], max_size=None, ping_interval=None) as ws:
            ident = 0
            async def call(method, params=None):
                nonlocal ident; ident += 1; my = ident
                await ws.send(json.dumps({'id': my, 'method': method, 'params': params or {}}))
                while True:
                    msg = json.loads(await ws.recv())
                    if msg.get('id') == my: return msg.get('result', {})
                    if msg.get('method') == 'Runtime.consoleAPICalled':
                        args = ' '.join(str(a.get('value', a.get('description', ''))) for a in msg['params']['args'])
                        if msg['params']['type'] in ('error', 'warning') or 'HEXAGONS' in args:
                            print('CONSOLE', msg['params']['type'], args[:300], flush=True)
                    if msg.get('method') == 'Runtime.exceptionThrown':
                        print('EXCEPTION', json.dumps(msg['params']['exceptionDetails'])[:600], flush=True)
            await call('Runtime.enable'); await call('Page.enable')
            if os.environ.get('PROBE_MOBILE'):
                await call('Emulation.setDeviceMetricsOverride', {'width': 390, 'height': 844, 'deviceScaleFactor': 3, 'mobile': True})
                await call('Emulation.setTouchEmulationEnabled', {'enabled': True, 'maxTouchPoints': 5})
                await call('Emulation.setUserAgentOverride', {'userAgent': 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Mobile Safari/537.36'})
                await call('Page.addScriptToEvaluateOnNewDocument', {'source': "Object.defineProperty(Navigator.prototype,'deviceMemory',{get:()=>4});Object.defineProperty(Navigator.prototype,'hardwareConcurrency',{get:()=>6});"})
            await call('Page.navigate', {'url': url})
            t0 = time.time()
            while time.time() - t0 < seconds:
                await asyncio.sleep(every)
                r = await call('Runtime.evaluate', {'expression': STATE_JS, 'returnByValue': True})
                print(json.dumps(r.get('result', {}).get('value')), flush=True)
    finally:
        try:
            os.killpg(proc.pid, signal.SIGTERM); proc.wait(timeout=5)
        except Exception:
            try: os.killpg(proc.pid, signal.SIGKILL)
            except Exception: pass
        shutil.rmtree(profile, ignore_errors=True)


if __name__ == '__main__':
    asyncio.run(main(sys.argv[1], float(sys.argv[2]), float(sys.argv[3]) if len(sys.argv) > 3 else 5))
