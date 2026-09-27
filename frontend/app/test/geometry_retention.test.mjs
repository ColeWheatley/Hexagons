import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../geometry_retention.js', import.meta.url), 'utf8');
const { GEOMETRY_BUDGET_BYTES, hiddenGeometryEvictions } = await import(
    `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
);
const MIB = 1024 * 1024;

function fixture(excessBytes) {
    const tiles = new Map([
        ['near-old', { hidden: true, lx: 3000, lz: 0, lastVisiblePass: 1 }],
        ['far-recent', { hidden: true, lx: 16000, lz: 0, lastVisiblePass: 20 }],
        ['far-farther', { hidden: true, lx: 17000, lz: 0, lastVisiblePass: 20 }],
        ['near-farther', { hidden: true, lx: 8000, lz: 0, lastVisiblePass: 2 }],
        ['near-closer', { hidden: true, lx: 4000, lz: 0, lastVisiblePass: 2 }],
        ['boundary', { hidden: true, lx: 15000, lz: 0, lastVisiblePass: 0 }],
        ['visible', { hidden: false, lx: 30000, lz: 0, lastVisiblePass: 0 }],
    ]);
    const entries = new Map([...tiles.keys()].map(key => [key, { geometryBytes: MIB }]));
    return {
        tiles,
        ledger: { entries, totalGeometryBytes: GEOMETRY_BUDGET_BYTES.low + excessBytes },
        cameraPosition: { x: 0, z: 0 },
        capability: 'low',
    };
}

test('hidden eviction orders far tiles first, then oldest visibility and distance', () => {
    assert.deepEqual(hiddenGeometryEvictions(fixture(6 * MIB)), [
        'far-farther', 'far-recent', 'boundary', 'near-old', 'near-farther', 'near-closer',
    ]);
});

test('hidden eviction stops when the geometry budget is covered', () => {
    assert.deepEqual(hiddenGeometryEvictions(fixture(0)), []);
    assert.deepEqual(hiddenGeometryEvictions(fixture(2 * MIB)), ['far-farther', 'far-recent']);
    assert.deepEqual(hiddenGeometryEvictions(fixture(2 * MIB + 1)), [
        'far-farther', 'far-recent', 'boundary',
    ]);
});
