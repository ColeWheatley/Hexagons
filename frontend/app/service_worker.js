/* global self, caches, fetch, Response */
// This file is deliberately dependency-free: it is bundled as a standalone
// worker and its build id is replaced by build.mjs before it is fingerprinted.
const BUILD_ID = '__HEXAGONS_BUILD_ID__';
const SHELL_CACHE = `hexagons-shell-${BUILD_ID}`;
const RUNTIME_CACHE = `hexagons-runtime-${BUILD_ID}`;
const META_CACHE = 'hexagons-cache-meta';
const RUNTIME_EPOCH_KEY = new Request(new URL('/__hexagons_runtime_epoch__', self.location.origin).href);

function isCacheable(response) {
    return response && response.ok && response.type !== 'opaque';
}

function isManifest(url) {
    return url.pathname.endsWith('/tile_manifest.json') || url.pathname === '/tile_manifest.json';
}

function isHashedShellAsset(url) {
    return /(?:^|\/)(?:main|tile_worker|style|basis_transcoder)\.[a-f0-9]{12}\.(?:js|css|wasm)$/.test(url.pathname)
        || /\/assets\/fonts\/[^/]+\.[a-f0-9]{12}\.woff2$/.test(url.pathname);
}

function isVersionedTerrainAsset(url) {
    return url.searchParams.has('v')
        && /\.(?:bin|gsp|ktx2|webp)$/.test(url.pathname);
}

async function cacheFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (isCacheable(response)) await cache.put(request, response.clone());
    return response;
}

function runtimeEpoch(manifest) {
    // A rebake can change tile recipes without changing app code. Include the
    // full manifest so any recipe/layout mutation gets a clean runtime cache.
    return JSON.stringify(manifest);
}

async function updateRuntimeEpoch(manifest) {
    const meta = await caches.open(META_CACHE);
    const previous = await meta.match(RUNTIME_EPOCH_KEY);
    const nextEpoch = runtimeEpoch(manifest);
    const previousEpoch = previous ? await previous.text() : null;
    if (previousEpoch !== null && previousEpoch !== nextEpoch) {
        await caches.delete(RUNTIME_CACHE);
    }
    await meta.put(RUNTIME_EPOCH_KEY, new Response(nextEpoch));
}

async function networkManifest(request) {
    // Never satisfy the release authority from Cache Storage. main.js also
    // asks for no-store, so a live release/rebake is observed on every visit.
    const response = await fetch(request, { cache: 'no-store' });
    if (isCacheable(response)) {
        try {
            await updateRuntimeEpoch(await response.clone().json());
        } catch {
            // A malformed manifest is handled by the app; never poison caches.
        }
    }
    return response;
}

self.addEventListener('install', event => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        const names = await caches.keys();
        await Promise.all(names
            .filter(name => (name.startsWith('hexagons-shell-') || name.startsWith('hexagons-runtime-'))
                && name !== SHELL_CACHE && name !== RUNTIME_CACHE)
            .map(name => caches.delete(name)));
        await self.clients.claim();
    })());
});

self.addEventListener('fetch', event => {
    const request = event.request;
    if (request.method !== 'GET') return;
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;

    if (isManifest(url)) {
        event.respondWith(networkManifest(request));
    } else if (isHashedShellAsset(url)) {
        event.respondWith(cacheFirst(request, SHELL_CACHE));
    } else if (isVersionedTerrainAsset(url)) {
        event.respondWith(cacheFirst(request, RUNTIME_CACHE));
    }
});
