// Pure-logic tests for the P2.3 time scrubber (design doc §3.3, §6 P2.3).
// DOM behaviour (56px targets, the amber HISTORY border, drag interactions)
// is verified in a real browser via powfinder_scrubber_harness.html — this
// repo has no jsdom, and every other DOM-adjacent module here follows the
// same split (see test/navigation_overlay_dom.test.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';

import {
    epochHourToLocalParts,
    localPartsToEpochHour,
    daysInMonth,
    formatReadout,
    relativeAgeLabel,
    buildStubCoverageFor,
    dayAvailability,
    monthsInCoverage,
    clampToCoverageRange,
    monthChipTarget,
    dayTrackFractionToEpochHour,
    hourTrackFractionToEpochHour,
    stepHour,
    resolveScrubTarget,
    inferLayerStrideHours,
    layerLiveEpochHour,
    createScrubState,
    WEEKDAY_LABELS,
    MONTH_LABELS,
} from '../powfinder_scrubber.mjs';
import { coverageSetBit, bytesToBase64, coverageBitAt } from '../sidecar_format.mjs';

// -----------------------------------------------------------------------
// Test fixtures
// -----------------------------------------------------------------------

/** Build a parseSidecarIndex()-shaped `{ok, coverage, latest}` object
 * directly, without going through parseSidecarIndex/JSON — these tests
 * exercise the scrubber's own logic, not the parser (already covered by
 * sidecar_format.test.mjs). `presentSlots` is a list of hour-offsets from
 * `startEpochHour` that are present. */
function makeIndex({ startEpochHour, count, presentSlots, stepHours = 1 }) {
    const present = new Uint8Array(Math.ceil(count / 8));
    for (const slot of presentSlots) coverageSetBit(present, slot);
    return {
        ok: true,
        latest: new Date((startEpochHour + count - 1) * 3600000).toISOString(),
        coverage: { startEpochHour, stepHours, count, present },
    };
}

/** coverageFor(layerId)'s flat return shape, built directly for tests that
 * don't need a full index (resolveScrubTarget, dayAvailability, stride
 * inference). */
function makeLayerCoverage({ startEpochHour, count, presentSlots, stepHours = 1 }) {
    const present = new Uint8Array(Math.ceil(count / 8));
    for (const slot of presentSlots) coverageSetBit(present, slot);
    return { present, count, startEpochHour, stepHours };
}

function allHoursPresent(count) {
    return Array.from({ length: count }, (_, i) => i);
}

// A realistic beta-season index: 1 Nov 2025 00:00 UTC through 30 Apr 2026
// 23:00 UTC, fully present (hole-punching is exercised separately below).
const SEASON_START = Math.floor(Date.parse('2025-11-01T00:00:00Z') / 3600000);
const SEASON_HOURS = 24 * (30 + 31 + 31 + 28 + 31 + 30); // Nov..Apr, 2026 not a leap year
const seasonIndex = makeIndex({ startEpochHour: SEASON_START, count: SEASON_HOURS, presentSlots: allHoursPresent(SEASON_HOURS) });

// -----------------------------------------------------------------------
// epochHour <-> local calendar round-trips: the real 2026-03-29 transition
// -----------------------------------------------------------------------

// frontend-design's review confirmed exactly one DST transition falls
// inside the Nov-Apr beta season: 2026-03-29 (EU spring-forward). The other
// two nearby transitions (2025-10-26, 2026-10-25) are outside the season.
// "A generic date proves nothing" — this test exercises that specific date.
test('epochHour -> local parts -> epochHour round-trips across the real 2026-03-29 spring-forward (Europe/Vienna)', () => {
    const originalTz = process.env.TZ;
    process.env.TZ = 'Europe/Vienna';
    try {
        const start = Math.floor(Date.parse('2026-03-28T12:00:00Z') / 3600000);
        const end = Math.floor(Date.parse('2026-03-30T12:00:00Z') / 3600000);
        let neverSawHour2 = true;
        for (let eh = start; eh <= end; eh++) {
            const parts = epochHourToLocalParts(eh);
            if (parts.day === 29 && parts.hour === 2) neverSawHour2 = false;
            const back = localPartsToEpochHour(parts);
            assert.equal(back, eh, `round-trip failed at epochHour ${eh} (${JSON.stringify(parts)})`);
        }
        // The whole point of spring-forward: local 02:00-02:59 on 2026-03-29
        // does not exist, so no real epochHour in this window should ever
        // report local hour 2 on day 29.
        assert.ok(neverSawHour2, 'local hour 02:00 on 2026-03-29 should not exist in Europe/Vienna');
    } finally {
        if (originalTz === undefined) delete process.env.TZ; else process.env.TZ = originalTz;
    }
});

test('constructing the nonexistent local 02:00-02:59 on 2026-03-29 does not throw and self-heals to a valid, in-range hour', () => {
    const originalTz = process.env.TZ;
    process.env.TZ = 'Europe/Vienna';
    try {
        for (const hour of [2, 2]) { // both half-hours of the gap collapse to the same integer hour
            const eh = localPartsToEpochHour({ year: 2026, month: 2, day: 29, hour });
            assert.ok(Number.isFinite(eh));
            const back = epochHourToLocalParts(eh);
            // Never actually reports hour===2 back — proves the engine
            // normalized forward across the gap rather than fabricating an
            // instant that doesn't exist.
            assert.notEqual(back.hour, 2);
        }
    } finally {
        if (originalTz === undefined) delete process.env.TZ; else process.env.TZ = originalTz;
    }
});

test('12:00 UTC is 13:00 local before 2026-03-29 and 14:00 local after it — this is correct, not a bug', () => {
    const originalTz = process.env.TZ;
    process.env.TZ = 'Europe/Vienna';
    try {
        const before = Math.floor(Date.parse('2026-03-20T12:00:00Z') / 3600000);
        const after = Math.floor(Date.parse('2026-04-05T12:00:00Z') / 3600000);
        assert.equal(epochHourToLocalParts(before).hour, 13, 'CET is UTC+1');
        assert.equal(epochHourToLocalParts(after).hour, 14, 'CEST is UTC+2');
    } finally {
        if (originalTz === undefined) delete process.env.TZ; else process.env.TZ = originalTz;
    }
});

test('monthChipTarget landing on the 2026-03-29 spring-forward gap still returns a valid, in-range epochHour', () => {
    const originalTz = process.env.TZ;
    process.env.TZ = 'Europe/Vienna';
    try {
        // Currently viewing Jan 29 at 02:00 local; jumping to March lands
        // exactly on the day of the transition at the same (nonexistent)
        // hour. Must not throw, and must self-heal into range.
        const jan29at2 = localPartsToEpochHour({ year: 2026, month: 0, day: 29, hour: 2 });
        const target = monthChipTarget(jan29at2, 2026, 2, seasonIndex); // -> March
        assert.ok(Number.isFinite(target));
        assert.ok(target >= seasonIndex.coverage.startEpochHour);
        assert.ok(target <= seasonIndex.coverage.startEpochHour + seasonIndex.coverage.count - 1);
        assert.equal(epochHourToLocalParts(target).day, 29);
    } finally {
        if (originalTz === undefined) delete process.env.TZ; else process.env.TZ = originalTz;
    }
});

test('epochHour <-> local parts round-trips across plain month/year boundaries (UTC, unrelated to DST)', () => {
    const originalTz = process.env.TZ;
    process.env.TZ = 'UTC';
    try {
        const yearStart = Math.floor(Date.parse('2026-01-01T00:00:00Z') / 3600000);
        const yearEnd = Math.floor(Date.parse('2027-01-01T00:00:00Z') / 3600000);
        for (let eh = yearStart; eh < yearEnd; eh += 3) { // every 3rd hour: full year at pure-function speed
            assert.equal(localPartsToEpochHour(epochHourToLocalParts(eh)), eh);
        }
    } finally {
        if (originalTz === undefined) delete process.env.TZ; else process.env.TZ = originalTz;
    }
});

test('daysInMonth handles 30/31-day months and the Feb non-leap-year case', () => {
    assert.equal(daysInMonth(2026, 0), 31);  // Jan
    assert.equal(daysInMonth(2026, 1), 28);  // Feb, 2026 not a leap year
    assert.equal(daysInMonth(2024, 1), 29);  // Feb, 2024 leap year
    assert.equal(daysInMonth(2026, 3), 30);  // Apr
});

// -----------------------------------------------------------------------
// Formatting
// -----------------------------------------------------------------------

test('formatReadout renders weekday/day/month/hour, an optional approx prefix, and a date-only mode', () => {
    process.env.TZ = 'UTC';
    const eh = Math.floor(Date.parse('2026-02-14T09:00:00Z') / 3600000);
    const readout = formatReadout(eh);
    assert.match(readout, /^Sat 14 Feb\s+09:00$/);
    assert.match(formatReadout(eh, { approx: true }), /^≈ Sat 14 Feb/);
    assert.equal(formatReadout(eh, { dateOnly: true }), 'Sat 14 Feb');
    assert.equal(formatReadout(eh, { approx: true, dateOnly: true }), '≈ Sat 14 Feb');
});

test('relativeAgeLabel buckets hours/days correctly', () => {
    const now = 1000;
    assert.equal(relativeAgeLabel(now, now), 'now');
    assert.equal(relativeAgeLabel(now - 1, now), '1 hour ago');
    assert.equal(relativeAgeLabel(now - 5, now), '5 hours ago');
    assert.equal(relativeAgeLabel(now - 24, now), '1 day ago');
    assert.equal(relativeAgeLabel(now - 24 * 18, now), '18 days ago');
});

test('WEEKDAY_LABELS and MONTH_LABELS are the expected fixed 7/12-entry tables', () => {
    assert.equal(WEEKDAY_LABELS.length, 7);
    assert.equal(MONTH_LABELS.length, 12);
    assert.equal(MONTH_LABELS[1], 'Feb');
});

// -----------------------------------------------------------------------
// Availability rail — must match the bitmask exactly
// -----------------------------------------------------------------------

test('dayAvailability matches the coverage bitmask exactly: fully present, fully absent, and partial days', () => {
    process.env.TZ = 'UTC';
    // 5-day window: day1 fully present, day2 fully absent, day3 present only
    // at hour 03 (still counts as "present" for the whole day per §3.3 point
    // 3 — "any hour"), day4 present at hours 0 and 23 only, day5 fully
    // present. Starts exactly at a local-midnight UTC boundary for a clean
    // day-index mapping.
    const start = Math.floor(Date.parse('2026-02-10T00:00:00Z') / 3600000);
    const count = 24 * 5;
    const present = [];
    for (let h = 0; h < 24; h++) present.push(h);                    // day 1: all 24
    // day 2: none
    present.push(24 * 2 + 3);                                        // day 3: hour 03 only
    present.push(24 * 3 + 0, 24 * 3 + 23);                            // day 4: hours 0 and 23
    for (let h = 0; h < 24; h++) present.push(24 * 4 + h);            // day 5: all 24
    const layerCoverage = makeLayerCoverage({ startEpochHour: start, count, presentSlots: present });

    const days = dayAvailability(2026, 1, layerCoverage); // February 2026, 28 days
    assert.equal(days.length, 28);
    assert.equal(days[9], true);   // Feb 10 = day 1 of window
    assert.equal(days[10], false); // Feb 11 = day 2 of window
    assert.equal(days[11], true);  // Feb 12 = day 3 of window
    assert.equal(days[12], true);  // Feb 13 = day 4 of window
    assert.equal(days[13], true);  // Feb 14 = day 5 of window
    // Everything outside the 5-day window is out of coverage range entirely.
    assert.equal(days[0], false);
    assert.equal(days[27], false);

    // Cross-check bit-for-bit against the raw bitmask via the exact same
    // convention sidecar_format.mjs defines (LSB-first), rather than only
    // trusting dayAvailability's own reasoning.
    for (const slot of present) {
        assert.equal(coverageBitAt(layerCoverage.present, slot), true);
    }
});

test('buildStubCoverageFor scopes the rail to a sparse per-layer override (avalanche: daily, not hourly)', () => {
    process.env.TZ = 'UTC';
    const start = Math.floor(Date.parse('2026-02-10T00:00:00Z') / 3600000);
    const count = 24 * 3;
    const baseIndex = makeIndex({ startEpochHour: start, count, presentSlots: allHoursPresent(count) });

    // avalanche present only at 12:00 UTC each day (real backend shape: daily
    // 12:00 UTC per snow_backend/snowpack/sidecar.py avalanche_slots_from_summary).
    const avalanchePresent = new Uint8Array(Math.ceil(count / 8));
    coverageSetBit(avalanchePresent, 12);       // day 1, 12:00
    coverageSetBit(avalanchePresent, 24 + 12);  // day 2, 12:00
    // day 3 deliberately has no avalanche coverage at all.
    const layersCoverage = { avalanche: { present: bytesToBase64(avalanchePresent), count } };
    const coverageFor = buildStubCoverageFor(baseIndex, layersCoverage);

    const sqhCoverage = coverageFor('sqh');
    assert.equal(sqhCoverage, coverageFor('depth'), 'layers with no override share the same base-coverage reference');

    const avyCoverage = coverageFor('avalanche');
    assert.notEqual(avyCoverage, sqhCoverage);

    const sqhDays = dayAvailability(2026, 1, sqhCoverage);
    const avyDays = dayAvailability(2026, 1, avyCoverage);
    assert.equal(sqhDays[9], true);  // sqh: every hour present -> day present
    assert.equal(avyDays[9], true);  // avalanche: one present hour -> day still counts as present
    assert.equal(avyDays[11], false); // day 3: no avalanche coverage at all
    assert.equal(sqhDays[11], true);  // ...but sqh is unaffected by the avalanche override
});

test('buildStubCoverageFor fails open to the base coverage on a malformed override', () => {
    const baseIndex = makeIndex({ startEpochHour: SEASON_START, count: 24, presentSlots: allHoursPresent(24) });
    const layersCoverage = { avalanche: { present: '***not base64***', count: 24 } };
    const coverageFor = buildStubCoverageFor(baseIndex, layersCoverage);
    assert.equal(coverageFor('avalanche'), coverageFor('sqh'));
});

// -----------------------------------------------------------------------
// Stride inference — hourly vs daily-cadence layers, from the bitmask alone
// -----------------------------------------------------------------------

test('inferLayerStrideHours reads 1 (hourly) for a dense bitmask even with realistic fixture-style holes', () => {
    const count = 240;
    const presentSlots = allHoursPresent(count).filter((slot) => {
        // Two holes mirroring make_sidecar_fixtures.mjs's ~8-11% pattern.
        const inHoleA = slot >= 84 && slot < 103;
        const inHoleB = slot >= 168 && slot < 170;
        return !inHoleA && !inHoleB;
    });
    const layerCoverage = makeLayerCoverage({ startEpochHour: SEASON_START, count, presentSlots });
    assert.equal(inferLayerStrideHours(layerCoverage), 1);
});

test('inferLayerStrideHours reads 24 (daily) for a true once-per-24h bitmask, without special-casing a layer id', () => {
    const count = 240;
    const presentSlots = [];
    for (let day = 0; day * 24 < count; day++) presentSlots.push(day * 24 + 12); // 12:00 daily
    const layerCoverage = makeLayerCoverage({ startEpochHour: SEASON_START, count, presentSlots });
    assert.equal(inferLayerStrideHours(layerCoverage), 24);
});

test('inferLayerStrideHours defaults to 1 (fine control) when a layer has no data at all', () => {
    const layerCoverage = makeLayerCoverage({ startEpochHour: SEASON_START, count: 240, presentSlots: [] });
    assert.equal(inferLayerStrideHours(layerCoverage), 1);
});

// -----------------------------------------------------------------------
// Month chips, day/hour track navigation, coverage clamping
// -----------------------------------------------------------------------

test('monthsInCoverage lists every month in the beta season in order, Nov through Apr', () => {
    const months = monthsInCoverage(seasonIndex);
    assert.deepEqual(
        months.map((m) => m.label),
        ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
    );
    assert.deepEqual(months.map((m) => m.year), [2025, 2025, 2026, 2026, 2026, 2026]);
});

test('monthChipTarget preserves day-of-month and hour, clamping the day into the target month', () => {
    process.env.TZ = 'UTC';
    const jan31 = Math.floor(Date.parse('2026-01-31T09:00:00Z') / 3600000);
    const target = monthChipTarget(jan31, 2026, 1, seasonIndex); // -> February (28 days)
    const parts = epochHourToLocalParts(target);
    assert.equal(parts.month, 1);
    assert.equal(parts.day, 28); // clamped from 31
    assert.equal(parts.hour, 9); // hour preserved
});

test('monthChipTarget clamps into the overall coverage range', () => {
    process.env.TZ = 'UTC';
    const apr30 = Math.floor(Date.parse('2026-04-30T20:00:00Z') / 3600000);
    const target = monthChipTarget(apr30, 2026, 3, seasonIndex);
    assert.ok(target >= seasonIndex.coverage.startEpochHour);
    assert.ok(target <= seasonIndex.coverage.startEpochHour + seasonIndex.coverage.count - 1);
});

test('clampToCoverageRange clamps below start and above end', () => {
    assert.equal(clampToCoverageRange(seasonIndex.coverage.startEpochHour - 100, seasonIndex), seasonIndex.coverage.startEpochHour);
    const maxH = seasonIndex.coverage.startEpochHour + seasonIndex.coverage.count - 1;
    assert.equal(clampToCoverageRange(maxH + 100, seasonIndex), maxH);
});

test('dayTrackFractionToEpochHour maps 0/0.5/1 to the first/mid/last day of the displayed month, holding the hour fixed', () => {
    process.env.TZ = 'UTC';
    const feb = 2026, month = 1; // February, 28 days
    const first = dayTrackFractionToEpochHour(0, feb, month, 9);
    const last = dayTrackFractionToEpochHour(1, feb, month, 9);
    assert.equal(epochHourToLocalParts(first).day, 1);
    assert.equal(epochHourToLocalParts(last).day, 28);
    assert.equal(epochHourToLocalParts(first).hour, 9);
    assert.equal(epochHourToLocalParts(last).hour, 9);
});

test('hourTrackFractionToEpochHour maps 0/1 to hour 00/23 of the same local day', () => {
    process.env.TZ = 'UTC';
    const eh = Math.floor(Date.parse('2026-02-14T09:00:00Z') / 3600000);
    assert.equal(epochHourToLocalParts(hourTrackFractionToEpochHour(0, eh)).hour, 0);
    assert.equal(epochHourToLocalParts(hourTrackFractionToEpochHour(1, eh)).hour, 23);
    assert.equal(epochHourToLocalParts(hourTrackFractionToEpochHour(0, eh)).day, 14);
});

test('stepHour is plain epochHour arithmetic, including across a DST transition (no ambiguity possible)', () => {
    const eh = Math.floor(Date.parse('2026-03-29T00:00:00Z') / 3600000);
    assert.equal(stepHour(eh, 1), eh + 1);
    assert.equal(stepHour(eh, -5), eh - 5);
    assert.equal(stepHour(stepHour(eh, 10), -10), eh);
    assert.equal(stepHour(eh, 24), eh + 24, 'daily-cadence stepping (±1 day) is the same plain arithmetic');
});

// -----------------------------------------------------------------------
// Scrub-target resolution — coverage holes snap to nearest present
// -----------------------------------------------------------------------

test('resolveScrubTarget passes a present hour through unchanged', () => {
    const layerCoverage = makeLayerCoverage({ startEpochHour: 1000, count: 10, presentSlots: allHoursPresent(10) });
    const result = resolveScrubTarget(1003, layerCoverage);
    assert.deepEqual(result, { epochHour: 1003, approx: false });
});

test('resolveScrubTarget snaps an absent hour to the nearest present hour with approx:true', () => {
    const layerCoverage = makeLayerCoverage({ startEpochHour: 1000, count: 10, presentSlots: [0, 9] }); // only the ends present
    const result = resolveScrubTarget(1004, layerCoverage);
    assert.equal(result.approx, true);
    assert.ok(result.epochHour === 1000 || result.epochHour === 1009);
});

test('resolveScrubTarget reports unavailable when a layer has no present hours at all', () => {
    const layerCoverage = makeLayerCoverage({ startEpochHour: 1000, count: 10, presentSlots: [] });
    const result = resolveScrubTarget(1004, layerCoverage);
    assert.equal(result.unavailable, true);
});

test('resolveScrubTarget on a daily-cadence layer snaps an hourly-track guess to the nearest present day (layer-aware, not layer-blind)', () => {
    // The exact bug frontend-design flagged: passing base hourly coverage
    // for a sparse layer would happily "confirm" a present hour that only
    // exists for a different layer. Using the per-layer coverage here must
    // snap to avalanche's own present hour, not the (irrelevant) base grid.
    const count = 240;
    const presentSlots = [];
    for (let day = 0; day * 24 < count; day++) presentSlots.push(day * 24 + 12);
    const avalanche = makeLayerCoverage({ startEpochHour: SEASON_START, count, presentSlots });
    const result = resolveScrubTarget(SEASON_START + 9, avalanche); // day 0, hour 9 -> no avalanche data
    assert.equal(result.approx, true);
    assert.equal(result.epochHour, SEASON_START + 12);
});

// -----------------------------------------------------------------------
// layerLiveEpochHour — the per-layer LIVE anchor (caught in browser
// verification, not in the original review: a daily layer's displayed
// epochHour essentially never equals the raw hourly `latest`, which would
// make HISTORY's amber border misfire on a user correctly viewing the
// newest data that layer has)
// -----------------------------------------------------------------------

test('layerLiveEpochHour differs from the raw global latest for a daily-cadence layer', () => {
    const count = 240;
    const presentSlots = [];
    for (let day = 0; day * 24 < count; day++) presentSlots.push(day * 24 + 12); // 12:00 daily
    const avalanche = makeLayerCoverage({ startEpochHour: SEASON_START, count, presentSlots });

    const rawLatest = SEASON_START + (24 * 9) + 18; // day 9, 18:00 — the hourly grid's latest
    const anchor = layerLiveEpochHour(rawLatest, avalanche);
    assert.notEqual(anchor, rawLatest, 'the raw hourly latest is not itself present for a daily layer');
    assert.equal(anchor, SEASON_START + 24 * 9 + 12, 'anchors to that day\'s 12:00 slot, the nearest the layer actually has');
});

test('layerLiveEpochHour equals the raw global latest for a fully hourly layer', () => {
    const count = 240;
    const hourly = makeLayerCoverage({ startEpochHour: SEASON_START, count, presentSlots: allHoursPresent(count) });
    const rawLatest = SEASON_START + 100;
    assert.equal(layerLiveEpochHour(rawLatest, hourly), rawLatest);
});

// -----------------------------------------------------------------------
// LIVE / HISTORY state machine
// -----------------------------------------------------------------------

test('HISTORY mode is entered by navigating away from the live anchor and exited via goLive', () => {
    const state = createScrubState({ latestEpochHour: 5000 });
    assert.equal(state.mode, 'live');
    assert.equal(state.epochHour, 5000);

    state.goTo(4900);
    assert.equal(state.mode, 'history');
    assert.equal(state.epochHour, 4900);

    state.goLive();
    assert.equal(state.mode, 'live');
    assert.equal(state.epochHour, 5000);
});

test('navigating back to exactly the live anchor re-enters LIVE mode', () => {
    const state = createScrubState({ latestEpochHour: 5000 });
    state.goTo(4900);
    assert.equal(state.mode, 'history');
    state.goTo(5000);
    assert.equal(state.mode, 'live');
});

test('a new latest.json anchor auto-advances the display while LIVE, but not while in HISTORY', () => {
    const live = createScrubState({ latestEpochHour: 5000 });
    live.setLatest(5001);
    assert.equal(live.mode, 'live');
    assert.equal(live.epochHour, 5001, 'LIVE mode must track a new anchor');

    const history = createScrubState({ latestEpochHour: 5000 });
    history.goTo(4900);
    history.setLatest(5001);
    assert.equal(history.mode, 'history', 'a new anchor must not pull the user out of HISTORY');
    assert.equal(history.epochHour, 4900, 'a new anchor must not move the display while in HISTORY');
    assert.equal(history.latest, 5001, 'the anchor itself still updates for relative-age labels and goLive()');
});

test('setExpanded(false) is a no-op in HISTORY mode ("time bar... never collapses")', () => {
    const state = createScrubState({ latestEpochHour: 5000, expanded: true });
    state.goTo(4900); // -> history
    assert.equal(state.expanded, true);
    state.setExpanded(false);
    assert.equal(state.expanded, true, 'HISTORY must not be collapsible');

    state.goLive();
    state.setExpanded(false);
    assert.equal(state.expanded, false, 'LIVE mode may collapse freely');
});

test('toggleExpanded flips state in LIVE and is inert in HISTORY', () => {
    const state = createScrubState({ latestEpochHour: 5000 });
    assert.equal(state.toggleExpanded(), true);
    assert.equal(state.toggleExpanded(), false);
    state.goTo(4900);
    state.setExpanded(true);
    assert.equal(state.toggleExpanded(), true, 'cannot collapse out of HISTORY via toggle either');
});
