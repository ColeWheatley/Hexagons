// PowFinder time scrubber (design doc §3.3, task P2.3): month chips, day
// track + availability rail, hour track + ±1h steppers, LIVE/HISTORY mode.
//
// Architecture: the file is split into a DOM-free pure-logic half (epochHour
// <-> local-calendar conversion, coverage-rail computation, LIVE/HISTORY
// state machine, scrub-target resolution) and a DOM-touching half
// (`createPowFinderScrubber`) that builds real elements and wires pointer/
// touch/keyboard events. `node --test` exercises only the pure half directly
// — no jsdom in this repo (see test/navigation_overlay_dom.test.mjs's
// string-assertion pattern), so DOM behaviour is verified in a real browser
// instead (see powfinder_scrubber_harness.html).
//
// Time model: `epochHour` (hours since Unix epoch, UTC) is the one canonical
// index everywhere else in this app — sidecar_format.mjs's epochHourToUrl,
// the coverage bitmask, sidecar URLs. It stays canonical here too, and every
// *navigation* action (steppers, day-track drag, hour-track drag) is pure
// arithmetic on that integer, never a round-trip through local calendar
// fields — so DST cannot corrupt scrubbing. The one exception is the
// *display* layer (readout text, day track for "this month", month chips'
// "same day-of-month" jump): a ski app for people standing in the Stubai
// should show local wall-clock time, not UTC, so those specific functions
// convert epochHour -> local calendar fields (and, for month chips only,
// back) using the runtime's local timezone.
//
// NOTE for future readers: 12:00 UTC displays as 13:00 local before
// 2026-03-29 (CET, UTC+1) and 14:00 local after it (CEST, UTC+2, the one EU
// DST transition inside the Nov-Apr beta season). That is correct — do not
// "fix" it into a fixed UTC+1 offset or into raw UTC.
//
// Per-layer coverage: frontend-design's ruling (P2.3 review) is that this
// module must NOT decode `index.json`'s `layers_coverage` itself — that
// belongs in sidecar_format.mjs, which already owns the base64 decode,
// length validation, and truncation warning for the base bitmask, and
// duplicating that here is two places to get it wrong. Instead this module
// takes a `coverageFor(layerId) -> {present, count, startEpochHour,
// stepHours}` accessor via dependency injection (config.coverageFor).
// `parseSidecarIndex()` is growing this accessor (P0.1 follow-up, fe-p01 on
// pf/p21); `buildStubCoverageFor` below is a drop-in stand-in with the exact
// same shape so this module needs zero changes when the real one lands —
// only the caller's one line of wiring changes.
import {
    coverageHas,
    nearestPresentHour,
    coverageBitAt,
    base64ToBytes,
} from './sidecar_format.mjs';

// -----------------------------------------------------------------------
// Pure: epochHour <-> local calendar fields
// -----------------------------------------------------------------------

const MS_PER_HOUR = 3600000;
export const WEEKDAY_LABELS = Object.freeze(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
export const MONTH_LABELS = Object.freeze(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']);

/** epochHour -> the local calendar fields a human reads. Well-defined for
 * every integer epochHour, DST or not — an instant in time always resolves
 * to exactly one local representation. */
export function epochHourToLocalParts(epochHour) {
    const d = new Date(epochHour * MS_PER_HOUR);
    return {
        year: d.getFullYear(),
        month: d.getMonth(),   // 0-11
        day: d.getDate(),      // 1-31
        hour: d.getHours(),    // 0-23
        weekday: d.getDay(),   // 0-6, Sun=0
    };
}

/**
 * Local calendar fields -> epochHour. Used only where the UI genuinely needs
 * to construct a target from calendar fields (month-chip "same day, new
 * month" jump; day-track drag, which picks a day-of-month within the
 * currently displayed month). NOT used for simple ±N stepping — that's
 * plain epochHour arithmetic (see stepHour) specifically so it never touches
 * this function's one irreducible edge case: on a spring-forward DST day
 * (2026-03-29 in this app's season — see module header), the local hour
 * 02:00-02:59 does not exist. `new Date(y,m,d,2,*)` does not throw; per
 * ECMA-262 it normalizes to a real instant (in practice, the engine's
 * timezone database resolves it as if the pre-transition offset applied,
 * landing one hour into the *next* valid local time — i.e. what a caller
 * asked for as "02:30" comes back as the real instant later shown as
 * "03:30"). Callers must not assume the requested hour is what they get:
 * always run the result back through epochHourToLocalParts (or, for a user
 * navigation target, through resolveScrubTarget's coverage check) rather
 * than trusting the input fields. monthChipTarget does exactly this and is
 * "self-healing" for free — it never needs to detect the gap explicitly.
 */
export function localPartsToEpochHour({ year, month, day, hour }) {
    const d = new Date(year, month, day, hour, 0, 0, 0);
    return Math.floor(d.getTime() / MS_PER_HOUR);
}

export function daysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

/** "Sat 14 Feb 09:00" (or "Sat 14 Feb" with `dateOnly: true`, for a
 * daily-cadence layer — see inferLayerStrideHours), optionally "≈ "-prefixed
 * (design doc §5.6 point 6: a scrub target snapped to the nearest present
 * hour must say so). */
export function formatReadout(epochHour, { approx = false, dateOnly = false } = {}) {
    const p = epochHourToLocalParts(epochHour);
    const prefix = approx ? '≈ ' : '';
    const dateStr = `${WEEKDAY_LABELS[p.weekday]} ${String(p.day).padStart(2, '0')} ${MONTH_LABELS[p.month]}`;
    if (dateOnly) return `${prefix}${dateStr}`;
    return `${prefix}${dateStr}  ${String(p.hour).padStart(2, '0')}:00`;
}

/** "18 days ago" / "3 hours ago" / "now" — HISTORY mode's relative-age label
 * (design doc §3.3 live/retrospective table). `nowEpochHour` is caller-
 * supplied (not Date.now() internally) so this stays pure and testable. */
export function relativeAgeLabel(epochHour, nowEpochHour) {
    const diffHours = nowEpochHour - epochHour;
    if (diffHours <= 0) return 'now';
    if (diffHours < 24) return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    const days = Math.floor(diffHours / 24);
    return days === 1 ? '1 day ago' : `${days} days ago`;
}

// -----------------------------------------------------------------------
// Pure: coverage — per-layer rail data via the injected coverageFor()
// -----------------------------------------------------------------------

/**
 * Reference stub for the `coverageFor(layerId)` accessor described in the
 * module header. Returns `{present: Uint8Array, count, startEpochHour,
 * stepHours}` for `layerId`, falling back to the base hourly coverage when
 * `layersCoverage` (the raw `index.json` `layers_coverage` field) has no
 * entry for it. Delete this once `parseSidecarIndex()` grows the real
 * accessor and pass that in instead — no other change needed here.
 *
 * @param {object} index            parseSidecarIndex() result (base coverage)
 * @param {object} [layersCoverage] raw index.json `layers_coverage`, e.g.
 *   `{avalanche: {present: "<base64>", count: N}}`
 */
export function buildStubCoverageFor(index, layersCoverage) {
    const base = {
        present: index.coverage.present,
        count: index.coverage.count,
        startEpochHour: index.coverage.startEpochHour,
        stepHours: index.coverage.stepHours,
    };
    return function coverageFor(layerId) {
        const override = layersCoverage?.[layerId];
        if (!override) return base;
        let present;
        try {
            present = base64ToBytes(override.present);
        } catch {
            return base; // malformed override: fail open to the base hourly grid
        }
        return {
            present,
            count: Number(override.count) || base.count,
            startEpochHour: base.startEpochHour,
            stepHours: base.stepHours,
        };
    };
}

/** Adapts a flat `{present, count, startEpochHour, stepHours}` (coverageFor's
 * return shape) into the `{ok, coverage}` shape coverageHas/nearestPresentHour
 * (sidecar_format.mjs) expect, so this module never re-implements their bit
 * logic. */
function asIndexLike(layerCoverage) {
    return { ok: true, coverage: layerCoverage };
}

/**
 * One boolean per calendar day of `(year, month)` in the *displayed* local
 * calendar: true if any hour of that local day has coverage. This is the
 * availability rail's data (design doc §3.3 point 3: "pink where
 * coverage.present has any hour for that day, dark where it does not").
 * O(31*24) coverageHas calls — cheap; this runs on month-chip taps and
 * initial render, not per frame.
 *
 * @param {{present: Uint8Array, count: number, startEpochHour: number, stepHours: number}} layerCoverage
 *   coverageFor(layerId)'s return — already scoped to the active layer.
 */
export function dayAvailability(year, month, layerCoverage) {
    const indexLike = asIndexLike(layerCoverage);
    const nDays = daysInMonth(year, month);
    const days = new Array(nDays).fill(false);
    for (let day = 1; day <= nDays; day++) {
        let any = false;
        for (let hour = 0; hour < 24; hour++) {
            if (coverageHas(indexLike, localPartsToEpochHour({ year, month, day, hour }))) {
                any = true;
                break;
            }
        }
        days[day - 1] = any;
    }
    return days;
}

/** Every (year, month) touched by the index's overall coverage range, in
 * order — the month-chip row's data source (design doc: "NOV DEC JAN FEB MAR
 * APR", derived from actual coverage rather than hardcoded to 6). The range
 * itself is layer-independent (all layers share the same start/count grid;
 * only which hours *within* it are present differs), so this takes the base
 * `index`, not a per-layer coverageFor() result. */
export function monthsInCoverage(index) {
    const { coverage } = index;
    const startEpochHour = coverage.startEpochHour;
    const endEpochHour = startEpochHour + Math.max(0, coverage.count - 1) * coverage.stepHours;
    const start = epochHourToLocalParts(startEpochHour);
    const end = epochHourToLocalParts(endEpochHour);
    const months = [];
    let y = start.year, m = start.month;
    // Bounded by construction (coverage.count is finite), but cap the loop
    // defensively so a malformed index can never spin forever.
    for (let guard = 0; guard < 1200 && (y < end.year || (y === end.year && m <= end.month)); guard++) {
        months.push({ year: y, month: m, label: MONTH_LABELS[m] });
        m++;
        if (m > 11) { m = 0; y++; }
    }
    return months;
}

/** Clamp an epochHour into the index's overall coverage range. */
export function clampToCoverageRange(epochHour, index) {
    const { coverage } = index;
    const min = coverage.startEpochHour;
    const max = min + Math.max(0, coverage.count - 1) * coverage.stepHours;
    return Math.min(Math.max(epochHour, min), max);
}

/**
 * Month-chip target: same day-of-month + hour, in a different month, clamped
 * to that month's day count and then to the overall coverage range (design
 * doc §3.3 point 1). Self-healing across the spring-forward gap (see
 * localPartsToEpochHour's doc comment) by construction: whatever instant
 * `localPartsToEpochHour` resolves an invalid local time to is still clamped
 * into range here, and the caller (createPowFinderScrubber's commitTo) runs
 * every navigation target through resolveScrubTarget's coverage check /
 * nearest-present snap regardless — so a target that lands in the gap just
 * degrades into an ordinary "snap to nearest present hour," not a crash.
 */
export function monthChipTarget(currentEpochHour, targetYear, targetMonth, index) {
    const cur = epochHourToLocalParts(currentEpochHour);
    const clampedDay = Math.min(cur.day, daysInMonth(targetYear, targetMonth));
    const epochHour = localPartsToEpochHour({ year: targetYear, month: targetMonth, day: clampedDay, hour: cur.hour });
    return clampToCoverageRange(epochHour, index);
}

/** Day-track drag: a continuous 0..1 fraction across the displayed month ->
 * epochHour, holding the current hour fixed (the day track only moves the
 * day; the hour track/steppers move the hour). */
export function dayTrackFractionToEpochHour(fraction, year, month, hour) {
    const nDays = daysInMonth(year, month);
    const clamped = Math.min(1, Math.max(0, fraction));
    const day = Math.min(nDays, Math.max(1, Math.round(clamped * (nDays - 1)) + 1));
    return localPartsToEpochHour({ year, month, day, hour });
}

/** ±N hours, or an absolute hour-track position (0..23) within the
 * displayed local day. Pure epochHour arithmetic — DST-safe by construction
 * (never touches localPartsToEpochHour). Pass deltaHours=±24 for a
 * daily-cadence layer (see inferLayerStrideHours) — the steppers become
 * ±1 day. */
export function stepHour(epochHour, deltaHours) {
    return epochHour + deltaHours;
}

export function hourTrackFractionToEpochHour(fraction, epochHour) {
    const p = epochHourToLocalParts(epochHour);
    const targetHour = Math.min(23, Math.max(0, Math.round(Math.min(1, Math.max(0, fraction)) * 23)));
    return epochHour + (targetHour - p.hour);
}

/**
 * Resolve a requested scrub target against a layer's coverage: pass through
 * if present, otherwise snap to the nearest present hour with `approx: true`
 * (design doc §5.6 point 6 — "Holes snap... display it with a ≈ prefix").
 * `unavailable: true` only if the layer has no present hours at all.
 *
 * @param {{present: Uint8Array, count: number, startEpochHour: number, stepHours: number}} layerCoverage
 *   coverageFor(layerId)'s return. Passing the *base* (SQH-shaped) coverage
 *   for a sparse layer like avalanche is exactly the "layer-blind" bug
 *   frontend-design flagged in review — always use the per-layer accessor.
 */
export function resolveScrubTarget(epochHour, layerCoverage) {
    const indexLike = asIndexLike(layerCoverage);
    if (coverageHas(indexLike, epochHour)) return { epochHour, approx: false };
    const nearest = nearestPresentHour(indexLike, epochHour);
    if (nearest === null) return { epochHour, approx: false, unavailable: true };
    return { epochHour: nearest, approx: true };
}

/**
 * The LIVE anchor for one layer: the nearest hour *that layer actually has
 * data for* to the raw global latest hour.
 *
 * This matters because `latest` (from `index.latest` / `latest.json`) is one
 * global value derived from the base hourly grid, but a daily-cadence layer
 * (avalanche today, any future one inferLayerStrideHours would flag) is
 * essentially never present at that exact hour — e.g. a 15:00 hourly latest
 * vs. avalanche's 12:00 daily slot. Comparing a daily layer's displayed
 * epochHour against the raw global latest would mean the "● LIVE" state is
 * true for at most 1 of a layer's 24 hourly positions and false the other
 * 23, i.e. HISTORY (with its amber safety border) would misfire on a user
 * who is, correctly, looking at the most current data that layer has. Reuses
 * resolveScrubTarget rather than duplicating its snap logic.
 */
export function layerLiveEpochHour(rawLatestEpochHour, layerCoverage) {
    return resolveScrubTarget(rawLatestEpochHour, layerCoverage).epochHour;
}

/**
 * Infer whether a layer's data is hourly or daily-cadence directly from its
 * bitmask, rather than special-casing a layer id (frontend-design's review:
 * "infer the stride from its bitmask... `surface` or a future layer may also
 * be daily"). A true daily layer (e.g. avalanche, present once per 24h) has
 * present-bit density ~1/24 ≈ 0.042; an hourly layer with the fixture
 * generator's realistic holes (§6 P0.1: two deliberate gaps, ~8-11% of
 * hours missing) still sits well above 1/12. The threshold is set at that
 * midpoint, biased toward "hourly" so a badly-holed hourly layer is never
 * mistaken for daily.
 *
 * @returns {1 | 24} hours between steps: 1 for hourly, 24 for daily.
 */
export function inferLayerStrideHours(layerCoverage) {
    const { present, count } = layerCoverage;
    if (!count || count <= 0) return 1;
    let presentCount = 0;
    for (let slot = 0; slot < count; slot++) {
        if (coverageBitAt(present, slot)) presentCount++;
    }
    if (presentCount === 0) return 1; // nothing to infer from: default to fine control
    return (presentCount / count) >= (1 / 12) ? 1 : 24;
}

// -----------------------------------------------------------------------
// Pure: LIVE / HISTORY state machine
// -----------------------------------------------------------------------

/**
 * The live/retrospective distinction (design doc §3.3's table) is a state
 * machine, not a derived value: LIVE means "tracking the anchor," so when a
 * new hour becomes available while LIVE, the displayed epochHour follows it
 * — but the same new anchor must NOT move the display while in HISTORY
 * (a user scrubbing three weeks back must never be silently swept forward).
 * `collapse()` is a no-op in HISTORY: "time bar... never collapses;
 * timestamp always on screen" while looking at a non-live hour.
 */
export function createScrubState({ latestEpochHour, expanded = false } = {}) {
    let mode = 'live';
    let epochHour = latestEpochHour;
    let latest = latestEpochHour;
    let isExpanded = expanded;
    return {
        get mode() { return mode; },
        get epochHour() { return epochHour; },
        get latest() { return latest; },
        get expanded() { return isExpanded; },
        /** User-driven navigation to an arbitrary hour (steppers, drags, taps). */
        goTo(newEpochHour) {
            epochHour = newEpochHour;
            mode = (epochHour === latest) ? 'live' : 'history';
            return mode;
        },
        /** A fresh `latest.json` poll result. */
        setLatest(newLatest) {
            latest = newLatest;
            if (mode === 'live') epochHour = newLatest;
        },
        /** Tapping "⟲ LIVE": return to the anchor and re-pin. */
        goLive() {
            mode = 'live';
            epochHour = latest;
        },
        setExpanded(next) {
            if (!next && mode === 'history') return isExpanded; // no-op: HISTORY never collapses
            isExpanded = next;
            return isExpanded;
        },
        toggleExpanded() {
            return this.setExpanded(!isExpanded);
        },
    };
}

// -----------------------------------------------------------------------
// DOM: createPowFinderScrubber
// -----------------------------------------------------------------------

const LONG_PRESS_DELAY_MS = 450;
const LONG_PRESS_REPEAT_MS = 250; // 4 Hz, per design doc §3.3 point 4
const HISTORY_BODY_CLASS = 'pf-scrub-history'; // scoped root class owning the amber viewport border (never a bare rule)

function vibrateDefault(ms) {
    try { navigator?.vibrate?.(ms); } catch { /* no-op: vibrate is optional and can throw on some UAs */ }
}

async function fetchLatestDefault(url) {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`latest.json fetch failed: ${res.status}`);
    const json = await res.json();
    return json?.latest ? Math.floor(Date.parse(json.latest) / MS_PER_HOUR) : null;
}

function el(tag, className, attrs) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (attrs) for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    return node;
}

/**
 * Mount the time scrubber into `mount` (`#powfinder-time`, shipped `hidden`
 * by [fe:prep]). Reveals via `mount.hidden = false` once the initial render
 * is built, per index.html's mount-point contract — never a CSS `display`
 * rule. Sets every ARIA attribute here, not in markup.
 *
 * @param {object} config
 * @param {HTMLElement} config.mount
 * @param {object} config.index               parseSidecarIndex() result
 * @param {(layerId: string) => {present: Uint8Array, count: number, startEpochHour: number, stepHours: number}} config.coverageFor
 *   Per-layer coverage accessor (see module header). Build one with
 *   `buildStubCoverageFor(index, rawLayersCoverage)` until the real one
 *   lands on `index` itself.
 * @param {() => string} config.getActiveLayerId
 * @param {(epochHour: number, info: {approx: boolean, mode: string}) => void} [config.onCommit]
 * @param {(hint: {stride: number, direction: -1|0|1}) => void} [config.onScrubHint]
 * @param {string} [config.latestUrl]          latest.json URL for LIVE polling
 * @param {() => Promise<number|null>} [config.fetchLatest]  overrides latestUrl fetch
 * @param {(ms: number) => void} [config.vibrate]
 * @param {() => number} [config.nowEpochHour] for relative-age labels; defaults to Date.now()-derived
 * @param {number} [config.pollIntervalMs]     default 10 minutes (§3.3)
 * @param {Document} [config.doc]              injectable for isolated harnesses; defaults to global document
 * @returns {{
 *   getEpochHour: () => number,
 *   getMode: () => 'live'|'history',
 *   setEpochHour: (epochHour: number) => void,
 *   goLive: () => void,
 *   onActiveLayerChanged: () => void,
 *   refreshLatest: () => Promise<void>,
 *   setExpanded: (next: boolean) => void,
 *   destroy: () => void,
 * }} `onActiveLayerChanged` must be called by whoever owns the layer picker
 *   (a different task) whenever the active layer changes — see its own doc
 *   comment for why.
 */
export function createPowFinderScrubber(config) {
    const {
        mount,
        index,
        coverageFor,
        getActiveLayerId,
        onCommit = () => {},
        onScrubHint = () => {},
        latestUrl = null,
        fetchLatest = latestUrl ? () => fetchLatestDefault(latestUrl) : async () => null,
        vibrate = vibrateDefault,
        nowEpochHour = () => Math.floor(Date.now() / MS_PER_HOUR),
        pollIntervalMs = 10 * 60 * 1000,
        doc = typeof document !== 'undefined' ? document : null,
    } = config || {};

    if (!mount) throw new Error('createPowFinderScrubber: config.mount is required');
    if (!doc) throw new Error('createPowFinderScrubber: no document available (browser-only)');
    if (!index?.ok) throw new Error('createPowFinderScrubber: config.index must be a parseSidecarIndex() ok result');
    if (typeof coverageFor !== 'function') throw new Error('createPowFinderScrubber: config.coverageFor(layerId) is required — see buildStubCoverageFor');

    // `rawLatestAnchor` is the global hourly latest (from index.latest /
    // latest.json polling); `state`'s `latest` is that anchor resolved into
    // the *active layer's own* nearest present hour (layerLiveEpochHour) —
    // see that function's doc comment for why the distinction is load-
    // bearing for a daily-cadence layer's LIVE/HISTORY signal.
    let rawLatestAnchor = clampToCoverageRange(
        Math.floor(Date.parse(index.latest) / MS_PER_HOUR) || (index.coverage.startEpochHour + index.coverage.count - 1),
        index,
    );
    const state = createScrubState({ latestEpochHour: layerLiveEpochHour(rawLatestAnchor, activeLayerCoverage()) });
    let displayMonth = epochHourToLocalParts(state.epochHour).month;
    let displayYear = epochHourToLocalParts(state.epochHour).year;
    let lastResolved = { epochHour: state.epochHour, approx: false };
    let pollHandle = null;
    let longPressHandle = null;
    let dragging = null; // {kind: 'day'|'hour', pointerId}

    // ---- DOM skeleton ----
    mount.innerHTML = '';
    mount.setAttribute('role', 'group');
    mount.setAttribute('aria-label', 'Time scrubber');

    const bar = el('button', 'pf-scrub-bar', { type: 'button', 'aria-expanded': 'false' });
    const dot = el('span', 'pf-scrub-dot');
    const label = el('span', 'pf-scrub-label');
    const chevron = el('span', 'pf-scrub-chevron', { 'aria-hidden': 'true' });
    chevron.textContent = '⌄';
    bar.append(dot, label, chevron);

    const panel = el('div', 'pf-scrub-panel');
    panel.hidden = true;

    const monthsRow = el('div', 'pf-scrub-months', { role: 'tablist', 'aria-label': 'Month' });
    const dayRow = el('div', 'pf-scrub-day-row');
    const dayTrack = el('div', 'pf-scrub-day-track', { role: 'slider', 'aria-label': 'Day of month', tabindex: '0' });
    const dayThumb = el('div', 'pf-scrub-day-thumb', { 'aria-hidden': 'true' });
    const dayLabels = el('div', 'pf-scrub-day-labels', { 'aria-hidden': 'true' });
    const rail = el('div', 'pf-scrub-rail', { 'aria-hidden': 'true' });
    dayTrack.append(rail, dayThumb);
    dayRow.append(dayTrack, dayLabels);

    const hourRow = el('div', 'pf-scrub-hour-row');
    const minusBtn = el('button', 'pf-scrub-step pf-scrub-step-minus', { type: 'button' });
    const hourTrack = el('div', 'pf-scrub-hour-track', { role: 'slider', 'aria-label': 'Hour of day', tabindex: '0' });
    const hourThumb = el('div', 'pf-scrub-hour-thumb', { 'aria-hidden': 'true' });
    const hourReadout = el('div', 'pf-scrub-hour-readout', { 'aria-hidden': 'true' });
    hourTrack.append(hourThumb);
    const plusBtn = el('button', 'pf-scrub-step pf-scrub-step-plus', { type: 'button' });
    hourRow.append(minusBtn, hourTrack, plusBtn);

    panel.append(monthsRow, dayRow, hourRow, hourReadout);
    mount.append(bar, panel);
    mount.hidden = false;

    // ---- stride-aware helpers ----
    function activeLayerCoverage() {
        return coverageFor(getActiveLayerId ? getActiveLayerId() : 'sqh');
    }
    function activeStride() {
        return inferLayerStrideHours(activeLayerCoverage());
    }

    // ---- rendering ----
    function renderBar(stride) {
        const isLive = state.mode === 'live';
        dot.className = `pf-scrub-dot ${isLive ? 'is-live' : 'is-history'}`;
        const readout = formatReadout(state.epochHour, { approx: lastResolved.approx, dateOnly: stride === 24 });
        if (isLive) {
            label.textContent = `● LIVE   ${readout}`;
        } else {
            const age = relativeAgeLabel(state.epochHour, nowEpochHour());
            label.textContent = `⟲ HISTORY   ${readout}   ${age}`;
        }
        chevron.textContent = state.expanded ? '⌃' : '⌄';
        bar.setAttribute('aria-expanded', String(state.expanded));
        doc.body?.classList.toggle(HISTORY_BODY_CLASS, !isLive);
    }

    function renderMonths() {
        const months = monthsInCoverage(index);
        monthsRow.innerHTML = '';
        for (const m of months) {
            const chip = el('button', 'pf-scrub-month-chip', { type: 'button', role: 'tab' });
            chip.textContent = m.label.toUpperCase();
            const isActive = m.year === displayYear && m.month === displayMonth;
            chip.classList.toggle('is-active', isActive);
            chip.setAttribute('aria-selected', String(isActive));
            chip.addEventListener('click', () => {
                const target = monthChipTarget(state.epochHour, m.year, m.month, index);
                commitTo(target);
                vibrate(8);
            });
            monthsRow.append(chip);
        }
    }

    function renderDayTrack() {
        const days = dayAvailability(displayYear, displayMonth, activeLayerCoverage());
        const nDays = days.length;
        rail.innerHTML = '';
        for (let i = 0; i < nDays; i++) {
            const tick = el('span', `pf-scrub-rail-tick ${days[i] ? 'is-present' : 'is-gap'}`);
            tick.style.left = `${(i / Math.max(1, nDays - 1)) * 100}%`;
            rail.append(tick);
        }
        dayLabels.innerHTML = '';
        const tickDays = [1, 5, 10, 15, 20, 25, nDays];
        for (const d of new Set(tickDays.filter((d) => d <= nDays))) {
            const lbl = el('span', 'pf-scrub-day-label');
            lbl.textContent = String(d);
            lbl.style.left = `${((d - 1) / Math.max(1, nDays - 1)) * 100}%`;
            dayLabels.append(lbl);
        }
        const p = epochHourToLocalParts(state.epochHour);
        dayThumb.style.left = `${((p.day - 1) / Math.max(1, nDays - 1)) * 100}%`;
        dayTrack.setAttribute('aria-valuemin', '1');
        dayTrack.setAttribute('aria-valuemax', String(nDays));
        dayTrack.setAttribute('aria-valuenow', String(p.day));
    }

    function renderHourTrack(stride) {
        // Daily-cadence layer (design doc review: avalanche today, inferred
        // generically from the bitmask, not the layer id): the hour track is
        // meaningless — 23 of 24 stepper taps would land on absent data — so
        // hide it and switch the steppers to ±1 day.
        hourRow.hidden = stride === 24;
        minusBtn.textContent = stride === 24 ? '−1d' : '−1h';
        plusBtn.textContent = stride === 24 ? '+1d' : '+1h';
        minusBtn.setAttribute('aria-label', stride === 24 ? 'Back one day' : 'Back one hour');
        plusBtn.setAttribute('aria-label', stride === 24 ? 'Forward one day' : 'Forward one hour');
        if (stride === 24) return;
        const p = epochHourToLocalParts(state.epochHour);
        hourThumb.style.left = `${(p.hour / 23) * 100}%`;
        hourReadout.textContent = `${String(p.hour).padStart(2, '0')}:00`;
        hourTrack.setAttribute('aria-valuemin', '0');
        hourTrack.setAttribute('aria-valuemax', '23');
        hourTrack.setAttribute('aria-valuenow', String(p.hour));
    }

    function renderAll() {
        const p = epochHourToLocalParts(state.epochHour);
        displayYear = p.year;
        displayMonth = p.month;
        panel.hidden = !state.expanded;
        const stride = activeStride();
        renderBar(stride);
        if (state.expanded) {
            renderMonths();
            renderDayTrack();
            renderHourTrack(stride);
        }
    }

    // ---- commit / navigation ----
    function commitTo(rawEpochHour) {
        const clamped = clampToCoverageRange(rawEpochHour, index);
        const resolved = resolveScrubTarget(clamped, activeLayerCoverage());
        lastResolved = resolved;
        state.goTo(resolved.epochHour);
        renderAll();
        onCommit(resolved.epochHour, { approx: resolved.approx, mode: state.mode });
        vibrate(8);
        onScrubHint({ stride: 1, direction: 0 });
    }

    bar.addEventListener('click', () => {
        state.setExpanded(!state.expanded);
        renderAll();
    });

    minusBtn.addEventListener('click', () => commitTo(stepHour(state.epochHour, -activeStride())));
    plusBtn.addEventListener('click', () => commitTo(stepHour(state.epochHour, +activeStride())));

    function wireLongPress(button, sign) {
        const start = (ev) => {
            ev.preventDefault();
            const stride = activeStride();
            onScrubHint({ stride, direction: sign });
            longPressHandle = setTimeout(function repeat() {
                commitTo(stepHour(state.epochHour, sign * activeStride()));
                longPressHandle = setTimeout(repeat, LONG_PRESS_REPEAT_MS);
            }, LONG_PRESS_DELAY_MS);
        };
        const stop = () => {
            if (longPressHandle) { clearTimeout(longPressHandle); longPressHandle = null; }
            onScrubHint({ stride: activeStride(), direction: 0 });
        };
        button.addEventListener('pointerdown', start);
        button.addEventListener('pointerup', stop);
        button.addEventListener('pointerleave', stop);
        button.addEventListener('pointercancel', stop);
    }
    wireLongPress(minusBtn, -1);
    wireLongPress(plusBtn, +1);

    function wireDrag(track, kind) {
        const onMove = (ev) => {
            const rect = track.getBoundingClientRect();
            const fraction = rect.width > 0 ? (ev.clientX - rect.left) / rect.width : 0;
            const stride = kind === 'day' ? 24 : 1;
            const direction = dragging?.lastFraction != null
                ? Math.sign(fraction - dragging.lastFraction)
                : 0;
            if (dragging) dragging.lastFraction = fraction;
            onScrubHint({ stride, direction });
            const target = kind === 'day'
                ? dayTrackFractionToEpochHour(fraction, displayYear, displayMonth, epochHourToLocalParts(state.epochHour).hour)
                : hourTrackFractionToEpochHour(fraction, state.epochHour);
            state.goTo(clampToCoverageRange(target, index));
            renderAll();
        };
        const onUp = (ev) => {
            track.releasePointerCapture?.(ev.pointerId);
            track.removeEventListener('pointermove', onMove);
            track.removeEventListener('pointerup', onUp);
            dragging = null;
            commitTo(state.epochHour); // release snaps (design doc §3.3 point 2)
        };
        track.addEventListener('pointerdown', (ev) => {
            dragging = { kind, pointerId: ev.pointerId, lastFraction: null };
            track.setPointerCapture?.(ev.pointerId);
            track.addEventListener('pointermove', onMove);
            track.addEventListener('pointerup', onUp);
        });
    }
    wireDrag(dayTrack, 'day');
    wireDrag(hourTrack, 'hour');

    // ---- LIVE / HISTORY ----
    function goLive() {
        state.goLive();
        renderAll();
        onCommit(state.epochHour, { approx: false, mode: 'live' });
    }
    dot.addEventListener('click', (ev) => {
        if (state.mode === 'history') { ev.stopPropagation(); goLive(); }
    });

    async function pollLatest() {
        try {
            const latest = await fetchLatest();
            if (typeof latest !== 'number' || !Number.isFinite(latest)) return;
            rawLatestAnchor = clampToCoverageRange(latest, index);
            state.setLatest(layerLiveEpochHour(rawLatestAnchor, activeLayerCoverage()));
            renderAll();
        } catch { /* transient network failure: keep the last known anchor, retry next tick */ }
    }

    /**
     * Call when the *external* active layer changes (the layer picker is a
     * different task's UI — this module only reads `getActiveLayerId()`, it
     * is never told about a change on its own). Re-resolves the LIVE anchor
     * against the new layer (see layerLiveEpochHour) so switching onto a
     * daily-cadence layer while LIVE keeps tracking "the newest data this
     * layer has," not the previous layer's exact hour. If currently in
     * HISTORY, also re-snaps the displayed epochHour into the new layer's
     * own coverage rather than silently leaving it pointed at an hour the
     * new layer has no data for.
     */
    function onActiveLayerChanged() {
        const layerCoverage = activeLayerCoverage();
        state.setLatest(layerLiveEpochHour(rawLatestAnchor, layerCoverage));
        if (state.mode === 'history') {
            const resolved = resolveScrubTarget(state.epochHour, layerCoverage);
            lastResolved = resolved;
            state.goTo(resolved.epochHour);
        } else {
            lastResolved = { epochHour: state.epochHour, approx: false };
        }
        renderAll();
    }

    function startPolling() {
        stopPolling();
        pollHandle = setInterval(pollLatest, pollIntervalMs);
        doc.addEventListener('visibilitychange', onVisibilityChange);
    }
    function stopPolling() {
        if (pollHandle) { clearInterval(pollHandle); pollHandle = null; }
        doc.removeEventListener('visibilitychange', onVisibilityChange);
    }
    function onVisibilityChange() {
        if (doc.visibilityState === 'visible') pollLatest();
    }
    startPolling();

    renderAll();

    return {
        getEpochHour: () => state.epochHour,
        getMode: () => state.mode,
        setEpochHour: (epochHour) => commitTo(epochHour),
        goLive,
        onActiveLayerChanged,
        refreshLatest: pollLatest,
        setExpanded: (next) => { state.setExpanded(next); renderAll(); },
        destroy() {
            stopPolling();
            if (longPressHandle) clearTimeout(longPressHandle);
            doc.body?.classList.remove(HISTORY_BODY_CLASS);
            mount.innerHTML = '';
            mount.hidden = true;
        },
    };
}

export { HISTORY_BODY_CLASS };
