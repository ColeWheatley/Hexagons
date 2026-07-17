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
const settings = { hazeDistanceKm: 12, highTextureEnterPx: 768, gradientMode: 0 };
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

console.log('view persistence tests passed');
