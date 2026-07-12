import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const moduleSource = fs.readFileSync(
    path.join(here, '../../frontend/app/texture_page_residency.js'),
    'utf8',
);
const {
    PAGE_TEXTURE_TIER: TIER,
    lowTextureCoveragePending,
    selectTextureDispatchTaskIndex,
} = await import(`data:text/javascript;base64,${Buffer.from(moduleSource).toString('base64')}`);

function state(key) {
    return {
        key,
        assets: new Map(),
        loading: new Set(),
        queued: new Set(),
        failed: new Set(),
    };
}

function take(queue, states, options = {}) {
    const index = selectTextureDispatchTaskIndex(queue, states, options);
    return index < 0 ? null : queue.splice(index, 1)[0];
}

const states = new Map([
    ['a', state('a')],
    ['b', state('b')],
    ['c', state('c')],
]);
const queue = [
    { key: 'a', tier: TIER.HIGH, priority: 1e12 },
    { key: 'a', tier: TIER.MEDIUM, priority: 1e11 },
    { key: 'a', tier: TIER.LOW, priority: -1000 },
    { key: 'b', tier: TIER.LOW, priority: 20 },
    { key: 'c', tier: TIER.LOW, priority: 10 },
];

// Numeric perceptibility can never let a 4096/256 upgrade jump the global
// 128px coverage floor. Low tasks still retain their own priority ordering.
assert.equal(lowTextureCoveragePending(states), true);
assert.deepEqual(
    take(queue, states, { lowCoverageFirst: true }),
    { key: 'b', tier: TIER.LOW, priority: 20 },
);
states.get('b').loading.add(TIER.LOW);
assert.deepEqual(
    take(queue, states, { lowCoverageFirst: true }),
    { key: 'c', tier: TIER.LOW, priority: 10 },
);
states.get('c').loading.add(TIER.LOW);
assert.deepEqual(
    take(queue, states, { lowCoverageFirst: true }),
    { key: 'a', tier: TIER.LOW, priority: -1000 },
);
states.get('a').loading.add(TIER.LOW);

// Loading is still pending coverage. With all low requests dispatched, an
// upgrade waits rather than stealing a worker while the floor is incomplete.
assert.equal(take(queue, states, { lowCoverageFirst: true }), null);

// Successful installs and terminal failures both release the barrier. A bad
// low page therefore cannot starve every medium/high request forever.
for (const key of ['a', 'b']) {
    states.get(key).loading.delete(TIER.LOW);
    states.get(key).assets.set(TIER.LOW, { key: `${key}-low` });
}
states.get('c').loading.delete(TIER.LOW);
states.get('c').failed.add(TIER.LOW);
assert.equal(lowTextureCoveragePending(states), false);
assert.deepEqual(
    take(queue, states, { lowCoverageFirst: true }),
    { key: 'a', tier: TIER.HIGH, priority: 1e12 },
);

// A newly retryable/queued low page reinstates the barrier and preempts an
// existing upgrade; after it installs, normal priority selection resumes.
states.get('c').failed.delete(TIER.LOW);
queue.push({ key: 'c', tier: TIER.LOW, priority: -5000 });
queue.push({ key: 'b', tier: TIER.HIGH, priority: 1e15 });
assert.deepEqual(
    take(queue, states, { lowCoverageFirst: true }),
    { key: 'c', tier: TIER.LOW, priority: -5000 },
);
states.get('c').assets.set(TIER.LOW, { key: 'c-low' });
assert.equal(take(queue, states, { lowCoverageFirst: true }).key, 'b');

// Existing behavior is preserved when the global barrier is not requested,
// and camera motion continues to suppress only high work.
const legacyQueue = [
    { key: 'a', tier: TIER.HIGH, priority: 300 },
    { key: 'a', tier: TIER.MEDIUM, priority: 200 },
    { key: 'a', tier: TIER.LOW, priority: 100 },
];
assert.equal(take([...legacyQueue], states).tier, TIER.HIGH);
assert.equal(take([...legacyQueue], states, { isMoving: true }).tier, TIER.MEDIUM);

// Production integration: the worker dispatcher must invoke this exact pure
// selector with the page-corpus barrier enabled.
const mainSource = fs.readFileSync(path.join(here, '../../frontend/app/main.js'), 'utf8');
assert.match(mainSource, /selectTextureDispatchTaskIndex\(\s*this\.textureQueue,\s*this\.textureStates,/s);
assert.match(mainSource, /lowCoverageFirst:\s*Boolean\(this\.texturePageGrid\s*&&\s*this\.isMiniBake\)/);

console.log('texture dispatch low-tier barrier: ok');
