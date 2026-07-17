import test from 'node:test';
import assert from 'node:assert/strict';
import {
    LOADER_PHASE,
    LOADER_QUIPS,
    LoadingProgressModel,
} from '../loading_screen.mjs';

const fixedRandom = () => 0;

function bootedModel(options = {}) {
    const model = new LoadingProgressModel({ random: fixedRandom, ...options });
    model.start(0);
    return model;
}

test('hero phase holds until the 900ms mark, then flips to progress', () => {
    const model = bootedModel();
    assert.equal(model.phase(0), LOADER_PHASE.HERO);
    assert.equal(model.phase(899), LOADER_PHASE.HERO);
    assert.equal(model.phase(900), LOADER_PHASE.PROGRESS);
    assert.equal(model.phase(60_000), LOADER_PHASE.PROGRESS);
});

test('fraction is zero before anything loads and reaches 1 at completion', () => {
    const model = bootedModel();
    assert.equal(model.fraction(), 0);
    model.manifestLoaded(95_000);
    model.terrainPlanned(2);
    assert.ok(model.fraction() > 0, 'manifest bytes contribute immediately');
    assert.ok(model.fraction() < 1);
    model.terrainDone(300_000);
    model.terrainDone(260_000);
    assert.equal(model.fraction(), 1);
});

test('fraction never decreases when the plan grows after completions', () => {
    const model = bootedModel();
    model.manifestLoaded(95_000);
    model.terrainPlanned(1);
    model.terrainDone(280_000);
    const peak = model.fraction();
    // A late guard-ring tile joins the plan: the raw estimate drops...
    model.terrainPlanned(6);
    assert.equal(model.fraction(), peak);
    // ...and every subsequent completion advances it again.
    let previous = peak;
    for (let i = 0; i < 5; i++) {
        model.terrainDone(280_000);
        const current = model.fraction();
        assert.ok(current >= previous, `fraction regressed: ${previous} -> ${current}`);
        previous = current;
    }
    assert.equal(model.fraction(), 1);
});

test('fraction never decreases when measured averages shrink the estimate', () => {
    const model = bootedModel();
    model.manifestLoaded(95_000);
    model.texturePlanned(10, 'bootstrap32');
    model.texturePlanned(2, 'high4096');
    // First high arrives far smaller than the seed average: pending estimate
    // shrinks, which could move the raw fraction either way — never down.
    model.textureDone(2_000, 'bootstrap32');
    const before = model.fraction();
    model.textureDone(50_000, 'high4096');
    assert.ok(model.fraction() >= before);
});

test('planned counts are max-seen, and texture classes split by tier', () => {
    const model = bootedModel();
    model.terrainPlanned(5);
    model.terrainPlanned(3); // stale, lower snapshot must not shrink the plan
    assert.equal(model.classes.terrain.planned, 5);
    model.texturePlanned(4, 'bootstrap32');
    model.texturePlanned(4, 'medium256');
    assert.equal(model.classes.bootstrap.planned, 4);
    assert.equal(model.classes.ktx2.planned, 4);
    assert.deepEqual(model.textureCounts(), { planned: 8, done: 0 });
});

test('bar stays indeterminate until the manifest and a plan exist', () => {
    const model = bootedModel();
    assert.equal(model.determinate(), false);
    model.manifestLoaded(95_000);
    assert.equal(model.determinate(), false);
    model.terrainPlanned(1);
    assert.equal(model.determinate(), true);
});

test('phase lines tell the truth in priority order', () => {
    const model = bootedModel();
    assert.equal(model.phaseLine(1000), 'Reading the map index…');
    model.manifestLoaded(95_000);
    assert.equal(model.phaseLine(1000), 'Carving terrain islands…');
    model.terrainPlanned(2);
    model.terrainDone(1_000);
    model.terrainDone(1_000);
    model.texturePlanned(3, 'bootstrap32');
    assert.equal(model.phaseLine(1000), 'Painting aerial photos…');
    model.textureDone(100, 'bootstrap32');
    model.textureDone(100, 'bootstrap32');
    model.textureDone(100, 'bootstrap32');
    assert.equal(model.phaseLine(1000), 'First ridge almost up…');
});

test('retry countdown overrides the phase line and clears on completion', () => {
    const model = bootedModel();
    model.manifestLoaded(95_000);
    model.retryScheduled({ kind: 'tile', attempt: 2, maxAttempts: 3, delayMs: 4000 }, 1000);
    assert.equal(model.phaseLine(1000), 'Signal hiccup — trying again in 4s…');
    assert.equal(model.phaseLine(4500), 'Signal hiccup — trying again in 1s…');
    assert.equal(model.phaseLine(5001), 'Carving terrain islands…');
    model.retryScheduled({ kind: 'tile', attempt: 3, maxAttempts: 3, delayMs: 9000 }, 6000);
    model.terrainPlanned(2);
    model.terrainDone(280_000);
    assert.equal(model.phaseLine(6000), 'Carving terrain islands…');
});

test('offline state wins over every other phase line', () => {
    const model = bootedModel();
    model.setOffline(true);
    assert.equal(model.phaseLine(1000), 'Waiting for a connection…');
    model.setOffline(false);
    assert.equal(model.phaseLine(1000), 'Reading the map index…');
});

test('fatal overrides phases and carries title, message, detail', () => {
    const model = bootedModel();
    model.fatal({ title: 'Could not load the terrain manifest.', message: 'Retry.', detail: 'HTTP 404' });
    assert.equal(model.phase(0), LOADER_PHASE.FATAL);
    assert.equal(model.phase(5000), LOADER_PHASE.FATAL);
    const view = model.tick(5000);
    assert.equal(view.fatalTitle, 'Could not load the terrain manifest.');
    assert.equal(view.fatalMessage, 'Retry.');
    assert.equal(view.fatalDetail, 'HTTP 404');
    model.start(6000); // user retry resets to a fresh hero
    assert.equal(model.phase(6000), LOADER_PHASE.HERO);
    assert.equal(model.fraction(), 0);
});

test('hidden wins over fatal and progress', () => {
    const model = bootedModel();
    model.hide();
    assert.equal(model.phase(5000), LOADER_PHASE.HIDDEN);
    model.fatal({ title: 'x', message: 'y' });
    assert.equal(model.phase(5000), LOADER_PHASE.HIDDEN);
});

test('manifest-only window does not pin the high-water mark', () => {
    const model = bootedModel();
    model.manifestLoaded(103_979);
    // No plan yet: the manifest is the only known work, so the raw ratio is
    // 1.0 by construction. The bar is indeterminate here — this must not
    // stick, or the determinate bar would open at 100% (the live-boot bug).
    model.fraction();
    model.terrainPlanned(23);
    const opening = model.fraction();
    assert.ok(opening < 0.2, `bar should open low once the plan exists, got ${opening}`);
    model.terrainDone(280_000);
    assert.ok(model.fraction() >= opening);
});

test('counter line lists real counts and measured megabytes', () => {
    const model = bootedModel();
    model.manifestLoaded(95_000);
    model.terrainPlanned(23);
    model.terrainDone(280_000);
    model.texturePlanned(41, 'bootstrap32');
    model.textureDone(3_000, 'bootstrap32');
    assert.equal(model.counterLine(), 'terrain 1/23 · textures 1/41 · 0.4 MB');
});

test('quips rotate on the interval without repeating consecutively', () => {
    const model = bootedModel({ quips: LOADER_QUIPS, quipIntervalMs: 100 });
    let previous = model.quip(0);
    for (let i = 1; i < LOADER_QUIPS.length * 2; i++) {
        const current = model.quip(i * 100);
        assert.notEqual(current, previous);
        previous = current;
    }
});

test('tick view is internally consistent across the whole boot', () => {
    const model = bootedModel();
    const v0 = model.tick(0);
    assert.equal(v0.phase, LOADER_PHASE.HERO);
    assert.equal(v0.determinate, false);
    model.manifestLoaded(95_000);
    model.terrainPlanned(2);
    model.terrainDone(280_000);
    const v1 = model.tick(1000);
    assert.equal(v1.phase, LOADER_PHASE.PROGRESS);
    assert.equal(v1.determinate, true);
    assert.ok(v1.pct > 0 && v1.pct < 100);
    assert.match(v1.counterLine, /terrain 1\/2/);
});
