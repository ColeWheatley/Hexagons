import test from 'node:test';
import assert from 'node:assert/strict';
import {
    DEV_MODE_STORAGE_KEY,
    resolveDevMode,
    isDevToggleKey,
    shouldIgnoreToggleTarget,
} from '../dev/dev_mode_policy.mjs';

test('DEV_MODE_STORAGE_KEY is the stable localStorage key', () => {
    assert.equal(DEV_MODE_STORAGE_KEY, 'hexagons:devMode');
});

test('resolveDevMode: URL/localStorage precedence table', () => {
    const cases = [
        // [search, stored, expectedEnabled, expectedPersist]
        ['?dev=1', '1', true, '1'],
        ['?dev=1', '0', true, '1'],
        ['?dev=1', null, true, '1'],
        ['?dev=true', null, true, '1'],
        ['?dev=on', null, true, '1'],
        ['?dev=0', '1', false, '0'],
        ['?dev=0', '0', false, '0'],
        ['?dev=0', null, false, '0'],
        ['?dev=false', '1', false, '0'],
        ['?dev=off', '1', false, '0'],
        // Garbage dev param falls through to the same "absent" behavior.
        ['?dev=nonsense', '1', true, null],
        ['?dev=nonsense', '0', false, null],
        ['?dev=nonsense', null, false, null],
        // Absent dev param.
        ['', '1', true, null],
        ['', '0', false, null],
        ['', null, false, null],
        ['?other=param', '1', true, null],
        ['?other=param', null, false, null],
        // Case-insensitive on-values.
        ['?dev=TRUE', null, true, '1'],
        ['?dev=ON', null, true, '1'],
        ['?dev=OFF', null, false, '0'],
    ];

    for (const [search, stored, expectedEnabled, expectedPersist] of cases) {
        const result = resolveDevMode(search, stored);
        assert.deepEqual(
            result,
            { enabled: expectedEnabled, persist: expectedPersist },
            `resolveDevMode(${JSON.stringify(search)}, ${JSON.stringify(stored)})`,
        );
    }
});

test('resolveDevMode tolerates a missing leading "?" and undefined search', () => {
    assert.deepEqual(resolveDevMode('dev=1', null), { enabled: true, persist: '1' });
    assert.deepEqual(resolveDevMode(undefined, '1'), { enabled: true, persist: null });
});

test('isDevToggleKey: plain Backquote with no modifiers is the toggle', () => {
    assert.equal(isDevToggleKey({ code: 'Backquote' }), true);
    assert.equal(
        isDevToggleKey({ code: 'Backquote', ctrlKey: false, altKey: false, metaKey: false, shiftKey: false }),
        true,
    );
});

test('isDevToggleKey: any modifier held disqualifies the hotkey', () => {
    assert.equal(isDevToggleKey({ code: 'Backquote', ctrlKey: true }), false);
    assert.equal(isDevToggleKey({ code: 'Backquote', altKey: true }), false);
    assert.equal(isDevToggleKey({ code: 'Backquote', metaKey: true }), false);
    assert.equal(isDevToggleKey({ code: 'Backquote', shiftKey: true }), false);
});

test('isDevToggleKey: other keys and missing events are never the toggle', () => {
    assert.equal(isDevToggleKey({ code: 'KeyA' }), false);
    assert.equal(isDevToggleKey({ code: 'Digit1' }), false);
    assert.equal(isDevToggleKey(null), false);
    assert.equal(isDevToggleKey(undefined), false);
});

test('shouldIgnoreToggleTarget: editable targets are ignored', () => {
    assert.equal(shouldIgnoreToggleTarget({ tagName: 'INPUT' }), true);
    assert.equal(shouldIgnoreToggleTarget({ tagName: 'TEXTAREA' }), true);
    assert.equal(shouldIgnoreToggleTarget({ tagName: 'SELECT' }), true);
    assert.equal(shouldIgnoreToggleTarget({ tagName: 'DIV', isContentEditable: true }), true);
});

test('shouldIgnoreToggleTarget: non-editable targets and null are not ignored', () => {
    assert.equal(shouldIgnoreToggleTarget({ tagName: 'DIV' }), false);
    assert.equal(shouldIgnoreToggleTarget({ tagName: 'BODY' }), false);
    assert.equal(shouldIgnoreToggleTarget(null), false);
    assert.equal(shouldIgnoreToggleTarget(undefined), false);
});
