import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const source = (await fs.readFile(path.join(root, 'frontend/app/service_worker.js'), 'utf8'))
    .replaceAll('__HEXAGONS_BUILD_ID__', 'test-release');

class MemoryCache {
    constructor() { this.entries = new Map(); }
    async match(request) { return this.entries.get(request.url); }
    async put(request, response) { this.entries.set(request.url, response); }
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
let manifest = { binary: { cache_key: 'bin-a' }, texture_pages: { cache_key: 'tex-a' }, tiles: [{ id: 1 }] };
const self = {
    location: { origin: 'https://viewer.example' },
    clients: { claim: async () => { claimed = true; } },
    skipWaiting: async () => { skipped = true; },
    addEventListener(type, handler) { handlers.set(type, handler); },
};
const context = vm.createContext({ self, caches: cacheStorage, Request, Response, URL, console, JSON });
context.fetch = async request => {
    calls.push(request.url || request);
    const url = new URL(request.url || request);
    if (url.pathname.endsWith('tile_manifest.json')) return new Response(JSON.stringify(manifest), { status: 200 });
    if (url.pathname.includes('missing')) return new Response('missing', { status: 404 });
    return new Response(`network:${url.pathname}`, { status: 200 });
};
vm.runInContext(source, context, { filename: 'service_worker.js' });

async function dispatchLifecycle(type) {
    let work;
    handlers.get(type)({ waitUntil(value) { work = value; } });
    await work;
}

async function dispatch(url) {
    let response;
    handlers.get('fetch')({ request: new Request(url), respondWith(value) { response = value; } });
    return response ? await response : null;
}

const shell = 'https://viewer.example/main.0123456789ab.js';
await dispatch(shell);
await dispatch(shell);
assert.equal(calls.filter(url => url === shell).length, 1, 'fingerprinted code is cache-first');

const terrain = 'https://viewer.example/tiles_bin/gosper_1_2.bin?v=bin-a-gsp2';
await dispatch(terrain);
await dispatch(terrain);
assert.equal(calls.filter(url => url === terrain).length, 1, 'versioned geometry is cache-first');

const unversioned = 'https://viewer.example/tiles_bin/gosper_1_2.bin';
assert.equal(await dispatch(unversioned), null, 'unversioned terrain is never intercepted');

const manifestUrl = 'https://viewer.example/tile_manifest.json?v=app-a';
await dispatch(manifestUrl);
await dispatch(manifestUrl);
assert.equal(calls.filter(url => url === manifestUrl).length, 2, 'manifest is always network-first');

const missing = 'https://viewer.example/textures/missing.ktx2?v=tex-a';
await dispatch(missing);
await dispatch(missing);
assert.equal(calls.filter(url => url === missing).length, 2, 'error responses are never cached');

manifest = { binary: { cache_key: 'bin-b' }, texture_pages: { cache_key: 'tex-b' }, tiles: [{ id: 2 }] };
await dispatch(manifestUrl);
assert.equal(stores.has('hexagons-runtime-test-release'), false, 'rebaked manifest clears the prior runtime epoch');

await cacheStorage.open('hexagons-shell-obsolete');
await cacheStorage.open('hexagons-runtime-obsolete');
await cacheStorage.open('unrelated-cache');
await dispatchLifecycle('install');
assert.equal(skipped, true, 'install activates the new policy without waiting for an offline UI flow');
await dispatchLifecycle('activate');
assert.equal(claimed, true, 'activate claims existing clients');
assert.equal(stores.has('hexagons-shell-obsolete'), false, 'activate removes old shell releases');
assert.equal(stores.has('hexagons-runtime-obsolete'), false, 'activate removes old runtime releases');
assert.equal(stores.has('unrelated-cache'), true, 'activate does not delete caches it does not own');

console.log('service worker policy: ok');
