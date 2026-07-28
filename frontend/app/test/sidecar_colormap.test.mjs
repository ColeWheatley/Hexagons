import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(
    new URL('../sidecar_colormap.js', import.meta.url),
    'utf8',
);
const {
    NODATA_BYTE,
    RAMP_IDS,
    RAMP_COUNT,
    buildLutData,
    rampRow,
    rampStops,
} = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

const mainSource = await readFile(new URL('../main.js', import.meta.url), 'utf8');

function rowRgba(lut, row, raw) {
    const idx = (row * 256 + raw) * 4;
    return [lut[idx], lut[idx + 1], lut[idx + 2], lut[idx + 3]];
}

test('ramp inventory matches the §2.5 row table: 5 named ramps, 8 total rows', () => {
    assert.deepEqual(RAMP_IDS, ['powder', 'hazard', 'depth', 'surface', 'steepness']);
    assert.equal(RAMP_COUNT, 8);
    assert.equal(NODATA_BYTE, 0);
});

test('rampRow returns the row table order and throws on an unknown id', () => {
    assert.equal(rampRow('powder'), 0);
    assert.equal(rampRow('hazard'), 1);
    assert.equal(rampRow('depth'), 2);
    assert.equal(rampRow('surface'), 3);
    assert.equal(rampRow('steepness'), 4);
    assert.throws(() => rampRow('nope'));
});

test('buildLutData is a 256 x RAMP_COUNT RGBA8 buffer, row-major', () => {
    const lut = buildLutData();
    assert.ok(lut instanceof Uint8Array);
    assert.equal(lut.length, 256 * RAMP_COUNT * 4);
});

test('NODATA byte (column 0) is fully transparent in every row, defined or reserved', () => {
    const lut = buildLutData();
    for (let row = 0; row < RAMP_COUNT; row++) {
        assert.deepEqual(rowRgba(lut, row, NODATA_BYTE), [0, 0, 0, 0], `row ${row}`);
    }
});

test('reserved rows (5-7) are fully transparent across the whole byte domain', () => {
    const lut = buildLutData();
    for (let row = RAMP_IDS.length; row < RAMP_COUNT; row++) {
        for (const raw of [1, 64, 128, 200, 255]) {
            assert.deepEqual(rowRgba(lut, row, raw), [0, 0, 0, 0], `row ${row} byte ${raw}`);
        }
    }
});

test('steepness row (4) reproduces main.js gradientColor() bins exactly', () => {
    // Ground truth: test/slope_shader_bins.test.mjs asserts these six GLSL
    // substrings exist verbatim in main.js. Re-assert them here so this test
    // fails loudly (not silently) if the shader's bins ever drift out from
    // under this LUT's hand-translated RGB values.
    for (const invariant of [
        'if (s < 30.0) return vec3(0.0)',
        'if (s < 35.0) return vec3(0.2, 0.8, 0.2)',
        'if (s < 40.0) return vec3(0.9, 0.9, 0.2)',
        'if (s < 45.0) return vec3(1.0, 0.6, 0.0)',
        'if (s < 55.0) return vec3(0.9, 0.2, 0.2)',
        'return vec3(0.6, 0.2, 0.8)',
    ]) assert.ok(mainSource.includes(invariant), invariant);

    const lut = buildLutData();
    const steepnessRow = rampRow('steepness');
    const bin = raw => rowRgba(lut, steepnessRow, raw);

    // s < 30: "Transparent/Texture?" in main.js — gradientColor() is never
    // even called below 30 degrees (uGradientMode guard), so the LUT must
    // carry alpha 0 here, not an opaque tint, to reproduce that behaviour.
    assert.deepEqual(bin(1), [0, 0, 0, 0]);
    assert.deepEqual(bin(29), [0, 0, 0, 0]);
    // 30 <= s < 35: vec3(0.2, 0.8, 0.2) -> (51, 204, 51) = #33cc33
    assert.deepEqual(bin(30), [51, 204, 51, 255]);
    assert.deepEqual(bin(34), [51, 204, 51, 255]);
    // 35 <= s < 40: vec3(0.9, 0.9, 0.2) -> (230, 230, 51) = #e6e633
    assert.deepEqual(bin(35), [230, 230, 51, 255]);
    assert.deepEqual(bin(39), [230, 230, 51, 255]);
    // 40 <= s < 45: vec3(1.0, 0.6, 0.0) -> (255, 153, 0) = #ff9900
    assert.deepEqual(bin(40), [255, 153, 0, 255]);
    assert.deepEqual(bin(44), [255, 153, 0, 255]);
    // 45 <= s < 55: vec3(0.9, 0.2, 0.2) -> (230, 51, 51) = #e63333
    assert.deepEqual(bin(45), [230, 51, 51, 255]);
    assert.deepEqual(bin(54), [230, 51, 51, 255]);
    // s >= 55: vec3(0.6, 0.2, 0.8) -> (153, 51, 204) = #9933cc
    assert.deepEqual(bin(55), [153, 51, 204, 255]);
    assert.deepEqual(bin(255), [153, 51, 204, 255]);
});

test('powder row (0) is the brand ramp: slate -> landing blue -> pink, pink reserved for the top', () => {
    const lut = buildLutData();
    const row = rampRow('powder');
    assert.deepEqual(rowRgba(lut, row, 1), [20, 26, 36, 255]);   // #141a24, bottom of the domain
    assert.deepEqual(rowRgba(lut, row, 255), [255, 211, 232, 255]); // #ffd3e8, top of the domain
    // §2.5 asks for a ramp that is "perceptually monotonic in luminance."
    // Taken as literally as the doc's six named hex stops in the doc's own
    // order, the ramp is NOT fully monotonic: #6fc6ff (luma ~184) is
    // brighter than the #c06ff2 stop right after it (luma ~138) before
    // luminance climbs again through pink to pale pink. Flagged to
    // frontend-design (see agent report) rather than silently reordering or
    // substituting the doc's named colours. This test pins the true
    // end-to-end trend (dark start, bright end) without asserting the
    // stronger, currently-false, fully-monotonic claim.
    const luma = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
    assert.ok(luma(rowRgba(lut, row, 255)) > luma(rowRgba(lut, row, 1)));
});

test('hazard row (1) is 5 hard-stepped EAWS classes over the raw byte domain', () => {
    const lut = buildLutData();
    const row = rampRow('hazard');
    // f = (raw-1)/254; bin = floor(f*5), clamped to [0,4].
    assert.deepEqual(rowRgba(lut, row, 1), [52, 211, 153, 255]);    // #34d399, low
    assert.deepEqual(rowRgba(lut, row, 128), [251, 146, 60, 255]);  // #fb923c, considerable (mid-domain)
    assert.deepEqual(rowRgba(lut, row, 255), [127, 29, 29, 255]);   // #7f1d1d, very high
});

test('rampStops: continuous ramps expose a smooth gradient and two end labels', () => {
    const powder = rampStops('powder');
    assert.equal(powder.categorical, false);
    assert.match(powder.css, /^linear-gradient\(90deg, /);
    assert.match(powder.css, /#141a24 0%/);
    assert.match(powder.css, /#ff6b9d 85%/);
    assert.match(powder.css, /#ffd3e8 100%\)$/);
    assert.deepEqual(powder.ticks, [{ at: 0, label: 'poor' }, { at: 100, label: 'good' }]);

    const depth = rampStops('depth');
    assert.equal(depth.categorical, false);
    assert.deepEqual(depth.ticks, [{ at: 0, label: 'thin' }, { at: 100, label: 'deep' }]);
    assert.match(depth.css, /#ffffff 100%\)$/);
});

test('rampStops: hazard is hard-stepped with one tick per class at its bin centre', () => {
    const hazard = rampStops('hazard');
    assert.equal(hazard.categorical, true);
    assert.equal(
        hazard.css,
        'linear-gradient(90deg, #34d399 0%, #34d399 20%, #facc15 20%, #facc15 40%, ' +
        '#fb923c 40%, #fb923c 60%, #f87171 60%, #f87171 80%, #7f1d1d 80%, #7f1d1d 100%)',
    );
    assert.deepEqual(hazard.ticks, [
        { at: 10, label: 'low' },
        { at: 30, label: 'moderate' },
        { at: 50, label: 'considerable' },
        { at: 70, label: 'high' },
        { at: 90, label: 'very high' },
    ]);
});

test('rampStops: surface and steepness are categorical with one tick per class', () => {
    for (const id of ['surface', 'steepness']) {
        const stops = rampStops(id);
        assert.equal(stops.categorical, true);
        assert.ok(stops.ticks.length >= 5);
        for (let i = 1; i < stops.ticks.length; i++) {
            assert.ok(stops.ticks[i].at > stops.ticks[i - 1].at, `${id} ticks must be strictly increasing`);
        }
    }
    const surface = rampStops('surface');
    assert.deepEqual(surface.ticks.map(t => t.label), ['powder', 'wind slab', 'crust', 'wet', 'refrozen', 'rock']);

    const steepness = rampStops('steepness');
    assert.deepEqual(steepness.ticks.map(t => t.label), ['< 30°', '30-35°', '35-40°', '40-45°', '45-55°', '55°+']);
    assert.match(steepness.css, /^linear-gradient\(90deg, #000000 0%, #000000 [\d.]+%,/);
});

test('rampRow and rampStops both reject an unknown ramp id', () => {
    assert.throws(() => rampStops('does-not-exist'));
});
