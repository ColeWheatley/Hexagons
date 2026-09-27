import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../texture_page_residency.js', import.meta.url), 'utf8');
const {
    PAGE_TEXTURE_TIER,
    screenSpaceTextureLevel,
    tierForTextureLevel,
    residentHighLevel,
    nextHighLevel,
    highRefinementPending,
    textureTierRequestPlan,
} = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('screen-space levels refine at the exact pixel boundary and coarsen after hysteresis', () => {
    const options = { pageSizeM: 1024, baseSizePx: 4096, hysteresis: 0.25 };
    // At 1000 m, a 1000 px focal length needs exactly 1024 texture pixels.
    assert.equal(screenSpaceTextureLevel(999, 1000, options), 1);
    assert.equal(screenSpaceTextureLevel(1000, 1000, options), 2);
    assert.equal(screenSpaceTextureLevel(999, 1000, { ...options, previousLevel: 2 }), 1);
    assert.equal(screenSpaceTextureLevel(1000, 1000, { ...options, previousLevel: 1 }), 1);
    assert.equal(screenSpaceTextureLevel(1190, 1000, { ...options, previousLevel: 1 }), 2);
    assert.equal(screenSpaceTextureLevel(1000, 1000, { ...options, detailBias: 2 }), 1);
    assert.equal(screenSpaceTextureLevel(1, 1000, { ...options, minLevel: 1 }), 1);
    assert.equal(screenSpaceTextureLevel(1e9, 1000, { ...options, maxLevel: 4 }), 4);
    assert.equal(screenSpaceTextureLevel(0, 1000, options), 0);
    assert.equal(screenSpaceTextureLevel(-1, 1000, options), 0);
});

test('screen-space levels map to durable medium or progressive high', () => {
    for (const level of [0, 1, 2, 3]) assert.equal(tierForTextureLevel(level), PAGE_TEXTURE_TIER.HIGH);
    for (const level of [4, 5]) assert.equal(tierForTextureLevel(level), PAGE_TEXTURE_TIER.MEDIUM);
});

test('high refinement starts at 1024 px, advances one level, and stops at the target', () => {
    const state = { assets: new Map(), desiredHighLevel: 0 };
    assert.equal(residentHighLevel(state), null);
    assert.equal(nextHighLevel(state), 2);
    assert.equal(highRefinementPending(state), true);
    state.assets.set(PAGE_TEXTURE_TIER.HIGH, { level: 2 });
    assert.equal(residentHighLevel(state), 2);
    assert.equal(nextHighLevel(state), 1);
    state.assets.set(PAGE_TEXTURE_TIER.HIGH, { level: 1 });
    assert.equal(nextHighLevel(state), 0);
    state.desiredHighLevel = 1;
    assert.equal(nextHighLevel(state), 1);
    assert.equal(highRefinementPending(state), false);
    state.desiredHighLevel = 2;
    assert.equal(highRefinementPending(state), false);
    state.assets.delete(PAGE_TEXTURE_TIER.HIGH);
    assert.equal(nextHighLevel(state), 2);
    state.desiredHighLevel = 3;
    assert.equal(nextHighLevel(state), 3, 'do not fetch finer than a 512 px target');
});

test('resident high requests another step only while coarser than desired', () => {
    const state = {
        assets: new Map([
            [PAGE_TEXTURE_TIER.LOW, {}],
            [PAGE_TEXTURE_TIER.MEDIUM, {}],
            [PAGE_TEXTURE_TIER.HIGH, { level: 2 }],
        ]),
        tierStates: new Map(),
        desiredTier: PAGE_TEXTURE_TIER.HIGH,
        desiredHighLevel: 0,
    };
    const plan = () => textureTierRequestPlan(state, { allowBootstrap: false });
    assert.deepEqual(plan(), [PAGE_TEXTURE_TIER.HIGH]);
    state.desiredHighLevel = 2;
    assert.deepEqual(plan(), []);
    state.desiredHighLevel = 0;
    assert.deepEqual(textureTierRequestPlan(state, { allowBootstrap: false, isMoving: true }), []);
    state.highAdmissionBlocked = true;
    assert.deepEqual(plan(), []);
    state.highAdmissionBlocked = false;
    state.desiredTier = PAGE_TEXTURE_TIER.MEDIUM;
    assert.deepEqual(plan(), []);
});
