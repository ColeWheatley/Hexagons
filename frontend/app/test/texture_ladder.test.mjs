import test from 'node:test';
import assert from 'node:assert/strict';
import {
    PAGE_TEXTURE_TIER,
    BOOTSTRAP_GPU_BYTES_PER_PAGE,
    BOOTSTRAP_MAX_RESIDENT_BYTES,
    TexturePageResidency,
    textureTierRequestPlan,
} from '../texture_page_residency.mjs';

function stateFor({ classification, projectedDiameterPx }) {
    const residency = new TexturePageResidency({
        pages: [{ key: 'page', minX: 0, minY: 0, maxX: 1024, maxY: 1024 }],
        highEnterPx: 512,
    });
    residency.beginDemandPass();
    residency.contribute('page', { classification, projectedDiameterPx });
    residency.finishDemandPass();
    return residency.state('page');
}

test('initial near visible page goes WebP32 directly to high4096', () => {
    const state = stateFor({ classification: 'visible', projectedDiameterPx: 700 });
    assert.equal(state.desiredTier, PAGE_TEXTURE_TIER.HIGH);
    assert.deepEqual(textureTierRequestPlan(state), [
        PAGE_TEXTURE_TIER.BOOTSTRAP,
        PAGE_TEXTURE_TIER.HIGH,
    ]);
});

test('bootstrap contract is an ultralow whole-page request with bounded residency', () => {
    assert.equal(BOOTSTRAP_GPU_BYTES_PER_PAGE, 4096);
    assert.equal(BOOTSTRAP_MAX_RESIDENT_BYTES, 1024 * 1024);
    // The cap admits no more than 256 decoded 32px pages, even if a larger
    // manifest is supplied. The current first operational consumer needs four.
    assert.equal(BOOTSTRAP_MAX_RESIDENT_BYTES / BOOTSTRAP_GPU_BYTES_PER_PAGE, 256);
});

test('guard, out-of-frustum, and below-threshold pages reserve medium256', () => {
    for (const scenario of [
        { classification: 'visible', projectedDiameterPx: 300 },
        { classification: 'guard', projectedDiameterPx: 700 },
        { classification: 'outside', projectedDiameterPx: 0 },
    ]) {
        const state = stateFor(scenario);
        assert.equal(state.desiredTier, PAGE_TEXTURE_TIER.MEDIUM);
        assert.deepEqual(textureTierRequestPlan(state), [
            PAGE_TEXTURE_TIER.BOOTSTRAP,
            PAGE_TEXTURE_TIER.MEDIUM,
        ]);
    }
});

test('a resident WebP only permits the direct high request; low is never prerequisite', () => {
    const state = stateFor({ classification: 'visible', projectedDiameterPx: 700 });
    state.assets.set(PAGE_TEXTURE_TIER.BOOTSTRAP, { bytes: 4096 });
    assert.deepEqual(textureTierRequestPlan(state), [PAGE_TEXTURE_TIER.HIGH]);
});
