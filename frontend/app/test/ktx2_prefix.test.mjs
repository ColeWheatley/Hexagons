// Progressive KTX2: a byte prefix of a published 4096 px page, rebased to a
// lower base level, must transcode byte-identically to that level of the full
// file. Reference hashes were computed from the complete 6,351,583-byte
// release file high/texture_61_199.ktx2 (not committed); the fixture is its
// first 27,972 bytes, exactly what a Range request for 256 px returns.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import '../ktx2_prefix.js';

const K = globalThis.Ktx2Prefix;
const require = createRequire(import.meta.url);
const BASIS = require('../vendor/basisu_v2/basis_transcoder.js');
const fixture = name => new Uint8Array(readFileSync(new URL(`./fixtures/${name}`, import.meta.url)));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

const RGBA32 = 13, ASTC_8x6 = 33, BC7 = 6;
const FULL_FILE_REFERENCE = {
    'L4:rgba32': '48368453836e1b567bc636ece16e2159506eea20d0b657fff594632988f23427',
    'L5:rgba32': 'efe2fc555f7caad4943f06154352b3214d69c69be166eca5d04c9c78c855ad73',
    'L4:astc8x6': 'e77d5ecb40cd4ca248b7b46276215d6567072b0fb6bfaf868db3a9a3b9cb0b1b',
    'L4:bc7': 'ac6517144f39b3ee54feac39b77dd084f03cffad6d2b32c2419337e5225ec726',
};

let basis;
async function transcoder() {
    if (!basis) {
        basis = await BASIS();
        basis.initializeBasis();
    }
    return basis;
}

async function transcodeLevel(bytes, level, format) {
    const M = await transcoder();
    const file = new M.KTX2File(bytes);
    try {
        assert.ok(file.isValid(), 'valid KTX2');
        assert.ok(file.isXUASTC_LDR(), 'still XUASTC after rebase');
        assert.ok(file.startTranscoding(), 'startTranscoding');
        const out = new Uint8Array(file.getImageTranscodedSizeInBytes(level, 0, 0, format));
        assert.ok(file.transcodeImageWithFlags(out, level, 0, 0, format, 0, -1, -1), `transcode L${level}`);
        return { out, width: file.getWidth(), height: file.getHeight(), levels: file.getLevels() };
    } finally {
        file.close();
        file.delete();
    }
}

test('header parses from a 256 px Range prefix and locates every level', () => {
    const prefix = fixture('texture_61_199.high.prefix256.ktx2');
    assert.equal(K.parseHeader(prefix.subarray(0, 60)), null, 'too short to parse');
    const header = K.parseHeader(prefix);
    assert.equal(header.width, 4096);
    assert.equal(header.levels, 13);
    assert.equal(header.scheme, 5);
    assert.equal(K.prefixEndForLevel(header, 4), 27972);
    assert.equal(K.prefixEndForLevel(header, 2), 399566);
    assert.equal(K.prefixEndForLevel(header, 1), 1577585);
    assert.equal(K.prefixEndForLevel(header, 0), 6351583);
    assert.equal(K.levelForPrefix(header, prefix.byteLength), 4);
    assert.equal(K.levelForPrefix(header, 27971), 5);
    assert.equal(K.levelForPrefix(header, 100), -1);
});

test('rebased 256 px prefix transcodes byte-identically to the full file', async () => {
    const prefix = fixture('texture_61_199.high.prefix256.ktx2');
    const header = K.parseHeader(prefix);
    const rebased = K.rebase(prefix, header, 4);
    const rgba = await transcodeLevel(rebased, 0, RGBA32);
    assert.equal(rgba.width, 256);
    assert.equal(rgba.levels, 9);
    assert.equal(sha(rgba.out), FULL_FILE_REFERENCE['L4:rgba32']);
    assert.equal(sha((await transcodeLevel(rebased, 1, RGBA32)).out), FULL_FILE_REFERENCE['L5:rgba32']);
    assert.equal(sha((await transcodeLevel(rebased, 0, ASTC_8x6)).out), FULL_FILE_REFERENCE['L4:astc8x6']);
    assert.equal(sha((await transcodeLevel(rebased, 0, BC7)).out), FULL_FILE_REFERENCE['L4:bc7']);
    assert.throws(() => K.rebase(prefix, header, 3), /too short/);
});

test('rebasing a complete small file matches its own lower levels', async () => {
    const low = fixture('texture_61_199.low.ktx2');
    const header = K.parseHeader(low);
    assert.equal(header.width, 128);
    for (const base of [1, 2, 3]) {
        const rebased = K.rebase(low, header, base);
        const expected = await transcodeLevel(low, base, RGBA32);
        const actual = await transcodeLevel(rebased, 0, RGBA32);
        assert.equal(actual.width, 128 >> base);
        assert.equal(sha(actual.out), sha(expected.out), `base ${base}`);
    }
});
