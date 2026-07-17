#!/usr/bin/env python3
"""AA-12/13/15/16 release browser gate (real Chromium, real built app)."""
import asyncio, json, os, shutil, subprocess, sys, tempfile, time, urllib.request
from pathlib import Path
import websockets

CHROME = os.environ.get('CHROME_BIN') or '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
PORT = 9444

class CDP:
    def __init__(self, ws): self.ws, self.n = ws, 0
    async def call(self, method, params=None):
        self.n += 1; ident = self.n
        await self.ws.send(json.dumps({'id': ident, 'method': method, 'params': params or {}}))
        while True:
            value = json.loads(await self.ws.recv())
            if value.get('id') == ident:
                if 'error' in value: raise RuntimeError(f'{method}: {value["error"]}')
                return value.get('result', {})
    async def js(self, expression, await_promise=True):
        result = await self.call('Runtime.evaluate', {'expression': expression, 'returnByValue': True, 'awaitPromise': await_promise})
        return result.get('result', {}).get('value')

async def main(url, output):
    profile = tempfile.mkdtemp(prefix='hex-ux-gate-')
    proc = subprocess.Popen([CHROME, '--headless=new', f'--remote-debugging-port={PORT}', f'--user-data-dir={profile}', '--no-first-run', url], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        target = None
        for _ in range(80):
            try:
                with urllib.request.urlopen(f'http://127.0.0.1:{PORT}/json') as response:
                    target = next((row for row in json.load(response) if row.get('type') == 'page' and 'localhost' in row.get('url','')), None)
                if target: break
            except Exception: pass
            await asyncio.sleep(.25)
        if not target: raise RuntimeError('Chrome target never appeared')
        async with websockets.connect(target['webSocketDebuggerUrl'], max_size=64*1024*1024) as ws:
            cdp = CDP(ws); await cdp.call('Runtime.enable'); await cdp.call('Page.enable')
            deadline = time.monotonic() + 90
            while time.monotonic() < deadline:
                if await cdp.js('Boolean(window.pistonViewer?.loaderHidden)'): break
                await asyncio.sleep(.25)
            else: raise RuntimeError('viewer did not become ready')
            await cdp.call('Emulation.setEmulatedMedia', {'features':[{'name':'prefers-reduced-motion','value':'reduce'}]})
            reduced = json.loads(await cdp.js("JSON.stringify({matches:matchMedia('(prefers-reduced-motion: reduce)').matches,duration:getComputedStyle(document.querySelector('.skier-container')).animationDuration})"))
            # Observe the actual first input, rather than merely timing a helper.
            search = json.loads(await cdp.js("""(async()=>{const q=document.querySelector('#hex-search-input');q.focus();await new Promise(r=>setTimeout(r,500));const tasks=[];const o=new PerformanceObserver(l=>tasks.push(...l.getEntries().map(e=>e.duration)));o.observe({type:'longtask'});q.value='zuckerhutl';q.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(r=>setTimeout(r,350));o.disconnect();return JSON.stringify({results:document.querySelectorAll('[role=option]').length,maxLongTaskMs:Math.max(0,...tasks),status:document.querySelector('#hex-search-status').textContent});})()"""))
            controls = json.loads(await cdp.js("""(()=>{const v=window.pistonViewer,b=document.querySelector('#gradient-terrain');const before=v.gradientMode;b.click();return new Promise(r=>requestAnimationFrame(()=>r(JSON.stringify({before,after:v.gradientMode,renderScheduled:!!v.needsRender}))));})()"""))
            persistence = json.loads(await cdp.js("""(()=>{const v=window.pistonViewer;v.camera.position.x+=17;v.viewState.commitViewChange();return JSON.stringify({stored:!!localStorage.getItem('hexagons.public-view.v1'),url:location.href});})()"""))
            await cdp.call('Page.reload', {'ignoreCache': True})
            for _ in range(240):
                state = await cdp.js("JSON.stringify({ready:!!window.pistonViewer?.loaderHidden,stored:!!localStorage.getItem('hexagons.public-view.v1'),url:location.href})")
                if state and json.loads(state)['ready']: break
                await asyncio.sleep(.25)
            report = {'reducedMotion':reduced, 'search':search, 'controls':controls, 'persistence':persistence, 'reload':json.loads(state)}
            axe = Path('frontend/app/node_modules/axe-core/axe.min.js').read_text()
            await cdp.js(axe, False)
            report['axe'] = json.loads(await cdp.js("axe.run(document).then(r=>JSON.stringify({seriousCritical:r.violations.filter(v=>['serious','critical'].includes(v.impact)).map(v=>v.id),violations:r.violations.length}))"))
            if search['results'] < 1 or search['maxLongTaskMs'] > 50 or controls['after'] != 0 or not persistence['stored'] or not report['reload']['stored'] or not reduced['matches'] or report['axe']['seriousCritical']:
                raise RuntimeError('UX acceptance failure: '+json.dumps(report))
            Path(output).write_text(json.dumps(report, indent=2)); print(json.dumps(report, indent=2))
    finally:
        proc.terminate();
        try: proc.wait(timeout=5)
        except subprocess.TimeoutExpired: proc.kill()
        shutil.rmtree(profile, ignore_errors=True)

if __name__ == '__main__': asyncio.run(main(sys.argv[1], sys.argv[2]))
