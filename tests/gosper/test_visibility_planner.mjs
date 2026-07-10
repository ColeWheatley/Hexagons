// Focused, browser-free contract tests for visibility_planner.js and the
// Gosper translation adapter.  Node 19 treats .js as CommonJS in this repo,
// so the harness uses SourceTextModule:
//   node --experimental-vm-modules tests/gosper/test_visibility_planner.mjs

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const context = vm.createContext({ console });
const moduleCache = new Map();

async function loadModule(filename) {
    const absolute = path.resolve(filename);
    if (moduleCache.has(absolute)) return moduleCache.get(absolute);
    const source = await fs.readFile(absolute, 'utf8');
    const module = new vm.SourceTextModule(source, {
        context,
        identifier: absolute,
    });
    moduleCache.set(absolute, module);
    await module.link((specifier, referencing) => {
        if (!specifier.startsWith('.')) throw new Error(`unexpected bare import ${specifier}`);
        return loadModule(path.resolve(path.dirname(referencing.identifier), specifier));
    });
    return module;
}

const plannerModule = await loadModule(path.join(ROOT, 'frontend/app/visibility_planner.js'));
await plannerModule.evaluate();
const adapterModule = await loadModule(path.join(ROOT, 'frontend/app/gosper_visibility_adapter.js'));
await adapterModule.evaluate();

const {
    FrustumRelation,
    VisibilityClass,
    classifyAabb,
    createProjectionContext,
    expandFrustumPlanes,
    extractFrustumPlanes,
    planHierarchicalVisibility,
    writeProjectedSphereMetrics,
} = plannerModule.namespace;
const {
    GosperVisibilityAdapter,
    GOSPER_DEPTH_COUNTS,
    GOSPER_NODE_COUNT_PER_ISLAND,
} = adapterModule.namespace;

function cubeFrustum(half) {
    return new Float64Array([
        1, 0, 0, half,
        -1, 0, 0, half,
        0, 1, 0, half,
        0, -1, 0, half,
        0, 0, 1, half,
        0, 0, -1, half,
    ]);
}

function testFrustumMath() {
    const identity = new Float64Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
    ]);
    const extracted = extractFrustumPlanes(identity);
    assert.equal(classifyAabb(extracted, [-0.5, -0.5, -0.5, 0.5, 0.5, 0.5]), FrustumRelation.INSIDE);
    assert.equal(classifyAabb(extracted, [0.5, -0.5, -0.5, 1.5, 0.5, 0.5]), FrustumRelation.INTERSECT);
    assert.equal(classifyAabb(extracted, [2, -0.5, -0.5, 3, 0.5, 0.5]), FrustumRelation.OUTSIDE);

    const base = cubeFrustum(10);
    const movingGuard = expandFrustumPlanes(base, { predictedTranslation: [5, 0, 0] });
    assert.equal(classifyAabb(movingGuard, [12, -1, -1, 14, 1, 1]), FrustumRelation.INSIDE);
    assert.equal(classifyAabb(movingGuard, [-14, -1, -1, -12, 1, 1]), FrustumRelation.OUTSIDE);
    const paddedGuard = expandFrustumPlanes(base, { marginMeters: 3 });
    assert.notEqual(classifyAabb(paddedGuard, [11, -1, -1, 12, 1, 1]), FrustumRelation.OUTSIDE);
}

function testProjectionMetric() {
    const projection = createProjectionContext({
        position: [0, 0, 0],
        forward: [0, 0, -1],
        verticalFovRadians: Math.PI / 2,
        viewportHeightPx: 1000,
        near: 1,
    });
    const metrics = writeProjectedSphereMetrics([0, 0, -100, 10], projection);
    const expected = 10000 / Math.sqrt(9900);
    assert.ok(Math.abs(metrics[0] - expected) < 1e-9);
    assert.equal(metrics[1], 100);
    assert.equal(metrics[2], 100);
    assert.equal(writeProjectedSphereMetrics([0, 0, -1.5, 1], projection)[0], Infinity);
}

function fakeHierarchy(rootBounds, childBounds) {
    return {
        getRoots: () => new Uint32Array([0]),
        getDepth: (node) => node === 0 ? 0 : 1,
        getChildCount: (node) => node === 0 ? childBounds.length : 0,
        getChild: (_node, index) => index + 1,
        writeBounds(node, out) {
            out.set(node === 0 ? rootBounds : childBounds[node - 1]);
        },
        writeProjectionSphere(node, out) {
            const b = node === 0 ? rootBounds : childBounds[node - 1];
            out[0] = (b[0] + b[3]) * 0.5;
            out[1] = (b[1] + b[4]) * 0.5;
            out[2] = (b[2] + b[5]) * 0.5;
            out[3] = Math.hypot(b[3] - b[0], b[4] - b[1], b[5] - b[2]) * 0.5;
        },
    };
}

function testPlannerFrontier() {
    const hierarchy = fakeHierarchy(
        [-25, -2, -2, 25, 2, 2],
        [
            [-8, -1, -1, -2, 1, 1],
            [11, -1, -1, 15, 1, 1],
            [21, -1, -1, 25, 1, 1],
        ],
    );
    const plan = planHierarchicalVisibility({
        hierarchy,
        visibleFrustum: cubeFrustum(10),
        guardFrustum: cubeFrustum(20),
        maxDepth: 1,
    });
    assert.deepEqual(Array.from(plan.visible.nodeIds), [1]);
    assert.deepEqual(Array.from(plan.guard.nodeIds), [2]);
    assert.deepEqual(Array.from(plan.outside.nodeIds), [3]);
    assert.equal(plan.visible.containment[0], FrustumRelation.INSIDE);
    assert.equal(plan.guard.containment[0], FrustumRelation.INSIDE);
    assert.equal(plan.stats.rejectedSubtrees, 1);

    // Once a parent is wholly accepted, descendants inherit that result and
    // incur no additional plane tests even when a detail pass refines them.
    const inherited = planHierarchicalVisibility({
        hierarchy: fakeHierarchy(
            [-9, -2, -2, 9, 2, 2],
            [[-8, -1, -1, -2, 1, 1], [2, -1, -1, 8, 1, 1]],
        ),
        visibleFrustum: cubeFrustum(10),
        guardFrustum: cubeFrustum(20),
        maxDepth: 1,
    });
    assert.deepEqual(Array.from(inherited.visible.nodeIds), [1, 2]);
    assert.equal(inherited.stats.planeTests, 1);
    assert.equal(inherited.stats.inheritedNodes, 2);

    // maxDepth:0 is the intentional cheap residency pass.
    const rootOnly = planHierarchicalVisibility({
        hierarchy,
        visibleFrustum: cubeFrustum(10),
        guardFrustum: cubeFrustum(20),
        maxDepth: 0,
    });
    assert.deepEqual(Array.from(rootOnly.visible.nodeIds), [0]);
    assert.equal(rootOnly.visible.containment[0], FrustumRelation.INTERSECT);
}

function decodedFixture({ gsp2 = false, saturated = false } = {}) {
    const depths = [];
    for (let depth = 0; depth <= 5; depth++) {
        const count = GOSPER_DEPTH_COUNTS[depth];
        const record = {
            h: new Float32Array(count).fill(1000),
            valid: new Uint8Array(count).fill(1),
        };
        if (depth > 0 && depth < 5) {
            if (gsp2) {
                record.downExtent = new Uint16Array(count);
                record.upExtent = new Uint16Array(count);
                record.downExtent.fill(123);
                record.upExtent.fill(456);
            } else {
                record.relief = new Uint8Array(count);
                record.relief.fill(saturated ? 255 : 10);
            }
        }
        depths.push(record);
    }
    return {
        depths,
        unit: {
            d1: new Int16Array(GOSPER_DEPTH_COUNTS[5]),
            d2: new Int16Array(GOSPER_DEPTH_COUNTS[5]),
            d3: new Int16Array(GOSPER_DEPTH_COUNTS[5]),
        },
    };
}

function testGosperAdapter() {
    const adapter = new GosperVisibilityAdapter({
        // Intentionally reversed: canonical numeric lattice ordering must win.
        manifestTiles: [
            { yq: 1, yr: 0, x: 1000, y: 0, hMean: 1000, hMin: 800, hMax: 1200 },
            { yq: 0, yr: 0, x: 0, y: 0, hMean: 1000, hMin: 800, hMax: 1200 },
        ],
    });
    assert.equal(adapter.getIslandKey(0), '0_0');
    assert.equal(adapter.getIslandKey(1), '1_0');
    assert.deepEqual(Array.from(adapter.getRoots()), [0, GOSPER_NODE_COUNT_PER_ISLAND]);

    // The old 490/505 m tile bound did not enclose the 1.15x overscanned L5
    // cap.  The analytic circumradius is ~550.887 m.
    const root = adapter.getRootHandle('0_0');
    const rootBounds = adapter.writeBounds(root);
    assert.ok(adapter.horizontalRadiusByLevel[5] > 550);
    assert.ok(Math.abs(rootBounds[0] + adapter.horizontalRadiusByLevel[5]) < 1e-9);
    assert.ok(Math.abs(rootBounds[3] - adapter.horizontalRadiusByLevel[5]) < 1e-9);
    assert.ok(Math.abs(rootBounds[1] - 575.8) < 1e-9); // mean - total root relief - skirt safety
    assert.ok(Math.abs(rootBounds[4] - 1200.1) < 1e-9);

    const depth1Child2 = adapter.getChild(root, 2);
    const address = adapter.writeNodeAddress(depth1Child2);
    assert.deepEqual(Array.from(address), [0, 1, 2, 4]);
    assert.deepEqual(Array.from(adapter.writeDescendantRange(depth1Child2, 5)), [0, 4802, 2401, 5]);
    const depth2Child = adapter.getChild(depth1Child2, 4);
    assert.deepEqual(Array.from(adapter.writeDescendantRange(depth2Child, 5)), [0, (2 * 7 + 4) * 343, 343, 5]);

    const core = context.GosperCore;
    const offsets = core.offsets(5);
    const unit = 2 * 2401;
    const expectedWorld = core.axialToWorld(offsets[unit * 2], offsets[unit * 2 + 1]);
    const sphere = adapter.writeProjectionSphere(depth1Child2);
    assert.ok(Math.abs(sphere[0] - expectedWorld[0]) < 1e-9);
    assert.ok(Math.abs(sphere[2] + expectedWorld[1]) < 1e-9);

    // GSP1 unsaturated relief is symmetric and conservative.
    adapter.attachDecodedIsland('0_0', decodedFixture());
    const gsp1Bounds = adapter.writeBounds(adapter.getChild(root, 0));
    assert.ok(Math.abs(gsp1Bounds[1] - 933.9) < 1e-6); // 1000 - (10*4 + 2.1) - 24
    assert.ok(Math.abs(gsp1Bounds[4] - 1042.1) < 1e-6);

    // Saturation is ambiguous: correctness requires exact-root fallback.
    adapter.attachDecodedIsland('0_0', decodedFixture({ saturated: true }));
    const saturatedBounds = adapter.writeBounds(adapter.getChild(root, 0));
    assert.ok(Math.abs(saturatedBounds[1] - 575.8) < 1e-6);
    assert.ok(Math.abs(saturatedBounds[4] - 1200.1) < 1e-6);

    // GSP2 asymmetric, ceil-quantized decimetre extents are preferred.
    adapter.attachDecodedIsland('0_0', decodedFixture({ gsp2: true }));
    const gsp2Bounds = adapter.writeBounds(adapter.getChild(root, 0));
    assert.ok(Math.abs(gsp2Bounds[1] - 918.1) < 1e-6); // 1000 - (12.3 + 45.6) - 24
    assert.ok(Math.abs(gsp2Bounds[4] - 1045.6) < 1e-6);

    adapter.setVerticalTransform({ factor: 0, floor: 900, offset: 7 });
    const flatBounds = adapter.writeBounds(root);
    assert.equal(flatBounds[1], 7);
    assert.equal(flatBounds[4], 7);

    const emptyBucket = () => ({
        nodeIds: new Uint32Array(),
        projectedDiameterPx: new Float32Array(),
        distanceMeters: new Float32Array(),
        viewDepthMeters: new Float32Array(),
        containment: new Uint8Array(),
    });
    const visibleBucket = emptyBucket();
    visibleBucket.nodeIds = new Uint32Array([depth1Child2]);
    visibleBucket.projectedDiameterPx = new Float32Array([321]);
    visibleBucket.distanceMeters = new Float32Array([1234]);
    visibleBucket.viewDepthMeters = new Float32Array([1200]);
    visibleBucket.containment = new Uint8Array([FrustumRelation.INSIDE]);
    const summary = adapter.summarizePlanByIsland({
        visible: visibleBucket,
        guard: emptyBucket(),
        outside: emptyBucket(),
    });
    assert.equal(summary.classification[0], VisibilityClass.VISIBLE);
    assert.equal(summary.projectedDiameterPx[0], 321);
    assert.equal(summary.present[0], 1);
    assert.equal(summary.present[1], 0);
}

testFrustumMath();
testProjectionMetric();
testPlannerFrontier();
testGosperAdapter();
console.log('visibility planner + Gosper adapter: ok');
