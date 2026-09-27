// @atlas: Keeps the persistent Range-prefix caches (KTX2 texture pages,
// GSP3 terrain tiles) from growing without bound on disk. Every page or tile
// ever viewed is persisted so revisits are free, which on a long session can
// add up to gigabytes. Cache Storage lists keys in write order (a re-put
// moves an entry to the end), so deleting from the front drops the entries
// written least recently. Sizes come from the origin-wide storage estimate,
// re-checked after each batch, so no per-entry size index is needed.

export const PREFIX_CACHE_CAP_BYTES = Object.freeze({
    high: 2 * 1024 ** 3,
    mid: 768 * 1024 ** 2,
    low: 256 * 1024 ** 2,
});

/**
 * Delete least-recently-written prefix entries until origin usage is below
 * `targetRatio × capBytes`. Returns { usageBefore, usageAfter, deleted }.
 */
export async function enforcePrefixCacheBudget({
    cacheStorage = globalThis.caches,
    estimate = () => globalThis.navigator?.storage?.estimate?.(),
    cacheNames,
    capBytes,
    targetRatio = 0.8,
    batchSize = 64,
    maxBatches = 200,
}) {
    if (!cacheStorage || !cacheNames?.length || !(capBytes > 0)) return null;
    const first = await estimate();
    const usageBefore = first?.usage;
    if (!Number.isFinite(usageBefore) || usageBefore <= capBytes) {
        return { usageBefore, usageAfter: usageBefore, deleted: 0 };
    }
    const target = capBytes * targetRatio;
    const caches = [];
    for (const name of cacheNames) {
        if (typeof cacheStorage.has === 'function' && !(await cacheStorage.has(name))) continue;
        const cache = await cacheStorage.open(name);
        caches.push({ cache, keys: await cache.keys(), next: 0 });
    }
    let usage = usageBefore;
    let deleted = 0;
    for (let batch = 0; batch < maxBatches && usage > target; batch++) {
        // Take the oldest entries across caches, round-robin, so neither the
        // texture nor the terrain cache is emptied first.
        let took = 0;
        for (let i = 0; took < batchSize; i++) {
            const live = caches.filter(c => c.next < c.keys.length);
            if (!live.length) break;
            const c = live[i % live.length];
            await c.cache.delete(c.keys[c.next++]);
            took++;
            deleted++;
        }
        if (!took) break;
        const now = await estimate();
        if (!Number.isFinite(now?.usage)) break;
        usage = now.usage;
    }
    return { usageBefore, usageAfter: usage, deleted };
}
