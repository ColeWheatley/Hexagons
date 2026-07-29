// Guards SidecarStore (design doc §1.4/§1.8): LRU eviction with pins,
// epoch coalescing (a superseded fetch still populates the cache but never
// installs), prefetch planning per the stride/direction table, the saveData
// clamp, and concurrency capping. All against a fake `postJob` — no worker,
// no THREE, matching the store's frozen interface (it calls onInstall, the
// caller wires that to atlas.installLayer()).
import test from 'node:test';
import assert from 'node:assert/strict';
import { SidecarStore } from '../sidecar_store.mjs';
import { PYRAMID_NODE_COUNT, bytesToBase64 } from '../sidecar_format.mjs';

const TILE_COUNT = 4;
const ENTRY_BYTES = TILE_COUNT * PYRAMID_NODE_COUNT;

function fakePyramid(fill = 1) {
    return new Uint8Array(ENTRY_BYTES).fill(fill);
}

function fakeIndex({ hours = 48, presentSlots = null, startIso = '2026-01-01T00:00:00Z', latest = null } = {}) {
    const slots = presentSlots || Array.from({ length: hours }, (_, i) => i);
    const bytes = new Uint8Array(Math.ceil(hours / 8));
    for (const s of slots) bytes[s >> 3] |= (1 << (s & 7));
    const startEpochHour = Math.floor(Date.parse(startIso) / 3600000);
    // "latest" needs SOME real hour even when presentSlots is deliberately
    // empty (tests that isolate against prefetch noise) -- fall back to the
    // last hour in the window rather than indexing into an empty array.
    const lastSlot = slots.length > 0 ? slots[slots.length - 1] : hours - 1;
    return {
        ok: true,
        urlTemplate: 'powfinder/{layer}/{yyyy}/{mm}/{dd}/{hh}.pfl',
        coverage: { startIso, startEpochHour, stepHours: 1, count: hours, present: bytes },
        latest: latest || new Date((startEpochHour + lastSlot) * 3600000).toISOString(),
        layers: [
            { id: 'sqh', encoding: 'u8_linear', aggregate: 'mean' },
            { id: 'depth', encoding: 'u8_linear', aggregate: 'mean' },
            {
                id: 'avalanche', encoding: 'packed_bits',
                fields: { release: { shift: 7, bits: 1, aggregate: 'or' }, severity: { shift: 0, bits: 7, aggregate: 'max' } },
            },
        ],
        layersCoverage: {},
        engineLayers: [],
    };
}

// A controllable fake postJob: records every call, resolves/rejects
// deferred (caller decides when), always returns a fresh pyramid.
function fakePostJob() {
    const calls = [];
    const pending = [];
    function postJob(payload) {
        let resolveFn, rejectFn;
        const promise = new Promise((resolve, reject) => { resolveFn = resolve; rejectFn = reject; });
        const call = { payload, promise, resolve: resolveFn, reject: rejectFn };
        calls.push(call);
        pending.push(call);
        return promise;
    }
    postJob.calls = calls;
    postJob.pending = pending;
    postJob.resolveNext = (fill) => {
        const call = pending.shift();
        call.resolve({ pyramid: fakePyramid(fill), networkBytes: ENTRY_BYTES, sourceUrl: call.payload.url, epochHour: call.payload.epochHour, layerId: call.payload.layerId });
        return call;
    };
    postJob.resolveAll = (fill) => {
        while (pending.length) postJob.resolveNext(fill);
    };
    return postJob;
}

async function flush() {
    // Let queued microtasks (promise .then chains) settle.
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
}

// The concurrency cap (design doc §1.4: at most 2 sidecar jobs in flight)
// means a prefetch plan with more than 2 candidates only gets fully
// DISPATCHED (postJob actually called) progressively, as earlier jobs
// resolve and free a slot — not all at once. To inspect "everything the
// plan decided to fetch" rather than just "the first 2 that happened to
// dispatch first", drain the queue completely.
async function drainAll(postJob, store, fill = 1) {
    for (let i = 0; i < 200 && (store._activeJobs.size > 0 || store._queue.length > 0); i++) {
        if (postJob.pending.length > 0) postJob.resolveNext(fill);
        await flush();
    }
}

// -----------------------------------------------------------------------
// Construction
// -----------------------------------------------------------------------

test('constructor requires postJob, an ok:true index, and a positive tileCount', () => {
    assert.throws(() => new SidecarStore({ index: fakeIndex(), tileCount: TILE_COUNT }), /postJob/);
    assert.throws(() => new SidecarStore({ postJob: () => {}, index: { ok: false }, tileCount: TILE_COUNT }), /index/);
    assert.throws(() => new SidecarStore({ postJob: () => {}, index: fakeIndex(), tileCount: 0 }), /tileCount/);
});

// -----------------------------------------------------------------------
// Basic fetch + install
// -----------------------------------------------------------------------

test('setLayer + setTimestamp dispatches a LOAD_SIDECAR job with the right payload and installs on success', async () => {
    const postJob = fakePostJob();
    // Sparse presentSlots so the idle prefetch plan's neighbour candidates
    // (T+/-1, T+/-2) are all coverage-absent and never dispatch — isolates
    // this test to just the active fetch, without disabling prefetch
    // itself (that's covered separately below).
    const index = fakeIndex({ hours: 10, presentSlots: [5] });
    const store = new SidecarStore({ postJob, index, tileCount: TILE_COUNT });
    const installs = [];
    store.onInstall = (layerId, epochHour, bytes) => installs.push({ layerId, epochHour, bytes });

    store.setLayer('sqh');
    store.setTimestamp(store.index.coverage.startEpochHour + 5);
    await flush();

    assert.equal(postJob.calls.length, 1);
    const payload = postJob.calls[0].payload;
    assert.equal(payload.type, 'LOAD_SIDECAR');
    assert.equal(payload.layerId, 'sqh');
    assert.equal(payload.tileCount, TILE_COUNT);
    assert.equal(payload.encoding, 'u8_linear');
    assert.equal(payload.aggregate, 'mean');
    assert.match(payload.url, /sqh/);

    postJob.resolveNext(42);
    await flush();
    assert.equal(installs.length, 1);
    assert.equal(installs[0].layerId, 'sqh');
    assert.equal(installs[0].bytes[0], 42);
});

test('a cache hit installs immediately with no new postJob call', async () => {
    const postJob = fakePostJob();
    // presentSlots: [] -- coverageHas() is false for every hour, so no
    // prefetch candidate ever passes the filter (inferCoverageStride also
    // safely falls back to 1 with zero present bits to measure a gap from
    // -- irrelevant here either way, since nothing is "present" for
    // prefetch to target). Isolates this test to purely cache-hit-vs-fetch,
    // same pattern as the epoch-coalescing/LRU tests below.
    const store = new SidecarStore({ postJob, index: fakeIndex({ hours: 48, presentSlots: [] }), tileCount: TILE_COUNT });
    const installs = [];
    store.onInstall = (layerId, epochHour) => installs.push({ layerId, epochHour });
    const base = store.index.coverage.startEpochHour;

    store.setLayer('sqh');
    store.setTimestamp(base + 1);
    await flush();
    await drainAll(postJob, store, 7);
    assert.equal(installs.length, 1);

    const callsBefore = postJob.calls.length;
    store.setTimestamp(base + 40); // moves away, well outside the prefetch radius of hour 1
    await flush();
    await drainAll(postJob, store, 8);
    store.setTimestamp(base + 1); // back to the cached one
    await flush();

    assert.equal(postJob.calls.length, callsBefore + 1, 'only the (base+40) fetch was new; (base+1) was a cache hit');
    assert.equal(installs[installs.length - 1].epochHour, base + 1);
});

// -----------------------------------------------------------------------
// Epoch coalescing
// -----------------------------------------------------------------------

test('a superseded active fetch populates the cache but does not install', async () => {
    const postJob = fakePostJob();
    // presentSlots: [] -- coverageHas() is false for every hour, so
    // _planPrefetch() never enqueues a prefetch candidate (the active fetch
    // itself is unconditional, unaffected). Isolates this test to purely
    // the epoch-coalescing behavior it's about.
    const store = new SidecarStore({ postJob, index: fakeIndex({ presentSlots: [] }), tileCount: TILE_COUNT });
    const installs = [];
    store.onInstall = (layerId, epochHour) => installs.push({ layerId, epochHour });
    const base = store.index.coverage.startEpochHour;

    store.setLayer('sqh');
    store.setTimestamp(base + 1); // dispatches, epoch N
    await flush();
    const firstCall = postJob.pending[0];
    store.setTimestamp(base + 2); // bumps epoch before (base+1) resolves; dispatches a second job
    await flush();

    assert.equal(postJob.calls.length, 2);
    firstCall.resolve({ pyramid: fakePyramid(1), networkBytes: ENTRY_BYTES, epochHour: base + 1, layerId: 'sqh', sourceUrl: firstCall.payload.url });
    await flush();

    // Superseded: never installed...
    assert.equal(installs.some((i) => i.epochHour === base + 1), false);
    // ...but still cached (a fast drag back to it would be a cache hit).
    assert.equal(store.read('sqh', base + 1, 0, 0), 1);

    postJob.resolveAll(2);
    await flush();
    assert.equal(installs.some((i) => i.epochHour === base + 2), true, 'the current active pair still installs');
});

test('a fast scrub across many hours dispatches at most 2 concurrent jobs and installs exactly the last', async () => {
    const postJob = fakePostJob();
    // presentSlots: [] isolates this to the active-fetch/epoch behavior
    // (see the superseded-fetch test above for why) -- otherwise 40 rapid
    // setTimestamp calls each also plan an idle prefetch, and disentangling
    // "installed because it's the final active pair" from "installed
    // because a prefetch coincidentally landed on it" is unnecessary noise
    // for what this test is actually checking.
    const store = new SidecarStore({ postJob, index: fakeIndex({ hours: 48, presentSlots: [] }), tileCount: TILE_COUNT });
    const installs = [];
    store.onInstall = (layerId, epochHour) => installs.push(epochHour);
    const base = store.index.coverage.startEpochHour;

    store.setLayer('sqh');
    for (let h = 1; h <= 40; h++) {
        store.setTimestamp(base + h);
        await flush();
    }
    assert.ok(store._activeJobs.size <= 2, 'concurrency cap respected throughout');

    await drainAll(postJob, store, 1);
    assert.equal(installs.length, 1, 'exactly one install, not one per superseded hour');
    assert.equal(installs[0], base + 40, 'the last requested hour is the one that installs');
});

// -----------------------------------------------------------------------
// LRU eviction
// -----------------------------------------------------------------------

test('LRU evicts the oldest unpinned entry first when over budget', async () => {
    const postJob = fakePostJob();
    // presentSlots: [] -- isolate from prefetch noise (see the
    // superseded-fetch test above); this test is purely about eviction
    // order, not about what prefetch would additionally cache.
    // Budget for exactly 3 entries.
    const store = new SidecarStore({ postJob, index: fakeIndex({ hours: 10, presentSlots: [] }), tileCount: TILE_COUNT, budgetBytes: ENTRY_BYTES * 3 });
    const base = store.index.coverage.startEpochHour;
    store.setLayer('sqh');

    for (const h of [1, 2, 3, 4]) {
        store.setTimestamp(base + h);
        await flush();
        await drainAll(postJob, store, h);
    }

    // 4 fetches into a 3-entry budget: the oldest (base+1) must be gone,
    // the rest survive.
    assert.equal(store.cache.has(`sqh@${base + 1}`), false);
    assert.equal(store.cache.has(`sqh@${base + 2}`), true);
    assert.equal(store.cache.has(`sqh@${base + 3}`), true);
    assert.equal(store.cache.has(`sqh@${base + 4}`), true);
});

test('pinned entries (active + live anchor) are never evicted, even when oldest', async () => {
    const hours = 10;
    const index = fakeIndex({ hours, presentSlots: [] }); // isolate from prefetch, as above
    const base = index.coverage.startEpochHour;
    const liveHour = Math.floor(Date.parse(index.latest) / 3600000);

    const postJob = fakePostJob();
    const store = new SidecarStore({ postJob, index, tileCount: TILE_COUNT, budgetBytes: ENTRY_BYTES * 2 });
    store.setLayer('sqh');

    // Fetch the live-anchor hour first (oldest lastUsed of anything pinned).
    store.setTimestamp(liveHour);
    await flush(); await drainAll(postJob, store, 1);

    // Now churn through several other hours, well past the 2-entry budget.
    for (const h of [base, base + 1, base + 2, base + 3]) {
        if (h === liveHour) continue;
        store.setTimestamp(h);
        await flush(); await drainAll(postJob, store, 2);
    }

    assert.equal(store.cache.has(`sqh@${liveHour}`), true, 'live anchor survives eviction despite being the oldest entry');
    // The current active timestamp is also pinned.
    assert.equal(store.cache.has(`sqh@${store.activeTimestamp}`), true);
});

// -----------------------------------------------------------------------
// Prefetch planning (design doc §1.8's stride/direction table)
// -----------------------------------------------------------------------

function prefetchedHours(postJob, base) {
    return postJob.calls
        .filter((c) => c.payload.epochHour !== undefined)
        .map((c) => c.payload.epochHour - base)
        .sort((a, b) => a - b);
}

test('D=0 (idle) prefetches T +/- S .. T +/- 6S (§1.8 re-spec 2026-07-29: ahead/behind, not one shared cap)', async () => {
    const postJob = fakePostJob();
    const store = new SidecarStore({ postJob, index: fakeIndex({ hours: 48 }), tileCount: TILE_COUNT });
    const base = store.index.coverage.startEpochHour;
    store.setLayer('sqh');
    store.setScrubStride(1);
    store.setScrubDirection(0);
    store.setTimestamp(base + 20);
    await flush();
    await drainAll(postJob, store);

    const offsets = prefetchedHours(postJob, base);
    // 20 (active) plus prefetch at 14..19 and 21..26 (idle depth 6/6).
    assert.deepEqual(offsets, Array.from({ length: 13 }, (_, i) => 14 + i));
});

test('D!=0 (dragging) prefetches T+D*S..T+12*D*S ahead plus T-D*S..T-2*D*S behind', async () => {
    const postJob = fakePostJob();
    const store = new SidecarStore({ postJob, index: fakeIndex({ hours: 48 }), tileCount: TILE_COUNT });
    const base = store.index.coverage.startEpochHour;
    store.setLayer('sqh');
    store.setScrubStride(1);
    store.setScrubDirection(1);
    store.setTimestamp(base + 20);
    await flush();
    await drainAll(postJob, store);

    const offsets = prefetchedHours(postJob, base);
    // behind(18,19) + active(20) + ahead(21..32): drag depths are 12 ahead / 2 behind.
    assert.deepEqual(offsets, Array.from({ length: 15 }, (_, i) => 18 + i));
});

test('D!=0 with negative direction mirrors the same window backward', async () => {
    const postJob = fakePostJob();
    const store = new SidecarStore({ postJob, index: fakeIndex({ hours: 48 }), tileCount: TILE_COUNT });
    const base = store.index.coverage.startEpochHour;
    store.setLayer('sqh');
    store.setScrubStride(1);
    store.setScrubDirection(-1);
    store.setTimestamp(base + 30);
    await flush();
    await drainAll(postJob, store);

    const offsets = prefetchedHours(postJob, base);
    // ahead(29..18, 12 back) + active(30) + behind(31,32).
    assert.deepEqual(offsets, Array.from({ length: 15 }, (_, i) => 18 + i));
});

test('prefetch skips hours the active layer\'s own coverage marks absent', async () => {
    const postJob = fakePostJob();
    const presentSlots = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 18, 19, 20, 21, 22]; // holes elsewhere in the +/-12 window
    const index = fakeIndex({ hours: 48, presentSlots });
    const store = new SidecarStore({ postJob, index, tileCount: TILE_COUNT });
    const base = store.index.coverage.startEpochHour;
    store.setLayer('sqh');
    store.setScrubStride(1);
    store.setScrubDirection(0);
    store.setTimestamp(base + 20); // present
    await flush();
    await drainAll(postJob, store);

    const offsets = prefetchedHours(postJob, base);
    // Every dispatched hour (active + prefetch) must be one the bitmask marks present.
    for (const o of offsets) assert.ok(presentSlots.includes(o), `hour ${o} was dispatched but not present`);
});

// -----------------------------------------------------------------------
// Stride inference (amendment 3): setLayer() derives scrubStride from the
// layer's own coverage bitmask density, never a hardcoded layer id.
// -----------------------------------------------------------------------

test('setLayer infers scrubStride from the layer\'s own coverage bitmask density, not a hardcoded layer id', async () => {
    const postJob = fakePostJob();
    const index = fakeIndex({ hours: 72 });
    // Daily-cadence override, 24h apart -- the real backend emits exactly
    // this shape for avalanche (snow_backend build_index()'s layers_coverage).
    const dailyBytes = new Uint8Array(Math.ceil(72 / 8));
    for (const s of [12, 36, 60]) dailyBytes[s >> 3] |= (1 << (s & 7));
    index.layersCoverage = { avalanche: { count: 72, present: dailyBytes } };

    const store = new SidecarStore({ postJob, index, tileCount: TILE_COUNT });
    store.setLayer('sqh');
    assert.equal(store.scrubStride, 1, 'hourly layer infers stride 1');

    store.setLayer('avalanche');
    assert.equal(store.scrubStride, 24, 'daily layer infers stride 24 from its bitmask, not the string "avalanche"');
});

test('saveData stops speculation entirely: only the active hour dispatches (§1.8 re-spec Q2)', async () => {
    const postJob = fakePostJob();
    const store = new SidecarStore({ postJob, index: fakeIndex({ hours: 48 }), tileCount: TILE_COUNT, connection: { saveData: true } });
    const base = store.index.coverage.startEpochHour;
    store.setLayer('sqh');
    store.setScrubStride(1);
    store.setScrubDirection(0);
    store.setTimestamp(base + 20);
    await flush();
    await drainAll(postJob, store);

    const offsets = prefetchedHours(postJob, base);
    assert.deepEqual(offsets, [20]); // on-demand only, saveData is a preference not a measurement
});

test('effectiveType 2g/3g/slow-2g scales to 4 ahead / 2 behind (a measurement, not disabled)', async () => {
    for (const effectiveType of ['slow-2g', '2g', '3g']) {
        const postJob = fakePostJob();
        const store = new SidecarStore({ postJob, index: fakeIndex({ hours: 48 }), tileCount: TILE_COUNT, connection: { effectiveType } });
        const base = store.index.coverage.startEpochHour;
        store.setLayer('sqh');
        store.setScrubDirection(0);
        store.setTimestamp(base + 20);
        await flush();
        await drainAll(postJob, store);
        assert.deepEqual(prefetchedHours(postJob, base), [18, 19, 20, 21, 22, 23, 24], `effectiveType=${effectiveType}`);
    }
});

test('a re-plan (timestamp change) prunes queued-but-not-started prefetches outside the new window (Ruling 3)', async () => {
    const postJob = fakePostJob();
    const store = new SidecarStore({ postJob, index: fakeIndex({ hours: 96 }), tileCount: TILE_COUNT });
    const base = store.index.coverage.startEpochHour;
    store.setLayer('sqh');
    store.setScrubStride(1);
    store.setScrubDirection(0);
    store.setTimestamp(base + 20); // plans window 14..26; concurrency cap 2 leaves most of it queued, not dispatched
    await flush();

    store.setTimestamp(base + 60); // far outside the old window -- re-plan must drop the stale queued entries
    await flush();
    await drainAll(postJob, store);

    const offsets = prefetchedHours(postJob, base);
    assert.ok(!offsets.includes(15), 'a queued-but-not-dispatched hour from the abandoned window must not fetch');
    assert.ok(offsets.includes(60), 'the new active hour must still fetch');
});

// -----------------------------------------------------------------------
// isMovingView suspension
// -----------------------------------------------------------------------

test('new jobs are suspended while isMovingView, and resume() drains the queue once settled', async () => {
    let moving = true;
    const postJob = fakePostJob();
    const store = new SidecarStore({ postJob, index: fakeIndex({ hours: 10 }), tileCount: TILE_COUNT, isMovingView: () => moving });
    const base = store.index.coverage.startEpochHour;

    store.setLayer('sqh');
    store.setTimestamp(base + 1);
    await flush();
    assert.equal(postJob.calls.length, 0, 'nothing dispatched while moving');
    assert.equal(store.hasPendingWork(), true, 'work is queued, just not dispatched');

    moving = false;
    store.resume();
    await flush();
    // At least the active hour dispatches once settled (a same-tick idle
    // prefetch plan may also have queued neighbours -- concurrency cap 2
    // means some of those legitimately dispatch alongside it).
    assert.ok(postJob.calls.length >= 1, 'dispatched once settled');
    assert.equal(postJob.calls.filter((c) => c.payload.epochHour === base + 1).length, 1, 'the active hour dispatches exactly once');
});

// -----------------------------------------------------------------------
// setLayer stride inference (amendment 3): scrubStride defaults from the
// newly-active layer's own coverage bitmask density (sidecar_format.mjs's
// inferCoverageStride), never a hardcoded per-layer-id guess.
// -----------------------------------------------------------------------

test("setLayer infers scrubStride from the layer's own coverage bitmask, not the layer id", async () => {
    const postJob = fakePostJob();
    const hours = 96;
    const startEpochHour = Math.floor(Date.parse('2026-01-01T00:00:00Z') / 3600000);
    // avalanche present only every 24th hour (daily 12:00-style cadence);
    // sqh present every hour.
    const avalancheSlots = [12, 36, 60, 84];
    const avalancheBytes = new Uint8Array(Math.ceil(hours / 8));
    for (const s of avalancheSlots) avalancheBytes[s >> 3] |= (1 << (s & 7));
    const sqhBytes = new Uint8Array(Math.ceil(hours / 8)).fill(0xff);

    const index = {
        ok: true,
        urlTemplate: 'powfinder/{layer}/{yyyy}/{mm}/{dd}/{hh}.pfl',
        coverage: { startIso: '2026-01-01T00:00:00Z', startEpochHour, stepHours: 1, count: hours, present: sqhBytes },
        latest: new Date((startEpochHour + 84) * 3600000).toISOString(),
        layers: [
            { id: 'sqh', encoding: 'u8_linear', aggregate: 'mean' },
            { id: 'avalanche', encoding: 'packed_bits', fields: { severity: { shift: 0, bits: 7, aggregate: 'max' } } },
        ],
        layersCoverage: { avalanche: { count: hours, present: avalancheBytes } },
        engineLayers: [],
    };

    const store = new SidecarStore({ postJob, index, tileCount: TILE_COUNT });
    store.setLayer('sqh');
    assert.equal(store.scrubStride, 1, 'hourly layer -> stride 1');

    store.setLayer('avalanche');
    assert.equal(store.scrubStride, 24, "daily layer -> stride 24, inferred from avalanche's own bitmask");

    // An explicit setScrubStride() call (the scrubber's hour/day track
    // toggle) still overrides the inferred default afterward.
    store.setScrubStride(1);
    assert.equal(store.scrubStride, 1);
});

// -----------------------------------------------------------------------
// readAll
// -----------------------------------------------------------------------

test('readAll returns raw bytes for every layer cached at the active timestamp, omitting the rest', async () => {
    const postJob = fakePostJob();
    const store = new SidecarStore({ postJob, index: fakeIndex({ hours: 10 }), tileCount: TILE_COUNT });
    const base = store.index.coverage.startEpochHour;

    store.setLayer('sqh');
    store.setTimestamp(base + 1);
    await flush();
    postJob.resolveAll(11);
    await flush();

    const result = store.readAll(0, 5);
    assert.equal(result.sqh, 11);
    assert.equal('depth' in result, false, 'depth was never fetched for this hour');
    assert.equal('avalanche' in result, false);
});
