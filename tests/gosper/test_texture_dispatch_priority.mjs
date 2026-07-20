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
    TIER_STATE,
    lowTextureCoveragePending,
    pruneTextureDispatchQueue,
    selectTextureDispatchTaskIndex,
    setTierState,
    tierState,
    textureStateHasDemand,
} = await import(`data:text/javascript;base64,${Buffer.from(moduleSource).toString('base64')}`);

function state(key) {
    return {
        key,
        assets: new Map(),
        tierStates: new Map(),
        _tierLoadingStartMs: new Map(),
        classification: 'outside',
        desiredTier: TIER.LOW,
    };
}

function markLoading(page, tier) {
    if (tierState(page, tier) === TIER_STATE.ABSENT) {
        setTierState(page, tier, TIER_STATE.QUEUED, { validate: true });
    }
    setTierState(page, tier, TIER_STATE.LOADING, { validate: true });
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
markLoading(states.get('b'), TIER.LOW);
assert.deepEqual(
    take(queue, states, { lowCoverageFirst: true }),
    { key: 'c', tier: TIER.LOW, priority: 10 },
);
markLoading(states.get('c'), TIER.LOW);
assert.deepEqual(
    take(queue, states, { lowCoverageFirst: true }),
    { key: 'a', tier: TIER.LOW, priority: -1000 },
);
markLoading(states.get('a'), TIER.LOW);

// Loading is still pending coverage. With all low requests dispatched, an
// upgrade waits rather than stealing a worker while the floor is incomplete.
assert.equal(take(queue, states, { lowCoverageFirst: true }), null);

// Successful installs and terminal failures both release the barrier. A bad
// low page therefore cannot starve every medium/high request forever.
for (const key of ['a', 'b']) {
    setTierState(states.get(key), TIER.LOW, TIER_STATE.ABSENT, { validate: true });
    states.get(key).assets.set(TIER.LOW, { key: `${key}-low` });
}
setTierState(states.get('c'), TIER.LOW, TIER_STATE.FAILED, { validate: true });
assert.equal(lowTextureCoveragePending(states), false);
assert.deepEqual(
    take(queue, states, { lowCoverageFirst: true }),
    { key: 'a', tier: TIER.HIGH, priority: 1e12 },
);

// A newly retryable/queued low page reinstates the barrier and preempts an
// existing upgrade; after it installs, normal priority selection resumes.
setTierState(states.get('c'), TIER.LOW, TIER_STATE.ABSENT, { validate: true });
queue.push({ key: 'c', tier: TIER.LOW, priority: -5000 });
queue.push({ key: 'b', tier: TIER.HIGH, priority: 1e15 });
assert.deepEqual(
    take(queue, states, { lowCoverageFirst: true }),
    { key: 'c', tier: TIER.LOW, priority: -5000 },
);
states.get('c').assets.set(TIER.LOW, { key: 'c-low' });
assert.equal(take(queue, states, { lowCoverageFirst: true }).key, 'b');

// Without the mini-corpus barrier, normal priority selection applies and
// camera motion continues to suppress only high work.
const ordinaryQueue = [
    { key: 'a', tier: TIER.HIGH, priority: 300 },
    { key: 'a', tier: TIER.MEDIUM, priority: 200 },
    { key: 'a', tier: TIER.LOW, priority: 100 },
];
assert.equal(take([...ordinaryQueue], states).tier, TIER.HIGH);
assert.equal(take([...ordinaryQueue], states, { isMoving: true }).tier, TIER.MEDIUM);

// Bounded aging preserves visible-first dispatch while guaranteeing that a
// retained lower-priority task eventually gets a turn under sustained churn.
const agingQueue = [
    { key: 'b', tier: TIER.MEDIUM, priority: 1, enqueuedSequence: 0 },
    { key: 'a', tier: TIER.MEDIUM, priority: 1e9, enqueuedSequence: 8 },
];
assert.equal(selectTextureDispatchTaskIndex(agingQueue, states, {
    dispatchSequence: 7,
}), 1);
assert.equal(selectTextureDispatchTaskIndex(agingQueue, states, {
    dispatchSequence: 16,
}), 0);

// A one-degree global page manifest is large enough to reproduce the failure
// hidden by the Stubai mini-bake: 64,800 unrelated postage assets used to be
// admitted into the same queue as the handful surrounding the camera.
const globalStates = new Map();
for (let latitude = -90; latitude < 90; latitude++) {
    for (let longitude = -180; longitude < 180; longitude++) {
        const key = `world_${longitude}_${latitude}`;
        globalStates.set(key, state(key));
    }
}
assert.equal(globalStates.size, 64800);

const visibleKeys = ['world_11_47', 'world_12_47'];
const guardKeys = ['world_10_47', 'world_13_47', 'world_11_46', 'world_12_48'];
for (const key of visibleKeys) {
    const page = globalStates.get(key);
    page.classification = 'visible';
    page.desiredTier = TIER.HIGH;
}
for (const key of guardKeys) {
    const page = globalStates.get(key);
    page.classification = 'guard';
    page.desiredTier = TIER.MEDIUM;
}
assert.deepEqual(
    [...globalStates.values()].filter(page => textureStateHasDemand(page)).map(page => page.key).sort(),
    [...visibleKeys, ...guardKeys].sort(),
    'only the visible frustum and explicit guard band are admitted',
);

// Reconcile a deliberately bad legacy queue containing every world low. The
// active queue retains exactly six lows, six medium requests, and two visible
// high requests; no outside low survives admission.
const legacyGlobalQueue = [];
for (const page of globalStates.values()) {
    setTierState(page, TIER.LOW, TIER_STATE.QUEUED, { validate: true });
    legacyGlobalQueue.push({ key: page.key, tier: TIER.LOW, priority: -1 });
}
for (const key of [...visibleKeys, ...guardKeys]) {
    const page = globalStates.get(key);
    setTierState(page, TIER.MEDIUM, TIER_STATE.QUEUED, { validate: true });
    legacyGlobalQueue.push({ key, tier: TIER.MEDIUM, priority: 1e9 });
}
for (const key of visibleKeys) {
    const page = globalStates.get(key);
    setTierState(page, TIER.HIGH, TIER_STATE.QUEUED, { validate: true });
    legacyGlobalQueue.push({ key, tier: TIER.HIGH, priority: 2e9 });
}
const scopedGlobalQueue = pruneTextureDispatchQueue(legacyGlobalQueue, globalStates);
assert.equal(scopedGlobalQueue.filter(task => task.tier === TIER.LOW).length, 6);
assert.equal(scopedGlobalQueue.filter(task => task.tier === TIER.MEDIUM).length, 6);
assert.equal(scopedGlobalQueue.filter(task => task.tier === TIER.HIGH).length, 2);
assert.equal(scopedGlobalQueue.some(task => (
    globalStates.get(task.key).classification === 'outside'
)), false);
assert.equal(tierState(globalStates.get('world_-180_-90'), TIER.LOW), TIER_STATE.ABSENT);
assert.equal(take([...scopedGlobalQueue], globalStates, {
    lowCoverageFirst: true,
    lowCoverageIncludesOutside: false,
}).tier, TIER.LOW, 'active guard+visible lows gate active refinement');

// The low-first invariant is scoped to active demand. Once the six local lows
// are terminal, visible refinement proceeds even though all 64,794 outside
// lows remain absent and non-terminal.
const refinementQueue = scopedGlobalQueue.filter(task => task.tier !== TIER.LOW);
for (const key of [...visibleKeys, ...guardKeys]) {
    globalStates.get(key).assets.set(TIER.LOW, { key: `${key}-low` });
}
assert.equal(lowTextureCoveragePending(globalStates, { includeOutside: false }), false);
assert.equal(lowTextureCoveragePending(globalStates, { includeOutside: true }), true);
const firstRefinement = take(refinementQueue, globalStates, {
    lowCoverageFirst: true,
    lowCoverageIncludesOutside: false,
});
assert.ok(firstRefinement);
assert.ok(visibleKeys.includes(firstRefinement.key));
assert.equal(firstRefinement.tier, TIER.HIGH);

// Camera motion cancels stale queued work without pretending an already
// running request was aborted. The old in-flight low is ignored by the new
// frustum barrier, while the new view immediately establishes its own floor.
const oldVisible = globalStates.get(visibleKeys[0]);
oldVisible.classification = 'outside';
oldVisible.desiredTier = TIER.LOW;
markLoading(oldVisible, TIER.LOW);
setTierState(oldVisible, TIER.HIGH, TIER_STATE.QUEUED, { validate: true });
const movedKey = 'world_-122_37';
const movedState = globalStates.get(movedKey);
movedState.classification = 'visible';
movedState.desiredTier = TIER.MEDIUM;
setTierState(movedState, TIER.LOW, TIER_STATE.QUEUED, { validate: true });
setTierState(movedState, TIER.MEDIUM, TIER_STATE.QUEUED, { validate: true });
const movedQueue = pruneTextureDispatchQueue([
    { key: oldVisible.key, tier: TIER.HIGH, priority: 9e9 },
    { key: movedKey, tier: TIER.LOW, priority: 1e9 + 1000 },
    { key: movedKey, tier: TIER.MEDIUM, priority: 1e9 + 500 },
], globalStates);
assert.deepEqual(movedQueue.map(task => [task.key, task.tier]), [
    [movedKey, TIER.LOW],
    [movedKey, TIER.MEDIUM],
]);
assert.equal(tierState(oldVisible, TIER.HIGH), TIER_STATE.ABSENT);
assert.equal(tierState(oldVisible, TIER.LOW), TIER_STATE.LOADING,
    'in-flight work remains safely caller-owned');
assert.equal(take(movedQueue, globalStates, {
    lowCoverageFirst: true,
    lowCoverageIncludesOutside: false,
}).tier, TIER.LOW);

// The existing mini-bake contract remains a complete-fixture pin. Its outside
// The selector still supports an explicit legacy whole-corpus barrier, but the
// runtime no longer enables it for Stubai beta.
const miniStates = new Map([['mini-a', state('mini-a')], ['mini-b', state('mini-b')]]);
const miniQueue = [
    { key: 'mini-a', tier: TIER.LOW, priority: -1000 },
    { key: 'mini-a', tier: TIER.MEDIUM, priority: -2000 },
    { key: 'mini-b', tier: TIER.LOW, priority: -1000 },
    { key: 'mini-b', tier: TIER.MEDIUM, priority: -2000 },
];
for (const task of miniQueue) {
    setTierState(miniStates.get(task.key), task.tier, TIER_STATE.QUEUED, { validate: true });
}
const retainedMiniQueue = pruneTextureDispatchQueue(miniQueue, miniStates, {
    includeOutside: true,
});
assert.equal(retainedMiniQueue.length, 4);
assert.equal(take(retainedMiniQueue, miniStates, {
    lowCoverageFirst: true,
    lowCoverageIncludesOutside: true,
}).tier, TIER.LOW);

// Runtime integration: green coverage gates refinement, yellow is permanently
// disabled after first display, and outside pages remain demand-scoped.
const mainSource = fs.readFileSync(path.join(here, '../../frontend/app/main.js'), 'utf8');
assert.match(mainSource, /selectTextureDispatchTaskIndex\(\s*this\.textureQueue,\s*this\.textureStates,/s);
assert.match(mainSource, /lowCoverageFirst:\s*true/);
assert.match(mainSource, /allowBootstrap:\s*this\.bootstrapPhaseActive/);
assert.match(mainSource, /if \(hasDisplayedPage\) this\._finishTextureBootstrapPhase\(\)/);
assert.match(mainSource, /return Number\.isFinite\(state\?\.distanceMeters\) \? -state\.distanceMeters/);
assert.match(mainSource, /this\._highTextureCachePriority\(state\),\s*victimKey =>/s);
assert.doesNotMatch(mainSource, /_queueTextureTier\(page,\s*TEXTURE_TIER\.BOOTSTRAP,\s*2e9\)/);
assert.doesNotMatch(mainSource, /state\.desiredTier\s*=\s*TEXTURE_TIER\.MEDIUM/,
    'cache admission must not rewrite distance-derived quality intent');
assert.match(mainSource, /state\.highAdmissionBlocked = true;[\s\S]*?this\._scheduleTextureQuality\(/);
assert.doesNotMatch(mainSource,
    /classification === 'outside' && state\.assets\.has\(TEXTURE_TIER\.(?:LOW|MEDIUM)\)/,
    'ordinary frustum churn must preserve already-paid green and blue pages');
assert.match(mainSource, /pruneTextureDispatchQueue\(\s*this\.textureQueue,\s*residency\.states,/s);
assert.match(mainSource, /promoteVisibleConsumerPages\(residency\.states,\s*visibleConsumerPages\)/s);
assert.match(mainSource, /textureStateHasDemand\(state, \{ includeOutside: false \}\)/);

console.log('texture dispatch direct ladder and demand scope: ok');
