import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { GSP3_PREFIX_END } from '../tile_prefix.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const app = path.join(root, 'frontend/app');
const context = vm.createContext({ console, URL });
context.self = context;
context.location = { href: 'http://localhost/tile_worker.js' };
context.importScripts = specifier => vm.runInContext(
    fs.readFileSync(path.join(app, specifier), 'utf8'), context,
);
vm.runInContext(fs.readFileSync(path.join(app, 'tile_worker.js'), 'utf8'), context);
const parse = vm.runInContext('parseGSP1', context);
const fixture = fs.readFileSync(path.join(root, 'tests/fixtures/gosper_276_-235.bin'));
const fullBuffer = fixture.buffer.slice(fixture.byteOffset, fixture.byteOffset + fixture.byteLength);
const full = parse(fullBuffer, 276, -235);

test('GSP3 prefixes reproduce every present aggregate record exactly', () => {
    for (const depth of [2, 3, 4, 5]) {
        const prefix = fullBuffer.slice(0, GSP3_PREFIX_END[depth]);
        const parsed = parse(prefix, 276, -235, depth);
        assert.equal(parsed.depths.length, depth + 1);
        assert.deepEqual(parsed.stats, full.stats);
        assert.deepEqual(parsed.center, full.center);
        for (let d = 0; d <= depth; d++) {
            for (const name of ['h', 'slopeMean', 'nx', 'nz', 'valid', 'relief',
                'downExtent', 'upExtent', 'renderDown', 'renderUp']) {
                assert.deepEqual(parsed.depths[d][name], full.depths[d][name], `${depth}/${d}/${name}`);
            }
        }
        assert.equal(Boolean(parsed.unit), depth === 5);
        assert.equal(parsed.unitHeights, depth === 5 ? parsed.depths[5].h : null);
        if (depth < 5) assert.throws(() => parse(prefix.slice(0, -1), 276, -235, depth), /truncated/);
    }
});

test('one-pass prefix build caps output at the available depth', () => {
    // Construct the job's byte view inside the classic worker realm.
    context.prefixBytes = Array.from(fixture.subarray(0, GSP3_PREFIX_END[2]));
    const result = vm.runInContext(`buildTilePrefix({
        bytes: Uint8Array.from(prefixBytes), availableDepth: 2,
        yq: 276, yr: -235, expectedGspVersion: 3,
    })`, context);
    assert.deepEqual(Object.keys(result.lods).sort(), ['3', '4', '5']);
    assert.equal(result.visibilityData.depths.length, 3);
    assert.equal(result.heightValues.length, 49);
});
