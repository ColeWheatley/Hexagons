import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const source = await fs.readFile(path.join(ROOT, 'frontend/app/fetch_retry.js'), 'utf8');
const context = vm.createContext({ setTimeout, Math, Error });
const module = new vm.SourceTextModule(source, { context });
await module.link(() => { throw new Error('fetch_retry must stay dependency-free'); });
await module.evaluate();

const {
    ResourceRetryScheduler,
    ResweepScheduler,
    backoffDelayMs,
} = module.namespace;

const slept = [];
let calls = 0;
const scheduler = new ResourceRetryScheduler({
    random: () => 0.5,
    sleep: async ms => slept.push(ms),
});
const result = await scheduler.run('tile:1_2', async () => {
    calls++;
    if (calls < 3) throw new Error(`fail ${calls}`);
    return 'ok';
});
assert.equal(result, 'ok');
assert.equal(calls, 3);
assert.deepEqual(slept, [1000, 4000]);
const resetSnapshot = scheduler.snapshot('tile:1_2');
assert.equal(resetSnapshot.attempts, 0);
assert.equal(resetSnapshot.exhausted, false);
assert.equal(resetSnapshot.lastError, null);

const exhausted = new ResourceRetryScheduler({
    random: () => 0.5,
    sleep: async () => {},
});
await assert.rejects(
    exhausted.run('texture:page/high', async () => {
        throw new Error('still gone');
    }),
    /still gone/,
);
assert.equal(exhausted.snapshot('texture:page/high').attempts, 3);
assert.equal(exhausted.snapshot('texture:page/high').exhausted, true);

let secondCallAttempts = 0;
await assert.rejects(
    exhausted.run('texture:page/high', async () => {
        secondCallAttempts++;
    }),
    /still gone/,
);
assert.equal(secondCallAttempts, 0, 'exhausted resource budget is shared across callsites');
exhausted.reset('texture:page/high');
await assert.rejects(
    exhausted.run('texture:page/high', async () => {
        secondCallAttempts++;
        throw new Error('fresh budget');
    }),
    /fresh budget/,
);
assert.equal(secondCallAttempts, 3);

assert.equal(backoffDelayMs(1, { jitterRatio: 0.25, random: () => 0 }), 750);
assert.equal(backoffDelayMs(1, { jitterRatio: 0.25, random: () => 1 }), 1250);
assert.equal(backoffDelayMs(3, { jitterRatio: 0, random: () => 0 }), 9000);

const scheduled = [];
const resweep = new ResweepScheduler({ onSchedule: event => scheduled.push(event.kind) });
assert.equal(resweep.schedule('tiles'), true);
assert.equal(resweep.schedule('tiles'), false, 'only one pending sweep per kind');
assert.equal(resweep.schedule('textures'), true);
assert.deepEqual(scheduled, ['tiles', 'textures']);
assert.deepEqual([...resweep.consumeAll()], ['tiles', 'textures']);
assert.equal(resweep.schedule('tiles'), true, 'consuming allows a later recovery sweep');

console.log('fetch retry scheduler: ok');
