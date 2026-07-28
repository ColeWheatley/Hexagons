// Guards P1.3's atlas addressing, slot assignment, interleave correctness,
// and dispose (design doc §1.5). THREE is dependency-injected
// (createSidecarAtlas(THREE, {...})), per frontend-design's ruling that this
// module must be testable in Node without a real WebGL context — so this
// file drives it with a small fake THREE rather than the real three.js
// package, mirroring how render_policy.js's geometry helpers are tested.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createSidecarAtlas, createSidecarLut, ATLAS_WIDTH, ROWS_PER_TILE } from '../sidecar_atlas.mjs';
import { buildLutData, RAMP_COUNT } from '../sidecar_colormap.mjs';

// ~20-line fake THREE: a DataTexture is just a plain object carrying the
// CPU-side array and the filter/format flags this module sets on it.
class FakeDataTexture {
    constructor(data, width, height, format, type) {
        this.image = { data, width, height };
        this.format = format;
        this.type = type;
        this.magFilter = null;
        this.minFilter = null;
        this.generateMipmaps = true; // three.js default; must end up false
        this.unpackAlignment = 4;    // three.js default; must end up 1
        this.needsUpdate = false;
        this.disposed = false;
    }
    dispose() { this.disposed = true; }
}
const FakeTHREE = Object.freeze({
    DataTexture: FakeDataTexture,
    RGBAFormat: 'RGBAFormat',
    UnsignedByteType: 'UnsignedByteType',
    NearestFilter: 'NearestFilter',
});

function fakeManifest(tileSpecs) {
    return { tiles: tileSpecs.map(([yq, yr]) => ({ yq, yr })) };
}

// -----------------------------------------------------------------------
// Allocation
// -----------------------------------------------------------------------

test('createSidecarAtlas allocates NearestFilter, no-mips, unpackAlignment 1, tileCount*rowsPerTile tall', () => {
    const manifest = fakeManifest([[1, 1], [2, 2], [3, 3]]);
    const atlas = createSidecarAtlas(FakeTHREE, { manifest });
    assert.equal(atlas.tileCount, 3);
    assert.equal(atlas.atlasWidth, ATLAS_WIDTH);
    assert.equal(atlas.rowsPerTile, ROWS_PER_TILE);
    assert.equal(atlas.height, 3 * ROWS_PER_TILE);
    assert.equal(atlas.texture.image.width, ATLAS_WIDTH);
    assert.equal(atlas.texture.image.height, 3 * ROWS_PER_TILE);
    assert.equal(atlas.texture.magFilter, 'NearestFilter');
    assert.equal(atlas.texture.minFilter, 'NearestFilter');
    assert.equal(atlas.texture.generateMipmaps, false);
    assert.equal(atlas.texture.unpackAlignment, 1);
    assert.equal(atlas.bytes(), ATLAS_WIDTH * 3 * ROWS_PER_TILE * 4);
});

test('createSidecarAtlas rejects an empty or missing manifest', () => {
    assert.throws(() => createSidecarAtlas(FakeTHREE, { manifest: { tiles: [] } }), Error);
    assert.throws(() => createSidecarAtlas(FakeTHREE, {}), Error);
});

test('a custom atlasWidth/rowsPerTile is honoured', () => {
    const manifest = fakeManifest([[0, 0], [1, 0]]);
    const atlas = createSidecarAtlas(FakeTHREE, { manifest, atlasWidth: 8, rowsPerTile: 2 });
    assert.equal(atlas.texture.image.width, 8);
    assert.equal(atlas.texture.image.height, 4); // 2 tiles * 2 rows
});

// -----------------------------------------------------------------------
// Slot assignment
// -----------------------------------------------------------------------

test('slotFor/rowBaseFor follow manifest.tiles[] DECLARATION order, not sorted (yq,yr) order, and the "yq_yr" key convention', () => {
    // Deliberately scrambled — mirrors the real manifest's actual layout
    // (a column-strip scan with alternating direction; the doc author
    // verified 182/197 real tile positions differ from sorted order). A
    // conveniently-sorted fixture here would still pass against an
    // implementation that accidentally re-sorts tiles internally before
    // assigning slots — silent data corruption no CRC32 guard can catch,
    // since the file bytes are unchanged and the corruption is purely
    // in-memory. This is the actual guard against that bug.
    const manifest = fakeManifest([[5, 3], [5, 2], [5, 1], [6, -1], [6, 0], [6, 1]]);

    // Sanity on the fixture itself: assert it is genuinely non-sorted, so
    // the assertions below exercise declaration-order preservation rather
    // than agreeing with sorted order by coincidence.
    const sorted = [...manifest.tiles].sort((a, b) => a.yq - b.yq || a.yr - b.yr);
    const isSortedOrder = sorted.every((t, i) => t.yq === manifest.tiles[i].yq && t.yr === manifest.tiles[i].yr);
    assert.equal(isSortedOrder, false, 'fixture must be non-sorted to be a meaningful guard');

    const atlas = createSidecarAtlas(FakeTHREE, { manifest });
    assert.equal(atlas.slotFor('5_3'), 0);
    assert.equal(atlas.slotFor('5_2'), 1);
    assert.equal(atlas.slotFor('5_1'), 2);
    assert.equal(atlas.slotFor('6_-1'), 3);
    assert.equal(atlas.slotFor('6_0'), 4);
    assert.equal(atlas.slotFor('6_1'), 5);
    assert.equal(atlas.rowBaseFor('5_3'), 0);
    assert.equal(atlas.rowBaseFor('6_-1'), 3 * ROWS_PER_TILE);
    assert.equal(atlas.rowBaseFor('6_1'), 5 * ROWS_PER_TILE);
});

test('slotFor/rowBaseFor return null for a key not in the manifest', () => {
    const atlas = createSidecarAtlas(FakeTHREE, { manifest: fakeManifest([[0, 0]]) });
    assert.equal(atlas.slotFor('99_99'), null);
    assert.equal(atlas.rowBaseFor('99_99'), null);
});

// -----------------------------------------------------------------------
// installLayer: strided interleave correctness
// -----------------------------------------------------------------------

test('installLayer writes each tile\'s bytes into its own row-block, in the correct RGBA channel', () => {
    const manifest = fakeManifest([[9, 0], [2, 0]]); // slot 0 = higher yq, slot 1 = lower yq -- non-sorted
    const atlas = createSidecarAtlas(FakeTHREE, { manifest, atlasWidth: 16, rowsPerTile: 1 });
    const nodesPerTile = 5;
    // tile 0: [10,20,30,40,50], tile 1: [60,70,80,90,100]
    const pyramidBytes = new Uint8Array([10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
    atlas.installLayer('sqh', pyramidBytes); // R channel = 0

    const data = atlas._debugData;
    const width = atlas.atlasWidth;
    // tile 0 occupies row 0 (rowBase=0), addresses 0..4 -> cols 0..4
    for (let addr = 0; addr < 5; addr++) {
        const texel = (0 * width + addr) * 4;
        assert.equal(data[texel + 0], pyramidBytes[addr], `tile0 addr${addr} R channel`);
        assert.equal(data[texel + 1], 0, `tile0 addr${addr} G channel untouched`);
    }
    // tile 1 occupies row 1 (rowBase=1*rowsPerTile=1), addresses 0..4 -> cols 0..4
    for (let addr = 0; addr < 5; addr++) {
        const texel = (1 * width + addr) * 4;
        assert.equal(data[texel + 0], pyramidBytes[5 + addr], `tile1 addr${addr} R channel`);
    }
    assert.equal(atlas.texture.needsUpdate, true);
});

test('installLayer wraps addresses across atlas rows when nodesPerTile > atlasWidth', () => {
    const manifest = fakeManifest([[0, 0]]);
    const atlas = createSidecarAtlas(FakeTHREE, { manifest, atlasWidth: 4, rowsPerTile: 2 }); // capacity 8
    const pyramidBytes = new Uint8Array([1, 2, 3, 4, 5, 6]); // 6 nodes, addr 4 and 5 wrap to row 1
    atlas.installLayer('depth', pyramidBytes); // G channel = 1

    const data = atlas._debugData;
    const width = atlas.atlasWidth;
    // addr 0..3 -> row 0, cols 0..3; addr 4..5 -> row 1, cols 0..1
    assert.equal(data[(0 * width + 0) * 4 + 1], 1);
    assert.equal(data[(0 * width + 3) * 4 + 1], 4);
    assert.equal(data[(1 * width + 0) * 4 + 1], 5);
    assert.equal(data[(1 * width + 1) * 4 + 1], 6);
});

test('different layers occupy different channels without disturbing each other', () => {
    const manifest = fakeManifest([[0, 0]]);
    const atlas = createSidecarAtlas(FakeTHREE, { manifest, atlasWidth: 8, rowsPerTile: 1 });
    atlas.installLayer('sqh', new Uint8Array([11, 12, 13]));
    atlas.installLayer('depth', new Uint8Array([21, 22, 23]));
    atlas.installLayer('avalanche', new Uint8Array([31, 32, 33]));
    atlas.installLayer('surface', new Uint8Array([41, 42, 43]));

    const data = atlas._debugData;
    for (let addr = 0; addr < 3; addr++) {
        const texel = addr * 4;
        assert.equal(data[texel + 0], 11 + addr, `R (sqh) addr${addr}`);
        assert.equal(data[texel + 1], 21 + addr, `G (depth) addr${addr}`);
        assert.equal(data[texel + 2], 31 + addr, `B (avalanche) addr${addr}`);
        assert.equal(data[texel + 3], 41 + addr, `A (surface) addr${addr}`);
    }
});

test('installLayer rejects an unknown layer id, a non-multiple-of-tileCount length, and over-capacity nodesPerTile', () => {
    const manifest = fakeManifest([[0, 0], [1, 0]]);
    const atlas = createSidecarAtlas(FakeTHREE, { manifest, atlasWidth: 4, rowsPerTile: 1 }); // capacity 4
    assert.throws(() => atlas.installLayer('not_a_layer', new Uint8Array([1, 2])), Error);
    assert.throws(() => atlas.installLayer('sqh', new Uint8Array([1, 2, 3])), RangeError); // 3 not divisible by 2 tiles
    assert.throws(() => atlas.installLayer('sqh', new Uint8Array(10)), RangeError); // 5 nodes/tile > capacity 4
});

// -----------------------------------------------------------------------
// hasData / dispose
// -----------------------------------------------------------------------

test('hasData is false until a layer is installed, and false for an invalid slot', () => {
    const manifest = fakeManifest([[0, 0], [1, 0]]);
    const atlas = createSidecarAtlas(FakeTHREE, { manifest });
    assert.equal(atlas.hasData(0), false);
    atlas.installLayer('sqh', new Uint8Array([1, 1]));
    assert.equal(atlas.hasData(0), true);
    assert.equal(atlas.hasData(1), true); // installLayer always populates every tile
    assert.equal(atlas.hasData(-1), false);
    assert.equal(atlas.hasData(99), false);
    assert.equal(atlas.hasData(null), false);
    assert.equal(atlas.hasData(undefined), false);
});

test('dispose() disposes the underlying texture', () => {
    const atlas = createSidecarAtlas(FakeTHREE, { manifest: fakeManifest([[0, 0]]) });
    assert.equal(atlas.texture.disposed, false);
    atlas.dispose();
    assert.equal(atlas.texture.disposed, true);
});

// -----------------------------------------------------------------------
// createSidecarLut
// -----------------------------------------------------------------------

test('createSidecarLut builds a 256 x RAMP_COUNT NearestFilter texture from the real buildLutData()', () => {
    const lut = createSidecarLut(FakeTHREE);
    assert.equal(lut.image.width, 256);
    assert.equal(lut.image.height, RAMP_COUNT);
    assert.equal(lut.magFilter, 'NearestFilter');
    assert.equal(lut.minFilter, 'NearestFilter');
    assert.equal(lut.generateMipmaps, false);
    assert.equal(lut.needsUpdate, true);
    assert.deepEqual(lut.image.data, buildLutData());
});
