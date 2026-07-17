import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(path.join(here, '../../frontend/app/texture_page_residency.js'), 'utf8');
const { PAGE_TEXTURE_TIER: TIER, PAGE_TEXTURE_RANK: RANK,
    TIER_STATE, setTierState, selectTextureDispatchTaskIndex, TexturePageResidency } = await import(
    `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

assert.equal(RANK[TIER.BOOTSTRAP], -1);
const residency = new TexturePageResidency({ pages: [{ key: 'visible' }, { key: 'offscreen' }] });
residency.beginDemandPass();
residency.contribute('visible', { classification: 'visible', projectedDiameterPx: 120 });
residency.finishDemandPass();
assert.equal(residency.state('offscreen').classification, 'outside');

const visible = residency.state('visible');
setTierState(visible, TIER.BOOTSTRAP, TIER_STATE.QUEUED);
setTierState(visible, TIER.LOW, TIER_STATE.QUEUED);
const queue = [
    { key: 'visible', tier: TIER.LOW, priority: 2000 },
    { key: 'visible', tier: TIER.BOOTSTRAP, priority: 1 },
];
assert.equal(selectTextureDispatchTaskIndex(queue, residency.states, {
    lowCoverageFirst: true, lowCoverageIncludesOutside: false,
}), 1, 'bootstrap is requested before KTX2 regardless of numeric priority');

// Once bootstrap has left the queue but is still decoding, a KTX2 request for
// the same page must not start and contend with first paint.
setTierState(visible, TIER.BOOTSTRAP, TIER_STATE.LOADING);
assert.equal(selectTextureDispatchTaskIndex([queue[0]], residency.states, {
    lowCoverageFirst: true, lowCoverageIncludesOutside: false,
}), -1, 'KTX2 waits until the page bootstrap reaches a terminal state');

const bootstrap = { texture: { dispose() {} }, bytes: 4096 };
residency.replaceAsset('visible', TIER.BOOTSTRAP, bootstrap);
setTierState(visible, TIER.BOOTSTRAP, TIER_STATE.ABSENT);
assert.equal(selectTextureDispatchTaskIndex([queue[0]], residency.states, {
    lowCoverageFirst: true, lowCoverageIncludesOutside: false,
}), 0, 'KTX2 becomes eligible once bootstrap is resident');
const low = { texture: { dispose() {} }, bytes: 16384 };
residency.replaceAsset('visible', TIER.LOW, low);
let disposed = 0;
assert.equal(residency.dropAsset('visible', TIER.BOOTSTRAP, [TIER.LOW, low], {
    dispose: () => disposed++,
}), true);
assert.equal(disposed, 1);
assert.equal(visible.assets.has(TIER.BOOTSTRAP), false);
assert.equal(residency.bestAsset('visible')[0], TIER.LOW);

// Production demand eviction must be able to fall all the way back to the
// neutral placeholder instead of pinning the active low/bootstrap forever.
residency.state('visible').activeTier = TIER.LOW;
assert.equal(residency.dropAsset('visible', TIER.LOW, null, {
    allowEmpty: true,
    dispose: () => disposed++,
}), true);
assert.equal(residency.state('visible').activeTier, null);

console.log('transient WebP bootstrap ordering and replacement: ok');
