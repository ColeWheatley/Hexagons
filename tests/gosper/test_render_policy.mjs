// Deterministic AA-10 policy and static-buffer identity regressions.
// Run with: node --experimental-vm-modules tests/gosper/test_render_policy.mjs

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const filename = path.join(ROOT, 'frontend/app/render_policy.js');
const source = await fs.readFile(filename, 'utf8');
const context = vm.createContext({ URLSearchParams });
const module = new vm.SourceTextModule(source, { context, identifier: filename });
await module.link(() => { throw new Error('render policy must have no imports'); });
await module.evaluate();

const {
    MAX_RENDER_DPR,
    applyRenderResolution,
    cappedRenderDpr,
    createGeometryWithSharedStaticBuffers,
    createSharedLodInstanceAttributes,
    bindSharedLodInstanceAttributes,
    disposeGeometryWithSharedStaticBuffers,
    rendererOptionsForLocation,
    staticBufferSharingStats,
    watchDevicePixelRatio,
} = module.namespace;

assert.equal(MAX_RENDER_DPR, 2);
assert.equal(cappedRenderDpr(3), 2);
assert.equal(cappedRenderDpr(2), 2);
assert.equal(cappedRenderDpr(1.5), 1.5);
assert.equal(cappedRenderDpr(undefined), 1);

assert.deepEqual({ ...rendererOptionsForLocation('') }, { antialias: true, preserveDrawingBuffer: false });
assert.deepEqual({ ...rendererOptionsForLocation('?bench=orbit') }, { antialias: true, preserveDrawingBuffer: true });

const calls = [];
const renderer = {
    setPixelRatio(value) { calls.push(['pixelRatio', value]); },
    setSize(width, height) { calls.push(['size', width, height]); },
};
assert.equal(applyRenderResolution(renderer, { width: 1440, height: 900, devicePixelRatio: 3 }), 2);
assert.deepEqual(calls, [['pixelRatio', 2], ['size', 1440, 900]]);

class FakeBufferGeometry {
    constructor() {
        this.attributes = {};
        this.groups = [];
        this.drawRange = { start: 0, count: Infinity };
        this.index = null;
        this.userData = {};
    }
    setIndex(attribute) { this.index = attribute; return this; }
    setAttribute(name, attribute) { this.attributes[name] = attribute; return this; }
    deleteAttribute(name) { delete this.attributes[name]; return this; }
    dispose() {
        this.disposedAttributes = { ...this.attributes };
        this.disposedIndex = this.index;
    }
}
class FakeInstancedBufferAttribute {
    constructor(array, itemSize) {
        this.array = array;
        this.itemSize = itemSize;
        this.isInstancedBufferAttribute = true;
    }
}
const THREE = { BufferGeometry: FakeBufferGeometry, InstancedBufferAttribute: FakeInstancedBufferAttribute };
const position = { name: 'position' };
const normal = { name: 'normal' };
const sideId = { name: 'aSideId' };
const index = { name: 'index' };
const sourceGeometry = {
    attributes: { position, normal, aSideId: sideId }, index,
    groups: [{ start: 0, count: 6, materialIndex: 0 }],
    drawRange: { start: 0, count: 6 }, boundingBox: { marker: 'box' }, boundingSphere: { marker: 'sphere' },
};
const capA = createGeometryWithSharedStaticBuffers(THREE, sourceGeometry);
const capB = createGeometryWithSharedStaticBuffers(THREE, sourceGeometry);
assert.strictEqual(capA.attributes.position, position);
assert.strictEqual(capB.attributes.position, position);
assert.strictEqual(capA.attributes.aSideId, capB.attributes.aSideId);
assert.strictEqual(capA.index, capB.index);
assert.notStrictEqual(capA.groups, sourceGeometry.groups);

const lodData = {
    matrix: new Float32Array(16), nz1: new Float32Array(4), nz2: new Float32Array(4),
    slopes: new Float32Array(3), deltas: new Float32Array(3), norms: new Float32Array(2),
    parentPos: new Float32Array(2), parentHeight: new Float32Array(1),
};
const shared = createSharedLodInstanceAttributes(THREE, lodData);
const capMesh = { geometry: capA };
const skirtMesh = { geometry: capB };
bindSharedLodInstanceAttributes([capMesh, skirtMesh], shared);
assert.strictEqual(capMesh.instanceMatrix, skirtMesh.instanceMatrix);
assert.strictEqual(capMesh.geometry.attributes.instanceNZ_1, skirtMesh.geometry.attributes.instanceNZ_1);
assert.strictEqual(capMesh.geometry.attributes.aParentHeight, skirtMesh.geometry.attributes.aParentHeight);
assert.deepEqual({ ...staticBufferSharingStats([capMesh, skirtMesh]) }, {
    staticAttributeReferences: 8,
    uniqueStaticAttributes: 4,
    avoidedStaticAttributeUploads: 4,
});
disposeGeometryWithSharedStaticBuffers(capA);
assert.equal(capA.attributes.position, undefined, 'disposing a tile must not evict static position buffers');
assert.strictEqual(capA.attributes.instanceNZ_1, shared.instanceNZ_1, 'per-mesh instance buffers still dispose normally');
assert.equal(capA.index, null, 'disposing a tile must not evict a shared index buffer');
assert.strictEqual(capA.disposedAttributes.instanceNZ_1, shared.instanceNZ_1);

let listener;
let removed = 0;
const fakeWindow = {
    devicePixelRatio: 3,
    matchMedia(query) {
        return {
            query,
            addEventListener(_name, fn) { listener = fn; },
            removeEventListener() { removed++; },
        };
    },
};
const observed = [];
const stopWatching = watchDevicePixelRatio(fakeWindow, value => observed.push(value));
fakeWindow.devicePixelRatio = 1.5;
listener();
assert.deepEqual(observed, [1.5]);
stopWatching();
assert.ok(removed >= 2, 'monitor watcher must re-arm and clean up media listeners');

console.log('render policy tests passed');
