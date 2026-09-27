import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { NetScheduler, NET_PRIORITY } from '../net_scheduler.mjs';
import { TextureByteStore } from '../texture_byte_store.mjs';

const K = globalThis.Ktx2Prefix;
const LOW = new Uint8Array(readFileSync(new URL('./fixtures/texture_61_199.low.ktx2', import.meta.url)));

function deferred() {
    let resolve, reject;
    const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
    return { promise, resolve, reject };
}

/** A tiny Range-capable origin. `gate` lets tests hold responses open. */
function makeServer(files, { ignoreRange = false, gate = null } = {}) {
    const log = [];
    const fetchImpl = async (url, init = {}) => {
        const file = files[url];
        const range = new Headers(init.headers || {}).get('Range');
        log.push({ url, range });
        if (gate) await gate(url, range, init.signal);
        if (init.signal?.aborted) throw Object.assign(new Error('aborted'), { name: 'AbortError' });
        if (!file) return new Response('missing', { status: 404 });
        if (!range || ignoreRange) return new Response(file.slice(), { status: 200 });
        const [, a, b] = /bytes=(\d+)-(\d*)/.exec(range);
        const start = Number(a);
        const end = Math.min(file.byteLength, b === '' ? file.byteLength : Number(b) + 1);
        if (start >= file.byteLength) return new Response('', { status: 416 });
        return new Response(file.slice(start, end), {
            status: 206,
            headers: { 'Content-Range': `bytes ${start}-${end - 1}/${file.byteLength}` },
        });
    };
    return { fetchImpl, log };
}

function memoryCacheStorage() {
    const stores = new Map();
    return {
        stores,
        async open(name) {
            if (!stores.has(name)) {
                const entries = new Map();
                stores.set(name, {
                    entries,
                    async match(key) { const hit = entries.get(String(key)); return hit ? hit.clone() : undefined; },
                    async put(key, response) { entries.set(String(key), response); },
                });
            }
            return stores.get(name);
        },
    };
}

test('scheduler serves the most urgent queued request first', async () => {
    const holds = [];
    const server = makeServer({ a: LOW, b: LOW, c: LOW, d: LOW }, {
        gate: () => { const d = deferred(); holds.push(d); return d.promise; },
    });
    const scheduler = new NetScheduler({ fetchImpl: server.fetchImpl, maxConcurrent: 1 });
    const done = [];
    const track = (name, p) => p.promise.then(() => done.push(name));
    const first = track('a', scheduler.request({ url: 'a', priority: NET_PRIORITY.VISIBLE }));
    const low = track('b', scheduler.request({ url: 'b', priority: NET_PRIORITY.BACKGROUND }));
    const urgent = track('c', scheduler.request({ url: 'c', priority: NET_PRIORITY.CRITICAL }));
    const mid = track('d', scheduler.request({ url: 'd', priority: NET_PRIORITY.GUARD }));
    while (done.length < 4) {
        await new Promise(r => setTimeout(r, 1));
        while (holds.length) holds.shift().resolve();
    }
    await Promise.all([first, low, urgent, mid]);
    assert.deepEqual(done, ['a', 'c', 'd', 'b']);
});

test('scheduler admits by bytes in flight but never starves a lone request', async () => {
    const holds = [];
    const server = makeServer({ a: LOW, b: LOW }, {
        gate: () => { const d = deferred(); holds.push(d); return d.promise; },
    });
    const scheduler = new NetScheduler({
        fetchImpl: server.fetchImpl, minBudgetBytes: 1000, maxBudgetBytes: 1000, initialThroughputBps: 1,
    });
    const a = scheduler.request({ url: 'a', expectedBytes: 5000 });
    const b = scheduler.request({ url: 'b', expectedBytes: 5000 });
    await new Promise(r => setTimeout(r, 5));
    assert.equal(server.log.length, 1, 'second large request waits for budget');
    holds.shift().resolve();
    await a.promise;
    await new Promise(r => setTimeout(r, 5));
    assert.equal(server.log.length, 2, 'second request starts once the first drains');
    holds.shift().resolve();
    await b.promise;
});

test('prefetch only uses an idle link', async () => {
    const holds = [];
    const server = makeServer({ a: LOW, p: LOW }, {
        gate: () => { const d = deferred(); holds.push(d); return d.promise; },
    });
    const scheduler = new NetScheduler({ fetchImpl: server.fetchImpl });
    const real = scheduler.request({ url: 'a', priority: NET_PRIORITY.VISIBLE });
    const pre = scheduler.request({ url: 'p', priority: NET_PRIORITY.PREFETCH });
    await new Promise(r => setTimeout(r, 5));
    assert.deepEqual(server.log.map(e => e.url), ['a']);
    holds.shift().resolve();
    await real.promise;
    await new Promise(r => setTimeout(r, 5));
    assert.deepEqual(server.log.map(e => e.url), ['a', 'p']);
    holds.shift().resolve();
    await pre.promise;
});

test('cancel rejects queued work and aborts in-flight work', async () => {
    const holds = [];
    const server = makeServer({ a: LOW, b: LOW }, {
        gate: (url, range, signal) => {
            const d = deferred();
            holds.push(d);
            signal?.addEventListener('abort', () => d.reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
            return d.promise;
        },
    });
    const scheduler = new NetScheduler({ fetchImpl: server.fetchImpl, maxConcurrent: 1 });
    const a = scheduler.request({ url: 'a' });
    const b = scheduler.request({ url: 'b' });
    scheduler.cancel(b.handle);
    await assert.rejects(b.promise, { name: 'AbortError' });
    await new Promise(r => setTimeout(r, 1));
    scheduler.cancel(a.handle);
    await assert.rejects(a.promise, { name: 'AbortError' });
    assert.equal(scheduler.inFlight.size, 0);
});

test('byte store grows one prefix level by level and never refetches bytes', async () => {
    const server = makeServer({ 'page.ktx2': LOW });
    const scheduler = new NetScheduler({ fetchImpl: server.fetchImpl });
    const cacheStorage = memoryCacheStorage();
    const store = new TextureByteStore({ scheduler, cacheStorage, firstRangeBytes: 700, chunkBytes: 2000 });
    const header = K.parseHeader(LOW);

    const coarse = await store.ensureLevel('page.ktx2', 5);
    assert.equal(coarse.level <= 5, true);
    assert.equal(server.log[0].range, 'bytes=0-699');
    const mid = await store.ensureLevel('page.ktx2', 2);
    assert.equal(mid.bytes.byteLength, K.prefixEndForLevel(header, 2));
    const full = await store.ensureLevel('page.ktx2', 0);
    assert.deepEqual(Buffer.from(full.bytes), Buffer.from(LOW), 'prefix is byte-exact');
    // Contiguous, non-overlapping ranges only.
    let cursor = 0;
    for (const { range } of server.log) {
        const [, a, b] = /bytes=(\d+)-(\d+)/.exec(range);
        assert.equal(Number(a), cursor, `range ${range} starts where the previous ended`);
        cursor = Math.min(LOW.byteLength, Number(b) + 1);
    }
    assert.ok(server.log.length >= 4, 'full level was fetched in chunks');

    await new Promise(r => setTimeout(r, 5)); // let persistence land
    const again = new TextureByteStore({ scheduler, cacheStorage });
    const before = server.log.length;
    const restored = await again.ensureLevel('page.ktx2', 0);
    assert.equal(server.log.length, before, 'second session served entirely from Cache Storage');
    assert.deepEqual(Buffer.from(restored.bytes), Buffer.from(LOW));
});

test('byte store copes with an origin that ignores Range', async () => {
    const server = makeServer({ 'page.ktx2': LOW }, { ignoreRange: true });
    const store = new TextureByteStore({ scheduler: new NetScheduler({ fetchImpl: server.fetchImpl }), cacheStorage: null });
    const result = await store.ensureLevel('page.ktx2', 3);
    assert.equal(result.bytes.byteLength, LOW.byteLength);
    assert.equal(result.level, 0);
    assert.equal(server.log.length, 1);
});

test('memory eviction reloads bytes from Cache Storage, not the network', async () => {
    const server = makeServer({ 'a.ktx2': LOW, 'b.ktx2': LOW });
    const cacheStorage = memoryCacheStorage();
    const store = new TextureByteStore({
        scheduler: new NetScheduler({ fetchImpl: server.fetchImpl }), cacheStorage, memoryBudgetBytes: LOW.byteLength + 10,
    });
    await store.ensureLevel('a.ktx2', 0);
    await new Promise(r => setTimeout(r, 5));
    await store.ensureLevel('b.ktx2', 0);
    assert.equal(store.entries.get('a.ktx2').bytes, null, 'a was evicted from memory');
    const before = server.log.length;
    const again = await store.ensureLevel('a.ktx2', 0);
    assert.equal(server.log.length, before);
    assert.deepEqual(Buffer.from(again.bytes), Buffer.from(LOW));
});

test('generic prefixes grow contiguously and persist (terrain tiles)', async () => {
    const tile = new Uint8Array(5000).map((_, i) => i % 251);
    const server = makeServer({ 'tile.bin': tile });
    const cacheStorage = memoryCacheStorage();
    const store = new TextureByteStore({
        scheduler: new NetScheduler({ fetchImpl: server.fetchImpl }), cacheStorage, cacheName: 'gsp', chunkBytes: 1500,
    });
    const coarse = await store.ensurePrefix('tile.bin', 952);
    assert.equal(coarse.bytes.byteLength, 952);
    const full = await store.ensurePrefix('tile.bin', Infinity);
    assert.deepEqual(Buffer.from(full.bytes), Buffer.from(tile));
    assert.equal(full.total, 5000);
    assert.deepEqual(server.log.map(e => e.range), ['bytes=0-951', 'bytes=952-2451', 'bytes=2452-3951', 'bytes=3952-5451']);
    await new Promise(r => setTimeout(r, 5));
    const again = new TextureByteStore({ scheduler: new NetScheduler({ fetchImpl: server.fetchImpl }), cacheStorage, cacheName: 'gsp' });
    const restored = await again.ensurePrefix('tile.bin', 3000);
    assert.equal(server.log.length, 4, 'served from Cache Storage');
    assert.equal(restored.bytes.byteLength, 5000);
});

test('segments fetched from separate objects extend the same contiguous prefix', async () => {
    const tile = new Uint8Array(3000).map((_, i) => (i * 7) % 253);
    const server = makeServer({
        'tile.bin': tile,
        'tile.agg.bin': tile.slice(0, 1000),
        'tile.units.bin': tile.slice(1000),
    });
    const cacheStorage = memoryCacheStorage();
    const store = new TextureByteStore({ scheduler: new NetScheduler({ fetchImpl: server.fetchImpl }), cacheStorage, cacheName: 'gsp' });
    await store.ensurePrefix('tile.bin', 300);                       // small raw range first
    await store.ensureSegment('tile.bin', { start: 0, end: 1000, sourceUrl: 'tile.agg.bin' });
    const full = await store.ensureSegment('tile.bin', { start: 1000, end: 3000, sourceUrl: 'tile.units.bin', total: 3000 });
    assert.deepEqual(Buffer.from(full.bytes), Buffer.from(tile));
    assert.equal(full.total, 3000);
    const again = await store.ensureSegment('tile.bin', { start: 1000, end: 3000, sourceUrl: 'tile.units.bin' });
    assert.equal(again.networkBytes, 0, 'already-present segments cost nothing');
    assert.deepEqual(server.log.map(e => [e.url, e.range]), [
        ['tile.bin', 'bytes=0-299'], ['tile.agg.bin', null], ['tile.units.bin', null],
    ]);
    await assert.rejects(new TextureByteStore({ scheduler: new NetScheduler({ fetchImpl: server.fetchImpl }), cacheStorage: null })
        .ensureSegment('other.bin', { start: 1000, end: 3000, sourceUrl: 'tile.units.bin' }), /needs bytes from 0/);
});
