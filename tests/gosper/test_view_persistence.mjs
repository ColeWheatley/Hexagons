// Browser-free contracts for AA-15 persistence and the entry points that
// must commit camera changes to both share URLs and local storage.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const source = await fs.readFile(path.join(ROOT, 'frontend/app/view_persistence.js'), 'utf8');
const persistence = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const {
    VIEW_STORAGE_KEY,
    VIEW_STORAGE_VERSION,
    hasExplicitViewParams,
    readPersistedEnvelope,
    sanitizePfLayer,
    sanitizePfTimestamp,
    sanitizeStoredEnvelope,
    writePersistedEnvelope,
} = persistence;

class MemoryStorage {
    constructor() { this.values = new Map(); }
    getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
    setItem(key, value) { this.values.set(key, value); }
}

const view = {
    schema: 1,
    target: { lat: 47.01, lon: 11.12, sceneY_m: 0 },
    camera: { lat: 47.02, lon: 11.13, sceneY_m: 1200 },
};
const settings = { hazeDistanceKm: 12, highTextureDistanceM: 1800, gradientMode: 0 };
const envelope = { version: VIEW_STORAGE_VERSION, view, settings };

// Reload roundtrip: write once, then read from a fresh state owner.
const storage = new MemoryStorage();
assert.equal(writePersistedEnvelope(storage, envelope), true);
assert.deepEqual(readPersistedEnvelope(storage), envelope);
assert.equal(storage.getItem(VIEW_STORAGE_KEY).includes('debug'), false,
    'only the explicit public schema may be stored');

// A shared URL is authoritative even if the local camera is valid. A partial
// explicit URL counts too: it must not be replaced with a prior local view.
assert.equal(hasExplicitViewParams('https://map.test/'), false);
assert.equal(hasExplicitViewParams('https://map.test/?view=1&at=47,11,0&eye=47,11,1200'), true);
assert.equal(hasExplicitViewParams('?at=47,11,0', 'https://map.test/'), true);
assert.equal(hasExplicitViewParams('?bench=orbit', 'https://map.test/'), false);

// Invalid/corrupt storage is ignored rather than throwing or partially applying.
storage.setItem(VIEW_STORAGE_KEY, '{not json');
assert.equal(readPersistedEnvelope(storage), null);
assert.equal(sanitizeStoredEnvelope({ ...envelope, version: 99 }), null);
assert.equal(sanitizeStoredEnvelope({ ...envelope, settings: { ...settings, gradientMode: 2 } }), null);
assert.equal(sanitizeStoredEnvelope({ ...envelope, view: { ...view, camera: { ...view.camera, lat: Infinity } } }), null);

// Existing v1 projected-footprint settings migrate once to the historical
// distance range and are normalized before the viewer sees them.
assert.deepEqual(
    persistence.sanitizePublicSettings({ hazeDistanceKm: 12, highTextureEnterPx: 512, gradientMode: 0 }),
    { hazeDistanceKm: 12, highTextureDistanceM: 2000, gradientMode: 0 },
);

// PowFinder shareable state (design doc §3.7, §6 P2.5): pf (layer id, or
// 'off') persists like the other public settings; t (epoch hour) is
// deliberately a separate sanitizer so it structurally cannot leak into the
// persisted settings schema below.
assert.equal(sanitizePfLayer('sqh'), 'sqh');
assert.equal(sanitizePfLayer('off'), 'off');
assert.equal(sanitizePfLayer('avalanche-hazard_2'), 'avalanche-hazard_2');
for (const hostile of ['<script>alert(1)</script>', 'SQH', '', ' sqh', 'sqh ', 'a'.repeat(40), 42, null, undefined, {}]) {
    assert.equal(sanitizePfLayer(hostile), null, `hostile pf value must be rejected: ${JSON.stringify(hostile)}`);
}
assert.equal(sanitizePfTimestamp(462024), 462024);
assert.equal(sanitizePfTimestamp('462024'), 462024);
for (const bad of [462024.5, 'not-a-number', NaN, Infinity, 99999999999, null, undefined, {}]) {
    assert.equal(sanitizePfTimestamp(bad), null, `bad pf timestamp must be rejected: ${JSON.stringify(bad)}`);
}

// pfLayer round-trips through the same persisted-settings envelope as the
// existing public settings triple; a hostile pfLayer rejects the whole
// settings object (existing all-or-nothing philosophy), not just the field.
assert.deepEqual(
    persistence.sanitizePublicSettings({ ...settings, pfLayer: 'sqh' }),
    { ...settings, pfLayer: 'sqh' },
);
assert.equal(persistence.sanitizePublicSettings({ ...settings, pfLayer: '<script>' }), null);
// pfLayer is optional: settings without it sanitize exactly as before (no
// key added), so pre-PowFinder persisted envelopes are unaffected.
assert.deepEqual(persistence.sanitizePublicSettings(settings), settings);

// Every camera input path must use the same atomic URL + persistence commit.
const main = await fs.readFile(path.join(ROOT, 'frontend/app/main.js'), 'utf8');
const search = await fs.readFile(path.join(ROOT, 'frontend/app/search.js'), 'utf8');
const state = await fs.readFile(path.join(ROOT, 'frontend/app/view_state.js'), 'utf8');
assert.match(state, /point\.sceneY\s*\?\?\s*point\.sceneY_m/,
    'the shared GPS conversion must accept both URL and persisted vertical field names');
assert.match(state, /copyButton\?\.addEventListener\('click'[\s\S]*?viewer\.writeClipboardText\(url\)/,
    'COPY LINK must use the viewer clipboard abstraction for fallback and automation paths');
assert.match(state, /controls\.addEventListener\('end'[\s\S]*?commitViewChange\(\)/,
    'MapControls mouse/wheel/keyboard end commits share state');
assert.match(main, /handleTwoFingerGesture[\s\S]*?viewState\?\.commitViewChange\(\)/,
    'custom touch gestures commit share state');
assert.match(search, /selectResult[\s\S]*?viewState\?\.commitViewChange\(\)/,
    'search selection commits share state immediately');
assert.match(main, /commitSettingsChange\(\)/,
    'public setting inputs persist through the same safe envelope');

// PowFinder pf/t wiring (design doc §3.7, §6 P2.5). view_state.js cannot be
// loaded as a real ES module here -- it has relative imports of its own, so
// the data-URL trick used for view_persistence.js above does not resolve
// them, and frontend/app/package.json's "type": "commonjs" means a plain
// dynamic import() of the .js file fails outright (verified). Structural
// (text-invariant) assertions are the same proven pattern this repo already
// uses for exactly this situation -- see test/slope_shader_bins.test.mjs's
// GLSL-substring checks and test/sidecar_powfinder_wiring.test.mjs's
// main.js checks.
assert.match(state, /buildUrl\(\)\s*\{[\s\S]*?this\.writePfParams\(url\)/,
    'buildUrl() must write pf/t before returning the URL');
assert.match(state, /writePfParams\(url\)\s*\{[\s\S]*?sanitizePfLayer\(pf\.layer\)[\s\S]*?sanitizePfTimestamp\(pf\.epochHour\)/,
    'writePfParams must sanitize both the layer and the timestamp through the shared validators');
assert.match(state, /applyPfParams\(url\)\s*\{[\s\S]*?sanitizePfLayer\(url\.searchParams\.get\('pf'\)\)[\s\S]*?sanitizePfTimestamp\(url\.searchParams\.get\('t'\)\)/,
    'applyPfParams must read pf/t through the same shared validators buildUrl writes with (the actual round trip)');
assert.match(state, /applyUrl\([\s\S]*?\{[\s\S]*?this\.applyPfParams\(url\)/,
    'applyUrl() must apply pf/t independently of the view=/at=/eye= schema check');
assert.match(state, /restoreFromUrl\(\)\s*\{[\s\S]*?this\.applyPfParams\(new URL\(window\.location\.href\)\)/,
    'restoreFromUrl() must apply pf/t even on the no-explicit-camera-view branch');
// The timestamp must never reach the persisted-settings schema: getPublicSettings
// (the function persist() calls to build what is written to localStorage) may
// only read pf.layer, never pf.epochHour/pfTimestamp.
{
    const start = state.indexOf('getPublicSettings()');
    const rawBody = state.slice(start, state.indexOf('\n    }', start));
    const code = rawBody.split('\n').map(line => line.replace(/\/\/.*$/, '')).join('\n'); // strip comments
    assert.match(code, /pf\?\.layer/, 'getPublicSettings must read the layer');
    assert.doesNotMatch(code, /epochHour|pfTimestamp/,
        'getPublicSettings (and therefore persist()) must never reference the timestamp -- it is URL-only');
}

console.log('view persistence tests passed');
