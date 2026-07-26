#!/usr/bin/env python3
"""AA-12/13/15/16 release browser gate (real Chromium, real built app)."""
import asyncio, json, os, signal, shutil, socket, subprocess, sys, tempfile, time, urllib.request
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode
import websockets
from validate_ux_browser_gate import evaluate

CHROME = os.environ.get('CHROME_BIN') or '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

def free_debugging_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
        probe.bind(('127.0.0.1', 0))
        return probe.getsockname()[1]

def with_dev_param(url):
    """The gate drives the developer HUD, so it needs dev mode on. Append
    dev=1 to the query string only if the caller did not already specify a
    dev= value (an explicit override, e.g. dev=0, is left alone)."""
    parts = urlsplit(url)
    query = dict(parse_qsl(parts.query, keep_blank_values=True))
    query.setdefault('dev', '1')
    return urlunsplit(parts._replace(query=urlencode(query)))

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
    url = with_dev_param(url)
    profile = tempfile.mkdtemp(prefix='hex-ux-gate-')
    debug_port, target_host = free_debugging_port(), urlsplit(url).hostname
    proc = subprocess.Popen([CHROME, '--headless=new', f'--remote-debugging-port={debug_port}', f'--user-data-dir={profile}', '--no-first-run', url], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
    try:
        target = None
        for _ in range(80):
            try:
                with urllib.request.urlopen(f'http://127.0.0.1:{debug_port}/json') as response:
                    target = next((row for row in json.load(response) if row.get('type') == 'page' and urlsplit(row.get('url','')).hostname == target_host), None)
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
            reduced = json.loads(await cdp.js("""(()=>{const style=getComputedStyle(document.querySelector('.skier-container'));return JSON.stringify({
                matches:matchMedia('(prefers-reduced-motion: reduce)').matches,duration:style.animationDuration,
                iterationCount:style.animationIterationCount,animationName:style.animationName});})()"""))
            # Start observation before focus: focus owns the first index fetch,
            # decode and parse, so starting afterwards would miss AA-12's cost.
            # ArrowDown + Enter then prove AA-16's real keyboard-only flow and
            # AA-15's <=500 ms search-selection URL update.
            armed = await cdp.js("""(async()=>{const s=window.pistonViewer?.searchBar;
                if(!s)return false;
                if(s.loadPromise){try{await s.loadPromise;}catch(_){}}
                // Force the compact index through its cold parse path even if
                // the natural idle prefetch already won the race.
                s.loaded=false;s.loadPromise=null;s.peaks=[];s.skiAreas=[];s.currentResults=[];
                const tasks=[];const observer=new PerformanceObserver(list=>tasks.push(...list.getEntries().map(e=>e.duration)));
                observer.observe({type:'longtask'});window.__uxSearchProbe={tasks,observer};return true;})()""")
            if not armed: raise RuntimeError('search component was not ready')
            tab_count = 0
            for _ in range(20):
                await cdp.call('Input.dispatchKeyEvent', {'type':'keyDown','key':'Tab','code':'Tab','windowsVirtualKeyCode':9})
                await cdp.call('Input.dispatchKeyEvent', {'type':'keyUp','key':'Tab','code':'Tab','windowsVirtualKeyCode':9})
                tab_count += 1
                if await cdp.js("document.activeElement?.id === 'hex-search-input'"): break
            else: raise RuntimeError('Tab navigation did not reach search input')
            await cdp.call('Input.insertText', {'text':'habicht'})
            one_frame = json.loads(await cdp.js("""new Promise(resolve=>requestAnimationFrame(()=>resolve(JSON.stringify({
                value:document.querySelector('#hex-search-input').value,
                status:document.querySelector('#hex-search-status').textContent,
                results:document.querySelectorAll('[role=option]').length}))))"""))
            for _ in range(80):
                ready = await cdp.js("""Boolean(window.pistonViewer?.searchBar?.loaded
                    && Array.from(document.querySelectorAll('.result-item[data-idx]:not([aria-disabled="true"])'))
                      .some(row=>row.textContent.includes('Habicht')))""")
                if ready: break
                await asyncio.sleep(.025)
            else: raise RuntimeError('cold search did not produce the enabled Habicht result')
            # End the AA-12 observation at result-ready. Camera and terrain
            # work caused by selection is a separate interaction and must not
            # be attributed to compact-index fetch/decode/parse/ranking.
            search_probe = json.loads(await cdp.js("""(()=>{const p=window.__uxSearchProbe;
                p.tasks.push(...p.observer.takeRecords().map(e=>e.duration));p.observer.disconnect();
                return JSON.stringify({maxLongTaskMs:Math.max(0,...p.tasks),longTaskCount:p.tasks.length});})()"""))
            search_before = json.loads(await cdp.js("""(()=>{const v=window.pistonViewer,q=document.querySelector('#hex-search-input');
                window.__uxSearchSelectionStart=performance.now();return JSON.stringify({results:document.querySelectorAll('[role=option]').length,
                status:document.querySelector('#hex-search-status').textContent,url:location.href,input:q.value,
                camera:{x:v.camera.position.x,y:v.camera.position.y,z:v.camera.position.z}});})()"""))
            for key, code, vk in (('ArrowDown','ArrowDown',40), ('Enter','Enter',13)):
                await cdp.call('Input.dispatchKeyEvent', {'type':'keyDown','key':key,'code':code,'windowsVirtualKeyCode':vk})
                await cdp.call('Input.dispatchKeyEvent', {'type':'keyUp','key':key,'code':code,'windowsVirtualKeyCode':vk})
            for _ in range(60):
                if await cdp.js(f"location.href !== {json.dumps(search_before['url'])}"): break
                await asyncio.sleep(.01)
            search = json.loads(await cdp.js("""(()=>{const v=window.pistonViewer,q=document.querySelector('#hex-search-input');
                const before=%s,selectionMs=performance.now()-window.__uxSearchSelectionStart;
                const cameraMoved=v.camera.position.x!==before.camera.x||v.camera.position.y!==before.camera.y||v.camera.position.z!==before.camera.z;
                return JSON.stringify({results:before.results,maxLongTaskMs:%s,longTaskCount:%s,statusBefore:before.status,
                    tabFocused:document.activeElement===q,tabCount:%d,typedByKeyboard:before.input==='habicht',
                    oneFrameResponse:%s,keyboardSelected:q.value==='Habicht',selectedName:q.value,
                    selectionMs,urlUpdated:location.href!==before.url,cameraMoved,
                    statusAfter:document.querySelector('#hex-search-status').textContent});})()""" % (
                        json.dumps(search_before), json.dumps(search_probe['maxLongTaskMs']),
                        json.dumps(search_probe['longTaskCount']), tab_count,
                        'true' if (one_frame['results'] > 0 or one_frame['status'] or one_frame['value'] == 'habicht') else 'false',
                    )))
            controls = json.loads(await cdp.js("""(async()=>{
                const v=window.pistonViewer, panel=document.querySelector('#main-panel');
                const frame=()=>new Promise(resolve=>requestAnimationFrame(resolve));
                const actions=[];
                const record=(name,passed,detail='')=>actions.push({name,passed:!!passed,detail});
                const isVisible=el=>{if(!el||el.hidden)return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;};

                const minimize=document.querySelector('#minimize-btn');
                const minimizedBefore=panel.classList.contains('minimized');
                minimize.click(); await frame();
                record('minimize-btn',panel.classList.contains('minimized')!==minimizedBefore,'panel minimized state toggled');
                if(panel.classList.contains('minimized')){minimize.click();await frame();}

                for(const header of document.querySelectorAll('.collapsible-header')){
                    const before=header.getAttribute('aria-expanded');
                    header.click(); await frame();
                    const after=header.getAttribute('aria-expanded');
                    record(`disclosure:${header.getAttribute('aria-controls')}`,after!==before,`${before} -> ${after}`);
                    if(after!=='true'){header.click();await frame();}
                }

                const copyView=document.querySelector('#copy-view-link'),originalViewWriter=v.writeClipboardText;let copiedView=null;
                v.writeClipboardText=async text=>{copiedView=text;};copyView.click();await frame();v.writeClipboardText=originalViewWriter;
                record('copy-view-link',new URL(location.href).searchParams.get('view')==='1'
                    &&copiedView===location.href&&/COPIED|URL UPDATED/.test(copyView.textContent),copyView.textContent);

                const haze=document.querySelector('#haze-distance-slider'), hazeBefore=v.atmosphereSettings.hazeDistance;
                haze.value=String(Math.min(Number(haze.max),Number(haze.value)+1));v.needsRender=false;
                haze.dispatchEvent(new Event('input',{bubbles:true}));const hazeScheduled=v.needsRender;await frame();
                record('haze-distance-slider',v.atmosphereSettings.hazeDistance!==hazeBefore&&hazeScheduled,'value and render updated');

                const texture=document.querySelector('#tex-upgrade-slider'), textureBefore=v.highTextureDistanceM;
                texture.value=String(Math.min(Number(texture.max),Number(texture.value)+Number(texture.step)));v.needsRender=false;
                texture.dispatchEvent(new Event('input',{bubbles:true}));const textureScheduled=v.needsRender;await frame();
                record('tex-upgrade-slider',v.highTextureDistanceM!==textureBefore&&textureScheduled,'value and render updated');

                const slope=document.querySelector('#gradient-slope'),terrain=document.querySelector('#gradient-terrain');
                v.needsRender=false;slope.click();const slopeScheduled=v.needsRender;await frame();
                record('gradient-slope',v.gradientMode===1&&slopeScheduled&&slope.getAttribute('aria-pressed')==='true','slope active');
                v.needsRender=false;terrain.click();const terrainScheduled=v.needsRender;await frame();
                record('gradient-terrain',v.gradientMode===0&&terrainScheduled&&terrain.getAttribute('aria-pressed')==='true','terrain active');

                const pause=document.querySelector('#lod-pause-toggle');pause.checked=!v.lodPaused;
                pause.dispatchEvent(new Event('change',{bubbles:true}));await frame();
                record('lod-pause-toggle',v.lodPaused===pause.checked,`paused=${v.lodPaused}`);

                const copyLog=document.querySelector('#copy-log-btn'),originalWriter=v.writeClipboardText;let copiedLog=null;
                v.writeClipboardText=async text=>{copiedLog=text;};copyLog.click();await frame();v.writeClipboardText=originalWriter;
                record('copy-log-btn',typeof copiedLog==='string'&&copiedLog.length>0&&copyLog.textContent==='COPIED',copyLog.textContent);

                const searchInput=document.querySelector('#hex-search-input');
                record('hex-search-input',searchInput.value==='Habicht'&&new URL(location.href).searchParams.get('view')==='1','keyboard query and selection');

                const visible=Array.from(document.querySelectorAll('button,input,select,textarea')).filter(isVisible)
                  .map(el=>el.id||`disclosure:${el.getAttribute('aria-controls')}`||el.tagName);
                const covered=new Set(actions.map(row=>row.name));
                const uncovered=visible.filter(name=>!covered.has(name));
                return JSON.stringify({actions,visible,uncovered,allPassed:actions.every(row=>row.passed)&&uncovered.length===0});
            })()"""))
            hud = json.loads(await cdp.js("""(async()=>{const v=window.pistonViewer,deadline=performance.now()+10000;
                while(v.engineState!=='STATIC'&&performance.now()<deadline){await new Promise(r=>setTimeout(r,50));}
                const settled=v.engineState==='STATIC',fpsSamples=[];
                for(let i=0;i<20;i++){fpsSamples.push(document.querySelector('#fps-counter')?.textContent?.trim()||'');await new Promise(r=>setTimeout(r,100));}
                const ids=['fps-counter','hex-count','tri-count','draw-stats','sector-val','hex-val','tile-height','camera-height','near-lod-bands','far-lod-bands','moving-lod-summary','settled-lod-summary','distance-scale-label'];
                const values=Object.fromEntries(ids.map(id=>[id,document.getElementById(id)?.textContent?.trim()||'']));
                const placeholders=Object.entries(values).filter(([,text])=>!text||/--|—|Waiting for system|Initializing/i.test(text)).map(([id])=>id);
                const consoleText=document.querySelector('#console-output')?.textContent||'';
                if(!consoleText.trim()||/Waiting for system|Initializing/i.test(consoleText))placeholders.push('console-output');
                const numericLow=fpsSamples.some(text=>{const m=text.match(/FPS:\\s*([0-9.]+)/);return m&&Number(m[1])>=2&&Number(m[1])<=4;});
                const fpsIdle=settled&&fpsSamples.every(text=>/FPS:\\s*IDLE/.test(text))&&!numericLow;
                return JSON.stringify({engineState:v.engineState,settled,fpsText:values['fps-counter'],fpsSamples,numericLow,fpsIdle,values,placeholders});})()"""))
            navigation = json.loads(await cdp.js("""(()=>{const v=window.pistonViewer,q=document.querySelector('#hex-search-input');
                const before={x:v.camera.position.x,z:v.camera.position.z,url:location.href};
                window.dispatchEvent(new KeyboardEvent('keydown',{key:'w',bubbles:true,cancelable:true}));
                const afterKey={x:v.camera.position.x,z:v.camera.position.z,url:location.href};
                q.focus();q.dispatchEvent(new KeyboardEvent('keydown',{key:'w',bubbles:true,cancelable:true}));
                const afterInput={x:v.camera.position.x,z:v.camera.position.z};
                return JSON.stringify({before,afterKey,afterInput,
                    moved:afterKey.x!==before.x||afterKey.z!==before.z,
                    urlUpdated:afterKey.url!==before.url,
                    inputIsolated:afterInput.x===afterKey.x&&afterInput.z===afterKey.z});})()"""))
            persistence = json.loads(await cdp.js("""(()=>{const v=window.pistonViewer;
                v.camera.position.x+=17;v.viewState.commitViewChange();
                const expected={camera:{x:v.camera.position.x,y:v.camera.position.y,z:v.camera.position.z},target:{x:v.controls.target.x,y:v.controls.target.y,z:v.controls.target.z}};
                const explicitUrl=location.href;history.replaceState(null,'',location.pathname);
                return JSON.stringify({stored:!!localStorage.getItem('hexagons.public-view.v1'),
                    storedEnvelope:JSON.parse(localStorage.getItem('hexagons.public-view.v1')),explicitUrl,expected,urlWithoutView:location.href});})()"""))
            await cdp.call('Page.reload', {'ignoreCache': True})
            for _ in range(240):
                state = await cdp.js("JSON.stringify({ready:!!window.pistonViewer?.loaderHidden,stored:!!localStorage.getItem('hexagons.public-view.v1'),url:location.href})")
                if state and json.loads(state)['ready']: break
                await asyncio.sleep(.25)
            local_restore = json.loads(await cdp.js("""(()=>{const v=window.pistonViewer,e=%s;
                const delta=Math.max(Math.abs(v.camera.position.x-e.camera.x),Math.abs(v.camera.position.y-e.camera.y),Math.abs(v.camera.position.z-e.camera.z),Math.abs(v.controls.target.x-e.target.x),Math.abs(v.controls.target.y-e.target.y),Math.abs(v.controls.target.z-e.target.z));
                return JSON.stringify({ready:!!v.loaderHidden,stored:!!localStorage.getItem('hexagons.public-view.v1'),
                    storedEnvelope:JSON.parse(localStorage.getItem('hexagons.public-view.v1')),url:location.href,maxPoseDelta:delta,matched:delta<0.1});})()""" % json.dumps(persistence['expected'])))
            override_setup = json.loads(await cdp.js("""(()=>{const v=window.pistonViewer;
                v.camera.position.x+=111;v.viewState.commitViewChange();const explicitUrl=location.href;
                const expected={camera:{x:v.camera.position.x,y:v.camera.position.y,z:v.camera.position.z},target:{x:v.controls.target.x,y:v.controls.target.y,z:v.controls.target.z}};
                v.camera.position.x+=222;v.viewState.commitViewChange();const conflictingStoredUrl=location.href;
                history.replaceState(null,'',explicitUrl);return JSON.stringify({explicitUrl,conflictingStoredUrl,expected});})()"""))
            await cdp.call('Page.reload', {'ignoreCache': True})
            for _ in range(240):
                state = await cdp.js("JSON.stringify({ready:!!window.pistonViewer?.loaderHidden,stored:!!localStorage.getItem('hexagons.public-view.v1'),url:location.href})")
                if state and json.loads(state)['ready']: break
                await asyncio.sleep(.25)
            shared_override = json.loads(await cdp.js("""(()=>{const v=window.pistonViewer,e=%s;
                const delta=Math.max(Math.abs(v.camera.position.x-e.camera.x),Math.abs(v.camera.position.y-e.camera.y),Math.abs(v.camera.position.z-e.camera.z),Math.abs(v.controls.target.x-e.target.x),Math.abs(v.controls.target.y-e.target.y),Math.abs(v.controls.target.z-e.target.z));
                return JSON.stringify({ready:!!v.loaderHidden,url:location.href,maxPoseDelta:delta,matched:delta<0.1});})()""" % json.dumps(override_setup['expected'])))
            fatal_retry = json.loads(await cdp.js("""(async()=>{const v=window.pistonViewer,button=document.querySelector('#fatal-retry-btn');
                v._showFatalState('init',new Error('AA-13 retry control gate'));const visibleBefore=!button.hidden&&button.getBoundingClientRect().width>0;
                button.click();const clearedImmediately=v.fatalState===null,hiddenImmediately=button.hidden;
                await new Promise(requestAnimationFrame);return JSON.stringify({visibleBefore,clearedImmediately,hiddenImmediately,
                    lifecycle:v.appLifecycle?.state||null,passed:visibleBefore&&clearedImmediately&&hiddenImmediately});})()"""))
            for _ in range(360):
                if await cdp.js('Boolean(window.pistonViewer?.loaderHidden)'): break
                await asyncio.sleep(.25)
            else: raise RuntimeError('fatal Retry did not return the viewer to ready')
            controls['actions'].append({'name':'fatal-retry-btn','passed':fatal_retry['passed'],'detail':fatal_retry})
            controls['allPassed'] = all(row.get('passed') is True for row in controls['actions']) and not controls['uncovered']
            controls['fatalRetry'] = fatal_retry
            persistence['localRestore'] = local_restore
            persistence['sharedUrlOverride'] = shared_override
            persistence['sharedExplicitUrl'] = override_setup['explicitUrl']
            persistence['conflictingStoredUrl'] = override_setup['conflictingStoredUrl']
            report = {'reducedMotion':reduced, 'search':search, 'controls':controls, 'hud':hud, 'navigation':navigation, 'persistence':persistence, 'reload':json.loads(state)}
            axe = Path('frontend/app/node_modules/axe-core/axe.min.js').read_text()
            await cdp.js(axe, False)
            report['axe'] = json.loads(await cdp.js("axe.run(document).then(r=>JSON.stringify({seriousCritical:r.violations.filter(v=>['serious','critical'].includes(v.impact)).map(v=>v.id),violations:r.violations.length}))"))
            report['checks'] = evaluate(report)
            report['passed'] = all(row['passed'] for row in report['checks'])
            Path(output).write_text(json.dumps(report, indent=2)); print(json.dumps(report, indent=2))
            if not report['passed']:
                raise RuntimeError('UX acceptance failure: '+json.dumps(report))
    finally:
        try: os.killpg(proc.pid, signal.SIGTERM)
        except ProcessLookupError: pass
        try: proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            try: os.killpg(proc.pid, signal.SIGKILL)
            except ProcessLookupError: pass
            proc.wait(timeout=5)
        shutil.rmtree(profile, ignore_errors=True)

if __name__ == '__main__': asyncio.run(main(sys.argv[1], sys.argv[2]))
