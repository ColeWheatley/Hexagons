// @atlas: `DevTools` — the dev-layer half of the engine <-> dev seam. main.js
// calls `onFrame`/`onLog`/`onTextureActivity`/`syncControls` on
// `viewer.devTools` when non-null and never reaches into dev DOM directly.
// Everything here either ports old per-frame HUD methods verbatim
// (updateFps, updateRenderStats, updateRendererDebugStats) or is new
// build-out (PERF section, benchmark launcher last-run refresh).

import { DEV_STYLES } from './dev_styles.js';
import { buildDevPanel, appendLogLine } from './dev_panel.js';
import { FrametimeGraph, ENGINE_STATE_COLORS } from './frametime_graph.js';
import { TexBadge } from './tex_badge.js';
import { PerfProfiler } from '../perf_profiler.js';

const PERCENTILE_RING_CAP = 300;
const CORE_STATS_INTERVAL_MS = 500;
const PERF_INTERVAL_MS = 500; // 2Hz
const HOUSEKEEPING_INTERVAL_MS = 1000;
const TEX_BADGE_BOOTSTRAP_INTERVAL_MS = 250;

function formatHudNumber(value) {
    return Number.isFinite(value) ? Math.round(value).toLocaleString() : '--';
}

function formatTextureDistance(distanceM) {
    if (!(distanceM > 0)) return 'OFF';
    return distanceM >= 1000
        ? `${(distanceM / 1000).toFixed(distanceM % 1000 === 0 ? 0 : 1)}km`
        : `${distanceM}m`;
}

function percentile(sortedAsc, p) {
    const n = sortedAsc.length;
    if (!n) return 0;
    const idx = Math.min(n - 1, Math.max(0, Math.floor(p * n)));
    return sortedAsc[idx];
}

export class DevTools {
    constructor(viewer, { appVersion } = {}) {
        this.viewer = viewer;
        this.appVersion = appVersion;

        this._styleEl = null;
        this._panel = null;
        this._frametimeGraph = null;
        this._texBadge = null;

        this._statsIntervalHandle = null;
        this._perfIntervalHandle = null;
        this._houseKeepingIntervalHandle = null;
        this._texBadgeBootstrapIntervalHandle = null;

        this._fpsState = { frames: 0, activeElapsed: 0, lastActiveFrame: null };
        this._lastRenderedNow = null;
        this._percentileRing = [];
        this._hudLast = {};
    }

    attach() {
        if (this._styleEl) return; // already attached

        const style = document.createElement('style');
        style.id = 'dev-styles';
        style.textContent = DEV_STYLES;
        document.head.appendChild(style);
        this._styleEl = style;

        this._panel = buildDevPanel(this.viewer, {
            onSectionToggle: (section, expanded) => {
                if (section === 'debug' && expanded) this._refreshRendererDebugStats();
            },
        });

        this._texBadge = new TexBadge(this.viewer);
        this._texBadge.refresh(); // seed immediately, parity with the old constructor-time call

        if (this._panel?.els?.frametimeCanvasEl) {
            this._frametimeGraph = new FrametimeGraph(this._panel.els.frametimeCanvasEl);
        }

        this._statsIntervalHandle = setInterval(() => this._refreshCoreStats(), CORE_STATS_INTERVAL_MS);
        this._refreshCoreStats();

        this._perfIntervalHandle = setInterval(() => this._refreshPerfSection(), PERF_INTERVAL_MS);
        this._refreshPerfSection();

        this._houseKeepingIntervalHandle = setInterval(() => this._houseKeeping(), HOUSEKEEPING_INTERVAL_MS);
        this._houseKeeping();

        // While the loader is still up, texture residency changes fast and
        // isn't reliably driven by rendered frames yet; keep the badge fresh
        // on a timer until the loader hands off to onFrame/onTextureActivity.
        this._texBadgeBootstrapIntervalHandle = setInterval(() => {
            if (!this.viewer.loaderHidden) this._texBadge?.refresh();
        }, TEX_BADGE_BOOTSTRAP_INTERVAL_MS);

        this.syncControls();
    }

    dispose() {
        if (this._statsIntervalHandle) clearInterval(this._statsIntervalHandle);
        if (this._perfIntervalHandle) clearInterval(this._perfIntervalHandle);
        if (this._houseKeepingIntervalHandle) clearInterval(this._houseKeepingIntervalHandle);
        if (this._texBadgeBootstrapIntervalHandle) clearInterval(this._texBadgeBootstrapIntervalHandle);
        this._statsIntervalHandle = null;
        this._perfIntervalHandle = null;
        this._houseKeepingIntervalHandle = null;
        this._texBadgeBootstrapIntervalHandle = null;

        this._texBadge?.dispose();
        this._texBadge = null;
        this._frametimeGraph = null;

        this._panel?.root?.remove();
        this._panel = null;

        this._styleEl?.remove();
        this._styleEl = null;

        this._fpsState = { frames: 0, activeElapsed: 0, lastActiveFrame: null };
        this._lastRenderedNow = null;
        this._percentileRing = [];
        this._hudLast = {};
    }

    onLog(entry) {
        const consoleOutputEl = this._panel?.els?.consoleOutputEl;
        if (!consoleOutputEl) return;
        appendLogLine(consoleOutputEl, entry);
        consoleOutputEl.scrollTop = consoleOutputEl.scrollHeight;
    }

    onTextureActivity() {
        this._texBadge?.refresh();
    }

    syncControls() {
        const viewer = this.viewer;
        const els = this._panel?.els;
        if (!els) return;

        if (els.hazeSliderEl) {
            const km = viewer.atmosphereSettings.hazeDistance / 1000;
            els.hazeSliderEl.value = String(km);
            if (els.hazeValEl) els.hazeValEl.textContent = `${km}km`;
        }
        if (els.hazeControlEl) {
            els.hazeControlEl.hidden = Boolean(viewer.isMiniBake);
        }
        if (els.texSliderEl) {
            els.texSliderEl.value = String(viewer.highTextureDistanceM);
            if (els.texValEl) els.texValEl.textContent = formatTextureDistance(viewer.highTextureDistanceM);
        }
        if (els.lodPauseToggleEl) {
            els.lodPauseToggleEl.checked = Boolean(viewer.lodPaused);
        }

        this._refreshReadouts();
        this._refreshRendererDebugStats();
    }

    onFrame(now, willRender) {
        this._updateFps(now, willRender);
        if (!willRender) return;

        const dt = this._lastRenderedNow === null ? 16.67 : now - this._lastRenderedNow;
        this._lastRenderedNow = now;
        const state = this.viewer.engineState;

        this._frametimeGraph?.push(dt, state);
        this._frametimeGraph?.draw();

        this._percentileRing.push(dt);
        if (this._percentileRing.length > PERCENTILE_RING_CAP) this._percentileRing.shift();

        this._refreshReadouts();
        this._texBadge?.refresh();
    }

    // --- internals -----------------------------------------------------

    _updateFps(now, willRender) {
        const fpsEl = this._panel?.els?.fpsEl;
        if (!fpsEl) return;
        const viewer = this.viewer;
        const dist = viewer.camera.position.distanceTo(viewer.controls.target);

        // STATIC means the camera and refinement state are settled even when a
        // one-off maintenance render was requested. Reporting that sparse
        // maintenance cadence as active FPS is misleading, so STATIC is
        // always truthfully idle.
        if (viewer.engineState === 'STATIC') {
            fpsEl.textContent = `FPS: IDLE | Zoom: ${dist.toFixed(0)}`;
            this._fpsState.frames = 0;
            this._fpsState.activeElapsed = 0;
            this._fpsState.lastActiveFrame = null;
            return;
        }

        if (!willRender) return;

        const state = this._fpsState;
        if (state.lastActiveFrame !== null) {
            state.activeElapsed += Math.max(0, now - state.lastActiveFrame);
        }
        state.lastActiveFrame = now;
        state.frames += 1;
        if (state.activeElapsed < 500 || state.frames < 2) return;

        const fps = ((state.frames - 1) * 1000) / state.activeElapsed;
        fpsEl.textContent = `FPS: ${fps.toFixed(0)} | Zoom: ${dist.toFixed(0)}`;
        state.frames = 1;
        state.activeElapsed = 0;
        state.lastActiveFrame = now;
    }

    _refreshCoreStats() {
        this._refreshRenderStats();
        this._refreshRendererDebugStats();
    }

    _refreshRenderStats() {
        const els = this._panel?.els;
        if (!els?.hexCountEl) return;
        const viewer = this.viewer;

        let capCount = 0;
        let skirtCount = 0;
        for (const t of viewer.tiles.values()) {
            if (t.mesh && t.mesh.isGroup) {
                // Caps are always first child, skirts second. Iterate through
                // all children, as each LOD is a group of cap/skirt.
                t.mesh.children.forEach(lodGroup => {
                    if (lodGroup.isGroup && lodGroup.visible) {
                        const capMesh = lodGroup.children[0];
                        const skirtMesh = lodGroup.children[1];
                        if (capMesh && capMesh.visible) capCount += capMesh.count;
                        if (skirtMesh && skirtMesh.visible) skirtCount += (lodGroup.userData.activeSkirts || 0);
                    }
                });
            }
        }

        els.hexCountEl.innerHTML = `
            <span style="color: #00d2ff">${capCount.toLocaleString()} TOPS</span> |
            <span style="color: #ff7675">${skirtCount.toLocaleString()} SKIRTS</span>
        `;
    }

    _refreshRendererDebugStats() {
        const els = this._panel?.els;
        if (!els?.debugSectionEl || els.debugSectionEl.classList.contains('collapsed')) return;
        const renderInfo = this.viewer.renderer?.info?.render || {};
        const memoryInfo = this.viewer.renderer?.info?.memory || {};
        if (els.triCountEl) els.triCountEl.textContent = formatHudNumber(renderInfo.triangles);
        if (els.drawStatsEl) {
            els.drawStatsEl.textContent = `Calls: ${formatHudNumber(renderInfo.calls)} | ` +
                `G:${formatHudNumber(memoryInfo.geometries)} | T:${formatHudNumber(memoryInfo.textures)}`;
        }
    }

    _refreshReadouts() {
        const els = this._panel?.els;
        if (!els) return;
        const readouts = this.viewer.readouts || {};
        this._writeIfChanged(els.sectorValEl, 'sector', readouts.sector);
        this._writeIfChanged(els.hexValEl, 'hex', readouts.hex);
        this._writeIfChanged(els.worldValEl, 'world', readouts.world);
        this._writeIfChanged(els.tileHeightEl, 'tileHeight', readouts.tileHeight);
        this._writeIfChanged(els.cameraHeightEl, 'cameraHeight', readouts.cameraHeight);
        this._writeIfChanged(els.nearLodBandsEl, 'nearLodBands', readouts.nearLodBands);
        this._writeIfChanged(els.farLodBandsEl, 'farLodBands', readouts.farLodBands);
        this._writeIfChanged(els.movingLodSummaryEl, 'movingLodSummary', readouts.movingLodSummary);
        this._writeIfChanged(els.settledLodSummaryEl, 'settledLodSummary', readouts.settledLodSummary);
    }

    _writeIfChanged(el, key, text) {
        if (!el || text === undefined || text === null) return;
        if (this._hudLast[key] === text) return;
        el.textContent = text;
        this._hudLast[key] = text;
    }

    _refreshPerfSection() {
        const els = this._panel?.els;
        if (!els?.perfSectionEl || els.perfSectionEl.classList.contains('collapsed')) return;
        const viewer = this.viewer;

        let stats = null;
        try {
            stats = viewer.getDetailedStats?.('dev-hud');
        } catch (e) {
            stats = null;
        }

        if (els.engineStateChipEl) {
            const state = viewer.engineState || 'STATIC';
            els.engineStateChipEl.textContent = state;
            els.engineStateChipEl.style.background = ENGINE_STATE_COLORS[state] || '#808a93';
        }

        if (els.framePercentilesEl) {
            const sorted = this._percentileRing.slice().sort((a, b) => a - b);
            const p50 = percentile(sorted, 0.5);
            const p95 = percentile(sorted, 0.95);
            const p99 = percentile(sorted, 0.99);
            const worst = sorted.length ? sorted[sorted.length - 1] : 0;
            els.framePercentilesEl.textContent =
                `p50 ${p50.toFixed(1)} · p95 ${p95.toFixed(1)} · p99 ${p99.toFixed(1)} · worst ${worst.toFixed(1)} ms`;
        }

        if (els.jsHeapRowEl && els.jsHeapEl) {
            const mem = (typeof performance !== 'undefined') ? performance.memory : null;
            if (mem) {
                els.jsHeapRowEl.hidden = false;
                els.jsHeapEl.textContent =
                    `${(mem.usedJSHeapSize / 1048576).toFixed(0)} / ${(mem.jsHeapSizeLimit / 1048576).toFixed(0)} MB`;
            } else {
                els.jsHeapRowEl.hidden = true;
            }
        }

        if (els.vramUsageEl) {
            const used = stats?.vram?.highTextureBytes ?? viewer.cacheManager?.highBytes;
            const budget = stats?.vram?.highTextureBudgetBytes ?? viewer.cacheManager?.budget;
            const utilization = stats?.vram?.highTextureBudgetUtilization ?? viewer.cacheManager?.utilization;
            if (Number.isFinite(used) && Number.isFinite(budget)) {
                els.vramUsageEl.textContent =
                    `${(used / 1048576).toFixed(0)} / ${(budget / 1048576).toFixed(0)} MB`;
            }
            if (els.vramBarFillEl && Number.isFinite(utilization)) {
                const pct = Math.max(0, Math.min(100, utilization * 100));
                els.vramBarFillEl.style.width = `${pct.toFixed(1)}%`;
                els.vramBarFillEl.style.background = pct > 90 ? '#e74c3c' : (pct > 70 ? '#f39c12' : '#74b9ff');
            }
        }

        if (els.cacheStatsEl) {
            const evictions = stats?.tiles?.evictedTotal ?? viewer.cacheManager?.evictionCount;
            const redownloads = stats?.tiles?.redownloads ?? viewer.cacheManager?.redownloadCount;
            els.cacheStatsEl.textContent =
                `evictions ${formatHudNumber(evictions)} · redownloads ${formatHudNumber(redownloads)}`;
        }

        if (els.workerStatsEl) {
            const g = stats?.workerLanes?.geometry ?? viewer.workerLaneStats?.geometry ?? {};
            const t = stats?.workerLanes?.texture ?? viewer.workerLaneStats?.texture ?? {};
            els.workerStatsEl.textContent =
                `geo ${g.workers || 0}w ${g.dispatched || 0}/${g.completed || 0} · ` +
                `tex ${t.workers || 0}w ${t.dispatched || 0}/${t.completed || 0}`;
        }

        if (els.queueDepthsEl) {
            const tiles = stats?.tiles;
            els.queueDepthsEl.textContent =
                `load ${tiles?.loadQueue ?? viewer.loadQueue?.length ?? 0} · ` +
                `tex ${tiles?.textureQueue ?? viewer.textureQueue?.length ?? 0} · ` +
                `res ${tiles?.textureResultQueue ?? viewer.textureResultQueue?.length ?? 0} · ` +
                `rebuild ${tiles?.geometryRebuildQueue ?? viewer.geometryRebuildQueue?.length ?? 0} · ` +
                `inst ${viewer.instantiateQueue?.length ?? 0}`;
        }

        if (els.failureStatsEl) {
            const failureStats = viewer.failureStats || {};
            const nonZero = Object.entries(failureStats).filter(([, v]) => v > 0);
            els.failureStatsEl.textContent = nonZero.length
                ? nonZero.map(([k, v]) => `${k}: ${v}`).join(' · ')
                : 'none';
        }
    }

    _houseKeeping() {
        const viewer = this.viewer;
        // Hot-toggling dev ON after initWorld: ensure a profiler exists once the
        // release lane is known. Hot-toggling OFF leaves it running (bounded,
        // harmless) — only attach()/this tick ever construct one.
        if (viewer.releaseMode && !viewer.profiler) {
            viewer.profiler = new PerfProfiler(viewer, { mode: 'bounded-recovery' });
        }
        this._panel?.bench?.refreshSummary?.();
    }
}
