import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
    TAP_MAX_DIST_PX,
    TAP_MAX_DURATION_MS,
    isTapGesture,
    pickGroundCell,
    resolveHexAddress,
    hexRingPositions,
} from '../hex_pick.mjs';
import {
    DISCLAIMER_TEXT,
    SQH_DOMAIN,
    DEPTH_DOMAIN,
    L1_CELL_SIZE_M,
    formatContinuousValue,
    decodeAvalancheByte,
    readAllLayers,
    buildPopupViewModel,
    PowfinderPopup,
} from '../powfinder_popup.mjs';
import { PYRAMID_NODE_COUNT, pyramidAddress, UNIT_DEPTH } from '../sidecar_format.mjs';

const main = readFileSync(fileURLToPath(new URL('../main.js', import.meta.url)), 'utf8');
// gosper_visibility_adapter.js uses `import`/`export` syntax under this
// package's "type": "commonjs" -- like main.js and tile_worker.js, it can't
// be `import`ed directly from a .mjs test (Node's CJS/ESM interop can only
// synthesize named exports it can statically detect, and flakes on this
// file's mix of class + const exports). Every other test in this repo that
// touches a plain-.js module either reads it as text (slope_shader_bins,
// sidecar_shader, sidecar_address's text-invariant half) or loads it as a
// classic vm script when it has zero import/export statements of its own
// (tile_worker.js, in sidecar_address's execution half) -- this file has
// import/export, so it follows the text-invariant path.
const adapterSrc = readFileSync(fileURLToPath(new URL('../gosper_visibility_adapter.js', import.meta.url)), 'utf8');

// -----------------------------------------------------------------------
// isTapGesture — gesture discipline (design doc §3.4)
// -----------------------------------------------------------------------

test('isTapGesture accepts a small, quick pointerdown->pointerup pair', () => {
    assert.equal(isTapGesture({ dx: 0, dy: 0, durationMs: 0 }), true);
    assert.equal(isTapGesture({ dx: 3, dy: 4, durationMs: 150 }), true); // hypot=5
    assert.equal(isTapGesture({ dx: TAP_MAX_DIST_PX, dy: 0, durationMs: TAP_MAX_DURATION_MS }), true);
});

test('isTapGesture rejects drags over 8px or holds over 300ms', () => {
    assert.equal(isTapGesture({ dx: 9, dy: 0, durationMs: 50 }), false);
    assert.equal(isTapGesture({ dx: 6, dy: 6, durationMs: 50 }), false); // hypot ~8.49 > 8
    assert.equal(isTapGesture({ dx: 0, dy: 0, durationMs: 301 }), false);
    assert.equal(isTapGesture({ dx: 100, dy: 100, durationMs: 1000 }), false);
});

test('isTapGesture rejects non-finite or negative-duration input', () => {
    assert.equal(isTapGesture({ dx: NaN, dy: 0, durationMs: 0 }), false);
    assert.equal(isTapGesture({ dx: 0, dy: 0, durationMs: -5 }), false);
});

// -----------------------------------------------------------------------
// pickGroundCell — iterated ground-plane solve (design doc §3.4)
// -----------------------------------------------------------------------

function normalize(v) {
    const len = Math.hypot(v.x, v.y, v.z);
    return { x: v.x / len, y: v.y / len, z: v.z / len };
}

test('pickGroundCell is a no-op single sample in 2D (heightFactor = 0)', () => {
    const ray = { origin: { x: 10, y: 500, z: -40 }, direction: normalize({ x: 0.2, y: -1, z: 0.1 }) };
    let calls = 0;
    const result = pickGroundCell({
        ray,
        sampleElevation: (x, z) => { calls++; return { sourceElevation: 1234, wx: x, wy: z }; },
        floor: 0,
        heightFactor: 0,
    });
    assert.ok(result);
    // planeY stays 0 on every iteration, so every sample lands at the same
    // (x, z) -- the "loop is a no-op" invariant the design doc calls for.
    const t = (0 - ray.origin.y) / ray.direction.y;
    assert.ok(Math.abs(result.wx - (ray.origin.x + ray.direction.x * t)) < 1e-9);
    assert.ok(Math.abs(result.wy - (ray.origin.z + ray.direction.z * t)) < 1e-9);
    assert.equal(calls, 3); // still iterates (design doc: 3 samples total), just converges instantly
});

test('pickGroundCell converges within 3 iterations to < 1 unit-hex (6.4m) error on synthetic 45deg terrain', () => {
    // Synthetic terrain: elevation(x, z) = slope * x, slope = -1 -> a plane
    // tilted exactly 45 degrees (dElevation/dx = 1 in magnitude), independent
    // of z, matching the acceptance criterion's "synthetic 45 degree terrain"
    // wording directly.
    const slope = -1;
    const floor = 0;
    const heightFactor = 1; // full 3D piston raise
    const sampleElevation = (x, z) => ({ sourceElevation: slope * x, wx: x, wy: z });

    const origin = { x: 50, y: 120, z: 80 };
    const direction = normalize({ x: -0.5, y: -1.0, z: -0.6 });

    // Analytic ground truth: intersect the ray with the exact plane
    // y = slope * x (floor=0, heightFactor=1 so scene Y == elevation).
    const denom = direction.y - slope * direction.x;
    const tTrue = (slope * origin.x - origin.y) / denom;
    assert.ok(tTrue > 0, 'test fixture sanity: plane must be in front of the ray');
    const trueX = origin.x + tTrue * direction.x;
    const trueZ = origin.z + tTrue * direction.z;

    const result = pickGroundCell({ ray: { origin, direction }, sampleElevation, floor, heightFactor, iterations: 3 });
    assert.ok(result, 'pick must converge, not bail out');
    const error = Math.hypot(result.wx - trueX, result.wy - trueZ);
    assert.ok(error < 6.4, `pick error ${error.toFixed(3)}m must be under one unit-hex width (6.4m)`);
});

test('pickGroundCell returns null when the ray looks up or is horizontal', () => {
    const sampleElevation = (x, z) => ({ sourceElevation: 0, wx: x, wy: z });
    assert.equal(pickGroundCell({
        ray: { origin: { x: 0, y: 100, z: 0 }, direction: { x: 0, y: 0.5, z: -0.5 } },
        sampleElevation, floor: 0, heightFactor: 1,
    }), null);
    assert.equal(pickGroundCell({
        ray: { origin: { x: 0, y: 100, z: 0 }, direction: { x: 1, y: 0, z: 0 } },
        sampleElevation, floor: 0, heightFactor: 1,
    }), null);
});

test('pickGroundCell returns null off-DEM (no elevation under the cursor)', () => {
    const result = pickGroundCell({
        ray: { origin: { x: 0, y: 100, z: 0 }, direction: normalize({ x: 0, y: -1, z: 0.1 }) },
        sampleElevation: () => ({ sourceElevation: undefined }),
        floor: 0,
        heightFactor: 1,
    });
    assert.equal(result, null);
});

// -----------------------------------------------------------------------
// resolveHexAddress — axial -> tile -> unit -> L1 pyramid address (§3.4)
// -----------------------------------------------------------------------

function unitKey(dq, dr) { return ((dq + 128) << 8) | (dr + 128); }

test('resolveHexAddress resolves a tapped axial cell to its L1 pyramid address', () => {
    const tiles = new Map([['5_9', { center: { q: 100, r: 200 } }]]);
    const unitIndexMap = new Map([[unitKey(7, 3), 42]]);
    const result = resolveHexAddress({
        axial: { q: 107, r: 203 },
        tq: 5, tr: 9,
        tiles, unitIndexMap,
        atlasSlotFor: (key) => (key === '5_9' ? 12 : null),
    });
    assert.deepEqual(result, {
        tileKey: '5_9',
        unitIdx: 42,
        l1Index: 6, // (42/7)|0
        address: pyramidAddress(UNIT_DEPTH, 42), // == 406
        slot: 12,
    });
    assert.equal(result.address, 406);
});

test('resolveHexAddress returns null for an unresolvable tile, unit, or bad input', () => {
    const tiles = new Map([['5_9', { center: { q: 100, r: 200 } }]]);
    const unitIndexMap = new Map([[unitKey(7, 3), 42]]);
    // tile not resident
    assert.equal(resolveHexAddress({ axial: { q: 1, r: 1 }, tq: 99, tr: 99, tiles, unitIndexMap }), null);
    // resident tile, but this axial cell has no unit index (e.g. off-DEM gap)
    assert.equal(resolveHexAddress({ axial: { q: 999, r: 999 }, tq: 5, tr: 9, tiles, unitIndexMap }), null);
    // malformed axial
    assert.equal(resolveHexAddress({ axial: { q: 1.5, r: 1 }, tq: 5, tr: 9, tiles, unitIndexMap }), null);
    assert.equal(resolveHexAddress({ axial: null, tq: 5, tr: 9, tiles, unitIndexMap }), null);
});

test('resolveHexAddress defaults slot to null without an atlasSlotFor callback', () => {
    const tiles = new Map([['5_9', { center: { q: 100, r: 200 } }]]);
    const unitIndexMap = new Map([[unitKey(0, 0), 0]]);
    const result = resolveHexAddress({ axial: { q: 100, r: 200 }, tq: 5, tr: 9, tiles, unitIndexMap });
    assert.equal(result.slot, null);
    assert.equal(result.unitIdx, 0);
    assert.equal(result.l1Index, 0);
});

// -----------------------------------------------------------------------
// hexRingPositions — highlight ring geometry (§3.4)
// -----------------------------------------------------------------------

test('hexRingPositions produces 6 flat-top corners at the given radius, y=0', () => {
    const positions = hexRingPositions({ centerX: 5, centerZ: -3, radius: 10 });
    assert.equal(positions.length, 18);
    // Float32Array-backed (matches THREE.Float32BufferAttribute's storage),
    // so tolerances are float32-precision (~1e-6 relative), not float64.
    const EPS = 1e-3;
    // Vertex 0 sits on local +X (East) from centre, matching createHexGeometry's
    // CircleGeometry(radius, 6) convention (main.js comment: "Vert 0: (1,0,0) -> East").
    assert.ok(Math.abs(positions[0] - 15) < EPS); // centerX + radius
    assert.ok(Math.abs(positions[1] - 0) < EPS);
    assert.ok(Math.abs(positions[2] - (-3)) < EPS); // centerZ
    for (let i = 0; i < 6; i++) {
        const dx = positions[i * 3] - 5;
        const dz = positions[i * 3 + 2] - (-3);
        assert.ok(Math.abs(positions[i * 3 + 1]) < EPS, 'ring is flat (y=0)');
        assert.ok(Math.abs(Math.hypot(dx, dz) - 10) < EPS, `vertex ${i} must sit exactly at the ring radius`);
    }
});

// -----------------------------------------------------------------------
// formatContinuousValue — byte -> physical domain value (§1.1/§1.2)
// -----------------------------------------------------------------------

test('formatContinuousValue maps the 1..255 byte domain onto the physical domain', () => {
    assert.equal(formatContinuousValue(0, SQH_DOMAIN), null); // NODATA
    assert.equal(formatContinuousValue(null, SQH_DOMAIN), null);
    assert.ok(Math.abs(formatContinuousValue(1, SQH_DOMAIN) - 0) < 1e-9);
    assert.ok(Math.abs(formatContinuousValue(255, SQH_DOMAIN) - 100) < 1e-9);
    assert.ok(Math.abs(formatContinuousValue(1, DEPTH_DOMAIN) - 0) < 1e-9);
    assert.ok(Math.abs(formatContinuousValue(255, DEPTH_DOMAIN) - 500) < 1e-9);
    // Midpoint sanity, same (raw-1)/254 convention as sidecar_colormap.mjs's
    // continuousColorForByte -- "the number and the pixel agree".
    const mid = formatContinuousValue(128, SQH_DOMAIN);
    assert.ok(mid > 49 && mid < 51, `expected ~50, got ${mid}`);
});

// -----------------------------------------------------------------------
// decodeAvalancheByte — binding contract errata decode
// -----------------------------------------------------------------------

test('decodeAvalancheByte: NODATA and the simulated-no-hazard sentinel', () => {
    assert.equal(decodeAvalancheByte(0), null);
    assert.equal(decodeAvalancheByte(null), null);
    const none = decodeAvalancheByte(1);
    assert.equal(none.kind, 'none');
    assert.match(none.label, /no hazard/);
});

test('decodeAvalancheByte: raw 128 is the data-error sentinel at every level', () => {
    const err = decodeAvalancheByte(128); // release=1 (bit7), severity=0 -- below the release floor of 1
    assert.equal(err.kind, 'error');
});

test('decodeAvalancheByte: release bit selects the [1,127] domain, unset selects runout [2,127]', () => {
    const release = decodeAvalancheByte(128 + 50); // release=1, severity=50
    assert.equal(release.kind, 'release');
    assert.equal(release.severity, 50);

    const runout = decodeAvalancheByte(50); // release=0, severity=50
    assert.equal(runout.kind, 'runout');
    assert.equal(runout.severity, 50);

    // Domain extremes: release's floor is severity=1 (raw 129), runout's is
    // severity=2 (raw 2) -- both real, both reachable only via those exact bytes.
    assert.equal(decodeAvalancheByte(129).kind, 'release');
    assert.equal(decodeAvalancheByte(129).severity, 1);
    assert.equal(decodeAvalancheByte(2).kind, 'runout');
    assert.equal(decodeAvalancheByte(2).severity, 2);
    assert.equal(decodeAvalancheByte(255).severity, 127); // release max
});

// -----------------------------------------------------------------------
// readAllLayers — the store's readAll(slot, address) shape (§6 P2.1 signature)
// -----------------------------------------------------------------------

test('readAllLayers reads the right byte for (slot, address) and treats NODATA as null', () => {
    const tileCount = 3;
    const sqh = new Uint8Array(tileCount * PYRAMID_NODE_COUNT);
    sqh[2 * PYRAMID_NODE_COUNT + 406] = 77;
    sqh[2 * PYRAMID_NODE_COUNT + 407] = 0; // NODATA
    const result = readAllLayers({ pyramids: { sqh }, slot: 2, address: 406 });
    assert.equal(result.sqh, 77);
    assert.equal(result.depth, null); // no pyramid loaded for this layer
    assert.equal(result.avalanche, null);
    assert.equal(result.surface, null);

    const nodataResult = readAllLayers({ pyramids: { sqh }, slot: 2, address: 407 });
    assert.equal(nodataResult.sqh, null);
});

test('readAllLayers is all-null with no slot (tile not in the atlas yet)', () => {
    const sqh = new Uint8Array(PYRAMID_NODE_COUNT);
    const result = readAllLayers({ pyramids: { sqh }, slot: null, address: 5 });
    assert.deepEqual(result, { sqh: null, depth: null, avalanche: null, surface: null });
});

// -----------------------------------------------------------------------
// buildPopupViewModel — pure row shaping + the required beta labeling
// -----------------------------------------------------------------------

test('buildPopupViewModel labels avalanche as susceptibility (beta), never forecast', () => {
    const vm = buildPopupViewModel({
        elevationM: 2411.6, slopeDeg: 37.6,
        layers: { sqh: 216, depth: 128, avalanche: 128 + 60, surface: null },
    });
    assert.equal(vm.elevationM, 2412);
    assert.equal(vm.slopeDeg, 38);
    assert.equal(vm.cellSizeM, L1_CELL_SIZE_M);

    const avalancheRow = vm.rows.find(r => r.id === 'avalanche');
    assert.match(avalancheRow.label, /susceptibility \(beta\)/);
    assert.doesNotMatch(avalancheRow.label.toLowerCase(), /forecast/);
    assert.doesNotMatch(avalancheRow.text.toLowerCase(), /forecast/);
    assert.match(avalancheRow.text, /release/);

    const sqhRow = vm.rows.find(r => r.id === 'sqh');
    assert.ok(sqhRow.barFraction > 0 && sqhRow.barFraction <= 1);

    const surfaceRow = vm.rows.find(r => r.id === 'surface');
    assert.equal(surfaceRow.text, null); // layers.surface was null -> "not loaded"
});

test('buildPopupViewModel renders "—" (null text) for layers with no data, never fabricates zero', () => {
    const vm = buildPopupViewModel({ elevationM: 1000, slopeDeg: null, layers: {} });
    for (const row of vm.rows) {
        assert.equal(row.text, null);
    }
    assert.equal(vm.slopeDeg, null);
});

test('the disclaimer text is present verbatim and mentions it is not a forecast', () => {
    assert.match(DISCLAIMER_TEXT, /not an avalanche forecast/i);
    assert.match(DISCLAIMER_TEXT, /lawinen\.report/);
});

// -----------------------------------------------------------------------
// PowfinderPopup — thin DOM binding, exercised against a minimal fake DOM
// (this repo has no jsdom dependency; loading_screen.mjs's model/binding
// split is the precedent for keeping the DOM layer this thin).
// -----------------------------------------------------------------------

function makeFakeElement(tag) {
    const el = {
        tagName: tag,
        _attrs: {},
        _children: [],
        style: {},
        hidden: undefined,
        _listeners: {},
        classList: {
            _set: new Set(),
            add(...names) { names.forEach(n => this._set.add(n)); },
            contains(n) { return this._set.has(n); },
        },
        setAttribute(name, value) { this._attrs[name] = String(value); },
        getAttribute(name) { return this._attrs[name]; },
        addEventListener(type, fn) { (el._listeners[type] ||= []).push(fn); },
        append(...children) { children.forEach(c => el.appendChild(c)); },
        appendChild(child) { el._children.push(child); return child; },
        get textContent() { return el._text || ''; },
        set textContent(value) { el._text = value; el._children = []; },
    };
    return el;
}

function makeFakeDocument() {
    return { createElement: (tag) => makeFakeElement(tag) };
}

test('PowfinderPopup.show reveals the mount, sets aria-hidden=false, and always renders the disclaimer', () => {
    const doc = makeFakeDocument();
    const mount = makeFakeElement('div');
    mount.hidden = true; // mirrors index.html's pre-landed `hidden` mount
    const popup = new PowfinderPopup({ document: doc, mount });

    assert.equal(mount.getAttribute('role'), 'dialog');
    assert.equal(mount.getAttribute('aria-hidden'), 'true');
    assert.equal(popup.isVisible(), false);

    const vm = buildPopupViewModel({ elevationM: 2000, slopeDeg: 20, layers: { sqh: 128 } });
    popup.show(vm);

    assert.equal(mount.hidden, false);
    assert.equal(mount.getAttribute('aria-hidden'), 'false');
    assert.equal(popup.isVisible(), true);
    assert.match(mount._children.map(c => c.textContent).join(' '), /Modeled from INCA/);
});

test('PowfinderPopup.hide re-hides the mount and fires onClose', () => {
    const doc = makeFakeDocument();
    const mount = makeFakeElement('div');
    mount.hidden = true;
    let closed = 0;
    const popup = new PowfinderPopup({ document: doc, mount, onClose: () => { closed++; } });
    popup.show(buildPopupViewModel({ elevationM: 100, slopeDeg: null, layers: {} }));
    popup.hide();
    assert.equal(mount.hidden, true);
    assert.equal(mount.getAttribute('aria-hidden'), 'true');
    assert.equal(closed, 1);
    // hiding an already-hidden popup must not double-fire onClose
    popup.hide();
    assert.equal(closed, 1);
});

test('PowfinderPopup close button click hides the popup', () => {
    const doc = makeFakeDocument();
    const mount = makeFakeElement('div');
    mount.hidden = true;
    const popup = new PowfinderPopup({ document: doc, mount });
    popup.show(buildPopupViewModel({ elevationM: 100, slopeDeg: null, layers: {} }));
    const closeBtn = mount._children.find(c => c.className === 'powfinder-popup__close' || c._attrs?.['aria-label'] === 'Close cell details');
    assert.ok(closeBtn, 'close button must exist');
    closeBtn._listeners.click[0]();
    assert.equal(mount.hidden, true);
});

// -----------------------------------------------------------------------
// GosperVisibilityAdapter.getDecodedUnit — new accessor for slope (§3.4).
// Text invariants only -- see the adapterSrc comment above for why this
// module can't be `import`ed and exercised live from a .mjs test. The exact
// same field-shape logic (decoded.unit.{d1,d2,d3,s1,s2,s3} +
// decoded.depths[GOSPER_MAX_DEPTH].{nx,nz}) is exercised end-to-end in the
// browser: the popup's slope readout only ever has real numbers in it if
// this accessor is wired correctly against the real decoded payload.
// -----------------------------------------------------------------------

test('getDecodedUnit is defined, null-safe, and reads the documented unit + normal fields', () => {
    assert.match(adapterSrc, /getDecodedUnit\(keyOrIslandIndex\)\s*{/);
    // null-safe when nothing is attached yet (tile not resident)
    assert.match(adapterSrc, /if \(!decoded \|\| !decoded\.unit\) return null;/);
    // reads the skirt deltas/slopes attachDecodedIsland already validates
    assert.match(adapterSrc, /d1: decoded\.unit\.d1, d2: decoded\.unit\.d2, d3: decoded\.unit\.d3,/);
    assert.match(adapterSrc, /s1: decoded\.unit\.s1, s2: decoded\.unit\.s2, s3: decoded\.unit\.s3,/);
    // reads the unit-depth terrain normal (tile_worker.js's own nx/nz
    // convention: buildLevelBuffers reads pd.nx[i]/pd.nz[i] at d === TILE_LEVEL)
    assert.match(adapterSrc, /unitDepth\?\.nx/);
    assert.match(adapterSrc, /unitDepth\?\.nz/);
    assert.match(adapterSrc, /GOSPER_MAX_DEPTH\]/);
});

test('getDecodedUnit sits alongside detachDecodedIsland, both keyed the same way as attachDecodedIsland', () => {
    // Same key-resolution helper as every other accessor on this class
    // (getRootHandle, getDepth, ...) -- keeps "yq_yr" string OR island index
    // working uniformly, per _resolveIsland's own contract.
    const method = adapterSrc.slice(adapterSrc.indexOf('getDecodedUnit('));
    assert.match(method.slice(0, 400), /this\._resolveIsland\(keyOrIslandIndex\)/);
});

// -----------------------------------------------------------------------
// main.js text invariants — cheap regression guard for the two allowed
// edits (main.js can't be imported directly here: it's ESM inside a
// "type": "commonjs" package and needs a WebGL canvas, same reason
// test/sidecar_shader.test.mjs and test/slope_shader_bins.test.mjs read it
// as text instead).
// -----------------------------------------------------------------------

test('main.js wires the PowFinder pick listeners and the one new method', () => {
    assert.match(main, /pickPowFinderCell\(clientX, clientY\)/);
    assert.match(main, /addEventListener\('pointerdown'/);
    assert.match(main, /addEventListener\('pointerup'/);
    assert.match(main, /isTapGesture\(/);
    assert.match(main, /from '\.\/hex_pick\.mjs'/);
    assert.match(main, /from '\.\/powfinder_popup\.mjs'/);
});
