// PowFinder tap-a-hex picking (design doc §3.4, task P2.4). Pure, DOM- and
// THREE-free math: the iterated ground-plane solve, the L1 pyramid-address
// resolution for a tapped axial cell, the tap-vs-drag gesture threshold, and
// the highlight-ring vertex layout. Every input a caller needs (a scene-space
// ray, an elevation sampler, already-loaded tile/index state) is dependency-
// injected so this runs identically in `node --test` and in the browser —
// same pattern as sidecar_format.mjs / sidecar_atlas.mjs.
//
// main.js's `pickPowFinderCell()` is the only caller; it supplies real THREE
// objects (a THREE.Raycaster's ray, `this.sampleTerrainSourceElevation`,
// `this.tiles`, `this.unitIndexMap`) — see that method for the full wiring.
import { pyramidAddress, UNIT_DEPTH } from './sidecar_format.mjs';

// Gesture discipline (design doc §3.4): "pointerdown -> pointerup within
// 300ms and < 8px movement, and only when !isUserInteracting" — the same
// threshold pattern main.js's initTouchMomentumTracking already uses to tell
// a tap from the start of a MapControls drag.
export const TAP_MAX_DIST_PX = 8;
export const TAP_MAX_DURATION_MS = 300;

export function isTapGesture({ dx, dy, durationMs }) {
    if (!Number.isFinite(dx) || !Number.isFinite(dy) || !Number.isFinite(durationMs)) return false;
    if (durationMs < 0) return false;
    return Math.hypot(dx, dy) <= TAP_MAX_DIST_PX && durationMs <= TAP_MAX_DURATION_MS;
}

const DEFAULT_ITERATIONS = 3;

/**
 * Iterated ground-plane pick (design doc §3.4). There is no raycastable
 * geometry to intersect -- instances are shader-displaced and
 * `frustumCulled = false` -- so this converges on the true (possibly
 * piston-raised) terrain height by alternating a ray/horizontal-plane
 * intersection with an elevation sample, exactly the loop the doc specifies:
 * intersect y=0, sample elevation there, intersect the plane the sample
 * implies, repeat. In 2D (`heightFactor` ~= 0) every candidate plane is y=0,
 * so the loop is a costless no-op after the first sample.
 *
 * `sampleElevation(x, z)` is expected to be (a thin wrapper around) the
 * viewer's own `sampleTerrainSourceElevation` (main.js:4892 in the design
 * doc's line numbering) -- it already resolves world origin, tile lookup,
 * and axial coordinates, so the *last* sample this function takes is already
 * the complete pick result (`{ sourceElevation, axial, tq, tr, wx, wy }`);
 * this function does not re-derive any of that.
 *
 * @param {{origin:{x,y,z}, direction:{x,y,z}}} ray scene-space ray (e.g. a
 *   THREE.Raycaster's `.ray`, passed as plain {origin,direction} so this
 *   module never has to import THREE)
 * @param {(x:number, z:number) => ({sourceElevation:number}|undefined)} sampleElevation
 * @param {number} floor current `floorState.value`
 * @param {number} heightFactor current piston height factor, 0..1
 * @param {number} [iterations]
 * @returns {object|null} the last `sampleElevation()` result, or null if the
 *   ray never reaches the ground (looking at the sky) or resolves off-DEM.
 */
export function pickGroundCell({ ray, sampleElevation, floor, heightFactor, iterations = DEFAULT_ITERATIONS }) {
    if (!ray || !ray.origin || !ray.direction || typeof sampleElevation !== 'function') return null;
    if (!(ray.direction.y < 0)) return null; // ray must point down toward the terrain
    if (!Number.isFinite(floor) || !Number.isFinite(heightFactor)) return null;

    let planeY = 0;
    let sample = null;
    for (let i = 0; i < iterations; i++) {
        const t = (planeY - ray.origin.y) / ray.direction.y;
        if (!(t > 0)) return null; // plane is behind the camera
        const x = ray.origin.x + ray.direction.x * t;
        const z = ray.origin.z + ray.direction.z * t;
        sample = sampleElevation(x, z);
        const elevation = sample?.sourceElevation;
        if (!Number.isFinite(elevation)) return null; // off-DEM / no terrain under the cursor
        planeY = (elevation - floor) * heightFactor;
    }
    return sample;
}

/**
 * Address resolution (design doc §3.4): axial (q,r) -> tile -> unit heap
 * index -> L1 pyramid address, using only already-loaded main-thread state.
 * Mirrors the exact lookup `sampleTerrainSourceElevation` already performs
 * for elevation (tile.center offset -> `unitIndexMap` heap-order lookup),
 * extended to also return the raw unit index (for slope/aspect) and the
 * L1 index (for the pyramid address and the highlight ring's node centre).
 *
 * @param {{q:number, r:number}} axial
 * @param {number} tq tile lattice q (from `G.tileOfUnit`)
 * @param {number} tr tile lattice r
 * @param {Map<string, {center:{q:number,r:number}}>} tiles keyed "yq_yr"
 * @param {Map<number, number>} unitIndexMap `((dq+128)<<8)|(dr+128) -> unit heap index`
 * @param {(tileKey:string) => (number|null)} [atlasSlotFor] e.g. `atlas.slotFor`
 * @returns {{tileKey:string, unitIdx:number, l1Index:number, address:number, slot:number|null}|null}
 */
export function resolveHexAddress({ axial, tq, tr, tiles, unitIndexMap, atlasSlotFor }) {
    if (!axial || !Number.isInteger(axial.q) || !Number.isInteger(axial.r)) return null;
    if (!Number.isInteger(tq) || !Number.isInteger(tr)) return null;
    if (!(tiles instanceof Map) || !(unitIndexMap instanceof Map)) return null;

    const tileKey = `${tq}_${tr}`;
    const tile = tiles.get(tileKey);
    if (!tile || !tile.center) return null;

    const dq = axial.q - tile.center.q;
    const dr = axial.r - tile.center.r;
    const unitIdx = unitIndexMap.get(((dq + 128) << 8) | (dr + 128));
    if (unitIdx === undefined) return null;

    const l1Index = Math.floor(unitIdx / 7);
    const address = pyramidAddress(UNIT_DEPTH, unitIdx); // == 400 + l1Index
    const slot = typeof atlasSlotFor === 'function' ? atlasSlotFor(tileKey) : null;
    return { tileKey, unitIdx, l1Index, address, slot: (slot === undefined ? null : slot) };
}

/**
 * Flat-top hexagon corner positions for the pick highlight ring (design doc
 * §3.4), in the exact vertex-angle convention the app's own cap geometry
 * uses (`main.js`'s `createHexGeometry`: `THREE.CircleGeometry(radius, 6)`
 * laid flat, vertex 0 at local +X / East, proceeding clockwise in scene XZ).
 * Six points, meant for a `THREE.LineLoop` (which closes the loop itself).
 *
 * @returns {Float32Array} 18 numbers: x0,y0,z0, x1,y1,z1, ... x5,y5,z5 (y=0)
 */
export function hexRingPositions({ centerX, centerZ, radius }) {
    const positions = new Float32Array(6 * 3);
    for (let i = 0; i < 6; i++) {
        const theta = (i * Math.PI) / 3;
        positions[i * 3 + 0] = centerX + radius * Math.cos(theta);
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = centerZ - radius * Math.sin(theta);
    }
    return positions;
}
