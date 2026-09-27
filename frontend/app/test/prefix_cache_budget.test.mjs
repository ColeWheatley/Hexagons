import test from 'node:test';
import assert from 'node:assert/strict';
import { enforcePrefixCacheBudget } from '../prefix_cache_budget.mjs';

/** Cache Storage fake: keys() in write order, a re-put moves a key to the end. */
function fakeStorage(layout) {
    const stores = new Map();
    for (const [name, entries] of Object.entries(layout)) stores.set(name, new Map(entries));
    const usage = () => {
        let total = 0;
        for (const store of stores.values()) for (const size of store.values()) total += size;
        return total;
    };
    const cacheStorage = {
        async has(name) { return stores.has(name); },
        async open(name) {
            if (!stores.has(name)) stores.set(name, new Map());
            const store = stores.get(name);
            return {
                async keys() { return [...store.keys()]; },
                async delete(key) { return store.delete(key); },
                async put(key, size) { store.delete(key); store.set(key, size); },
            };
        },
    };
    return { stores, cacheStorage, estimate: async () => ({ usage: usage() }) };
}

test('under the cap nothing is touched', async () => {
    const { stores, cacheStorage, estimate } = fakeStorage({ tex: [['a', 10], ['b', 10]] });
    const result = await enforcePrefixCacheBudget({ cacheStorage, estimate, cacheNames: ['tex'], capBytes: 100 });
    assert.equal(result.deleted, 0);
    assert.equal(stores.get('tex').size, 2);
});

test('over the cap the least recently written entries go first, from both caches', async () => {
    const tex = Array.from({ length: 10 }, (_, i) => [`t${i}`, 100]);
    const gsp = Array.from({ length: 10 }, (_, i) => [`g${i}`, 20]);
    const { stores, cacheStorage, estimate } = fakeStorage({ tex, gsp, other: [['keep', 500]] });
    const texCache = await cacheStorage.open('tex');
    await texCache.put('t0', 100); // rewritten (refined) most recently: survives longest
    const result = await enforcePrefixCacheBudget({
        cacheStorage, estimate, cacheNames: ['tex', 'gsp', 'missing'], capBytes: 1500, targetRatio: 0.8, batchSize: 4,
    });
    assert.ok(result.usageBefore > 1500);
    assert.ok(result.usageAfter <= 1200, `usage ${result.usageAfter}`);
    assert.ok(stores.get('tex').has('t0'), 'recently rewritten page kept');
    assert.ok(!stores.get('tex').has('t1'), 'oldest page dropped');
    assert.ok(!stores.get('gsp').has('g0'), 'terrain cache pruned too');
    assert.ok(stores.get('other').has('keep'), 'caches not named are never touched');
    assert.equal(stores.has('missing'), false, 'absent caches are not created');
});

test('no estimate API or no caches means no work', async () => {
    assert.equal(await enforcePrefixCacheBudget({ cacheStorage: null, cacheNames: ['x'], capBytes: 1 }), null);
    const { cacheStorage } = fakeStorage({ tex: [['a', 10]] });
    const result = await enforcePrefixCacheBudget({ cacheStorage, estimate: async () => undefined, cacheNames: ['tex'], capBytes: 1 });
    assert.equal(result.deleted, 0);
});
