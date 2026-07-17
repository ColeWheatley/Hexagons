import test from 'node:test';
import assert from 'node:assert/strict';
import { createMaterialChurnStats, recordRenderCycle, resetMaterialChurnStats, snapshotMaterialChurnStats, writeUniformIfChanged } from '../material_churn.mjs';

test('unchanged scalar and vector uniform values are not rewritten', () => {
    const stats = createMaterialChurnStats();
    const scalar = { value: 3 };
    const value = { x: 1, y: 2, z: 3, copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; } };
    assert.equal(writeUniformIfChanged(scalar, 3, stats), false);
    assert.equal(writeUniformIfChanged({ value }, { x: 1, y: 2, z: 3 }, stats), false);
    assert.equal(writeUniformIfChanged(scalar, 4, stats), true);
    assert.equal(writeUniformIfChanged({ value }, { x: 4, y: 5, z: 6 }, stats), true);
    assert.deepEqual({ x: value.x, y: value.y, z: value.z }, { x: 4, y: 5, z: 6 });
    assert.equal(stats.unchangedUniformWritesAvoided, 2);
});
test('unchanged Vector2 values are not rewritten', () => {
    const stats = createMaterialChurnStats();
    const value = { x: 1, y: 2, set(x, y) { this.x = x; this.y = y; } };
    assert.equal(writeUniformIfChanged({ value }, { x: 1, y: 2 }, stats), false);
    assert.equal(stats.unchangedUniformWritesAvoided, 1);
});
test('reset provides deterministic scenario baselines', () => {
    const stats = createMaterialChurnStats(); stats.compileCalls = 2; resetMaterialChurnStats(stats);
    assert.deepEqual(snapshotMaterialChurnStats(stats), snapshotMaterialChurnStats(createMaterialChurnStats()));
});
test('render-cycle accounting exposes the measured main-thread average', () => {
    const stats = createMaterialChurnStats();
    assert.equal(recordRenderCycle(stats, 2), true);
    assert.equal(recordRenderCycle(stats, 4), true);
    assert.equal(recordRenderCycle(stats, NaN), false);
    assert.equal(snapshotMaterialChurnStats(stats).renderCycleAverageMs, 3);
    assert.equal(stats.renderCycleMaxMs, 4);
});
