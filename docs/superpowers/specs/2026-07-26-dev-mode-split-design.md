# Dev mode / consumer mode split — design

Date: 2026-07-26. Branch: `worktree-dev-mode-split`. Author: Claude (free-rein
session; Cole set the goal and left: "bifurcate into dev/non dev mode and
improve both where you can").

## Problem

The frontend ships one UI: the consumer-facing viewer (loading screen, search,
compass/scale overlay, slope legend) is permanently fused to the developer HUD
(FPS/zoom readout, triangle/draw stats, sector/hex readouts, LOD tuning
sliders, LOD pause, frametime graph canvas, in-app status console, and the
floating texture-tier badge). `PistonViewer` in `main.js` owns all of it
directly — ~20 `getElementById` handles and half a dozen per-frame HUD update
methods interleaved with engine code. Every consumer session pays for dev
telemetry DOM work each rendered frame.

There is already a related-but-different axis: `release_mode.js` resolves the
*release lane* (beta vs production) from the manifest and gates the
`PerfProfiler`. That is a data/coverage decision, not a UI decision, and it
stays untouched in spirit: **release mode says what the app is; dev mode says
what the operator sees.**

## Goal

One toggle. Consumer mode shows a clean product UI. Dev mode layers the whole
developer HUD on top, rebuilt as modules that live in `frontend/app/dev/`.
Improve both sides: consumer loses per-frame HUD overhead; dev gains a perf
panel, a better frametime graph, and an in-app benchmark launcher.

## The toggle

Single boolean, resolved by pure logic in `dev/dev_mode_policy.mjs`:

1. URL param `?dev=1|true|on` → ON (and persisted); `?dev=0|false|off` → OFF
   (and persisted).
2. Otherwise `localStorage['hexagons:devMode'] === '1'` → ON.
3. Default OFF.

Runtime toggle: **Backquote (`)** keydown (no modifiers, ignored when focus is
in an input/textarea/contenteditable — the search box exists). Toggling ON
live-attaches the dev layer (dynamic `import()`); toggling OFF calls
`devTools.dispose()` which removes all dev DOM/listeners/intervals. State
persists to localStorage either way. `?bench=` does *not* imply dev mode; the
benchmark HUD remains self-contained.

In the dist bundle (esbuild IIFE) the dynamic import is inlined — the gate is
runtime, not build-time. That is fine: dev JS is small next to the Basis WASM,
and a single bundle keeps `build.mjs` untouched.

## Module layout

```
frontend/app/
  main.js                 engine only — no HUD DOM except consumer controls
  release_mode.js         + devMode input to profilerPolicy (telemetry only)
  perf_profiler.js        unchanged (engine telemetry, not UI)
  texture_hud_telemetry.js unchanged location (engine milestones depend on it)
  dev/
    dev_entry.js          tiny always-imported gate: policy + hotkey + lazy attach
    dev_mode_policy.mjs   pure: resolveDevMode(), isDevToggleKey() — unit tested
    dev_tools.js          DevTools class: attach/dispose, cadences, profiler ensure
    dev_panel.js          builds all dev HUD DOM inside #main-panel-body
    frametime_graph.js    upgraded graph (state-colored, p50/p95/p99 overlay)
    tex_badge.js          floating texture-tier badge (extracted)
    bench_panel.js        benchmark launcher + last-report summary
    dev_styles.js         CSS string for NEW dev widgets, injected on attach
    benchmark.js          moved from frontend/app/benchmark.js (import updated)
```

## Engine ⇄ dev seam (the contract)

`main.js` knows only this:

```js
viewer.devTools = null | {
  onFrame(now, willRender),  // every animate() tick, after engineState is
                             // derived, next to profiler.frame() — before the
                             // idle early-return
  onLog(entry),              // entry = { t, msg, type }
  onTextureActivity(),       // called from the old _updateTexBadge call sites
  syncControls(),            // after applyPublicSettings() and after initWorld
                             // resolves releaseMode/isMiniBake
  dispose(),
}
viewer.logBuffer   // engine-owned ring, cap 400 entries {t, msg, type};
                   // log() pushes here + devTools?.onLog — no DOM, ever
viewer.readouts    // engine-written plain strings: sector, hex, world,
                   // tileHeight, cameraHeight, nearLodBands, farLodBands,
                   // movingLodSummary, settledLodSummary
```

Everything else the dev layer reads directly off the viewer at its own cadence
(`engineState`, `camera`, `controls`, `renderer.info`, `getDetailedStats()`,
`texStats`, `workerLaneStats`, `failureStats`, queue lengths, `cacheManager`,
`vramLedger`, `profiler`, `isMiniBake`, `settledLodRadii`, `movingLevel`).

### What moves out of main.js

Deleted from the engine and rebuilt in `dev/`: `updateFps` + `fpsState`,
`updateRenderStats` (TOPS/SKIRTS tile walk), `updateRendererDebugStats`,
`updateFrametimeGraph` + frametime canvas/buffer fields, `_updateTexBadge`'s
rendering half + badge fields, `initDebugConsole`/`initCopyLogButton` (log
ring replaces DOM console), `initCollapsibleSections`, `initLODSliders`'s
haze/texture-slider and LOD-pause bindings, the `#haze-distance-control`
mini-bake hiding line in `initWorld`, `_setHudText`/`_hudEls` caching (the
sector/hex/height call sites in `maintainCameraAltitudeDuringAnimation` and
`initLodTruthLabels` write `viewer.readouts` fields instead — plain string
assignment, no DOM).

### What stays in the engine (correctness traps)

- **Texture milestones.** `_updateTexBadge` currently mixes badge rendering
  with engine logic: `_finishTextureBootstrapPhase()`, the `firstTexture` /
  `visibleTexturedCoverage` profiler milestones. Split into
  `_updateTextureMilestones()` which stays at the same call sites and MUST run
  in consumer mode. Once `_textureMilestonesDone` and the bootstrap phase are
  both finished it early-returns, so consumer mode stops paying for the
  page-collection walk entirely (today it runs + JSON signature every rendered
  frame, forever — a real consumer win).
- **Consumer controls**: `initMinimizeButton`, the gradient terrain/slope
  toggle binding (extracted from `initLODSliders` into a small
  `initConsumerControls`), `applyPublicSettings` (updates engine fields +
  gradient DOM, then `devTools?.syncControls()`).
- `log()` (ring push + forward), `installGlobalBackstop`, engine state
  machine, `[PERF_VIOLATION]` console logging, profiler creation via
  release mode, `writeClipboardText`/`execCommandCopyText` (used by
  view_state and the dev console copy).

## Consumer shell (index.html)

Keeps: loader, `#ui` > `#main-panel` (header: title/subtitle/`#minimize-btn`;
body: gradient pill toggle, `#copy-view-link` "share view" row), navigation
overlay, legend, `#canvas-container`. Panel starts minimized as today. All
dev markup (stats rows, both collapsibles, sliders, frametime canvas, console
panel) leaves the HTML; `dev_panel.js` injects it into `#main-panel-body`
above the gradient row, **preserving today's element IDs and classes
exactly** (`fps-counter`, `hex-count`, `tri-count`, `draw-stats`,
`sector-val`, `hex-val`, `world-val`, `tile-height`, `camera-height`,
`near-lod-bands`, `far-lod-bands`, `moving-lod-summary`,
`settled-lod-summary`, `haze-distance-control/-slider/-val`,
`tex-upgrade-slider/-val`, `lod-pause-toggle`, `debug-content`,
`geometry-content`, `.collapsible-section/-header/-content`,
`console-output`, `copy-log-btn`, `frametime-graph`, `tex-debug-badge`).

**Why IDs are pinned:** `scripts/run_ux_browser_gate.py` +
`validate_ux_browser_gate.py` (release gates) drive and assert this exact DOM.
The gate exercises the dev HUD, so `run_ux_browser_gate.py` gains one change:
append `dev=1` to the app URL it navigates (defensively, if absent). No
validator changes — extra disclosures (the new sections) are recorded but not
required. No other gate script touches HUD DOM (verified by grep).

## Dev panel content (parity + build-out)

Injected sections, top to bottom in `#main-panel-body`:

1. **Always-visible stats block** (parity): `fps-counter` (FPS/IDLE + zoom),
   `hex-count` (TOPS/SKIRTS, same format — gate asserts "TOPS").
2. **PERF** (new collapsible, `perf-content`): engine-state chip colored by
   state; rolling frame-time p50/p95/p99/worst over the last ~300 active
   frames (computed in dev_tools from onFrame deltas); JS heap (if
   `performance.memory`); VRAM ledger used/budget with utilization bar;
   cache evictions/redownloads; worker lanes (geometry/texture:
   workers/dispatched/completed) and queue depths (load, texture, result,
   rebuild, instantiate); failureStats summary line (only non-zero fields).
   Polled at 2 Hz while expanded, via `getDetailedStats()`.
3. **POSITION & DEBUG** (parity, `debug-content`): tri-count, draw-stats,
   sector/hex/world, tile/camera height — rendered from `viewer.readouts`
   with per-field string diffing (the old `_setHudText` behavior, now
   dev-side).
4. **GRANULAR LOD TUNING** (parity, `geometry-content`): haze slider
   (hidden when `viewer.isMiniBake`), pink-texture-range slider, LOD band
   truth labels. Sliders write viewer fields exactly as today and call
   `viewer.viewState?.commitSettingsChange()`; initial values read from the
   viewer on attach and on `syncControls()`.
5. **BENCHMARKS** (new collapsible, `bench-content`): one button per scenario
   (coldload / orbit / traverse / stress / capability) + duration override
   input; launching navigates to the current URL with
   `bench=<name>[&benchDuration=<n>]` and `dev=1` preserved (page reload =
   deterministic start). "Download current report" calls
   `viewer.profiler?.downloadReport()`. Last-run summary (scenario, fps_avg,
   p95, finished/crashed, age) parsed from
   `localStorage['hexagons:perfProfiler:lastRun']`, with a download button
   and a crashed-run recovery notice when `meta.finished === false`.
6. **LOD pause row** (parity) + **frametime graph** (upgraded): ring buffer,
   bars colored by engine state at sample time (STATIC ticks excluded as
   today — graph only advances on rendered frames), 60/30 fps gridlines,
   live p50/p95 text overlay, devicePixelRatio-aware sizing.
7. **STATUS LOG** (parity): renders `viewer.logBuffer` backfill on attach,
   appends via `onLog`; COPY reads the buffer, not the DOM.

Floating tex badge (`dev/tex_badge.js`): same visuals/IDs, refreshed on
`onTextureActivity()` and at 4 Hz while the loader is visible.

## Profiler in dev mode

`profilerPolicy(profile, search, devMode)` gains the third input: bench →
`full` (unchanged); else devMode → `bounded-recovery`; else per-profile
default. `resolveReleaseMode(manifestRelease, search, { devMode })` threads it
through; `main.js` passes the flag from `dev_entry`. The release_mode header
comment is updated: bench and dev-mode are the only runtime overrides, both
change telemetry only, never coverage. Hot-toggling dev ON after initWorld:
`DevTools.attach()` ensures `viewer.profiler ??= new PerfProfiler(viewer,
{ mode: 'bounded-recovery' })` once `viewer.releaseMode` exists (checked on
attach + its 1 Hz tick). Hot-toggle OFF leaves the profiler running
(bounded, harmless).

## Styles

Existing rules stay in `style.css` (they are inert without dev DOM; keeps the
diff reviewable and the consumer visual identical). Styles for genuinely new
widgets (PERF section internals, bench section, state chip, graph overlay)
ship as a CSS string in `dev_styles.js`, injected as `<style id="dev-styles">`
on attach, removed on dispose. Inline styles that today live on dev markup in
index.html move with the markup into `dev_panel.js` verbatim.

## Tests & verification

- New `test/dev_mode_policy.test.mjs` (node --test): URL/localStorage
  precedence table, hotkey matcher incl. input-focus guard.
- Existing 45 tests must stay green (none import the moved code — verified).
- `node build.mjs` must pass (its `node --check` walk covers the bundle).
- Headless smoke (Playwright/CDP against a local static server): default URL
  → no dev IDs present, panel shows gradient + share only; `?dev=1` → all
  pinned IDs present, frametime canvas painting, console backfilled;
  backquote toggles live. Screenshots of both modes.
- `run_ux_browser_gate.py` unchanged in spirit; runs with `dev=1` appended.

## Implementation plan (subagent split)

- **Agent A (engine)**: main.js extraction + seams, index.html slimming,
  release_mode.js change, `git mv`-style benchmark.js relocation with import
  update, gate-script `dev=1` append. Definition of done: `node --check`
  passes on touched JS; no dev DOM references left in main.js.
- **Agent B (dev layer)**: everything under `dev/` except benchmark.js, plus
  the policy test. Written against the seam contract above; must not touch
  main.js/index.html.
- A and B run in parallel on disjoint files; integrator (main session) wires
  leftovers, runs tests/build/smoke, fixes, commits. Agents do not run git
  commands; commits happen at integration checkpoints.

## Explicitly out of scope

Service-worker changes, build.mjs changes, moving `perf_profiler.js` or
`texture_hud_telemetry.js`, redesigning the consumer visual identity, search
UI changes, release-lane semantics.
