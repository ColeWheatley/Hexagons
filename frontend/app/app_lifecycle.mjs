// Application readiness and recovery state are deliberately separate from the
// per-frame render/LOD state in main.js. Each entered state owns an AbortSignal;
// leaving the state aborts that signal so asynchronous work can never commit
// after a newer lifecycle decision has won.
export const APP_LIFECYCLE = Object.freeze({
    BOOTING: 'booting',
    READY: 'ready',
    REFINING: 'refining',
    SETTLED: 'settled',
    DEGRADED: 'degraded',
    OFFLINE: 'offline',
    RETRYING: 'retrying',
    CONTEXT_LOST: 'context-lost',
    RECOVERING: 'recovering',
});

const S = APP_LIFECYCLE;
const TRANSITIONS = new Map([
    [S.BOOTING, new Set([S.READY, S.DEGRADED, S.OFFLINE, S.CONTEXT_LOST])],
    [S.READY, new Set([S.REFINING, S.SETTLED, S.DEGRADED, S.OFFLINE, S.RETRYING, S.CONTEXT_LOST])],
    [S.REFINING, new Set([S.SETTLED, S.DEGRADED, S.OFFLINE, S.RETRYING, S.CONTEXT_LOST])],
    [S.SETTLED, new Set([S.REFINING, S.DEGRADED, S.OFFLINE, S.RETRYING, S.CONTEXT_LOST])],
    [S.DEGRADED, new Set([S.RETRYING, S.OFFLINE, S.CONTEXT_LOST])],
    [S.OFFLINE, new Set([S.RETRYING, S.DEGRADED, S.CONTEXT_LOST])],
    [S.RETRYING, new Set([S.BOOTING, S.DEGRADED, S.OFFLINE, S.CONTEXT_LOST])],
    [S.CONTEXT_LOST, new Set([S.RECOVERING, S.RETRYING])],
    [S.RECOVERING, new Set([
        S.BOOTING,
        S.READY,
        S.REFINING,
        S.SETTLED,
        S.DEGRADED,
        S.OFFLINE,
        S.CONTEXT_LOST,
    ])],
]);

export class IllegalLifecycleTransitionError extends Error {
    constructor(from, to) {
        super(`Illegal application lifecycle transition: ${from} -> ${to}`);
        this.name = 'IllegalLifecycleTransitionError';
        this.from = from;
        this.to = to;
    }
}

export class LifecycleTransitionCancelledError extends Error {
    constructor(from, to, epoch) {
        super(`Application lifecycle ${from} epoch ${epoch} cancelled by ${to}`);
        this.name = 'LifecycleTransitionCancelledError';
        this.from = from;
        this.to = to;
        this.epoch = epoch;
    }
}

export class AppLifecycle {
    constructor({ initialState = S.BOOTING, onTransition = null } = {}) {
        if (!TRANSITIONS.has(initialState)) {
            throw new TypeError(`Unknown initial application lifecycle state: ${initialState}`);
        }
        this.state = initialState;
        this.epoch = 0;
        this.controller = new AbortController();
        this.onTransition = onTransition;
    }

    canTransition(nextState) {
        return this.state === nextState || !!TRANSITIONS.get(this.state)?.has(nextState);
    }

    current() {
        const state = this.state;
        const epoch = this.epoch;
        const signal = this.controller.signal;
        return Object.freeze({ state, epoch, signal });
    }

    isCurrent(scope) {
        return !!scope &&
            scope.state === this.state &&
            scope.epoch === this.epoch &&
            scope.signal === this.controller.signal &&
            !scope.signal.aborted;
    }

    transition(nextState, detail = null) {
        if (nextState === this.state) return this.current();
        if (!this.canTransition(nextState)) {
            throw new IllegalLifecycleTransitionError(this.state, nextState);
        }

        const from = this.state;
        const previousEpoch = this.epoch;
        this.controller.abort(new LifecycleTransitionCancelledError(from, nextState, previousEpoch));
        this.state = nextState;
        this.epoch++;
        this.controller = new AbortController();
        const scope = this.current();
        this.onTransition?.({ from, to: nextState, epoch: this.epoch, detail, scope });
        return scope;
    }

    snapshot() {
        return Object.freeze({ state: this.state, epoch: this.epoch });
    }
}
