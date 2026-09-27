#!/opt/homebrew/bin/python3.14
"""Real-network visual completeness: open URL cold, screenshot every second,
capture a settled reference, score frames with netlab's block SSIM.

usage: realvc.py URL OUTDIR [--observe 60] [--settle 30]
Fresh Chrome profile under Hexagons-codex/tmp (the external tripwire keys on
'Hexagons'). Prints a JSON summary; writes frames/, contact.png, result.json.
"""
import argparse, asyncio, base64, json, os, shutil, signal, socket, subprocess, sys, tempfile, time, urllib.request
from pathlib import Path
import websockets

CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
VC = str(Path(__file__).resolve().parents[1] / 'vc_frames.py')
READY_JS = """(() => { const v = window.pistonViewer; const el = document.querySelector('#loader');
  return { loaderHidden: !!v?.loaderHidden || (!!el && getComputedStyle(el).display === 'none') }; })()"""


def free_port():
    s = socket.socket(); s.bind(('127.0.0.1', 0)); p = s.getsockname()[1]; s.close(); return p


async def run(url, out, observe, settle):
    out.mkdir(parents=True, exist_ok=True); (out / 'frames').mkdir(exist_ok=True)
    port = free_port()
    profile = tempfile.mkdtemp(prefix='realvc-', dir=os.environ.get('HEXAGONS_PROFILE_DIR', str(Path(__file__).resolve().parents[1] / 'tmp')))
    proc = subprocess.Popen([CHROME, '--headless=new', f'--remote-debugging-port={port}',
                             f'--user-data-dir={profile}', '--window-size=1440,900',
                             '--force-device-scale-factor=1', '--no-first-run', 'about:blank'],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
    frames, loader_ms = [], None
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
            async def shot(path):
                r = await call('Page.captureScreenshot', {'format': 'jpeg', 'quality': 70,
                               'clip': {'x': 0, 'y': 0, 'width': 1440, 'height': 900, 'scale': 0.5}})
                if 'data' not in r:
                    return False  # nothing painted yet
                path.write_bytes(base64.b64decode(r['data']))
                return True
            await call('Page.enable')
            t0 = time.time()
            await call('Page.navigate', {'url': url})
            i = 0
            while time.time() - t0 < observe:
                target = t0 + i * 1.0
                await asyncio.sleep(max(0, target - time.time()))
                f = out / 'frames' / f'{i:04d}.jpg'
                t = (time.time() - t0) * 1000
                if await shot(f):
                    frames.append({'phase': 'load', 'tMs': t, 'file': str(f)})
                if loader_ms is None:
                    r = await call('Runtime.evaluate', {'expression': READY_JS, 'returnByValue': True})
                    if (r.get('result', {}).get('value') or {}).get('loaderHidden'): loader_ms = t
                i += 1
            await asyncio.sleep(settle)
            ref = out / 'reference.jpg'
            for _ in range(10):
                if await shot(ref): break
                await asyncio.sleep(1)
    finally:
        try:
            os.killpg(proc.pid, signal.SIGTERM); proc.wait(timeout=5)
        except Exception:
            try: os.killpg(proc.pid, signal.SIGKILL)
            except Exception: pass
        shutil.rmtree(profile, ignore_errors=True)
    manifest = {'frames': frames, 'references': {'load': str(out / 'reference.jpg')}}
    (out / 'frames.json').write_text(json.dumps(manifest))
    subprocess.run(['/usr/bin/python3', VC, str(out / 'frames.json'), str(out / 'vc.json'),
                    '--contact', str(out / 'contact.png')], check=True)
    vc = json.loads((out / 'vc.json').read_text())
    summary = {'url': url, 'loaderHiddenMs': None if loader_ms is None else round(loader_ms), **vc.get('load', vc)}
    summary.pop('curve', None)
    (out / 'result.json').write_text(json.dumps({'summary': summary, 'vc': vc}, indent=1))
    print(json.dumps(summary))


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('url'); p.add_argument('out', type=Path)
    p.add_argument('--observe', type=float, default=60); p.add_argument('--settle', type=float, default=30)
    a = p.parse_args()
    asyncio.run(run(a.url, a.out, a.observe, a.settle))
