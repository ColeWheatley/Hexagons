import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(path.join(here, '../../frontend/app/vram_ledger.js'), 'utf8');
const { VRAMLedger } = await import(
    `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
);

const ledger = new VRAMLedger();
ledger.registerGeometry('shape-a', { geometryBytes: 100, lx: 0, lz: 0 });
ledger.registerGeometry('shape-b', { geometryBytes: 200, lx: 100, lz: 0 });
const pageBounds = { visible: true };
ledger.setTexture('57_201', 'high4096', 1000, {
    kind: 'texture-page', pageX: 57, pageY: 201, lx: 50, lz: 0, bounds: pageBounds,
});
ledger.setTexture('57_201', 'low128', 100, {
    kind: 'texture-page', pageX: 57, pageY: 201, lx: 50, lz: 0, bounds: pageBounds,
});

const frustum = { intersectsBox: bounds => bounds.visible };
const stats = ledger.getSpatialBreakdown(frustum, { x: 0, y: 0, z: 0 }, new Map());
assert.equal(ledger.totalGeometryBytes, 300);
assert.equal(ledger.totalTextureBytes, 1100);
assert.equal(stats.inFrustumBytes, 1400);
assert.equal(stats.texturePageBreakdown.inFrustum, 1, 'tiers share one spatial page identity');
assert.equal(stats.texturePageBreakdown.inFrustumAllocations, 2);
assert.equal(ledger.textureBytesFor('shape-a'), 0, 'shared page must not be charged to a consumer');
ledger.updateTextureLocation('57_201', {
    kind: 'texture-page', pageX: 57, pageY: 201, lx: 6000, lz: 0, bounds: { visible: false },
});
const movedStats = ledger.getSpatialBreakdown(frustum, { x: 0, y: 0, z: 0 }, new Map());
assert.equal(movedStats.outFrustumBytes, 1100);
assert.equal(movedStats.farBytes, 1100);

ledger.deregisterGeometry('shape-a');
assert.equal(ledger.totalTextureBytes, 1100, 'geometry eviction cannot evict a shared texture page');
assert.equal(ledger.textureEntries.size, 2);

console.log('VRAM page ledger tests: ok');
