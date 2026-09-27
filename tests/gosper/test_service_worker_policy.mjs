import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const source = (await fs.readFile(path.join(root, 'frontend/app/service_worker.js'), 'utf8'))
    .replaceAll('__HEXAGONS_BUILD_ID__', 'test-build');

class MemoryCache {
    constructor() { this.entries = new Map(); }
    async match(request) { return this.entries.get(request.url)?.clone(); }
    async put(request, response) { this.entries.set(request.url, response); }
    async keys() { return [...this.entries.keys()].map(url => new Request(url)); }
    async delete(request) { return this.entries.delete(request.url); }
}
const stores = new Map();
const cacheStorage = {
    async open(name) { if (!stores.has(name)) stores.set(name, new MemoryCache()); return stores.get(name); },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
};
const handlers = new Map();
let calls = [];
let skipped = false;
let claimed = false;
let pointer = { manifest_url: 'releases/rel-a/manifest.0123456789ab.json', release: { asset_release: 'rel-a' } };
const self = {
    location: { origin: 'https://viewer.example', href: 'https://viewer.example/hexagons/next/service-worker.js' },
    registration: { scope: 'https://viewer.example/hexagons/next/' },
    clients: { claim: async () => { claimed = true; } },
    skipWaiting: async () => { skipped = true; },
    addEventListener(type, handler) { handlers.set(type, handler); },
};
const context = vm.createContext({ self, caches: cacheStorage, Request, Response, URL, console, JSON });
context.fetch = async request => {
    calls.push(request.url || request);
    const url = new URL(request.url || request);
    if (url.pathname.endsWith('/hexagons/next/tile_manifest.json')) return new Response(JSON.stringify(pointer), { status: 200 });
    if (url.pathname.includes('missing')) return new Response('missing', { status: 404 });
    return new Response(`network:${url.pathname}`, { status: 200 });
};
vm.runInContext(source, context, { filename: 'service_worker.js' });

async function dispatchLifecycle(type) {
    let work;
    handlers.get(type)({ waitUntil(value) { work = value; } });
    await work;
}

async function dispatch(url, headers = {}) {
    let response;
    const pending = [];
    handlers.get('fetch')({
        request: new Request(url, { headers }),
        respondWith(value) { response = value; },
        waitUntil(value) { pending.push(value); },
    });
    const result = response ? await response : null;
    // Background work (cache writes, pruning) may itself register more work.
    while (pending.length) await pending.shift();
    return result;
}

const scope = 'hx2-hexagons-next-';

const shell = 'https://viewer.example/hexagons/next/main.0123456789ab.js';
await dispatch(shell);
await dispatch(shell);
assert.equal(calls.filter(url => url === shell).length, 1, 'fingerprinted code is cache-first');
assert.ok(stores.has(`${scope}shell-test-build`), 'shell cache is namespaced by scope and build');

const terrain = 'https://viewer.example/hexagons/app/releases/rel-a/tiles_bin/gosper_1_2.bin?v=bin-a';
await dispatch(terrain);
await dispatch(terrain);
assert.equal(calls.filter(url => url === terrain).length, 1, 'versioned geometry is cache-first');

const bootstrap = 'https://viewer.example/hexagons/app/releases/rel-a/aerial_pages/bootstrap/texture_1_2.webp';
await dispatch(bootstrap);
await dispatch(bootstrap);
assert.equal(calls.filter(url => url === bootstrap).length, 1, 'release-addressed bootstrap imagery is cache-first');

const unversioned = 'https://viewer.example/tiles_bin/gosper_1_2.bin';
assert.equal(await dispatch(unversioned), null, 'unversioned terrain is never intercepted');

const ranged = 'https://viewer.example/hexagons/app/releases/rel-a/aerial_pages/high/texture_1_2.ktx2?v=tex-a';
assert.equal(await dispatch(ranged, { range: 'bytes=0-32767' }), null, 'range requests bypass Cache Storage');

const immutable = 'https://viewer.example/hexagons/next/releases/rel-a/manifest.0123456789ab.json';
await dispatch(immutable);
await dispatch(immutable);
assert.equal(calls.filter(url => url === immutable).length, 1, 'content-addressed manifests are cache-first');

const pointerUrl = 'https://viewer.example/hexagons/next/tile_manifest.json?v=app-a';
await dispatch(pointerUrl);
await dispatch(pointerUrl);
assert.equal(calls.filter(url => url === pointerUrl).length, 2, 'release pointer is always network-first');

const missing = 'https://viewer.example/hexagons/app/releases/rel-a/textures/missing.ktx2?v=tex-a';
await dispatch(missing);
await dispatch(missing);
assert.equal(calls.filter(url => url === missing).length, 2, 'error responses are never cached');

// A new release prunes only the other release's runtime entries.
const runtime = stores.get(`${scope}runtime`);
assert.ok(runtime.entries.has(terrain), 'runtime cache holds release rel-a terrain');
pointer = { manifest_url: 'releases/rel-b/manifest.ba9876543210.json', release: { asset_release: 'rel-b' } };
const terrainB = 'https://viewer.example/hexagons/app/releases/rel-b/tiles_bin/gosper_1_2.bin?v=bin-b';
await dispatch(terrainB);
await dispatch(pointerUrl);
assert.equal(runtime.entries.has(terrain), false, 'new release pruned the previous release');
assert.equal(runtime.entries.has(terrainB), true, 'new release keeps its own entries');

// Shell deploys must not throw away downloaded terrain, nor touch other scopes.
await cacheStorage.open(`${scope}shell-obsolete-build`);
await cacheStorage.open('hx2-hexagons-app-shell-other-scope');
await cacheStorage.open('hexagons-runtime-v0.10.0-rc6');
await cacheStorage.open('unrelated-cache');
await dispatchLifecycle('install');
assert.equal(skipped, true, 'install activates the new policy without waiting for an offline UI flow');
await dispatchLifecycle('activate');
assert.equal(claimed, true, 'activate claims existing clients');
assert.equal(stores.has(`${scope}shell-obsolete-build`), false, 'activate removes this scope\'s old shells');
assert.equal(stores.has(`${scope}runtime`), true, 'activate keeps downloaded terrain across app deploys');
assert.equal(stores.has('hx2-hexagons-app-shell-other-scope'), true, 'activate never touches another scope');
assert.equal(stores.has('hexagons-runtime-v0.10.0-rc6'), true, 'activate leaves v1 worker caches to that worker');
assert.equal(stores.has('unrelated-cache'), true, 'activate does not delete caches it does not own');

console.log('service worker policy: ok');
