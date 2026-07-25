import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const source = await fs.readFile(path.join(ROOT, 'frontend/app/cache_manager.js'), 'utf8');
const context = vm.createContext({ performance });
const module = new vm.SourceTextModule(source, { context });
await module.link(() => { throw new Error('cache_manager must stay dependency-free'); });
await module.evaluate();

const { CacheManager } = module.namespace;
const cache = new CacheManager(100);
const evicted = [];
const evict = key => { evicted.push(key); return true; };

assert.equal(cache.admitHigh('prominent', 40, evict, new Set(), 100), true);
assert.equal(cache.admitHigh('peripheral', 40, evict, new Set(), 10), true);
cache.updatePriority('prominent', 1000);
cache.updatePriority('peripheral', 1);
assert.equal(cache.admitHigh('incoming', 40, evict, new Set(), 500), true);
assert.deepEqual(evicted, ['peripheral'], 'least perceptible high texture must evict first');
assert.equal(cache.highEntries.has('prominent'), true);
assert.equal(cache.highEntries.has('incoming'), true);
assert.equal(cache.highBytes, 80);
const admittedRevision = cache.revision;
cache.updatePriority('incoming', 501);
assert.equal(cache.revision, admittedRevision + 1, 'distance-priority changes advance cache revision');
cache.updatePriority('incoming', 501);
assert.equal(cache.revision, admittedRevision + 1, 'unchanged distance does not cause retry churn');

const protectedCache = new CacheManager(80);
assert.equal(protectedCache.admitHigh('important-a', 40, () => true, new Set(), 1000), true);
assert.equal(protectedCache.admitHigh('important-b', 40, () => true, new Set(), 900), true);
const rejectedEvictions = [];
assert.equal(
    protectedCache.admitHigh('peripheral-arrival', 40, key => {
        rejectedEvictions.push(key);
        return true;
    }, new Set(), 10),
    false,
    'a lower-perceptibility arrival must not evict a more important resident texture',
);
assert.deepEqual(rejectedEvictions, []);
assert.equal(protectedCache.highBytes, 80);

const transactional = new CacheManager(100);
assert.equal(transactional.admitHigh('cheap', 40, () => true, new Set(), 1), true);
assert.equal(transactional.admitHigh('important', 40, () => true, new Set(), 1000), true);
const partialEvictions = [];
assert.equal(
    transactional.admitHigh('middle', 80, key => {
        partialEvictions.push(key);
        return true;
    }, new Set(), 500),
    false,
    'admission must reject before evicting when all required victims are not cheaper',
);
assert.deepEqual(partialEvictions, []);
assert.equal(transactional.highEntries.has('cheap'), true);
assert.equal(transactional.highEntries.has('important'), true);

console.log('distance-priority high texture cache: ok');
