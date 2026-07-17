import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDistance, navigationOverlayState, niceDistance } from '../navigation_overlay.mjs';
test('scale uses deterministic 1/2/5 bins from the camera view', () => {
    assert.equal(niceDistance(187), 100); assert.equal(niceDistance(201), 200); assert.equal(formatDistance(2000), '2 km');
    const camera = { x: 0, y: 100, z: 100, fov: 60 }, target = { x: 0, y: 0, z: 0 };
    const near = navigationOverlayState({ camera, target, viewportWidth: 1000, viewportHeight: 500 });
    const far = navigationOverlayState({ camera: { ...camera, y: 1000 }, target, viewportWidth: 1000, viewportHeight: 500 });
    assert.ok(far.meters > near.meters); assert.ok(near.pixels >= 36 && near.pixels <= 280);
});
test('compass counter-rotates with camera yaw', () => {
    const common = { camera: { x: 0, y: 100, z: 100, fov: 60 }, viewportWidth: 800, viewportHeight: 600 };
    assert.equal(navigationOverlayState({ ...common, target: { x: 0, y: 0, z: 0 } }).compassRotation, 0);
    assert.equal(Math.round(navigationOverlayState({ ...common, target: { x: 100, y: 0, z: 100 } }).compassRotation), -90);
});
