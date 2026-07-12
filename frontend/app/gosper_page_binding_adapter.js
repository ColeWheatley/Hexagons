// Translation shim from one rendered Gosper island to an ordinary source-CRS
// AABB. The global texture-page grid never imports or depends on this module.

export function computeGosperSourceFootprint(core, { capOverscan = 1.15 } = {}) {
    if (!core || typeof core.offsets !== 'function' || typeof core.axialToWorld !== 'function') {
        throw new TypeError('canonical Gosper core is required');
    }
    const tileLevel = core.TILE_LEVEL;
    const offsets = core.offsets(tileLevel);
    let minOffsetX = Infinity;
    let minOffsetY = Infinity;
    let maxOffsetX = -Infinity;
    let maxOffsetY = -Infinity;

    // Include every rendered hierarchy cap, not merely unit centers. A cap's
    // circumradius is conservative under every level rotation and matches the
    // backend geometry coverage calculation without its old 10m canvas round.
    for (let depth = 0; depth <= tileLevel; depth++) {
        const level = tileLevel - depth;
        const stride = Math.pow(7, level);
        const overscan = level === 0 ? 1 : capOverscan;
        const circumradius = core.levelSize(level) / Math.sqrt(3) * overscan;
        for (let index = 0; index < offsets.length / 2; index += stride) {
            const [x, y] = core.axialToWorld(offsets[index * 2], offsets[index * 2 + 1]);
            minOffsetX = Math.min(minOffsetX, x - circumradius);
            minOffsetY = Math.min(minOffsetY, y - circumradius);
            maxOffsetX = Math.max(maxOffsetX, x + circumradius);
            maxOffsetY = Math.max(maxOffsetY, y + circumradius);
        }
    }
    return Object.freeze({ minOffsetX, minOffsetY, maxOffsetX, maxOffsetY });
}

export function gosperIslandSourceBounds(centerX, centerY, footprint) {
    if (![centerX, centerY, footprint?.minOffsetX, footprint?.minOffsetY,
        footprint?.maxOffsetX, footprint?.maxOffsetY].every(Number.isFinite)) {
        throw new TypeError('finite island center and source footprint are required');
    }
    return Object.freeze({
        minX: centerX + footprint.minOffsetX,
        minY: centerY + footprint.minOffsetY,
        maxX: centerX + footprint.maxOffsetX,
        maxY: centerY + footprint.maxOffsetY,
    });
}

export function sourceFootprintFromGeometryContract(geometryContract, analyticFootprint = null) {
    const half = geometryContract?.tile_source_footprint_half_m;
    const halfX = Number(half?.x);
    const halfY = Number(half?.y);
    if (!(Number.isFinite(halfX) && halfX > 0 && Number.isFinite(halfY) && halfY > 0)) {
        throw new Error('geometry.tile_source_footprint_half_m needs positive finite x/y');
    }
    if (geometryContract.footprint_semantics !== 'conservative_render_coverage') {
        throw new Error('geometry footprint must describe conservative_render_coverage');
    }
    if (analyticFootprint) {
        const requiredX = Math.max(-analyticFootprint.minOffsetX, analyticFootprint.maxOffsetX);
        const requiredY = Math.max(-analyticFootprint.minOffsetY, analyticFootprint.maxOffsetY);
        if (halfX + 1e-6 < requiredX || halfY + 1e-6 < requiredY) {
            throw new Error('manifest geometry footprint does not cover rendered caps');
        }
    }
    return Object.freeze({
        minOffsetX: -halfX,
        minOffsetY: -halfY,
        maxOffsetX: halfX,
        maxOffsetY: halfY,
    });
}
