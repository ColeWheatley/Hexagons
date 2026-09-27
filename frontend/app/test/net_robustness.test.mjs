import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { NetScheduler, NET_PRIORITY } from '../net_scheduler.mjs';
import { TextureByteStore } from '../texture_byte_store.mjs';

const K = globalThis.Ktx2Prefix;
const LOW = new Uint8Array(readFileSync(new URL('./fixtures/texture_61_199.low.ktx2', import.meta.url)));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const abortError = () => Object.assign(new Error('aborted'), { name: 'AbortError' });

function rangeResponse(file, range) {
    if (!range) return new Response(file.slice(), { status: 200 });
    const [, a, b] = /bytes=(\d+)-(\d*)/.exec(range);
    const start = Number(a);
    const end = Math.min(file.byteLength, b === '' ? file.byteLength : Number(b) + 1);
    return new Response(file.slice(start, end), {
        status: 206,
        headers: { 'Content-Range': `bytes ${start}-${end - 1}/${file.byteLength}` },
    });
}

/** Range origin whose responses are held until the test releases them one by one. */
function heldServer(file) {
    const held = [];
    const fetchImpl = (url, init = {}) => new Promise((resolve, reject) => {
        const range = new Headers(init.headers || {}).get('Range');
        init.signal?.addEventListener('abort', () => reject(abortError()), { once: true });
        held.push(() => resolve(rangeResponse(file, range)));
    });
    const releaseOne = async () => {
        while (!held.length) await sleep(1);
        held.shift()();
        await sleep(2);
    };
    return { fetchImpl, held, releaseOne };
}

function recordPriorities(scheduler) {
    const sent = [];
    const request = scheduler.request.bind(scheduler);
    scheduler.request = options => {
        const result = request(options);
        sent.push(result.handle);
        return result;
    };
    return sent;
}

test('a request with no progress is aborted as a retryable stall and frees its budget', async () => {
    const fetchImpl = (url, init) => new Promise((_, reject) => {
        init.signal.addEventListener('abort', () => reject(abortError()), { once: true });
    });
    const scheduler = new NetScheduler({ fetchImpl, stallTimeoutMs: 30 });
    const { promise } = scheduler.request({ url: 'x', priority: NET_PRIORITY.VISIBLE, expectedBytes: 4 << 20 });
    await assert.rejects(promise, error => error.name === 'NetStallError' && error.retryable === true);
    assert.equal(scheduler.inFlight.size, 0);
    assert.equal(scheduler.inFlightBytes, 0);
    assert.equal(scheduler.stats.stalled, 1);
    assert.equal(scheduler.stats.cancelled, 0);
});

test('a slow body that keeps arriving is not treated as a stall', async () => {
    const fetchImpl = async () => new Response(new ReadableStream({
        async start(controller) {
            for (let i = 0; i < 6; i++) {
                await sleep(15);
                controller.enqueue(new Uint8Array(100).fill(i));
            }
            controller.close();
        },
    }), { status: 200 });
    const scheduler = new NetScheduler({ fetchImpl, stallTimeoutMs: 45 });
    const result = await scheduler.request({ url: 'slow', priority: NET_PRIORITY.VISIBLE }).promise;
    assert.equal(result.bytes.byteLength, 600);
    assert.equal(result.bytes[599], 5);
    assert.equal(scheduler.stats.stalled, 0);
});

test('a cancel is still reported as an abort, not a stall', async () => {
    const fetchImpl = (url, init) => new Promise((_, reject) => {
        init.signal.addEventListener('abort', () => reject(abortError()), { once: true });
    });
    const scheduler = new NetScheduler({ fetchImpl, stallTimeoutMs: 1000 });
    const { promise, handle } = scheduler.request({ url: 'x', priority: NET_PRIORITY.VISIBLE });
    await sleep(2);
    scheduler.cancel(handle);
    await assert.rejects(promise, error => error.name === 'AbortError');
    assert.equal(scheduler.stats.stalled, 0);
});

test('priority follows the callers still waiting and is not a permanent maximum', async () => {
    const server = heldServer(LOW);
    const scheduler = new NetScheduler({ fetchImpl: server.fetchImpl, maxConcurrent: 1, stallTimeoutMs: 0 });
    const sent = recordPriorities(scheduler);
    const header = K.parseHeader(LOW);
    const end5 = K.prefixEndForLevel(header, 5);
    const end0 = K.prefixEndForLevel(header, 0);
    const store = new TextureByteStore({ scheduler, cacheStorage: null, firstRangeBytes: 64, chunkBytes: 256 });

    let resolved0 = false;
    const level0 = store.ensureLevel('p', 0, { priority: NET_PRIORITY.PREFETCH }).then(r => { resolved0 = true; return r; });
    while (!store.peek('p')?.header) await server.releaseOne();
    assert.ok(store.peek('p').length < end5, 'fixture/chunking must leave level 5 incomplete here');
    assert.equal(sent.at(-1).priority, NET_PRIORITY.PREFETCH, 'prefetch is sent at prefetch priority');
    assert.equal(scheduler.hasDemand, false);

    // A visible caller joins: the running download inherits its urgency...
    let resolved5 = false;
    const level5 = store.ensureLevel('p', 5, { priority: NET_PRIORITY.VISIBLE }).then(r => { resolved5 = true; return r; });
    await sleep(1);
    assert.equal(sent.at(-1).priority, NET_PRIORITY.VISIBLE);
    assert.equal(scheduler.hasDemand, true);

    // ...and is released as soon as its own bytes are present, long before
    // the level-0 download it rode along with has finished.
    while (!resolved5) await server.releaseOne();
    const five = await level5;
    assert.equal(resolved0, false);
    assert.ok(five.bytes.byteLength >= end5 && five.bytes.byteLength < end0);
    assert.ok(five.level <= 5);
    assert.ok(store.stats.earlyResolves >= 1);

    // Once it is gone, the rest of the prefetch goes back to prefetch priority.
    await server.releaseOne();
    assert.equal(sent.at(-1).priority, NET_PRIORITY.PREFETCH);
    while (!resolved0) await server.releaseOne();
    const zero = await level0;
    assert.equal(zero.level, 0);
    assert.deepEqual(zero.bytes, LOW.subarray(0, zero.bytes.byteLength));
    assert.ok(zero.bytes.byteLength >= end0);
});

test('bytes already present resolve immediately, without queueing behind a download', async () => {
    const server = heldServer(LOW);
    const scheduler = new NetScheduler({ fetchImpl: server.fetchImpl, maxConcurrent: 1, stallTimeoutMs: 0 });
    const store = new TextureByteStore({ scheduler, cacheStorage: null, firstRangeBytes: 64, chunkBytes: 256 });
    const header = K.parseHeader(LOW);
    const first = store.ensureLevel('p', 5, { priority: NET_PRIORITY.VISIBLE });
    while (!(store.peek('p')?.length >= K.prefixEndForLevel(header, 5))) await server.releaseOne();
    await first;
    const refine = store.ensureLevel('p', 0, { priority: NET_PRIORITY.BACKGROUND });
    await sleep(1);
    const before = server.held.length;
    const again = await store.ensureLevel('p', 6, { priority: NET_PRIORITY.VISIBLE });
    assert.equal(again.networkBytes, 0);
    assert.equal(server.held.length, before, 'no new request was needed');
    while (server.held.length || !(store.peek('p')?.level === 0)) await server.releaseOne();
    await refine;
});

test('the memory budget holds without Cache Storage, and evicted pages refetch intact', async () => {
    const fetchImpl = async (url, init = {}) => rangeResponse(LOW, new Headers(init.headers || {}).get('Range'));
    const scheduler = new NetScheduler({ fetchImpl });
    const store = new TextureByteStore({ scheduler, cacheStorage: null, memoryBudgetBytes: 10000 });
    for (let i = 0; i < 20; i++) await store.ensureLevel(`p${i}`, 0, { priority: NET_PRIORITY.VISIBLE });
    assert.ok(store.memoryBytes <= 10000 + LOW.byteLength, `memory ${store.memoryBytes}`);
    const again = await store.ensureLevel('p0', 0, { priority: NET_PRIORITY.VISIBLE });
    assert.ok(again.networkBytes > 0);
    assert.deepEqual(again.bytes, LOW.subarray(0, again.bytes.byteLength));
    assert.equal(again.level, 0);
});

test('the memory budget holds when Cache Storage rejects writes (quota)', async () => {
    const fetchImpl = async (url, init = {}) => rangeResponse(LOW, new Headers(init.headers || {}).get('Range'));
    const cacheStorage = {
        async open() {
            return {
                async match() { return undefined; },
                async put() { throw Object.assign(new Error('quota'), { name: 'QuotaExceededError' }); },
            };
        },
    };
    const store = new TextureByteStore({ scheduler: new NetScheduler({ fetchImpl }), cacheStorage, memoryBudgetBytes: 10000 });
    for (let i = 0; i < 20; i++) {
        await store.ensureLevel(`p${i}`, 0, { priority: NET_PRIORITY.VISIBLE });
        await sleep(0);
    }
    assert.ok(store.stats.persistFailures > 0);
    assert.ok(store.memoryBytes <= 10000 + 2 * LOW.byteLength, `memory ${store.memoryBytes}`);
    const again = await store.ensureLevel('p1', 0, { priority: NET_PRIORITY.VISIBLE });
    assert.deepEqual(again.bytes, LOW.subarray(0, again.bytes.byteLength));
});
