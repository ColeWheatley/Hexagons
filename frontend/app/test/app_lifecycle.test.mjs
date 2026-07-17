import test from 'node:test';
import assert from 'node:assert/strict';
import {
    APP_LIFECYCLE,
    AppLifecycle,
    IllegalLifecycleTransitionError,
    LifecycleTransitionCancelledError,
} from '../app_lifecycle.mjs';

const S = APP_LIFECYCLE;

test('boot, readiness, refinement, and settlement are explicit transitions', () => {
    const transitions = [];
    const lifecycle = new AppLifecycle({
        onTransition: event => transitions.push(`${event.from}->${event.to}`),
    });

    lifecycle.transition(S.READY);
    lifecycle.transition(S.REFINING);
    lifecycle.transition(S.SETTLED);

    assert.deepEqual(transitions, [
        'booting->ready',
        'ready->refining',
        'refining->settled',
    ]);
    assert.deepEqual(lifecycle.snapshot(), { state: S.SETTLED, epoch: 3 });
});

test('each transition cancels the scope owned by the state being left', () => {
    const lifecycle = new AppLifecycle();
    const boot = lifecycle.current();
    const ready = lifecycle.transition(S.READY);

    assert.equal(boot.signal.aborted, true);
    assert.ok(boot.signal.reason instanceof LifecycleTransitionCancelledError);
    assert.equal(boot.signal.reason.from, S.BOOTING);
    assert.equal(boot.signal.reason.to, S.READY);
    assert.equal(lifecycle.isCurrent(boot), false);
    assert.equal(lifecycle.isCurrent(ready), true);
});

test('illegal transitions fail without cancelling the current scope', () => {
    const lifecycle = new AppLifecycle();
    const boot = lifecycle.current();

    assert.throws(
        () => lifecycle.transition(S.SETTLED),
        error => error instanceof IllegalLifecycleTransitionError &&
            error.from === S.BOOTING && error.to === S.SETTLED,
    );
    assert.equal(boot.signal.aborted, false);
    assert.equal(lifecycle.isCurrent(boot), true);
});

test('degraded and offline startup failures have a deterministic retry path', () => {
    for (const failureState of [S.DEGRADED, S.OFFLINE]) {
        const lifecycle = new AppLifecycle();
        lifecycle.transition(failureState);
        lifecycle.transition(S.RETRYING);
        lifecycle.transition(S.BOOTING);
        assert.equal(lifecycle.state, S.BOOTING);
    }
});

test('context recovery can resume every live readiness state', () => {
    for (const resumeState of [S.BOOTING, S.READY, S.REFINING, S.SETTLED]) {
        const lifecycle = new AppLifecycle();
        if (resumeState !== S.BOOTING) {
            lifecycle.transition(S.READY);
            if (resumeState === S.REFINING) lifecycle.transition(S.REFINING);
            if (resumeState === S.SETTLED) lifecycle.transition(S.SETTLED);
        }
        lifecycle.transition(S.CONTEXT_LOST);
        lifecycle.transition(S.RECOVERING);
        lifecycle.transition(resumeState);
        assert.equal(lifecycle.state, resumeState);
    }
});

test('refinement may resume after a settled scene becomes busy again', () => {
    const lifecycle = new AppLifecycle();
    lifecycle.transition(S.READY);
    lifecycle.transition(S.REFINING);
    lifecycle.transition(S.SETTLED);
    lifecycle.transition(S.REFINING);
    assert.equal(lifecycle.state, S.REFINING);
});
