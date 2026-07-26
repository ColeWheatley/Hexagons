// @atlas: Builds the dev HUD DOM inside #main-panel-body. IDs and classes are
// pinned to match the pre-split markup exactly (scripts/run_ux_browser_gate.py
// + validate_ux_browser_gate.py assert this DOM with ?dev=1). Slider/toggle
// event wiring lives here too, ported verbatim from the old
// `initLODSliders`/console-button code; DevTools only supplies per-frame
// refreshes and the section-toggle side effects it cares about.

import { setDisclosure, toggleDisclosure } from '../ui_accessibility.js';
import { applyLodPauseTransition } from '../geometry_transition_state.js';
import { buildBenchSection } from './bench_panel.js';

const SECTION_STORAGE_KEY = 'hexagons:devPanelSections';

const STATS_TEMPLATE = `
<div class="stats">
    <div class="hud-item">
        <span>FPS / ZOOM</span>
        <span class="value" id="fps-counter"></span>
    </div>
    <div class="hud-item">
        <span>VISIBLE GEOMETRY</span>
        <span class="value" id="hex-count"></span>
    </div>

    <div class="collapsible-section collapsed" data-section="perf">
        <button class="collapsible-header" type="button" aria-expanded="false" aria-controls="perf-content">
            <span class="title">PERF & MEMORY</span>
            <span class="arrow" aria-hidden="true">▼</span>
        </button>
        <div class="collapsible-content" id="perf-content" hidden aria-hidden="true">
            <div class="hud-item">
                <span>ENGINE STATE</span>
                <span class="dev-chip" id="engine-state-chip"></span>
            </div>
            <div class="hud-item">
                <span>FRAME TIME</span>
                <span class="value" id="frame-percentiles"></span>
            </div>
            <div class="hud-item" id="js-heap-row" hidden>
                <span>JS HEAP</span>
                <span class="value" id="js-heap"></span>
            </div>
            <div class="hud-item" style="flex-direction: column; margin-top: 5px;">
                <div style="display: flex; justify-content: space-between; width: 100%;">
                    <span>VRAM (HIGH-TIER BUDGET)</span>
                    <span class="value" id="vram-usage"></span>
                </div>
                <div class="dev-bar-track"><div class="dev-bar-fill" id="vram-bar-fill"></div></div>
            </div>
            <div class="hud-item">
                <span>CACHE</span>
                <span class="value" id="cache-stats"></span>
            </div>
            <div class="hud-item">
                <span>WORKERS</span>
                <span class="value" id="worker-stats"></span>
            </div>
            <div class="hud-item">
                <span>QUEUES</span>
                <span class="value" id="queue-depths"></span>
            </div>
            <div class="hud-item">
                <span>FAILURES</span>
                <span class="value" id="failure-stats"></span>
            </div>
        </div>
    </div>

    <div class="collapsible-section collapsed" data-section="debug">
        <button class="collapsible-header" type="button" aria-expanded="false" aria-controls="debug-content">
            <span class="title">POSITION & DEBUG</span>
            <span class="arrow" aria-hidden="true">▼</span>
        </button>
        <div class="collapsible-content" id="debug-content" hidden aria-hidden="true">
            <div class="hud-item">
                <span>TRIANGLES</span>
                <span class="value" id="tri-count"></span>
            </div>
            <div class="hud-item">
                <span>DRAW / GPU OBJECTS</span>
                <span class="value" id="draw-stats"></span>
            </div>
            <div class="hud-item">
                <span>SECTOR</span>
                <span class="value" id="sector-val"></span>
            </div>
            <div class="hud-item">
                <span>HEX</span>
                <span class="value" id="hex-val"></span>
            </div>
            <div class="hud-item" style="display: none;">
                <span>WORLD XY</span>
                <span class="value" id="world-val"></span>
            </div>
            <div class="hud-item">
                <span>TILE HEIGHT</span>
                <span class="value" id="tile-height"></span>
            </div>
            <div class="hud-item">
                <span>CAMERA HEIGHT</span>
                <span class="value" id="camera-height"></span>
            </div>
        </div>
    </div>

    <div class="collapsible-section collapsed" data-section="geometry">
        <button class="collapsible-header" type="button" aria-expanded="false" aria-controls="geometry-content">
            <span class="title">GRANULAR LOD TUNING</span>
            <span class="arrow" aria-hidden="true">▼</span>
        </button>
        <div class="collapsible-content" id="geometry-content" hidden aria-hidden="true">
            <!-- VISUAL HAZE ONLY; hidden for mini-bakes -->
            <div class="hud-item" id="haze-distance-control" style="flex-direction: column; margin-top: 5px;">
                <div style="display: flex; justify-content: space-between; width: 100%;">
                    <span id="haze-distance-label">ATMOSPHERE DISTANCE</span>
                    <span class="value" id="haze-distance-val">4km</span>
                </div>
                <input type="range" id="haze-distance-slider" min="1" max="50" step="1" value="4"
                    aria-labelledby="haze-distance-label haze-distance-val"
                    style="width: 100%;">
            </div>

            <!-- TEXTURE UPGRADE -->
            <div class="hud-item" style="flex-direction: column; margin-top: 10px;">
                <div style="display: flex; justify-content: space-between; width: 100%;">
                    <span id="tex-upgrade-label">PINK TEXTURE RANGE</span>
                    <span class="value" id="tex-upgrade-val">2km</span>
                </div>
                <input type="range" id="tex-upgrade-slider" min="0" max="5000" step="100" value="2000"
                    aria-labelledby="tex-upgrade-label tex-upgrade-val"
                    style="width: 100%;">
            </div>

            <!-- GOSPER FIXED-DISTANCE LOD -->
            <div class="hud-item"
                style="flex-direction: column; margin-top: 10px; border-top: 1px solid #333; padding-top: 10px;">
                <div style="display: flex; justify-content: space-between; width: 100%;">
                    <span>SETTLED NEAR BANDS</span>
                    <span class="value" id="near-lod-bands"></span>
                </div>
                <div style="font-size: 10px; color: #aaa;">unit / L1 / L2</div>
            </div>

            <div class="hud-item" style="flex-direction: column; margin-top: 10px;">
                <div style="display: flex; justify-content: space-between; width: 100%;">
                    <span>FAR HIERARCHY</span>
                    <span class="value" id="far-lod-bands"></span>
                </div>
                <div id="moving-lod-summary" style="font-size: 10px; color: #aaa;"></div>
                <div id="settled-lod-summary" style="font-size: 10px; color: #aaa;"></div>
            </div>
        </div>
    </div>
</div>

<div class="hud-item"
    style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
    <label for="lod-pause-toggle">PAUSE LOD UPDATES</label>
    <input type="checkbox" id="lod-pause-toggle" style="pointer-events: auto;">
</div>

<div class="hud-item frametime-item" style="margin-top: 15px;">
    <canvas id="frametime-graph" width="640" height="80" role="img" aria-label="Frametime graph"></canvas>
</div>

<div class="console-panel">
    <div class="console-header">
        <span>STATUS LOG</span>
        <button id="copy-log-btn" class="console-btn">COPY</button>
    </div>
    <div id="console-output" class="console-box" role="log" aria-live="polite" aria-relevant="additions"></div>
</div>
`;

function formatTextureDistance(distanceM) {
    if (!(distanceM > 0)) return 'OFF';
    return distanceM >= 1000
        ? `${(distanceM / 1000).toFixed(distanceM % 1000 === 0 ? 0 : 1)}km`
        : `${distanceM}m`;
}

function readSectionState() {
    try {
        const raw = localStorage.getItem(SECTION_STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        return {};
    }
}

function writeSectionState(state) {
    try {
        localStorage.setItem(SECTION_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        // best-effort only
    }
}

/** Generic collapsible wiring (mirrors the old initCollapsibleSections) plus
 * per-section persisted collapse state and a toggle notification hook. */
function wireCollapsibleSections(root, handlers) {
    const stored = readSectionState();
    root.querySelectorAll('.collapsible-header').forEach(header => {
        const content = document.getElementById(header.getAttribute('aria-controls'));
        if (!content) return;
        const section = header.parentElement;
        const sectionName = section.dataset.section;

        if (sectionName && stored[sectionName] === true) {
            section.classList.remove('collapsed');
        }
        setDisclosure(header, content, !section.classList.contains('collapsed'));

        header.addEventListener('click', () => {
            const expanded = toggleDisclosure(header, content);
            section.classList.toggle('collapsed', !expanded);
            if (sectionName) {
                const next = readSectionState();
                next[sectionName] = expanded;
                writeSectionState(next);
            }
            handlers?.onSectionToggle?.(sectionName, expanded);
        });
    });
}

export function appendLogLine(consoleOutputEl, entry) {
    const line = document.createElement('div');
    line.className = `log-line ${entry?.type || 'info'}`;
    const time = new Date(entry?.t ?? Date.now()).toLocaleTimeString();
    line.textContent = `[${time}] ${entry?.msg ?? ''}`;
    consoleOutputEl.appendChild(line);
    return line;
}

/**
 * Build every dev HUD section and prepend them into #main-panel-body, above
 * the consumer gradient/copy-link rows already there.
 *
 * @returns {{ root: HTMLElement, els: Record<string, Element|null>, bench: { root: HTMLElement, refreshSummary: () => void } } | null}
 */
export function buildDevPanel(viewer, handlers = {}) {
    const body = document.getElementById('main-panel-body');
    if (!body) return null;

    const root = document.createElement('div');
    root.id = 'dev-panel-root';
    root.innerHTML = STATS_TEMPLATE;

    const bench = buildBenchSection(viewer);
    root.querySelector('.stats')?.appendChild(bench.root);

    body.prepend(root);

    wireCollapsibleSections(root, handlers);

    const els = {
        fpsEl: root.querySelector('#fps-counter'),
        hexCountEl: root.querySelector('#hex-count'),

        perfSectionEl: root.querySelector('[data-section="perf"]'),
        perfContentEl: root.querySelector('#perf-content'),
        engineStateChipEl: root.querySelector('#engine-state-chip'),
        framePercentilesEl: root.querySelector('#frame-percentiles'),
        jsHeapRowEl: root.querySelector('#js-heap-row'),
        jsHeapEl: root.querySelector('#js-heap'),
        vramUsageEl: root.querySelector('#vram-usage'),
        vramBarFillEl: root.querySelector('#vram-bar-fill'),
        cacheStatsEl: root.querySelector('#cache-stats'),
        workerStatsEl: root.querySelector('#worker-stats'),
        queueDepthsEl: root.querySelector('#queue-depths'),
        failureStatsEl: root.querySelector('#failure-stats'),

        debugSectionEl: root.querySelector('[data-section="debug"]'),
        debugContentEl: root.querySelector('#debug-content'),
        triCountEl: root.querySelector('#tri-count'),
        drawStatsEl: root.querySelector('#draw-stats'),
        sectorValEl: root.querySelector('#sector-val'),
        hexValEl: root.querySelector('#hex-val'),
        worldValEl: root.querySelector('#world-val'),
        tileHeightEl: root.querySelector('#tile-height'),
        cameraHeightEl: root.querySelector('#camera-height'),

        geometrySectionEl: root.querySelector('[data-section="geometry"]'),
        geometryContentEl: root.querySelector('#geometry-content'),
        hazeControlEl: root.querySelector('#haze-distance-control'),
        hazeSliderEl: root.querySelector('#haze-distance-slider'),
        hazeValEl: root.querySelector('#haze-distance-val'),
        texSliderEl: root.querySelector('#tex-upgrade-slider'),
        texValEl: root.querySelector('#tex-upgrade-val'),
        nearLodBandsEl: root.querySelector('#near-lod-bands'),
        farLodBandsEl: root.querySelector('#far-lod-bands'),
        movingLodSummaryEl: root.querySelector('#moving-lod-summary'),
        settledLodSummaryEl: root.querySelector('#settled-lod-summary'),

        lodPauseToggleEl: root.querySelector('#lod-pause-toggle'),
        frametimeCanvasEl: root.querySelector('#frametime-graph'),
        consoleOutputEl: root.querySelector('#console-output'),
        copyLogBtnEl: root.querySelector('#copy-log-btn'),
    };

    // --- Slider / toggle wiring (verbatim semantics from the old initLODSliders) ---
    if (els.hazeSliderEl) {
        els.hazeSliderEl.addEventListener('input', () => {
            viewer.atmosphereSettings.hazeDistance = parseInt(els.hazeSliderEl.value, 10) * 1000;
            if (els.hazeValEl) els.hazeValEl.textContent = `${els.hazeSliderEl.value}km`;
            viewer.updateFogAndClip();
            viewer.viewState?.commitSettingsChange();
        });
    }

    if (els.texSliderEl) {
        els.texSliderEl.addEventListener('input', () => {
            viewer.highTextureDistanceM = parseInt(els.texSliderEl.value, 10);
            if (els.texValEl) els.texValEl.textContent = formatTextureDistance(viewer.highTextureDistanceM);
            viewer.needsLODUpdate = true;
            viewer.needsRender = true;
            viewer.viewState?.commitSettingsChange();
        });
    }

    if (els.lodPauseToggleEl) {
        els.lodPauseToggleEl.checked = Boolean(viewer.lodPaused);
        els.lodPauseToggleEl.addEventListener('change', (e) => {
            applyLodPauseTransition(viewer, e.target.checked);
            viewer.log?.(viewer.lodPaused ? 'LOD Updates PAUSED' : 'LOD Updates RESUMED', 'info');
        });
    }

    // --- Console panel: backfill from the ring buffer + copy button ---
    if (els.consoleOutputEl) {
        const buffer = Array.isArray(viewer.logBuffer) ? viewer.logBuffer : [];
        for (const entry of buffer) appendLogLine(els.consoleOutputEl, entry);
        els.consoleOutputEl.scrollTop = els.consoleOutputEl.scrollHeight;
    }

    if (els.copyLogBtnEl && els.consoleOutputEl) {
        const idleText = els.copyLogBtnEl.textContent || 'COPY';
        let resetHandle = null;
        els.copyLogBtnEl.addEventListener('click', async () => {
            const lines = Array.from(els.consoleOutputEl.querySelectorAll('.log-line'))
                .map(line => line.textContent.trim())
                .filter(Boolean);
            const text = lines.length ? lines.join('\n') : els.consoleOutputEl.textContent.trim();
            try {
                await viewer.writeClipboardText(text);
                els.copyLogBtnEl.textContent = 'COPIED';
                els.copyLogBtnEl.classList.add('copied');
            } catch (e) {
                els.copyLogBtnEl.textContent = 'FAILED';
                els.copyLogBtnEl.classList.remove('copied');
            }
            if (resetHandle) clearTimeout(resetHandle);
            resetHandle = setTimeout(() => {
                els.copyLogBtnEl.textContent = idleText;
                els.copyLogBtnEl.classList.remove('copied');
            }, 1200);
        });
    }

    return { root, els, bench };
}
