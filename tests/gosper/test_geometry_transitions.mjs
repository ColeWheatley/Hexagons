// Focused regressions for wheel-motion latching and deferred geometry races.
// Run with: node --experimental-vm-modules tests/gosper/test_geometry_transitions.mjs

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const filename = path.join(ROOT, 'frontend/app/geometry_transition_state.js');
const source = await fs.readFile(filename, 'utf8');
const context = vm.createContext({ console });
const module = new vm.SourceTextModule(source, { context, identifier: filename });
await module.link(() => { throw new Error('transition helper must have no imports'); });
await module.evaluate();

const {
    applyLodPauseTransition,
    CameraMotionLatch,
    cameraPoseChanged,
    MOVING_GEOMETRY_LEVELS,
    SETTLED_GEOMETRY_LEVELS,
    geometryBuildCanCommit,
    geometryLevelsForMode,
    shouldForceCoarseGeometry,
    shouldRefreshMotionFromControlsChange,
    writeCameraPose,
} = module.namespace;

// MapControls wheel may complete start/change/end before requestAnimationFrame.
// note() represents that synchronous burst: the following frame must still be
// moving, and only settles after a full quiet window.
const wheel = new CameraMotionLatch(200);
wheel.note(1000);
assert.equal(wheel.sample({ now: 1001 }), true);
assert.equal(wheel.sample({ now: 1200 }), true);
assert.equal(wheel.sample({ now: 1200.001 }), false);

// Wheel-only fallback: even if MapControls emits no start/change callback, the
// changed camera pose is observed before the next frame chooses display mode.
const poseCamera = {
    position: { x: 0, y: 1000, z: 0 },
    quaternion: { x: 0, y: 0, z: 0, w: 1 },
};
const poseTarget = { x: 0, y: 0, z: 0 };
const beforeWheelPose = writeCameraPose(poseCamera, poseTarget);
poseCamera.position.y = 900;
const afterWheelPose = writeCameraPose(poseCamera, poseTarget);
assert.equal(cameraPoseChanged(beforeWheelPose, afterWheelPose), true);
const wheelOnly = new CameraMotionLatch(300);
let wheelOnlyMoving = false;
if (cameraPoseChanged(beforeWheelPose, afterWheelPose)) {
    wheelOnlyMoving = wheelOnly.enterMotion(10, wheelOnlyMoving) || wheelOnlyMoving;
}
assert.equal(wheelOnlyMoving, true);
assert.deepEqual(Array.from(geometryLevelsForMode(wheelOnlyMoving, 3)), [5, 4, 3]);
assert.equal(shouldForceCoarseGeometry(wheelOnlyMoving, false), true);

// An idle pose never refreshes the latch. Internal floor/height rebasing is
// snapshotted after it runs, so the following idle frame also compares equal.
const idleObserved = new Float64Array(10);
writeCameraPose(poseCamera, poseTarget, idleObserved);
assert.equal(cameraPoseChanged(afterWheelPose, idleObserved), false);
poseCamera.position.y += 25; // internal terrain-anchor rebase
const afterInternalRebase = writeCameraPose(poseCamera, poseTarget);
writeCameraPose(poseCamera, poseTarget, idleObserved);
assert.equal(cameraPoseChanged(afterInternalRebase, idleObserved), false);
const idleLatch = new CameraMotionLatch(300);
assert.equal(idleLatch.sample({ now: 1000 }), false, 'idle pose must not re-latch motion');

const pan = new CameraMotionLatch(200);
assert.equal(pan.enterMotion(50, false), true);
assert.equal(pan.sample({ now: 50 }), true);
assert.equal(pan.sample({ now: 200 }), true);
assert.equal(pan.sample({ now: 251 }), false);

// Wheel start/change/end can be synchronous. Passive MapControls change noise
// after end must not refresh the deadline forever.
const wheelEvents = new CameraMotionLatch(200);
let wheelActive = true;
let wheelMoving = false;
let wheelEpoch = 0;
function notifyWheel(now) {
    if (wheelEvents.enterMotion(now, wheelMoving)) {
        wheelMoving = true;
        wheelEpoch++;
    }
}
notifyWheel(1000); // start
if (shouldRefreshMotionFromControlsChange(wheelActive)) notifyWheel(1005); // active change
wheelActive = false;
wheelEvents.note(1010); // end extends the latch
if (shouldRefreshMotionFromControlsChange(wheelActive)) notifyWheel(1150); // passive noise ignored
assert.equal(wheelEpoch, 1);
assert.equal(wheelEvents.sample({ now: 1210 }), true);
assert.equal(wheelEvents.sample({ now: 1210.001 }), false);

// A sustained drag does refresh while the gesture is active.
const drag = new CameraMotionLatch(200);
let dragMoving = false;
function notifyDrag(now) {
    const entered = drag.enterMotion(now, dragMoving);
    dragMoving = true;
    return entered;
}
assert.equal(notifyDrag(0), true); // start
assert.equal(shouldRefreshMotionFromControlsChange(true), true);
assert.equal(notifyDrag(150), false);
assert.equal(notifyDrag(300), false);
assert.equal(drag.sample({ now: 500 }), true);
assert.equal(drag.sample({ now: 500.001 }), false);

// Regression: an actual controls change happens between animation frames.
// Mode and epoch must change synchronously, before promise callbacks can
// dispatch high work, instantiate settled levels, or commit the old build.
const boundary = new CameraMotionLatch(200);
let movingBeforeRaf = false;
let geometryEpoch = 12;
function notifyProgrammaticMotion(now) {
    if (boundary.enterMotion(now, movingBeforeRaf)) {
        movingBeforeRaf = true;
        geometryEpoch++;
    }
}
// Explicit programmatic notification bypasses the inactive-change filter.
assert.equal(shouldRefreshMotionFromControlsChange(false), false);
notifyProgrammaticMotion(500);
assert.equal(movingBeforeRaf, true);
assert.equal(geometryEpoch, 13);
assert.deepEqual(
    Array.from(geometryLevelsForMode(movingBeforeRaf, 3)),
    Array.from(MOVING_GEOMETRY_LEVELS),
);
assert.equal(movingBeforeRaf ? 'suppress-high' : 'dispatch-high', 'suppress-high');
assert.equal(geometryBuildCanCommit({
    taskEpoch: 12,
    currentEpoch: geometryEpoch,
    taskSignature: 'old-settled',
    desiredSignature: null,
    taskMode: 'settled',
    isMovingView: movingBeforeRaf,
}), false);
// More changes in the same latched motion window refresh time, not epoch.
notifyProgrammaticMotion(510);
notifyProgrammaticMotion(520);
assert.equal(geometryEpoch, 13);

assert.deepEqual(Array.from(geometryLevelsForMode(true, 3)), Array.from(MOVING_GEOMETRY_LEVELS));
assert.deepEqual(Array.from(geometryLevelsForMode(false, 3)), Array.from(SETTLED_GEOMETRY_LEVELS));
// Legacy GSP1 must remain complete because it has no deferred range rebuild.
assert.deepEqual(Array.from(geometryLevelsForMode(true, 1)), Array.from(SETTLED_GEOMETRY_LEVELS));
assert.equal(shouldForceCoarseGeometry(true, false), true);
// The camera has stopped, but old-camera detail stays hidden until the exact
// final worker result commits atomically.
assert.equal(shouldForceCoarseGeometry(false, true), true);
assert.equal(shouldForceCoarseGeometry(false, false), false);

const validSettled = {
    taskEpoch: 8,
    currentEpoch: 8,
    taskSignature: 'final-frontier',
    desiredSignature: 'final-frontier',
    taskMode: 'settled',
    isMovingView: false,
};
assert.equal(geometryBuildCanCommit(validSettled), true);
// Motion began while the settled worker was running.
assert.equal(geometryBuildCanCommit({ ...validSettled, currentEpoch: 9, isMovingView: true }), false);
// Camera settled somewhere else and requested a different exact frontier.
assert.equal(geometryBuildCanCommit({ ...validSettled, desiredSignature: 'new-frontier' }), false);
// Even an identical range result cannot cross the moving/settled display edge.
assert.equal(geometryBuildCanCommit({ ...validSettled, isMovingView: true }), false);

const pausedViewerState = {
    lodPaused: true,
    needsLODUpdate: false,
    needsRender: false,
};
assert.equal(applyLodPauseTransition(pausedViewerState, false), false);
assert.deepEqual(pausedViewerState, {
    lodPaused: false,
    needsLODUpdate: true,
    needsRender: true,
});

console.log('geometry transitions: wheel latch + stale build guards ok');
