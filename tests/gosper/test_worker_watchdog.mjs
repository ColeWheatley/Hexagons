import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const source = await fs.readFile(path.join(ROOT, 'frontend/app/worker_watchdog.js'), 'utf8');
const context = vm.createContext({ performance: { now: () => 0 } });
const module = new vm.SourceTextModule(source, { context });
await module.link(() => { throw new Error('worker_watchdog must stay dependency-free'); });
await module.evaluate();

const { WorkerWatchdogBookkeeper } = module.namespace;

const watchdog = new WorkerWatchdogBookkeeper({ timeoutMs: 30000, maxTimeouts: 2, now: () => 0 });
watchdog.track(7, 1, { type: 'LOAD_TILE', key: '1_2' }, 100);
assert.equal(watchdog.expired(30099).length, 0);
assert.deepEqual(Array.from(watchdog.expired(30100), job => job.id), [7]);
assert.equal(watchdog.timeUntilNextDeadline(100), 30000);
assert.equal(watchdog.timeUntilNextDeadline(30101), 0);

const firstTimeout = watchdog.recordTimeout(7);
assert.equal(firstTimeout.shouldFail, false);
assert.equal(firstTimeout.timeouts, 1);
watchdog.requeue(7, 2, 40000);
assert.equal(watchdog.expired(69999).length, 0);
assert.deepEqual(Array.from(watchdog.expired(70000), job => job.workerIndex), [2]);

const secondTimeout = watchdog.recordTimeout(7);
assert.equal(secondTimeout.shouldFail, true, 'a job that kills workers twice is terminal');
assert.equal(secondTimeout.timeouts, 2);
assert.equal(watchdog.complete(7), true);
assert.equal(watchdog.timeUntilNextDeadline(70000), null);

const quiet = new WorkerWatchdogBookkeeper({ timeoutMs: 5, maxTimeouts: 2, now: () => 0 });
quiet.track(1, 0, {}, 0);
quiet.complete(1);
assert.equal(quiet.expired(10).length, 0, 'completed jobs cannot time out later');

console.log('worker watchdog bookkeeping: ok');
