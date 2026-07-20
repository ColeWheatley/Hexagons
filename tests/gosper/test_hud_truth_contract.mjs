import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.join(here, '../../frontend/app');
const html = fs.readFileSync(path.join(appDir, 'index.html'), 'utf8');
const main = fs.readFileSync(path.join(appDir, 'main.js'), 'utf8');
const allJs = fs.readdirSync(appDir)
    .filter(name => name.endsWith('.js') || name.endsWith('.mjs'))
    .map(name => fs.readFileSync(path.join(appDir, name), 'utf8'))
    .join('\n');

for (const staleClaim of [
    'SULZENAU, TIROL',
    'FLOAT16 (CM)',
    'Utilizing a single GPU Draw Call',
    '1DrawCall / 15k Hexes',
    'Zero DrawCall Overhead',
    '16-Byte "HEX4" Layout',
]) {
    assert.ok(!html.includes(staleClaim), `stale visitor-facing claim remains: ${staleClaim}`);
}

for (const stalePlaceholder of ['>--<', '>-- VISIBLE<', 'Calls: --', 'moving: --',
    'settled: --', 'Waiting for system...', 'Initializing…', 'id="distance-scale-label">—']) {
    assert.ok(!html.includes(stalePlaceholder), `static placeholder remains: ${stalePlaceholder}`);
}

for (const liveWrittenId of [
    'fps-counter', 'hex-count', 'tri-count', 'draw-stats', 'sector-val', 'hex-val',
    'world-val', 'tile-height', 'camera-height', 'near-lod-bands', 'far-lod-bands',
    'moving-lod-summary', 'settled-lod-summary', 'distance-scale-label',
]) {
    const match = html.match(new RegExp(`id="${liveWrittenId}"[^>]*>([\\s\\S]*?)<\\/`));
    assert.ok(match, `live-written HUD field missing: ${liveWrittenId}`);
    assert.equal(match[1].trim(), '', `live-written HUD field must start empty: ${liveWrittenId}`);
}

for (const removedId of [
    'loc-val',
    'bench-loop',
    'bench-tree',
    'bench-hash',
    'touch-controls-toggle',
]) {
    assert.ok(!html.includes(`id="${removedId}"`), `dead HUD id remains: ${removedId}`);
}

for (const liveId of [
    'tri-count',
    'draw-stats',
    'copy-log-btn',
    'near-lod-bands',
    'far-lod-bands',
    'moving-lod-summary',
    'settled-lod-summary',
]) {
    assert.ok(html.includes(`id="${liveId}"`), `live HUD id missing from markup: ${liveId}`);
    assert.ok(main.includes(`'${liveId}'`), `live HUD id has no main.js writer/listener: ${liveId}`);
}

for (const match of html.matchAll(/<(?:button|input|select)\b[^>]*\bid="([^"]+)"/g)) {
    const id = match[1];
    assert.ok(
        allJs.includes(`'${id}'`) || allJs.includes(`"${id}"`),
        `interactive HUD control has no JavaScript reference: ${id}`,
    );
}

const gradientStart = main.indexOf('// Gradient Toggle');
const gradientHandler = main.slice(
    gradientStart,
    main.indexOf('// LOD Pause Toggle', gradientStart),
);
assert.equal(
    (gradientHandler.match(/this\.needsRender = true;/g) || []).length,
    2,
    'both gradient buttons must schedule an immediate render',
);

const collapsibleStart = main.indexOf('\n    initCollapsibleSections() {');
const collapsibleHandler = main.slice(
    collapsibleStart,
    main.indexOf('\n    initLodTruthLabels() {', collapsibleStart),
);
assert.ok(
    collapsibleHandler.includes('this.updateRendererDebugStats();'),
    'opening the debug section must populate renderer stats without waiting for camera input',
);

const fpsStart = main.indexOf('\n    updateFps(');
const fpsHandler = main.slice(fpsStart, main.indexOf('\n    updateFrametimeGraph()', fpsStart));
assert.ok(
    fpsHandler.includes('if (this.engineState === ENGINE_STATES.STATIC)'),
    'every STATIC frame, including maintenance renders, must report FPS: IDLE',
);
assert.ok(
    !fpsHandler.includes('if (!willRender && this.engineState === ENGINE_STATES.STATIC)'),
    'STATIC maintenance renders must not be reported as active FPS',
);

console.log('HUD truth contract tests passed');
