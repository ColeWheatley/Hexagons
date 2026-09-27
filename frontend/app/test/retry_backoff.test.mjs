import test from 'node:test';
import assert from 'node:assert/strict';
import { nextRetry, retryDelayMs, retryReady } from '../retry_backoff.mjs';

test('retry delay doubles from the first failure and caps per caller', () => {
    assert.deepEqual([1, 2, 3, 20].map(n => retryDelayMs(n, 2000, 300000)),
        [2000, 4000, 8000, 300000]);
    assert.deepEqual([1, 2, 10].map(n => retryDelayMs(n, 1000, 120000)),
        [1000, 2000, 120000]);
});

test('failed tile stays deferred until its deadline and success can reset the sequence', () => {
    const first = nextRetry(null, 10000, 1000, 120000);
    assert.deepEqual(first, { failures: 1, retryAt: 11000 });
    assert.equal(retryReady(first, 10999), false);
    assert.equal(retryReady(first, 11000), true);
    assert.deepEqual(nextRetry(first, 11000, 1000, 120000),
        { failures: 2, retryAt: 13000 });
    assert.deepEqual(nextRetry(null, 13000, 1000, 120000),
        { failures: 1, retryAt: 14000 });
});
