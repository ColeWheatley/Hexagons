// Allocation-free mechanics for PistonViewer's custom two-finger gesture.
//
// This module deliberately owns all Three.js temporaries used during a move.
// Create one scratch set when the viewer is initialized, then reuse it for
// every gesture. Keep the math/order in applyTwoFingerGesture stable: recorded
// fixtures rely on its camera path remaining deterministic.

export const TOUCH_GESTURE_SCRATCH_OBJECTS = 10;

export function createTouchGestureScratch(THREE) {
    return {
        raycaster: new THREE.Raycaster(),
        ndc: new THREE.Vector2(),
        planeNormal: new THREE.Vector3(0, 1, 0),
        plane: new THREE.Plane(),
        pivot: new THREE.Vector3(),
        defaultUp: new THREE.Vector3(0, 1, 0),
        quaternion: new THREE.Quaternion(),
        cameraOffset: new THREE.Vector3(),
        spherical: new THREE.Spherical(),
        sphericalPosition: new THREE.Vector3(),
    };
}

// Returns whether the camera pose changed. This function must not construct
// objects; allocation instrumentation in tests verifies that invariant.
export function applyTwoFingerGesture(
    scratch,
    camera,
    target,
    controls,
    renderer,
    midpointX,
    midpointY,
    distRatio,
    angleDelta,
    midpointDeltaY,
) {
    let cameraMoved = false;

    // Find pivot for Yaw and Zoom using the centerpoint of the two fingers.
    const ndcX = (midpointX / renderer.domElement.clientWidth) * 2 - 1;
    const ndcY = -(midpointY / renderer.domElement.clientHeight) * 2 + 1;
    scratch.raycaster.setFromCamera(scratch.ndc.set(ndcX, ndcY), camera);
    scratch.plane.set(scratch.planeNormal, -target.y);
    if (!scratch.raycaster.ray.intersectPlane(scratch.plane, scratch.pivot)) {
        scratch.pivot.copy(target); // Fallback if no intersection
    }

    // 1. Zoom (dolly) towards the pivot
    if (distRatio !== 1 && isFinite(distRatio) && Math.abs(distRatio - 1) > 0.001) {
        const currentDist = camera.position.distanceTo(target);
        let newDist = currentDist / distRatio;
        newDist = Math.max(controls.minDistance, Math.min(controls.maxDistance, newDist));
        const effectiveDistRatio = currentDist / newDist;

        camera.position.sub(scratch.pivot).divideScalar(effectiveDistRatio).add(scratch.pivot);
        target.sub(scratch.pivot).divideScalar(effectiveDistRatio).add(scratch.pivot);
        cameraMoved = true;
    }

    // 2. Rotate (yaw) around the pivot
    if (angleDelta !== 0 && isFinite(angleDelta) && Math.abs(angleDelta) > 0.001) {
        const up = controls.up || scratch.defaultUp;
        // Reversed direction (swapped CW/CCW)
        scratch.quaternion.setFromAxisAngle(up, angleDelta);
        camera.position.sub(scratch.pivot).applyQuaternion(scratch.quaternion).add(scratch.pivot);
        target.sub(scratch.pivot).applyQuaternion(scratch.quaternion).add(scratch.pivot);
        cameraMoved = true;
    }

    // 3. Tilt (pitch / polar angle) via vertical drag
    if (midpointDeltaY !== 0 && isFinite(midpointDeltaY) && Math.abs(midpointDeltaY) > 0.1) {
        const factor = Math.PI / renderer.domElement.clientHeight;
        const tiltDelta = midpointDeltaY * factor;

        scratch.spherical.setFromVector3(scratch.cameraOffset.copy(camera.position).sub(target));
        scratch.spherical.phi -= tiltDelta;
        const minPolar = controls.minPolarAngle !== undefined ? controls.minPolarAngle : 0;
        const maxPolar = controls.maxPolarAngle !== undefined ? controls.maxPolarAngle : Math.PI;
        scratch.spherical.phi = Math.max(minPolar, Math.min(maxPolar, scratch.spherical.phi));
        scratch.spherical.makeSafe();

        camera.position.copy(target).add(scratch.sphericalPosition.setFromSpherical(scratch.spherical));
        cameraMoved = true;
    }

    return cameraMoved;
}
