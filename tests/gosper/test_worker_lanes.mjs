import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '../..');
const source = fs.readFileSync(path.join(root, 'frontend/app/worker_lanes.js'), 'utf8');
const lanes = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

assert.equal(lanes.workerLaneForJob('LOAD_TEXTURE'), lanes.WORKER_LANE.TEXTURE);
for (const type of ['LOAD_TILE', 'BUILD_GEOMETRY']) {
    assert.equal(lanes.workerLaneForJob(type), lanes.WORKER_LANE.GEOMETRY);
}
for (const hardware of [1, 2, 4, 8, 64]) {
    const sizes = lanes.workerLaneSizes(hardware);
    assert.ok(sizes.geometry >= 2 && sizes.geometry <= 6);
    assert.ok(sizes.texture >= 1 && sizes.texture <= 2);
}

const cancelled = [];
const current = lanes.cancelStaleViewTasks([
    { key: 'old-texture', epoch: 3 },
    { key: 'new-texture', epoch: 4 },
    { key: 'old-geometry', epoch: 2 },
], 4, task => cancelled.push(task.key));
assert.deepEqual(current.map(task => task.key), ['new-texture']);
assert.deepEqual(cancelled, ['old-texture', 'old-geometry']);

const queue = [
    { key: 'background', epoch: 7, priority: 1, enqueuedSequence: 0 },
    { key: 'visible', epoch: 7, priority: 1e9, enqueuedSequence: 8 },
    { key: 'stale', epoch: 6, priority: Infinity, enqueuedSequence: 0 },
];
assert.equal(lanes.selectAgedPriorityIndex(queue, { epoch: 7, dispatchSequence: 7 }), 1);
assert.equal(lanes.selectAgedPriorityIndex(queue, { epoch: 7, dispatchSequence: 16 }), 0);

const main = fs.readFileSync(path.join(root, 'frontend/app/main.js'), 'utf8');
const worker = fs.readFileSync(path.join(root, 'frontend/app/tile_worker.js'), 'utf8');
assert.match(main, /workerLanes\[job\.lane\]/);
assert.match(main, /Math\.min\(maxConcurrent, TEXTURE_CONFIG\.maxTextureJobs\)/);
assert.match(main, /dispatchSequence:\s*this\.textureDispatchSequence/);
assert.match(worker, /data\.prewarmBasis/);
assert.match(main, /decoderCap:\s*MAX_TEXTURE_DECODERS/);

console.log('dedicated worker lanes, decoder cap, aging, and view cancellation: ok');
