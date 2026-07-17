import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(path.join(here, '../../frontend/app/touch_gesture.js'), 'utf8');
const {
    TOUCH_GESTURE_SCRATCH_OBJECTS,
    applyTwoFingerGesture,
    createTouchGestureScratch,
} = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

// A small deterministic Three-compatible fixture. Its constructor counter is
// the allocation gate: running the recorded moves must not instantiate a
// single scratch object after setup.
let constructions = 0;
class Vector2 {
    constructor(x = 0, y = 0) { constructions++; this.x = x; this.y = y; }
    set(x, y) { this.x = x; this.y = y; return this; }
}
class Vector3 {
    constructor(x = 0, y = 0, z = 0) { constructions++; this.x = x; this.y = y; this.z = z; }
    set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
    copy(v) { return this.set(v.x, v.y, v.z); }
    clone() { return new Vector3(this.x, this.y, this.z); }
    add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; }
    sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
    divideScalar(s) { this.x /= s; this.y /= s; this.z /= s; return this; }
    distanceTo(v) { return Math.hypot(this.x - v.x, this.y - v.y, this.z - v.z); }
    applyQuaternion(q) {
        const { x, y, z } = this;
        const ix = q.w * x + q.y * z - q.z * y;
        const iy = q.w * y + q.z * x - q.x * z;
        const iz = q.w * z + q.x * y - q.y * x;
        const iw = -q.x * x - q.y * y - q.z * z;
        this.x = ix * q.w + iw * -q.x + iy * -q.z - iz * -q.y;
        this.y = iy * q.w + iw * -q.y + iz * -q.x - ix * -q.z;
        this.z = iz * q.w + iw * -q.z + ix * -q.y - iy * -q.x;
        return this;
    }
    setFromSpherical(s) {
        const sinPhiRadius = Math.sin(s.phi) * s.radius;
        return this.set(sinPhiRadius * Math.sin(s.theta), Math.cos(s.phi) * s.radius, sinPhiRadius * Math.cos(s.theta));
    }
}
class Plane {
    constructor() { constructions++; this.normal = new Vector3(1, 0, 0); this.constant = 0; }
    set(normal, constant) { this.normal.copy(normal); this.constant = constant; return this; }
}
class Quaternion {
    constructor() { constructions++; this.set(0, 0, 0, 1); }
    set(x, y, z, w) { this.x = x; this.y = y; this.z = z; this.w = w; return this; }
    setFromAxisAngle(axis, angle) {
        const half = angle / 2, s = Math.sin(half);
        return this.set(axis.x * s, axis.y * s, axis.z * s, Math.cos(half));
    }
}
class Spherical {
    constructor() { constructions++; this.radius = 1; this.phi = 0; this.theta = 0; }
    setFromVector3(v) {
        this.radius = Math.hypot(v.x, v.y, v.z);
        if (this.radius === 0) return this;
        this.theta = Math.atan2(v.x, v.z);
        this.phi = Math.acos(Math.max(-1, Math.min(1, v.y / this.radius)));
        return this;
    }
    makeSafe() { this.phi = Math.max(1e-6, Math.min(Math.PI - 1e-6, this.phi)); return this; }
}
class Raycaster {
    constructor() {
        constructions++;
        this.ray = {
            intersectPlane: (plane, target) => {
                // Deterministic downward ray for the fixture; all moves use
                // the same intersection mechanics and exercise the real pivot path.
                target.set(this.origin.x + this.ndc.x * 10, -plane.constant, this.origin.z - this.ndc.y * 10);
                return target;
            },
        };
    }
    setFromCamera(ndc, camera) { this.ndc = ndc; this.origin = camera.position; }
}
const THREE = { Raycaster, Vector2, Vector3, Plane, Quaternion, Spherical };

// Frozen pre-AA-17 implementation. Compare every recorded pose against it so
// scratch reuse cannot accidentally alter gesture arithmetic or operation order.
function applyReferenceTwoFingerGesture(camera, target, controls, renderer, midpointX, midpointY, distRatio, angleDelta, midpointDeltaY) {
    let cameraMoved = false;
    const ndcX = (midpointX / renderer.domElement.clientWidth) * 2 - 1;
    const ndcY = -(midpointY / renderer.domElement.clientHeight) * 2 + 1;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -target.y);
    const pivot = new THREE.Vector3();
    if (!raycaster.ray.intersectPlane(plane, pivot)) pivot.copy(target);
    if (distRatio !== 1 && isFinite(distRatio) && Math.abs(distRatio - 1) > 0.001) {
        const currentDist = camera.position.distanceTo(target);
        let newDist = currentDist / distRatio;
        newDist = Math.max(controls.minDistance, Math.min(controls.maxDistance, newDist));
        const effectiveDistRatio = currentDist / newDist;
        camera.position.sub(pivot).divideScalar(effectiveDistRatio).add(pivot);
        target.sub(pivot).divideScalar(effectiveDistRatio).add(pivot);
        cameraMoved = true;
    }
    if (angleDelta !== 0 && isFinite(angleDelta) && Math.abs(angleDelta) > 0.001) {
        const up = controls.up || new THREE.Vector3(0, 1, 0);
        const q = new THREE.Quaternion().setFromAxisAngle(up, angleDelta);
        camera.position.sub(pivot).applyQuaternion(q).add(pivot);
        target.sub(pivot).applyQuaternion(q).add(pivot);
        cameraMoved = true;
    }
    if (midpointDeltaY !== 0 && isFinite(midpointDeltaY) && Math.abs(midpointDeltaY) > 0.1) {
        const factor = Math.PI / renderer.domElement.clientHeight;
        const tiltDelta = midpointDeltaY * factor;
        const spherical = new THREE.Spherical().setFromVector3(camera.position.clone().sub(target));
        spherical.phi -= tiltDelta;
        const minPolar = controls.minPolarAngle !== undefined ? controls.minPolarAngle : 0;
        const maxPolar = controls.maxPolarAngle !== undefined ? controls.maxPolarAngle : Math.PI;
        spherical.phi = Math.max(minPolar, Math.min(maxPolar, spherical.phi));
        spherical.makeSafe();
        camera.position.copy(target).add(new THREE.Vector3().setFromSpherical(spherical));
        cameraMoved = true;
    }
    return cameraMoved;
}

const scratch = createTouchGestureScratch(THREE);
assert.equal(TOUCH_GESTURE_SCRATCH_OBJECTS, 10);
assert.equal(constructions, 11, 'the Plane mock owns one normal; all gesture scratch is initialized once');

const camera = {
    position: new Vector3(120, 800, -350),
    lookAtCount: 0,
    lookAt() { this.lookAtCount++; },
};
const target = new Vector3(100, 0, -300);
const controls = {
    minDistance: 100,
    maxDistance: 50000,
    minPolarAngle: 0,
    maxPolarAngle: Math.PI / 2.1,
    updateCount: 0,
    update() { this.updateCount++; },
};
const renderer = { domElement: { clientWidth: 1000, clientHeight: 800 } };
const referenceCamera = { position: new Vector3(120, 800, -350), lookAt() {} };
const referenceTarget = new Vector3(100, 0, -300);
const referenceControls = { ...controls, update() {} };

const afterSetup = constructions;
// Recorded two-finger deltas (distance ratio, twist, midpoint vertical delta).
const fixture = [
    [510, 398, 1.04, 0.015, 3],
    [515, 402, 0.98, -0.008, 4],
    [525, 394, 1.07, 0.022, -8],
    [530, 390, 1.00, 0, 0], // threshold no-op
];
const cameraPath = [];
for (const move of fixture) {
    const moved = applyTwoFingerGesture(scratch, camera, target, controls, renderer, ...move);
    cameraPath.push([moved, camera.position.x, camera.position.y, camera.position.z, target.x, target.y, target.z]);
}

assert.equal(constructions, afterSetup, 'recorded pointer moves allocate zero Three.js scratch objects');
const steadyStateConstructions = constructions - afterSetup;

const referencePath = [];
for (const move of fixture) {
    const referenceMoved = applyReferenceTwoFingerGesture(referenceCamera, referenceTarget, referenceControls, renderer, ...move);
    referencePath.push([referenceMoved, referenceCamera.position.x, referenceCamera.position.y, referenceCamera.position.z, referenceTarget.x, referenceTarget.y, referenceTarget.z]);
}

assert.equal(camera.lookAtCount, 0, 'viewer owns lookAt after the allocation-free mechanics return');
assert.equal(controls.updateCount, 0, 'viewer owns controls.update after the allocation-free mechanics return');
const precision = 1e-12;
const expectedPath = [
    [true, 116.76816267942506, 769.7873982926632, -341.5322257759316, 101.50095606209872, 0, -301.6390787324988],
    [true, 112.25855796668536, 786.0850671748958, -330.04329488119953, 100.85851957148509, 0, -300.95433215859885],
    [true, 120.23492597756263, 733.3792649551555, -351.69453901003817, 102.24084449909783, 0, -302.6291202030566],
    [false, 120.23492597756263, 733.3792649551555, -351.69453901003817, 102.24084449909783, 0, -302.6291202030566],
];
assert.equal(cameraPath.length, expectedPath.length);
for (let i = 0; i < cameraPath.length; i++) {
    assert.equal(cameraPath[i][0], expectedPath[i][0], `move ${i} should preserve whether the camera changes`);
    for (let j = 1; j < cameraPath[i].length; j++) {
        assert.ok(Math.abs(cameraPath[i][j] - expectedPath[i][j]) <= precision, `move ${i}, component ${j} drifted: ${cameraPath[i][j]}`);
    }
    assert.deepEqual(cameraPath[i], referencePath[i], `move ${i} must remain bit-identical to the pre-AA-17 mechanics`);
}

console.log(`touch gesture fixture passed (${fixture.length} moves, ${steadyStateConstructions} steady-state Three allocations)`);
