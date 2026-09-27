// @atlas: One priority queue for every large download (terrain tiles, texture
// Range chunks, prefetch). Real links are bufferbloated: the owner's wifi idles
// at 90 ms but sits at 400-600 ms under load, so every byte already queued in
// the bottleneck delays the next urgent request. The scheduler therefore
// admits requests by *bytes in flight*, sized from measured throughput
// (≈ throughput × targetQueueSeconds), instead of by a fixed request count,
// and always serves the most urgent queued request first. Callers split very
// large transfers into chunks so urgent work can overtake them.

export const NET_PRIORITY = Object.freeze({
    CRITICAL: 400,   // first paint: first terrain tile, first visible texture
    VISIBLE: 300,
    GUARD: 200,
    BACKGROUND: 100, // refinement of already-sharp content, rebuilds
    PREFETCH: 0,     // only when nothing else wants the link
});

const TINY_REQUEST_BYTES = 64 * 1024;

export class NetAbortError extends Error {
    constructor(message = 'Request cancelled') {
        super(message);
        this.name = 'AbortError';
    }
}

function parseContentRange(value) {
    // bytes 0-1023/6351583
    const match = /bytes\s+(\d+)-(\d+)\/(\d+|\*)/i.exec(value || '');
    if (!match) return null;
    return {
        start: Number(match[1]),
        end: Number(match[2]) + 1,
        total: match[3] === '*' ? null : Number(match[3]),
    };
}

export class NetScheduler {
    constructor({
        fetchImpl = (...args) => globalThis.fetch(...args),
        now = () => globalThis.performance?.now?.() ?? Date.now(),
        minBudgetBytes = 1024 * 1024,
        maxBudgetBytes = 8 * 1024 * 1024,
        targetQueueSeconds = 0.5,
        maxConcurrent = 6,
        initialThroughputBps = 1.5e6,
        prefetchMaxConcurrent = 1,
    } = {}) {
        this.fetchImpl = fetchImpl;
        this.now = now;
        this.minBudgetBytes = minBudgetBytes;
        this.maxBudgetBytes = maxBudgetBytes;
        this.targetQueueSeconds = targetQueueSeconds;
        this.maxConcurrent = maxConcurrent;
        this.prefetchMaxConcurrent = prefetchMaxConcurrent;
        this.throughputBps = initialThroughputBps;
        this.ttfbMs = null;
        this.queue = [];
        this.inFlight = new Set();
        this.inFlightBytes = 0;
        this.sequence = 0;
        this.stats = { requests: 0, completed: 0, failed: 0, cancelled: 0, bytes: 0, samples: 0 };
        this._busySince = null;
        this._busyMs = 0;
        this._bytesSinceSample = 0;
    }

    get budgetBytes() {
        // Keep the pipe full across request latency (which balloons under
        // bufferbloat) plus a bounded queue. Measured on real wifi: a
        // throughput-only budget left the link idle between requests, which
        // depressed the estimate and shrank the budget further.
        const latencySeconds = (this.ttfbMs || 0) / 1000;
        const budget = this.throughputBps * (this.targetQueueSeconds + latencySeconds);
        return Math.max(this.minBudgetBytes, Math.min(this.maxBudgetBytes, budget));
    }

    get idle() {
        return this.queue.length === 0 && this.inFlight.size === 0;
    }

    /** Anything more urgent than prefetch waiting or running? */
    get hasDemand() {
        if (this.queue.some(item => item.priority > NET_PRIORITY.PREFETCH)) return true;
        for (const item of this.inFlight) if (item.priority > NET_PRIORITY.PREFETCH) return true;
        return false;
    }

    /**
     * Queue a GET. `start`/`end` (exclusive) request a byte range. Resolves to
     * { bytes: Uint8Array, start, end, total, status, url }.
     */
    request({
        url, start = null, end = null, priority = NET_PRIORITY.BACKGROUND,
        expectedBytes = null, signal = null, label = '', init = {},
    }) {
        const item = {
            url, start, end, priority, label, init, signal,
            expectedBytes: Math.max(1, expectedBytes ?? (end !== null && start !== null ? end - start : 256 * 1024)),
            sequence: this.sequence++,
            controller: null,
            settled: false,
        };
        const promise = new Promise((resolve, reject) => {
            item.resolve = resolve;
            item.reject = reject;
        });
        if (signal?.aborted) {
            item.settled = true;
            item.reject(new NetAbortError());
            return { promise, handle: item };
        }
        if (signal) {
            item.onAbort = () => this.cancel(item);
            signal.addEventListener('abort', item.onAbort, { once: true });
        }
        this.stats.requests++;
        this.queue.push(item);
        this._pump();
        return { promise, handle: item };
    }

    setPriority(handle, priority) {
        if (!handle || handle.settled || handle.priority === priority) return;
        handle.priority = priority;
        this._pump();
    }

    cancel(handle) {
        if (!handle || handle.settled) return;
        const index = this.queue.indexOf(handle);
        if (index >= 0) {
            this.queue.splice(index, 1);
            this._settle(handle, null, new NetAbortError());
            this.stats.cancelled++;
            return;
        }
        if (this.inFlight.has(handle)) {
            handle.cancelled = true;
            handle.controller?.abort();
        }
    }

    cancelWhere(predicate) {
        for (const item of [...this.queue, ...this.inFlight]) if (predicate(item)) this.cancel(item);
    }

    _next() {
        let best = -1;
        for (let i = 0; i < this.queue.length; i++) {
            const item = this.queue[i];
            if (best < 0) { best = i; continue; }
            const current = this.queue[best];
            if (item.priority > current.priority
                || (item.priority === current.priority && item.sequence < current.sequence)) best = i;
        }
        return best;
    }

    _pump() {
        while (this.queue.length) {
            const index = this._next();
            const item = this.queue[index];
            if (this.inFlight.size >= this.maxConcurrent) return;
            if (item.priority <= NET_PRIORITY.PREFETCH) {
                // Prefetch only uses an otherwise idle link.
                let prefetching = 0;
                for (const active of this.inFlight) {
                    if (active.priority > NET_PRIORITY.PREFETCH) return;
                    prefetching++;
                }
                if (prefetching >= this.prefetchMaxConcurrent) return;
            }
            // Tiny urgent requests (coverage imagery, coarse terrain) add
            // almost no queueing, so they never wait behind the byte budget.
            const tinyUrgent = item.expectedBytes <= TINY_REQUEST_BYTES && item.priority >= NET_PRIORITY.VISIBLE;
            if (!tinyUrgent && this.inFlight.size > 0
                && this.inFlightBytes + item.expectedBytes > this.budgetBytes) return;
            this.queue.splice(index, 1);
            this._start(item);
        }
    }

    _markBusy() {
        if (this._busySince === null) this._busySince = this.now();
    }

    _markIdleIfDone() {
        if (this.inFlight.size === 0 && this._busySince !== null) {
            this._busyMs += this.now() - this._busySince;
            this._busySince = null;
        }
    }

    _sampleThroughput(bytes) {
        this._bytesSinceSample += bytes;
        const busyMs = this._busyMs + (this._busySince !== null ? this.now() - this._busySince : 0);
        // Only trust windows long enough to average over RTT and slow start.
        if (busyMs < 120 || this._bytesSinceSample < 64 * 1024) return;
        const sample = this._bytesSinceSample / (busyMs / 1000);
        const alpha = this.stats.samples === 0 ? 1 : 0.35;
        this.throughputBps = alpha * sample + (1 - alpha) * this.throughputBps;
        this.stats.samples++;
        this._bytesSinceSample = 0;
        this._busyMs = 0;
        if (this._busySince !== null) this._busySince = this.now();
    }

    async _start(item) {
        this._markBusy();
        this.inFlight.add(item);
        this.inFlightBytes += item.expectedBytes;
        item.controller = new AbortController();
        const headers = new Headers(item.init.headers || {});
        if (item.start !== null) {
            headers.set('Range', `bytes=${item.start}-${item.end !== null ? item.end - 1 : ''}`);
        }
        const startedAt = this.now();
        let result = null;
        let error = null;
        try {
            const response = await this.fetchImpl(item.url, {
                ...item.init,
                headers,
                signal: item.controller.signal,
            });
            const ttfb = this.now() - startedAt;
            this.ttfbMs = this.ttfbMs === null ? ttfb : 0.8 * this.ttfbMs + 0.2 * ttfb;
            if (response.status !== 200 && response.status !== 206) {
                throw new Error(`HTTP ${response.status} for ${item.url}`);
            }
            const bytes = new Uint8Array(await response.arrayBuffer());
            let range = null;
            if (response.status === 206) {
                range = parseContentRange(response.headers.get('Content-Range'));
                if (!range) throw new Error(`206 without a usable Content-Range for ${item.url}`);
                if (range.end - range.start !== bytes.byteLength) {
                    throw new Error(`Content-Range/body length mismatch for ${item.url}`);
                }
            }
            result = {
                url: item.url,
                status: response.status,
                bytes,
                start: range ? range.start : 0,
                end: range ? range.end : bytes.byteLength,
                total: range ? range.total : bytes.byteLength,
            };
            this.stats.bytes += bytes.byteLength;
            this._sampleThroughput(bytes.byteLength);
        } catch (caught) {
            error = item.cancelled || caught?.name === 'AbortError' ? new NetAbortError() : caught;
        } finally {
            this.inFlight.delete(item);
            this.inFlightBytes -= item.expectedBytes;
            this._markIdleIfDone();
        }
        if (error) {
            if (error.name === 'AbortError') this.stats.cancelled++;
            else this.stats.failed++;
        } else {
            this.stats.completed++;
        }
        this._settle(item, result, error);
        this._pump();
    }

    _settle(item, result, error) {
        if (item.settled) return;
        item.settled = true;
        if (item.signal && item.onAbort) item.signal.removeEventListener('abort', item.onAbort);
        if (error) item.reject(error);
        else item.resolve(result);
    }

    snapshot() {
        return {
            throughputMbps: +(this.throughputBps * 8 / 1e6).toFixed(2),
            ttfbMs: this.ttfbMs === null ? null : Math.round(this.ttfbMs),
            budgetKB: Math.round(this.budgetBytes / 1024),
            inFlight: this.inFlight.size,
            inFlightKB: Math.round(this.inFlightBytes / 1024),
            queued: this.queue.length,
            ...this.stats,
        };
    }
}
