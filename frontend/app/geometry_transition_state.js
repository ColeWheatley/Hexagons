// @atlas: Small, renderer-agnostic state helpers for camera-motion latching and
// deferred geometry commit validation.  Keeping these rules outside the Gosper
// adapter makes wheel/orbit/pan behavior and worker-race tests deterministic.

export const MOVING_GEOMETRY_LEVELS = Object.freeze([5, 4, 3]);
export const SETTLED_GEOMETRY_LEVELS = Object.freeze([5, 4, 3, 2, 1, 0]);

/**
 * MapControls may dispatch wheel start/change/end synchronously, before the
 * next requestAnimationFrame.  This latch keeps that completed event burst in
 * moving mode through at least one rendered frame and a short quiet window.
 */
export class CameraMotionLatch {
    constructor(settleDelayMs = 200) {
        if (!Number.isFinite(settleDelayMs) || settleDelayMs < 0) {
            throw new TypeError('settleDelayMs must be a non-negative finite number');
        }
        this.settleDelayMs = settleDelayMs;
        this.lastMotionTime = -Infinity;
    }

    note(now) {
        if (!Number.isFinite(now)) throw new TypeError('motion time must be finite');
        this.lastMotionTime = Math.max(this.lastMotionTime, now);
    }

    /**
     * Record an actual controls change at event time. The boolean is the one
     * synchronous moving-entry edge; repeated change events only refresh the
     * quiet-window deadline and must not advance the geometry epoch again.
     */
    enterMotion(now, alreadyMoving) {
        this.note(now);
        return !alreadyMoving;
    }

    sample({ now } = {}) {
        if (!Number.isFinite(now)) throw new TypeError('sample time must be finite');
        return now - this.lastMotionTime <= this.settleDelayMs;
    }
}

export function shouldRefreshMotionFromControlsChange(isUserInteracting) {
    return Boolean(isUserInteracting);
}

export function geometryLevelsForMode(isMovingView, binaryVersion = 2) {
    // GSP1 cannot be range-rebuilt after settling, so retain its complete
    // compatibility geometry and merely hide non-L3 levels while moving.
    return binaryVersion >= 2 && isMovingView
        ? MOVING_GEOMETRY_LEVELS
        : SETTLED_GEOMETRY_LEVELS;
}

export function shouldForceCoarseGeometry(isMovingView, awaitingFinalFrontier) {
    return Boolean(isMovingView || awaitingFinalFrontier);
}

/** Resume from a manual LOD pause with one explicit planner/render refresh. */
export function applyLodPauseTransition(target, paused) {
    target.lodPaused = Boolean(paused);
    if (!target.lodPaused) {
        target.needsLODUpdate = true;
        target.needsRender = true;
    }
    return target.lodPaused;
}

/** A deferred worker result may commit only if it is still the desired plan. */
export function geometryBuildCanCommit({
    taskEpoch,
    currentEpoch,
    taskSignature,
    desiredSignature,
    taskMode,
    isMovingView,
}) {
    return taskEpoch === currentEpoch
        && taskSignature === desiredSignature
        && taskMode === (isMovingView ? 'moving' : 'settled');
}
