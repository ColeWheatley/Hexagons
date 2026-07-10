// Runtime-shaped test for the classic tile worker's contiguous range builder.
// It proves that one selected L3 subtree builds 343 units, rather than walking
// or allocating the other 16,464 unit descendants.

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const workerPath = path.join(ROOT, 'frontend/app/tile_worker.js');
const corePath = path.join(ROOT, 'frontend/app/gosper_core.js');
const context = vm.createContext({ console, performance, URL });
context.self = context;
context.location = { href: 'http://localhost/tile_worker.js' };
context.importScripts = specifier => {
    if (specifier.split('?')[0] !== 'gosper_core.js') {
        throw new Error(`unexpected importScripts(${specifier})`);
    }
    vm.runInContext(fs.readFileSync(corePath, 'utf8'), context, { filename: corePath });
};
vm.runInContext(fs.readFileSync(workerPath, 'utf8'), context, { filename: workerPath });
const buildLevelBuffers = vm.runInContext('buildLevelBuffers', context);
const parseGSP1 = vm.runInContext('parseGSP1', context);

function syntheticGsp3() {
    const aggregateBytes = 16;
    const unitBytes = 14;
    const byteLength = 48 + [1, 2, 3, 4, 5].reduce((sum, depth) => {
        const count = 7 ** depth;
        return sum + 4 + count * (depth < 5 ? aggregateBytes : unitBytes);
    }, 0);
    const buffer = new ArrayBuffer(byteLength);
    const view = new DataView(buffer);
    for (const [index, byte] of [...'GSP3'].entries()) view.setUint8(index, byte.charCodeAt(0));
    view.setUint16(4, 3, true);
    view.setUint16(6, 5, true);
    view.setFloat32(24, 1000, true);
    view.setFloat32(28, 900, true);
    view.setFloat32(32, 1100, true);
    view.setUint8(38, 128);
    view.setUint8(39, 128);
    view.setUint8(40, 1);

    let offset = 48;
    for (let depth = 1; depth <= 5; depth++) {
        const count = 7 ** depth;
        view.setUint32(offset, count, true);
        offset += 4;
        for (let i = 0; i < count; i++) {
            if (depth < 5) {
                view.setUint8(offset + 2, 20);
                view.setUint8(offset + 4, 128);
                view.setUint8(offset + 5, 128);
                view.setUint16(offset + 6, 40, true);
                view.setUint16(offset + 8, 50, true);
                view.setUint16(offset + 10, 160, true);
                view.setUint16(offset + 12, 80, true);
                view.setUint8(offset + 14, 1);
                offset += aggregateBytes;
            } else {
                view.setUint8(offset + 11, 128);
                view.setUint8(offset + 12, 128);
                view.setUint8(offset + 13, 1);
                offset += unitBytes;
            }
        }
    }
    assert.equal(offset, byteLength);
    return buffer;
}

const parsedGsp3 = parseGSP1(syntheticGsp3(), 0, 0);
assert.equal(parsedGsp3.binaryVersion, 3);
assert.equal(parsedGsp3.depths[3].downExtent[0], 40);
assert.equal(parsedGsp3.depths[3].upExtent[0], 50);
assert.equal(parsedGsp3.depths[3].renderDown[0], 160);
assert.equal(parsedGsp3.depths[3].renderUp[0], 80);
assert.equal(parsedGsp3.depths[3].valid[0], 1);

const counts = [1, 7, 49, 343, 2401, 16807];
const depths = counts.map((count, depth) => {
    const record = {
        h: new Float32Array(count).fill(1000),
        valid: new Uint8Array(count).fill(1),
        slopeMean: new Uint8Array(count).fill(20),
        nx: new Uint8Array(count).fill(128),
        nz: new Uint8Array(count).fill(128),
    };
    if (depth < 5) {
        record.relief = new Uint8Array(count).fill(2);
        record.downExtent = new Uint16Array(count).fill(40);
        record.upExtent = new Uint16Array(count).fill(40);
    }
    return record;
});
const unit = {
    d1: new Int16Array(counts[5]),
    d2: new Int16Array(counts[5]),
    d3: new Int16Array(counts[5]),
    s1: new Uint8Array(counts[5]),
    s2: new Uint8Array(counts[5]),
    s3: new Uint8Array(counts[5]),
};

const firstL3Only = {
    rangesByDepth: [
        new Uint32Array([0, 1]),
        new Uint32Array([0, 7]),
        new Uint32Array([0, 49]),
        new Uint32Array([0, 7]),
        new Uint32Array([0, 49]),
        new Uint32Array([0, 343]),
    ],
};
const lods = buildLevelBuffers({ depths, unit }, firstL3Only);
assert.equal(lods[5].count, 1);
assert.equal(lods[4].count, 7);
assert.equal(lods[3].count, 49); // full, uniform L3 panning coverage
assert.equal(lods[2].count, 7);
assert.equal(lods[1].count, 49);
assert.equal(lods[0].count, 343);
assert.equal(lods[0].sourceCount, 16807);
assert.equal(lods[0].selectedSourceCount, 343);
assert.equal(lods[0].matrix.length, 343 * 16);

const noUnitDetail = {
    rangesByDepth: firstL3Only.rangesByDepth.slice(),
};
noUnitDetail.rangesByDepth[5] = new Uint32Array();
assert.equal(buildLevelBuffers({ depths, unit }, noUnitDetail)[0], null);

console.log('filtered worker geometry ranges: ok (343 / 16807 units built)');
