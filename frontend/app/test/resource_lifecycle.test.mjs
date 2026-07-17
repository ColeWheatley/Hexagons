import test from 'node:test';
import assert from 'node:assert/strict';
import {
    RESOURCE_LIFECYCLE,
    IllegalResourceTransitionError,
    ResourceLifecycle,
    ResourceLifecycleRegistry,
    ResourceTransitionCancelledError,
} from '../resource_lifecycle.mjs';

const S = RESOURCE_LIFECYCLE;

test('a resource follows boot -> ready -> refining -> settled', () => {
    const resource = new ResourceLifecycle('geometry', '280_-239');
    resource.transition(S.READY);
    resource.transition(S.REFINING);
    resource.transition(S.SETTLED);
    assert.deepEqual(resource.snapshot(), {
        kind: 'geometry', key: '280_-239', state: S.SETTLED, epoch: 3,
    });
});

test('degraded and offline resources have an explicit retry path', () => {
    for (const failedState of [S.DEGRADED, S.OFFLINE]) {
        const resource = new ResourceLifecycle('texture', failedState);
        resource.transition(failedState);
        resource.transition(S.RETRYING);
        resource.transition(S.BOOTING);
        resource.transition(S.READY);
        assert.equal(resource.state, S.READY);
    }
});

test('context loss emits recovered before resuming every resource state', () => {
    const events = [];
    const registry = new ResourceLifecycleRegistry({
        onTransition: event => events.push(`${event.key}:${event.to}`),
    });
    registry.settled('geometry', 'g1');
    registry.refining('texture', 't1');
    registry.contextLost({ cause: 'test' });
    registry.recovered({ cause: 'test' });
    assert.equal(registry.get('geometry', 'g1').state, S.SETTLED);
    assert.equal(registry.get('texture', 't1').state, S.REFINING);
    assert.deepEqual(events.filter(event => event.endsWith(`:${S.RECOVERED}`)), [
        'g1:recovered', 't1:recovered',
    ]);
});

test('context recovery resumes an in-flight retry without violating the state machine', () => {
    const registry = new ResourceLifecycleRegistry();
    registry.retrying('texture', '59_202/high4096', { cause: 'request-retry' });
    registry.contextLost({ cause: 'test' });
    registry.recovered({ cause: 'test' });
    assert.equal(registry.get('texture', '59_202/high4096').state, S.RETRYING);
});

test('leaving a resource state cancels its owned scope', () => {
    const resource = new ResourceLifecycle('manifest', 'tile_manifest.json');
    const boot = resource.current();
    resource.transition(S.READY);
    assert.equal(boot.signal.aborted, true);
    assert.ok(boot.signal.reason instanceof ResourceTransitionCancelledError);
    assert.equal(resource.isCurrent(boot), false);
});

test('illegal transitions fail without mutating or cancelling the resource', () => {
    const resource = new ResourceLifecycle('geometry', 'g1');
    const boot = resource.current();
    assert.throws(
        () => resource.transition(S.SETTLED),
        error => error instanceof IllegalResourceTransitionError &&
            error.kind === 'geometry' && error.key === 'g1' &&
            error.from === S.BOOTING && error.to === S.SETTLED,
    );
    assert.equal(resource.state, S.BOOTING);
    assert.equal(boot.signal.aborted, false);
});

test('registry helpers retain strict transitions while handling repeated refinement', () => {
    const registry = new ResourceLifecycleRegistry();
    registry.begin('texture', 'page');
    registry.ready('texture', 'page');
    registry.settled('texture', 'page');
    registry.refining('texture', 'page');
    registry.settled('texture', 'page');
    registry.retrying('texture', 'page');
    registry.begin('texture', 'page');
    assert.equal(registry.get('texture', 'page').state, S.BOOTING);
});
