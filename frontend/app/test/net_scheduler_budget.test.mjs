import test from 'node:test';
import assert from 'node:assert/strict';
import { NetScheduler, NET_PRIORITY } from '../net_scheduler.mjs';

test('budget is throughput times half a second plus TTFB, clamped to limits', () => {
    const scheduler = new NetScheduler({
        minBudgetBytes: 1000, maxBudgetBytes: 10000, initialThroughputBps: 4000,
    });
    assert.equal(scheduler.budgetBytes, 2000);
    scheduler.ttfbMs = 500;
    assert.equal(scheduler.budgetBytes, 4000);
    scheduler.throughputBps = 100;
    assert.equal(scheduler.budgetBytes, 1000);
    scheduler.throughputBps = 100000;
    assert.equal(scheduler.budgetBytes, 10000);
});

test('a 64 KiB visible request bypasses a full byte budget, background does not', async () => {
    const pending = [];
    const scheduler = new NetScheduler({
        minBudgetBytes: 1024 * 1024,
        maxBudgetBytes: 1024 * 1024,
        fetchImpl: url => new Promise(resolve => pending.push({ url, resolve })),
    });
    const full = scheduler.request({ url: 'full', expectedBytes: 1024 * 1024 });
    const tinyVisible = scheduler.request({
        url: 'visible', expectedBytes: 64 * 1024, priority: NET_PRIORITY.VISIBLE,
    });
    const tinyBackground = scheduler.request({
        url: 'background', expectedBytes: 64 * 1024, priority: NET_PRIORITY.BACKGROUND,
    });
    const overLimit = scheduler.request({
        url: 'over-limit', expectedBytes: 64 * 1024 + 1, priority: NET_PRIORITY.CRITICAL,
    });
    assert.deepEqual(pending.map(item => item.url), ['full', 'visible']);
    assert.deepEqual(scheduler.queue.map(item => item.url), ['background', 'over-limit']);

    scheduler.cancel(tinyBackground.handle);
    scheduler.cancel(overLimit.handle);
    await Promise.all([
        assert.rejects(tinyBackground.promise, { name: 'AbortError' }),
        assert.rejects(overLimit.promise, { name: 'AbortError' }),
    ]);
    for (const item of pending) item.resolve(new Response(new Uint8Array(0), { status: 200 }));
    await Promise.all([full.promise, tinyVisible.promise]);
    assert.equal(scheduler.inFlightBytes, 0);
});
