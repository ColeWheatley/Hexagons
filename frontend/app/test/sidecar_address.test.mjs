// Guards the P1.1 contract (design doc §1.6): tile_worker.js's
// buildLevelBuffers() writes each instance's tile-pyramid address into
// nz2[n1+3], using the *source heap index* (`i`), not the write cursor
// (`w`) — those two drift apart whenever pd.valid[] or a range selection
// skips nodes (design doc §0.2). Getting this wrong silently mis-addresses
// every sidecar lookup with no visible symptom short of a scrambled map, so
// this is exercised three ways: (1) the assigned expression isn't a stub
// literal, (2) tile_worker.js's duplicated constants agree with
// sidecar_format.mjs's real exports, (3) a real run of buildLevelBuffers
// against a synthetic parsed tile — with valid[] gaps and a rangesByDepth
// selection, the two cases that break naive indexing — produces exactly
// pyramidAddress(depth, sourceHeapIndex) for every emitted instance.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { PYRAMID_DEPTH_OFFSETS, L1_DEPTH, pyramidAddress } from '../sidecar_format.mjs';

const require = createRequire(import.meta.url);
const workerPath = fileURLToPath(new URL('../tile_worker.js', import.meta.url));
const workerSource = readFileSync(workerPath, 'utf8');

// -----------------------------------------------------------------------
// Text invariants
// -----------------------------------------------------------------------

test('nz2[n1 + 3] is assigned a real pyramid-address expression, not the old stub literal', () => {
    assert.doesNotMatch(workerSource, /nz2\[n1 \+ 3\] = 0\.0;/, 'the pre-P1.1 stub must be gone');
    assert.match(
        workerSource,
        /nz2\[n1 \+ 3\] = \(d >= SIDECAR_L1_DEPTH\)\s*\n\s*\? \(SIDECAR_PYRAMID_DEPTH_OFFSETS\[SIDECAR_L1_DEPTH\] \+ \(\(i \/ sidecarDepthDivisor\) \| 0\)\)\s*\n\s*: \(SIDECAR_PYRAMID_DEPTH_OFFSETS\[d\] \+ i\);/,
    );
});

test("tile_worker.js's duplicated pyramid constants agree with sidecar_format.mjs's real exports", () => {
    const l1DepthMatch = /const SIDECAR_L1_DEPTH = (\d+);/.exec(workerSource);
    const offsetsMatch = /const SIDECAR_PYRAMID_DEPTH_OFFSETS = \[([^\]]+)\];/.exec(workerSource);
    assert.ok(l1DepthMatch, 'SIDECAR_L1_DEPTH declaration found');
    assert.ok(offsetsMatch, 'SIDECAR_PYRAMID_DEPTH_OFFSETS declaration found');

    const duplicatedL1Depth = Number(l1DepthMatch[1]);
    const duplicatedOffsets = offsetsMatch[1].split(',').map((s) => Number(s.trim()));

    assert.equal(duplicatedL1Depth, L1_DEPTH);
    assert.deepEqual(duplicatedOffsets, PYRAMID_DEPTH_OFFSETS);
});

// -----------------------------------------------------------------------
// Real execution: load tile_worker.js as a classic worker script (it is
// importScripts-based, not a module — nothing in it is exported) via vm, so
// buildLevelBuffers can be called directly against a synthetic parsed tile.
// -----------------------------------------------------------------------

function loadTileWorker() {
    // `self` is referenced unqualified throughout tile_worker.js (it's a
    // classic worker script). Stub it to globalThis so those references
    // resolve, and require() gosper_core.js first so tile_worker.js's
    // `if (!self.GosperCore) importScripts(...)` guard is skipped — the
    // worker's importScripts is not available/meaningful under Node.
    globalThis.self = globalThis;
    globalThis.importScripts = (...args) => {
        throw new Error(`importScripts should not be called in this harness: ${args.join(', ')}`);
    };
    require(fileURLToPath(new URL('../gosper_core.js', import.meta.url)));

    // vm.runInThisContext (unlike require()) runs the source as a top-level
    // script sharing this process's real global object, so the file's
    // top-level `function`/`const` declarations attach to globalThis exactly
    // like a classic <script> tag would — the epilogue below is what then
    // lets this test read `buildLevelBuffers` back out.
    const src = `${workerSource}\n;self.__pf_buildLevelBuffers = buildLevelBuffers;\n`;
    vm.runInThisContext(src, { filename: workerPath });
    return globalThis.__pf_buildLevelBuffers;
}

const buildLevelBuffers = loadTileWorker();

const DEPTH_COUNTS = [1, 7, 49, 343, 2401, 16807];
const TILE_LEVEL = 5;

function buildSyntheticParsed() {
    const depths = [];
    for (let d = 0; d <= TILE_LEVEL; d++) {
        const count = DEPTH_COUNTS[d];
        const valid = new Uint8Array(count).fill(1);
        const h = new Float32Array(count).fill(2000);
        const slopeMean = new Uint8Array(count).fill(20);
        const nx = new Uint8Array(count).fill(128);
        const nz = new Uint8Array(count).fill(200);
        if (d === TILE_LEVEL) {
            depths.push({ h, slopeMean, nx, nz, valid });
        } else {
            const relief = new Uint8Array(count).fill(5); // avoids needing downExtent/upExtent
            depths.push({ h, slopeMean, nx, nz, valid, relief });
        }
    }
    const unitCount = DEPTH_COUNTS[TILE_LEVEL];
    const unit = {
        d1: new Int16Array(unitCount), d2: new Int16Array(unitCount), d3: new Int16Array(unitCount),
        s1: new Uint8Array(unitCount).fill(30), s2: new Uint8Array(unitCount).fill(30), s3: new Uint8Array(unitCount).fill(30),
    };
    return { depths, unit };
}

// Reproduces buildLevelBuffers' own iteration order (ranges in order, i
// ascending within each range, skipping invalid) so the expected sequence of
// source heap indices lines up 1:1 with the emitted instances (index w).
function expectedOrderedIndices(validArr, selectedRanges) {
    const pairs = selectedRanges ? selectedRanges : [0, validArr.length];
    const out = [];
    for (let p = 0; p < pairs.length; p += 2) {
        const start = pairs[p], end = start + pairs[p + 1];
        for (let i = start; i < end; i++) if (validArr[i]) out.push(i);
    }
    return out;
}

function assertDepthAddresses(lods, parsed, depth, selectedRanges) {
    const level = TILE_LEVEL - depth;
    const lod = lods[level];
    assert.ok(lod, `depth ${depth} (level ${level}) produced instances`);
    const expected = expectedOrderedIndices(parsed.depths[depth].valid, selectedRanges);
    assert.equal(lod.count, expected.length, `depth ${depth} instance count`);
    for (let w = 0; w < expected.length; w++) {
        const i = expected[w];
        const actual = lod.nz2[w * 4 + 3];
        const want = pyramidAddress(depth, i);
        assert.equal(actual, want, `depth ${depth}, instance ${w} (source i=${i})`);
    }
}

test('buildLevelBuffers: every instance at every depth carries pyramidAddress(depth, i) with no gaps or a selection', () => {
    const parsed = buildSyntheticParsed();
    const lods = buildLevelBuffers(parsed, null);
    for (let d = 0; d <= TILE_LEVEL; d++) assertDepthAddresses(lods, parsed, d, null);
});

test('buildLevelBuffers: pd.valid[] gaps do not desync nz2.w from the source heap index (design doc §0.2)', () => {
    const parsed = buildSyntheticParsed();
    // Depth 2 (count 49): knock out a scattered, non-trivial set of indices,
    // including a run at the start and the very last index, so `w` drifts
    // from `i` by a varying amount across the depth.
    const invalidAtDepth2 = [0, 1, 5, 6, 7, 20, 48];
    for (const i of invalidAtDepth2) parsed.depths[2].valid[i] = 0;
    // Depth 5 (units, count 16807): invalidate every node whose L1 parent is
    // index 3, so an entire 7-unit cluster disappears at once.
    for (let i = 3 * 7; i < 3 * 7 + 7; i++) parsed.depths[5].valid[i] = 0;

    const lods = buildLevelBuffers(parsed, null);
    for (let d = 0; d <= TILE_LEVEL; d++) assertDepthAddresses(lods, parsed, d, null);

    // Concretely: the first surviving depth-2 instance is source index 2
    // (0 and 1 were invalidated), and must carry pyramidAddress(2, 2), not
    // pyramidAddress(2, 0) (which naive write-cursor indexing would produce).
    const lod2 = lods[TILE_LEVEL - 2];
    assert.equal(lod2.nz2[0 * 4 + 3], pyramidAddress(2, 2));
});

test('buildLevelBuffers: a rangesByDepth selection only visits the selected source indices, correctly addressed', () => {
    const parsed = buildSyntheticParsed();
    // Depth 3 (count 343): select two disjoint ranges, mirroring how the
    // settled CDLOD frontier only builds chosen L3 subtrees (design doc
    // §0.2). Also knock out one index inside a selected range, so this case
    // combines both failure modes at once.
    const rangesByDepth = { 3: [10, 20, 100, 15] }; // [start,count, start,count] -> [10..29], [100..114]
    parsed.depths[3].valid[15] = 0; // inside the first selected range

    const lods = buildLevelBuffers(parsed, { rangesByDepth });
    assertDepthAddresses(lods, parsed, 3, rangesByDepth[3]);

    // Every emitted depth-3 instance's source index must fall inside one of
    // the selected ranges — none from [30..99] or [115..342] leaked in.
    const lod3 = lods[TILE_LEVEL - 3];
    for (let w = 0; w < lod3.count; w++) {
        const addr = lod3.nz2[w * 4 + 3];
        const i = addr - PYRAMID_DEPTH_OFFSETS[3]; // depth 3 < L1_DEPTH, so this recovers i exactly
        const inRange = (i >= 10 && i < 30) || (i >= 100 && i < 115);
        assert.ok(inRange, `source index ${i} (from addr ${addr}) is inside a selected range`);
    }
    // Untouched depths in the same call are unaffected by the depth-3 selection.
    assertDepthAddresses(lods, parsed, 0, null);
    assertDepthAddresses(lods, parsed, 5, null);
});

test('buildLevelBuffers: unit (depth 5) addresses resolve to their L1 parent, 7 units per parent', () => {
    const parsed = buildSyntheticParsed();
    const lods = buildLevelBuffers(parsed, null);
    const lod5 = lods[0]; // level 0 = units
    // Units 0..6 share L1 parent 0; units 7..13 share L1 parent 1; etc.
    for (let parent = 0; parent < 20; parent++) {
        const expectedAddr = PYRAMID_DEPTH_OFFSETS[L1_DEPTH] + parent;
        for (let child = 0; child < 7; child++) {
            const unitIndex = parent * 7 + child;
            assert.equal(lod5.nz2[unitIndex * 4 + 3], expectedAddr, `unit ${unitIndex} -> L1 parent ${parent}`);
        }
    }
});
