// @atlas: 'Benchmark' — deterministic scripted camera scenarios for perf A/B testing.
// Activated via URL param ?bench=<orbit|traverse|stress>. Drives PistonViewer's camera/target
// directly from elapsed wall-clock time (fixed keyframes, framerate-independent) through the same
// fields a real user interaction would touch (camera.position, controls.target, needsRender,
// needsLODUpdate), so LOD/cache/texture-upgrade systems react exactly as they would to a human.
//
// This file does not import from main.js. main.js only needs one line after `new PistonViewer()`:
//   initBenchmark(window.pistonViewer, APP_VERSION);
// If ?bench= is absent, initBenchmark() is a no-op (URLSearchParams check returns immediately).

const SCENARIO_GROUND_MARGIN = 80; // meters of clearance above the local terrain ceiling

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp01(t) { return Math.max(0, Math.min(1, t)); }
function clampNum(v, min, max) { return Math.max(min, Math.min(max, v)); }
function easeInOut(t) { const c = clamp01(t); return c * c * (3 - 2 * c); } // smoothstep

/** Spherical -> Cartesian around `target`. phi measured from +Y (0 = straight overhead). */
function sphericalPosition(target, radius, theta, phi) {
    return {
        x: target.x + radius * Math.sin(phi) * Math.sin(theta),
        y: target.y + radius * Math.cos(phi),
        z: target.z + radius * Math.sin(phi) * Math.cos(theta),
    };
}

/** Inverse of sphericalPosition — used once at scenario start to anchor on the viewer's
 * actual initial camera pose instead of a hardcoded angle. */
function cartesianToSpherical(pos, target) {
    const dx = pos.x - target.x, dy = pos.y - target.y, dz = pos.z - target.z;
    const radius = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const phi = radius > 1e-6 ? Math.acos(clampNum(dy / radius, -1, 1)) : 0;
    const theta = Math.atan2(dx, dz);
    return { radius, phi, theta };
}

function percentile(sortedAsc, p) {
    const idx = Math.min(sortedAsc.length - 1, Math.max(0, Math.floor(p * sortedAsc.length)));
    return sortedAsc[idx];
}

/** Local (viewer) coordinate extents derived from the manifest — see main.js's initWorld():
 * lx = x - min_x, lz = -(y - min_y). Works for any bake size/shape.
 *
 * Uses the 2nd/98th percentile of actual tile positions rather than raw manifest.bounds
 * min/max: a manifest can legitimately contain a handful of far-flung stray sectors (e.g. a
 * leftover single-tile test area) that blow up the naive bounding box far beyond the real
 * dense baked region without adding any useful path to traverse. Percentile-trimming is robust
 * to that without needing to know which sectors are "really" baked. */
function computeLocalBounds(manifest) {
    const b = manifest.bounds;
    const tiles = manifest?.tiles;
    if (!tiles || tiles.length < 20) {
        return { minX: 0, maxX: b.max_x - b.min_x, minZ: -(b.max_y - b.min_y), maxZ: 0 };
    }
    const xs = tiles.map((t) => t.x).sort((a, c) => a - c);
    const ys = tiles.map((t) => t.y).sort((a, c) => a - c);
    const minXWorld = percentile(xs, 0.02), maxXWorld = percentile(xs, 0.98);
    const minYWorld = percentile(ys, 0.02), maxYWorld = percentile(ys, 0.98);
    return {
        minX: minXWorld - b.min_x,
        maxX: maxXWorld - b.min_x,
        minZ: -(maxYWorld - b.min_y),
        maxZ: -(minYWorld - b.min_y),
    };
}

/** Local-space {x, z, hMax} for every manifest tile, built once per scenario run — the manifest
 * carries hMax per island (see generate_manifest.py) so this is known upfront for the WHOLE
 * bake, unlike currently-resident tiles which only cover whatever has streamed in so far. Used
 * by groundCeilingNear() to keep the camera from clipping into terrain that hasn't loaded yet. */
function buildHeightLookup(manifest) {
    const b = manifest?.bounds;
    const tiles = manifest?.tiles;
    if (!b || !tiles) return [];
    return tiles.filter((t) => Number.isFinite(t.hMax)).map((t) => ({
        x: t.x - b.min_x,
        z: -(t.y - b.min_y),
        hMax: t.hMax,
    }));
}

/** Max terrain hMax among manifest tiles within `radius` of (x,z) — the height ceiling the
 * camera must stay above at that location. Falls back to the global max (over the WHOLE
 * lookup) when nothing is within radius, so isolated/edge positions stay conservative rather
 * than unclamped. */
function groundCeilingNear(lookup, x, z, radius) {
    if (lookup.length === 0) return null;
    const r2 = radius * radius;
    let localMax = -Infinity, globalMax = -Infinity;
    for (const t of lookup) {
        if (t.hMax > globalMax) globalMax = t.hMax;
        const dx = t.x - x, dz = t.z - z;
        if (dx * dx + dz * dz <= r2 && t.hMax > localMax) localMax = t.hMax;
    }
    return localMax > -Infinity ? localMax : globalMax;
}

/** Jump targets for the `stress` scenario: the viewer's actual starting focus point (guaranteed
 * to be near real content) plus up to 4 points sampled across the registered manifest tiles
 * (sorted for determinism), spreading jumps across whatever area is actually baked — works
 * whether the manifest lists 32 tiles or 3000. */
function pickStressLocations(viewer) {
    const locs = [{ x: viewer.controls.target.x, z: viewer.controls.target.z }];
    const manifest = viewer.manifest;
    const tiles = manifest?.tiles;
    if (tiles && tiles.length > 4 && manifest.bounds) {
        const sorted = [...tiles].sort((a, b) => (a.x - b.x) || (a.y - b.y));
        const b = manifest.bounds;
        for (const frac of [0.15, 0.4, 0.6, 0.85]) {
            const idx = Math.min(sorted.length - 1, Math.floor(frac * (sorted.length - 1)));
            const tile = sorted[idx];
            locs.push({ x: tile.x - b.min_x, z: -(tile.y - b.min_y) });
        }
    }
    return locs;
}

// ─── Scenario keyframe functions ─────────────────────────────────────────
// Each returns { camPos: {x,y,z}, target: {x,y,z} } for elapsed time `t` (seconds).

/** ~60s: settle at start location -> tilt into 3D -> slow 360deg orbit at ~2km.
 * Exercises sintered rendering + texture-upgrade churn around a single point of interest. */
function orbitScenario(t, ctx) {
    const SETTLE = 5, TILT = 10;
    const TARGET_PHI = 1.2, TARGET_RADIUS = 2000;

    if (t < SETTLE) {
        return { camPos: ctx.startPos, target: ctx.pivot };
    }
    if (t < SETTLE + TILT) {
        const p = easeInOut((t - SETTLE) / TILT);
        return {
            camPos: sphericalPosition(ctx.pivot, lerp(ctx.initialRadius, TARGET_RADIUS, p), ctx.initialTheta, lerp(ctx.initialPhi, TARGET_PHI, p)),
            target: ctx.pivot,
        };
    }
    const orbitElapsed = t - SETTLE - TILT;
    const orbitDuration = Math.max(1, ctx.totalDuration - SETTLE - TILT);
    const theta = ctx.initialTheta + (orbitElapsed / orbitDuration) * Math.PI * 2;
    return { camPos: sphericalPosition(ctx.pivot, TARGET_RADIUS, theta, TARGET_PHI), target: ctx.pivot };
}

/** ~90s: lawnmower (boustrophedon) pan across the entire manifest extent at moderate altitude.
 * Exercises cache churn, evictions, and load-queue pressure as sectors stream in/out. */
function traverseScenario(t, ctx) {
    const { minX, maxX, minZ, maxZ } = ctx.localBounds;
    const rows = 6;
    const rowHeight = (maxZ - minZ) / rows;
    const p = clamp01(t / ctx.totalDuration);
    const rowFloat = p * rows;
    const row = Math.min(rows - 1, Math.floor(rowFloat));
    const rowT = clamp01(rowFloat - row);
    const z = minZ + rowHeight * (row + 0.5);
    const x = (row % 2 === 0) ? lerp(minX, maxX, rowT) : lerp(maxX, minX, rowT);
    const target = { x, y: 0, z };
    return { camPos: sphericalPosition(target, 1300, 0, 0.35), target };
}

/** ~120s: repeated cycles of jump -> zoom 15km->300m (forces full-res texture upgrades) ->
 * brief orbit -> zoom out -> next location. Maximal texture-upgrade + eviction pressure —
 * this is the historical OOM reproducer. */
function stressScenario(t, ctx) {
    const locations = ctx.locations;
    const n = locations.length;
    const cycleDur = ctx.totalDuration / n;
    const cycleIdx = Math.min(n - 1, Math.floor(t / cycleDur));
    const cycleT = clamp01((t - cycleIdx * cycleDur) / cycleDur);
    const loc = locations[cycleIdx];
    const target = { x: loc.x, y: 0, z: loc.z };

    const FAR_RADIUS = 15000, NEAR_RADIUS = 300;
    const PHI_FAR = 0.3, PHI_ORBIT = 1.0;
    let radius, phi, theta;

    if (cycleT < 0.05) {
        radius = FAR_RADIUS; phi = PHI_FAR; theta = 0;
    } else if (cycleT < 0.45) {
        const p = easeInOut((cycleT - 0.05) / 0.40);
        radius = lerp(FAR_RADIUS, NEAR_RADIUS, p);
        phi = lerp(PHI_FAR, PHI_ORBIT, p);
        theta = 0;
    } else if (cycleT < 0.75) {
        const p = (cycleT - 0.45) / 0.30;
        radius = NEAR_RADIUS; phi = PHI_ORBIT;
        theta = p * Math.PI * 1.5;
    } else {
        const p = easeInOut((cycleT - 0.75) / 0.25);
        radius = lerp(NEAR_RADIUS, FAR_RADIUS, p);
        phi = lerp(PHI_ORBIT, PHI_FAR, p);
        theta = Math.PI * 1.5;
    }
    return { camPos: sphericalPosition(target, radius, theta, phi), target };
}

const SCENARIOS = {
    coldload: { duration: 45, fn: null, holdStill: true },
    orbit: { duration: 60, fn: orbitScenario },
    traverse: { duration: 90, fn: traverseScenario },
    stress: { duration: 120, fn: stressScenario },
};

// ─── HUD ───────────────────────────────────────────────────────────────

function createHud() {
    const el = document.createElement('div');
    el.id = 'bench-hud';
    el.style.cssText = [
        'position:fixed', 'top:12px', 'left:50%', 'transform:translateX(-50%)',
        'background:rgba(10,10,10,0.75)', 'color:#fff',
        "font:12px/1.4 'Courier New',monospace",
        'padding:8px 16px', 'border-radius:8px', 'border:1px solid rgba(255,255,255,0.15)',
        'z-index:9999', 'pointer-events:none', 'text-align:center', 'white-space:pre',
    ].join(';');
    document.body.appendChild(el);
    return el;
}

function updateHud(el, name, elapsed, total, done = false) {
    if (!el) return;
    const pct = Math.min(100, (elapsed / total) * 100).toFixed(0);
    el.textContent = done
        ? `[BENCHMARK] ${name} — DONE (${total.toFixed(0)}s)`
        : `[BENCHMARK] ${name} — ${elapsed.toFixed(1)}s / ${total.toFixed(0)}s (${pct}%)`;
}

function resetMaterialChurn(viewer) {
    if (viewer.materialChurn) {
        for (const key of Object.keys(viewer.materialChurn)) viewer.materialChurn[key] = 0;
    }
}

function installTextureWarningTracker(viewer) {
    const original = console.warn;
    const wrapped = (...args) => {
        const message = args.map(value => String(value)).join(' ');
        if (/texture/i.test(message) && /(serializ|upload|incomplete)/i.test(message)) {
            if (viewer.materialChurn) viewer.materialChurn.textureSerializationWarnings++;
        }
        original.apply(console, args);
    };
    console.warn = wrapped;
    return () => {
        if (console.warn === wrapped) console.warn = original;
    };
}

// ─── Runner ────────────────────────────────────────────────────────────

function waitForReady(viewer, timeoutMs = 45000) {
    return new Promise((resolve, reject) => {
        const start = performance.now();
        const poll = () => {
            if (viewer.loaderHidden && viewer.manifest) return resolve();
            if (performance.now() - start > timeoutMs) {
                return reject(new Error('Timed out waiting for viewer readiness (loaderHidden/manifest never became available)'));
            }
            requestAnimationFrame(poll);
        };
        poll();
    });
}

function finishScenario(viewer, hud, name, duration, appVersion) {
    updateHud(hud, name, duration, duration, true);
    console.log(`[BENCHMARK] Scenario "${name}" complete.`);
    window.__HEXAGONS_MATERIAL_CHURN_BENCHMARK__ = { scenario: name, duration, counters: viewer.getMaterialChurnStats?.() || null };
    console.log('[MATERIAL_CHURN] ' + JSON.stringify(window.__HEXAGONS_MATERIAL_CHURN_BENCHMARK__));
    viewer._restoreMaterialWarningTracker?.();
    viewer._restoreMaterialWarningTracker = null;
    // The runtime contract is KTX2-only. Missing telemetry means the
    // pipeline has not produced a sample yet; it is not a WebP fallback.
    const texturePipeline = 'ktx2';
    if (viewer.profiler) {
        const report = viewer.profiler.finalize({
            scenario: name,
            texturePipeline,
            appVersion: appVersion || null,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
        });
        viewer.profiler.downloadReport(report);
    } else {
        console.error('[BENCHMARK] viewer.profiler not found — cannot finalize/download the perf report.');
    }
    setTimeout(() => hud?.remove(), 5000);
}

function runColdloadScenario(viewer, name, scenario, appVersion) {
    const hud = createHud();
    const t0 = performance.now();
    resetMaterialChurn(viewer);

    const poll = () => {
        const elapsed = (performance.now() - t0) / 1000;
        const covered = viewer.profiler?.milestones?.visibleTexturedCoverage !== undefined;
        if (covered || elapsed >= scenario.duration) {
            finishScenario(viewer, hud, name, scenario.duration, appVersion);
            return;
        }
        updateHud(hud, name, elapsed, scenario.duration);
        setTimeout(poll, 250);
    };

    console.log(`[BENCHMARK] Starting scenario "${name}" (${scenario.duration}s)...`);
    poll();
}

function runScenario(viewer, name, scenario, appVersion) {
    const hud = createHud();
    const startPos = viewer.camera.position.clone();
    const startTarget = viewer.controls.target.clone();
    const startSpherical = cartesianToSpherical(startPos, startTarget);

    const ctx = {
        startPos, startTarget,
        pivot: startTarget.clone(),
        initialTheta: startSpherical.theta,
        initialPhi: startSpherical.phi,
        initialRadius: startSpherical.radius,
        localBounds: computeLocalBounds(viewer.manifest),
        totalDuration: scenario.duration,
        heightLookup: buildHeightLookup(viewer.manifest),
    };
    if (name === 'stress') ctx.locations = pickStressLocations(viewer);

    const t0 = performance.now();
    resetMaterialChurn(viewer);

    const finish = () => finishScenario(viewer, hud, name, scenario.duration, appVersion);

    const tick = () => {
        const elapsed = (performance.now() - t0) / 1000;
        if (elapsed >= scenario.duration) { finish(); return; }

        const { camPos, target } = scenario.fn(elapsed, ctx);

        // Terrain-clip guard: scenarios pick camPos.y from a fixed spherical
        // radius/phi around a target whose OWN y is always 0 (a horizontal
        // reference, not real elevation — see main.js's controls.target
        // convention). That math has no idea how tall the terrain actually
        // is at the camera's XZ position, so a scenario tuned for one region
        // can put the camera under a peak elsewhere in the manifest (verified:
        // orbit's steady-state y ~724m and stress's near-zoom y ~162m both
        // sit below this bake's ~1000-1300m normalized terrain heights).
        // Clamp against the real height ceiling using the SAME (h - floorState)
        // normalization the renderer itself uses, worst-cased at heightFactor
        // 1.0 (full 3D) so the guard never under-clamps mid-tilt.
        const ceilH = groundCeilingNear(ctx.heightLookup, camPos.x, camPos.z, 1500);
        if (ceilH !== null) {
            const minY = (ceilH - viewer.floorState.value) * 1.0 + SCENARIO_GROUND_MARGIN;
            if (camPos.y < minY) camPos.y = minY;
        }

        viewer.camera.position.set(camPos.x, camPos.y, camPos.z);
        viewer.controls.target.set(target.x, target.y, target.z);
        // Enter the same synchronous motion edge as real controls before
        // either viewer rAF or a promise callback can run maintenance.
        viewer.notifyCameraMotion(performance.now());
        viewer.controls.update();
        viewer.needsRender = true;
        viewer.needsLODUpdate = true;

        updateHud(hud, name, elapsed, scenario.duration);
        requestAnimationFrame(tick);
    };

    console.log(`[BENCHMARK] Starting scenario "${name}" (${scenario.duration}s)...`);
    tick();
}

/**
 * Entry point — call once after the viewer is constructed:
 *   initBenchmark(window.pistonViewer, APP_VERSION)
 * No-ops unless the page URL has ?bench=<coldload|orbit|traverse|stress>.
 * ?bench=1 is a profiling-only opt-in: it enables a full profiler without
 * starting a scripted camera scenario.
 */
export function initBenchmark(viewer, appVersion) {
    const scenarioName = new URLSearchParams(window.location.search).get('bench');
    if (!scenarioName) return;
    if (scenarioName === '1') return;

    const scenario = SCENARIOS[scenarioName];
    if (!scenario) {
        console.error(`[BENCHMARK] Unknown scenario "${scenarioName}". Valid options: ${Object.keys(SCENARIOS).join(', ')}`);
        return;
    }

    console.log(`[BENCHMARK] Scenario "${scenarioName}" queued — waiting for the viewer's initial tile load...`);
    viewer._restoreMaterialWarningTracker = installTextureWarningTracker(viewer);
    waitForReady(viewer)
        .then(() => {
            if (scenario.holdStill) {
                runColdloadScenario(viewer, scenarioName, scenario, appVersion);
            } else {
                runScenario(viewer, scenarioName, scenario, appVersion);
            }
        })
        .catch((e) => {
            viewer._restoreMaterialWarningTracker?.();
            viewer._restoreMaterialWarningTracker = null;
            console.error('[BENCHMARK] ' + e.message);
        });
}
