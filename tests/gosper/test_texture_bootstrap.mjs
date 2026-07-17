import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(path.join(here, '../../frontend/app/texture_page_residency.js'), 'utf8');
const { PAGE_TEXTURE_TIER: TIER, PAGE_TEXTURE_RANK: RANK,
    selectTextureDispatchTaskIndex, TexturePageResidency } = await import(
    `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

assert.equal(RANK[TIER.BOOTSTRAP], -1);
const residency = new TexturePageResidency({ pages: [{ key: 'visible' }, { key: 'offscreen' }] });
residency.beginDemandPass();
residency.contribute('visible', { classification: 'visible', projectedDiameterPx: 120 });
residency.finishDemandPass();
assert.equal(residency.state('offscreen').classification, 'outside');

const visible = residency.state('visible');
visible.queued.add(TIER.BOOTSTRAP);
visible.queued.add(TIER.LOW);
const queue = [
    { key: 'visible', tier: TIER.LOW, priority: 2000 },
    { key: 'visible', tier: TIER.BOOTSTRAP, priority: 1 },
];
assert.equal(selectTextureDispatchTaskIndex(queue, residency.states, {
    lowCoverageFirst: true, lowCoverageIncludesOutside: false,
}), 1, 'bootstrap is requested before KTX2 regardless of numeric priority');

const bootstrap = { texture: { dispose() {} }, bytes: 4096 };
residency.replaceAsset('visible', TIER.BOOTSTRAP, bootstrap);
visible.queued.delete(TIER.BOOTSTRAP);
const low = { texture: { dispose() {} }, bytes: 16384 };
residency.replaceAsset('visible', TIER.LOW, low);
let disposed = 0;
assert.equal(residency.dropAsset('visible', TIER.BOOTSTRAP, [TIER.LOW, low], {
    dispose: () => disposed++,
}), true);
assert.equal(disposed, 1);
assert.equal(visible.assets.has(TIER.BOOTSTRAP), false);
assert.equal(residency.bestAsset('visible')[0], TIER.LOW);

console.log('transient WebP bootstrap ordering and replacement: ok');
