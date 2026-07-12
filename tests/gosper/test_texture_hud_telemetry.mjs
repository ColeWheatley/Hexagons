import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(
    path.join(here, '../../frontend/app/texture_hud_telemetry.js'),
    'utf8',
);
const {
    TEXTURE_HUD_ROWS,
    collectDisplayedTexturePages,
    collectTextureTierResidency,
} = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

assert.deepEqual(
    TEXTURE_HUD_ROWS.map(({ tier, size, color }) => ({ tier, size, color })),
    [
        { tier: 'low128', size: 128, color: '#00ff30' },
        { tier: 'medium256', size: 256, color: '#0060ff' },
        { tier: 'high4096', size: 4096, color: '#ff00aa' },
    ],
    'HUD legend colors must exactly match the baked mini-bake tattoos',
);

function material(...bindings) {
    return { userData: { texturePageBindings: bindings } };
}

function binding(key, tier, { valid = true, texture = {} } = {}) {
    return { page: { key }, tier, valid, texture };
}

function tile(groups, textureTier = null) {
    return {
        container: { visible: true },
        mesh: { visible: true, children: groups },
        textureTier,
    };
}

function group(materials, { visible = true, count = 1 } = {}) {
    return {
        visible,
        children: materials.map(value => ({ visible: true, count, material: value, children: [] })),
    };
}

const sharedLow = binding('52_199', 'low128');
const tiles = new Map([
    ['visible-a', tile([group([material(sharedLow, binding('53_199', 'medium256'))])])],
    // The same page on another rendered geometry tile remains one displayed page.
    ['visible-b', tile([group([material(sharedLow, binding('53_200', 'high4096'))])])],
    // Guard geometry is resident, but not displayed in the viewport.
    ['guard', tile([group([material(binding('54_199', 'high4096'))])])],
    // Hidden LOD groups and zero-count draws are not renderer consumers.
    ['hidden-level', tile([group([material(binding('55_199', 'high4096'))], { visible: false })])],
    ['zero-count', tile([group([material(binding('56_199', 'medium256'))], { count: 0 })])],
    // Missing-page/missing-texture bindings cannot contribute a displayed tier.
    ['invalid', tile([group([material(binding('57_199', 'high4096', { valid: false }))])])],
]);
const visibility = new Map([
    ['visible-a', { classification: 'visible' }],
    ['visible-b', { classification: 'visible' }],
    ['guard', { classification: 'guard' }],
    ['hidden-level', { classification: 'visible' }],
    ['zero-count', { classification: 'visible' }],
    ['invalid', { classification: 'visible' }],
]);

const displayed = collectDisplayedTexturePages(tiles, visibility);
assert.deepEqual([...displayed.low128], ['52_199']);
assert.deepEqual([...displayed.medium256], ['53_199']);
assert.deepEqual([...displayed.high4096], ['53_200']);

// Pre-page migration fallback uses the geometry owner as its dedupe identity.
const legacy = collectDisplayedTexturePages(
    new Map([['legacy-tile', tile([group([{ userData: {} }])], 'medium256')]]),
    new Map([['legacy-tile', { classification: 'visible' }]]),
);
assert.deepEqual([...legacy.medium256], ['legacy-tile']);

const states = new Map([
    ['a', {
        assets: new Map([['low128', {}], ['medium256', {}]]),
        queued: new Set(['high4096']),
        loading: new Set(['high4096']), // queued+loading counts this page once
        failed: new Set(),
    }],
    ['b', {
        assets: new Map([['low128', {}]]),
        queued: new Set(['medium256']),
        loading: new Set(),
        failed: new Set(['high4096']),
    }],
]);
const residency = collectTextureTierResidency(states);
assert.deepEqual(residency.loaded, { low128: 2, medium256: 1, high4096: 0 });
assert.deepEqual(residency.pending, { low128: 0, medium256: 1, high4096: 1 });
assert.deepEqual(residency.failed, { low128: 0, medium256: 0, high4096: 1 });

console.log('texture HUD telemetry tests passed');
