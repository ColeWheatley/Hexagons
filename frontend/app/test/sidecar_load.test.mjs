// Guards P2.1's worker-side duplication (design doc §1.4): tile_worker.js
// cannot import sidecar_format.mjs (importScripts-based, not an ES module —
// same reason P1.1 duplicated the two pyramid-address constants), so
// buildSidecarPyramid / buildSidecarPackedPyramid / parseSidecarBodyForWorker
// are hand-duplicated copies of buildPyramid / buildPackedPyramid /
// parseSidecarBody. This file is the agreement test: every duplicated
// function must produce byte-identical output to the real sidecar_format.mjs
// implementation on the same input, for a range of cases including NODATA
// and multi-level reduction — the same discipline P1.1 established for the
// address constants, extended to the (much larger) reduction logic P2.1
// adds.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import {
    L1_NODE_COUNT,
    PYRAMID_NODE_COUNT,
    PFL1_HEADER_BYTES,
    buildPyramid,
    buildPackedPyramid,
    parseSidecarBody,
} from '../sidecar_format.mjs';

const require = createRequire(import.meta.url);
const workerPath = fileURLToPath(new URL('../tile_worker.js', import.meta.url));
const workerSource = readFileSync(workerPath, 'utf8');

function loadTileWorker() {
    globalThis.self = globalThis;
    globalThis.importScripts = (...args) => {
        throw new Error(`importScripts should not be called in this harness: ${args.join(', ')}`);
    };
    require(fileURLToPath(new URL('../gosper_core.js', import.meta.url)));

    const src = `${workerSource}\n;
        self.__pf_buildSidecarPyramid = buildSidecarPyramid;
        self.__pf_buildSidecarPackedPyramid = buildSidecarPackedPyramid;
        self.__pf_parseSidecarBodyForWorker = parseSidecarBodyForWorker;
    \n`;
    vm.runInThisContext(src, { filename: workerPath });
    return {
        buildSidecarPyramid: globalThis.__pf_buildSidecarPyramid,
        buildSidecarPackedPyramid: globalThis.__pf_buildSidecarPackedPyramid,
        parseSidecarBodyForWorker: globalThis.__pf_parseSidecarBodyForWorker,
    };
}

const worker = loadTileWorker();

test('tile_worker.js exposes the three duplicated sidecar functions', () => {
    assert.equal(typeof worker.buildSidecarPyramid, 'function');
    assert.equal(typeof worker.buildSidecarPackedPyramid, 'function');
    assert.equal(typeof worker.parseSidecarBodyForWorker, 'function');
});

// -----------------------------------------------------------------------
// buildSidecarPyramid vs the real buildPyramid
// -----------------------------------------------------------------------

function randomLeafBody(tileCount, seed) {
    const body = new Uint8Array(tileCount * L1_NODE_COUNT);
    let s = seed >>> 0;
    for (let i = 0; i < body.length; i++) {
        s = (s * 1664525 + 1013904223) >>> 0;
        // ~15% NODATA, rest 1..255, matching the real NODATA=0/domain=1..255 convention.
        body[i] = (s % 100) < 15 ? 0 : 1 + (s % 254);
    }
    return body;
}

for (const reducer of ['mean', 'max', 'mode']) {
    test(`buildSidecarPyramid agrees with buildPyramid byte-for-byte (reducer=${reducer})`, () => {
        const tileCount = 3;
        const body = randomLeafBody(tileCount, 12345 + reducer.length);
        const real = buildPyramid(body, tileCount, reducer);
        const dup = worker.buildSidecarPyramid(body, tileCount, reducer);
        assert.equal(dup.byteLength, real.byteLength);
        assert.equal(dup.byteLength, tileCount * PYRAMID_NODE_COUNT);
        assert.deepEqual(Array.from(dup), Array.from(real));
    });
}

test('buildSidecarPyramid agrees with buildPyramid on an all-NODATA tile', () => {
    const body = new Uint8Array(L1_NODE_COUNT).fill(0);
    const real = buildPyramid(body, 1, 'mean');
    const dup = worker.buildSidecarPyramid(body, 1, 'mean');
    assert.deepEqual(Array.from(dup), Array.from(real));
});

// -----------------------------------------------------------------------
// buildSidecarPackedPyramid vs the real buildPackedPyramid
// -----------------------------------------------------------------------

const AVALANCHE_FIELDS = {
    release: { shift: 7, bits: 1, aggregate: 'or' },
    severity: { shift: 0, bits: 7, aggregate: 'max' },
};

function randomPackedLeafBody(tileCount, seed) {
    const body = new Uint8Array(tileCount * L1_NODE_COUNT);
    let s = seed >>> 0;
    for (let i = 0; i < body.length; i++) {
        s = (s * 1664525 + 1013904223) >>> 0;
        if ((s % 100) < 15) { body[i] = 0; continue; } // NODATA
        const severity = 1 + (s % 127);
        const release = (s % 5 === 0) ? 1 : 0;
        body[i] = ((release << 7) | (severity & 0x7f)) & 0xff;
    }
    return body;
}

test('buildSidecarPackedPyramid agrees with buildPackedPyramid byte-for-byte', () => {
    const tileCount = 2;
    const body = randomPackedLeafBody(tileCount, 999);
    const real = buildPackedPyramid(body, tileCount, AVALANCHE_FIELDS);
    const dup = worker.buildSidecarPackedPyramid(body, tileCount, AVALANCHE_FIELDS);
    assert.deepEqual(Array.from(dup), Array.from(real));
});

test('buildSidecarPackedPyramid agrees with buildPackedPyramid on the raw-128 regression case', () => {
    // Same case sidecar_format.test.mjs guards directly: one raw-128 +
    // six raw-127 must reduce to release=1/severity=127 (255), not 128.
    const body = new Uint8Array(L1_NODE_COUNT).fill(1);
    body.set([128, 127, 127, 127, 127, 127, 127], 0);
    const real = buildPackedPyramid(body, 1, AVALANCHE_FIELDS);
    const dup = worker.buildSidecarPackedPyramid(body, 1, AVALANCHE_FIELDS);
    assert.deepEqual(Array.from(dup), Array.from(real));
    assert.notEqual(dup[0], 128);
});

// -----------------------------------------------------------------------
// parseSidecarBodyForWorker vs the real parseSidecarBody
// -----------------------------------------------------------------------

test('parseSidecarBodyForWorker agrees with parseSidecarBody on a headerless buffer', () => {
    const tileCount = 2;
    const raw = randomLeafBody(tileCount, 42);
    const real = parseSidecarBody(raw, tileCount);
    assert.equal(real.ok, true);
    const dupBody = worker.parseSidecarBodyForWorker(raw.buffer, tileCount);
    assert.deepEqual(Array.from(dupBody), Array.from(real.body));
});

test('parseSidecarBodyForWorker agrees with parseSidecarBody on a headered buffer (strips the same 32 bytes)', () => {
    const tileCount = 2;
    const rawBody = randomLeafBody(tileCount, 7);
    const header = new Uint8Array(PFL1_HEADER_BYTES);
    header[0] = 0x50; header[1] = 0x46; header[2] = 0x4c; header[3] = 0x31; // 'PFL1'
    const buffer = new Uint8Array(PFL1_HEADER_BYTES + rawBody.byteLength);
    buffer.set(header, 0);
    buffer.set(rawBody, PFL1_HEADER_BYTES);

    const real = parseSidecarBody(buffer, tileCount);
    assert.equal(real.ok, true);
    const dupBody = worker.parseSidecarBodyForWorker(buffer.buffer, tileCount);
    assert.deepEqual(Array.from(dupBody), Array.from(real.body));
});

test('parseSidecarBodyForWorker throws on a length mismatch, same condition parseSidecarBody rejects', () => {
    const tileCount = 2;
    // .slice() (not .subarray()) so `.buffer` below is a real truncated
    // ArrayBuffer of its own, not a view into the original full-length one.
    const short = randomLeafBody(tileCount, 5).slice(0, L1_NODE_COUNT * tileCount - 1);
    const originalError = console.error;
    console.error = () => {};
    let realRejected;
    try {
        realRejected = parseSidecarBody(short, tileCount).ok === false;
    } finally { console.error = originalError; }
    assert.equal(realRejected, true);
    assert.throws(() => worker.parseSidecarBodyForWorker(short.buffer, tileCount));
});
