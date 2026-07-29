// Versioned, deliberately small local persistence for the public viewer.
// This is not a diagnostic dump: benchmark, profiler, debug, and transient
// engine state must never cross a page reload.
export const VIEW_STORAGE_KEY = 'hexagons.public-view.v1';
export const VIEW_STORAGE_VERSION = 1;
const FALLBACK_URL_BASE = ['https:', '', 'example.invalid', ''].join('/');

const POINT_LIMITS = Object.freeze({
    lat: [-90, 90], lon: [-180, 180], sceneY_m: [-100000, 100000],
});

function finiteIn(value, [min, max]) {
    return Number.isFinite(value) && value >= min && value <= max;
}

export function hasExplicitViewParams(input, base = FALLBACK_URL_BASE) {
    try {
        const url = new URL(input, base);
        return ['view', 'at', 'eye'].some(key => url.searchParams.has(key));
    } catch (_) {
        return false;
    }
}

function sanitizePoint(point) {
    if (!point || typeof point !== 'object') return null;
    if (!finiteIn(point.lat, POINT_LIMITS.lat) ||
        !finiteIn(point.lon, POINT_LIMITS.lon) ||
        !finiteIn(point.sceneY_m, POINT_LIMITS.sceneY_m)) return null;
    return { lat: point.lat, lon: point.lon, sceneY_m: point.sceneY_m };
}

export function sanitizeStoredView(view) {
    if (!view || typeof view !== 'object' || view.schema !== 1) return null;
    const target = sanitizePoint(view.target);
    const camera = sanitizePoint(view.camera);
    if (!target || !camera) return null;
    const separation = Math.hypot(
        camera.lat - target.lat, camera.lon - target.lon, camera.sceneY_m - target.sceneY_m,
    );
    // The final scene-space separation check occurs after projection. This
    // rejects only obvious malformed/degenerate persisted positions here.
    if (!Number.isFinite(separation) || separation === 0) return null;
    return { schema: 1, target, camera };
}

// PowFinder shareable layer (design doc §3.7, §6 P2.5). Layer ids are
// backend-published data (index.json's layers[], §1.2 — "the frontend
// hardcodes nothing about a layer except which ramps exist"), so this
// module cannot validate `pf` against a fixed enum; it validates *shape*
// only, which is exactly what stands between a hostile URL and injecting
// something unexpected into the DOM/URL. 'off' is the reserved sentinel for
// "no active layer" (§3.2's "✕" pill / disabled state).
const PF_LAYER_PATTERN = /^(?:off|[a-z][a-z0-9_-]{0,31})$/;

export function sanitizePfLayer(value) {
    return typeof value === 'string' && PF_LAYER_PATTERN.test(value) ? value : null;
}

// The PowFinder timestamp (`t`) is deliberately NOT a sanitizePublicSettings
// field — see that function's doc comment for why. This sanitizer exists so
// view_state.js's URL-only pf/t handling shares one validation source with
// the layer sanitizer above, without the timestamp ever touching the
// persisted-settings schema.
//
// Epoch hour (hours since the Unix epoch), matching sidecar_format.mjs's
// toEpochHour()/coverageHas() convention. The bound is generous (~200
// years either side of 1970) purely to reject garbage/overflow; index.json's
// own coverage bitmask is the real range authority, not this function.
const PF_TIMESTAMP_LIMIT_HOURS = 1_750_000;

export function sanitizePfTimestamp(value) {
    // Explicit type/shape gate rather than a bare `Number(value)` coercion:
    // `Number(null)` is 0 and `Number('')` is 0, both of which are otherwise
    // in-range integers -- silently turning "no timestamp" (null/absent, the
    // live-mode sentinel elsewhere in this contract) into epoch hour 0 would
    // be exactly the kind of quiet misread this sanitizer exists to prevent.
    let hour;
    if (typeof value === 'number') {
        hour = value;
    } else if (typeof value === 'string' && /^-?\d+$/.test(value)) {
        hour = Number(value);
    } else {
        return null;
    }
    return Number.isInteger(hour) && Math.abs(hour) <= PF_TIMESTAMP_LIMIT_HOURS ? hour : null;
}

export function sanitizePublicSettings(settings) {
    if (!settings || typeof settings !== 'object') return null;
    const hazeDistanceKm = settings.hazeDistanceKm;
    let highTextureDistanceM = settings.highTextureDistanceM;
    // One-time v1 migration from the former projected-footprint knob. The
    // historical/default 512px value maps back to the project's 2km range;
    // larger pixel thresholds were stricter and therefore map nearer.
    if (highTextureDistanceM === undefined
        && Number.isInteger(settings.highTextureEnterPx)
        && settings.highTextureEnterPx >= 128
        && settings.highTextureEnterPx <= 2048
        && settings.highTextureEnterPx % 64 === 0) {
        highTextureDistanceM = Math.max(0, Math.min(5000,
            Math.round((2000 * 512 / settings.highTextureEnterPx) / 100) * 100));
    }
    const gradientMode = settings.gradientMode;
    if (!Number.isInteger(hazeDistanceKm) || hazeDistanceKm < 1 || hazeDistanceKm > 50 ||
        !Number.isInteger(highTextureDistanceM) || highTextureDistanceM < 0 ||
        highTextureDistanceM > 5000 || highTextureDistanceM % 100 !== 0 ||
        (gradientMode !== 0 && gradientMode !== 1)) return null;

    const result = { hazeDistanceKm, highTextureDistanceM, gradientMode };
    // pfLayer is optional (older/non-PowFinder envelopes simply omit it) but
    // must be well-formed when present — a malformed value rejects the
    // whole settings object rather than being silently dropped, matching
    // this function's existing all-or-nothing philosophy (see
    // sanitizeStoredEnvelope's own "reject rather than silently retain a
    // surprising partial value" rule just below).
    if (settings.pfLayer !== undefined) {
        const pfLayer = sanitizePfLayer(settings.pfLayer);
        if (pfLayer === null) return null;
        result.pfLayer = pfLayer;
    }
    return result;
}

export function sanitizeStoredEnvelope(value) {
    if (!value || typeof value !== 'object' || value.version !== VIEW_STORAGE_VERSION) return null;
    const view = value.view === null || value.view === undefined ? null : sanitizeStoredView(value.view);
    const settings = value.settings === null || value.settings === undefined
        ? null : sanitizePublicSettings(value.settings);
    // Reject an envelope that tried to carry a malformed public field rather
    // than silently retaining any surprising partial value.
    if ((value.view !== null && value.view !== undefined && !view) ||
        (value.settings !== null && value.settings !== undefined && !settings)) return null;
    if (!view && !settings) return null;
    return { version: VIEW_STORAGE_VERSION, view, settings };
}

export function readPersistedEnvelope(storage) {
    if (!storage) return null;
    try {
        return sanitizeStoredEnvelope(JSON.parse(storage?.getItem(VIEW_STORAGE_KEY)));
    } catch (_) {
        return null;
    }
}

export function writePersistedEnvelope(storage, envelope) {
    const safe = sanitizeStoredEnvelope(envelope);
    if (!storage || !safe) return false;
    try {
        storage?.setItem(VIEW_STORAGE_KEY, JSON.stringify(safe));
        return true;
    } catch (_) {
        // Storage can be disabled/private/quota-limited. Persistence is an
        // enhancement, never a condition for navigating the map.
        return false;
    }
}
