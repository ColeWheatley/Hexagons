// Portable capability budgeting. Keep this deliberately limited to signals
// browsers expose consistently; device/UA guesses make regressions impossible
// to reason about and are not an input to this policy.

export const CONTEXT_LOSS_STORAGE_KEY = 'hexagons.gpu-context-losses.v1';

const MiB = 1024 * 1024;

export const CAPABILITY_PROFILES = Object.freeze({
    low: Object.freeze({
        name: 'low',
        workerCount: 2,
        textureBudgetBytes: 64 * MiB,
        maxTextureJobs: 1,
        highTextureEnterPx: Infinity,
        guardMarginScale: 0.12,
    }),
    mid: Object.freeze({
        name: 'mid',
        workerCount: 3,
        textureBudgetBytes: 128 * MiB,
        maxTextureJobs: 1,
        highTextureEnterPx: 768,
        guardMarginScale: 0.18,
    }),
    high: Object.freeze({
        // This is the historical production budget: high-end rendering keeps
        // its existing quality, concurrency, and prefetch appetite unchanged.
        name: 'high',
        workerCount: 6,
        textureBudgetBytes: 256 * MiB,
        maxTextureJobs: 2,
        highTextureEnterPx: 512,
        guardMarginScale: 0.25,
    }),
});

function finiteOrNull(value) {
    return Number.isFinite(value) && value > 0 ? value : null;
}

/**
 * Resolve a capability profile from standard browser signals only. Missing
 * signals intentionally select the conservative low profile rather than
 * guessing from user-agent strings or display dimensions.
 */
export function resolveCapabilityProfile({
    deviceMemory,
    hardwareConcurrency,
    effectiveType,
    saveData,
    contextLosses = 0,
} = {}) {
    const memory = finiteOrNull(deviceMemory);
    const cores = finiteOrNull(hardwareConcurrency);
    const losses = Math.max(0, Number(contextLosses) || 0);
    const constrainedNetwork = saveData === true
        || effectiveType === 'slow-2g'
        || effectiveType === '2g'
        || effectiveType === '3g';

    if (constrainedNetwork || losses >= 2 || memory === null || cores === null
        || memory < 4 || cores < 4) {
        return CAPABILITY_PROFILES.low;
    }
    // Network Information is optional. An otherwise strong device without it
    // remains high; known constrained links were handled above.
    if (memory >= 8 && cores >= 8 && losses === 0) {
        return CAPABILITY_PROFILES.high;
    }
    return CAPABILITY_PROFILES.mid;
}

export function readPersistedContextLosses(storage) {
    try {
        return Math.max(0, Number(storage?.getItem(CONTEXT_LOSS_STORAGE_KEY)) || 0);
    } catch {
        return 0;
    }
}

export function persistContextLoss(storage, previousLosses) {
    const next = Math.max(0, Number(previousLosses) || 0) + 1;
    try { storage?.setItem(CONTEXT_LOSS_STORAGE_KEY, String(next)); } catch { /* storage is optional */ }
    return next;
}

export function detectCapabilityProfile(navigatorLike = globalThis.navigator, storage = globalThis.localStorage) {
    const connection = navigatorLike?.connection;
    return resolveCapabilityProfile({
        deviceMemory: navigatorLike?.deviceMemory,
        hardwareConcurrency: navigatorLike?.hardwareConcurrency,
        effectiveType: connection?.effectiveType,
        saveData: connection?.saveData,
        contextLosses: readPersistedContextLosses(storage),
    });
}
