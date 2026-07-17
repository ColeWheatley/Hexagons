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

export function sanitizePublicSettings(settings) {
    if (!settings || typeof settings !== 'object') return null;
    const hazeDistanceKm = settings.hazeDistanceKm;
    const highTextureEnterPx = settings.highTextureEnterPx;
    const gradientMode = settings.gradientMode;
    if (!Number.isInteger(hazeDistanceKm) || hazeDistanceKm < 1 || hazeDistanceKm > 50 ||
        !Number.isInteger(highTextureEnterPx) || highTextureEnterPx < 128 ||
        highTextureEnterPx > 2048 || highTextureEnterPx % 64 !== 0 ||
        (gradientMode !== 0 && gradientMode !== 1)) return null;
    return { hazeDistanceKm, highTextureEnterPx, gradientMode };
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
