// @atlas: Geometry-agnostic hierarchical frustum planner.  It deliberately
// knows nothing about Gosper packing (or even hexagons): hierarchy nodes are
// opaque uint32 handles supplied by an adapter, bounds are ordinary AABBs,
// and child order is the adapter's stable order.  The planner returns a
// deterministic frontier of visible, guard-band, and rejected subtrees.

export const FrustumRelation = Object.freeze({
    OUTSIDE: 0,
    INTERSECT: 1,
    INSIDE: 2,
});

export const VisibilityClass = Object.freeze({
    OUTSIDE: 0,
    GUARD: 1,
    VISIBLE: 2,
});

const PLANE_COUNT = 6;
const PLANE_STRIDE = 4;
const BOUNDS_LENGTH = 6;

function finite(value, label) {
    if (!Number.isFinite(value)) throw new TypeError(`${label} must be finite`);
    return value;
}

function matrixElements(matrix) {
    const elements = matrix?.elements ?? matrix;
    if (!elements || elements.length !== 16) {
        throw new TypeError('viewProjection must be a 16-element column-major matrix');
    }
    return elements;
}

function planesArray(planes, label = 'frustum') {
    if (!planes || planes.length !== PLANE_COUNT * PLANE_STRIDE) {
        throw new TypeError(`${label} must contain six vec4 planes`);
    }
    return planes;
}

function normalizePlane(out, offset, x, y, z, w) {
    const length = Math.hypot(x, y, z);
    if (!(length > 0) || !Number.isFinite(length)) {
        throw new RangeError('frustum contains a degenerate plane');
    }
    const inverse = 1 / length;
    out[offset] = x * inverse;
    out[offset + 1] = y * inverse;
    out[offset + 2] = z * inverse;
    out[offset + 3] = w * inverse;
}

/**
 * Extract normalized inward-facing planes from a Three/WebGL-style
 * column-major view-projection matrix.  Inside means dot(n, point) + d >= 0.
 */
export function extractFrustumPlanes(viewProjection, out = new Float64Array(24)) {
    const m = matrixElements(viewProjection);
    if (!out || out.length !== 24) throw new TypeError('out must contain 24 numbers');

    // row4 +/- row1, row2, row3.  Plane order is stable but intentionally
    // semantically irrelevant to the planner.
    normalizePlane(out, 0, m[3] - m[0], m[7] - m[4], m[11] - m[8], m[15] - m[12]);
    normalizePlane(out, 4, m[3] + m[0], m[7] + m[4], m[11] + m[8], m[15] + m[12]);
    normalizePlane(out, 8, m[3] + m[1], m[7] + m[5], m[11] + m[9], m[15] + m[13]);
    normalizePlane(out, 12, m[3] - m[1], m[7] - m[5], m[11] - m[9], m[15] - m[13]);
    normalizePlane(out, 16, m[3] - m[2], m[7] - m[6], m[11] - m[10], m[15] - m[14]);
    normalizePlane(out, 20, m[3] + m[2], m[7] + m[6], m[11] + m[10], m[15] + m[14]);
    return out;
}

/**
 * Conservatively expand a normalized frustum in world metres.  A predicted
 * camera translation biases the guard region in the direction of travel.
 * The result contains both the current frustum and the same frustum
 * translated by predictedTranslation.  Rotation prediction is intentionally
 * left to callers, which may supply any independently constructed guard
 * frustum to the planner.
 */
export function expandFrustumPlanes(
    source,
    {
        marginMeters = 0,
        planeMargins = null,
        predictedTranslation = null,
    } = {},
    out = new Float64Array(24),
) {
    const planes = planesArray(source, 'source');
    if (!out || out.length !== 24) throw new TypeError('out must contain 24 numbers');
    finite(marginMeters, 'marginMeters');
    if (marginMeters < 0) throw new RangeError('marginMeters cannot be negative');
    if (planeMargins && planeMargins.length !== PLANE_COUNT) {
        throw new TypeError('planeMargins must contain six metre values');
    }

    const motion = predictedTranslation ?? [0, 0, 0];
    if (motion.length !== 3) throw new TypeError('predictedTranslation must be a vec3');
    const mx = finite(Number(motion[0]), 'predictedTranslation.x');
    const my = finite(Number(motion[1]), 'predictedTranslation.y');
    const mz = finite(Number(motion[2]), 'predictedTranslation.z');

    for (let plane = 0; plane < PLANE_COUNT; plane++) {
        const offset = plane * PLANE_STRIDE;
        const x = planes[offset];
        const y = planes[offset + 1];
        const z = planes[offset + 2];
        const length = Math.hypot(x, y, z);
        if (!(length > 0)) throw new RangeError('source contains a degenerate plane');

        // Normalize so every expansion value is genuinely measured in metres.
        const inverse = 1 / length;
        const nx = x * inverse;
        const ny = y * inverse;
        const nz = z * inverse;
        const baseD = planes[offset + 3] * inverse;
        const extra = planeMargins ? finite(Number(planeMargins[plane]), `planeMargins[${plane}]`) : 0;
        if (extra < 0) throw new RangeError('planeMargins cannot be negative');

        // A frustum translated by v has d' = d - dot(n, v).  Taking the
        // looser of current and translated planes is a conservative hull of
        // both frusta without assuming anything about hierarchy geometry.
        const motionExpansion = Math.max(0, -(nx * mx + ny * my + nz * mz));
        out[offset] = nx;
        out[offset + 1] = ny;
        out[offset + 2] = nz;
        out[offset + 3] = baseD + marginMeters + extra + motionExpansion;
    }
    return out;
}

/** Classify [minX,minY,minZ,maxX,maxY,maxZ] against six inward planes. */
export function classifyAabb(frustum, bounds, epsilon = 0) {
    const planes = planesArray(frustum);
    if (!bounds || bounds.length !== BOUNDS_LENGTH) {
        throw new TypeError('bounds must be [minX,minY,minZ,maxX,maxY,maxZ]');
    }
    let fullyInside = true;

    for (let plane = 0; plane < PLANE_COUNT; plane++) {
        const offset = plane * PLANE_STRIDE;
        const nx = planes[offset];
        const ny = planes[offset + 1];
        const nz = planes[offset + 2];
        const d = planes[offset + 3];

        const positiveX = nx >= 0 ? bounds[3] : bounds[0];
        const positiveY = ny >= 0 ? bounds[4] : bounds[1];
        const positiveZ = nz >= 0 ? bounds[5] : bounds[2];
        if (nx * positiveX + ny * positiveY + nz * positiveZ + d < -epsilon) {
            return FrustumRelation.OUTSIDE;
        }

        const negativeX = nx >= 0 ? bounds[0] : bounds[3];
        const negativeY = ny >= 0 ? bounds[1] : bounds[4];
        const negativeZ = nz >= 0 ? bounds[2] : bounds[5];
        if (nx * negativeX + ny * negativeY + nz * negativeZ + d < epsilon) {
            fullyInside = false;
        }
    }
    return fullyInside ? FrustumRelation.INSIDE : FrustumRelation.INTERSECT;
}

/**
 * Projection data used only for importance/detail metrics; frustum planes
 * remain the authority for visibility.  viewportHeightPx should be the
 * drawing-buffer height when texture demand is measured in physical pixels.
 */
export function createProjectionContext({
    position,
    forward,
    verticalFovRadians,
    viewportHeightPx,
    near = 0.1,
}) {
    if (!position || position.length !== 3) throw new TypeError('position must be a vec3');
    if (!forward || forward.length !== 3) throw new TypeError('forward must be a vec3');
    const px = finite(Number(position[0]), 'position.x');
    const py = finite(Number(position[1]), 'position.y');
    const pz = finite(Number(position[2]), 'position.z');
    const fx0 = finite(Number(forward[0]), 'forward.x');
    const fy0 = finite(Number(forward[1]), 'forward.y');
    const fz0 = finite(Number(forward[2]), 'forward.z');
    const length = Math.hypot(fx0, fy0, fz0);
    if (!(length > 0)) throw new RangeError('forward cannot be zero');
    const fov = finite(Number(verticalFovRadians), 'verticalFovRadians');
    if (!(fov > 0 && fov < Math.PI)) throw new RangeError('verticalFovRadians must be between 0 and pi');
    const height = finite(Number(viewportHeightPx), 'viewportHeightPx');
    if (!(height > 0)) throw new RangeError('viewportHeightPx must be positive');
    const nearMeters = finite(Number(near), 'near');
    if (!(nearMeters > 0)) throw new RangeError('near must be positive');

    return Object.freeze({
        position: new Float64Array([px, py, pz]),
        forward: new Float64Array([fx0 / length, fy0 / length, fz0 / length]),
        focalLengthPx: 0.5 * height / Math.tan(0.5 * fov),
        viewportHeightPx: height,
        verticalFovRadians: fov,
        near: nearMeters,
    });
}

/**
 * Write [projectedDiameterPx, euclideanDistanceM, forwardDepthM] for a
 * generic importance sphere [x,y,z,r].  The diameter is the conservative
 * on-axis perspective diameter; it becomes Infinity when the sphere reaches
 * the near plane/camera, which correctly forces refinement.
 */
export function writeProjectedSphereMetrics(sphere, projection, out = new Float64Array(3)) {
    if (!sphere || sphere.length !== 4) throw new TypeError('sphere must be [x,y,z,radius]');
    if (!projection) {
        out[0] = NaN;
        out[1] = NaN;
        out[2] = NaN;
        return out;
    }
    const dx = sphere[0] - projection.position[0];
    const dy = sphere[1] - projection.position[1];
    const dz = sphere[2] - projection.position[2];
    const distance = Math.hypot(dx, dy, dz);
    const depth = dx * projection.forward[0] + dy * projection.forward[1] + dz * projection.forward[2];
    const radius = Math.max(0, sphere[3]);

    let diameter = 0;
    if (radius > 0) {
        if (depth <= projection.near + radius) {
            diameter = Infinity;
        } else {
            // Exact for an on-axis sphere and conservative for the small,
            // shallow terrain nodes this planner is designed to rank.
            const tangentDistance = Math.sqrt(Math.max(
                projection.near * projection.near,
                depth * depth - radius * radius,
            ));
            diameter = 2 * projection.focalLengthPx * radius / tangentDistance;
        }
    }
    out[0] = diameter;
    out[1] = distance;
    out[2] = depth;
    return out;
}

class EntryBuffer {
    constructor(initialCapacity = 32) {
        this.length = 0;
        this.nodeIds = new Uint32Array(initialCapacity);
        this.projectedDiameterPx = new Float32Array(initialCapacity);
        this.distanceMeters = new Float32Array(initialCapacity);
        this.viewDepthMeters = new Float32Array(initialCapacity);
        this.containment = new Uint8Array(initialCapacity);
    }

    grow() {
        const capacity = Math.max(16, this.nodeIds.length * 2);
        for (const key of ['nodeIds', 'projectedDiameterPx', 'distanceMeters', 'viewDepthMeters', 'containment']) {
            const old = this[key];
            const next = new old.constructor(capacity);
            next.set(old);
            this[key] = next;
        }
    }

    push(nodeId, metrics, containment) {
        if (this.length === this.nodeIds.length) this.grow();
        const index = this.length++;
        this.nodeIds[index] = nodeId;
        this.projectedDiameterPx[index] = metrics[0];
        this.distanceMeters[index] = metrics[1];
        this.viewDepthMeters[index] = metrics[2];
        this.containment[index] = containment;
    }

    finish() {
        return Object.freeze({
            nodeIds: this.nodeIds.slice(0, this.length),
            projectedDiameterPx: this.projectedDiameterPx.slice(0, this.length),
            distanceMeters: this.distanceMeters.slice(0, this.length),
            viewDepthMeters: this.viewDepthMeters.slice(0, this.length),
            containment: this.containment.slice(0, this.length),
        });
    }
}

function validateHierarchy(hierarchy) {
    for (const name of ['getRoots', 'writeBounds', 'getDepth', 'getChildCount', 'getChild']) {
        if (typeof hierarchy?.[name] !== 'function') {
            throw new TypeError(`hierarchy.${name} must be a function`);
        }
    }
}

/**
 * Build a stable visibility frontier.
 *
 * Adapter contract (all node handles are opaque uint32 values):
 *   getRoots() -> ordered ArrayLike<uint32>
 *   writeBounds(handle, out6)
 *   getDepth(handle) -> non-negative integer
 *   getChildCount(handle), getChild(handle, childIndex)
 * Optional:
 *   isNodeEnabled(handle)
 *   writeProjectionSphere(handle, out4) // otherwise AABB bounding sphere
 *
 * `maxDepth: 0` is the inexpensive island/root pass used by residency and
 * texture selection.  A deeper pass can use `refineProjectedDiameterPx` or
 * `shouldRefine` for geometry compaction.  Fully contained descendants are
 * never plane-tested again; partial nodes are refined in adapter child order.
 */
export function planHierarchicalVisibility({
    hierarchy,
    visibleFrustum,
    guardFrustum,
    projection = null,
    roots = null,
    maxDepth = 0,
    refineProjectedDiameterPx = 0,
    shouldRefine = null,
    epsilon = 0,
} = {}) {
    validateHierarchy(hierarchy);
    const visiblePlanes = planesArray(visibleFrustum, 'visibleFrustum');
    const guardPlanes = planesArray(guardFrustum, 'guardFrustum');
    if (!(Number.isInteger(maxDepth) && maxDepth >= 0)) {
        throw new RangeError('maxDepth must be a non-negative integer');
    }
    finite(refineProjectedDiameterPx, 'refineProjectedDiameterPx');
    if (refineProjectedDiameterPx < 0) {
        throw new RangeError('refineProjectedDiameterPx cannot be negative');
    }
    if (shouldRefine !== null && typeof shouldRefine !== 'function') {
        throw new TypeError('shouldRefine must be a function or null');
    }

    const orderedRoots = roots ?? hierarchy.getRoots();
    if (!orderedRoots || typeof orderedRoots.length !== 'number') {
        throw new TypeError('roots must be an ordered ArrayLike of handles');
    }

    const visible = new EntryBuffer();
    const guard = new EntryBuffer();
    const outside = new EntryBuffer();
    const bounds = new Float64Array(6);
    const sphere = new Float64Array(4);
    const metrics = new Float64Array(3);
    const isEnabled = typeof hierarchy.isNodeEnabled === 'function'
        ? hierarchy.isNodeEnabled.bind(hierarchy)
        : () => true;
    const writesSphere = typeof hierarchy.writeProjectionSphere === 'function';

    const stats = {
        roots: orderedRoots.length,
        visitedNodes: 0,
        disabledNodes: 0,
        planeTests: 0,
        inheritedNodes: 0,
        rejectedSubtrees: 0,
        visibleSubtrees: 0,
        guardSubtrees: 0,
        maxDepthVisited: 0,
    };

    function measure(nodeId) {
        if (writesSphere) {
            hierarchy.writeProjectionSphere(nodeId, sphere);
        } else {
            const cx = (bounds[0] + bounds[3]) * 0.5;
            const cy = (bounds[1] + bounds[4]) * 0.5;
            const cz = (bounds[2] + bounds[5]) * 0.5;
            sphere[0] = cx;
            sphere[1] = cy;
            sphere[2] = cz;
            sphere[3] = Math.hypot(bounds[3] - cx, bounds[4] - cy, bounds[5] - cz);
        }
        writeProjectedSphereMetrics(sphere, projection, metrics);
    }

    function visit(nodeId, inheritedClass) {
        nodeId = Number(nodeId);
        if (!(Number.isInteger(nodeId) && nodeId >= 0 && nodeId <= 0xffffffff)) {
            throw new RangeError(`invalid opaque node handle: ${nodeId}`);
        }
        if (!isEnabled(nodeId)) {
            stats.disabledNodes++;
            return;
        }

        const depth = hierarchy.getDepth(nodeId);
        if (!(Number.isInteger(depth) && depth >= 0)) {
            throw new RangeError(`hierarchy returned invalid depth for ${nodeId}`);
        }
        stats.visitedNodes++;
        stats.maxDepthVisited = Math.max(stats.maxDepthVisited, depth);
        hierarchy.writeBounds(nodeId, bounds);
        measure(nodeId);

        let classification = inheritedClass;
        let containment = FrustumRelation.INSIDE;
        if (inheritedClass === null) {
            const visibleRelation = classifyAabb(visiblePlanes, bounds, epsilon);
            stats.planeTests++;
            if (visibleRelation !== FrustumRelation.OUTSIDE) {
                classification = VisibilityClass.VISIBLE;
                containment = visibleRelation;
            } else {
                const guardRelation = classifyAabb(guardPlanes, bounds, epsilon);
                stats.planeTests++;
                if (guardRelation !== FrustumRelation.OUTSIDE) {
                    classification = VisibilityClass.GUARD;
                    containment = guardRelation;
                } else {
                    outside.push(nodeId, metrics, FrustumRelation.OUTSIDE);
                    stats.rejectedSubtrees++;
                    return;
                }
            }
        } else {
            stats.inheritedNodes++;
        }

        const childCount = hierarchy.getChildCount(nodeId);
        if (!(Number.isInteger(childCount) && childCount >= 0)) {
            throw new RangeError(`hierarchy returned invalid child count for ${nodeId}`);
        }
        let refine = childCount > 0 && depth < maxDepth;
        if (refine) {
            if (shouldRefine) {
                refine = Boolean(shouldRefine(
                    nodeId,
                    depth,
                    metrics[0],
                    classification,
                    containment,
                ));
            } else {
                refine = !Number.isFinite(metrics[0]) || metrics[0] > refineProjectedDiameterPx;
            }
        }

        if (refine) {
            const inheritedForChildren = containment === FrustumRelation.INSIDE
                ? classification
                : null;
            let enabledChildren = 0;
            for (let childIndex = 0; childIndex < childCount; childIndex++) {
                const child = hierarchy.getChild(nodeId, childIndex);
                if (!isEnabled(child)) {
                    stats.disabledNodes++;
                    continue;
                }
                enabledChildren++;
                visit(child, inheritedForChildren);
            }
            if (enabledChildren > 0) return;
        }

        if (classification === VisibilityClass.VISIBLE) {
            visible.push(nodeId, metrics, containment);
            stats.visibleSubtrees++;
        } else {
            guard.push(nodeId, metrics, containment);
            stats.guardSubtrees++;
        }
    }

    for (let index = 0; index < orderedRoots.length; index++) {
        visit(orderedRoots[index], null);
    }

    return Object.freeze({
        visible: visible.finish(),
        guard: guard.finish(),
        outside: outside.finish(),
        stats: Object.freeze(stats),
    });
}
