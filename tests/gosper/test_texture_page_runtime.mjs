import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
async function importBrowserModule(filename) {
    const source = fs.readFileSync(path.join(here, '../../frontend/app', filename), 'utf8');
    return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
}
const {
    TexturePageGrid,
    texturePageIndex,
    texturePageKey,
    texturePageUv,
} = await importBrowserModule('texture_page_grid.js');
const {
    PAGE_TEXTURE_TIER,
    TexturePageResidency,
} = await importBrowserModule('texture_page_residency.js');
const { TexturePageVisibilityAdapter } = await importBrowserModule('texture_page_visibility_adapter.js');
const {
    buildTexturePageShaderSwitch,
    MAX_TEXTURE_PAGE_BINDINGS,
} = await importBrowserModule('texture_page_shader.js');
await importBrowserModule('gosper_core.js');
const {
    computeGosperSourceFootprint,
    gosperIslandSourceBounds,
    sourceFootprintFromGeometryContract,
} = await importBrowserModule('gosper_page_binding_adapter.js');

const contract = {
    cache_key: 'pages-test',
    url_template: 'aerial_pages/{tier}/texture_{page_x}_{page_y}.ktx2',
    grid: {
        crs: 'EPSG:31254',
        origin_x: 0,
        origin_y: 0,
        page_size_m: 1024,
        index_rule: 'floor',
    },
    pages: [
        { key: '0_0', page_x: 0, page_y: 0, min_x: 0, min_y: 0, max_x: 1024, max_y: 1024,
            hMin: 100, hMax: 200, renderMin: 80, renderMax: 224,
            urls: { low: 'p00-low.ktx2' } },
        { key: '1_0', page_x: 1, page_y: 0, min_x: 1024, min_y: 0, max_x: 2048, max_y: 1024,
            hMin: 100, hMax: 200, renderMin: 80, renderMax: 224 },
        { key: '0_1', page_x: 0, page_y: 1, min_x: 0, min_y: 1024, max_x: 1024, max_y: 2048,
            hMin: 100, hMax: 200, renderMin: 80, renderMax: 224 },
        { key: '1_1', page_x: 1, page_y: 1, min_x: 1024, min_y: 1024, max_x: 2048, max_y: 2048,
            hMin: 100, hMax: 200, renderMin: 80, renderMax: 224 },
    ],
};

const grid = new TexturePageGrid(contract, { expectedCrs: 'EPSG:31254' });
assert.equal(MAX_TEXTURE_PAGE_BINDINGS, 9);
const shaderSwitch = buildTexturePageShaderSwitch();
assert.equal((shaderSwitch.declarations.match(/uniform sampler2D/g) || []).length, 8);
assert.equal((shaderSwitch.samplingBranches.match(/sampledPage = true/g) || []).length, 9);
assert.equal((shaderSwitch.samplingBranches.match(/textureGrad\(/g) || []).length, 9);
assert.equal((shaderSwitch.samplingBranches.match(/dFdx\(/g) || []).length, 1);
assert.equal((shaderSwitch.samplingBranches.match(/dFdy\(/g) || []).length, 1);
assert.equal((shaderSwitch.samplingBranches.match(/pageGradientDx, pageGradientDy/g) || []).length, 9);
assert.match(shaderSwitch.samplingBranches,
    /vec2 pageGradientUv\s*=\s*sourceXY\s*\/\s*uPageSize\s*;/);
assert.match(shaderSwitch.samplingBranches,
    /vec2 pageGradientDx\s*=\s*dFdx\(pageGradientUv\)\s*;/);
assert.match(shaderSwitch.samplingBranches,
    /vec2 pageGradientDy\s*=\s*dFdy\(pageGradientUv\)\s*;/);
assert.match(shaderSwitch.samplingBranches, /textureGrad\(map,/);
assert.match(shaderSwitch.samplingBranches, /textureGrad\(uPageMap8,/);
for (let slot = 0; slot < MAX_TEXTURE_PAGE_BINDINGS; slot++) {
    const sampler = slot === 0 ? 'map' : `uPageMap${slot}`;
    assert.ok(shaderSwitch.samplingBranches.includes(`textureGrad(${sampler},`),
        `page slot ${slot} must use explicit gradients`);
}
assert.doesNotMatch(shaderSwitch.samplingBranches, /texture2D\s*\(/);
const firstPageBranch = shaderSwitch.samplingBranches.indexOf('if (uPageValid0');
for (const setupToken of ['pageGradientUv', 'dFdx(', 'dFdy(']) {
    const setupIndex = shaderSwitch.samplingBranches.indexOf(setupToken);
    assert.ok(setupIndex >= 0 && setupIndex < firstPageBranch,
        `${setupToken} must be evaluated before divergent page selection`);
}
assert.match(shaderSwitch.samplingBranches,
    /greaterThanEqual\(sourceXY, uPageOrigin0\)[\s\S]*lessThan\(sourceXY, uPageOrigin0 \+ vec2\(uPageSize\)\)/);
assert.match(shaderSwitch.samplingBranches,
    /greaterThanEqual\(sourceXY, uPageOrigin8\)[\s\S]*lessThan\(sourceXY, uPageOrigin8 \+ vec2\(uPageSize\)\)/);
assert.doesNotMatch(shaderSwitch.declarations, /sampler2D\s+\w+\s*\[/);
const onePageShaderSwitch = buildTexturePageShaderSwitch(1);
assert.equal((onePageShaderSwitch.samplingBranches.match(/textureGrad\(/g) || []).length, 1);
assert.match(onePageShaderSwitch.samplingBranches, /textureGrad\(map,/);
assert.doesNotMatch(onePageShaderSwitch.samplingBranches, /uPageMap\d/);
assert.doesNotMatch(onePageShaderSwitch.samplingBranches, /else if/);
assert.throws(
    () => new TexturePageGrid({ ...contract, grid: { ...contract.grid, crs: 'EPSG:3857' } }, {
        expectedCrs: 'EPSG:31254',
    }),
    /CRS must be EPSG:31254/,
);
assert.throws(
    () => new TexturePageGrid({ ...contract, pages: [{ key: '2_2', page_x: 2, page_y: 2 }] }),
    /hMin must be finite/,
);
assert.throws(
    () => new TexturePageGrid({
        ...contract,
        pages: [{
            key: '2_2', page_x: 2, page_y: 2,
            hMin: 100, hMax: 200, renderMin: 110, renderMax: 200,
        }],
    }),
    /must conservatively contain terrain/,
);
assert.equal(texturePageKey(57, 201), '57_201');
assert.equal(texturePageIndex(1023.999, 0, 1024), 0);
assert.equal(texturePageIndex(1024, 0, 1024), 1);
assert.equal(texturePageIndex(-0.001, 0, 1024), -1);

// Half-open exact edges do not spuriously bind a fifth/neighbor page.
assert.deepEqual(
    grid.pagesForBounds({ minX: 0, minY: 0, maxX: 1024, maxY: 1024 }, { maxPages: 4 })
        .map(page => page.key),
    ['0_0'],
);

// A sub-page footprint crossing both axes binds the deterministic four slots.
assert.deepEqual(
    grid.pagesForBounds({ minX: 900, minY: 900, maxX: 1100, maxY: 1100 }, { maxPages: 4 })
        .map(page => page.key),
    ['0_0', '1_0', '0_1', '1_1'],
);
assert.deepEqual(
    grid.pagesForBounds({ minX: 1000, minY: 1000, maxX: 2100, maxY: 2100 }, {
        includeMissing: true,
        maxPages: 9,
    }).map(page => page.key),
    ['0_0', '1_0', '2_0', '0_1', '1_1', '2_1', '0_2', '1_2', '2_2'],
);
assert.throws(
    () => grid.pagesForBounds({ minX: 1000, minY: 1000, maxX: 2100, maxY: 2100 }, {
        maxPages: 4,
    }),
    /intersect 9 texture pages/,
);
assert.equal(grid.pageForPoint(1024, 1024).key, '1_1');
assert.deepEqual(texturePageUv(grid.pageByKey.get('0_0'), 512, 768), [0.5, 0.75]);
assert.deepEqual(texturePageUv(grid.pageByKey.get('1_0'), 1024, 0), [0, 0]);
assert.equal(grid.urlFor('0_0', 'low'), 'p00-low.ktx2');
assert.equal(grid.urlFor('1_1', 'high'), 'aerial_pages/high/texture_1_1.ktx2');
assert.equal(grid.cacheKey, 'pages-test');

const footprint = computeGosperSourceFootprint(globalThis.GosperCore);
assert.ok(footprint.maxOffsetX - footprint.minOffsetX > 1024);
assert.ok(footprint.maxOffsetY - footprint.minOffsetY > 1024);
assert.ok(Math.max(-footprint.minOffsetX, footprint.maxOffsetX) >= 550);
assert.deepEqual(
    gosperIslandSourceBounds(1000, 2000, {
        minOffsetX: -10, minOffsetY: -20, maxOffsetX: 30, maxOffsetY: 40,
    }),
    { minX: 990, minY: 1980, maxX: 1030, maxY: 2040 },
);
const contractedFootprint = sourceFootprintFromGeometryContract({
    tile_source_footprint_half_m: { x: 551, y: 551 },
    footprint_semantics: 'conservative_render_coverage',
}, footprint);
assert.deepEqual(contractedFootprint, {
    minOffsetX: -551, minOffsetY: -551, maxOffsetX: 551, maxOffsetY: 551,
});
assert.throws(() => sourceFootprintFromGeometryContract({
    tile_source_footprint_half_m: { x: 400, y: 400 },
    footprint_semantics: 'conservative_render_coverage',
}, footprint), /does not cover rendered caps/);

const visibility = new TexturePageVisibilityAdapter({
    pages: grid.pages,
    worldOrigin: { x: 100, y: 200 },
});
visibility.setVerticalTransform({ factor: 0.5, floor: 100 });
assert.deepEqual(
    Array.from(visibility.writeBounds(0)),
    [-100, -10, -824, 924, 62, 200],
);
assert.deepEqual(
    Array.from(visibility.writeProjectionSphere(0)),
    [412, 25, -312, Math.hypot(Math.hypot(1024, 1024) * 0.5, 25)],
);
visibility.setVerticalTransform({ factor: 0, floor: 100 });
assert.deepEqual(
    Array.from(visibility.writeProjectionSphere(0)),
    [412, 0, -312, Math.hypot(1024, 1024) * 0.5],
);
visibility.setVerticalTransform({ factor: -0.5, floor: 100 });
assert.deepEqual(
    Array.from(visibility.writeProjectionSphere(0)),
    [412, -25, -312, Math.hypot(Math.hypot(1024, 1024) * 0.5, 25)],
);

const residency = new TexturePageResidency({ pages: grid.pages, mini: true });
residency.attachConsumer('mesh-a', ['0_0', '1_0']);
residency.attachConsumer('mesh-b', ['0_0']);
assert.deepEqual([...residency.state('0_0').consumers].sort(), ['mesh-a', 'mesh-b']);
const sharedTexture = { id: 'one-gpu-object' };
residency.state('0_0').assets.set(PAGE_TEXTURE_TIER.LOW, { texture: sharedTexture });
assert.equal(residency.bestAsset('0_0')[1].texture, sharedTexture);
assert.equal(residency.states.size, 4, 'consumers must not duplicate page cache entries');

// A shared high is rebound for every consumer before its one disposal.
const lifetimeEvents = [];
const highAsset = { texture: { id: 'shared-high' } };
const mediumAsset = { texture: { id: 'shared-medium' } };
const sharedState = residency.state('0_0');
sharedState.assets.set(PAGE_TEXTURE_TIER.MEDIUM, mediumAsset);
sharedState.assets.set(PAGE_TEXTURE_TIER.HIGH, highAsset);
sharedState.activeTier = PAGE_TEXTURE_TIER.HIGH;
assert.equal(residency.dropAsset(
    '0_0',
    PAGE_TEXTURE_TIER.HIGH,
    [PAGE_TEXTURE_TIER.MEDIUM, mediumAsset],
    {
        rebind: state => {
            for (const consumer of state.consumers) lifetimeEvents.push(`rebind:${consumer}`);
            assert.equal(state.assets.has(PAGE_TEXTURE_TIER.HIGH), false);
        },
        dispose: asset => lifetimeEvents.push(`dispose:${asset.texture.id}`),
    },
), true);
assert.deepEqual(lifetimeEvents, [
    'rebind:mesh-a',
    'rebind:mesh-b',
    'dispose:shared-high',
]);

residency.beginDemandPass();
residency.contribute('0_0', { classification: 'visible', projectedDiameterPx: 600, perceptibility: 9 });
residency.finishDemandPass();
assert.equal(residency.state('0_0').desiredTier, PAGE_TEXTURE_TIER.HIGH);
residency.beginDemandPass();
residency.contribute('0_0', { classification: 'visible', projectedDiameterPx: 400, perceptibility: 4 });
residency.finishDemandPass();
assert.equal(residency.state('0_0').desiredTier, PAGE_TEXTURE_TIER.HIGH, 'high hysteresis retains quality');
residency.beginDemandPass();
residency.contribute('0_0', { classification: 'visible', projectedDiameterPx: 300, perceptibility: 3 });
residency.finishDemandPass();
assert.equal(residency.state('0_0').desiredTier, PAGE_TEXTURE_TIER.MEDIUM);
residency.beginDemandPass();
residency.finishDemandPass();
assert.equal(residency.state('0_0').desiredTier, PAGE_TEXTURE_TIER.LOW);

// The generic grid module is an explicit geometry-translation boundary.
for (const genericFilename of [
    'texture_page_grid.js',
    'texture_page_residency.js',
    'texture_page_shader.js',
    'texture_page_visibility_adapter.js',
]) {
    const genericSource = fs.readFileSync(
        path.join(here, '../../frontend/app', genericFilename),
        'utf8',
    );
    assert.equal(/gosper/i.test(genericSource), false, `${genericFilename} leaked geometry vocabulary`);
}

console.log('texture page grid/residency tests: ok');
