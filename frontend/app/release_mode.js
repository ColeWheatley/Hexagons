// @atlas: Explicit release-mode authority. Never derive beta/production from
// manifest span, page count, or any other geographic proxy. A benchmark query
// and the explicit dev-mode toggle are the only runtime overrides, and both
// change telemetry only, never the selected coverage profile.

export const RELEASE_PROFILE_SCHEMA_VERSION = 1;

export const RELEASE_PROFILES = Object.freeze({
    'beta-stubai': Object.freeze({
        mode: 'beta',
        coverageProfile: 'stubai-small-square',
        defaultProfilerMode: 'bounded-recovery',
    }),
    // This identifies the selected-production release lane only. The actual
    // boundary remains a release decision and is not silently widened here.
    'production-selected-tirol': Object.freeze({
        mode: 'production',
        coverageProfile: 'selected-tirol',
        defaultProfilerMode: 'off',
    }),
    // Rechner production coverage is not a hand-drawn rectangle. The durable
    // run inventory records the validated orthophoto/DEM intersection.
    'production-tirol': Object.freeze({
        mode: 'production',
        coverageProfile: 'validated-tif-dem-intersection',
        defaultProfilerMode: 'off',
    }),
});

function profilerPolicy(profile, search, devMode = false) {
    const bench = new URLSearchParams(search || '').get('bench');
    if (bench) return Object.freeze({ enabled: true, mode: 'full' });
    if (devMode) return Object.freeze({ enabled: true, mode: 'bounded-recovery' });
    if (profile.defaultProfilerMode === 'bounded-recovery') {
        return Object.freeze({ enabled: true, mode: 'bounded-recovery' });
    }
    return Object.freeze({ enabled: false, mode: 'off' });
}

/**
 * Resolve the release lane solely from the manifest's explicit descriptor.
 * A benchmark query and the explicit dev-mode toggle are the only runtime
 * overrides; both change telemetry only, never the selected coverage profile.
 */
export function resolveReleaseMode(manifestRelease, search = '', { devMode = false } = {}) {
    if (!manifestRelease || typeof manifestRelease !== 'object') {
        throw new Error('Manifest is missing its explicit release descriptor');
    }
    if (manifestRelease.schema_version !== RELEASE_PROFILE_SCHEMA_VERSION) {
        throw new Error(`Unsupported manifest release schema ${manifestRelease.schema_version}`);
    }
    const profileName = manifestRelease.profile;
    const profile = RELEASE_PROFILES[profileName];
    if (!profile) throw new Error(`Unknown manifest release profile ${profileName}`);
    if (manifestRelease.mode !== profile.mode) {
        throw new Error(`Manifest release mode does not match profile ${profileName}`);
    }
    if (manifestRelease.coverage_profile !== profile.coverageProfile) {
        throw new Error(`Manifest coverage profile does not match profile ${profileName}`);
    }
    return Object.freeze({
        profile: profileName,
        mode: profile.mode,
        coverageProfile: profile.coverageProfile,
        profiler: profilerPolicy(profile, search, devMode),
    });
}

/** Construct a profiler only when the resolved release policy permits it. */
export function createProfilerForReleaseMode(viewer, releaseMode, PerfProfilerCtor) {
    if (!releaseMode?.profiler?.enabled) return undefined;
    return new PerfProfilerCtor(viewer, { mode: releaseMode.profiler.mode });
}
