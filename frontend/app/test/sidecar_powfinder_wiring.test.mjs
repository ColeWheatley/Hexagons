// Guards P1.3's main.js integration points (design doc §1.7/§6 P1.3):
// atlas creation, uniform wiring, and the two _applySidecarBinding call
// sites in instantiateTile(); the userData carry-through in
// _cloneTileMaterial(); the sidecarMix crossfade in animate(); and the
// hasPendingWork hook in _schedulerHasWork().
//
// This file exists because of a real bug caught only by a live-browser
// check, not by sidecar_atlas.test.mjs's (correct) unit tests: the atlas
// texture was created but never assigned to
// sharedMaterialUniforms.sidecarAtlas.value, so every material's vertex
// fetch sampled the uniform's null default forever — atlas addressing,
// slot assignment and interleave were all individually correct, and the
// tint still never appeared. Text-invariant checks here are cheap
// insurance against that exact class of "both halves are right but never
// connected" bug recurring silently.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const main = readFileSync(fileURLToPath(new URL('../main.js', import.meta.url)), 'utf8');

test('the atlas texture is wired into the shared sidecarAtlas uniform when the atlas is created', () => {
    assert.match(main, /this\.powfinder\.atlas = createSidecarAtlas\(THREE, \{ manifest: this\.manifest \}\);/);
    assert.match(main, /this\.sharedMaterialUniforms\.sidecarAtlas\.value = this\.powfinder\.atlas\.texture;/);
});

test('the LUT texture is built eagerly and wired into the shared sidecarLut uniform in the constructor', () => {
    assert.match(main, /this\.sharedMaterialUniforms\.sidecarLut\.value = createSidecarLut\(THREE\);/);
});

test('instantiateTile applies the sidecar binding to both the per-level clone and the shared material', () => {
    const start = main.indexOf('instantiateTile(task, workerData) {');
    assert.ok(start > -1);
    const body = main.slice(start, main.indexOf('\n    unloadTile(', start) > -1 ? main.indexOf('\n    unloadTile(', start) : start + 8000);
    const calls = body.match(/this\._applySidecarBinding\(/g) || [];
    assert.equal(calls.length, 2, 'expected exactly two _applySidecarBinding calls in instantiateTile (layerMaterial + sharedMaterial)');
    assert.match(body, /this\._applyTexturePageBindings\(layerMaterial, t\.texturePageKeys\);\s*\n\s*this\._applySidecarBinding\(layerMaterial, sidecarRowBase, sidecarValid\);/);
    assert.match(body, /this\._applyTexturePageBindings\(sharedMaterial, t\.texturePageKeys\);\s*\n\s*this\._applySidecarBinding\(sharedMaterial, sidecarRowBase, sidecarValid\);/);
});

test('_cloneTileMaterial carries the sidecar binding through', () => {
    const start = main.indexOf('_cloneTileMaterial(source, lodIdx, pageKeys) {');
    assert.ok(start > -1);
    const body = main.slice(start, main.indexOf('\n    processQueues(', start));
    assert.match(body, /this\._applySidecarBinding\(material, cloneSafeUserData\.sidecarRowBase, cloneSafeUserData\.sidecarValid\);/);
});

test('animate() writes the sidecarMix crossfade uniform', () => {
    assert.match(main, /writeUniformIfChanged\(this\.sharedMaterialUniforms\.sidecarMix, \{/);
});

test('_schedulerHasWork includes powfinder.hasPendingWork', () => {
    const start = main.indexOf('_schedulerHasWork() {');
    assert.ok(start > -1);
    const body = main.slice(start, main.indexOf('\n}', start));
    assert.match(body, /\|\| this\.powfinder\?\.hasPendingWork\(\);/);
});

test('unloadTile documents why nothing releases (static atlas slots)', () => {
    const start = main.indexOf('unloadTile(key) {');
    assert.ok(start > -1);
    const body = main.slice(start, start + 400);
    assert.match(body, /PowFinder/);
});
