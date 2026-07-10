// @atlas: Chooses a manifest-only terrain floor before any decoded tile exists,
// keeping pitched share views in the same vertical coordinate frame as terrain.

export function selectManifestFloorBaseline(tiles, scenePoint = null) {
    if (!tiles || typeof tiles[Symbol.iterator] !== 'function') return NaN;
    const x = Number(scenePoint?.x);
    const z = Number(scenePoint?.z);
    if (!Number.isFinite(x) || !Number.isFinite(z)) return NaN;
    let baseline = Infinity;
    let nearestDistance2 = Infinity;

    for (const tile of tiles) {
        const hMin = Number(tile?.hMin);
        if (!Number.isFinite(hMin)) continue;
        const lx = Number(tile?.lx);
        const lz = Number(tile?.lz);
        if (!Number.isFinite(lx) || !Number.isFinite(lz)) continue;
        const distance2 = (lx - x) ** 2 + (lz - z) ** 2;
        if (distance2 < nearestDistance2) {
            nearestDistance2 = distance2;
            baseline = hMin;
        }
    }
    return Number.isFinite(baseline) ? baseline : NaN;
}

/**
 * Rebase the navigation frame when terrain's vertical transform changes.
 *
 * Terrain is rendered at `(sourceElevation - floor) * factor`. MapControls,
 * however, orbits in renderer-scene coordinates. If the floor or pitch morph
 * changes while the controls target is left behind, an orbit starts looking
 * through the old datum plane instead of at the terrain under the cursor. The
 * camera and target must receive the same translation: that keeps bearing,
 * polar angle, and range unchanged while pinning the focus point to terrain.
 */
export function computeTerrainAnchorRebase({
    cameraY,
    targetY,
    sourceElevation,
    floor,
    factor,
}) {
    const values = { cameraY, targetY, sourceElevation, floor, factor };
    for (const [name, value] of Object.entries(values)) {
        if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
    }
    if (factor < 0) throw new RangeError('factor must be non-negative');

    const terrainY = (sourceElevation - floor) * factor;
    const translationY = terrainY - targetY;
    return Object.freeze({
        terrainY,
        translationY,
        targetY: terrainY,
        cameraY: cameraY + translationY,
    });
}
