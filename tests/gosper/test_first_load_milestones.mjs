import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

async function importFrontendModule(relativePath) {
    const source = fs.readFileSync(path.join(here, relativePath), 'utf8');
    return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
}

const {
    TEXTURE_HUD_ROWS,
    collectDisplayedTexturePages,
    countUnpaintedVisibleTiles,
} = await importFrontendModule('../../frontend/app/texture_hud_telemetry.js');
const {
    PerfProfiler,
} = await importFrontendModule('../../frontend/app/perf_profiler.js');

function binding({ key = '52_199', tier = 'low128', valid = true, texture = {}, available = true, page } = {}) {
    const pageValue = page === undefined ? { key, available } : page;
    return { page: pageValue, tier, valid, texture };
}

function material(bindings) {
    return { userData: { texturePageBindings: bindings } };
}

function tile(materials, { containerVisible = true, meshVisible = true } = {}) {
    return {
        container: { visible: containerVisible },
        mesh: {
            visible: meshVisible,
            children: materials.map(value => ({
                visible: true,
                count: 1,
                material: value,
                children: [],
            })),
        },
    };
}

function visibility(classification = 'visible') {
    return new Map([['tile-a', { classification }]]);
}

function profilerStub() {
    return {
        milestones: {},
        milestone(name) {
            if (this.milestones[name] === undefined) this.milestones[name] = true;
        },
    };
}

function recordTextureMilestones(viewer) {
    const displayed = collectDisplayedTexturePages(viewer.tiles, viewer.visibilityByKey);
    const hasDisplayedPage = TEXTURE_HUD_ROWS.some(({ tier }) => displayed[tier].size > 0);
    if (!viewer._textureMilestonesDone && hasDisplayedPage) {
        viewer.profiler?.milestone('firstTexture');
        const bootGeometryDrained = (
            (viewer.loadQueue?.length ?? 0) === 0 &&
            (viewer.instantiateQueue?.length ?? 0) === 0
        );
        if (bootGeometryDrained && countUnpaintedVisibleTiles(viewer.tiles, viewer.visibilityByKey) === 0) {
            viewer.profiler?.milestone('visibleTexturedCoverage');
        }
        const milestones = viewer.profiler?.milestones || {};
        viewer._textureMilestonesDone = (
            milestones.firstTexture !== undefined &&
            milestones.visibleTexturedCoverage !== undefined
        );
    }
}

function milestoneViewer({ loadQueue = [], instantiateQueue = [], textureQueue = [] } = {}) {
    return {
        tiles: new Map([['tile-a', tile([material([binding()])])]]),
        visibilityByKey: visibility(),
        loadQueue,
        instantiateQueue,
        textureQueue,
        profiler: profilerStub(),
        _textureMilestonesDone: false,
    };
}

assert.equal(
    countUnpaintedVisibleTiles(
        new Map([['tile-a', tile([material([binding(), binding({ key: '52_200', tier: 'medium256' })])])]]),
        visibility(),
    ),
    0,
    'all painted visible tile should not count as unpainted',
);

assert.equal(
    countUnpaintedVisibleTiles(
        new Map([['tile-a', tile([material([binding(), binding({ valid: false })])])]]),
        visibility(),
    ),
    1,
    'one available-but-invalid binding makes the visible tile unpainted',
);

assert.equal(
    countUnpaintedVisibleTiles(
        new Map([['tile-a', tile([material([])])]]),
        visibility(),
    ),
    0,
    'an empty bindings array is not a texture consumer',
);

assert.equal(
    countUnpaintedVisibleTiles(
        new Map([['tile-a', tile([material([binding(), binding({ page: null, valid: false, texture: null })])])]]),
        visibility(),
    ),
    0,
    'null-page binding slots are ignored',
);

assert.equal(
    countUnpaintedVisibleTiles(
        new Map([['tile-a', tile([material([binding({ available: false, valid: false, texture: null })])])]]),
        visibility(),
    ),
    0,
    'all-unavailable binding slots are ignored',
);

assert.equal(
    countUnpaintedVisibleTiles(
        new Map([['tile-a', tile([material([binding({ valid: false, texture: null })])])]]),
        visibility(),
    ),
    1,
    'available page slots without a texture count as unpainted',
);

assert.equal(
    countUnpaintedVisibleTiles(
        new Map([['tile-a', tile([material([binding({ texture: null })])], { containerVisible: false })]]),
        visibility(),
    ),
    0,
    'invisible tile containers are skipped',
);

assert.equal(
    countUnpaintedVisibleTiles(
        new Map([['tile-a', tile([material([binding({ texture: null })])])]]),
        visibility('guard'),
    ),
    0,
    'non-visible classifications are skipped',
);

const queuedLoadViewer = milestoneViewer({ loadQueue: [{}] });
recordTextureMilestones(queuedLoadViewer);
assert.deepEqual(
    queuedLoadViewer.profiler.milestones,
    { firstTexture: true },
    'non-empty loadQueue blocks visibleTexturedCoverage',
);
assert.equal(queuedLoadViewer._textureMilestonesDone, false);

const queuedInstantiateViewer = milestoneViewer({ instantiateQueue: [{}] });
recordTextureMilestones(queuedInstantiateViewer);
assert.deepEqual(
    queuedInstantiateViewer.profiler.milestones,
    { firstTexture: true },
    'non-empty instantiateQueue blocks visibleTexturedCoverage',
);
assert.equal(queuedInstantiateViewer._textureMilestonesDone, false);

const drainedViewer = milestoneViewer({ textureQueue: [{}] });
recordTextureMilestones(drainedViewer);
assert.deepEqual(
    drainedViewer.profiler.milestones,
    { firstTexture: true, visibleTexturedCoverage: true },
    'drained geometry queues and painted visible tiles record TTFTF',
);
assert.equal(drainedViewer._textureMilestonesDone, true);

const originalPerformance = globalThis.performance;
const originalLocalStorage = globalThis.localStorage;
let now = 1000;
const stored = new Map();
Object.defineProperty(globalThis, 'performance', {
    configurable: true,
    value: { now: () => now },
});
Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
        getItem: key => stored.get(key) || null,
        setItem: (key, value) => { stored.set(key, String(value)); },
    },
});

const profiler = new PerfProfiler({});
now = 1123.44;
profiler.milestone('ready');
now = 1999.99;
profiler.milestone('ready');
now = 1240;
profiler.milestone('ttftf');
profiler.milestone('');
const report = profiler.getReport();
profiler.dispose();

assert.equal(profiler.milestones.ready, 123.4);
assert.equal(profiler.milestones.ttftf, 240);
assert.deepEqual(report.milestones, { ready: 123.4, ttftf: 240 });

if (originalPerformance === undefined) {
    delete globalThis.performance;
} else {
    Object.defineProperty(globalThis, 'performance', {
        configurable: true,
        value: originalPerformance,
    });
}
if (originalLocalStorage === undefined) {
    delete globalThis.localStorage;
} else {
    Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: originalLocalStorage,
    });
}

console.log('first-load milestone tests passed');
