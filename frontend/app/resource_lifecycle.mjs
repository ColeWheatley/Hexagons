// Explicit lifecycle for independently retried resources (manifest, terrain
// geometry, and texture pages).  Render/LOD state remains caller-owned; this
// module owns only legal loading/recovery transitions and cancellation epochs.
export const RESOURCE_LIFECYCLE = Object.freeze({
    BOOTING: 'booting',
    READY: 'ready',
    REFINING: 'refining',
    SETTLED: 'settled',
    DEGRADED: 'degraded',
    OFFLINE: 'offline',
    RETRYING: 'retrying',
    CONTEXT_LOST: 'context-lost',
    RECOVERED: 'recovered',
});

const S = RESOURCE_LIFECYCLE;
const TRANSITIONS = new Map([
    [S.BOOTING, new Set([S.READY, S.RETRYING, S.DEGRADED, S.OFFLINE, S.CONTEXT_LOST])],
    [S.READY, new Set([S.REFINING, S.SETTLED, S.RETRYING, S.DEGRADED, S.OFFLINE, S.CONTEXT_LOST])],
    [S.REFINING, new Set([S.READY, S.SETTLED, S.RETRYING, S.DEGRADED, S.OFFLINE, S.CONTEXT_LOST])],
    [S.SETTLED, new Set([S.REFINING, S.RETRYING, S.DEGRADED, S.OFFLINE, S.CONTEXT_LOST])],
    [S.DEGRADED, new Set([S.RETRYING, S.OFFLINE, S.CONTEXT_LOST])],
    [S.OFFLINE, new Set([S.RETRYING, S.DEGRADED, S.CONTEXT_LOST])],
    [S.RETRYING, new Set([S.BOOTING, S.REFINING, S.DEGRADED, S.OFFLINE, S.CONTEXT_LOST])],
    [S.CONTEXT_LOST, new Set([S.RECOVERED])],
    [S.RECOVERED, new Set([
        S.BOOTING, S.READY, S.REFINING, S.SETTLED, S.DEGRADED, S.OFFLINE, S.CONTEXT_LOST,
    ])],
]);

export class IllegalResourceTransitionError extends Error {
    constructor(kind, key, from, to) {
        super(`Illegal ${kind} resource transition for ${key}: ${from} -> ${to}`);
        this.name = 'IllegalResourceTransitionError';
        Object.assign(this, { kind, key, from, to });
    }
}

export class ResourceTransitionCancelledError extends Error {
    constructor(kind, key, from, to, epoch) {
        super(`${kind} resource ${key} epoch ${epoch} cancelled by ${from} -> ${to}`);
        this.name = 'ResourceTransitionCancelledError';
        Object.assign(this, { kind, key, from, to, epoch });
    }
}

export class ResourceLifecycle {
    constructor(kind, key, { initialState = S.BOOTING, onTransition = null } = {}) {
        if (!kind || !key) throw new TypeError('resource kind and key are required');
        if (!TRANSITIONS.has(initialState)) throw new TypeError(`Unknown resource lifecycle state: ${initialState}`);
        this.kind = kind;
        this.key = key;
        this.state = initialState;
        this.epoch = 0;
        this.controller = new AbortController();
        this.onTransition = onTransition;
        this.history = [];
    }

    canTransition(nextState) {
        return this.state === nextState || Boolean(TRANSITIONS.get(this.state)?.has(nextState));
    }

    current() {
        return Object.freeze({
            kind: this.kind, key: this.key, state: this.state,
            epoch: this.epoch, signal: this.controller.signal,
        });
    }

    isCurrent(scope) {
        return Boolean(scope) && scope.kind === this.kind && scope.key === this.key &&
            scope.state === this.state && scope.epoch === this.epoch &&
            scope.signal === this.controller.signal && !scope.signal.aborted;
    }

    transition(nextState, detail = null) {
        if (nextState === this.state) return this.current();
        if (!this.canTransition(nextState)) {
            throw new IllegalResourceTransitionError(this.kind, this.key, this.state, nextState);
        }
        const from = this.state;
        this.controller.abort(new ResourceTransitionCancelledError(
            this.kind, this.key, from, nextState, this.epoch,
        ));
        this.state = nextState;
        this.epoch++;
        this.controller = new AbortController();
        const event = Object.freeze({
            kind: this.kind, key: this.key, from, to: nextState,
            epoch: this.epoch, detail,
        });
        this.history.push(event);
        if (this.history.length > 32) this.history.shift();
        this.onTransition?.(event);
        return this.current();
    }

    snapshot() {
        return Object.freeze({ kind: this.kind, key: this.key, state: this.state, epoch: this.epoch });
    }
}

export class ResourceLifecycleRegistry {
    constructor({ onTransition = null } = {}) {
        this.entries = new Map();
        this.onTransition = onTransition;
        this.contextResumeStates = new Map();
    }

    identity(kind, key) { return `${kind}:${key}`; }

    ensure(kind, key, options = {}) {
        const identity = this.identity(kind, key);
        let lifecycle = this.entries.get(identity);
        if (!lifecycle) {
            lifecycle = new ResourceLifecycle(kind, key, {
                ...options,
                onTransition: event => this.onTransition?.(event),
            });
            this.entries.set(identity, lifecycle);
        }
        return lifecycle;
    }

    get(kind, key) { return this.entries.get(this.identity(kind, key)) || null; }
    delete(kind, key) { return this.entries.delete(this.identity(kind, key)); }

    begin(kind, key, detail = null, options = {}) {
        const lifecycle = this.ensure(kind, key, options);
        if (lifecycle.state === S.CONTEXT_LOST) return lifecycle.current();
        if (lifecycle.state === S.RETRYING || lifecycle.state === S.RECOVERED) {
            lifecycle.transition(S.BOOTING, detail);
        } else if (lifecycle.state === S.READY || lifecycle.state === S.SETTLED) {
            lifecycle.transition(S.REFINING, detail);
        }
        return lifecycle.current();
    }

    ready(kind, key, detail = null) {
        const lifecycle = this.ensure(kind, key);
        if (lifecycle.state === S.RETRYING) lifecycle.transition(S.BOOTING, detail);
        if (lifecycle.state === S.BOOTING || lifecycle.state === S.REFINING) {
            lifecycle.transition(S.READY, detail);
        }
        return lifecycle.current();
    }

    refining(kind, key, detail = null, options = {}) {
        const lifecycle = this.ensure(kind, key, options);
        if (lifecycle.state === S.RETRYING) lifecycle.transition(S.REFINING, detail);
        else if (lifecycle.state === S.BOOTING) {
            lifecycle.transition(S.READY, detail);
            lifecycle.transition(S.REFINING, detail);
        } else if (lifecycle.state === S.READY || lifecycle.state === S.SETTLED) {
            lifecycle.transition(S.REFINING, detail);
        }
        return lifecycle.current();
    }

    settled(kind, key, detail = null) {
        const lifecycle = this.ensure(kind, key);
        if (lifecycle.state === S.BOOTING) lifecycle.transition(S.READY, detail);
        if (lifecycle.state === S.READY || lifecycle.state === S.REFINING) {
            lifecycle.transition(S.SETTLED, detail);
        }
        return lifecycle.current();
    }

    retrying(kind, key, detail = null) {
        const lifecycle = this.ensure(kind, key);
        if (lifecycle.state === S.CONTEXT_LOST) return lifecycle.current();
        if (lifecycle.state !== S.RETRYING) lifecycle.transition(S.RETRYING, detail);
        return lifecycle.current();
    }

    failed(kind, key, { offline = false, detail = null } = {}) {
        const lifecycle = this.ensure(kind, key);
        if (lifecycle.state === S.CONTEXT_LOST) return lifecycle.current();
        const next = offline ? S.OFFLINE : S.DEGRADED;
        if (lifecycle.state !== next) lifecycle.transition(next, detail);
        return lifecycle.current();
    }

    contextLost(detail = null) {
        this.contextResumeStates.clear();
        for (const [identity, lifecycle] of this.entries) {
            if (lifecycle.state === S.CONTEXT_LOST) continue;
            this.contextResumeStates.set(identity, lifecycle.state);
            lifecycle.transition(S.CONTEXT_LOST, detail);
        }
    }

    recovered(detail = null) {
        for (const [identity, lifecycle] of this.entries) {
            if (lifecycle.state !== S.CONTEXT_LOST) continue;
            const resumeState = this.contextResumeStates.get(identity) || S.BOOTING;
            lifecycle.transition(S.RECOVERED, detail);
            lifecycle.transition(resumeState, detail);
        }
        this.contextResumeStates.clear();
    }

    snapshot() {
        const counts = Object.fromEntries(Object.values(S).map(state => [state, 0]));
        const resources = [];
        for (const lifecycle of this.entries.values()) {
            counts[lifecycle.state]++;
            resources.push(lifecycle.snapshot());
        }
        return Object.freeze({ counts: Object.freeze(counts), resources: Object.freeze(resources) });
    }
}
