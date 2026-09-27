import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../texture_page_residency.js', import.meta.url), 'utf8');
const { forEachTextureConsumer, TexturePageResidency, PAGE_TEXTURE_TIER } =
    await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('replacement and eviction release textures held by hidden consumers before disposal', () => {
    const residency = new TexturePageResidency({ pages: [{ key: 'page' }] });
    residency.attachConsumer('visible', ['page']);
    residency.attachConsumer('hidden', ['page']);
    const state = residency.state('page');
    state.desiredTier = PAGE_TEXTURE_TIER.MEDIUM;
    state.activeTier = PAGE_TEXTURE_TIER.MEDIUM;
    const old = { texture: { id: 'old' } };
    const current = { texture: { id: 'current' } };
    const fallback = { texture: { id: 'fallback' } };
    state.assets.set(PAGE_TEXTURE_TIER.MEDIUM, old);
    state.assets.set(PAGE_TEXTURE_TIER.LOW, fallback);
    const tiles = new Map([
        ['visible', { hidden: false, material: { map: old.texture } }],
        ['hidden', { hidden: true, material: { map: old.texture } }],
    ]);
    const visual = [];
    const rebind = currentState => forEachTextureConsumer(currentState, tiles, (tile, shouldRender) => {
        tile.material.map = residency.bestAsset(currentState)?.[1]?.texture;
        if (shouldRender) visual.push(tile);
    });
    const dispose = asset => {
        for (const tile of tiles.values()) assert.notEqual(tile.material.map, asset.texture);
    };
    residency.replaceAsset('page', PAGE_TEXTURE_TIER.MEDIUM, current, { rebind, dispose });
    assert.equal(tiles.get('hidden').material.map, current.texture);
    residency.dropAsset('page', PAGE_TEXTURE_TIER.MEDIUM,
        [PAGE_TEXTURE_TIER.LOW, fallback], { rebind, dispose });
    assert.equal(tiles.get('hidden').material.map, fallback.texture);
    assert.deepEqual(visual, [tiles.get('visible'), tiles.get('visible')]);
    tiles.get('hidden').hidden = false;
    rebind(state);
    assert.equal(tiles.get('hidden').material.map, fallback.texture);
    assert.equal(visual.at(-1), tiles.get('hidden'));
});
