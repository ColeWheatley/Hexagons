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

Scenario paths (`traverse`, `stress`) derive their extents from `viewer.manifest.bounds` and
`viewer.manifest.tiles` at runtime rather than hardcoding coordinates, so they work for any bake
size. **Caveat for this repo's current dev dataset**: `tile_manifest.json` lists 257 registered
sectors spanning a large irregular area, but only 32 of them (a dense 4×8 block near Stubai,
q77–80/r248–255) currently have `.bin`/`.webp` files on disk in this worktree — the rest 404
silently. `traverse`'s lawnmower path covers the full registered extent per spec, so a
significant fraction of its ~90s will pass over registered-but-unbaked sectors with nothing to
load (idle, not a bug). `stress`'s jump locations are sampled from `manifest.tiles` (real
registered sector centers, always including the viewer's actual startup location) rather than
raw bounding-box corners, which biases it toward sectors more likely to have real data. Since
both the baseline (this branch) and candidate (KTX2 branch) runs read the *same* manifest and
tile data, this doesn't bias an A/B comparison — it just means the absolute "cache churn" numbers
for `traverse` are diluted versus a fully-dense bake, so weight `stress` more heavily when judging
absolute severity.
