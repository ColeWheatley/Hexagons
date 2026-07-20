// Pure state machine for shared square imagery pages.  GPU objects remain
// caller-owned values in `assets`; this module only owns page identity, demand,
// tier transitions, and the many-geometry-to-one-page consumer graph.

export const PAGE_TEXTURE_TIER = Object.freeze({
    BOOTSTRAP: 'bootstrap64',
    LOW: 'low128',
    MEDIUM: 'medium256',
    HIGH: 'high4096',
});

// Delivery contract for the transient, whole-page first-paint image. These
// values are duplicated in the manifest and validated by main.js.
export const BOOTSTRAP_PAGE_SIZE_PX = 64;
export const BOOTSTRAP_GPU_BYTES_PER_PAGE = BOOTSTRAP_PAGE_SIZE_PX * BOOTSTRAP_PAGE_SIZE_PX * 4;
export const BOOTSTRAP_MAX_RESIDENT_BYTES = 1024 * 1024;

export const PAGE_TEXTURE_RANK = Object.freeze({
    [PAGE_TEXTURE_TIER.BOOTSTRAP]: -1,
    [PAGE_TEXTURE_TIER.LOW]: 0,
    [PAGE_TEXTURE_TIER.MEDIUM]: 1,
    [PAGE_TEXTURE_TIER.HIGH]: 2,
});

// Per-tier operational state machine.  Each (page, tier) pair is in exactly
// one operational state at any time.  The `assets` Map tracks GPU-object
// residency independently; when a tier is RESIDENT, its GPU object MUST be
// present in `assets`.
export const TIER_STATE = Object.freeze({
    ABSENT: 'absent',
    QUEUED: 'queued',
    LOADING: 'loading',
    FAILED: 'failed',
});

// Legal per-tier transitions.  RESIDENT is tracked via `assets`, not
// `tierStates`, so the LOADING→resident handoff happens on the caller side
// in `_installTextureResult`.
const VALID_TRANSITIONS = Object.freeze({
    [TIER_STATE.ABSENT]: new Set([TIER_STATE.QUEUED]),
    [TIER_STATE.QUEUED]: new Set([TIER_STATE.ABSENT, TIER_STATE.LOADING]),
    [TIER_STATE.LOADING]: new Set([TIER_STATE.ABSENT, TIER_STATE.FAILED]),
    [TIER_STATE.FAILED]: new Set([TIER_STATE.ABSENT]),
});

export class IllegalTierTransitionError extends Error {
    constructor(key, tier, from, to) {
        super(`Illegal tier state transition for ${key}/${tier}: ${from} -> ${to}`);
        this.name = 'IllegalTierTransitionError';
    }
}

export function tierState(state, tier) {
    return state?.tierStates?.get(tier) || TIER_STATE.ABSENT;
}

export function setTierState(state, tier, newState, { validate = false } = {}) {
    if (!state || !state.tierStates) return;
    if (newState === TIER_STATE.ABSENT) {
        state.tierStates.delete(tier);
        state._tierLoadingStartMs?.delete(tier);
        return;
    }
    if (validate) {
        const current = tierState(state, tier);
        if (current !== newState && !VALID_TRANSITIONS[current]?.has(newState)) {
            throw new IllegalTierTransitionError(state.key, tier, current, newState);
        }
    }
    state.tierStates.set(tier, newState);
    if (newState === TIER_STATE.LOADING && state._tierLoadingStartMs) {
        state._tierLoadingStartMs.set(tier, performance.now());
    }
    if (newState !== TIER_STATE.LOADING && state._tierLoadingStartMs) {
        state._tierLoadingStartMs.delete(tier);
    }
}

export function isTier(state, tier, expected) {
    return tierState(state, tier) === expected;
}

export function tierIsTerminal(state, tier) {
    return Boolean(state?.assets?.has(tier) || isTier(state, tier, TIER_STATE.FAILED));
}

export function tierIsPending(state, tier) {
    const s = tierState(state, tier);
    return s !== TIER_STATE.ABSENT && s !== TIER_STATE.FAILED;
}

export function tierLoadingMs(state, tier) {
    const started = state?._tierLoadingStartMs?.get(tier);
    return Number.isFinite(started) ? performance.now() - started : null;
}

export function tierLoadingExpired(state, tier, maxMs = 15000) {
    const ms = tierLoadingMs(state, tier);
    return ms !== null && ms > maxMs;
}

// The green postage tier is the durable coverage floor: every page in the active demand
// region reaches either resident or terminal-failure state before an upgrade
// consumes a texture-worker slot. Mini fixtures may opt into whole-corpus
// coverage. Keeping this decision pure makes the dispatch order deterministic
// and independently testable.
export function textureStateHasDemand(state, { includeOutside = false } = {}) {
    return Boolean(state && (includeOutside || state.classification !== 'outside'));
}

export function lowTextureCoveragePending(states, { includeOutside = true } = {}) {
    const values = states instanceof Map ? states.values() : (states || []);
    for (const state of values) {
        if (!textureStateHasDemand(state, { includeOutside })) continue;
        if (!tierIsTerminal(state, PAGE_TEXTURE_TIER.LOW)) return true;
    }
    return false;
}

// Drop queued work that no longer belongs to the current visibility demand.
// A worker request that has already started remains caller-owned and may
// finish safely, but stale queued lows/upgrades must not consume future slots
// or hold the active coverage barrier open after the camera moves.
export function pruneTextureDispatchQueue(queue, states, {
    includeOutside = false,
} = {}) {
    const retained = [];
    for (const task of queue || []) {
        const state = states?.get?.(task?.key) || null;
        const demanded = textureStateHasDemand(state, { includeOutside });
        const desiredRank = PAGE_TEXTURE_RANK[state?.desiredTier ?? PAGE_TEXTURE_TIER.LOW];
        const taskRank = PAGE_TEXTURE_RANK[task?.tier];
        const tierDemanded = includeOutside || (
            Number.isFinite(taskRank)
            && Number.isFinite(desiredRank)
            && taskRank <= desiredRank
        );
        if (demanded && tierDemanded) {
            retained.push(task);
        } else if (state && task?.tier) {
            setTierState(state, task.tier, TIER_STATE.ABSENT);
        }
    }
    return retained;
}

export function selectTextureDispatchTaskIndex(queue, states, {
    isMoving = false,
    lowCoverageFirst = false,
    lowCoverageIncludesOutside = true,
    dispatchSequence = null,
    agingInterval = 8,
} = {}) {
    const lowBarrier = lowCoverageFirst && lowTextureCoveragePending(states, {
        includeOutside: lowCoverageIncludesOutside,
    });
    let selectedIndex = -1;
    let selectedPriority = -Infinity;
    for (let index = 0; index < (queue || []).length; index++) {
        const task = queue[index];
        if (!task) continue;
        if (isMoving && task.tier === PAGE_TEXTURE_TIER.HIGH) continue;
        const state = states?.get?.(task.key);
        const bootstrapPending = (
            isTier(state, PAGE_TEXTURE_TIER.BOOTSTRAP, TIER_STATE.QUEUED)
            || isTier(state, PAGE_TEXTURE_TIER.BOOTSTRAP, TIER_STATE.LOADING)
        ) && !tierIsTerminal(state, PAGE_TEXTURE_TIER.BOOTSTRAP);
        if (task.tier !== PAGE_TEXTURE_TIER.BOOTSTRAP && bootstrapPending) continue;
        if (lowBarrier
            && task.tier !== PAGE_TEXTURE_TIER.BOOTSTRAP
            && task.tier !== PAGE_TEXTURE_TIER.LOW) continue;
        const age = Number.isFinite(dispatchSequence)
            ? Math.max(0, dispatchSequence - (task.enqueuedSequence || 0))
            : 0;
        const priority = (Number.isFinite(task.priority) ? task.priority : 0)
            + Math.floor(age / Math.max(1, agingInterval)) * 1e9;
        if (selectedIndex < 0 || priority > selectedPriority) {
            selectedIndex = index;
            selectedPriority = priority;
        }
    }
    return selectedIndex;
}

const CLASS_RANK = Object.freeze({ outside: 0, guard: 1, visible: 2 });

export function desiredTextureTier(state, distanceMeters, _classification, thresholds) {
    // Visibility scopes downloads; it does not decide image quality. Blue vs
    // pink is exclusively the 3D camera-to-page-center distance, so viewport
    // size, DPR, projection, and a simple camera rotation cannot flip tiers.
    const previous = state.desiredTier || PAGE_TEXTURE_TIER.MEDIUM;
    const highEnter = Number(thresholds.highEnterDistanceM);
    const highExit = Number(thresholds.highExitDistanceM);
    const highEnabled = Number.isFinite(highEnter) && highEnter > 0;
    const distance = Number.isFinite(distanceMeters) ? distanceMeters : Infinity;
    if (highEnabled) {
        if (previous === PAGE_TEXTURE_TIER.HIGH && distance <= highExit) {
            return PAGE_TEXTURE_TIER.HIGH;
        }
        if (distance <= highEnter) return PAGE_TEXTURE_TIER.HIGH;
    }
    return PAGE_TEXTURE_TIER.MEDIUM;
}

// Pure request matrix. This is deliberately independent of the worker queue:
// tests can prove the startup bridge plus durable green/blue ladder while
// callers still choose how to prioritise whole pages.
export function textureTierRequestPlan(state, {
    isMoving = false,
    allowBootstrap = true,
} = {}) {
    const plan = [];
    const needsBootstrap = allowBootstrap && state && state.assets?.size === 0
        && !isTier(state, PAGE_TEXTURE_TIER.BOOTSTRAP, TIER_STATE.FAILED);
    if (needsBootstrap) plan.push(PAGE_TEXTURE_TIER.BOOTSTRAP);
    if (!state) return plan;

    const request = tier => {
        if (!state.assets.has(tier) && !isTier(state, tier, TIER_STATE.FAILED)) plan.push(tier);
    };
    // Green and blue are durable session fallbacks. Pink is an optional
    // distance-selected refinement, and new pink work may wait for motion to
    // settle without suppressing either KTX2 fallback.
    request(PAGE_TEXTURE_TIER.LOW);
    if (PAGE_TEXTURE_RANK[state.desiredTier] >= PAGE_TEXTURE_RANK[PAGE_TEXTURE_TIER.MEDIUM]) {
        request(PAGE_TEXTURE_TIER.MEDIUM);
    }
    if (state.desiredTier === PAGE_TEXTURE_TIER.HIGH
        && !isMoving
        && !state.highAdmissionBlocked) {
        request(PAGE_TEXTURE_TIER.HIGH);
    }
    return plan;
}

// A rejected pink upload stays suppressed only while both the cache contents
// and its distance rank are unchanged. This prevents stationary retry churn,
// but lets a newly freed slot or a page moving closer trigger another attempt.
export function highAdmissionRetryReady(state, cacheRevision, priority) {
    if (!state?.highAdmissionBlocked) return true;
    const revisionChanged = Number(cacheRevision) !== Number(state.highAdmissionBlockedRevision);
    const rankImproved = Number.isFinite(priority)
        && priority > (Number.isFinite(state.highAdmissionBlockedPriority)
            ? state.highAdmissionBlockedPriority
            : -Infinity);
    return revisionChanged || rankImproved;
}

// The page frustum is exact while a terrain island carries a conservative
// page-AABB. If a visible island still binds an adjacent page, retain medium
// for that page even when its own page box is just outside the frustum. This
// is consumer-scoped, never a whole-corpus outside preload.
export function promoteVisibleConsumerPages(states, visiblePageKeys) {
    const keys = visiblePageKeys instanceof Set ? visiblePageKeys : new Set(visiblePageKeys || []);
    for (const state of states instanceof Map ? states.values() : (states || [])) {
        if (state?.classification !== 'outside' || !keys.has(state.key)) continue;
        state.classification = 'guard';
    }
}

export class TexturePageResidency {
    constructor({
        pages,
        mini = false,
        highEnterDistanceM = 2000,
        highExitDistanceM = 2500,
    }) {
        this.mini = Boolean(mini);
        this.thresholds = { highEnterDistanceM, highExitDistanceM };
        this.states = new Map();
        this.consumerPages = new Map();
        for (const page of pages || []) {
            if (!page?.key) throw new TypeError('every texture page needs a key');
            if (this.states.has(page.key)) throw new Error(`duplicate texture page ${page.key}`);
            this.states.set(page.key, {
                key: page.key,
                page,
                consumers: new Set(),
                assets: new Map(),
                tierStates: new Map(),
                _tierLoadingStartMs: new Map(),
                desiredTier: PAGE_TEXTURE_TIER.LOW,
                activeTier: null,
                classification: 'outside',
                projectedDiameterPx: 0,
                distanceMeters: Infinity,
                perceptibility: 0,
                highAdmissionBlocked: false,
                highAdmissionBlockedRevision: -1,
                highAdmissionBlockedPriority: -Infinity,
                _nextClassification: 'outside',
                _nextProjectedDiameterPx: 0,
                _nextDistanceMeters: Infinity,
                _nextPerceptibility: 0,
            });
        }
    }

    state(pageOrKey) {
        const key = typeof pageOrKey === 'string' ? pageOrKey : pageOrKey?.key;
        return this.states.get(key) || null;
    }

    attachConsumer(consumerKey, pageKeys) {
        this.detachConsumer(consumerKey);
        const unique = Array.from(new Set(pageKeys || []));
        this.consumerPages.set(consumerKey, unique);
        for (const key of unique) this.states.get(key)?.consumers.add(consumerKey);
        return unique;
    }

    detachConsumer(consumerKey) {
        const previous = this.consumerPages.get(consumerKey);
        if (!previous) return;
        for (const key of previous) this.states.get(key)?.consumers.delete(consumerKey);
        this.consumerPages.delete(consumerKey);
    }

    pagesForConsumer(consumerKey) {
        return [...(this.consumerPages.get(consumerKey) || [])];
    }

    beginDemandPass() {
        for (const state of this.states.values()) {
            state._nextClassification = 'outside';
            state._nextProjectedDiameterPx = 0;
            state._nextDistanceMeters = Infinity;
            state._nextPerceptibility = 0;
        }
    }

    contribute(pageOrKey, {
        classification = 'outside',
        projectedDiameterPx = 0,
        distanceMeters = Infinity,
        perceptibility = 0,
    } = {}) {
        const state = this.state(pageOrKey);
        if (!state) return null;
        if (!(classification in CLASS_RANK)) throw new Error(`unknown classification ${classification}`);
        if (CLASS_RANK[classification] > CLASS_RANK[state._nextClassification]) {
            state._nextClassification = classification;
        }
        state._nextProjectedDiameterPx = Math.max(
            state._nextProjectedDiameterPx,
            Number.isFinite(projectedDiameterPx) ? projectedDiameterPx : Infinity,
        );
        state._nextDistanceMeters = Math.min(
            state._nextDistanceMeters,
            Number.isFinite(distanceMeters) ? Math.max(0, distanceMeters) : Infinity,
        );
        state._nextPerceptibility = Math.max(
            state._nextPerceptibility,
            Number.isFinite(perceptibility) ? perceptibility : 0,
        );
        return state;
    }

    finishDemandPass({ highEnterDistanceM = null, highExitDistanceM = null } = {}) {
        const thresholds = {
            highEnterDistanceM: highEnterDistanceM ?? this.thresholds.highEnterDistanceM,
            highExitDistanceM: highExitDistanceM ?? this.thresholds.highExitDistanceM,
        };
        for (const state of this.states.values()) {
            state.classification = state._nextClassification;
            state.projectedDiameterPx = state._nextProjectedDiameterPx;
            state.distanceMeters = state._nextDistanceMeters;
            state.perceptibility = state._nextPerceptibility;
            state.desiredTier = desiredTextureTier(
                state,
                state.distanceMeters,
                state.classification,
                thresholds,
            );
            if (state.desiredTier !== PAGE_TEXTURE_TIER.HIGH) {
                state.highAdmissionBlocked = false;
                state.highAdmissionBlockedRevision = -1;
                state.highAdmissionBlockedPriority = -Infinity;
            }
        }
        return this.states.values();
    }

    bestAsset(stateOrKey, desired = null, excluded = null) {
        const state = typeof stateOrKey === 'string' ? this.state(stateOrKey) : stateOrKey;
        if (!state) return null;
        const desiredTierValue = desired || state.desiredTier;
        const desiredRank = PAGE_TEXTURE_RANK[desiredTierValue];
        const assets = Array.from(state.assets.entries())
            .filter(([tier]) => tier !== excluded)
            .sort((a, b) => PAGE_TEXTURE_RANK[b[0]] - PAGE_TEXTURE_RANK[a[0]]);
        const atOrBelow = assets.find(([tier]) => PAGE_TEXTURE_RANK[tier] <= desiredRank);
        return atOrBelow || assets[assets.length - 1] || null;
    }

    replaceAsset(pageOrKey, tier, asset, { rebind = () => {}, dispose = () => {} } = {}) {
        const state = this.state(pageOrKey);
        if (!state) throw new Error(`unknown texture page ${pageOrKey}`);
        const previous = state.assets.get(tier) || null;
        state.assets.set(tier, asset);
        if (previous && state.activeTier === tier) rebind(state);
        if (previous) dispose(previous);
        return previous;
    }

    dropAsset(pageOrKey, tier, replacement, {
        rebind = () => {},
        dispose = () => {},
        allowEmpty = false,
    } = {}) {
        const state = this.state(pageOrKey);
        if (!state) return false;
        const asset = state.assets.get(tier);
        if (!asset) return true;
        if (state.activeTier === tier) {
            if (!replacement && !allowEmpty) return false;
            state.assets.delete(tier);
            state.activeTier = replacement?.[0] || null;
            rebind(state);
        } else {
            state.assets.delete(tier);
        }
        dispose(asset);
        return true;
    }
}
