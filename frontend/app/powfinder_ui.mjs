// PowFinder layer picker, legend, and beta labeling (design doc §6 P2.2,
// §3.1/§3.2/§3.5/§3.6). Owns exactly three mount points in index.html
// (created by [fe:prep], never edited by this task): #powfinder-layers,
// #powfinder-legend (nested inside the pre-existing `.legend` panel), and
// #powfinder-intro. #powfinder-dock is shared with P2.3 (the time bar) --
// see mountPowfinderUi()'s comment on why this module never force-hides it.
//
// No direct viewer access: this module only ever talks to a controller
// object shaped `{ layers, getLayer(), setLayer(id), onLayerChange(cb) }`.
// `layers` must be the already-filtered, pickable array (`index.json`'s
// `layers`, i.e. sqh/depth/avalanche/surface as shipped) -- never
// `index.json`'s separate `engineLayers` array (engine-internal ids like
// slab/hn24/hn72/wet/sdens; those must never reach a picker).
//
// Split deliberately into pure, jsdom-free HTML-string builders (testable
// under plain `node --test`, no DOM) and a single DOM-touching
// `mountPowfinderUi()` that wires them to real elements + the controller.
// This mirrors sidecar_colormap.mjs's data-in/string-out shape, which this
// module is the direct consumer of for the legend.

import { rampStops } from './sidecar_colormap.mjs';

export const OFF_LAYER_ID = 'off';
export const STEEPNESS_LAYER_ID = 'steepness';

const INTRO_SEEN_STORAGE_KEY = 'powfinder.introSeen.v1';

// TODO(P2.5 coordination): §3.6 item 5 asks for this to persist through the
// shared view_persistence.js envelope (`sanitizePublicSettings` +
// `pfIntroSeen`). That file is P2.5's, not in this task's file list, so this
// uses its own dedicated localStorage key instead of editing someone else's
// module out of turn. Behavior is identical from the user's perspective
// (seen once, remembered); migrating the key into the shared envelope later
// is a two-line change confined to readIntroSeen()/markIntroSeen() below.
function readIntroSeen(storage) {
    try {
        return storage?.getItem(INTRO_SEEN_STORAGE_KEY) === '1';
    } catch {
        return false; // storage inaccessible (private browsing, disabled) -> always re-show, never crash
    }
}

function markIntroSeen(storage) {
    try {
        storage?.setItem(INTRO_SEEN_STORAGE_KEY, '1');
    } catch {
        // best-effort; a user with storage disabled just sees the sheet again next visit
    }
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[ch]));
}

/**
 * Ordered pill descriptors: the backend-shipped layers (in `layers` order,
 * `layers` == index.json's `layers` array, already filtered to the
 * pickable set), then the always-available synthesized STEEP pill (existing
 * slope gradient, `uGradientMode=1, uSidecarMode=0` -- "zero new rendering
 * code", §3.2), then the always-available OFF pill (pure aerial). A layer
 * the backend has not shipped simply is not in `layers` and so does not
 * appear (§3.2).
 */
export function pillList(layers) {
    const real = Array.isArray(layers) ? layers : [];
    return [
        ...real.map(l => ({
            id: l.id,
            short: l.short || String(l.id).toUpperCase(),
            label: l.label || l.id,
        })),
        { id: STEEPNESS_LAYER_ID, short: 'STEEP', label: 'Steepness' },
        { id: OFF_LAYER_ID, short: '✕', label: 'Off' },
    ];
}

/**
 * innerHTML for #powfinder-layers: a horizontally-scrollable row of pill
 * buttons, `aria-pressed` reflecting `activeId`. `loadingIds` (a Set) marks
 * pills whose bytes are not yet loaded for the current timestamp with a 2px
 * indeterminate pink bar (§3.2) -- tapping is never blocked, so the pill
 * stays a live button regardless.
 */
export function layerPickerHtml(layers, activeId, { loadingIds } = {}) {
    const pills = pillList(layers);
    const loading = loadingIds instanceof Set ? loadingIds : new Set();
    const buttons = pills.map(p => {
        const pressed = p.id === activeId;
        const isLoading = loading.has(p.id);
        return (
            `<button type="button" class="pf-pill${pressed ? ' pf-pill-active' : ''}" ` +
            `data-layer-id="${escapeHtml(p.id)}" aria-pressed="${pressed}" aria-label="${escapeHtml(p.label)}">` +
            `<span class="pf-pill-label">${escapeHtml(p.short)}</span>` +
            (isLoading ? '<span class="pf-pill-loading" aria-hidden="true"></span>' : '') +
            '</button>'
        );
    }).join('');
    return `<div class="pf-pill-row" role="group" aria-label="Map layer">${buttons}</div>`;
}

// Every hex colour in a categorical rampStops().css string appears as an
// adjacent duplicate pair (`#hex at%, #hex at%`), one pair per class, in
// class order -- see sidecar_colormap.mjs's categoricalCss(). Reading every
// other match recovers the per-class colours without sidecar_colormap.mjs
// needing to grow a second return shape just for this legend's swatches.
function categoricalSwatchColors(css) {
    const hexes = css.match(/#[0-9a-fA-F]{6}/g) || [];
    return hexes.filter((_, i) => i % 2 === 0);
}

// Layer ids whose legend footer must say so explicitly, not "modeled ·
// beta" -- this sits next to a decision that can hurt someone (§3.4's
// disclaimer principle applies to the legend too, not only the popup).
const NOT_A_FORECAST_LAYER_IDS = new Set(['avalanche']);

/**
 * innerHTML for #powfinder-legend, or '' when there is nothing to show:
 * the active layer is STEEP (the pre-existing static `.legend-item` rows
 * already cover it and are not owned by this module -- see the P2.2 report
 * for why they are left untouched rather than hidden), OFF, or PowFinder is
 * disabled (`layers` empty). Content and colours come from `rampStops()`
 * only, so this can never drift from the shader (§2.5's stated purpose for
 * that function).
 */
export function legendHtml(layers, activeId) {
    if (!activeId || activeId === STEEPNESS_LAYER_ID || activeId === OFF_LAYER_ID) return '';
    const layer = (Array.isArray(layers) ? layers : []).find(l => l.id === activeId);
    if (!layer) return '';

    const stops = rampStops(layer.ramp || layer.id);
    const footer = NOT_A_FORECAST_LAYER_IDS.has(layer.id) ? 'modeled · not a forecast' : 'modeled · beta';
    const header = `<div class="legend-item pf-legend-header">${escapeHtml((layer.label || layer.id).toUpperCase())}</div>`;

    let body;
    if (!stops.categorical) {
        // Continuous ramps (sqh/depth) always carry exactly two ticks (the
        // domain's start/end labels, e.g. "poor"/"good") per
        // sidecar_colormap.mjs's RAMP_DEFS -- a plain flex row suffices.
        const [lo, hi] = stops.ticks;
        body =
            `<div class="pf-legend-bar" style="background:${stops.css};"></div>` +
            `<div class="pf-legend-ticks"><span>${escapeHtml(lo?.label ?? '')}</span><span>${escapeHtml(hi?.label ?? '')}</span></div>`;
    } else {
        const colors = categoricalSwatchColors(stops.css);
        const rows = stops.ticks.map((t, i) => (
            `<div class="legend-item pf-legend-swatch-row">` +
            `<div class="swatch" style="background:${colors[i] || '#888'};"></div>${escapeHtml(t.label)}` +
            '</div>'
        )).join('');
        const runoutNote = layer.id === 'avalanche'
            ? '<div class="legend-item pf-legend-note">▨ = runout zone</div>'
            : '';
        body = `<div class="pf-legend-swatches">${rows}</div>${runoutNote}`;
    }

    return `${header}${body}<div class="legend-item pf-legend-footer">${footer}</div>`;
}

/** innerHTML for #powfinder-intro, the first-run beta sheet (§3.6 item 5). */
export function introSheetHtml() {
    return (
        '<div class="pf-sheet-backdrop"></div>' +
        '<div class="pf-sheet glass-panel" role="dialog" aria-modal="true" aria-labelledby="pf-intro-title">' +
        '<div class="pf-sheet-header" id="pf-intro-title">PowFinder <span class="beta-pill">BETA</span></div>' +
        '<p>Modeled snow conditions for the Stubai region, updated hourly, on a 17-metre hexagon grid.</p>' +
        '<p>This is a physics model, not an observation and not an avalanche bulletin. ' +
        'It has never been validated in the field. Do not make terrain decisions from it.</p>' +
        '<p>Always check <a href="https://lawinen.report" target="_blank" rel="noopener noreferrer">lawinen.report</a>.</p>' +
        '<button type="button" class="pf-btn-primary" id="pf-intro-dismiss">I understand</button>' +
        '</div>'
    );
}

function mountIntroSheet(introEl, { doc, storage, vibrate, disabled }) {
    if (disabled || readIntroSeen(storage)) {
        introEl.hidden = true;
        return;
    }
    introEl.innerHTML = introSheetHtml();
    introEl.setAttribute('aria-hidden', 'false');
    introEl.hidden = false;

    const dismiss = () => {
        markIntroSeen(storage);
        vibrate(8);
        introEl.hidden = true;
        introEl.setAttribute('aria-hidden', 'true');
        introEl.innerHTML = '';
        doc.removeEventListener('keydown', onKeydown);
    };
    const onKeydown = e => { if (e.key === 'Escape') dismiss(); };

    introEl.querySelector('#pf-intro-dismiss')?.addEventListener('click', dismiss);
    doc.addEventListener('keydown', onKeydown);
    introEl.querySelector('#pf-intro-dismiss')?.focus();
}

/**
 * Wire the layer picker, legend, and first-run sheet to real DOM and a
 * controller. `controller` is `{ layers, getLayer(), setLayer(id),
 * onLayerChange(cb) }` -- see the module header. Returns `{ destroy,
 * setLayerLoading(id, bool) }`; the latter is this module's own explicit
 * hook for the §3.2 per-pill loading bar, since the controller interface as
 * specified carries no loading-state signal -- a future store integration
 * calls it directly rather than this module inferring loading state itself.
 *
 * #powfinder-dock visibility: this function only ever *reveals* the shared
 * dock (`dock.hidden = false`) when this module has real content, and never
 * force-hides it. #powfinder-dock is shared with P2.3's time bar, which may
 * have its own independent reason to be visible; only additive changes to a
 * shared element are safe without a coordinating integration point.
 */
export function mountPowfinderUi(controller, {
    doc = (typeof document !== 'undefined' ? document : null),
    storage = (typeof window !== 'undefined' ? window.localStorage : null),
    vibrate = (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function')
        ? ms => navigator.vibrate(ms) : () => {},
} = {}) {
    if (!doc) throw new Error('powfinder_ui: mountPowfinderUi requires a document');

    const dock = doc.getElementById('powfinder-dock');
    const layersEl = doc.getElementById('powfinder-layers');
    const legendEl = doc.getElementById('powfinder-legend');
    const introEl = doc.getElementById('powfinder-intro');
    if (!dock || !layersEl || !legendEl || !introEl) {
        console.warn('[powfinder_ui] required mount point(s) missing; PowFinder UI disabled');
        return { destroy() {}, setLayerLoading() {} };
    }

    const layers = Array.isArray(controller?.layers) ? controller.layers : [];
    const hasLayers = layers.length > 0;
    const loadingIds = new Set();
    let currentActiveId = OFF_LAYER_ID;

    function render(activeId) {
        currentActiveId = activeId;
        layersEl.innerHTML = layerPickerHtml(layers, activeId, { loadingIds });
        const legend = legendHtml(layers, activeId);
        legendEl.innerHTML = legend;
        legendEl.hidden = legend === '';
    }

    function onClick(e) {
        const btn = e.target.closest?.('.pf-pill');
        if (!btn || !layersEl.contains(btn)) return;
        vibrate(8);
        controller.setLayer(btn.dataset.layerId);
    }

    let unsubscribe;
    if (hasLayers) {
        // index.json disabled -> "the whole [layer] bar is hidden and the
        // app still renders terrain" (§5.6 self-disable table; this is the
        // literal P2.2 acceptance scenario). See the JSDoc above on why
        // `dock` is only ever revealed here, never hidden.
        dock.hidden = false;
        layersEl.hidden = false;
        layersEl.setAttribute('role', 'group');
        layersEl.setAttribute('aria-label', 'Map layer');
        layersEl.addEventListener('click', onClick);

        const initial = typeof controller.getLayer === 'function' ? controller.getLayer() : OFF_LAYER_ID;
        render(initial || OFF_LAYER_ID);

        if (typeof controller.onLayerChange === 'function') {
            unsubscribe = controller.onLayerChange(id => render(id));
        }
    } else {
        layersEl.hidden = true;
        legendEl.hidden = true;
        legendEl.innerHTML = '';
    }

    mountIntroSheet(introEl, { doc, storage, vibrate, disabled: !hasLayers });

    return {
        destroy() {
            layersEl.removeEventListener('click', onClick);
            if (typeof unsubscribe === 'function') unsubscribe();
        },
        setLayerLoading(id, isLoading) {
            if (isLoading) loadingIds.add(id); else loadingIds.delete(id);
            if (hasLayers) render(currentActiveId);
        },
    };
}
