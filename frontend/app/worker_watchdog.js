export const WORKER_JOB_TIMEOUT_MS = 30000;
export const WORKER_JOB_MAX_TIMEOUTS = 2;

export class WorkerWatchdogBookkeeper {
    constructor({
        timeoutMs = WORKER_JOB_TIMEOUT_MS,
        maxTimeouts = WORKER_JOB_MAX_TIMEOUTS,
        now = () => performance.now(),
    } = {}) {
        this.timeoutMs = timeoutMs;
        this.maxTimeouts = maxTimeouts;
        this.now = now;
        this.jobs = new Map();
    }

    track(id, workerIndex, metadata = {}, now = this.now()) {
        const previous = this.jobs.get(id);
        this.jobs.set(id, {
            id,
            workerIndex,
            startedAt: now,
            timeouts: previous?.timeouts || metadata.timeouts || 0,
            metadata,
        });
    }

    complete(id) {
        return this.jobs.delete(id);
    }

    requeue(id, workerIndex, now = this.now()) {
        const job = this.jobs.get(id);
        if (!job) return null;
        job.workerIndex = workerIndex;
        job.startedAt = now;
        return { ...job };
    }

    expired(now = this.now()) {
        const expired = [];
        for (const job of this.jobs.values()) {
            if (now - job.startedAt >= this.timeoutMs) expired.push({ ...job });
        }
        return expired;
    }

    recordTimeout(id) {
        const job = this.jobs.get(id);
        if (!job) return null;
        job.timeouts++;
        return {
            id,
            workerIndex: job.workerIndex,
            timeouts: job.timeouts,
            shouldFail: job.timeouts >= this.maxTimeouts,
            metadata: job.metadata,
        };
    }

    timeUntilNextDeadline(now = this.now()) {
        if (this.jobs.size === 0) return null;
        let min = Infinity;
        for (const job of this.jobs.values()) {
            min = Math.min(min, this.timeoutMs - (now - job.startedAt));
        }
        return Math.max(0, min);
    }

    snapshot() {
        return Array.from(this.jobs.values()).map(job => ({ ...job }));
    }
}
