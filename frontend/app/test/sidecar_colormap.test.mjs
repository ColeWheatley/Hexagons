import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
    NODATA_BYTE,
    RAMP_IDS,
    RAMP_COUNT,
    buildLutData,
    rampRow,
    rampStops,
} from '../sidecar_colormap.mjs';

const mainSource = await readFile(new URL('../main.js', import.meta.url), 'utf8');

function rowRgba(lut, row, raw) {
    const idx = (row * 256 + raw) * 4;
    return [lut[idx], lut[idx + 1], lut[idx + 2], lut[idx + 3]];
}

const luma = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

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

test('powder row (0) is the brand ramp: slate -> darkened blue-violet -> pink, pink reserved for the top', () => {
    const lut = buildLutData();
    const row = rampRow('powder');
    assert.deepEqual(rowRgba(lut, row, 1), [20, 26, 36, 255]);      // #141a24, bottom of the domain
    assert.deepEqual(rowRgba(lut, row, 255), [255, 211, 232, 255]); // #ffd3e8, top of the domain
    // The brand anchor (#ff6b9d) sits at the 85% stop; byte 254*0.85+1 is
    // not an exact integer, so check nearby bytes land close to it rather
    // than asserting an exact match at an arbitrary rounded byte index.
    const near85 = rowRgba(lut, row, 217);
    assert.ok(Math.abs(near85[0] - 255) <= 1 && Math.abs(near85[1] - 107) <= 3 && Math.abs(near85[2] - 157) <= 3);
});

test('continuous ramps are luminance-monotonic across their full domain (glanceability under luma modulation)', () => {
    // §2.5 requires this so that terrain-luma modulation (§2.6:
    // `layer.rgb * (0.45 + 0.55*luma)`) can never make two different values
    // read as the same on-screen brightness. Categorical ramps (hazard,
    // surface, steepness) are deliberately exempt — they are read by hue
    // plus the legend/stipple, not luminance (EAWS green->yellow->orange->
    // red->dark-red is not monotonic by convention, and that's correct).
    //
    // ROUNDING_TOLERANCE is forced, not a pragmatic loosening. Each byte's
    // RGB is rounded per channel independently; on `powder`'s flattest
    // segment (#2f6a90 -> #8f66c4, +21.3 luma over ~51 entries) the curve
    // advances only ~0.42 luma/entry, below the ~1.0-luma perturbation that
    // independent per-channel rounding can introduce between adjacent
    // entries. Strict >=0 monotonicity is unachievable at 8-bit for any
    // ramp this shallow in places -- it is not a defect in these stops, and
    // tightening this constant to 0 will produce a red build with no real
    // regression behind it. (Frontend-design measured the built LUT's
    // worst single-step delta at -0.218, comfortably inside this bound.)
    //
    // A per-step bound alone doesn't catch cumulative drift, though: 255
    // consecutive -1.0 steps would pass while the ramp fell 255 luma, more
    // than `powder` climbs end to end (196.4). The windowed check below
    // closes that hole without weakening the per-step one -- per-step
    // catches a sharp inversion (the original -45.9 defect), windowed
    // catches a slow, tolerance-riding descent that no single step trips.
    // Window 8 measured worst-case deltas: window 4 -> +1.06, window 8 ->
    // +2.91, window 16 -> +6.10 -- window 8 leaves ~3 luma of headroom,
    // tight enough to catch a real regression, loose enough not to be
    // flaky against rounding noise.
    const ROUNDING_TOLERANCE = 1.0;
    const WINDOW = 8;
    const lut = buildLutData();
    for (const id of RAMP_IDS) {
        if (rampStops(id).categorical) continue;
        const row = rampRow(id);
        const lumas = [];
        for (let raw = 1; raw <= 255; raw++) lumas.push(luma(rowRgba(lut, row, raw)));

        for (let i = 1; i < lumas.length; i++) {
            assert.ok(
                lumas[i] >= lumas[i - 1] - ROUNDING_TOLERANCE,
                `${id}: luma dropped at byte ${i + 1} (${lumas[i]} < ${lumas[i - 1]})`,
            );
        }
        for (let i = 0; i + WINDOW < lumas.length; i++) {
            assert.ok(
                lumas[i + WINDOW] > lumas[i],
                `${id}: luma did not climb over an ${WINDOW}-byte window starting at byte ${i + 1} ` +
                `(${lumas[i + WINDOW]} <= ${lumas[i]})`,
            );
        }
    }
});

test('hazard row (1) is 5 hard-stepped EAWS classes over the [2,127] severity domain, no rescale', () => {
    const lut = buildLutData();
    const row = rampRow('hazard');
    // Neutral floor: 0 = NODATA, 1 = "simulated, no hazard" -- both
    // transparent, neither reads as a saturated-green "safe" swatch.
    assert.deepEqual(rowRgba(lut, row, 0), [0, 0, 0, 0]);
    assert.deepEqual(rowRgba(lut, row, 1), [0, 0, 0, 0]);
    // bin = floor(((severity-2) / 126) * 5), clamped to [0,4]. EAWS classes
    // only occupy [2,127] -- severity is the raw LUT index directly, no
    // 1..255 domain stretch.
    assert.deepEqual(rowRgba(lut, row, 2), [52, 211, 153, 255]);    // #34d399, low (first real class)
    assert.deepEqual(rowRgba(lut, row, 64), [251, 146, 60, 255]);   // #fb923c, considerable (mid-domain)
    assert.deepEqual(rowRgba(lut, row, 127), [127, 29, 29, 255]);   // #7f1d1d, very high (max severity)
    // Bytes above 127 are unreachable from a 7-bit field; defensively clamp
    // to the top class rather than reading garbage.
    assert.deepEqual(rowRgba(lut, row, 200), [127, 29, 29, 255]);
    assert.deepEqual(rowRgba(lut, row, 255), [127, 29, 29, 255]);
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
    // The legend axis is 0..1 regardless of the underlying 0..127 severity
    // domain, so the CSS/tick shape is unchanged by the domain fix above.
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
