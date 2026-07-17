import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

async function importFrontendModule(relativePath) {
    const source = fs.readFileSync(path.join(here, relativePath), 'utf8');
    return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
}

const { PerfProfiler } = await importFrontendModule('../../frontend/app/perf_profiler.js');

const originalPerformance = globalThis.performance;
const originalLocalStorage = globalThis.localStorage;
let perfNow = 0;
const stored = new Map();

Object.defineProperty(globalThis, 'performance', {
    configurable: true,
    value: { now: () => perfNow },
});
Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
        getItem: key => stored.get(key) || null,
        setItem: (key, value) => { stored.set(key, String(value)); },
    },
});

function exactPercentile(sortedAsc, p) {
    const n = sortedAsc.length;
    const idx = Math.min(n - 1, Math.max(0, Math.floor(p * n)));
    return sortedAsc[idx];
}

function restoreGlobals() {
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
}

try {
    const defaultProfiler = new PerfProfiler({}, { benchMode: false });
    defaultProfiler._lastPersist = Number.POSITIVE_INFINITY;
    defaultProfiler.frame(perfNow, 'MOVING_3D', true);

    const frameCount = 1_000_000;
    const exactDts = new Array(frameCount);
    for (let i = 0; i < frameCount; i++) {
        const dt = 2 + ((i * 37) % 1960) / 20;
        exactDts[i] = dt;
        perfNow += dt;
        defaultProfiler.frame(perfNow, 'MOVING_3D', true);
    }

    for (let i = 0; i < 1000; i++) defaultProfiler._recordSample({ t: i });

    defaultProfiler._persist();
    const persistedDefault = JSON.parse([...stored.values()].at(-1));
    const report = defaultProfiler.getReport();
    defaultProfiler.dispose();

    exactDts.sort((a, b) => a - b);
    assert.equal(defaultProfiler._exactActiveFrames, null);
    assert.equal(defaultProfiler._runningFrameStats.count, frameCount);
    assert.equal(defaultProfiler._runningFrameStats.buckets.length, 201);
    assert.ok(defaultProfiler.samples.length <= 660);
    assert.equal(defaultProfiler.samples[0].t, 0);
    assert.equal(defaultProfiler.samples[59].t, 59);
    assert.equal(defaultProfiler.samples[60].t, 400);
    assert.equal(defaultProfiler.samples.at(-1).t, 999);
    assert.equal(persistedDefault.samples.length, defaultProfiler.samples.length);
    assert.equal(persistedDefault.samples.at(-1).t, 999);

    assert.ok(Math.abs(report.frames.p50_ms - exactPercentile(exactDts, 0.50)) <= 0.5);
    assert.ok(Math.abs(report.frames.p95_ms - exactPercentile(exactDts, 0.95)) <= 0.5);
    assert.equal(report.frames.perState.MOVING_3D.count, frameCount);

    perfNow = 0;
    stored.clear();
    const benchProfiler = new PerfProfiler({}, { benchMode: true });
    benchProfiler._lastPersist = Number.POSITIVE_INFINITY;
    benchProfiler.frame(perfNow, 'MOVING_2D', true);
    for (const dt of [1, 2, 3, 4, 100, 101, 17]) {
        perfNow += dt;
        benchProfiler.frame(perfNow, 'MOVING_2D', true);
    }
    const benchReport = benchProfiler.getReport();
    benchProfiler.dispose();

    assert.equal(benchProfiler._exactActiveFrames.length, 7);
    assert.equal(benchReport.frames.p50_ms, 4);
    assert.equal(benchReport.frames.p95_ms, 101);
    assert.equal(benchReport.frames.p99_ms, 101);
    assert.equal(benchReport.frames.over100, 1);
} finally {
    restoreGlobals();
}

console.log('perf profiler bounds tests passed');
