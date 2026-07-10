// @atlas: Translation shim between the generic hierarchical visibility
// planner and level-5 Gosper islands.  All Gosper-specific facts live here:
// 7-way heap indexing, analytic node centres/radii, manifest height roots,
// GSP1/GSP2 aggregate bounds, and contiguous descendant ranges.  The planner
// sees only opaque uint32 handles and its generic hierarchy interface.

import './gosper_core.js';
import { VisibilityClass } from './visibility_planner.js';

const DEFAULT_CORE = globalThis.GosperCore;
const BRANCHING = 7;
const CAP_OVERSCAN = 1.15;
const ROOT_HEIGHT_ROUNDING_M = 0.1;
const GSP1_RELIEF_QUANTUM_M = 4;
const GSP1_RELIEF_ROUNDING_M = GSP1_RELIEF_QUANTUM_M * 0.5 + 0.1;
const GSP1_RELIEF_SATURATED = 255;
// Aggregate worker buffers add 12 m and the shader can add another 12 m.
const AGGREGATE_SKIRT_SAFETY_M = 24;
// Unit skirts receive only the shader's distance-dependent 12 m extension.
const UNIT_SKIRT_SAFETY_M = 12;

export const GOSPER_LEVEL_COUNT = 6;
export const GOSPER_MAX_DEPTH = 5;
export const GOSPER_DEPTH_COUNTS = Object.freeze([1, 7, 49, 343, 2401, 16807]);
export const GOSPER_DEPTH_STARTS = Object.freeze([0, 1, 8, 57, 400, 2801]);
export const GOSPER_NODE_COUNT_PER_ISLAND = 19608;

const POW7 = Object.freeze([1, 7, 49, 343, 2401, 16807]);

function latticeKey(yq, yr) {
    return `${yq}_${yr}`;
}

function assertInteger(value, label) {
    if (!Number.isInteger(value)) throw new TypeError(`${label} must be an integer`);
    return value;
}

function depthForLocalHandle(local) {
    if (local < GOSPER_DEPTH_STARTS[1]) return 0;
    if (local < GOSPER_DEPTH_STARTS[2]) return 1;
    if (local < GOSPER_DEPTH_STARTS[3]) return 2;
    if (local < GOSPER_DEPTH_STARTS[4]) return 3;
    if (local < GOSPER_DEPTH_STARTS[5]) return 4;
    return 5;
}

function recordArray(record, ...names) {
    for (const name of names) {
        if (record?.[name] !== undefined) return record[name];
    }
    return null;
}

/**
 * One JS Map entry and a small set of typed-array scalars are kept per
 * island.  No JS object is created per Gosper node; node identity is the
 * uint32 handle `island * 19608 + depthStart + heapIndex`.
 */
export class GosperVisibilityAdapter {
    constructor({
        manifest = null,
        manifestTiles = null,
        worldOrigin = { x: 0, y: 0 },
        core = DEFAULT_CORE,
        capOverscan = CAP_OVERSCAN,
        rootHeightRoundingM = ROOT_HEIGHT_ROUNDING_M,
        aggregateSkirtSafetyM = AGGREGATE_SKIRT_SAFETY_M,
        unitSkirtSafetyM = UNIT_SKIRT_SAFETY_M,
    } = {}) {
        if (!core) throw new Error('GosperCore is unavailable');
        const inputTiles = manifestTiles ?? manifest?.tiles;
        if (!Array.isArray(inputTiles)) throw new TypeError('manifestTiles must be an array');
        if (!(Number.isFinite(capOverscan) && capOverscan >= 1)) {
            throw new RangeError('capOverscan must be at least 1');
        }
        this.core = core;
        this.maxDepth = GOSPER_MAX_DEPTH;
        this._rootHeightRoundingM = rootHeightRoundingM;
        this._aggregateSkirtSafetyM = aggregateSkirtSafetyM;
        this._unitSkirtSafetyM = unitSkirtSafetyM;
        this._verticalFactor = 1;
        this._verticalFloor = 0;
        this._verticalOffset = 0;
        this._addressScratch = { island: 0, local: 0, depth: 0, index: 0 };
        this._rawHeightScratch = new Float64Array(2);

        // Numeric lattice ordering makes opaque handles stable even if a
        // manifest's JSON/file ordering changes.
        const tiles = inputTiles.slice().sort((a, b) => (a.yq - b.yq) || (a.yr - b.yr));
        this.islandCount = tiles.length;
        const maxIslands = Math.floor(0x100000000 / GOSPER_NODE_COUNT_PER_ISLAND);
        if (tiles.length > maxIslands) {
            throw new RangeError(`uint32 node handles support at most ${maxIslands} islands`);
        }

        this._rootHandles = new Uint32Array(tiles.length);
        this._latticeQ = new Int32Array(tiles.length);
        this._latticeR = new Int32Array(tiles.length);
        this._rootX = new Float64Array(tiles.length);
        this._rootZ = new Float64Array(tiles.length);
        this._rootMean = new Float64Array(tiles.length);
        this._rootMin = new Float64Array(tiles.length);
        this._rootMax = new Float64Array(tiles.length);
        this._gspVersion = new Uint8Array(tiles.length);
        this._keys = new Array(tiles.length);
        this._islandByKey = new Map();
        this._decodedByIsland = new Array(tiles.length).fill(null);

        const originX = Number(worldOrigin?.x ?? 0);
        const originY = Number(worldOrigin?.y ?? 0);
        for (let island = 0; island < tiles.length; island++) {
            const tile = tiles[island];
            const yq = assertInteger(tile.yq, 'tile.yq');
            const yr = assertInteger(tile.yr, 'tile.yr');
            const key = latticeKey(yq, yr);
            if (this._islandByKey.has(key)) throw new Error(`duplicate Gosper island ${key}`);
            const x = Number.isFinite(tile.lx) ? Number(tile.lx) : Number(tile.x) - originX;
            const z = Number.isFinite(tile.lz) ? Number(tile.lz) : -(Number(tile.y) - originY);
            const hMean = Number(tile.hMean);
            const hMin = Number(tile.hMin);
            const hMax = Number(tile.hMax);
            if (![x, z, hMean, hMin, hMax].every(Number.isFinite) || hMin > hMax) {
                throw new RangeError(`invalid manifest bounds for Gosper island ${key}`);
            }

            this._rootHandles[island] = island * GOSPER_NODE_COUNT_PER_ISLAND;
            this._latticeQ[island] = yq;
            this._latticeR[island] = yr;
            this._rootX[island] = x;
            this._rootZ[island] = z;
            this._rootMean[island] = hMean;
            this._rootMin[island] = hMin;
            this._rootMax[island] = hMax;
            this._gspVersion[island] = Number(tile.gspVersion ?? manifest?.gsp_version ?? 1);
            this._keys[island] = key;
            this._islandByKey.set(key, island);
        }

        this.horizontalRadiusByLevel = new Float64Array(GOSPER_LEVEL_COUNT);
        for (let level = 0; level <= GOSPER_MAX_DEPTH; level++) {
            const overscan = level === 0 ? 1 : capOverscan;
            this.horizontalRadiusByLevel[level] = core.levelSize(level) / Math.sqrt(3) * overscan;
        }

        // One shared centre table serves every island.  Depth d / heap i is
        // represented by the first unit of its contiguous subtree, exactly as
        // the worker's instance builder does.
        this._localCenterX = new Float64Array(GOSPER_NODE_COUNT_PER_ISLAND);
        this._localCenterZ = new Float64Array(GOSPER_NODE_COUNT_PER_ISLAND);
        const offsets = core.offsets(GOSPER_MAX_DEPTH);
        for (let depth = 0; depth <= GOSPER_MAX_DEPTH; depth++) {
            const count = GOSPER_DEPTH_COUNTS[depth];
            const stride = POW7[GOSPER_MAX_DEPTH - depth];
            const start = GOSPER_DEPTH_STARTS[depth];
            for (let index = 0; index < count; index++) {
                const unit = index * stride;
                const q = offsets[unit * 2];
                const r = offsets[unit * 2 + 1];
                const world = core.axialToWorld(q, r);
                this._localCenterX[start + index] = world[0];
                this._localCenterZ[start + index] = -world[1];
            }
        }
    }

    getRoots() {
        return this._rootHandles;
    }

    getIslandIndex(nodeHandle) {
        const handle = this._assertHandle(nodeHandle);
        return Math.floor(handle / GOSPER_NODE_COUNT_PER_ISLAND);
    }

    getIslandKey(islandIndex) {
        this._assertIslandIndex(islandIndex);
        return this._keys[islandIndex];
    }

    getIslandVersion(islandIndex) {
        this._assertIslandIndex(islandIndex);
        return this._gspVersion[islandIndex];
    }

    writeIslandLattice(islandIndex, out = new Int32Array(2)) {
        this._assertIslandIndex(islandIndex);
        out[0] = this._latticeQ[islandIndex];
        out[1] = this._latticeR[islandIndex];
        return out;
    }

    getRootHandle(keyOrIslandIndex) {
        let island;
        if (typeof keyOrIslandIndex === 'string') {
            island = this._islandByKey.get(keyOrIslandIndex);
            if (island === undefined) return null;
        } else {
            island = this._assertIslandIndex(keyOrIslandIndex);
        }
        return this._rootHandles[island];
    }

    getRootHandleForLattice(yq, yr) {
        return this.getRootHandle(latticeKey(yq, yr));
    }

    getDepth(nodeHandle) {
        const handle = this._assertHandle(nodeHandle);
        const local = handle % GOSPER_NODE_COUNT_PER_ISLAND;
        return depthForLocalHandle(local);
    }

    getLevel(nodeHandle) {
        return GOSPER_MAX_DEPTH - this.getDepth(nodeHandle);
    }

    getChildCount(nodeHandle) {
        return this.getDepth(nodeHandle) < GOSPER_MAX_DEPTH ? BRANCHING : 0;
    }

    getChild(nodeHandle, childIndex) {
        const handle = this._assertHandle(nodeHandle);
        assertInteger(childIndex, 'childIndex');
        if (childIndex < 0 || childIndex >= BRANCHING) throw new RangeError('childIndex must be 0..6');
        const island = Math.floor(handle / GOSPER_NODE_COUNT_PER_ISLAND);
        const local = handle - island * GOSPER_NODE_COUNT_PER_ISLAND;
        const depth = depthForLocalHandle(local);
        if (depth === GOSPER_MAX_DEPTH) throw new RangeError('unit nodes have no children');
        const index = local - GOSPER_DEPTH_STARTS[depth];
        return island * GOSPER_NODE_COUNT_PER_ISLAND
            + GOSPER_DEPTH_STARTS[depth + 1]
            + index * BRANCHING
            + childIndex;
    }

    isNodeEnabled(nodeHandle) {
        const address = this._address(nodeHandle);
        const decoded = this._decodedByIsland[address.island];
        const valid = decoded?.depths?.[address.depth]?.valid;
        return valid ? valid[address.index] !== 0 : true;
    }

    /**
     * Attach the worker/parser's compact typed arrays without expanding them
     * into node objects.  GSP2 records may expose conservative `downExtent`
     * and `upExtent` Uint16Arrays in decimetres.  GSP1 uses `relief` bytes.
     */
    attachDecodedIsland(keyOrIslandIndex, decoded) {
        const island = this._resolveIsland(keyOrIslandIndex);
        const depths = decoded?.depths;
        if (!Array.isArray(depths) || depths.length !== GOSPER_LEVEL_COUNT) {
            throw new TypeError('decoded.depths must contain depths 0..5');
        }
        for (let depth = 0; depth <= GOSPER_MAX_DEPTH; depth++) {
            const record = depths[depth];
            const expected = GOSPER_DEPTH_COUNTS[depth];
            if (!record?.h || record.h.length !== expected) {
                throw new RangeError(`decoded depth ${depth} needs ${expected} heights`);
            }
            if (record.valid && record.valid.length !== expected) {
                throw new RangeError(`decoded depth ${depth} validity length mismatch`);
            }
            for (const name of ['relief', 'downExtent', 'upExtent']) {
                if (record[name] && record[name].length !== expected) {
                    throw new RangeError(`decoded depth ${depth} ${name} length mismatch`);
                }
            }
        }
        this._decodedByIsland[island] = decoded;
    }

    detachDecodedIsland(keyOrIslandIndex) {
        this._decodedByIsland[this._resolveIsland(keyOrIslandIndex)] = null;
    }

    /** Scene Y = (sourceElevation - floor) * factor + offset. */
    setVerticalTransform({ factor = 1, floor = 0, offset = 0 } = {}) {
        for (const [name, value] of Object.entries({ factor, floor, offset })) {
            if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
        }
        this._verticalFactor = factor;
        this._verticalFloor = floor;
        this._verticalOffset = offset;
    }

    writeBounds(nodeHandle, out = new Float64Array(6)) {
        const address = this._address(nodeHandle);
        const local = address.local;
        const level = GOSPER_MAX_DEPTH - address.depth;
        const radius = this.horizontalRadiusByLevel[level];
        const x = this._rootX[address.island] + this._localCenterX[local];
        const z = this._rootZ[address.island] + this._localCenterZ[local];
        const rawHeight = this._rawHeightBounds(address);
        const y0 = this._toSceneY(rawHeight[0]);
        const y1 = this._toSceneY(rawHeight[1]);

        out[0] = x - radius;
        out[1] = Math.min(y0, y1);
        out[2] = z - radius;
        out[3] = x + radius;
        out[4] = Math.max(y0, y1);
        out[5] = z + radius;
        return out;
    }

    /**
     * Importance sphere for projected texture/geometry demand.  Its radius is
     * the analytic horizontal render-cap radius; vertical relief remains in
     * writeBounds for correct frustum classification but cannot inflate the
     * requested aerial-texture resolution.
     */
    writeProjectionSphere(nodeHandle, out = new Float64Array(4)) {
        const address = this._address(nodeHandle);
        const local = address.local;
        const level = GOSPER_MAX_DEPTH - address.depth;
        out[0] = this._rootX[address.island] + this._localCenterX[local];
        out[1] = this._toSceneY(this._nodeMean(address));
        out[2] = this._rootZ[address.island] + this._localCenterZ[local];
        out[3] = this.horizontalRadiusByLevel[level];
        return out;
    }

    /** Write [islandIndex, depth, heapIndex, gosperLevel]. */
    writeNodeAddress(nodeHandle, out = new Uint32Array(4)) {
        const address = this._address(nodeHandle);
        out[0] = address.island;
        out[1] = address.depth;
        out[2] = address.index;
        out[3] = GOSPER_MAX_DEPTH - address.depth;
        return out;
    }

    /**
     * Translate a frontier node into a contiguous array range at targetDepth.
     * Output is [islandIndex, firstHeapIndex, count, targetDepth].
     * Example: one depth-2/L3 node maps to 343 contiguous unit records.
     */
    writeDescendantRange(nodeHandle, targetDepth, out = new Uint32Array(4)) {
        const address = this._address(nodeHandle);
        assertInteger(targetDepth, 'targetDepth');
        if (targetDepth < address.depth || targetDepth > GOSPER_MAX_DEPTH) {
            throw new RangeError(`targetDepth must be ${address.depth}..${GOSPER_MAX_DEPTH}`);
        }
        const scale = POW7[targetDepth - address.depth];
        out[0] = address.island;
        out[1] = address.index * scale;
        out[2] = scale;
        out[3] = targetDepth;
        return out;
    }

    /**
     * Fold a generic frontier into one record per island.  This is the only
     * translation island-level residency code needs; it never decodes handle
     * arithmetic.  Visible wins over guard, guard wins over outside.
     */
    summarizePlanByIsland(plan) {
        const classification = new Uint8Array(this.islandCount);
        const projectedDiameterPx = new Float32Array(this.islandCount);
        const distanceMeters = new Float32Array(this.islandCount);
        const viewDepthMeters = new Float32Array(this.islandCount);
        const present = new Uint8Array(this.islandCount);
        distanceMeters.fill(Infinity);
        viewDepthMeters.fill(Infinity);

        const consume = (bucket, value) => {
            for (let i = 0; i < bucket.nodeIds.length; i++) {
                const island = this.getIslandIndex(bucket.nodeIds[i]);
                present[island] = 1;
                classification[island] = Math.max(classification[island], value);
                projectedDiameterPx[island] = Math.max(
                    projectedDiameterPx[island],
                    bucket.projectedDiameterPx[i],
                );
                distanceMeters[island] = Math.min(distanceMeters[island], bucket.distanceMeters[i]);
                viewDepthMeters[island] = Math.min(viewDepthMeters[island], bucket.viewDepthMeters[i]);
            }
        };
        consume(plan.outside, VisibilityClass.OUTSIDE);
        consume(plan.guard, VisibilityClass.GUARD);
        consume(plan.visible, VisibilityClass.VISIBLE);
        return Object.freeze({
            classification,
            projectedDiameterPx,
            distanceMeters,
            viewDepthMeters,
            present,
        });
    }

    _resolveIsland(keyOrIslandIndex) {
        if (typeof keyOrIslandIndex === 'string') {
            const island = this._islandByKey.get(keyOrIslandIndex);
            if (island === undefined) throw new RangeError(`unknown Gosper island ${keyOrIslandIndex}`);
            return island;
        }
        return this._assertIslandIndex(keyOrIslandIndex);
    }

    _assertIslandIndex(islandIndex) {
        assertInteger(islandIndex, 'islandIndex');
        if (islandIndex < 0 || islandIndex >= this.islandCount) {
            throw new RangeError(`islandIndex ${islandIndex} is out of range`);
        }
        return islandIndex;
    }

    _assertHandle(nodeHandle) {
        const handle = Number(nodeHandle);
        if (!(Number.isInteger(handle) && handle >= 0
            && handle < this.islandCount * GOSPER_NODE_COUNT_PER_ISLAND)) {
            throw new RangeError(`invalid Gosper node handle ${nodeHandle}`);
        }
        return handle;
    }

    _address(nodeHandle) {
        const handle = this._assertHandle(nodeHandle);
        const island = Math.floor(handle / GOSPER_NODE_COUNT_PER_ISLAND);
        const local = handle - island * GOSPER_NODE_COUNT_PER_ISLAND;
        const depth = depthForLocalHandle(local);
        const out = this._addressScratch;
        out.island = island;
        out.local = local;
        out.depth = depth;
        out.index = local - GOSPER_DEPTH_STARTS[depth];
        return out;
    }

    _nodeMean(address) {
        const decoded = this._decodedByIsland[address.island];
        const value = decoded?.depths?.[address.depth]?.h?.[address.index];
        return Number.isFinite(value) ? value : this._rootMean[address.island];
    }

    _rawHeightBounds(address) {
        const out = this._rawHeightScratch;
        const island = address.island;
        const rootMin = this._rootMin[island] - this._rootHeightRoundingM;
        const rootMax = this._rootMax[island] + this._rootHeightRoundingM;
        // Aggregate skirts deliberately drop from the representative mean by
        // the *total* subtree relief, not merely to hMin.  This can extend
        // below hMin when the mean is not at hMax, so hMin-minus-slack alone
        // is not a render bound.
        const rootRenderMin = Math.min(
            rootMin,
            this._rootMean[island] - (rootMax - rootMin) - this._aggregateSkirtSafetyM,
        );
        const decoded = this._decodedByIsland[island];
        if (address.depth === 0 || !decoded) {
            out[0] = rootRenderMin;
            out[1] = rootMax;
            return out;
        }

        const record = decoded.depths[address.depth];
        const mean = this._nodeMean(address);
        if (address.depth === GOSPER_MAX_DEPTH) {
            const d1 = recordArray(decoded.unit, 'd1');
            const d2 = recordArray(decoded.unit, 'd2');
            const d3 = recordArray(decoded.unit, 'd3');
            if (d1 && d2 && d3) {
                const e1 = mean - Number(d1[address.index]) * 0.1 - this._unitSkirtSafetyM;
                const e2 = mean - Number(d2[address.index]) * 0.1 - this._unitSkirtSafetyM;
                const e3 = mean - Number(d3[address.index]) * 0.1 - this._unitSkirtSafetyM;
                out[0] = Math.min(mean, e1, e2, e3) - 0.1;
                out[1] = Math.max(mean, e1, e2, e3) + 0.1;
                return out;
            }
            // GSP1 unit records do contain edge deltas, but a consumer may
            // attach only depth arrays.  Root fallback is loose and safe.
            out[0] = rootRenderMin;
            out[1] = rootMax;
            return out;
        }

        const downExtent = recordArray(record, 'downExtent');
        const upExtent = recordArray(record, 'upExtent');
        if (downExtent && upExtent) {
            // GSP2 values are ceil-quantized decimetres and therefore already
            // conservative.  Clip to the exact root interval to avoid float
            // reconstruction noise, then include rendered skirt slack below.
            const down = Number(downExtent[address.index]) * 0.1;
            const up = Number(upExtent[address.index]) * 0.1;
            const subtreeLow = Math.max(rootMin, mean - down);
            const skirtLow = mean - down - up - this._aggregateSkirtSafetyM;
            const high = Math.min(rootMax, mean + Number(upExtent[address.index]) * 0.1);
            out[0] = Math.min(subtreeLow, skirtLow);
            out[1] = high;
            return out;
        }

        const relief = recordArray(record, 'relief');
        if (relief) {
            const encoded = Number(relief[address.index]);
            if (encoded < GSP1_RELIEF_SATURATED) {
                // GSP1 stores only total relief, so symmetric mean +/- relief
                // is necessarily looser than asymmetric bounds but remains
                // conservative after the half-quantum margin.
                const extent = encoded * GSP1_RELIEF_QUANTUM_M + GSP1_RELIEF_ROUNDING_M;
                const low = Math.max(rootMin, mean - extent);
                const high = Math.min(rootMax, mean + extent);
                out[0] = low - this._aggregateSkirtSafetyM;
                out[1] = high;
                return out;
            }
        }

        // relief==255 is saturated/ambiguous in GSP1.  Falling back to the
        // root interval preserves correctness at the cost of vertical culling
        // precision; it must never be treated as exactly 1020 m.
        out[0] = rootRenderMin;
        out[1] = rootMax;
        return out;
    }

    _toSceneY(sourceElevation) {
        return (sourceElevation - this._verticalFloor) * this._verticalFactor + this._verticalOffset;
    }
}
