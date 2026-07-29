import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';
import { generateFixtures } from '../../../scripts/make_sidecar_fixtures.mjs';
import {
    PYRAMID_DEPTH_COUNTS,
    PYRAMID_DEPTH_OFFSETS,
    PYRAMID_NODE_COUNT,
    L1_DEPTH,
    L1_NODE_COUNT,
    UNIT_DEPTH,
    SIDECAR_NODATA,
    PFL1_MAGIC,
    PFL1_HEADER_BYTES,
    pyramidAddress,
    buildPyramid,
    buildPackedPyramid,
    parseSidecarBody,
    parseSidecarIndex,
    coverageHas,
    nearestPresentHour,
    epochHourToUrl,
    decodePacked,
    encodePacked,
    bytesToBase64,
    toEpochHour,
    crc32,
    manifestHashMatches,
} from '../sidecar_format.mjs';

// -----------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------

test('pyramid constants are internally consistent', () => {
    assert.deepEqual(PYRAMID_DEPTH_COUNTS, [1, 7, 49, 343, 2401]);
    assert.deepEqual(PYRAMID_DEPTH_OFFSETS, [0, 1, 8, 57, 400]);
    let running = 0;
    for (let d = 0; d < PYRAMID_DEPTH_COUNTS.length; d++) {
        assert.equal(PYRAMID_DEPTH_OFFSETS[d], running, `offset[${d}]`);
        running += PYRAMID_DEPTH_COUNTS[d];
    }
    assert.equal(running, PYRAMID_NODE_COUNT);
    assert.equal(PYRAMID_NODE_COUNT, 2801);
    assert.equal(L1_DEPTH, 4);
    assert.equal(L1_NODE_COUNT, 2401);
    assert.equal(UNIT_DEPTH, 5);
    assert.equal(SIDECAR_NODATA, 0);
    assert.equal(PFL1_MAGIC, 'PFL1');
    assert.equal(PFL1_HEADER_BYTES, 32);
});

// -----------------------------------------------------------------------
// pyramidAddress round-trip, all 19,608 (depth,index) pairs
// (1+7+49+343+2401 depth 0..4, plus 16807 depth-5 units = 19608)
// -----------------------------------------------------------------------

test('pyramidAddress round-trips all depth 0..4 addresses (bijective, contiguous, recoverable)', () => {
    const seen = new Set();
    let count = 0;
    for (let d = 0; d <= L1_DEPTH; d++) {
        for (let i = 0; i < PYRAMID_DEPTH_COUNTS[d]; i++) {
            const addr = pyramidAddress(d, i);
            assert.ok(addr >= 0 && addr < PYRAMID_NODE_COUNT, `addr in range for (${d},${i})`);
            assert.ok(!seen.has(addr), `addr ${addr} not previously seen (dup for depth ${d} index ${i})`);
            seen.add(addr);
            // Recoverable: subtracting this depth's offset gives back the index.
            assert.equal(addr - PYRAMID_DEPTH_OFFSETS[d], i);
            count++;
        }
    }
    assert.equal(count, PYRAMID_NODE_COUNT); // 2801
    assert.equal(seen.size, PYRAMID_NODE_COUNT);
});

test('pyramidAddress round-trips all 16807 depth-5 (unit) indices onto their L1 parent', () => {
    let count = 0;
    for (let i = 0; i < 16807; i++) {
        const addr = pyramidAddress(UNIT_DEPTH, i);
        const parentIndex = Math.floor(i / 7);
        assert.equal(addr, pyramidAddress(L1_DEPTH, parentIndex), `unit ${i} -> L1 parent ${parentIndex}`);
        assert.ok(addr >= PYRAMID_DEPTH_OFFSETS[L1_DEPTH] && addr < PYRAMID_NODE_COUNT);
        count++;
    }
    assert.equal(count, 16807);
    // Full inventory: 2801 (depth 0..4) + 16807 (depth 5) = 19608.
    assert.equal(2801 + 16807, 19608);
});

test('pyramidAddress rejects out-of-range depth or a negative/non-integer index', () => {
    assert.throws(() => pyramidAddress(-1, 0), RangeError);
    assert.throws(() => pyramidAddress(6, 0), RangeError);
    assert.throws(() => pyramidAddress(0, -1), RangeError);
    assert.throws(() => pyramidAddress(0, 1.5), RangeError);
});

// -----------------------------------------------------------------------
// buildPyramid: hand-computed mean/max/mode, NODATA skipping, recursion
// -----------------------------------------------------------------------

// One tile. Background is a constant 50 everywhere. Two depth-3 clusters
// (7 leaves each) are overridden:
//   cluster A (depth-3 index 0, leaves 0..6):  [10,20,30,0,0,60,80] -> two NODATA
//   cluster B (depth-3 index 1, leaves 7..13): all NODATA
// Both clusters share depth-2 parent 0 / depth-1 parent 0 / the root, so a
// single body exercises NODATA-skipping at the leaf level *and* correct
// recursion through depth 3 -> 2 -> 1 -> 0, for all three reducers.
function buildTestBody() {
    const body = new Uint8Array(L1_NODE_COUNT).fill(50);
    body.set([10, 20, 30, 0, 0, 60, 80], 0);
    body.set([0, 0, 0, 0, 0, 0, 0], 7);
    return body;
}

test('buildPyramid: mean reducer, hand-computed through every level with NODATA skipped', () => {
    const pyr = buildPyramid(buildTestBody(), 1, 'mean');
    // cluster A: non-NODATA [10,20,30,60,80], sum=200, mean=40
    assert.equal(pyr[PYRAMID_DEPTH_OFFSETS[3] + 0], 40);
    // cluster B: all NODATA -> NODATA
    assert.equal(pyr[PYRAMID_DEPTH_OFFSETS[3] + 1], 0);
    // depth-2 parent 0: children [40, NODATA, 50,50,50,50,50] -> non-NODATA
    // [40,50,50,50,50,50], sum=290, /6=48.33 -> round 48
    assert.equal(pyr[PYRAMID_DEPTH_OFFSETS[2] + 0], 48);
    // depth-1 parent 0: children [48,50,50,50,50,50,50], sum=348, /7=49.71 -> round 50
    assert.equal(pyr[PYRAMID_DEPTH_OFFSETS[1] + 0], 50);
    // root: children [50,50,50,50,50,50,50] -> 50 (diluted back to background)
    assert.equal(pyr[PYRAMID_DEPTH_OFFSETS[0] + 0], 50);
});

test('buildPyramid: max reducer carries the extreme value all the way to the root', () => {
    const pyr = buildPyramid(buildTestBody(), 1, 'max');
    assert.equal(pyr[PYRAMID_DEPTH_OFFSETS[3] + 0], 80);
    assert.equal(pyr[PYRAMID_DEPTH_OFFSETS[3] + 1], 0); // all-NODATA cluster
    assert.equal(pyr[PYRAMID_DEPTH_OFFSETS[2] + 0], 80);
    assert.equal(pyr[PYRAMID_DEPTH_OFFSETS[1] + 0], 80);
    // root: a hazard six levels down is never averaged away by max.
    assert.equal(pyr[PYRAMID_DEPTH_OFFSETS[0] + 0], 80);
});

test('buildPyramid: mode reducer, ties break toward the smaller value', () => {
    const pyr = buildPyramid(buildTestBody(), 1, 'mode');
    // cluster A non-NODATA values are all distinct (count 1 each) -> smallest wins
    assert.equal(pyr[PYRAMID_DEPTH_OFFSETS[3] + 0], 10);
    assert.equal(pyr[PYRAMID_DEPTH_OFFSETS[3] + 1], 0);
    // depth-2 parent 0: children [10,NODATA,50,50,50,50,50] -> mode 50 (5 vs 1)
    assert.equal(pyr[PYRAMID_DEPTH_OFFSETS[2] + 0], 50);
    assert.equal(pyr[PYRAMID_DEPTH_OFFSETS[1] + 0], 50);
    assert.equal(pyr[PYRAMID_DEPTH_OFFSETS[0] + 0], 50);
});

test('buildPyramid: an all-NODATA subtree stays NODATA at every ancestor level', () => {
    const body = new Uint8Array(L1_NODE_COUNT).fill(0);
    for (const reducer of ['mean', 'max', 'mode']) {
        const pyr = buildPyramid(body, 1, reducer);
        assert.ok(pyr.every((v) => v === 0), `reducer=${reducer}`);
    }
});

test('buildPyramid accepts a custom reducer function', () => {
    const body = buildTestBody();
    const pyr = buildPyramid(body, 1, (values) => values.length); // count of non-NODATA children
    assert.equal(pyr[PYRAMID_DEPTH_OFFSETS[3] + 0], 5); // cluster A: 5 non-NODATA of 7
    assert.equal(pyr[PYRAMID_DEPTH_OFFSETS[3] + 1], 0); // cluster B: all-NODATA -> NODATA, reducer not called
});

test('buildPyramid rejects a body whose length is not tileCount * 2401', () => {
    assert.throws(() => buildPyramid(new Uint8Array(L1_NODE_COUNT - 1), 1, 'mean'), RangeError);
    assert.throws(() => buildPyramid(new Uint8Array(L1_NODE_COUNT * 2), 1, 'mean'), RangeError);
});

test('buildPyramid rejects an unknown reducer name', () => {
    assert.throws(() => buildPyramid(buildTestBody(), 1, 'median'), Error);
});

test('buildPyramid handles multiple tiles independently, each tileCount*2801 bytes', () => {
    const oneTile = buildTestBody();
    const body = new Uint8Array(L1_NODE_COUNT * 2);
    body.set(oneTile, 0);
    body.set(oneTile, L1_NODE_COUNT);
    const pyr = buildPyramid(body, 2, 'max');
    assert.equal(pyr.byteLength, PYRAMID_NODE_COUNT * 2);
    assert.equal(pyr[PYRAMID_DEPTH_OFFSETS[0] + 0], 80); // tile 0 root
    assert.equal(pyr[PYRAMID_NODE_COUNT + PYRAMID_DEPTH_OFFSETS[0] + 0], 80); // tile 1 root
});

// -----------------------------------------------------------------------
// encodePacked / decodePacked round-trip
// -----------------------------------------------------------------------

test('encodePacked is the exact inverse of decodePacked', () => {
    const fields = {
        release: { shift: 7, bits: 1 },
        severity: { shift: 0, bits: 7 },
    };
    for (const values of [{ release: 0, severity: 0 }, { release: 1, severity: 127 }, { release: 0, severity: 55 }, { release: 1, severity: 1 }]) {
        const raw = encodePacked(values, fields);
        assert.equal(decodePacked(raw, fields.release), values.release);
        assert.equal(decodePacked(raw, fields.severity), values.severity);
    }
});

test('encodePacked masks each value to its declared bit width (cannot bleed into a neighbour field)', () => {
    const fields = { release: { shift: 7, bits: 1 }, severity: { shift: 0, bits: 7 } };
    // severity=255 (8 bits' worth) must be masked to 7 bits (127), not
    // overflow into release's bit.
    const raw = encodePacked({ release: 0, severity: 255 }, fields);
    assert.equal(raw, 127);
    assert.equal(decodePacked(raw, fields.release), 0);
});

// -----------------------------------------------------------------------
// buildPackedPyramid: per-field reduction (contract amendment, post-review)
//
// A packed_bits byte's bits are independent fields, not one scalar — the
// original design doc called for reducing the raw byte directly, which is
// wrong: raw-byte max(128,127) = 128 = {release:1, severity:0}, silently
// discarding six neighbours' severity=127 in favour of one neighbour's
// severity=0. buildPackedPyramid decodes each field, reduces independently
// with its own aggregate, then repacks.
// -----------------------------------------------------------------------

const AVALANCHE_FIELDS = {
    release: { shift: 7, bits: 1, aggregate: 'or' },
    severity: { shift: 0, bits: 7, aggregate: 'max' },
};

test('buildPackedPyramid: the exact regression case — one raw-128 + six raw-127 reduces to release=1, severity=127 (255), NOT raw-byte max 128', () => {
    const body = new Uint8Array(L1_NODE_COUNT).fill(1); // background: release=0, severity=1
    // depth-3 cluster 0 (leaves 0..6): one {release:1, severity:0} = raw 128,
    // six {release:0, severity:127} = raw 127.
    body.set([128, 127, 127, 127, 127, 127, 127], 0);

    const pyr = buildPackedPyramid(body, 1, AVALANCHE_FIELDS);
    const parent = pyr[PYRAMID_DEPTH_OFFSETS[3] + 0];

    assert.notEqual(parent, 128, 'must not be the naive raw-byte max');
    assert.equal(parent, 255);
    assert.equal(decodePacked(parent, AVALANCHE_FIELDS.release), 1); // "or": any child released
    assert.equal(decodePacked(parent, AVALANCHE_FIELDS.severity), 127); // "max": worst severity survives
});

test('buildPackedPyramid: release aggregates with "or", severity with "max", independently, through recursion', () => {
    // Background: release=0, severity=50 (raw = 50) everywhere.
    const body = new Uint8Array(L1_NODE_COUNT).fill(50);
    // One leaf, deep in a background subtree, releases with low severity.
    // "or" must carry release=1 to the root even though "max" would pick a
    // *different* child (the highest-severity one) for severity.
    body[0] = encodePacked({ release: 1, severity: 5 }, AVALANCHE_FIELDS); // raw = 133
    body[1] = encodePacked({ release: 0, severity: 90 }, AVALANCHE_FIELDS); // raw = 90, highest severity

    const pyr = buildPackedPyramid(body, 1, AVALANCHE_FIELDS);
    const root = pyr[PYRAMID_DEPTH_OFFSETS[0] + 0];
    assert.equal(decodePacked(root, AVALANCHE_FIELDS.release), 1, 'release "or"s up from one leaf');
    assert.equal(decodePacked(root, AVALANCHE_FIELDS.severity), 90, 'severity "max"s up independently of which child released');
});

test('buildPackedPyramid: NODATA is a whole-byte skip, not per-field', () => {
    const body = new Uint8Array(L1_NODE_COUNT).fill(0); // all NODATA
    for (const reducer of [AVALANCHE_FIELDS]) {
        const pyr = buildPackedPyramid(body, 1, reducer);
        assert.ok(pyr.every((v) => v === 0));
    }
    // One non-NODATA leaf among six NODATA children is not diluted by "phantom" zeros.
    const mixed = new Uint8Array(L1_NODE_COUNT).fill(0);
    mixed[0] = encodePacked({ release: 1, severity: 40 }, AVALANCHE_FIELDS);
    const pyr = buildPackedPyramid(mixed, 1, AVALANCHE_FIELDS);
    const parent = pyr[PYRAMID_DEPTH_OFFSETS[3] + 0];
    assert.equal(decodePacked(parent, AVALANCHE_FIELDS.release), 1);
    assert.equal(decodePacked(parent, AVALANCHE_FIELDS.severity), 40);
});

test('buildPackedPyramid never synthesizes raw 128 (release=1, severity=0) at any level, given severity>=1 input', () => {
    // The real hazard byte contract (snow_backend/avalanche/config.py,
    // "harmonized contract") guarantees every non-NODATA leaf has
    // severity >= 1 (byte 1 = "simulated, no hazard" is the floor; runout
    // severity is clamped >= 2) -- raw 128 is invalid and never emitted at
    // the leaf level. That invariant is preserved at *every* pyramid level
    // by construction, not just asserted: whenever a parent's release is 1
    // (via "or"), some non-NODATA child contributed that 1, and that same
    // child's severity (>=1, by the same leaf invariant) is in the "max"
    // pool for severity -- so the parent's severity can never be 0
    // whenever its release is 1. This test constructs input respecting the
    // leaf invariant and asserts raw 128 never appears anywhere in the
    // output pyramid, at any of the five levels.
    const body = new Uint8Array(L1_NODE_COUNT);
    for (let i = 0; i < L1_NODE_COUNT; i++) {
        const r = (i * 2654435761) % 100; // deterministic pseudo-random coverage
        if (r < 15) { body[i] = 0; continue; } // ~15% NODATA
        const severity = 1 + (i % 127); // always >= 1, per the real contract
        const release = (i % 3 === 0) ? 1 : 0; // toggles independently of severity
        body[i] = encodePacked({ release, severity }, AVALANCHE_FIELDS);
    }
    assert.equal(body.includes(128), false, 'sanity: no leaf is the invalid raw 128');

    const pyr = buildPackedPyramid(body, 1, AVALANCHE_FIELDS);
    assert.equal(pyr.includes(128), false, 'raw 128 must not appear at any reduced level');
});

test('buildPackedPyramid accepts a custom per-field aggregate function', () => {
    const fields = { severity: { shift: 0, bits: 7, aggregate: (values) => values.length } };
    const body = new Uint8Array(L1_NODE_COUNT).fill(0);
    body.set([10, 20, 30, 0, 0, 60, 70], 0); // 5 non-NODATA of 7
    const pyr = buildPackedPyramid(body, 1, fields);
    assert.equal(decodePacked(pyr[PYRAMID_DEPTH_OFFSETS[3] + 0], fields.severity), 5);
});

test('buildPackedPyramid rejects an unknown per-field aggregate and an empty fields object', () => {
    assert.throws(() => buildPackedPyramid(new Uint8Array(L1_NODE_COUNT), 1, { severity: { shift: 0, bits: 7, aggregate: 'median' } }), Error);
    assert.throws(() => buildPackedPyramid(new Uint8Array(L1_NODE_COUNT), 1, {}), Error);
});

test('buildPackedPyramid rejects a body whose length is not tileCount * 2401', () => {
    assert.throws(() => buildPackedPyramid(new Uint8Array(L1_NODE_COUNT - 1), 1, AVALANCHE_FIELDS), RangeError);
});

// -----------------------------------------------------------------------
// parseSidecarBody: header sniff, headerless fallback, length assertion
// -----------------------------------------------------------------------

function buildRawBody(tileCount) {
    const bytes = new Uint8Array(tileCount * L1_NODE_COUNT);
    for (let i = 0; i < bytes.length; i++) bytes[i] = (i * 7 + 3) % 251; // never all-zero, never spells PFL1
    return bytes;
}

function buildPfl1Header({ version = 1, layerId = 0, epochHour = 462024, tileCount = 2, nodeCount = L1_NODE_COUNT, encoding = 0, aggregate = 0, manifestHash = 0xdeadbeef } = {}) {
    const header = new Uint8Array(PFL1_HEADER_BYTES);
    const view = new DataView(header.buffer);
    header[0] = 0x50; header[1] = 0x46; header[2] = 0x4c; header[3] = 0x31; // 'PFL1'
    view.setUint16(4, version, true);
    view.setUint16(6, layerId, true);
    view.setUint32(8, epochHour, true);
    view.setUint32(12, tileCount, true);
    view.setUint16(16, nodeCount, true);
    view.setUint8(18, encoding);
    view.setUint8(19, aggregate);
    view.setUint32(20, manifestHash >>> 0, true);
    return header;
}

test('parseSidecarBody: headerless buffer is the whole-buffer-is-body fallback', () => {
    const raw = buildRawBody(2);
    const result = parseSidecarBody(raw, 2);
    assert.equal(result.ok, true);
    assert.equal(result.header, null);
    assert.deepEqual(result.body, raw);
});

test('parseSidecarBody: PFL1 header is sniffed, parsed, and stripped', () => {
    const raw = buildRawBody(2);
    const header = buildPfl1Header({ version: 1, layerId: 3, epochHour: 462024, tileCount: 2, nodeCount: L1_NODE_COUNT, encoding: 1, aggregate: 2, manifestHash: 0x1234abcd });
    const buffer = new Uint8Array(PFL1_HEADER_BYTES + raw.byteLength);
    buffer.set(header, 0);
    buffer.set(raw, PFL1_HEADER_BYTES);

    const result = parseSidecarBody(buffer, 2);
    assert.equal(result.ok, true);
    assert.deepEqual(result.header, {
        magic: 'PFL1', version: 1, layerId: 3, epochHour: 462024,
        tileCount: 2, nodeCount: L1_NODE_COUNT, encoding: 1, aggregate: 2, manifestHash: 0x1234abcd,
    });
    assert.deepEqual(result.body, raw);
});

test('parseSidecarBody: a length mismatch is a hard reject, headered or not', () => {
    const raw = buildRawBody(2);
    const short = raw.subarray(0, raw.byteLength - 1);
    const originalError = console.error;
    let loggedCount = 0;
    console.error = () => { loggedCount++; };
    try {
        const headerless = parseSidecarBody(short, 2);
        assert.equal(headerless.ok, false);
        assert.equal(headerless.reason, 'length-mismatch');

        const header = buildPfl1Header({ tileCount: 2 });
        const headeredShort = new Uint8Array(PFL1_HEADER_BYTES + short.byteLength);
        headeredShort.set(header, 0);
        headeredShort.set(short, PFL1_HEADER_BYTES);
        const headered = parseSidecarBody(headeredShort, 2);
        assert.equal(headered.ok, false);
        assert.equal(headered.reason, 'length-mismatch');
        assert.ok(headered.header, 'header is still parsed and returned even on a body-length reject');
    } finally {
        console.error = originalError;
    }
    assert.ok(loggedCount >= 2, 'a console error is emitted for each hard reject');
});

test('parseSidecarBody: PFL1 magic present but buffer shorter than the header is a truncated-header reject', () => {
    const originalError = console.error;
    console.error = () => {};
    try {
        const result = parseSidecarBody(new Uint8Array([0x50, 0x46, 0x4c, 0x31, 1, 2, 3]), 2);
        assert.equal(result.ok, false);
        assert.equal(result.reason, 'truncated-header');
    } finally {
        console.error = originalError;
    }
});

// -----------------------------------------------------------------------
// parseSidecarIndex: profile / tile-count / bitmask validation
// -----------------------------------------------------------------------

function buildIndexFixture({ tileCount = 6, hours = 10, presentSlots = [0, 1, 2, 5, 6, 9], profile = 'test-profile-x', startIso = '2026-01-01T00:00:00Z', stepHours = 1 } = {}) {
    const manifest = { release: { profile }, tiles: new Array(tileCount).fill(0).map((_, i) => ({ i })) };
    const presentBytes = new Uint8Array(Math.ceil(hours / 8));
    for (const slot of presentSlots) presentBytes[slot >> 3] |= (1 << (slot & 7));
    const json = {
        schema: 1,
        generated_at: '2026-02-14T09:04:00Z',
        tile_order: 'manifest',
        tile_count: tileCount,
        node_count: L1_NODE_COUNT,
        manifest_profile: profile,
        cache_key: 'pf-1.0.0',
        url_template: 'powfinder/{layer}/{yyyy}/{mm}/{dd}/{hh}.pfl',
        coverage: { start: startIso, step_hours: stepHours, count: hours, present: bytesToBase64(presentBytes) },
        latest: startIso,
        layers: [{ id: 'sqh', label: 'Snow quality', encoding: 'u8_linear', domain: [0, 100], units: 'SQH', aggregate: 'mean', ramp: 'powder', nodata: 0, short: 'SQH' }],
    };
    return { manifest, json };
}

test('parseSidecarIndex accepts a well-formed index and decodes coverage', () => {
    const { manifest, json } = buildIndexFixture();
    const result = parseSidecarIndex(json, manifest);
    assert.equal(result.ok, true);
    assert.equal(result.tileCount, 6);
    assert.equal(result.coverage.count, 10);
    assert.equal(result.coverage.stepHours, 1);
    assert.equal(result.coverage.startEpochHour, toEpochHour('2026-01-01T00:00:00Z'));
    assert.equal(result.layers.length, 1);
    assert.deepEqual(result.engineLayers, []); // absent in input -> defaults to []
});

test('parseSidecarIndex passes engine_layers through when present (real backend index.json shape)', () => {
    const { manifest, json } = buildIndexFixture();
    json.engine_layers = ['slab', 'hn24', 'hn72', 'wet', 'sdens'];
    const result = parseSidecarIndex(json, manifest);
    assert.equal(result.ok, true);
    assert.deepEqual(result.engineLayers, ['slab', 'hn24', 'hn72', 'wet', 'sdens']);
});

test('parseSidecarIndex rejects a manifest_profile mismatch', () => {
    const { manifest, json } = buildIndexFixture();
    json.manifest_profile = 'wrong-profile';
    const originalWarn = console.warn; console.warn = () => {};
    try {
        const result = parseSidecarIndex(json, manifest);
        assert.equal(result.ok, false);
        assert.equal(result.reason, 'profile-mismatch');
    } finally { console.warn = originalWarn; }
});

test('parseSidecarIndex rejects a tile_count mismatch', () => {
    const { manifest, json } = buildIndexFixture();
    json.tile_count = manifest.tiles.length + 1;
    const originalWarn = console.warn; console.warn = () => {};
    try {
        const result = parseSidecarIndex(json, manifest);
        assert.equal(result.ok, false);
        assert.equal(result.reason, 'tile-count-mismatch');
    } finally { console.warn = originalWarn; }
});

test('parseSidecarIndex rejects a truncated coverage bitmask', () => {
    const { manifest, json } = buildIndexFixture({ hours: 10 }); // needs ceil(10/8) = 2 bytes
    json.coverage.present = bytesToBase64(new Uint8Array(1)); // only 1 byte
    const originalWarn = console.warn; console.warn = () => {};
    try {
        const result = parseSidecarIndex(json, manifest);
        assert.equal(result.ok, false);
        assert.equal(result.reason, 'truncated-bitmask');
    } finally { console.warn = originalWarn; }
});

test('parseSidecarIndex rejects a missing/non-object index', () => {
    const { manifest } = buildIndexFixture();
    assert.equal(parseSidecarIndex(null, manifest).ok, false);
    assert.equal(parseSidecarIndex(undefined, manifest).ok, false);
});

// -----------------------------------------------------------------------
// coverageHas / nearestPresentHour
// -----------------------------------------------------------------------

test('coverageHas: true only on an exact, present hour slot; false on holes and out-of-range', () => {
    const { manifest, json } = buildIndexFixture({ hours: 10, presentSlots: [0, 1, 2, 5, 6, 9] });
    const index = parseSidecarIndex(json, manifest);
    const base = index.coverage.startEpochHour;
    assert.equal(coverageHas(index, base + 0), true);
    assert.equal(coverageHas(index, base + 2), true);
    assert.equal(coverageHas(index, base + 3), false); // hole
    assert.equal(coverageHas(index, base + 4), false); // hole
    assert.equal(coverageHas(index, base + 9), true);
    assert.equal(coverageHas(index, base + 10), false); // out of range (count=10 -> slots 0..9)
    assert.equal(coverageHas(index, base - 1), false);
});

test('coverageHas respects stepHours: only exact multiples of the grid land on a slot', () => {
    const { manifest, json } = buildIndexFixture({ hours: 6, stepHours: 24, presentSlots: [0, 2] });
    const index = parseSidecarIndex(json, manifest);
    const base = index.coverage.startEpochHour;
    assert.equal(coverageHas(index, base), true);
    assert.equal(coverageHas(index, base + 48), true); // slot 2
    assert.equal(coverageHas(index, base + 24), false); // slot 1, present bit unset
    assert.equal(coverageHas(index, base + 12), false); // not on the 24h grid at all
});

test('coverageHas is false for an unparsed (ok:false) index', () => {
    assert.equal(coverageHas({ ok: false }, 0), false);
});

test('nearestPresentHour finds the closer neighbour across a hole', () => {
    const { manifest, json } = buildIndexFixture({ hours: 10, presentSlots: [0, 1, 2, 5, 6, 9] });
    const index = parseSidecarIndex(json, manifest);
    const base = index.coverage.startEpochHour;
    assert.equal(nearestPresentHour(index, base + 3), base + 2); // dist 1 vs 2
    assert.equal(nearestPresentHour(index, base + 4), base + 5); // dist 2 vs 1
    assert.equal(nearestPresentHour(index, base + 7), base + 6); // dist 1 vs 2
    assert.equal(nearestPresentHour(index, base + 8), base + 9); // dist 2 vs 1
    assert.equal(nearestPresentHour(index, base + 2), base + 2); // already present
});

test('nearestPresentHour breaks an exact tie toward the earlier hour', () => {
    const { manifest, json } = buildIndexFixture({ hours: 5, presentSlots: [0, 2, 4] });
    const index = parseSidecarIndex(json, manifest);
    const base = index.coverage.startEpochHour;
    assert.equal(nearestPresentHour(index, base + 1), base + 0); // 0 and 2 equidistant -> earlier
    assert.equal(nearestPresentHour(index, base + 3), base + 2); // 2 and 4 equidistant -> earlier
});

test('nearestPresentHour returns null when nothing is present', () => {
    const { manifest, json } = buildIndexFixture({ hours: 5, presentSlots: [] });
    const index = parseSidecarIndex(json, manifest);
    assert.equal(nearestPresentHour(index, index.coverage.startEpochHour), null);
});

// -----------------------------------------------------------------------
// epochHourToUrl
// -----------------------------------------------------------------------

test('epochHourToUrl fills the template from UTC calendar fields', () => {
    const epochHour = Date.UTC(2026, 1, 14, 9, 0, 0) / 3600000; // 2026-02-14T09:00:00Z
    assert.equal(Number.isInteger(epochHour), true);
    const url = epochHourToUrl('powfinder/{layer}/{yyyy}/{mm}/{dd}/{hh}.pfl', 'sqh', epochHour);
    assert.equal(url, 'powfinder/sqh/2026/02/14/09.pfl');
});

test('epochHourToUrl zero-pads month/day/hour', () => {
    const epochHour = Date.UTC(2026, 0, 5, 3, 0, 0) / 3600000; // 2026-01-05T03:00:00Z
    const url = epochHourToUrl('{layer}/{yyyy}/{mm}/{dd}/{hh}.pfl', 'avalanche', epochHour);
    assert.equal(url, 'avalanche/2026/01/05/03.pfl');
});

// -----------------------------------------------------------------------
// decodePacked (avalanche packed_bits layout, per the confirmed
// clarification: release @ shift 7 / 1 bit, severity @ shift 0 / 7 bits)
// -----------------------------------------------------------------------

test('decodePacked recovers both fields of the confirmed avalanche packed_bits layout', () => {
    const release = { shift: 7, bits: 1, domain: [0, 1] };
    const severity = { shift: 0, bits: 7, domain: [0, 127] };

    const cases = [
        { release: 1, severity: 100 },
        { release: 0, severity: 55 },
        { release: 1, severity: 127 },
        { release: 0, severity: 1 },
    ];
    for (const c of cases) {
        const raw = (c.release << 7) | (c.severity & 0x7f);
        assert.equal(decodePacked(raw, release), c.release, `release for raw=${raw}`);
        assert.equal(decodePacked(raw, severity), c.severity, `severity for raw=${raw}`);
    }
});

test('decodePacked is generic over field layout (not hardcoded to any one layer)', () => {
    // A hypothetical 2-bit + 6-bit split, just to prove shift/bits alone drive it.
    const hi = { shift: 6, bits: 2 };
    const lo = { shift: 0, bits: 6 };
    const raw = (0b11 << 6) | 0b101010;
    assert.equal(decodePacked(raw, hi), 0b11);
    assert.equal(decodePacked(raw, lo), 0b101010);
});

// -----------------------------------------------------------------------
// Fixture generator (scripts/make_sidecar_fixtures.mjs): runs against the
// real 197-tile tile_manifest.json with a small --hours count so this stays
// fast, writing to a throwaway temp dir (never frontend/app/powfinder_fixtures,
// so `npm test` has no side effects on the working tree).
// -----------------------------------------------------------------------

test('make_sidecar_fixtures: produces headered + headerless files of exactly tileCount*2401 (+32) bytes, and a self-consistent index.json', async (t) => {
    const manifestPath = fileURLToPath(new URL('../tile_manifest.json', import.meta.url));
    const manifestBytes = await readFile(manifestPath);
    const manifest = JSON.parse(manifestBytes.toString('utf8'));
    assert.equal(manifest.tiles.length, 197); // the acceptance criterion's literal "197 x 2401"

    const outDir = await mkdtemp(join(tmpdir(), 'powfinder-fixtures-'));
    t.after(() => rm(outDir, { recursive: true, force: true }));

    const result = await generateFixtures({ outDir, manifest, manifestBytes, hours: 6, seed: 42, headerlessSampleHours: 1 });

    assert.equal(result.tileCount, 197);
    assert.ok(result.files.length > 0);
    for (const f of result.files) {
        const expected = f.headered
            ? 197 * L1_NODE_COUNT + PFL1_HEADER_BYTES
            : 197 * L1_NODE_COUNT;
        assert.equal(f.bytes, expected, `${f.path} length`);
        const st = await stat(f.path);
        assert.equal(st.size, expected, `${f.path} on-disk length`);
    }
    // At least one headerless sample per layer was written for the sniff path.
    assert.ok(result.files.some((f) => !f.headered));

    const index = JSON.parse(await readFile(result.indexPath, 'utf8'));
    const parsed = parseSidecarIndex(index, manifest);
    assert.equal(parsed.ok, true, parsed.reason);
    assert.equal(parsed.tileCount, 197);
    assert.equal(parsed.layers.length, 4);
    assert.deepEqual(parsed.engineLayers, []); // this generator synthesizes none

    const latest = JSON.parse(await readFile(result.latestPath, 'utf8'));
    assert.equal(latest.latest, index.latest);

    // manifestHash = CRC32 of the raw tile_manifest.json file bytes (pinned
    // by team-lead), cross-checked against Node's own zlib implementation.
    const headeredFile = result.files.find((f) => f.headered);
    const raw = await readFile(headeredFile.path);
    const parsedBody = parseSidecarBody(new Uint8Array(raw), 197);
    assert.equal(parsedBody.ok, true);
    assert.equal(parsedBody.header.manifestHash, zlib.crc32(manifestBytes) >>> 0);
});

test('make_sidecar_fixtures: avalanche layer entry matches the confirmed per-field packed_bits contract', async (t) => {
    const manifestPath = fileURLToPath(new URL('../tile_manifest.json', import.meta.url));
    const manifestBytes = await readFile(manifestPath);
    const manifest = JSON.parse(manifestBytes.toString('utf8'));
    const outDir = await mkdtemp(join(tmpdir(), 'powfinder-fixtures-'));
    t.after(() => rm(outDir, { recursive: true, force: true }));

    const result = await generateFixtures({ outDir, manifest, manifestBytes, hours: 4, seed: 3, headerlessSampleHours: 0 });
    const index = JSON.parse(await readFile(result.indexPath, 'utf8'));
    const avalanche = index.layers.find((l) => l.id === 'avalanche');
    assert.ok(avalanche);
    assert.equal(avalanche.aggregate, undefined); // no layer-level aggregate any more
    assert.deepEqual(avalanche.fields, {
        release: { shift: 7, bits: 1, aggregate: 'or', domain: [0, 1] },
        severity: { shift: 0, bits: 7, aggregate: 'max', domain: [1, 127] },
    });

    // A real generated avalanche file, run through buildPackedPyramid using
    // the layer's own published fields, produces bytes whose decoded
    // severity/release stay in-domain everywhere (no crash, no garbage).
    const avyFile = result.files.find((f) => f.layerId === 'avalanche');
    const raw = await readFile(avyFile.path);
    const body = parseSidecarBody(new Uint8Array(raw), 197);
    assert.equal(body.ok, true);
    const pyr = buildPackedPyramid(body.body, 197, avalanche.fields);
    for (let i = 0; i < pyr.length; i++) {
        if (pyr[i] === 0) continue; // NODATA
        const severity = decodePacked(pyr[i], avalanche.fields.severity);
        assert.ok(severity >= 1 && severity <= 127, `severity in domain at pyramid index ${i}`);
    }
});

test('make_sidecar_fixtures: deliberate coverage holes and a NODATA region are present and buildPyramid handles both', async (t) => {
    const manifestPath = fileURLToPath(new URL('../tile_manifest.json', import.meta.url));
    const manifestBytes = await readFile(manifestPath);
    const manifest = JSON.parse(manifestBytes.toString('utf8'));
    const outDir = await mkdtemp(join(tmpdir(), 'powfinder-fixtures-'));
    t.after(() => rm(outDir, { recursive: true, force: true }));

    const result = await generateFixtures({ outDir, manifest, manifestBytes, hours: 20, seed: 7, headerlessSampleHours: 0 });
    // hours=20 with the generator's hole fractions (0.35/0.08 and 0.7/2) must
    // produce at least one absent hour.
    assert.ok(result.coverage.presentSlots.length < 20, 'at least one hour is a deliberate hole');

    const sqhFile = result.files.find((f) => f.layerId === 'sqh');
    assert.ok(sqhFile);
    const raw = await readFile(sqhFile.path);
    const body = raw.subarray(PFL1_HEADER_BYTES); // headered by default
    const pyr = buildPyramid(new Uint8Array(body), 197, 'mean');

    const { tileIndex, nodeStart } = result.nodataRegion;
    assert.equal(pyr[tileIndex * PYRAMID_NODE_COUNT + PYRAMID_DEPTH_OFFSETS[L1_DEPTH] + nodeStart], 0);
    // Neighbouring tiles are untouched by the NODATA region.
    if (tileIndex > 0) {
        assert.notEqual(pyr[(tileIndex - 1) * PYRAMID_NODE_COUNT + PYRAMID_DEPTH_OFFSETS[L1_DEPTH] + nodeStart], undefined);
    }
});

// -----------------------------------------------------------------------
// CRC32 / manifest self-disable guard (design doc §6 P2.5 amendment)
// -----------------------------------------------------------------------

test('crc32 matches Node zlib.crc32 on arbitrary bytes', () => {
    for (const input of ['', 'a', 'the quick brown fox', 'PFL1', ' ÿ']) {
        const bytes = Buffer.from(input, 'utf8');
        assert.equal(crc32(bytes), zlib.crc32(bytes) >>> 0, JSON.stringify(input));
    }
    // Uint8Array and ArrayBuffer inputs must agree.
    const bytes = new Uint8Array([1, 2, 3, 4, 5, 250, 251, 252]);
    assert.equal(crc32(bytes), crc32(bytes.buffer));
});

test('crc32 of the real tile_manifest.json reproduces the ruled reference value', async () => {
    const manifestPath = fileURLToPath(new URL('../tile_manifest.json', import.meta.url));
    const manifestBytes = await readFile(manifestPath);
    const value = crc32(new Uint8Array(manifestBytes));
    assert.equal(value, zlib.crc32(manifestBytes) >>> 0);
    // Ruled reference value for the current beta-stubai manifest
    // (snow_backend/pfl_enums.py, confirmed by three independent
    // implementations — see this module's crc32() doc comment).
    assert.equal(value, 3511903013);
});

test('manifestHashMatches: true for a headerless sidecar (nothing to check)', () => {
    assert.equal(manifestHashMatches(null, 3511903013), true);
});

test('manifestHashMatches: true when the sidecar header agrees with the fetched manifest', () => {
    assert.equal(manifestHashMatches({ manifestHash: 3511903013 }, 3511903013), true);
});

test('manifestHashMatches: false when a rebake skew reorders tiles behind the same profile/tile-count', () => {
    // This is exactly the failure mode parseSidecarIndex's profile/tile-count
    // guard cannot see: same header shape, different manifest bytes baked
    // against.
    assert.equal(manifestHashMatches({ manifestHash: 3511903013 }, 999999999), false);
});

test('manifestHashMatches: compares as unsigned 32-bit (a signed-vs-unsigned header read must not false-positive)', () => {
    assert.equal(manifestHashMatches({ manifestHash: 3511903013 }, -783064283), true); // -783064283 >>> 0 === 3511903013
});
