export const WORKER_LANE = Object.freeze({ GEOMETRY: 'geometry', TEXTURE: 'texture' });
export const MAX_TEXTURE_DECODERS = 2;

export function workerLaneForJob(type) {
    return type === 'LOAD_TEXTURE' ? WORKER_LANE.TEXTURE : WORKER_LANE.GEOMETRY;
}

export function workerLaneSizes(workerBudget = 4) {
    const total = Math.min(6, Math.max(2, Number(workerBudget) || 4));
    const texture = total >= 5 ? MAX_TEXTURE_DECODERS : 1;
    return {
        geometry: total - texture,
        texture,
    };
}

export function selectAgedPriorityIndex(queue, { epoch, dispatchSequence = 0, agingInterval = 8 } = {}) {
    let selected = -1;
    let score = -Infinity;
    for (let index = 0; index < (queue || []).length; index++) {
        const task = queue[index];
        if (!task || (epoch !== undefined && task.epoch !== epoch)) continue;
        const age = Math.max(0, dispatchSequence - (task.enqueuedSequence || 0));
        const value = (Number.isFinite(task.priority) ? task.priority : 0)
            + Math.floor(age / Math.max(1, agingInterval)) * 1e9;
        if (selected < 0 || value > score) {
            selected = index;
            score = value;
        }
    }
    return selected;
}

export function cancelStaleViewTasks(queue, epoch, onCancel = () => {}) {
    const retained = [];
    for (const task of queue || []) {
        if (task?.epoch === epoch) retained.push(task);
        else onCancel(task);
    }
    return retained;
}
