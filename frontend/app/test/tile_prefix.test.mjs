import test from 'node:test';
import assert from 'node:assert/strict';
import {
    GSP3_PREFIX_END, requiredTileDepth, sampleTileHeightAtUnitIndex,
    tileDepthNeedsRefinement,
} from '../tile_prefix.mjs';

test('GSP3 depth ends are contiguous published offsets', () => {
    assert.deepEqual(GSP3_PREFIX_END, { 2: 952, 3: 6444, 4: 44864, 5: 280166 });
});

test('depth tracks the three detail bands and motion', () => {
    assert.equal(requiredTileDepth(15000), 2);
    assert.equal(requiredTileDepth(9000), 3);
    assert.equal(requiredTileDepth(4000), 4);
    assert.equal(requiredTileDepth(1000), 5);
    assert.equal(requiredTileDepth(100, { moving: true }), 2);
    assert.equal(requiredTileDepth(11100, { rootRadiusM: 550, reliefM: 200 }), 3);
});

test('only a deeper demanded prefix triggers refinement', () => {
    assert.equal(tileDepthNeedsRefinement(2, 5), true);
    assert.equal(tileDepthNeedsRefinement(4, 4), false);
    assert.equal(tileDepthNeedsRefinement(5, 2), false);
});

test('aggregate elevation follows the unit point through each downloaded depth', () => {
    for (const depth of [2, 3, 4, 5]) {
        const heights = Float32Array.from({ length: 7 ** depth }, (_, i) => i + 0.5);
        const stride = 7 ** (5 - depth);
        assert.equal(sampleTileHeightAtUnitIndex(heights, depth, 5 * stride), 5.5);
        assert.equal(sampleTileHeightAtUnitIndex(heights, depth, 6 * stride - 1), 5.5);
    }
    assert.equal(sampleTileHeightAtUnitIndex(new Float32Array(49), 2, undefined), undefined);
});
