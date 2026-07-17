// Renderer-independent accounting for material work.  WebGL program-cache
// internals are deliberately not used because they are not stable Three APIs.
export function createMaterialChurnStats() {
    return { compileCalls: 0, materialShaderSetups: 0, materialReplacements: 0,
        traversalCalls: 0, traversedObjects: 0, textureSerializationWarnings: 0,
        uniformPasses: 0, uniformCandidates: 0, uniformWrites: 0,
        unchangedUniformWritesAvoided: 0, resizeEvents: 0, motionEvents: 0,
        renderCycleCount: 0, renderCycleTotalMs: 0, renderCycleMaxMs: 0 };
}
export function resetMaterialChurnStats(stats) { for (const key of Object.keys(stats)) stats[key] = 0; }
export function snapshotMaterialChurnStats(stats) {
    return {
        ...stats,
        renderCycleAverageMs: stats.renderCycleCount
            ? stats.renderCycleTotalMs / stats.renderCycleCount
            : 0,
    };
}
export function recordRenderCycle(stats, durationMs) {
    if (!stats || !Number.isFinite(durationMs) || durationMs < 0) return false;
    stats.renderCycleCount++;
    stats.renderCycleTotalMs += durationMs;
    stats.renderCycleMaxMs = Math.max(stats.renderCycleMaxMs, durationMs);
    return true;
}
function sameValue(a, b) {
    if (a === b) return true;
    if (!a || !b || !Number.isFinite(a.x) || !Number.isFinite(b.x) ||
        a.x !== b.x || a.y !== b.y) return false;
    return a.z === undefined || b.z === undefined || a.z === b.z;
}
// Three reads uniform.value during render. Skipping an identical assignment is
// therefore visually identical while avoiding JS/vector mutation work.
export function writeUniformIfChanged(uniform, next, stats) {
    if (!uniform) return false;
    stats.uniformCandidates++;
    if (sameValue(uniform.value, next)) { stats.unchangedUniformWritesAvoided++; return false; }
    if (uniform.value?.copy && next?.x !== undefined) uniform.value.copy(next);
    else if (uniform.value?.set && next?.x !== undefined) uniform.value.set(next.x, next.y);
    else uniform.value = next;
    stats.uniformWrites++;
    return true;
}
