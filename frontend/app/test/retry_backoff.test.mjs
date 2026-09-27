import test from 'node:test';
import assert from 'node:assert/strict';
import { retryDelayMs } from '../retry_backoff.mjs';

test('retry delay doubles from the first failure and caps per caller', () => {
    assert.deepEqual([1, 2, 3, 20].map(n => retryDelayMs(n, 2000, 300000)),
        [2000, 4000, 8000, 300000]);
    assert.deepEqual([1, 2, 10].map(n => retryDelayMs(n, 1000, 120000)),
        [1000, 2000, 120000]);
});
