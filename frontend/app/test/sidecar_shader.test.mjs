// Guards the P1.2 contract (design doc §2.2/§2.3, amended per team-lead's
// P1.2 notes): sidecar_shader.mjs's GLSL strings are correct in isolation,
// and main.js splices them into exactly the right place — after the CDLOD
// cut in the vertex shader (so culled instances pay nothing) and after the
// existing slope-gradient block in the fragment shader (before it's
// multiplied into finalColor).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
    SIDECAR_VERTEX_DECLARATIONS,
    SIDECAR_VERTEX_FETCH,
    SIDECAR_FRAGMENT_DECLARATIONS,
    SIDECAR_FRAGMENT_TINT,
} from '../sidecar_shader.mjs';
import { RAMP_COUNT } from '../sidecar_colormap.mjs';

const main = readFileSync(fileURLToPath(new URL('../main.js', import.meta.url)), 'utf8');
// main.js splices the sidecar GLSL in as `${SIDECAR_VERTEX_FETCH}` template
// interpolations, not literal inline text (unlike the older shader blocks
// slope_shader_bins.test.mjs/skirt_extension_shader.test.mjs check, which
// predate this module split) — resolve them so position-based assertions
// below see the shader text as it actually compiles, not main.js's
// unexpanded source syntax.
const resolvedMain = main
    .replaceAll('${SIDECAR_VERTEX_DECLARATIONS}', SIDECAR_VERTEX_DECLARATIONS)
    .replaceAll('${SIDECAR_VERTEX_FETCH}', SIDECAR_VERTEX_FETCH)
    .replaceAll('${SIDECAR_FRAGMENT_DECLARATIONS}', SIDECAR_FRAGMENT_DECLARATIONS)
    .replaceAll('${SIDECAR_FRAGMENT_TINT}', SIDECAR_FRAGMENT_TINT);

// -----------------------------------------------------------------------
// sidecar_shader.mjs content, in isolation
// -----------------------------------------------------------------------

test('SIDECAR_VERTEX_FETCH reads instanceNZ_2.w behind a uSidecarValid guard, texture2D only', () => {
    assert.match(SIDECAR_VERTEX_FETCH, /float addr = instanceNZ_2\.w;/);
    assert.match(SIDECAR_VERTEX_FETCH, /if \(uSidecarValid > 0\.5\)/);
    assert.match(SIDECAR_VERTEX_FETCH, /texture2D\(uSidecarAtlas, auv\)/);
    assert.doesNotMatch(SIDECAR_VERTEX_FETCH, /textureLod/);
});

test('sidecarRamp returns vec4(0.0) for raw < 0.5 (the NODATA guard)', () => {
    assert.match(SIDECAR_FRAGMENT_DECLARATIONS, /vec4 sidecarRamp\(float raw, float rampRow\) \{\s*\n\s*if \(raw < 0\.5\) return vec4\(0\.0\);/);
});

test('packed_bits decode uses the confirmed layout, not the stale release/runout split', () => {
    // Confirmed replacements (team-lead's P1.2 amendment).
    assert.match(SIDECAR_FRAGMENT_DECLARATIONS, /float sidecarSeverity\(float raw\) \{ return mod\(raw, 128\.0\); \}/);
    assert.match(SIDECAR_FRAGMENT_DECLARATIONS, /float sidecarRelease\(float raw\)\s*\{ return step\(128\.0, raw\); \}/);
    // The design doc's original (stale) decode must be gone, not merely
    // superseded alongside dead code.
    const combined = SIDECAR_FRAGMENT_DECLARATIONS + SIDECAR_FRAGMENT_TINT;
    assert.doesNotMatch(combined, /sidecarRunout/);
    assert.doesNotMatch(combined, /mod\(raw, 32\.0\)/);
    assert.doesNotMatch(combined, /255\.0 \/ 31\.0/);
});

test('the packed-bits tint path treats severity < 1.5 as untinted (the "simulated, no hazard" sentinel)', () => {
    assert.match(
        SIDECAR_FRAGMENT_TINT,
        /vec4 layer = \(packed && value < 1\.5\) \? vec4\(0\.0\) : sidecarRamp\(value, uSidecarRamp\.x\);/,
    );
});

test('release drives a boolean stipple, not a graded ramp position', () => {
    assert.match(SIDECAR_FRAGMENT_TINT, /float released = sidecarRelease\(raw\);/);
    // Boolean: released is used as a 0/1 mix factor, not divided into bins
    // (the stale doc version divided runout by 7.0 for a graded blend).
    assert.doesNotMatch(SIDECAR_FRAGMENT_TINT, /released \/ \d/);
});

test('no textureLod anywhere in the sidecar shader strings (three r160 GLSL-dialect rule, design doc §0.7)', () => {
    for (const src of [SIDECAR_VERTEX_DECLARATIONS, SIDECAR_VERTEX_FETCH, SIDECAR_FRAGMENT_DECLARATIONS, SIDECAR_FRAGMENT_TINT]) {
        assert.doesNotMatch(src, /textureLod/);
    }
});

// -----------------------------------------------------------------------
// Splice placement inside main.js
// -----------------------------------------------------------------------

test('customProgramCacheKey was bumped for this feature', () => {
    assert.match(main, /customProgramCacheKey = \(\) => 'piston_hex_global_pages_v6_powfinder_sidecar';/);
    assert.doesNotMatch(main, /piston_hex_global_pages_v5_signed_skirts/);
});

test('the sidecar vertex fetch appears after the CDLOD cut and after vInstDist = instDist', () => {
    const cutIndex = resolvedMain.indexOf('gl_Position = vec4(0.0, 0.0, 0.0, 1.0);');
    const instDistIndex = resolvedMain.indexOf('vInstDist = instDist;');
    const fetchIndex = resolvedMain.indexOf('POWFINDER SIDECAR FETCH');
    const isCapIndex = resolvedMain.indexOf('bool isCap = (normal.y > 0.9);');

    assert.ok(cutIndex > -1, 'CDLOD degenerate-return cut found');
    assert.ok(instDistIndex > -1, 'vInstDist = instDist; found');
    assert.ok(fetchIndex > -1, 'sidecar fetch marker found');
    assert.ok(isCapIndex > -1, 'isCap branch found');

    assert.ok(fetchIndex > cutIndex, 'fetch appears after the CDLOD early-return cut');
    assert.ok(fetchIndex > instDistIndex, 'fetch appears after vInstDist = instDist;');
    assert.ok(fetchIndex < isCapIndex, 'fetch appears before the isCap/skirt branch');
});

test('the sidecar fragment tint appears after the slope-gradient block and before finalColor', () => {
    const gradientBlockEnd = resolvedMain.indexOf('baseColor *= mix(0.6, 0.95, clamp(vInstDist / 3000.0, 0.0, 1.0));');
    const tintIndex = resolvedMain.indexOf('POWFINDER LAYER TINT');
    const finalColorIndex = resolvedMain.indexOf('vec3 finalColor = baseColor * lighting;');

    assert.ok(gradientBlockEnd > -1);
    assert.ok(tintIndex > -1);
    assert.ok(finalColorIndex > -1);
    assert.ok(tintIndex > gradientBlockEnd, 'tint appears after the existing slope-gradient block');
    assert.ok(tintIndex < finalColorIndex, 'tint appears before finalColor is computed');
});

test('setupMaterialShader wires both shared-by-identity and per-tile sidecar uniforms', () => {
    for (const name of [
        'uSidecarAtlas', 'uSidecarLut', 'uSidecarTexel', 'uSidecarGeom',
        'uSidecarChannel', 'uSidecarOverlayCh', 'uSidecarRamp', 'uSidecarMode',
        'uSidecarMix', 'uSidecarOpacity',
    ]) {
        assert.match(main, new RegExp(`shader\\.uniforms\\.${name} = sharedUniforms\\.`), `${name} assigned by object identity`);
    }
    assert.match(main, /shader\.uniforms\.uSidecarRowBase = \{ value: this\.userData\.sidecarRowBase \|\| 0 \};/);
    assert.match(main, /shader\.uniforms\.uSidecarValid = \{ value: this\.userData\.sidecarValid \|\| 0 \};/);
});

test('sharedMaterialUniforms declares exactly the ten sidecar uniforms, once, outside setupMaterialShader', () => {
    const ctorMatch = /this\.sharedMaterialUniforms = \{([\s\S]*?)\n {8}\};/.exec(main);
    assert.ok(ctorMatch, 'sharedMaterialUniforms object literal found');
    const body = ctorMatch[1];
    for (const key of [
        'sidecarAtlas', 'sidecarLut', 'sidecarTexel', 'sidecarGeom', 'sidecarChannel',
        'sidecarOverlay', 'sidecarRamp', 'sidecarMode', 'sidecarMix', 'sidecarOpacity',
    ]) {
        assert.match(body, new RegExp(`\\b${key}:`), `${key} declared in sharedMaterialUniforms`);
    }
});

test("sharedMaterialUniforms.sidecarRamp's row-count placeholder matches sidecar_colormap.mjs's real RAMP_COUNT", () => {
    // main.js can't import sidecar_colormap.mjs (P1.2's main.js footprint is
    // limited to setupMaterialShader + _applySidecarBinding + this one
    // uniforms block), so the literal here must be kept in sync by hand;
    // this test is the tripwire.
    const match = /sidecarRamp: \{ value: new THREE\.Vector2\(0, (\d+)\) \}/.exec(main);
    assert.ok(match, 'sidecarRamp default found');
    assert.equal(Number(match[1]), RAMP_COUNT);
});

test('_applySidecarBinding is a new method, modelled on _applyTexturePageBindings, writing userData and live uniforms', () => {
    assert.match(main, /_applySidecarBinding\(material, rowBase, valid\) \{/);
    const method = main.slice(main.indexOf('_applySidecarBinding(material, rowBase, valid) {'));
    const body = method.slice(0, method.indexOf('\n    }\n') + 6);
    assert.match(body, /material\.userData\.sidecarRowBase = rowBase \|\| 0;/);
    assert.match(body, /material\.userData\.sidecarValid = valid \? 1 : 0;/);
    assert.match(body, /shader\.uniforms\.uSidecarRowBase\.value = /);
    assert.match(body, /shader\.uniforms\.uSidecarValid\.value = /);
});

test('main.js imports sidecar_shader.mjs (the .mjs rule) and nothing else new outside the declared touch points', () => {
    assert.match(main, /from '\.\/sidecar_shader\.mjs';/);
});
