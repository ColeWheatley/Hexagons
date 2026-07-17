// @atlas: Gosper-specific translation from the generic visibility frontier to
// contiguous worker geometry ranges.  Frustum math remains entirely inside
// visibility_planner.js; this module only understands that a depth-2/L3 node
// owns contiguous ranges at deeper Gosper heap depths.

import {
    planHierarchicalVisibility,
} from './visibility_planner.js';
import {
    GOSPER_DEPTH_COUNTS,
    GOSPER_MAX_DEPTH,
} from './gosper_visibility_adapter.js';

export const GOSPER_GEOMETRY_FRONTIER_DEPTH = 2; // depth 2 == level L3
export const DEFAULT_DETAIL_DISTANCE_BY_DEPTH = Object.freeze([
    Infinity, // root/L5: always present for a resident island
    Infinity, // L4: always present
    Infinity, // L3: always present (uniform panning contract)
    10000,    // L2 descendants
    5000,     // L1 descendants
    2000,     // unit descendants
]);

function rangeCount(ranges) {
    let count = 0;
    for (let i = 1; i < ranges.length; i += 2) count += ranges[i];
    return count;
}

function mergePairs(pairs) {
    if (pairs.length === 0) return new Uint32Array();
    pairs.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const merged = [];
    let start = pairs[0][0];
    let end = start + pairs[0][1];
    for (let index = 1; index < pairs.length; index++) {
        const nextStart = pairs[index][0];
        const nextEnd = nextStart + pairs[index][1];
        if (nextStart <= end) {
            end = Math.max(end, nextEnd);
        } else {
            merged.push(start, end - start);
            start = nextStart;
            end = nextEnd;
        }
    }
    merged.push(start, end - start);
    return new Uint32Array(merged);
}

function maskRanges(mask, enabled) {
    const pairs = [];
    let index = 0;
    while (index < mask.length) {
        while (index < mask.length && Boolean(mask[index]) !== enabled) index++;
        const start = index;
        while (index < mask.length && Boolean(mask[index]) === enabled) index++;
        if (index > start) pairs.push([start, index - start]);
    }
    return mergePairs(pairs);
}

/** Return true when every interval in subset is covered by superset. */
export function gosperRangesContain(superset, subset) {
    let outer = 0;
    for (let inner = 0; inner < subset.length; inner += 2) {
        const needStart = subset[inner];
        const needEnd = needStart + subset[inner + 1];
        while (outer < superset.length && superset[outer] + superset[outer + 1] <= needStart) {
            outer += 2;
        }
        if (outer >= superset.length || superset[outer] > needStart
            || superset[outer] + superset[outer + 1] < needEnd) {
            return false;
        }
    }
    return true;
}

/** Exact frontier equality: superseded detail ranges must never be rendered. */
export function gosperGeometrySelectionNeedsRebuild(current, desired) {
    if (!current) return true;
    for (let depth = GOSPER_GEOMETRY_FRONTIER_DEPTH + 1; depth <= GOSPER_MAX_DEPTH; depth++) {
        const a = current.rangesByDepth[depth];
        const b = desired.rangesByDepth[depth];
        if (!a || !b || a.length !== b.length) return true;
        for (let index = 0; index < a.length; index++) {
            if (a[index] !== b[index]) return true;
        }
    }
    return false;
}

/**
 * Run a depth-L3 visibility pass for one decoded island, then convert the
 * accepted L3 nodes into contiguous deeper ranges.  No unit node is ever
 * plane-tested: a rejected L3 node removes its complete 7/49/343 descendant
 * ranges from levels L2/L1/unit respectively.
 *
 * Depths 0..2 remain complete for every resident GSP2+ island. In particular,
 * all 49 L3 caps remain available during panning, preserving the single-size
 * moving representation even while settled detail is compacted.
 */
export function planGosperGeometrySelection({
    adapter,
    rootHandle,
    visibleFrustum,
    guardFrustum,
    projection,
    detailDistanceByDepth = DEFAULT_DETAIL_DISTANCE_BY_DEPTH,
    detailMarginMeters = 650,
}) {
    if (!adapter) throw new TypeError('adapter is required');
    if (!detailDistanceByDepth || detailDistanceByDepth.length <= GOSPER_MAX_DEPTH) {
        throw new TypeError('detailDistanceByDepth must contain depths 0..5');
    }

    const plan = planHierarchicalVisibility({
        hierarchy: adapter,
        roots: new Uint32Array([rootHandle]),
        visibleFrustum,
        guardFrustum,
        projection,
        maxDepth: GOSPER_GEOMETRY_FRONTIER_DEPTH,
    });

    const l3Mask = new Uint8Array(GOSPER_DEPTH_COUNTS[GOSPER_GEOMETRY_FRONTIER_DEPTH]);
    const visibleMask = new Uint8Array(l3Mask.length);
    const ranges = Array.from({ length: GOSPER_MAX_DEPTH + 1 }, () => []);
    const address = new Uint32Array(4);
    const descendant = new Uint32Array(4);
    const l3Radius = adapter.horizontalRadiusByLevel[
        GOSPER_MAX_DEPTH - GOSPER_GEOMETRY_FRONTIER_DEPTH
    ];

    function consume(bucket, isVisible) {
        for (let entry = 0; entry < bucket.nodeIds.length; entry++) {
            const node = bucket.nodeIds[entry];
            adapter.writeNodeAddress(node, address);
            if (address[1] !== GOSPER_GEOMETRY_FRONTIER_DEPTH) {
                throw new Error(`geometry frontier stopped at depth ${address[1]}, expected L3/depth 2`);
            }
            const l3Index = address[2];
            l3Mask[l3Index] = 1;
            if (isVisible) visibleMask[l3Index] = 1;

            const distance = bucket.distanceMeters[entry];
            for (let depth = GOSPER_GEOMETRY_FRONTIER_DEPTH + 1; depth <= GOSPER_MAX_DEPTH; depth++) {
                const threshold = Number(detailDistanceByDepth[depth]);
                if (Number.isFinite(distance)
                    && distance - l3Radius <= threshold + detailMarginMeters) {
                    adapter.writeDescendantRange(node, depth, descendant);
                    ranges[depth].push([descendant[1], descendant[2]]);
                }
            }
        }
    }

    consume(plan.visible, true);
    consume(plan.guard, false);

    const rangesByDepth = new Array(GOSPER_MAX_DEPTH + 1);
    // Coarse coverage is intentionally complete and tiny: 1 + 7 + 49 nodes.
    for (let depth = 0; depth <= GOSPER_GEOMETRY_FRONTIER_DEPTH; depth++) {
        rangesByDepth[depth] = new Uint32Array([0, GOSPER_DEPTH_COUNTS[depth]]);
    }
    for (let depth = GOSPER_GEOMETRY_FRONTIER_DEPTH + 1; depth <= GOSPER_MAX_DEPTH; depth++) {
        rangesByDepth[depth] = mergePairs(ranges[depth]);
    }

    const selectedCounts = new Uint32Array(GOSPER_MAX_DEPTH + 1);
    let detailNodeCount = 0;
    for (let depth = 0; depth <= GOSPER_MAX_DEPTH; depth++) {
        selectedCounts[depth] = rangeCount(rangesByDepth[depth]);
        if (depth > GOSPER_GEOMETRY_FRONTIER_DEPTH) detailNodeCount += selectedCounts[depth];
    }

    const signature = rangesByDepth
        .slice(GOSPER_GEOMETRY_FRONTIER_DEPTH + 1)
        .map(depthRanges => Array.from(depthRanges).join(','))
        .join('|');

    return Object.freeze({
        rangesByDepth,
        selectedCounts,
        detailNodeCount,
        activeL3Count: l3Mask.reduce((sum, value) => sum + value, 0),
        visibleL3Count: visibleMask.reduce((sum, value) => sum + value, 0),
        excludedL3Count: l3Mask.length - l3Mask.reduce((sum, value) => sum + value, 0),
        activeL3Ranges: maskRanges(l3Mask, true),
        outsideL3Ranges: maskRanges(l3Mask, false),
        signature,
        plannerStats: plan.stats,
    });
}
