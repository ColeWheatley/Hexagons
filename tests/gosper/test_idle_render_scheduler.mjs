// Deterministic AA-8 sleep/wake scheduler contract.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const filename = path.join(ROOT, 'frontend/app/idle_render_scheduler.js');
const source = await fs.readFile(filename, 'utf8');
const module = new vm.SourceTextModule(source, { context: vm.createContext({}), identifier: filename });
await module.link(() => { throw new Error('scheduler must have no imports'); });
await module.evaluate();
const { IdleRenderScheduler } = module.namespace;

let clock = 0;
let nextId = 1;
const rafs = new Map();
const timers = new Map();
const listeners = new Map();
const fakeDocument = {
    visibilityState: 'visible',
    addEventListener(name, fn) { listeners.set(name, fn); },
    removeEventListener(name) { listeners.delete(name); },
};
const scheduler = new IdleRenderScheduler({
    requestAnimationFrame(fn) { const id = nextId++; rafs.set(id, fn); return id; },
    cancelAnimationFrame(id) { rafs.delete(id); },
    setTimeout(fn, delay) { const id = nextId++; timers.set(id, { fn, at: clock + delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    document: fakeDocument,
    now: () => clock,
    frame: () => ({ active: false }),
});
const runRaf = () => {
    const jobs = [...rafs.values()]; rafs.clear();
    for (const fn of jobs) fn(clock);
};
const runTimers = () => {
    const due = [...timers.entries()].filter(([, timer]) => timer.at <= clock);
    for (const [id, timer] of due) { timers.delete(id); timer.fn(); }
};

scheduler.start();
assert.equal(rafs.size, 1, 'start wakes exactly one frame');
runRaf();
assert.equal(rafs.size, 0, 'settled frame sleeps with no polling rAF');
assert.equal(timers.size, 0, 'settled frame does not install a polling timer');

// A 2 s quiet interval has zero renders and zero scheduler callbacks.
clock += 2000;
runTimers();
assert.equal(rafs.size, 0);

scheduler.wakeAfter(300, 'settle');
assert.equal(timers.size, 1, 'motion uses one explicit settle deadline');
clock += 299; runTimers(); assert.equal(rafs.size, 0);
clock += 1; runTimers(); assert.equal(rafs.size, 1, 'deadline wakes within the next frame');
runRaf();

fakeDocument.visibilityState = 'hidden';
listeners.get('visibilitychange')();
scheduler.wake('worker-complete');
scheduler.wakeAfter(1, 'retry');
clock += 1000; runTimers();
assert.equal(rafs.size, 0, 'hidden documents schedule no render work');

fakeDocument.visibilityState = 'visible';
listeners.get('visibilitychange')();
assert.equal(rafs.size, 1, 'visible transition resumes pending loading on one frame');
runRaf();
scheduler.stop();
assert.equal(listeners.size, 0, 'stop removes visibility listener');
console.log('idle render scheduler: ok');
