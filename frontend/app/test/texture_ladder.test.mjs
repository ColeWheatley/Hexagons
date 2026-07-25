import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(
    new URL('../texture_page_residency.js', import.meta.url),
    'utf8',
);
const {
    PAGE_TEXTURE_TIER,
    BOOTSTRAP_GPU_BYTES_PER_PAGE,
    BOOTSTRAP_MAX_RESIDENT_BYTES,
    TexturePageResidency,
    TIER_STATE,
    isTier,
    textureTierRequestPlan,
    highAdmissionRetryReady,
    textureStateHasDemand,
    promoteVisibleConsumerPages,
} = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

function stateFor({ classification, projectedDiameterPx = 0, distanceMeters = Infinity }) {
    const residency = new TexturePageResidency({
        pages: [{ key: 'page', minX: 0, minY: 0, maxX: 1024, maxY: 1024 }],
        highEnterDistanceM: 2000,
        highExitDistanceM: 2500,
    });
    residency.beginDemandPass();
    residency.contribute('page', { classification, projectedDiameterPx, distanceMeters });
    residency.finishDemandPass();
    return residency.state('page');
}

test('initial near page gets one startup bridge plus durable green/blue and pink', () => {
    const state = stateFor({ classification: 'visible', projectedDiameterPx: 1, distanceMeters: 1900 });
    assert.equal(state.desiredTier, PAGE_TEXTURE_TIER.HIGH);
    assert.deepEqual(textureTierRequestPlan(state), [
        PAGE_TEXTURE_TIER.BOOTSTRAP,
        PAGE_TEXTURE_TIER.LOW,
        PAGE_TEXTURE_TIER.MEDIUM,
        PAGE_TEXTURE_TIER.HIGH,
    ]);
});

test('bootstrap contract is an ultralow whole-page request with bounded residency', () => {
    assert.equal(BOOTSTRAP_GPU_BYTES_PER_PAGE, 16384);
    assert.equal(BOOTSTRAP_MAX_RESIDENT_BYTES, 1024 * 1024);
    // The cap admits no more than 64 decoded 64px pages, even if a larger
    // manifest is supplied. The current first operational consumer needs four.
    assert.equal(BOOTSTRAP_MAX_RESIDENT_BYTES / BOOTSTRAP_GPU_BYTES_PER_PAGE, 64);
});

test('blue versus pink depends only on camera distance, with outward hysteresis', () => {
    for (const scenario of [
        { classification: 'visible', projectedDiameterPx: 1, distanceMeters: 1900 },
        { classification: 'guard', projectedDiameterPx: Infinity, distanceMeters: 1900 },
        { classification: 'outside', projectedDiameterPx: 0, distanceMeters: 1900 },
    ]) {
        const state = stateFor(scenario);
        assert.equal(state.desiredTier, PAGE_TEXTURE_TIER.HIGH);
    }

    const state = stateFor({ classification: 'visible', distanceMeters: 1900 });
    const residency = new TexturePageResidency({ pages: [state.page] });
    const tracked = residency.state('page');
    tracked.desiredTier = PAGE_TEXTURE_TIER.HIGH;
    residency.beginDemandPass();
    residency.contribute('page', { classification: 'outside', distanceMeters: 2400 });
    residency.finishDemandPass();
    assert.equal(tracked.desiredTier, PAGE_TEXTURE_TIER.HIGH, 'pink survives the 2.0-2.5km exit band');
    residency.beginDemandPass();
    residency.contribute('page', { classification: 'visible', distanceMeters: 2600 });
    residency.finishDemandPass();
    assert.equal(tracked.desiredTier, PAGE_TEXTURE_TIER.MEDIUM);
});

test('outside corpus pages are not demand-planned, including beta', () => {
    const state = stateFor({ classification: 'outside', distanceMeters: 8000 });
    assert.equal(textureStateHasDemand(state, { includeOutside: false }), false);
    // Outside retains the medium target solely so it receives medium on entry
    // to the predictive guard set; it must have no queued request meanwhile.
    assert.equal(state.desiredTier, PAGE_TEXTURE_TIER.MEDIUM);
    assert.equal(isTier(state, PAGE_TEXTURE_TIER.BOOTSTRAP, TIER_STATE.QUEUED), false);
    assert.equal(isTier(state, PAGE_TEXTURE_TIER.BOOTSTRAP, TIER_STATE.LOADING), false);
});

test('only an outside page bound by visible geometry is promoted to guard medium', () => {
    const residency = new TexturePageResidency({
        pages: [{ key: 'bound', minX: 0, minY: 0, maxX: 1, maxY: 1 }, { key: 'other', minX: 1, minY: 0, maxX: 2, maxY: 1 }],
    });
    residency.beginDemandPass();
    residency.finishDemandPass();
    promoteVisibleConsumerPages(residency.states, new Set(['bound']));
    assert.equal(residency.state('bound').classification, 'guard');
    assert.equal(residency.state('bound').desiredTier, PAGE_TEXTURE_TIER.MEDIUM);
    assert.equal(textureStateHasDemand(residency.state('bound')), true);
    assert.equal(residency.state('other').classification, 'outside');
    assert.equal(textureStateHasDemand(residency.state('other')), false);
});

test('yellow is impossible after startup, including motion and an empty revisit', () => {
    const state = stateFor({ classification: 'visible', distanceMeters: 1900 });
    assert.deepEqual(textureTierRequestPlan(state, { allowBootstrap: false }), [
        PAGE_TEXTURE_TIER.LOW,
        PAGE_TEXTURE_TIER.MEDIUM,
        PAGE_TEXTURE_TIER.HIGH,
    ]);
    assert.deepEqual(textureTierRequestPlan(state, {
        allowBootstrap: false,
        isMoving: true,
    }), [
        PAGE_TEXTURE_TIER.LOW,
        PAGE_TEXTURE_TIER.MEDIUM,
    ]);
});

test('resident green and blue are durable fallbacks and are not re-requested', () => {
    const state = stateFor({ classification: 'visible', distanceMeters: 1900 });
    state.assets.set(PAGE_TEXTURE_TIER.LOW, { bytes: 1 });
    state.assets.set(PAGE_TEXTURE_TIER.MEDIUM, { bytes: 2 });
    assert.deepEqual(textureTierRequestPlan(state, { allowBootstrap: false }), [
        PAGE_TEXTURE_TIER.HIGH,
    ]);
});

test('a budget-rejected pink retries only after cache or distance rank changes', () => {
    const state = stateFor({ classification: 'visible', distanceMeters: 1000 });
    state.highAdmissionBlocked = true;
    state.highAdmissionBlockedRevision = 7;
    state.highAdmissionBlockedPriority = -1000;
    assert.equal(highAdmissionRetryReady(state, 7, -1000), false);
    assert.equal(highAdmissionRetryReady(state, 8, -1000), true, 'cache membership changed');
    assert.equal(highAdmissionRetryReady(state, 7, -900), true, 'page moved closer');
});
