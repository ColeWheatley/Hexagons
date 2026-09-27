import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function sourceModule(name) {
    const source = await readFile(new URL(`../${name}`, import.meta.url), 'utf8');
    return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
}

const { writeHorizonMatrix, markHorizonMatrixRange } = await sourceModule('horizon_buffers.js');
const { hiddenGeometryEvictions, GEOMETRY_BUDGET_BYTES } = await sourceModule('geometry_retention.js');
const { VRAMLedger } = await sourceModule('vram_ledger.js');

test('horizon matrices preserve transform and queue distinct partial uploads', () => {
    const array = new Float32Array(3 * 16);
    const xz = { a: 2, b: 3, c: 4, d: 5 };
    writeHorizonMatrix(array, 1, xz, 10, 20);
    assert.deepEqual(Array.from(array.slice(16, 32)), [
        2, 0, 4, 0, 0, 1, 0, 0, 3, 0, 5, 0, 10, 0, 20, 1,
    ]);
    writeHorizonMatrix(array, 2, xz, 10, 20, true);
    assert.deepEqual(Array.from(array.slice(32, 48)), [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
    ]);
    const attribute = {
        updateRanges: [],
        addUpdateRange(start, count) { this.updateRanges.push({ start, count }); },
        set needsUpdate(value) { if (value) this.version = (this.version || 0) + 1; },
    };
    markHorizonMatrixRange(attribute, 1);
    markHorizonMatrixRange(attribute, 2, 49);
    assert.deepEqual(attribute.updateRanges, [
        { start: 16, count: 16 }, { start: 32, count: 784 },
    ]);
});

test('ledger page index tracks tier replacement, removal and location', () => {
    const ledger = new VRAMLedger();
    ledger.setTexture('a', 'low', 10);
    ledger.setTexture('a', 'high', 20);
    ledger.setTexture('b', 'low', 30);
    ledger.setTexture('a', 'low', 15);
    ledger.updateTextureLocation('a', { lx: 42, bounds: { id: 'a' } });
    assert.deepEqual([...ledger.textureIdsByKey.get('a')].sort(), ['a:high', 'a:low']);
    assert.equal(ledger.textureEntries.get('a:high').lx, 42);
    assert.equal(ledger.textureEntries.get('b:low').lx, undefined);
    assert.equal(ledger.textureBytesFor('a'), 35);
    ledger.removeTexture('a', 'high');
    ledger.removeTexture('a', 'low');
    assert.equal(ledger.textureIdsByKey.has('a'), false);
    assert.equal(ledger.totalTextureBytes, 30);
});

test('retention evicts distant hidden tiles first, then least recently visible', () => {
    const mib = 1024 * 1024;
    const tiles = new Map([
        ['visible', { lx: 0, lz: 0, hidden: false, lastVisiblePass: 1 }],
        ['near-old', { lx: 1000, lz: 0, hidden: true, lastVisiblePass: 1 }],
        ['near-new', { lx: 2000, lz: 0, hidden: true, lastVisiblePass: 5 }],
        ['far', { lx: 16000, lz: 0, hidden: true, lastVisiblePass: 9 }],
    ]);
    const ledger = new VRAMLedger();
    for (const key of tiles.keys()) ledger.registerGeometry(key, { geometryBytes: 16 * mib });
    assert.equal(GEOMETRY_BUDGET_BYTES.low, 48 * mib);
    const options = { tiles, ledger, cameraPosition: { x: 0, z: 0 }, capability: 'low' };
    assert.deepEqual(hiddenGeometryEvictions(options), ['far']);
    ledger.registerGeometry('visible', { geometryBytes: 48 * mib });
    assert.deepEqual(hiddenGeometryEvictions(options), ['far', 'near-old', 'near-new']);
    tiles.get('far').hidden = false;
    assert.deepEqual(hiddenGeometryEvictions(options), ['near-old', 'near-new']);
});
