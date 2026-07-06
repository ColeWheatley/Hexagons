# Performance Profiling & Benchmark Harness

Tools for proving — with numbers — whether a change to the tile/texture pipeline
eliminates OOM crashes and reduces frame drops in the Hexagons viewer.

Three new files, all additive (see "Design notes" below for why):

- `frontend/app/perf_profiler.js` — `PerfProfiler` class. Tracks frame timing (rendered vs.
  idle), 1Hz memory/VRAM/cache samples, WebGL context-loss + `gl.getError()` OOM sentinels,
  and crash-resilient localStorage persistence.
- `frontend/app/benchmark.js` — deterministic scripted camera scenarios (`orbit`, `traverse`,
  `stress`) driven by URL param, for reproducible A/B runs.
- `scripts/compare_perf.py` — stdlib-only CLI that diffs two reports and prints a verdict.

## IMPORTANT: the tab must be genuinely visible/foregrounded

Everything in this harness — the app's own render loop, `PerfProfiler.frame()`, and
`benchmark.js`'s scenario driver — rides on `requestAnimationFrame`. Chrome fully suspends
`requestAnimationFrame` for a page whose `document.visibilityState !== 'visible'`, regardless of
whether the tab has JS-level "focus" (`document.hasFocus()` can be `true` while
`visibilityState` stays `'hidden'` — they are independent signals; only visibility gates rAF).
When this happens, `requestAnimationFrame` callbacks stop firing entirely — not slow down, stop
— for as long as the page stays occluded/backgrounded, then resume once it's actually painted
on screen again.

**This is not cosmetic.** If you drive the app through a browser-automation path that never
gives the tab a real, on-screen, composited paint (headless-style extension control, a window
manager that keeps it behind other windows, a remote/virtual display with no visible surface,
etc.), tile loading silently stalls forever (tiles finish fetching and sit in
`instantiateQueue`, never instantiated — `processInstantiationQueue()` is rAF-gated too), and any
scenario you start will appear to hang. Because `benchmark.js`'s scenarios check elapsed
wall-clock time (`performance.now()`) rather than counting rendered frames, a stalled scenario
does NOT throw or hang forever — the moment the tab is ever repainted again (even hours later),
it immediately fast-forwards to "done" and emits a `[PERF_REPORT]` built almost entirely from
padding: a handful of real frames, most with frametimes in the tens-to-hundreds-of-**seconds**
range (a frozen `rAF` gap masquerading as one giant "frame"), and near-zero tile/VRAM samples.
**That report is not a valid perf measurement — it's an artifact of the tab never actually
rendering.** Do not save or compare a report whose `frames.total` is in the single digits or
whose `worst_ms` is absurdly large (seconds, not milliseconds) — treat it as "the capture
environment was invalid," not as real data.

How to tell you've hit this: `document.hidden === true` / `document.visibilityState ===
'hidden'` in the page's console, `pistonViewer.profiler.frames.total` not increasing over real
wall-clock seconds, and `pistonViewer.tiles.size` stuck at 0 while `pistonViewer.instantiateQueue`
has entries.

**The fix is environmental, not code**: run the scenario in a real Chrome window that is
actually visible on screen (a normal interactive browser tab you can see is enough — it doesn't
need to be the OS-focused window on most systems, but it does need to not be minimized,
occluded by a virtualization layer, or driven through a path that never composites it). This is
why this branch's own baseline capture is marked **pending** below rather than filled in with
numbers from a broken run.

## Running a scenario

1. Serve the app from the repo root (any static server works; the app has no build step):
   ```bash
   npx http-server frontend/app -p 8124 -c-1
   ```
2. Open one of:
   - `http://localhost:8124/?bench=orbit` (~60s — settle, tilt into 3D, slow 360° orbit at ~2km)
   - `http://localhost:8124/?bench=traverse` (~90s — lawnmower pan across the whole manifest area)
   - `http://localhost:8124/?bench=stress` (~120s — jump → zoom 15km→300m → orbit → zoom out,
     repeated across several locations; this is the historical OOM reproducer)
3. Wait for the scenario to finish. A small HUD banner at the top of the page shows the
   scenario name, elapsed time, and progress. On completion the browser will:
   - download a `perf_<pipeline>_<scenario>_<timestamp>.json` file automatically, and
   - print a `[PERF_REPORT] {...}` line to the console (grep-able by automation).

No URL param → `initBenchmark()` no-ops immediately; the profiler still runs (it's always
attached — `this.profiler = new PerfProfiler(this)` — so ad-hoc/manual sessions are profiled
too), you just drive the camera yourself.

### Manual / ad-hoc profiling (no scripted scenario)

Open the app normally (no `?bench=` param), interact with it, then in the console:
```js
pistonViewer.profiler.getReport()          // current snapshot, JSON
pistonViewer.profiler.downloadReport()      // download it as a .json file
pistonViewer.profiler.finalize({ scenario: 'manual' })  // mark finished + log [PERF_REPORT]
```

## Reading a report

Top-level shape (see `PerfProfiler.getReport()` for the authoritative source):

```
meta      — scenario, texturePipeline ('webp'|'ktx2', auto-detected from window.pistonViewer.texStats),
            appVersion, timestamp, duration_s, crashed, finished, runId
frames    — total/rendered/skipped rAF ticks; fps_avg_active; p50/p95/p99/worst frametime;
            over20/33/100 stutter counts; perState breakdown (MOVING_2D/MOVING_3D/SINTERING/STATIC)
memory    — jsHeapPeakBytes/jsHeapEndBytes (Chrome performance.memory), contextLostCount,
            glOutOfMemoryCount
vram      — peakLedgerBytes/endLedgerBytes (VRAMLedger totals), budgetBytes, peakUtilization
cache     — evictions, evictedBytes, redownloads (CacheManager — redownloads = cache thrash)
textures  — upgrades, texStats (passthrough of window.pistonViewer.texStats if the running
            branch defines it, else null)
samples   — one entry per second: jsHeap, renderInfo (renderer.info fields), vram, tiles
            (queue depths), cache, texStats, glOutOfMemoryCount — a time series for charting
```

**Important measurement quirk**: `animate()`'s render loop early-returns before rendering when
idle (`if (!moved && !this.needsRender) return;`), but `requestAnimationFrame` still fires every
vsync regardless. The profiler is fed *before* that early-return, so it sees every rAF tick —
including idle ones with ~16ms deltas that are just heartbeats, not real frame cost. **All
percentiles/stutter-counts/fps are computed over "active" frames only** (`willRender === true`,
i.e. `moved || needsRender`, OR `engineState !== 'STATIC'`) — `frames.total` includes idle
frames, `frames.rendered`/`frames.skipped` tell you the split, but the timing stats deliberately
exclude idle time so it can't dilute the signal. When reading `samples[].renderInfo`, note that
`calls`/`triangles` reflect only the *most recent* `render()` call (three.js resets them each
call) — a live snapshot, not a cumulative session total. `memory.geometries`/`memory.textures`
in the same object ARE live cumulative GPU allocation counts.

## The A/B procedure

1. Capture a baseline on the old pipeline: run all three scenarios, save the downloaded JSONs
   under `perf_reports/baseline_<pipeline>_<scenario>.json`.
2. Switch to (or merge in) the new pipeline, capture the same three scenarios as
   `perf_reports/candidate_<pipeline>_<scenario>.json`.
3. Compare matching scenarios:
   ```bash
   python3 scripts/compare_perf.py perf_reports/baseline_webp_stress.json perf_reports/candidate_ktx2_stress.json
   ```
   This prints an aligned table (frame timing incl. per-state breakdown, memory/OOM, VRAM
   ledger, cache, textures) with deltas and a one-line plain-language verdict per section.
   Comparing two different scenarios prints a warning banner instead of silently misleading you.
4. A `crashed: true` run (tab died mid-benchmark) is handled explicitly — see below. Diffing a
   crashed baseline against a clean candidate is treated as a headline result ("baseline crashed
   before finishing; candidate completed cleanly"), not an error condition.

The `stress` scenario is the most aggressive (repeated zoom 15km→300m cycles force full-res
texture upgrades + eviction pressure at multiple locations) — it's the one most likely to
reproduce the historical OOM crash, so weight it heaviest when judging pass/fail.

## Baseline capture status (this branch, webp pipeline): PENDING

The harness itself is built, committed, and verified working end to end — but a valid real-time
`perf_reports/baseline_webp_*.json` capture could **not** be completed in this session, for the
environmental reason documented above (the `claude-in-chrome` MCP browser tool never gave the
tab a genuinely visible/composited paint, so `requestAnimationFrame` — and therefore the whole
app, the profiler, and the benchmark driver — stayed frozen).

What was verified, concretely:
- `frontend/app/index.html` served correctly from `npx http-server frontend/app -p 8125 -c-1`
  (port 8124 was occupied by an unrelated stray process from a different project on this
  machine; 8125 was free — use whatever's free on your machine, the harness doesn't care).
- The app, `perf_profiler.js`, and `benchmark.js` all load with no syntax/import errors —
  `[HEXAGONS] v0.8.0 — loading...` and `[BENCHMARK] Scenario "traverse" queued — waiting for the
  viewer's initial tile load...` both logged correctly.
- The real tile pipeline works: all sectors in the actually-baked cluster near Stubai
  (q77–80/r248–255) fetched successfully (`fetch('tiles_bin/sector_77_251.bin')` → 200, 345584
  bytes) and 13/13 candidate tiles landed in `instantiateQueue` — confirmed via direct
  `pistonViewer.*` introspection over `javascript_tool`, not just console logs.
- The crash-resilience persistence mechanism fired correctly and produced a well-formed
  (if data-sparse, for the reason above) `localStorage['hexagons:perfProfiler:lastRun']` entry
  with `meta.finished: false` while the run was in progress.
- `scripts/compare_perf.py` was validated against hand-built synthetic reports (a crashed-webp
  vs. clean-ktx2 pair, plus a degenerate/all-zero pair) and produces correct aligned tables,
  deltas, and verdicts in all three cases, including the "one run is `crashed: true`" headline
  path.

What's missing: real `perf_reports/baseline_webp_orbit.json` / `_traverse.json` / `_stress.json`
files with genuine frame/memory/VRAM data. **To produce them**, run the exact commands in
"Running a scenario" above from a real, visible, interactive Chrome window (not headless
automation) — it's a ~5 minute manual task (60+90+120s of scenario time plus load waits) and the
`.json` files will auto-download; move them into `perf_reports/` and commit them. If a browser
automation tool is used instead, verify `document.visibilityState === 'visible'` in that tab
before trusting any report it produces.

## Crash recovery (the OOM evidence mechanism)

Every ~2 seconds (tied to `animate()`'s rAF cadence, so it costs nothing extra), `PerfProfiler`
serializes the run-so-far — meta + frame stats + samples — to
`localStorage['hexagons:perfProfiler:lastRun']`, with `meta.finished: false`. If the tab
OOM-crashes (context lost, tab killed by the browser, hard hang), that partial record survives
because it was written well before the crash, not at the end.

On the *next* page load, `PerfProfiler`'s constructor checks that localStorage key **before**
overwriting it with the new run. If it finds an entry with `finished: false`, it:
- logs `[PERF_RECOVERY] Found an unfinalized perf run from a previous session ...` to the console, and
- makes it available via `pistonViewer.profiler.recoverLastRun()`, with `meta.crashed` forced
  to `true` (an unfinalized run is definitionally either a crash or an abandoned session — for
  benchmarking purposes we treat both as "did not complete cleanly").

To capture a crash as evidence:
```js
// After reloading the crashed tab:
const crashed = pistonViewer.profiler.recoverLastRun();
copy(JSON.stringify(crashed, null, 2));   // Chrome devtools: copies to clipboard
// or:
pistonViewer.profiler.downloadReport(crashed);
```
Save that JSON as your baseline/candidate report — a `crashed: true` file is exactly as
meaningful to `compare_perf.py` as a clean one; it just means the run didn't reach its scenario's
full duration.

`webglcontextlost` on the renderer's canvas triggers an immediate out-of-band persist (don't
wait for the 2s timer) and increments `memory.contextLostCount`. `gl.getError()` is polled only
in the 1Hz sampler, never per-frame (`getError()` is a synchronous GPU round-trip that also
clears the error state, so calling it inside `animate()` would both hurt performance and race
the renderer's own error handling) — `OUT_OF_MEMORY` (0x0505) hits increment
`memory.glOutOfMemoryCount`.

## Design notes / merge safety

This harness was built on a branch where `frontend/app/main.js` is being modified in parallel
by another agent (swapping the webp texture pipeline for compressed KTX2). To keep that merge
trivial, all new logic lives in the two new files above; `main.js` has exactly four small hunks:

1. Two import lines (`PerfProfiler`, `initBenchmark`).
2. One constructor line: `this.profiler = new PerfProfiler(this);`
3. One line in `animate()`, immediately before the idle early-return:
   `this.profiler?.frame(now, this.engineState, moved || this.needsRender);`
4. One line after `new PistonViewer();`: `initBenchmark(window.pistonViewer, APP_VERSION);`

`tile_worker.js`, `cache_manager.js`, `vram_ledger.js`, and `hex_backend/**` are untouched.
`window.pistonViewer.texStats` (the KTX2 branch's transcode telemetry) is read defensively
(`v?.texStats`) everywhere — the profiler and benchmark harness work identically whether or not
that field exists, which is how `texturePipeline` auto-detects `'ktx2'` vs `'webp'`.

Scenario paths (`traverse`, `stress`) derive their extents from `viewer.manifest.tiles` at
runtime rather than hardcoding coordinates, so they work for any bake size. **Discovered quirk in
this repo's current dev dataset**: `tile_manifest.json`'s own `bounds` field spans a raw
51.5km×38.4km box, but that's almost entirely dragged out by 3 far-flung stray sectors (a
leftover single-tile test area near q121–123) — the real registered ski-area polygon is only
~12km×12km, of which a dense 4×8 block near Stubai (q77–80/r248–255) currently has `.bin`/`.webp`
files on disk in this worktree; the rest 404 silently (registered but not yet baked in this
sandbox). Using raw `manifest.bounds` verbatim for `traverse`'s lawnmower path would have spent
most of its ~90s flying over that 3x-oversized empty box. `computeLocalBounds()` in
`benchmark.js` instead trims to the 2nd–98th percentile of actual tile x/y positions, which
drops the 3 outlier sectors and recovers the true ~12km×12km extent — verified against this
manifest (`python3` sanity check: raw span 51513×38406m vs. trimmed span 12288×12288m). This is
a general-purpose fix (robust to a handful of outlier sectors in any manifest), not a hardcoded
value for this dataset. `stress`'s jump locations are separately sampled from `manifest.tiles`
sorted by position (real registered sector centers, always including the viewer's actual startup
location), which also naturally avoids the extreme outliers. Since baseline and candidate runs
read the *same* manifest/tile data, none of this biases an A/B comparison either way — it only
affects how representative the absolute numbers are of a "real" traversal.
