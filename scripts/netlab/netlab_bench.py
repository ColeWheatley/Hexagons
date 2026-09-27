#!/opt/homebrew/bin/python3.14
"""CDP slow-link visual/network bench. Requires websockets on Homebrew Python 3.14."""
import argparse
import asyncio
import base64
import json
import os
from pathlib import Path
import shutil
import signal
import socket
import subprocess
import tempfile
import time
import urllib.parse
import urllib.request
import uuid

import websockets

CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_URL = 'https://localhost:8443/hexagons/app/'
STATE_JS = """JSON.stringify((() => {
  const v=window.pistonViewer, el=document.querySelector('#loader');
  const p=v?.profiler;
  return {ready:!!v, loaderHidden:!!v?.loaderHidden || !!el && getComputedStyle(el).display==='none',
    frames:v?._frameCounter ?? null, profilerMilestones:p?.milestones ?? null,
    swSupported:'serviceWorker' in navigator, swControlled:!!navigator.serviceWorker?.controller,
    swScript:navigator.serviceWorker?.controller?.scriptURL ?? null,
    cacheNames:[]};
})())"""
MOTION_JS = """(function(delta,duration) {
  const v=window.pistonViewer; if (!v) throw new Error('no viewer');
  const from=performance.now(), x0=v.controls.target.x, cx0=v.camera.position.x;
  window.__netlabMotionDone=false;
  function tick(now) {
    const t=Math.min(1,(now-from)/duration), eased=t*t*(3-2*t);
    v.controls.target.x=x0+delta*eased; v.camera.position.x=cx0+delta*eased;
    v.notifyCameraMotion(now); v.controls.update(); v.syncHeightFactorFromControls?.();
    v.lastLODCamPos.copy(v.camera.position); v.needsLODUpdate=true; v.needsRender=true;
    if (t<1) requestAnimationFrame(tick); else window.__netlabMotionDone=true;
  }
  requestAnimationFrame(tick); return true;
})"""


def free_port():
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0)); return s.getsockname()[1]


def wait_for_memory():
    deadline = time.monotonic() + 600
    while True:
        text = subprocess.check_output(['vm_stat'], text=True)
        pages = {}
        for line in text.splitlines():
            if ':' in line:
                key, value = line.split(':', 1)
                try: pages[key] = int(value.strip().rstrip('.'))
                except ValueError: pass
        # vm_stat prints the page size; M1 Pro uses 16 KiB.
        free = sum(pages.get(f'Pages {kind}', 0) for kind in ('free', 'inactive', 'speculative')) * 16384
        if free >= 3 * 1024 ** 3: return free
        if time.monotonic() >= deadline: raise RuntimeError(f'free+inactive+speculative stayed below 3 GiB ({free} bytes)')
        print(f'Waiting for 3 GiB free memory ({free / 1024**3:.2f} GiB)', flush=True)
        time.sleep(30)


def tree_rss_kb(root):
    try: lines = subprocess.check_output(['ps', '-axo', 'pid,ppid,rss,command'], text=True).splitlines()[1:]
    except Exception: return None
    children = {}
    for line in lines:
        parts = line.strip().split(None, 3)
        if len(parts) < 4: continue
        try: pid, ppid, rss = map(int, parts[:3])
        except ValueError: continue
        children[pid] = (ppid, rss)
    known = {root}
    while True:
        more = {pid for pid, (ppid, _) in children.items() if ppid in known}
        if more <= known: break
        known |= more
    return sum(children.get(pid, (0, 0))[1] for pid in known)


class CDP:
    def __init__(self, ws): self.ws=ws; self.n=0
    async def call(self, method, params=None):
        self.n += 1; ident=self.n
        await self.ws.send(json.dumps({'id':ident,'method':method,'params':params or {}}))
        while True:
            msg=json.loads(await self.ws.recv())
            if msg.get('id')==ident:
                if 'error' in msg: raise RuntimeError(f'{method}: {msg["error"]}')
                return msg.get('result',{})
    async def js(self, expr):
        r=await self.call('Runtime.evaluate',{'expression':expr,'returnByValue':True,'awaitPromise':False})
        if 'exceptionDetails' in r: raise RuntimeError(str(r['exceptionDetails']))
        return r.get('result',{}).get('value')


def server_get(url):
    import ssl
    with urllib.request.urlopen(url, context=ssl._create_unverified_context(), timeout=20) as f:
        return json.load(f)


def category(path):
    if 'tile_manifest.json' in path: return 'manifest'
    if 'service_worker' in path or 'service-worker' in path: return 'service-worker'
    if 'tiles_bin/' in path: return 'tiles_bin'
    if 'aerial_pages/' in path:
        for tier in ('bootstrap','low','medium','high'):
            if f'/{tier}/' in path or f'_{tier}.' in path or f'/{tier}_' in path: return f'aerial_pages/{tier}'
        return 'aerial_pages/other'
    if path.endswith(('.html','.js','.css','.wasm','.woff','.woff2')) or path.endswith('/'): return 'html/js/css/wasm/fonts'
    return 'other'


def network_summary(logfile, run_id):
    start=end=None; rows=[]; phase_marks={}
    for line in Path(logfile).read_text().splitlines():
        try: x=json.loads(line)
        except ValueError: continue
        mark=x.get('mark')
        if mark == f'{run_id}:run-start': start=x['t']; continue
        if mark == f'{run_id}:run-end': end=x['t']; break
        if start is None: continue
        if mark and mark.startswith(run_id+':'): phase_marks[mark.split(':',1)[1]]=x['t']
        if 'path' in x and not x['path'].startswith('/__netlab/'):
            rows.append(x)
    if start is None or end is None: raise RuntimeError('run markers absent from server log')
    windows=[]
    for name,t in phase_marks.items():
        if name.endswith(':start'):
            phase=name[:-6]
            if phase+':end' in phase_marks: windows.append((t,phase_marks[phase+':end']))
    first_phase_start=min((a for a,_ in windows),default=end)
    rows=[x for x in rows if start<=x['t0']<first_phase_start or any(a<=x['t0']<=b for a,b in windows)]
    totals={}; ranges=[]; seen=set(); redownload=0; manifest_last=None; first_tile=None
    for x in rows:
        if x['status'] not in (200,206): continue
        cat=category(x['path']); bucket=totals.setdefault(cat,{'requests':0,'bytes':0})
        bucket['requests']+=1; bucket['bytes']+=x['bytes']
        pair=(x['path'],x.get('query'),x.get('range'))
        if pair in seen: redownload+=x['bytes']
        if x.get('complete'): seen.add(pair)
        if x.get('range') and cat.startswith(('tiles_bin','aerial_pages')):
            ranges.append({'path':x['path'],'range':x['range'],'bytes':x['bytes']})
        finish=x['t0']+x['durMs']-start
        if cat=='manifest': manifest_last=max(manifest_last or 0,finish)
        if cat=='tiles_bin': first_tile=min(first_tile or finish,finish)
    return {'totalBytes':sum(x['bytes'] for x in rows if x['status'] in (200,206)),
      'requestCount':sum(x['status'] in (200,206) for x in rows), 'categories':totals,
      'redownloadBytes':redownload,'ranges':ranges,'manifestLastByteMs':manifest_last,
      'firstTileLastByteMs':first_tile,'phaseMarksMs':{k:round(v-start,1) for k,v in phase_marks.items()},
      'serverWindowMs':round(end-start,1),'errors':[x for x in rows if x['status']>=400]}


async def run(args, proc, ws_url, frames_dir):
    origin=urllib.parse.urlsplit(args.url)
    control=f'{origin.scheme}://{origin.netloc}'
    run_id=uuid.uuid4().hex
    async with websockets.connect(ws_url,max_size=64*1024*1024) as ws:
        cdp=CDP(ws)
        for method in ('Runtime.enable','Page.enable','Performance.enable','Network.enable'): await cdp.call(method)
        await cdp.call('Emulation.setDeviceMetricsOverride',{'width':1440,'height':900,'deviceScaleFactor':args.dpr,'mobile':False})
        async def mark(name): server_get(f'{control}/__netlab/mark?name={urllib.parse.quote(run_id+":"+name)}')
        async def profile(name): server_get(f'{control}/__netlab/profile?name={name}')
        async def navigate(): await cdp.call('Page.navigate',{'url':args.url})
        async def state():
            try: return json.loads(await cdp.js(STATE_JS) or '{}')
            except RuntimeError as e:
                if 'context' in str(e).lower(): return {}
                raise
        async def screenshot(file):
            r=await cdp.call('Page.captureScreenshot',{'format':'jpeg','quality':70,'captureBeyondViewport':False,
               'clip':{'x':0,'y':0,'width':1440,'height':900,'scale':.5}})
            file.write_bytes(base64.b64decode(r['data']))
        async def wait_idle(cap=90):
            deadline=time.monotonic()+cap
            while time.monotonic()<deadline:
                s=server_get(f'{control}/__netlab/stats')
                if s['queuedBytes']==0 and s['active']==0 and s['nowMs']-s['lastRequestMs']>=8000: return True
                await asyncio.sleep(1)
            return False
        async def capture_phase(phase, seconds, measured=True):
            if measured: await mark(f'{phase}:start')
            start=time.monotonic(); next_frame=start; next_poll=start
            while time.monotonic()-start<seconds:
                now=time.monotonic()
                if now>=next_poll:
                    s=await state()
                    if measured:
                        if milestones['loaderHiddenMs'] is None and s.get('loaderHidden'):
                            milestones['loaderHiddenMs']=round((now-run_start)*1000,1)
                        if s.get('frames') is not None:
                            milestones['frameSamples'].append({'tMs':round((now-run_start)*1000,1),'count':s['frames']})
                        if s.get('profilerMilestones'): milestones['profilerMilestones']=s['profilerMilestones']
                    next_poll+=.25
                if measured and now>=next_frame:
                    f=frames_dir/f'{len(frames):04d}.jpg'; await screenshot(f)
                    frames.append({'phase':phase,'tMs':round((now-start)*1000,1),'file':str(f)})
                    next_frame+=.5
                await asyncio.sleep(max(.01,min(next_poll,next_frame if measured else next_poll)-time.monotonic()))
            if measured: await mark(f'{phase}:end')
        async def settle_reference(phase):
            await profile('none')
            quiet=await wait_idle()
            await asyncio.sleep(.25)
            f=frames_dir/f'ref-{phase}.jpg'; await screenshot(f)
            references[phase]=str(f); settle[phase]={'quiet':quiet}
            await profile(args.profile)
        frames=[]; references={}; settle={}; milestones={'loaderHiddenMs':None,'frameSamples':[],'profilerMilestones':None}
        await profile(args.profile)
        if args.scenario=='warm':
            print('Seeding warm profile...',flush=True)
            await navigate(); await capture_phase('seed',args.seed_seconds,False)
            sw=await state()
            if not sw.get('swSupported') or not sw.get('swControlled'):
                raise RuntimeError(f'service worker failed to control seed page: {sw}')
            await cdp.call('Network.clearBrowserCache')
        await mark('run-start'); run_start=time.monotonic()
        await navigate()
        if args.scenario in ('cold','warm'):
            await capture_phase('load',args.observe); await settle_reference('load')
        elif args.scenario=='pan':
            await capture_phase('initial',45); await settle_reference('initial')
            await mark('pan-east')
            await cdp.js(f'{MOTION_JS}(3000,6000)')
            await capture_phase('east',31); await settle_reference('east')
            await mark('pan-back')
            await cdp.js(f'{MOTION_JS}(-3000,6000)')
            await capture_phase('return',31); await settle_reference('return')
        else:
            await capture_phase('initial',45); await settle_reference('initial')
            await mark('jump-west')
            await cdp.js("(() => { const v=window.pistonViewer; v.controls.target.x-=12000; v.camera.position.x-=12000; v.notifyCameraMotion(performance.now()); v.controls.update(); v.syncHeightFactorFromControls?.(); v.lastLODCamPos.copy(v.camera.position); v.needsLODUpdate=true; v.needsRender=true; return true; })()")
            await capture_phase('west',45); await settle_reference('west')
        await mark('run-end')
        final=await state()
        if not final.get('swControlled'): raise RuntimeError(f'service worker did not control measured page: {final}')
        metrics=await cdp.call('Performance.getMetrics')
        heap=next((m['value'] for m in metrics.get('metrics',[]) if m['name']=='JSHeapUsedSize'),None)
        rss=tree_rss_kb(proc.pid)
        return {'runId':run_id,'url':args.url,'scenario':args.scenario,'profile':args.profile,
            'dpr':args.dpr,'observeSeconds':args.observe,'serviceWorker':final,'milestones':milestones,
            'memory':{'jsHeapUsedBytes':heap,'chromeTreeRssKiB':rss},'frames':frames,
            'references':references,'settle':settle}


def summarize(result):
    lines=[f'# netlab {result["scenario"]} ({result["profile"]})', '',
      f'Run: `{result["runId"]}`', f'URL: `{result["url"]}`',
      f'SW controlled: {result["serviceWorker"].get("swControlled")}', '',
      '| Phase | SpeedIndex ms | VC50 ms | VC85 ms | VC95 ms |', '|---|---:|---:|---:|---:|']
    for phase,v in result['visual'].items():
        lines.append(f'| {phase} | {v["speedIndexMs"]} | {v["tVC50Ms"]} | {v["tVC85Ms"]} | {v["tVC95Ms"]} |')
    n=result['network']; lines += ['',f'Network: {n["totalBytes"]:,} bytes in {n["requestCount"]} requests; repeat bytes {n["redownloadBytes"]:,}.',
      f'Manifest last byte: {n["manifestLastByteMs"]} ms; first tile last byte: {n["firstTileLastByteMs"]} ms.',
      f'Loader hidden: {result["milestones"]["loaderHiddenMs"]} ms.',
      f'JS heap: {result["memory"]["jsHeapUsedBytes"]} bytes; Chrome tree RSS: {result["memory"]["chromeTreeRssKiB"]} KiB.',
      f'Errors: {len(n["errors"])}.', '']
    return '\n'.join(lines)


def main():
    p=argparse.ArgumentParser()
    p.add_argument('--url',default=DEFAULT_URL); p.add_argument('--scenario',choices=('cold','warm','pan','jump'),required=True)
    p.add_argument('--profile',default='cafe'); p.add_argument('--observe',type=float,default=90)
    p.add_argument('--seed-seconds',type=float,default=90); p.add_argument('--dpr',type=float,default=1)
    p.add_argument('--out',type=Path,required=True); p.add_argument('--server-log',type=Path,default=SCRIPT_DIR/'tmp/server.jsonl')
    p.add_argument('--frames',action='store_true'); a=p.parse_args()
    a.out.mkdir(parents=True,exist_ok=True)
    if a.dpr<=0 or a.observe<=0: p.error('dpr and observe must be positive')
    (SCRIPT_DIR/'tmp').mkdir(parents=True,exist_ok=True)
    wait_for_memory()
    port=free_port(); profile=Path(tempfile.mkdtemp(prefix='chrome-',dir=SCRIPT_DIR/'tmp'))
    frames_dir=a.out/'frames' if a.frames else Path(tempfile.mkdtemp(prefix='frames-',dir=SCRIPT_DIR/'tmp'))
    frames_dir.mkdir(parents=True,exist_ok=True)
    proc=None
    try:
        proc=subprocess.Popen([CHROME,'--headless=new',f'--remote-debugging-port={port}',
          f'--user-data-dir={profile}','--no-first-run','--hide-crash-restore-bubble',
          '--window-size=1440,900',f'--force-device-scale-factor={a.dpr}',
          '--ignore-certificate-errors','--allow-insecure-localhost','about:blank'],
          stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,start_new_session=True)
        ws_url=None
        for _ in range(60):
            try:
                with urllib.request.urlopen(f'http://127.0.0.1:{port}/json') as f: targets=json.load(f)
                pages=[x for x in targets if x.get('type')=='page' and x.get('url')=='about:blank']
                if pages: ws_url=pages[0]['webSocketDebuggerUrl']; break
            except Exception: pass
            time.sleep(.5)
        if not ws_url: raise RuntimeError('Chrome page target unavailable')
        result=asyncio.run(run(a,proc,ws_url,frames_dir))
        (a.out/'frame_manifest.json').write_text(json.dumps({'frames':result.pop('frames'),'references':result.pop('references')}))
        subprocess.run(['/usr/bin/python3',str(SCRIPT_DIR/'vc_frames.py'),str(a.out/'frame_manifest.json'),
          str(a.out/'visual.json'),'--contact',str(a.out/'contact.png')],check=True)
        result['visual']=json.loads((a.out/'visual.json').read_text())
        result['network']=network_summary(a.server_log,result['runId'])
        (a.out/'result.json').write_text(json.dumps(result,indent=2))
        (a.out/'summary.md').write_text(summarize(result))
        (a.out/'frame_manifest.json').unlink(); (a.out/'visual.json').unlink()
        print(summarize(result),flush=True)
    finally:
        if proc is not None:
            if proc.poll() is None:
                proc.terminate()
                try: proc.wait(timeout=5)
                except subprocess.TimeoutExpired: pass
            try: os.killpg(proc.pid, signal.SIGKILL)
            except ProcessLookupError: pass
            proc.wait()
        shutil.rmtree(profile,ignore_errors=True)
        if not a.frames: shutil.rmtree(frames_dir,ignore_errors=True)

if __name__=='__main__': main()
