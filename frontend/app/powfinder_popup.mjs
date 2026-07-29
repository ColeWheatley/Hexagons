// PowFinder tap-a-hex info popup (design doc §3.4, task P2.4). Split the way
// loading_screen.mjs splits LoadingProgressModel/LoadingScreen: every byte-
// decoding and value-formatting rule lives in plain, DOM-free functions
// (fully covered by test/hex_pick.test.mjs); `PowfinderPopup` is the thin DOM
// binding on top, verified by browser screenshot per the task's acceptance
// criteria rather than unit-tested directly.
import { SIDECAR_NODATA, PYRAMID_NODE_COUNT } from './sidecar_format.mjs';

// The disclaimer is non-negotiable and non-dismissible (design doc §3.4:
// "This product sits next to a decision that can kill someone; the popup is
// the one place a user reads carefully"). It always renders, unconditionally.
export const DISCLAIMER_TEXT = 'Modeled from INCA + terrain. Not an avalanche forecast. Check lawinen.report.';

// index.json's declared physical domains for the two continuous layers
// (design doc §1.2). Duplicated here rather than threaded through from the
// (not-yet-built, P2.1) store, the same "small constant, source-cited"
// duplication tile_worker.js already uses for the sidecar pyramid offsets —
// test/hex_pick.test.mjs pins these against the checked-in fixture index.json.
export const SQH_DOMAIN = Object.freeze([0, 100]);
export const DEPTH_DOMAIN = Object.freeze([0, 500]);

// design doc §0.3: depth-4 / level-1 flat-to-flat is 16.93 m -- the sidecar's
// actual granularity, and what every popup reading describes regardless of
// which unit hex (6.4 m) was tapped (§7 non-goal: "Sub-L1 detail... this is
// correct and honest -- the model has no finer truth").
export const L1_CELL_SIZE_M = 17;

/**
 * Continuous-layer byte -> physical value (design doc §1.1 / sidecar_colormap.mjs
 * `continuousColorForByte`'s exact `f = (raw-1)/254` convention, reused here
 * so the popup's number and the map's pixel are computed from the same byte
 * the same way -- "the number and the pixel agree", §3.4).
 * @returns {number|null} null for NODATA / not-loaded.
 */
export function formatContinuousValue(raw, domain) {
    if (raw === null || raw === undefined || raw === SIDECAR_NODATA) return null;
    const f = (raw - 1) / 254;
    return domain[0] + f * (domain[1] - domain[0]);
}

// Binding contract errata (frontend-design ruling; see RESUME.md "Binding
// contract rulings" and the task brief's CONTRACT ERRATA, both of which
// supersede the original design doc's release/runout split):
//   avalanche byte = packed_bits { release: shift 7, bits 1 } + { severity:
//   shift 0, bits 7 }. `release` is a type flag, not a scalar: 1 selects the
//   "release" severity domain [1,127], 0 selects the "runout" domain [2,127].
//   Byte 0 = NODATA everywhere. Byte 1 is a real "simulated, no hazard" zero
//   reading (release=0, severity=1 -- one below the runout floor of 2, which
//   is exactly why byte 1 is carved out rather than being a valid runout
//   value). Raw 128 (release=1, severity=0 -- one below the release floor of
//   1) is a data-error sentinel at every pyramid level.
const AVALANCHE_RELEASE_MIN_SEVERITY = 1;
const AVALANCHE_RUNOUT_MIN_SEVERITY = 2;
const AVALANCHE_MAX_SEVERITY = 127;

/**
 * Decode one avalanche sidecar byte per the binding contract above.
 * @returns {null|{kind:'none'|'release'|'runout'|'error', severity:number, label:string}}
 *   null for NODATA (byte 0).
 */
export function decodeAvalancheByte(raw) {
    if (raw === null || raw === undefined || raw === SIDECAR_NODATA) return null;
    if (raw === 1) return { kind: 'none', severity: 0, label: 'no hazard (simulated)' };
    const release = (raw >> 7) & 1;
    const severity = raw & 0x7f;
    const kind = release ? 'release' : 'runout';
    const minSeverity = release ? AVALANCHE_RELEASE_MIN_SEVERITY : AVALANCHE_RUNOUT_MIN_SEVERITY;
    if (severity < minSeverity || severity > AVALANCHE_MAX_SEVERITY) {
        return { kind: 'error', severity, label: 'data error' };
    }
    return { kind, severity, label: `${kind} severity ${severity}` };
}

/**
 * Implements the `readAll(slot, address)` shape the design doc's P2.1 store
 * will expose (§6 P2.1: `readAll(slot, address)` -> `{sqh, depth, avalanche,
 * surface}`), against whichever raw per-tile pyramids are actually resident
 * on the caller's side right now. P2.1 lands its own store in parallel on a
 * different branch; until it merges, `pyramids` is whatever main.js's
 * PowFinder stopgap state has loaded (currently just `sqh`, per P1.3) --
 * a layer with no pyramid yet simply reads back null ("not loaded"), which
 * is exactly the popup's "-- with a tap-to-load affordance" state (§3.4).
 * Any real per-layer Uint8Array plugged in here later needs no interface
 * change, only a non-null entry in `pyramids`.
 *
 * @param {{pyramids: {sqh?, depth?, avalanche?, surface?}, slot: number|null, address: number}} args
 * @returns {{sqh:number|null, depth:number|null, avalanche:number|null, surface:number|null}}
 */
export function readAllLayers({ pyramids = {}, slot, address }) {
    const result = { sqh: null, depth: null, avalanche: null, surface: null };
    if (slot === null || slot === undefined || !Number.isInteger(address)) return result;
    for (const layerId of Object.keys(result)) {
        const pyramid = pyramids[layerId];
        if (!pyramid) continue; // this layer has no bytes loaded for the current timestamp
        const idx = slot * PYRAMID_NODE_COUNT + address;
        if (idx < 0 || idx >= pyramid.length) continue;
        const raw = pyramid[idx];
        result[layerId] = raw === SIDECAR_NODATA ? null : raw;
    }
    return result;
}

/**
 * Pure view-model assembly: raw pick data in, exactly what the DOM binding
 * should render out. Kept dependency-free so every formatting rule (unit
 * suffixes, the "susceptibility (beta)" framing, the bar fraction) is
 * covered by node:test without touching a DOM.
 *
 * @param {{elevationM:number, slopeDeg:number|null, layers:{sqh,depth,avalanche,surface}}} args
 */
export function buildPopupViewModel({ elevationM, slopeDeg, layers = {} }) {
    const sqhValue = formatContinuousValue(layers.sqh, SQH_DOMAIN);
    const depthValue = formatContinuousValue(layers.depth, DEPTH_DOMAIN);
    const avalanche = decodeAvalancheByte(layers.avalanche);
    // Surface class labels live in index.json's `classes` array (not fixture-
    // loaded by this task -- see task brief), so the popup shows the numeric
    // class id rather than guessing a label ordering that could disagree
    // with the backend's real one.
    const surfaceValue = (layers.surface === null || layers.surface === undefined) ? null : layers.surface;

    return {
        elevationM: Number.isFinite(elevationM) ? Math.round(elevationM) : null,
        slopeDeg: Number.isFinite(slopeDeg) ? Math.round(slopeDeg) : null,
        cellSizeM: L1_CELL_SIZE_M,
        rows: [
            {
                id: 'sqh',
                label: 'Snow quality',
                text: sqhValue == null ? null : `${Math.round(sqhValue)}`,
                barFraction: sqhValue == null ? null : Math.max(0, Math.min(1, sqhValue / SQH_DOMAIN[1])),
            },
            {
                id: 'depth',
                label: 'Snow depth',
                text: depthValue == null ? null : `${Math.round(depthValue)} cm`,
                barFraction: null,
            },
            {
                // "susceptibility (beta)", never "forecast" -- binding contract.
                id: 'avalanche',
                label: 'Avalanche susceptibility (beta)',
                text: avalanche ? avalanche.label : null,
                barFraction: null,
            },
            {
                id: 'surface',
                label: 'Surface',
                text: surfaceValue == null ? null : `class ${surfaceValue}`,
                barFraction: null,
            },
        ],
    };
}

/**
 * Thin DOM binding: bottom sheet on mobile, anchored card at >=768px (sizing
 * lives in powfinder_popup.css). Builds its internal structure once against
 * the pre-landed `#powfinder-popup` mount (index.html, `data-owner="P2.4"`,
 * ships `hidden` -- reveal is always `el.hidden = false` in JS, never a CSS
 * display rule, per the mount's own contract comment).
 */
export class PowfinderPopup {
    constructor({ document, mount, onClose } = {}) {
        if (!document || !mount) throw new Error('PowfinderPopup requires { document, mount }');
        this.document = document;
        this.mount = mount;
        this.onClose = typeof onClose === 'function' ? onClose : null;
        this._build();
    }

    _build() {
        const doc = this.document;
        this.mount.textContent = '';
        this.mount.classList.add('glass-panel', 'powfinder-popup');
        this.mount.setAttribute('role', 'dialog');
        this.mount.setAttribute('aria-label', 'PowFinder cell details');
        this.mount.setAttribute('aria-hidden', 'true');

        const handle = doc.createElement('div');
        handle.className = 'powfinder-popup__handle';
        handle.setAttribute('aria-hidden', 'true');

        const closeBtn = doc.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'powfinder-popup__close';
        closeBtn.textContent = '✕';
        closeBtn.setAttribute('aria-label', 'Close cell details');
        closeBtn.addEventListener('click', () => this.hide());

        const summary = doc.createElement('div');
        summary.className = 'powfinder-popup__summary';

        const rows = doc.createElement('div');
        rows.className = 'powfinder-popup__rows';

        const meta = doc.createElement('div');
        meta.className = 'powfinder-popup__meta';

        const disclaimer = doc.createElement('p');
        disclaimer.className = 'powfinder-popup__disclaimer';
        disclaimer.textContent = DISCLAIMER_TEXT;

        this.mount.append(handle, closeBtn, summary, rows, meta, disclaimer);
        this._els = { summary, rows, meta, disclaimer };

        // Drag-down-to-dismiss (design doc §3.4: "Sheet dismisses on
        // drag-down, X, map pan, or Escape" -- the pan/Escape cases are
        // wired by main.js's own additional listeners, since those are
        // global gestures the popup's own DOM subtree cannot see).
        let dragStartY = null;
        handle.addEventListener('pointerdown', (event) => { dragStartY = event.clientY; }, { passive: true });
        this.mount.addEventListener('pointermove', (event) => {
            if (dragStartY === null) return;
            if (event.clientY - dragStartY > 60) { dragStartY = null; this.hide(); }
        }, { passive: true });
        const clearDrag = () => { dragStartY = null; };
        this.mount.addEventListener('pointerup', clearDrag, { passive: true });
        this.mount.addEventListener('pointercancel', clearDrag, { passive: true });
    }

    /** @param {ReturnType<typeof buildPopupViewModel>} viewModel */
    show(viewModel) {
        const { summary, rows, disclaimer } = this._els;

        const parts = [];
        if (viewModel.elevationM != null) parts.push(`${viewModel.elevationM.toLocaleString()} m`);
        if (viewModel.slopeDeg != null) parts.push(`${viewModel.slopeDeg}°`);
        parts.push(`~${viewModel.cellSizeM} m cell`);
        summary.textContent = parts.join('  ·  ');

        rows.textContent = '';
        for (const row of viewModel.rows) {
            const rowEl = this.document.createElement('div');
            rowEl.className = 'powfinder-popup__row';

            const label = this.document.createElement('span');
            label.className = 'powfinder-popup__row-label';
            label.textContent = row.label;

            const value = this.document.createElement('span');
            value.className = 'powfinder-popup__row-value';
            value.textContent = row.text == null ? '—' : row.text;
            if (row.text == null) value.classList.add('powfinder-popup__row-value--empty');

            rowEl.append(label, value);

            if (row.barFraction != null) {
                const bar = this.document.createElement('div');
                bar.className = 'powfinder-popup__row-bar';
                const fill = this.document.createElement('div');
                fill.className = 'powfinder-popup__row-bar-fill';
                fill.style.width = `${Math.round(row.barFraction * 100)}%`;
                bar.appendChild(fill);
                rowEl.appendChild(bar);
            }

            rows.appendChild(rowEl);
        }

        disclaimer.textContent = DISCLAIMER_TEXT;

        this.mount.hidden = false;
        this.mount.setAttribute('aria-hidden', 'false');
    }

    hide() {
        if (this.mount.hidden) return;
        this.mount.hidden = true;
        this.mount.setAttribute('aria-hidden', 'true');
        if (this.onClose) this.onClose();
    }

    isVisible() {
        return this.mount.hidden !== true;
    }
}
