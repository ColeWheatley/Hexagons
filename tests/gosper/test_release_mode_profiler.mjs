import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

async function importFrontendModule(filename) {
    const source = fs.readFileSync(path.join(here, '../../frontend/app', filename), 'utf8');
    return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
}

const {
    createProfilerForReleaseMode,
    resolveReleaseMode,
} = await importFrontendModule('release_mode.js');
const {
    BOUNDED_ACTIVE_FRAME_CAPACITY,
    BOUNDED_SAMPLE_CAPACITY,
    PerfProfiler,
} = await importFrontendModule('perf_profiler.js');

const betaDescriptor = {
    schema_version: 1,
    profile: 'beta-stubai',
    mode: 'beta',
    coverage_profile: 'stubai-small-square',
};

const checkedInManifest = JSON.parse(fs.readFileSync(
    path.join(here, '../../frontend/app/tile_manifest.json'),
    'utf8',
));
assert.deepEqual(checkedInManifest.release, betaDescriptor);
const productionDescriptor = {
    schema_version: 1,
    profile: 'production-selected-tirol',
    mode: 'production',
    coverage_profile: 'selected-tirol',
};

const beta = resolveReleaseMode(betaDescriptor);
assert.equal(beta.mode, 'beta');
assert.equal(beta.profiler.mode, 'bounded-recovery');
assert.equal(beta.profiler.enabled, true);

const production = resolveReleaseMode(productionDescriptor);
assert.equal(production.mode, 'production');
assert.deepEqual(production.profiler, { enabled: false, mode: 'off' });

const productionBench = resolveReleaseMode(productionDescriptor, '?bench=1');
assert.deepEqual(productionBench.profiler, { enabled: true, mode: 'full' });
assert.deepEqual(
    resolveReleaseMode(betaDescriptor, '?bench=orbit').profiler,
    { enabled: true, mode: 'full' },
    'existing scripted benchmark URLs retain full-fidelity reporting',
);
assert.throws(
    () => resolveReleaseMode({ ...betaDescriptor, coverage_profile: 'selected-tirol' }),
    /coverage profile/,
    'the named profile, not geography, is the authority',
);

const created = [];
class ProfilerSpy {
    constructor(viewer, options) { created.push({ viewer, options }); }
}
assert.equal(createProfilerForReleaseMode({}, production, ProfilerSpy), undefined);
assert.equal(created.length, 0, 'production creates no profiler, timer, or storage side effect');
createProfilerForReleaseMode({}, beta, ProfilerSpy);
assert.deepEqual(created.pop().options, { mode: 'bounded-recovery' });
createProfilerForReleaseMode({}, productionBench, ProfilerSpy);
assert.deepEqual(created.pop().options, { mode: 'full' });

const originalPerformance = globalThis.performance;
const originalLocalStorage = globalThis.localStorage;
const originalSetInterval = globalThis.setInterval;
const originalClearInterval = globalThis.clearInterval;
let now = 0;
let storageWrites = 0;
Object.defineProperty(globalThis, 'performance', {
    configurable: true,
    value: { now: () => now },
});
Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: () => null, setItem: () => { storageWrites++; } },
});
Object.defineProperty(globalThis, 'setInterval', {
    configurable: true,
    value: () => 1,
});
Object.defineProperty(globalThis, 'clearInterval', {
    configurable: true,
    value: () => {},
});

const bounded = new PerfProfiler({}, { mode: 'bounded-recovery' });
for (let i = 0; i < BOUNDED_ACTIVE_FRAME_CAPACITY + 25; i++) {
    now += 16;
    bounded.frame(now, 'MOVING_2D', true);
}
for (let i = 0; i < BOUNDED_SAMPLE_CAPACITY + 10; i++) {
    now += 1000;
    bounded._sample();
}
const boundedReport = bounded.getReport();
assert.equal(boundedReport.frames.total, BOUNDED_ACTIVE_FRAME_CAPACITY + 25);
assert.equal(
    boundedReport.frames.perState.MOVING_2D.count,
    BOUNDED_ACTIVE_FRAME_CAPACITY + 24,
    'bounded mode keeps constant-memory cumulative frame statistics',
);
assert.equal(boundedReport.samples.length, BOUNDED_SAMPLE_CAPACITY);
assert.equal(boundedReport.meta.profilerMode, 'bounded-recovery');
assert.ok(storageWrites > 0, 'beta keeps bounded crash-recovery persistence');
bounded.dispose();

const full = new PerfProfiler({}, { mode: 'full' });
for (let i = 0; i < BOUNDED_ACTIVE_FRAME_CAPACITY + 25; i++) {
    now += 16;
    full.frame(now, 'MOVING_2D', true);
}
const fullReport = full.getReport();
assert.equal(fullReport.frames.perState.MOVING_2D.count, BOUNDED_ACTIVE_FRAME_CAPACITY + 24);
assert.deepEqual(
    Object.keys(fullReport).sort(),
    ['cache', 'frames', 'memory', 'meta', 'milestones', 'samples', 'textures', 'vram'],
    'full benchmark report retains its established top-level shape',
);
full.dispose();

for (const [name, value] of [
    ['performance', originalPerformance],
    ['localStorage', originalLocalStorage],
    ['setInterval', originalSetInterval],
    ['clearInterval', originalClearInterval],
]) {
    if (value === undefined) delete globalThis[name];
    else Object.defineProperty(globalThis, name, { configurable: true, value });
}

console.log('release mode + profiler policy tests passed');
