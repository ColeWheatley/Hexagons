// GSP3's depth records are contiguous. Ends are exclusive byte offsets.
export const GSP3_PREFIX_END = Object.freeze({
    2: 952,
    3: 6444,
    4: 44864,
    5: 280166,
});

// The root visibility pass measures the island center, while the geometry
// planner measures L3 centers. Include their possible offset, the L3 cap
// radius and the same relief-dependent planner margin before omitting detail.
export function requiredTileDepth(distanceM, { moving = false, reliefM = 0,
    rootRadiusM = 0, l3RadiusM = 78.7, lodMarginM = 650 } = {}) {
    if (moving) return 2;
    const margin = Math.max(lodMarginM, Math.hypot(l3RadiusM, Math.max(0, reliefM)) + 24);
    const reach = Math.max(0, rootRadiusM) + Math.max(0, reliefM) + l3RadiusM + margin;
    if (!Number.isFinite(distanceM) || distanceM <= 2000 + reach) return 5;
    if (distanceM <= 5000 + reach) return 4;
    if (distanceM <= 10000 + reach) return 3;
    return 2;
}

export function tileDepthNeedsRefinement(availableDepth, requiredDepth) {
    return Number.isInteger(availableDepth) && Number.isInteger(requiredDepth)
        && requiredDepth > availableDepth;
}

/** Heap-order units are grouped contiguously under every ancestor depth. */
export function sampleTileHeightAtUnitIndex(heightValues, depth, unitIndex) {
    if (!heightValues || !Number.isInteger(unitIndex) || unitIndex < 0 || unitIndex >= 16807
        || !Number.isInteger(depth) || depth < 0 || depth > 5) return undefined;
    return heightValues[Math.floor(unitIndex / (7 ** (5 - depth)))];
}
