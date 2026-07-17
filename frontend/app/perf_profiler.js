// @atlas: 'PerfProfiler' — standalone frame-time / memory / VRAM instrumentation for PistonViewer.
// Fed one call per rAF tick from main.js's animate() (before its idle early-return), plus a
// 1Hz sampler that reads renderer.info, performance.memory, getDetailedStats(), and (if present)
// the other branch's texStats. Full benchmark mode keeps the historical complete report. The
// Stubai-beta recovery mode keeps fixed-size rings and less-frequent snapshots so telemetry
// cannot grow with an exploratory session.
//
// This file is intentionally self-contained — it does not import from main.js, and main.js only
// needs to (a) import PerfProfiler, (b) construct `this.profiler = new PerfProfiler(this)`, and
// (c) call `this.profiler?.frame(now, this.engineState, willRender)` once per animate() tick.

const LS_KEY = 'hexagons:perfProfiler:lastRun';
const PERSIST_INTERVAL_MS = 2000;
const SAMPLE_INTERVAL_MS = 1000;
const ACTIVE_STATES = ['MOVING_2D', 'MOVING_3D', 'SINTERING', 'STATIC'];
export const BOUNDED_ACTIVE_FRAME_CAPACITY = 2048;
export const BOUNDED_SAMPLE_CAPACITY = 180;
export const BOUNDED_PERSIST_INTERVAL_MS = 30000;

class RingBuffer {
    constructor(capacity = Infinity) {
        this.capacity = capacity;
        this.values = capacity === Infinity ? [] : new Array(capacity);
        this.start = 0;
        this.length = 0;
    }

    push(value) {
        if (this.capacity === Infinity) {
            this.values.push(value);
            this.length = this.values.length;
            return;
        }
        const index = (this.start + this.length) % this.capacity;
        this.values[index] = value;
        if (this.length < this.capacity) {
            this.length++;
        } else {
            this.start = (this.start + 1) % this.capacity;
        }
    }

    toArray() {
        if (this.capacity === Infinity || this.length === 0) return this.values.slice();
        const out = new Array(this.length);
        for (let i = 0; i < this.length; i++) out[i] = this.values[(this.start + i) % this.capacity];
        return out;
    }
}

function percentile(sortedAsc, p) {
    const n = sortedAsc.length;
    if (n === 0) return 0;
    const idx = Math.min(n - 1, Math.max(0, Math.floor(p * n)));
    return sortedAsc[idx];
}

function round(n, dp = 2) {
    const f = 10 ** dp;
    return Math.round(n * f) / f;
}

export class PerfProfiler {
    /** @param {*} viewer - the PistonViewer instance (window.pistonViewer) */
    constructor(viewer, { mode = 'full' } = {}) {
        if (mode !== 'full' && mode !== 'bounded-recovery') {
            throw new Error(`Unsupported profiler mode ${mode}`);
        }
        this.viewer = viewer;
        this.mode = mode;
        this.isBounded = mode === 'bounded-recovery';
        this.startTime = performance.now();
        this.runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        // --- Frame tracking (fed by frame()) ---
        this.frames = { total: 0, rendered: 0, skipped: 0 };
        // Active frames only: array of {dt, state}. "Active" = willRender OR engineState !== STATIC.
        // (See main.js's idle early-return quirk: rAF fires every vsync even when idle, so idle
        // frame deltas are ~16ms heartbeats, not real render cost — they must be excluded from
        // percentiles/stutter counts or they drown out the signal.)
        this._active = new RingBuffer(this.isBounded ? BOUNDED_ACTIVE_FRAME_CAPACITY : Infinity);
        this._lastFrameTime = null;
        this._lastPersist = performance.now();
        this._persistIntervalMs = this.isBounded ? BOUNDED_PERSIST_INTERVAL_MS : PERSIST_INTERVAL_MS;

        // --- 1Hz sampler output ---
        this.samples = new RingBuffer(this.isBounded ? BOUNDED_SAMPLE_CAPACITY : Infinity);
        this.milestones = {};

        // --- Cumulative counters (also mirrored into samples for time-series) ---
        this.memory = { jsHeapPeakBytes: 0, jsHeapEndBytes: 0, contextLostCount: 0, glOutOfMemoryCount: 0 };
        this.vram = { peakLedgerBytes: 0, endLedgerBytes: 0, budgetBytes: 0, peakUtilization: 0 };
        this.cache = { evictions: 0, evictedBytes: 0, redownloads: 0 };
        this.textures = { upgrades: 0, texStats: null };

        this.meta = {
            scenario: null,
            texturePipeline: null,
            appVersion: null,
            timestamp: new Date().toISOString(),
            userAgent: (typeof navigator !== 'undefined' && navigator.userAgent) || 'unknown',
            duration_s: 0,
            crashed: false,
            finished: false,
            runId: this.runId,
            profilerMode: this.mode,
        };

        // Check for a leftover unfinalized run from a previous (possibly crashed) session
        // BEFORE we start writing our own data into the same localStorage key.
        this._recovered = this._checkRecovery();

        this._attachContextLostListener();
        this._samplerHandle = setInterval(() => this._sample(), SAMPLE_INTERVAL_MS);

        // Insurance: persist an initial placeholder immediately, in case the tab dies
        // within the first couple of seconds (before the periodic persist would fire).
        this._persist();
    }

    // ─── Recovery ──────────────────────────────────────────────────────

    _checkRecovery() {
        try {
            const raw = localStorage.getItem(LS_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (parsed && parsed.meta && parsed.meta.finished === false) {
                parsed.meta.crashed = true;
                console.log(
                    '[PERF_RECOVERY] Found an unfinalized perf run from a previous session ' +
                    `(scenario=${parsed.meta.scenario}, runId=${parsed.meta.runId}). ` +
                    'Call pistonViewer.profiler.recoverLastRun() to retrieve it.'
                );
                return parsed;
            }
        } catch (e) {
            console.warn('[PERF_PROFILER] Failed to parse recovered run from localStorage:', e);
        }
        return null;
    }

    /** Returns the recovered (crashed/unfinalized) report from a previous session, or null. */
    recoverLastRun() {
        return this._recovered;
    }

    // ─── OOM sentinels ─────────────────────────────────────────────────

    _attachContextLostListener() {
        const canvas = this.viewer?.renderer?.domElement;
        if (!canvas) return;
        canvas.addEventListener('webglcontextlost', (e) => {
            this.memory.contextLostCount++;
            this.meta.crashed = true;
            console.error('[PERF_OOM] webglcontextlost fired — GPU context lost (likely OOM). Persisting immediately.');
            this._persist();
        });
    }

    /** Poll gl.getError() — 1Hz sampler ONLY. Never call per-frame (getError() is a sync GPU
     * round-trip and clears the error state, so calling it inside animate() would both hurt
     * performance and race with the renderer's own error handling). */
    _pollGlError() {
        try {
            const gl = this.viewer?.renderer?.getContext?.();
            if (!gl) return;
            let err;
            let guard = 0;
            while ((err = gl.getError()) !== gl.NO_ERROR && guard++ < 10) {
                if (err === gl.OUT_OF_MEMORY) {
                    this.memory.glOutOfMemoryCount++;
                    console.warn('[PERF_OOM] gl.getError() reported OUT_OF_MEMORY (0x0505)');
                }
            }
        } catch (e) { /* context may be lost/unavailable — ignore */ }
    }

    // ─── Per-frame feed (called from animate(), before the idle early-return) ──

    /**
     * @param {number} now - performance.now() at this rAF tick
     * @param {string} engineState - viewer.engineState (ENGINE_STATES.*)
     * @param {boolean} willRender - whether this tick will proceed past the idle early-return
     */
    frame(now, engineState, willRender) {
        this.frames.total++;
        if (willRender) this.frames.rendered++; else this.frames.skipped++;

        if (this._lastFrameTime !== null) {
            const dt = now - this._lastFrameTime;
            const isActive = willRender || engineState !== 'STATIC';
            if (isActive && dt >= 0 && Number.isFinite(dt)) {
                this._active.push({ dt, state: engineState });
            }
        }
        this._lastFrameTime = now;

        this._persistIfDue(now);
    }

    // ─── 1Hz sampler ───────────────────────────────────────────────────

    _sample() {
        const v = this.viewer;
        const elapsed = (performance.now() - this.startTime) / 1000;
        const sample = { t: round(elapsed, 1) };

        if (typeof performance !== 'undefined' && performance.memory) {
            const m = performance.memory;
            sample.jsHeap = { used: m.usedJSHeapSize, total: m.totalJSHeapSize, limit: m.jsHeapSizeLimit };
            this.memory.jsHeapPeakBytes = Math.max(this.memory.jsHeapPeakBytes, m.usedJSHeapSize);
            this.memory.jsHeapEndBytes = m.usedJSHeapSize;
        }

        if (v?.renderer?.info) {
            const info = v.renderer.info;
            // NOTE: render.calls/triangles are a snapshot of the MOST RECENT render() call
            // (three.js resets them at the start of every render()), not a cumulative total.
            // memory.geometries/textures ARE live cumulative GPU allocation counts.
            sample.renderInfo = {
                calls: info.render?.calls,
                triangles: info.render?.triangles,
                geometries: info.memory?.geometries,
                textures: info.memory?.textures,
                programs: info.programs?.length,
            };
        }

        if (typeof v?.getDetailedStats === 'function') {
            try {
                const stats = v.getDetailedStats('profiler-sample');
                sample.vram = {
                    totalBytes: stats.vram.totalBytes,
                    highTextureBudgetBytes: stats.vram.highTextureBudgetBytes,
                    highTextureBudgetUtilization: stats.vram.highTextureBudgetUtilization,
                };
                sample.tiles = {
                    loaded: stats.tiles.loaded,
                    loadQueue: stats.tiles.loadQueue,
                    textureQueue: stats.tiles.textureQueue,
                    textureResultQueue: stats.tiles.textureResultQueue,
                    geometryRebuildQueue: stats.tiles.geometryRebuildQueue,
                    activeWorkers: stats.tiles.activeWorkers,
                };

                this.vram.peakLedgerBytes = Math.max(this.vram.peakLedgerBytes, stats.vram.totalBytes);
                this.vram.endLedgerBytes = stats.vram.totalBytes;
                this.vram.budgetBytes = stats.vram.highTextureBudgetBytes;
                this.vram.peakUtilization = Math.max(
                    this.vram.peakUtilization,
                    stats.vram.highTextureBudgetUtilization,
                );
            } catch (e) { /* viewer mid-init or method shape changed — skip this sample's VRAM data */ }
        }

        // Read cache manager directly — getDetailedStats() only exposes evictedBytes as a
        // human-readable string (via fmt()), we want the raw byte count.
        if (v?.cacheManager) {
            sample.cache = {
                evictions: v.cacheManager.evictionCount,
                evictedBytes: v.cacheManager.evictedBytes,
                redownloads: v.cacheManager.redownloadCount,
            };
            this.cache.evictions = v.cacheManager.evictionCount;
            this.cache.evictedBytes = v.cacheManager.evictedBytes;
            this.cache.redownloads = v.cacheManager.redownloadCount;
        }

        // Defensive read of the other branch's texture-pipeline stats — may not exist on this branch.
        if (v && v.texStats) {
            try {
                sample.texStats = JSON.parse(JSON.stringify(v.texStats));
                this.textures.texStats = sample.texStats;
                if (typeof v.texStats.upgrades === 'number') this.textures.upgrades = v.texStats.upgrades;
            } catch (e) { /* non-serializable texStats shape — skip */ }
        }

        this._pollGlError();
        sample.glOutOfMemoryCount = this.memory.glOutOfMemoryCount;

        this.samples.push(sample);
        this._persistIfDue(performance.now());
    }

    // ─── Stats computation ─────────────────────────────────────────────

    _computeFrameStats(entries) {
        const dts = entries.map((e) => e.dt).sort((a, b) => a - b);
        const n = dts.length;
        const sum = dts.reduce((a, b) => a + b, 0);
        const avgMs = n ? sum / n : 0;
        return {
            count: n,
            fps_avg: n && avgMs > 0 ? round(1000 / avgMs, 1) : 0,
            p50_ms: round(percentile(dts, 0.50)),
            p95_ms: round(percentile(dts, 0.95)),
            p99_ms: round(percentile(dts, 0.99)),
            worst_ms: round(n ? dts[n - 1] : 0),
            over20: dts.filter((d) => d > 20).length,
            over33: dts.filter((d) => d > 33).length,
            over100: dts.filter((d) => d > 100).length,
        };
    }

    // ─── Report / export ───────────────────────────────────────────────

    /** Merge fields into report meta (scenario, texturePipeline, appVersion, ...). */
    setMeta(partial) {
        Object.assign(this.meta, partial);
    }

    milestone(name) {
        try {
            if (!name || Object.hasOwn(this.milestones, name)) return;
            this.milestones[name] = round(performance.now() - this.startTime, 1);
        } catch (e) { /* milestones must never perturb the app */ }
    }

    /** Current snapshot of the run so far — does not mark the run as finished. */
    getReport() {
        this.meta.duration_s = round((performance.now() - this.startTime) / 1000, 1);

        const activeEntries = this._active.toArray();
        const cumulative = this._computeFrameStats(activeEntries);
        const perState = {};
        for (const state of ACTIVE_STATES) {
            const entries = activeEntries.filter((e) => e.state === state);
            if (entries.length) perState[state] = this._computeFrameStats(entries);
        }

        return {
            meta: { ...this.meta },
            frames: {
                total: this.frames.total,
                rendered: this.frames.rendered,
                skipped: this.frames.skipped,
                fps_avg_active: cumulative.fps_avg,
                p50_ms: cumulative.p50_ms,
                p95_ms: cumulative.p95_ms,
                p99_ms: cumulative.p99_ms,
                worst_ms: cumulative.worst_ms,
                over20: cumulative.over20,
                over33: cumulative.over33,
                over100: cumulative.over100,
                perState,
            },
            memory: { ...this.memory },
            vram: { ...this.vram },
            cache: { ...this.cache },
            textures: { ...this.textures },
            milestones: { ...this.milestones },
            samples: this.samples.toArray(),
        };
    }

    /** Mark the run finished, persist the final report, log [PERF_REPORT], and return it.
     * Call this from benchmark.js when a scenario completes. */
    finalize(metaOverrides = {}) {
        Object.assign(this.meta, metaOverrides, { finished: true });
        const report = this.getReport();
        console.log('[PERF_REPORT] ' + JSON.stringify(report));
        this._persistReport(report);
        return report;
    }

    /** Trigger a .json file download of a report (defaults to the current live report). */
    downloadReport(report) {
        const data = report || this.getReport();
        try {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const scenario = data.meta?.scenario || 'manual';
            const pipeline = data.meta?.texturePipeline || 'unknown';
            a.href = url;
            a.download = `perf_${pipeline}_${scenario}_${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 2000);
        } catch (e) {
            console.warn('[PERF_PROFILER] downloadReport failed:', e);
        }
    }

    // ─── Persistence (crash resilience) ─────────────────────────────────

    _persist() {
        this._persistReport(this.getReport());
    }

    _persistIfDue(now) {
        if (now - this._lastPersist <= this._persistIntervalMs) return;
        this._lastPersist = now;
        this._persist();
    }

    _persistReport(report) {
        try {
            localStorage.setItem(LS_KEY, JSON.stringify(report));
        } catch (e) {
            // Quota exceeded or storage unavailable — degrade gracefully, don't throw from the render loop.
            console.warn('[PERF_PROFILER] localStorage persist failed (quota? private mode?):', e);
        }
    }

    dispose() {
        if (this._samplerHandle) clearInterval(this._samplerHandle);
    }
}
