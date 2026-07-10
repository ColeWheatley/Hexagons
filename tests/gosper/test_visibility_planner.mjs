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
const bakedManifest = JSON.parse(await fs.readFile(
    path.join(ROOT, 'frontend/app/tile_manifest.json'),
    'utf8',
));

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
        const cleanSpecifier = specifier.split('?')[0];
        return loadModule(path.resolve(path.dirname(referencing.identifier), cleanSpecifier));
    });
    return module;
}

const plannerModule = await loadModule(path.join(ROOT, 'frontend/app/visibility_planner.js'));
await plannerModule.evaluate();
const adapterModule = await loadModule(path.join(ROOT, 'frontend/app/gosper_visibility_adapter.js'));
await adapterModule.evaluate();
const geometrySelectionModule = await loadModule(
    path.join(ROOT, 'frontend/app/gosper_geometry_selection.js'),
);
await geometrySelectionModule.evaluate();
const verticalBootstrapModule = await loadModule(
    path.join(ROOT, 'frontend/app/vertical_bootstrap.js'),
);
await verticalBootstrapModule.evaluate();

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
const {
    gosperGeometrySelectionNeedsRebuild,
    planGosperGeometrySelection,
} = geometrySelectionModule.namespace;
const {
    computeTerrainAnchorRebase,
    selectManifestFloorBaseline,
} = verticalBootstrapModule.namespace;

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

function boxFrustum(halfX, halfY, halfZ) {
    return new Float64Array([
        1, 0, 0, halfX,
        -1, 0, 0, halfX,
        0, 1, 0, halfY,
        0, -1, 0, halfY,
        0, 0, 1, halfZ,
        0, 0, -1, halfZ,
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

function decodedFixture({ gsp2 = false, gsp3 = false, saturated = false } = {}) {
    const depths = [];
    for (let depth = 0; depth <= 5; depth++) {
        const count = GOSPER_DEPTH_COUNTS[depth];
        const record = {
            h: new Float32Array(count).fill(1000),
            valid: new Uint8Array(count).fill(1),
        };
        if (depth > 0 && depth < 5) {
            if (gsp2 || gsp3) {
                record.downExtent = new Uint16Array(count);
                record.upExtent = new Uint16Array(count);
                record.downExtent.fill(123);
                record.upExtent.fill(456);
                if (gsp3) {
                    record.renderDown = new Uint16Array(count);
                    record.renderUp = new Uint16Array(count);
                    record.renderDown.fill(789);
                    record.renderUp.fill(321);
                }
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
    assert.ok(Math.abs(rootBounds[1] - 387.9) < 1e-9); // hMin - 400m encoded edge cap - 12m shader drop
    assert.ok(Math.abs(rootBounds[4] - 1600.1) < 1e-9); // hMax + 400m encoded edge cap

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

    // GSP1 aggregates did not encode signed skirt endpoints, so migration
    // deliberately uses the loose root interval regardless of relief byte.
    adapter.attachDecodedIsland('0_0', decodedFixture());
    const gsp1Bounds = adapter.writeBounds(adapter.getChild(root, 0));
    assert.ok(Math.abs(gsp1Bounds[1] - 387.9) < 1e-6);
    assert.ok(Math.abs(gsp1Bounds[4] - 1600.1) < 1e-6);

    // Saturation is ambiguous: correctness requires exact-root fallback.
    adapter.attachDecodedIsland('0_0', decodedFixture({ saturated: true }));
    const saturatedBounds = adapter.writeBounds(adapter.getChild(root, 0));
    assert.ok(Math.abs(saturatedBounds[1] - 387.9) < 1e-6);
    assert.ok(Math.abs(saturatedBounds[4] - 1600.1) < 1e-6);

    // GSP2 has terrain extents but not rendered-subtree extents, so it keeps
    // the same deliberately loose root migration bound as GSP1.
    const gsp2Adapter = new GosperVisibilityAdapter({
        manifestTiles: [
            { yq: 0, yr: 0, gspVersion: 2, x: 0, y: 0, hMean: 1000, hMin: 800, hMax: 1200 },
        ],
    });
    gsp2Adapter.attachDecodedIsland('0_0', decodedFixture({ gsp2: true }));
    const gsp2Bounds = gsp2Adapter.writeBounds(gsp2Adapter.getChild(gsp2Adapter.getRootHandle('0_0'), 0));
    assert.ok(Math.abs(gsp2Bounds[1] - 387.9) < 1e-6);
    assert.ok(Math.abs(gsp2Bounds[4] - 1600.1) < 1e-6);

    // GSP3 carries a second, exact rendered-subtree interval. The adapter is
    // blind to how Gosper produced it and consumes it directly as an AABB.
    const gsp3Adapter = new GosperVisibilityAdapter({
        manifestTiles: [
            { yq: 0, yr: 0, gspVersion: 3, x: 0, y: 0, hMean: 1000, hMin: 800, hMax: 1200 },
        ],
    });
    gsp3Adapter.attachDecodedIsland('0_0', decodedFixture({ gsp3: true }));
    const gsp3Bounds = gsp3Adapter.writeBounds(gsp3Adapter.getChild(gsp3Adapter.getRootHandle('0_0'), 0));
    assert.ok(Math.abs(gsp3Bounds[1] - 921.1) < 1e-6); // 1000 - 78.9
    assert.ok(Math.abs(gsp3Bounds[4] - 1032.1) < 1e-6); // 1000 + 32.1

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

function testManifestFloorBootstrap() {
    const nearestFixture = [
        { yq: 0, yr: 0, x: 0, y: 0, lx: 0, lz: 0, hMean: 2422, hMin: 2294, hMax: 3507.6, gspVersion: 3 },
        { yq: 1, yr: 0, x: 3000, y: 0, lx: 3000, lz: 0, hMean: 1800, hMin: 1470, hMax: 2100, gspVersion: 3 },
        { yq: 2, yr: 0, x: 100, y: 0, lx: 100, lz: 0, hMean: 0, hMin: NaN, hMax: 0, gspVersion: 3 },
    ];
    const floor = selectManifestFloorBaseline(nearestFixture, { x: 20, z: 0 });
    assert.equal(floor, 2294); // nearest valid hMin, not the map-wide 1470m minimum
    assert.ok(Number.isNaN(selectManifestFloorBaseline(nearestFixture, null)));

    const origin = {
        x: bakedManifest.bounds.min_x,
        y: bakedManifest.bounds.min_y,
    };
    const runtimeTiles = bakedManifest.tiles.map(tile => ({
        ...tile,
        lx: tile.x - origin.x,
        lz: -(tile.y - origin.y),
    }));
    const restoredTarget = {
        x: 61129.12 - origin.x,
        z: -(206489.89 - origin.y),
    };
    const restoredFloor = selectManifestFloorBaseline(runtimeTiles, restoredTarget);
    assert.equal(restoredFloor, 2294);

    const adapter = new GosperVisibilityAdapter({ manifestTiles: runtimeTiles });
    const capturedMorph = 0.806;
    const capturedVisibleFrustum = new Float64Array([
        -0.875403565694188, -0.41396543841600913, -0.24960210929986784, 6599.776442128146,
        0.90757872563408, -0.41396543841600913, -0.07023868288529254, -8380.61789982392,
        0.09891916099036002, -0.1526519305223247, -0.9833170331570438, -7913.477855342407,
        -0.06269181971364379, -0.779549633807333, 0.6231950771402526, 5908.354916771377,
        -0.03622734127670827, 0.9322015643296795, 0.36012195601673536, 67005.1229385683,
        0.03622734127671623, -0.9322015643296576, -0.36012195601679114, -2015.1229385710315,
    ]);
    adapter.setVerticalTransform({ factor: capturedMorph, floor: 0 });
    const rejected = planHierarchicalVisibility({
        hierarchy: adapter,
        visibleFrustum: capturedVisibleFrustum,
        guardFrustum: capturedVisibleFrustum,
        maxDepth: 0,
    });
    assert.equal(rejected.outside.nodeIds.length, 197);
    assert.equal(rejected.visible.nodeIds.length, 0);

    adapter.setVerticalTransform({ factor: capturedMorph, floor: restoredFloor });
    const admitted = planHierarchicalVisibility({
        hierarchy: adapter,
        visibleFrustum: capturedVisibleFrustum,
        guardFrustum: capturedVisibleFrustum,
        maxDepth: 0,
    });
    assert.equal(admitted.visible.nodeIds.length, 16);
    assert.equal(admitted.outside.nodeIds.length, 181);
    const admittedKeys = Array.from(admitted.visible.nodeIds, handle => (
        adapter.getIslandKey(adapter.getIslandIndex(handle))
    ));
    assert.ok(admittedKeys.includes('278_-236'));
}

function testTerrainAnchorRebase() {
    // Regression fixture from the pitched share-view orbit: the provisional
    // floor starts at 1677.4m with a partial pitch morph, then the settled
    // view discovers a lower 1470.5m floor while the morph reaches 1. The old
    // implementation left controls.target at y=0, so terrain moved hundreds
    // of scene metres above the pivot and both moving/settled frames went
    // black. Camera and pivot now follow the same terrain translation.
    const sourceElevation = 2350;
    const initial = computeTerrainAnchorRebase({
        cameraY: 1042.375,
        targetY: 0,
        sourceElevation,
        floor: 1677.4,
        factor: 0.806,
    });
    assert.ok(Math.abs(initial.terrainY - 542.1156) < 1e-9);
    assert.equal(initial.targetY, initial.terrainY);
    assert.ok(Math.abs(
        (initial.cameraY - initial.targetY) - (1042.375 - 0),
    ) < 1e-9, 'initial anchoring must preserve camera/pivot separation');

    const settled = computeTerrainAnchorRebase({
        cameraY: initial.cameraY,
        targetY: initial.targetY,
        sourceElevation,
        floor: 1470.5,
        factor: 1,
    });
    assert.equal(settled.terrainY, 879.5);
    assert.ok(Math.abs(settled.translationY - 337.3844) < 1e-9);
    assert.ok(Math.abs(
        (settled.cameraY - settled.targetY) - (initial.cameraY - initial.targetY),
    ) < 1e-9, 'floor/pitch rebasing must preserve orbit polar angle and range');

    const flat = computeTerrainAnchorRebase({
        cameraY: settled.cameraY,
        targetY: settled.targetY,
        sourceElevation,
        floor: 1470.5,
        factor: 0,
    });
    assert.equal(flat.targetY, 0);
    assert.ok(Math.abs(
        (flat.cameraY - flat.targetY) - (settled.cameraY - settled.targetY),
    ) < 1e-9, 'flattening must translate, not rotate, the navigation frame');

    assert.throws(() => computeTerrainAnchorRebase({
        cameraY: 1,
        targetY: 0,
        sourceElevation: NaN,
        floor: 0,
        factor: 1,
    }), /sourceElevation must be finite/);
    assert.throws(() => computeTerrainAnchorRebase({
        cameraY: 1,
        targetY: 0,
        sourceElevation: 1,
        floor: 0,
        factor: -1,
    }), /factor must be non-negative/);
}

function testL3GeometryRangeExclusion() {
    const adapter = new GosperVisibilityAdapter({
        manifestTiles: [
            { yq: 0, yr: 0, gspVersion: 2, x: 0, y: 0, hMean: 0, hMin: -10, hMax: 10 },
        ],
    });
    adapter.attachDecodedIsland('0_0', decodedFixture({ gsp2: true }));
    adapter.setVerticalTransform({ factor: 0 });

    const projection = createProjectionContext({
        position: [0, 1000, 0],
        forward: [0, -1, 0],
        verticalFovRadians: Math.PI / 2,
        viewportHeightPx: 1000,
        near: 1,
    });
    // A one-metre-wide vertical sight column through the island centre reaches
    // only central L3 node 0. Every other L3 subtree is outside the guard.
    const sightColumn = boxFrustum(1, 2000, 1);
    const selection = planGosperGeometrySelection({
        adapter,
        rootHandle: adapter.getRootHandle('0_0'),
        visibleFrustum: sightColumn,
        guardFrustum: sightColumn,
        projection,
        detailMarginMeters: 0,
    });

    assert.equal(selection.activeL3Count, 1);
    assert.deepEqual(Array.from(selection.activeL3Ranges), [0, 1]);
    assert.deepEqual(Array.from(selection.outsideL3Ranges), [1, 48]);
    // L3 index 0 owns unit range [0,343). Index 1 would own [343,686), and
    // must not appear at all: no per-unit frustum tests and no outside build.
    assert.deepEqual(Array.from(selection.rangesByDepth[5]), [0, 343]);
    assert.equal(selection.selectedCounts[5], 343);
    assert.equal(selection.selectedCounts[5], 7 ** 3);

    const expanded = {
        ...selection,
        rangesByDepth: selection.rangesByDepth.slice(),
        detailNodeCount: selection.detailNodeCount + 343,
    };
    expanded.rangesByDepth[5] = new Uint32Array([0, 686]);
    assert.equal(gosperGeometrySelectionNeedsRebuild(selection, expanded), true);
    // Shrinking is exact too: retained superseded ranges caused visible
    // intermediate cuts while the final frontier was being rebuilt.
    assert.equal(gosperGeometrySelectionNeedsRebuild(expanded, selection), true);
    assert.equal(gosperGeometrySelectionNeedsRebuild(selection, selection), false);
}

testFrustumMath();
testProjectionMetric();
testPlannerFrontier();
testGosperAdapter();
testManifestFloorBootstrap();
testTerrainAnchorRebase();
testL3GeometryRangeExclusion();
console.log('visibility planner + Gosper adapter: ok');
