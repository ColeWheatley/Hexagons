// Pure state machine for shared square imagery pages.  GPU objects remain
// caller-owned values in `assets`; this module only owns page identity, demand,
// tier transitions, and the many-geometry-to-one-page consumer graph.

export const PAGE_TEXTURE_TIER = Object.freeze({
    BOOTSTRAP: 'bootstrap32',
    LOW: 'low128',
    MEDIUM: 'medium256',
    HIGH: 'high4096',
});

// Delivery contract for the transient, whole-page first-paint image. These
// values are duplicated in the manifest and validated by main.js.
export const BOOTSTRAP_PAGE_SIZE_PX = 32;
export const BOOTSTRAP_GPU_BYTES_PER_PAGE = BOOTSTRAP_PAGE_SIZE_PX * BOOTSTRAP_PAGE_SIZE_PX * 4;
export const BOOTSTRAP_MAX_RESIDENT_BYTES = 1024 * 1024;

export const PAGE_TEXTURE_RANK = Object.freeze({
    [PAGE_TEXTURE_TIER.BOOTSTRAP]: -1,
    [PAGE_TEXTURE_TIER.LOW]: 0,
    [PAGE_TEXTURE_TIER.MEDIUM]: 1,
    [PAGE_TEXTURE_TIER.HIGH]: 2,
});

function tierIsTerminal(state, tier) {
    return Boolean(state?.assets?.has(tier) || state?.failed?.has(tier));
}

// The postage tier is the coverage floor: every page in the active demand
// region reaches either resident or terminal-failure state before an upgrade
// consumes a texture-worker slot. Mini fixtures may opt into whole-corpus
// coverage. Keeping this decision pure makes the dispatch order deterministic
// and independently testable.
export function textureStateHasDemand(state, { includeOutside = false } = {}) {
    return Boolean(state && (includeOutside || state.classification !== 'outside'));
}

export function lowTextureCoveragePending(states, { includeOutside = true } = {}) {
    const values = states instanceof Map ? states.values() : (states || []);
    const snapshot = Array.from(values);
    const hasBootstrapWork = snapshot.some(state => (
        state?.assets?.has(PAGE_TEXTURE_TIER.BOOTSTRAP)
        || state?.loading?.has(PAGE_TEXTURE_TIER.BOOTSTRAP)
        || state?.queued?.has(PAGE_TEXTURE_TIER.BOOTSTRAP)
        || state?.failed?.has(PAGE_TEXTURE_TIER.BOOTSTRAP)
    ));
    const floorTier = hasBootstrapWork ? PAGE_TEXTURE_TIER.BOOTSTRAP : PAGE_TEXTURE_TIER.LOW;
    for (const state of snapshot) {
        if (!textureStateHasDemand(state, { includeOutside })) continue;
        if (!tierIsTerminal(state, floorTier)) return true;
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
            state.queued?.delete?.(task.tier);
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
    const bootstrapQueued = (queue || []).some(task => task?.tier === PAGE_TEXTURE_TIER.BOOTSTRAP);
    let selectedIndex = -1;
    let selectedPriority = -Infinity;
    for (let index = 0; index < (queue || []).length; index++) {
        const task = queue[index];
        if (!task) continue;
        if (isMoving && task.tier === PAGE_TEXTURE_TIER.HIGH) continue;
        const state = states?.get?.(task.key);
        const bootstrapPending = Boolean(
            state?.queued?.has(PAGE_TEXTURE_TIER.BOOTSTRAP)
            || state?.loading?.has(PAGE_TEXTURE_TIER.BOOTSTRAP)
        ) && !tierIsTerminal(state, PAGE_TEXTURE_TIER.BOOTSTRAP);
        if (task.tier !== PAGE_TEXTURE_TIER.BOOTSTRAP && bootstrapPending) continue;
        if (lowBarrier && task.tier !== (
            bootstrapQueued ? PAGE_TEXTURE_TIER.BOOTSTRAP : PAGE_TEXTURE_TIER.LOW
        )) continue;
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

export function desiredTextureTier(state, projectedDiameterPx, classification, thresholds) {
    // A request is always a whole 1024m texture page.  Once a page matters at
    // all, 128px is a redundant wire/decode step: visible near pages jump from
    // the 32px WebP directly to high; every other demanded page gets medium.
    // Keep LOW in the rank table solely to read legacy resident assets.
    if (classification === 'outside') return PAGE_TEXTURE_TIER.MEDIUM;
    const previous = state.desiredTier || PAGE_TEXTURE_TIER.MEDIUM;
    const highExit = thresholds.highEnterPx * thresholds.hysteresis;
    if (classification === 'visible') {
        if (previous === PAGE_TEXTURE_TIER.HIGH && projectedDiameterPx >= highExit) {
            return PAGE_TEXTURE_TIER.HIGH;
        }
        if (projectedDiameterPx >= thresholds.highEnterPx) return PAGE_TEXTURE_TIER.HIGH;
    }
    return PAGE_TEXTURE_TIER.MEDIUM;
}

// Pure request matrix. This is deliberately independent of the worker queue:
// tests can prove that the first near visible request has no low/medium
// prerequisite, while callers still choose how to prioritise whole pages.
export function textureTierRequestPlan(state, { isMoving = false } = {}) {
    const plan = [];
    const needsBootstrap = state && state.assets?.size === 0
        && !state.failed?.has(PAGE_TEXTURE_TIER.BOOTSTRAP);
    if (needsBootstrap) plan.push(PAGE_TEXTURE_TIER.BOOTSTRAP);
    if (!state) return plan;
    if (state.desiredTier === PAGE_TEXTURE_TIER.HIGH) {
        if (!isMoving) plan.push(PAGE_TEXTURE_TIER.HIGH);
    } else if (state.desiredTier === PAGE_TEXTURE_TIER.MEDIUM) {
        plan.push(PAGE_TEXTURE_TIER.MEDIUM);
    } else {
        // Compatibility only: no new demand path selects low128.
        plan.push(PAGE_TEXTURE_TIER.LOW);
    }
    return plan;
}

export class TexturePageResidency {
    constructor({
        pages,
        mini = false,
        mediumEnterPx = 96,
        mediumExitPx = 72,
        highEnterPx = 512,
        hysteresis = 0.75,
    }) {
        this.mini = Boolean(mini);
        this.thresholds = { mediumEnterPx, mediumExitPx, highEnterPx, hysteresis };
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
                loading: new Set(),
                queued: new Set(),
                failed: new Set(),
                desiredTier: PAGE_TEXTURE_TIER.LOW,
                activeTier: null,
                classification: 'outside',
                projectedDiameterPx: 0,
                perceptibility: 0,
                _nextClassification: 'outside',
                _nextProjectedDiameterPx: 0,
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
            state._nextPerceptibility = 0;
        }
    }

    contribute(pageOrKey, {
        classification = 'outside',
        projectedDiameterPx = 0,
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
        state._nextPerceptibility = Math.max(
            state._nextPerceptibility,
            Number.isFinite(perceptibility) ? perceptibility : 0,
        );
        return state;
    }

    finishDemandPass({ highEnterPx = null } = {}) {
        const thresholds = highEnterPx === null
            ? this.thresholds
            : { ...this.thresholds, highEnterPx };
        for (const state of this.states.values()) {
            state.classification = state._nextClassification;
            state.projectedDiameterPx = state._nextProjectedDiameterPx;
            state.perceptibility = state._nextPerceptibility;
            state.desiredTier = desiredTextureTier(
                state,
                state.projectedDiameterPx,
                state.classification,
                thresholds,
            );
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
            // The retiring asset must stop being a selection candidate before
            // consumers are synchronously rebound. Disposal happens last and
            // exactly once, even when many materials share the page.
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
