/* global self, caches, fetch, Response, Request */
// This file is deliberately dependency-free: it is bundled as a standalone
// worker and its build id is replaced by build.mjs before it is fingerprinted.
//
// Cache design (v2):
// - Cache Storage is shared by every scope on the origin (/hexagons/app/ and
//   /hexagons/next/ can both be installed), so every cache name carries this
//   worker's scope tag and cleanup only ever touches caches it owns. The v1
//   worker's `hexagons-*` caches are left alone: that worker still manages them.
// - Terrain, texture and immutable-manifest bytes are addressed by release path
//   and ?v= recipe keys, so they are NOT tied to the app build: shipping a new
//   shell must not throw away hundreds of MB a user already downloaded. They
//   are pruned only when the release pointer names a different release.
// - Range requests are never answered from, or written to, Cache Storage
//   (Cache.put rejects 206). Progressive KTX2 prefixes are cached by the
//   texture worker itself.
const BUILD_ID = '__HEXAGONS_BUILD_ID__';
const SCOPE_TAG = (() => {
    try {
        return new URL(self.registration.scope).pathname.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'root';
    } catch {
        return 'root';
    }
})();
const PREFIX = `hx2-${SCOPE_TAG}-`;
const SHELL_CACHE = `${PREFIX}shell-${BUILD_ID}`;
const RUNTIME_CACHE = `${PREFIX}runtime`;
const META_CACHE = `${PREFIX}meta`;
const RELEASE_KEY = new Request(new URL(`/__hexagons_release__/${SCOPE_TAG}`, self.location.origin).href);

function isCacheable(response) {
    return response && response.status === 200 && response.type !== 'opaque';
}

function isRangeRequest(request) {
    return request.headers.has('range');
}

// The mutable release pointer (or legacy full manifest) at the app root.
function isReleasePointer(url) {
    return url.pathname.endsWith('/tile_manifest.json') && !url.pathname.includes('/releases/');
}

// Content-addressed manifests published under an immutable release prefix.
function isImmutableManifest(url) {
    return /\/releases\/[^/]+\/(?:manifest\.[a-f0-9]{12}\.json|tile_manifest\.json)$/.test(url.pathname);
}

function isHashedShellAsset(url) {
    return /(?:^|\/)(?:main|tile_worker|style|basis_transcoder)\.[a-f0-9]{12}\.(?:js|css|wasm)$/.test(url.pathname)
        || /\/assets\/fonts\/[^/]+\.[a-f0-9]{12}\.woff2$/.test(url.pathname);
}

function isStaticShellAsset(url) {
    return /\/assets\/(?:skigebiete|search_index)\.json$/.test(url.pathname);
}

function isVersionedTerrainAsset(url) {
    return (url.searchParams.has('v') || url.pathname.includes('/releases/'))
        && /\.(?:bin|gsp|ktx2|webp)$/.test(url.pathname);
}

function releaseOf(url) {
    const match = /\/releases\/([^/]+)\//.exec(url.pathname);
    return match ? match[1] : null;
}

async function cacheFirst(event, cacheName) {
    const request = event.request;
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (isCacheable(response)) {
        // Hand the body to the page immediately; keep the worker alive until
        // the Cache Storage copy lands instead of making the page wait for it.
        event.waitUntil(cache.put(request, response.clone()).catch(() => {}));
    }
    return response;
}

async function pruneOtherReleases(currentRelease) {
    if (!currentRelease) return;
    const meta = await caches.open(META_CACHE);
    const previous = await meta.match(RELEASE_KEY);
    const previousRelease = previous ? await previous.text() : null;
    if (previousRelease === currentRelease) return;
    const cache = await caches.open(RUNTIME_CACHE);
    const keys = await cache.keys();
    await Promise.all(keys
        .filter(request => {
            const release = releaseOf(new URL(request.url));
            return release !== null && release !== currentRelease;
        })
        .map(request => cache.delete(request)));
    await meta.put(RELEASE_KEY, new Response(currentRelease));
}

function releaseFromManifest(manifest) {
    return manifest?.release?.asset_release
        || manifest?.asset_release
        || (typeof manifest?.manifest_url === 'string' ? releaseOf(new URL(manifest.manifest_url, self.location.href)) : null);
}

function networkReleasePointer(event) {
    // Never satisfy the release authority from Cache Storage, and never make
    // the page wait for cache bookkeeping: prune in the background.
    return fetch(event.request, { cache: 'no-store' }).then(response => {
        if (isCacheable(response)) {
            const copy = response.clone();
            event.waitUntil(copy.json()
                .then(manifest => pruneOtherReleases(releaseFromManifest(manifest)))
                .catch(() => {}));
        }
        return response;
    });
}

self.addEventListener('install', event => {
    event.waitUntil(self.skipWaiting());
});

// v1 workers only ever ran at /hexagons/app/ (and the retired /beta/). When
// v2 takes over one of those scopes it inherits v1's unscoped caches, which no
// longer have an owner; any other scope (e.g. /hexagons/next/) must leave them
// alone because a v1 worker may still be serving them.
const V1_SCOPE_TAGS = new Set(['hexagons-app', 'hexagons-beta']);

function isV1CacheName(name) {
    return name === 'hexagons-cache-meta'
        || name.startsWith('hexagons-shell-')
        || name.startsWith('hexagons-runtime-');
}

self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        const names = await caches.keys();
        await Promise.all(names
            .filter(name => (name.startsWith(`${PREFIX}shell-`) && name !== SHELL_CACHE)
                || (V1_SCOPE_TAGS.has(SCOPE_TAG) && isV1CacheName(name)))
            .map(name => caches.delete(name)));
        await self.clients.claim();
    })());
});

self.addEventListener('fetch', event => {
    const request = event.request;
    if (request.method !== 'GET' || isRangeRequest(request)) return;
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;
    // Split terrain parts are persisted by the page's tile byte store;
    // caching them here too would store every tile twice.
    if (url.pathname.includes('/tiles_split/')) return;

    if (isImmutableManifest(url)) {
        event.respondWith(cacheFirst(event, RUNTIME_CACHE));
        // Shells that declare their manifest never fetch the pointer; the
        // manifest's own release path is just as authoritative for pruning.
        event.waitUntil(pruneOtherReleases(releaseOf(url)).catch(() => {}));
    } else if (isReleasePointer(url)) {
        event.respondWith(networkReleasePointer(event));
    } else if (isHashedShellAsset(url) || isStaticShellAsset(url)) {
        event.respondWith(cacheFirst(event, SHELL_CACHE));
    } else if (isVersionedTerrainAsset(url)) {
        event.respondWith(cacheFirst(event, RUNTIME_CACHE));
    }
});
