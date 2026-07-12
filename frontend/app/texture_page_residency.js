// Pure state machine for shared square imagery pages.  GPU objects remain
// caller-owned values in `assets`; this module only owns page identity, demand,
// tier transitions, and the many-geometry-to-one-page consumer graph.

export const PAGE_TEXTURE_TIER = Object.freeze({
    LOW: 'low128',
    MEDIUM: 'medium256',
    HIGH: 'high4096',
});

export const PAGE_TEXTURE_RANK = Object.freeze({
    [PAGE_TEXTURE_TIER.LOW]: 0,
    [PAGE_TEXTURE_TIER.MEDIUM]: 1,
    [PAGE_TEXTURE_TIER.HIGH]: 2,
});

function tierIsTerminal(state, tier) {
    return Boolean(state?.assets?.has(tier) || state?.failed?.has(tier));
}

// The postage tier is the coverage floor: on a cold start every page reaches
// either resident or terminal-failure state before an upgrade consumes a
// texture-worker slot.  Keeping this decision pure makes the network dispatch
// order deterministic and independently testable.
export function lowTextureCoveragePending(states) {
    const values = states instanceof Map ? states.values() : (states || []);
    for (const state of values) {
        if (!tierIsTerminal(state, PAGE_TEXTURE_TIER.LOW)) return true;
    }
    return false;
}

export function selectTextureDispatchTaskIndex(queue, states, {
    isMoving = false,
    lowCoverageFirst = false,
} = {}) {
    const lowBarrier = lowCoverageFirst && lowTextureCoveragePending(states);
    let selectedIndex = -1;
    let selectedPriority = -Infinity;
    for (let index = 0; index < (queue || []).length; index++) {
        const task = queue[index];
        if (!task) continue;
        if (isMoving && task.tier === PAGE_TEXTURE_TIER.HIGH) continue;
        if (lowBarrier && task.tier !== PAGE_TEXTURE_TIER.LOW) continue;
        const priority = Number.isFinite(task.priority) ? task.priority : 0;
        if (selectedIndex < 0 || priority > selectedPriority) {
            selectedIndex = index;
            selectedPriority = priority;
        }
    }
    return selectedIndex;
}

const CLASS_RANK = Object.freeze({ outside: 0, guard: 1, visible: 2 });

function desiredTier(state, projectedDiameterPx, classification, thresholds) {
    if (classification === 'outside') return PAGE_TEXTURE_TIER.LOW;
    const previous = state.desiredTier || PAGE_TEXTURE_TIER.LOW;
    const highExit = thresholds.highEnterPx * thresholds.hysteresis;
    if (classification === 'visible') {
        if (previous === PAGE_TEXTURE_TIER.HIGH && projectedDiameterPx >= highExit) {
            return PAGE_TEXTURE_TIER.HIGH;
        }
        if (projectedDiameterPx >= thresholds.highEnterPx) return PAGE_TEXTURE_TIER.HIGH;
    }
    if (previous !== PAGE_TEXTURE_TIER.LOW && projectedDiameterPx >= thresholds.mediumExitPx) {
        return PAGE_TEXTURE_TIER.MEDIUM;
    }
    if (projectedDiameterPx >= thresholds.mediumEnterPx) return PAGE_TEXTURE_TIER.MEDIUM;
    return PAGE_TEXTURE_TIER.LOW;
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
            state.desiredTier = desiredTier(
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

    dropAsset(pageOrKey, tier, replacement, { rebind = () => {}, dispose = () => {} } = {}) {
        const state = this.state(pageOrKey);
        if (!state) return false;
        const asset = state.assets.get(tier);
        if (!asset) return true;
        if (state.activeTier === tier) {
            if (!replacement) return false;
            // The retiring asset must stop being a selection candidate before
            // consumers are synchronously rebound. Disposal happens last and
            // exactly once, even when many materials share the page.
            state.assets.delete(tier);
            state.activeTier = replacement[0];
            rebind(state);
        } else {
            state.assets.delete(tier);
        }
        dispose(asset);
        return true;
    }
}
