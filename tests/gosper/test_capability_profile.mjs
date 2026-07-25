import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const profileSource = fs.readFileSync(path.join(here, '../../frontend/app/capability_profile.js'), 'utf8');
const profile = await import(`data:text/javascript;base64,${Buffer.from(profileSource).toString('base64')}`);

const MiB = 1024 * 1024;
const matrix = [
    [{ deviceMemory: 2, hardwareConcurrency: 4, effectiveType: '4g' }, 'low', 64 * MiB, 2, 1],
    [{ deviceMemory: 4, hardwareConcurrency: 4, effectiveType: '4g' }, 'mid', 128 * MiB, 3, 1],
    [{ deviceMemory: 16, hardwareConcurrency: 12, effectiveType: '4g' }, 'high', 256 * MiB, 6, 2],
    [{ deviceMemory: 16, hardwareConcurrency: 12, effectiveType: '4g', saveData: true }, 'low', 64 * MiB, 2, 1],
    [{ deviceMemory: 16, hardwareConcurrency: 12, effectiveType: '3g' }, 'low', 64 * MiB, 2, 1],
    [{ deviceMemory: 16, hardwareConcurrency: 12, effectiveType: '4g', contextLosses: 2 }, 'low', 64 * MiB, 2, 1],
    [{ hardwareConcurrency: 10 }, 'high', 256 * MiB, 6, 2],
    [{ deviceMemory: 8 }, 'high', 256 * MiB, 6, 2],
    [{}, 'mid', 128 * MiB, 3, 1],
];

for (const [signals, name, budget, workers, transferSlots] of matrix) {
    const actual = profile.resolveCapabilityProfile(signals);
    assert.equal(actual.name, name, JSON.stringify(signals));
    assert.equal(actual.textureBudgetBytes, budget, `${name} texture budget`);
    assert.equal(actual.workerCount, workers, `${name} workers`);
    assert.equal(actual.maxTextureJobs, transferSlots, `${name} transfer slots`);
}

// Integration boundary: Save-Data lowers every source of speculative demand:
// worker pool, texture transfer concurrency, cache residency, high tier, and
// guard-frustum prefetch are all strictly below the unchanged high profile.
const high = profile.resolveCapabilityProfile({
    deviceMemory: 16, hardwareConcurrency: 12, effectiveType: '4g', saveData: false,
});
const savedata = profile.resolveCapabilityProfile({
    deviceMemory: 16, hardwareConcurrency: 12, effectiveType: '4g', saveData: true,
});
assert.equal(savedata.name, 'low');
assert.ok(savedata.workerCount < high.workerCount);
assert.ok(savedata.maxTextureJobs < high.maxTextureJobs);
assert.ok(savedata.textureBudgetBytes < high.textureBudgetBytes);
assert.ok(savedata.highTextureDistanceM < high.highTextureDistanceM);
assert.ok(savedata.guardMarginScale < high.guardMarginScale);

const main = fs.readFileSync(path.join(here, '../../frontend/app/main.js'), 'utf8');
assert.match(main, /new CacheManager\(this\.capabilityProfile\.textureBudgetBytes\)/);
assert.match(main, /this\.capabilityProfile\.workerCount/);
assert.match(main, /this\.capabilityProfile\.maxTextureJobs/);
assert.match(main, /this\.capabilityProfile\.guardMarginScale/);

console.log('capability profile matrix and Save-Data integration: ok');
