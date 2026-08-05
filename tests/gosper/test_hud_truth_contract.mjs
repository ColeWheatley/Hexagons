import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.join(here, '../../frontend/app');
const devDir = path.join(appDir, 'dev');

// The dev/consumer split moved the debug HUD out of index.html and its
// per-frame writers out of main.js. The markup is still literal HTML, just
// housed in a template string in dev/dev_panel.js, so the same contract holds
// over the concatenation of the consumer shell and the dev panel source.
const readAll = dir => fs.readdirSync(dir)
    .filter(name => name.endsWith('.js') || name.endsWith('.mjs'))
    .map(name => fs.readFileSync(path.join(dir, name), 'utf8'));

const devPanel = fs.readFileSync(path.join(devDir, 'dev_panel.js'), 'utf8');
const devTools = fs.readFileSync(path.join(devDir, 'dev_tools.js'), 'utf8');
const html = `${fs.readFileSync(path.join(appDir, 'index.html'), 'utf8')}\n${devPanel}`;
const main = `${fs.readFileSync(path.join(appDir, 'main.js'), 'utf8')}\n${readAll(devDir).join('\n')}`;
const allJs = [...readAll(appDir), ...readAll(devDir)].join('\n');

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
    // getElementById('x') in the consumer shell, querySelector('#x') in the
    // dev panel — either proves the id has a live writer or listener.
    assert.ok(
        main.includes(`'${liveId}'`) || main.includes(`'#${liveId}'`),
        `live HUD id has no writer/listener: ${liveId}`,
    );
}

for (const match of html.matchAll(/<(?:button|input|select)\b[^>]*\bid="([^"]+)"/g)) {
    const id = match[1];
    assert.ok(
        allJs.includes(id),
        `interactive HUD control has no JavaScript reference: ${id}`,
    );
}

// Bounded by the next method rather than by '// LOD Pause Toggle', which the
// dev/consumer split moved *above* this block in main.js.
const gradientStart = main.indexOf('// Gradient Toggle');
assert.ok(gradientStart >= 0, 'main.js must retain the gradient toggle wiring');
const gradientEnd = main.indexOf('\n    applyPublicSettings(', gradientStart);
assert.ok(gradientEnd > gradientStart, 'gradient toggle block must stay bounded');
const gradientHandler = main.slice(gradientStart, gradientEnd);
assert.equal(
    (gradientHandler.match(/this\.needsRender = true;/g) || []).length,
    2,
    'both gradient buttons must schedule an immediate render',
);

// Post-split this is a panel -> DevTools callback rather than an inline
// method, but the guarantee is unchanged: expanding POSITION & DEBUG must
// populate renderer stats without waiting for camera input.
const toggleStart = devTools.indexOf('onSectionToggle:');
assert.ok(toggleStart >= 0, 'dev tools must still handle section toggles');
const toggleHandler = devTools.slice(toggleStart, devTools.indexOf('},', toggleStart));
assert.match(
    toggleHandler,
    /section === 'debug' && expanded\)\s*this\._refreshRendererDebugStats\(\)/,
    'opening the debug section must populate renderer stats without waiting for camera input',
);

const fpsStart = devTools.indexOf('\n    _updateFps(');
assert.ok(fpsStart >= 0, 'dev tools must retain the FPS writer');
const fpsHandler = devTools.slice(fpsStart, devTools.indexOf('\n    _refreshCoreStats()', fpsStart));
// The STATIC check must precede the willRender early-return, or a sparse
// maintenance render reports as active FPS.
const staticIndex = fpsHandler.indexOf("if (viewer.engineState === 'STATIC')");
const willRenderIndex = fpsHandler.indexOf('if (!willRender) return;');
assert.ok(staticIndex >= 0,
    'every STATIC frame, including maintenance renders, must report FPS: IDLE');
assert.ok(willRenderIndex > staticIndex,
    'STATIC maintenance renders must not be reported as active FPS');
assert.match(fpsHandler, /FPS: IDLE/);

console.log('HUD truth contract tests passed');
