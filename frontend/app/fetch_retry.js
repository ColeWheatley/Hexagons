// Dependency-free retry/backoff helpers for recoverable asset loading.
export const DEFAULT_RETRY_DELAYS_MS = Object.freeze([1000, 4000, 9000]);

function abortReason(signal) {
    return signal?.reason || new Error('Operation cancelled');
}

function throwIfAborted(signal) {
    if (signal?.aborted) throw abortReason(signal);
}

export function backoffDelayMs(failureCount, {
    delaysMs = DEFAULT_RETRY_DELAYS_MS,
    jitterRatio = 0.2,
    random = Math.random,
} = {}) {
    const index = Math.max(0, Math.min(delaysMs.length - 1, failureCount - 1));
    const base = delaysMs[index] || 0;
    if (base <= 0 || jitterRatio <= 0) return base;
    const jitter = ((random() * 2) - 1) * jitterRatio;
    return Math.max(0, Math.round(base * (1 + jitter)));
}

export class ResourceRetryScheduler {
    constructor({
        maxAttempts = 3,
        delaysMs = DEFAULT_RETRY_DELAYS_MS,
        jitterRatio = 0.2,
        random = Math.random,
        sleep = ms => new Promise(resolve => setTimeout(resolve, ms)),
    } = {}) {
        this.maxAttempts = maxAttempts;
        this.delaysMs = delaysMs;
        this.jitterRatio = jitterRatio;
        this.random = random;
        this.sleep = sleep;
        this.entries = new Map();
    }

    entryFor(key) {
        let entry = this.entries.get(key);
        if (!entry) {
            entry = { attempts: 0, exhausted: false, lastError: null };
            this.entries.set(key, entry);
        }
        return entry;
    }

    reset(key) {
        this.entries.delete(key);
    }

    snapshot(key) {
        const entry = this.entries.get(key);
        return entry ? { ...entry } : { attempts: 0, exhausted: false, lastError: null };
    }

    async sleepUntilRetry(delayMs, signal) {
        if (!signal) return this.sleep(delayMs);
        throwIfAborted(signal);

        let onAbort;
        try {
            await Promise.race([
                this.sleep(delayMs),
                new Promise((_, reject) => {
                    onAbort = () => reject(abortReason(signal));
                    signal.addEventListener('abort', onAbort, { once: true });
                }),
            ]);
        } finally {
            if (onAbort) signal.removeEventListener('abort', onAbort);
        }
        throwIfAborted(signal);
    }

    async run(key, operation, { onRetry, onExhausted, signal } = {}) {
        throwIfAborted(signal);
        const entry = this.entryFor(key);
        if (entry.exhausted) {
            throw entry.lastError || new Error(`Retry budget exhausted for ${key}`);
        }

        while (entry.attempts < this.maxAttempts) {
            throwIfAborted(signal);
            entry.attempts++;
            try {
                const result = await operation({
                    key,
                    attempt: entry.attempts,
                    maxAttempts: this.maxAttempts,
                    signal,
                });
                throwIfAborted(signal);
                this.reset(key);
                return result;
            } catch (error) {
                if (signal?.aborted) throw abortReason(signal);
                entry.lastError = error;
                if (entry.attempts >= this.maxAttempts) {
                    entry.exhausted = true;
                    if (onExhausted) onExhausted({ key, attempts: entry.attempts, error });
                    throw error;
                }
                const delayMs = backoffDelayMs(entry.attempts, {
                    delaysMs: this.delaysMs,
                    jitterRatio: this.jitterRatio,
                    random: this.random,
                });
                if (onRetry) {
                    onRetry({
                        key,
                        attempt: entry.attempts + 1,
                        attemptsUsed: entry.attempts,
                        maxAttempts: this.maxAttempts,
                        delayMs,
                        error,
                    });
                }
                await this.sleepUntilRetry(delayMs, signal);
            }
        }

        entry.exhausted = true;
        throw entry.lastError || new Error(`Retry budget exhausted for ${key}`);
    }
}

export class ResweepScheduler {
    constructor({ onSchedule } = {}) {
        this.pending = new Set();
        this.onSchedule = onSchedule || (() => {});
    }

    schedule(kind) {
        if (this.pending.has(kind)) return false;
        this.pending.add(kind);
        this.onSchedule({ kind, pending: Array.from(this.pending) });
        return true;
    }

    has(kind) {
        return this.pending.has(kind);
    }

    consume(kind) {
        if (!this.pending.has(kind)) return false;
        this.pending.delete(kind);
        return true;
    }

    consumeAll() {
        const kinds = Array.from(this.pending);
        this.pending.clear();
        return kinds;
    }
}
