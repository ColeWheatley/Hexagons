// PowFinder sidecar timestamp cache: fetch, decode (via the worker's
// LOAD_SIDECAR job), LRU, and stride-aware prefetch (design doc §1.4/§1.8).
// The interface is frozen by P1.3: this store calls `atlas.installLayer()`
// through the injected `onInstall` callback; it never touches THREE or the
// atlas directly, so it's fully testable with a fake `postJob`.
import { PYRAMID_NODE_COUNT, coverageHas, coverageFor, inferCoverageStride, epochHourToUrl } from './sidecar_format.mjs';

const DEFAULT_BUDGET_BYTES = 32 * 1024 * 1024; // §1.8: ~59 entries at 551,797 B each
const MAX_CONCURRENT_SIDECAR_JOBS = 2; // §1.4

// "retry via ResourceRetryScheduler" (design doc §1.4) — duplicated here,
// not imported, because fetch_retry.js is a plain .js file under this
// package's "type": "commonjs", and (like every other plain .js file in
// this app) cannot actually be imported by `node --test` — same root cause
// P0.1's handoff documented for every other module, just hit here
// transitively via a *dependency* rather than this file itself (this file
// is already .mjs). Renaming fetch_retry.js is out of scope for P2.1: it's
// not a declared touch point, and main.js already imports it as `.js` on
// the shared branch, where an unrelated rename risks a merge collision
// with sibling Phase-2 work. SidecarSidecarRetry below matches
// ResourceRetryScheduler's constructor options and .run() behavior
// (per-key attempt count, exponential backoff with jitter, exhaustion
// throws) but is a minimal, independent reimplementation, not a copy of
// its abort-signal machinery (this store has no cancellation need today).
const DEFAULT_RETRY_DELAYS_MS = [1000, 4000, 9000];

function backoffDelayMs(failureCount, delaysMs, jitterRatio, random) {
    const index = Math.max(0, Math.min(delaysMs.length - 1, failureCount - 1));
    const base = delaysMs[index] || 0;
    if (base <= 0 || jitterRatio <= 0) return base;
    const jitter = ((random() * 2) - 1) * jitterRatio;
    return Math.max(0, Math.round(base * (1 + jitter)));
}

class SidecarRetry {
    constructor({ maxAttempts = 3, delaysMs = DEFAULT_RETRY_DELAYS_MS, jitterRatio = 0.2, random = Math.random, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) } = {}) {
        this.maxAttempts = maxAttempts;
        this.delaysMs = delaysMs;
        this.jitterRatio = jitterRatio;
        this.random = random;
        this.sleep = sleep;
        this.entries = new Map();
    }

    async run(key, operation) {
        let entry = this.entries.get(key);
        if (!entry) { entry = { attempts: 0 }; this.entries.set(key, entry); }
        while (entry.attempts < this.maxAttempts) {
            entry.attempts++;
            try {
                const result = await operation();
                this.entries.delete(key);
                return result;
            } catch (error) {
                if (entry.attempts >= this.maxAttempts) { this.entries.delete(key); throw error; }
                await this.sleep(backoffDelayMs(entry.attempts, this.delaysMs, this.jitterRatio, this.random));
            }
        }
        throw new Error(`SidecarRetry: exhausted for ${key}`);
    }
}

// Prefetch window depths. Re-spec'd per P2.1 amendment 2 (team-lead binding
// ruling): measured production gzip ratios (8-40 KB/hour, 11-62x smaller
// than the design doc §1.8 table's raw-size assumption) leave far more
// bandwidth budget than that table was sized against, and depth != cost --
// in-flight fetches stay capped at MAX_CONCURRENT_SIDECAR_JOBS and installs
// stay one-per-settle regardless of how deep the cache window goes; the
// real budget is atlas texture uploads, not network. Deepened accordingly
// (idle: +/-12 cached hours at stride 1, per the amendment's own example;
// drag: doubled in step). saveData/2g/3g clamp is explicitly retained at
// +/-1 by the same ruling.
const IDLE_PREFETCH_DEPTH = 12;  // D=0: prefetch T +/- S .. T +/- 12S
const DRAG_PREFETCH_DEPTH = 12;  // D!=0: prefetch T+D*S .. T+12*D*S, + one backstop
const SAVE_DATA_PREFETCH_DEPTH = 1; // clamp under saveData / 2g / 3g

function constrainedNetwork(connection) {
    // Same condition as capability_profile.js's resolveCapabilityProfile,
    // duplicated locally (that module isn't a P2.1 touch point) rather than
    // widening its exports for one boolean check.
    return connection?.saveData === true
        || connection?.effectiveType === 'slow-2g'
        || connection?.effectiveType === '2g'
        || connection?.effectiveType === '3g';
}

export class SidecarStore {
    /**
     * @param {object} options
     * @param {(payload: object) => Promise<{pyramid: Uint8Array, networkBytes: number, sourceUrl: string, epochHour: number, layerId: string}>} options.postJob
     *   Dispatches one LOAD_SIDECAR job (real: routed through worker_lanes'
     *   TEXTURE lane to tile_worker.js; fake: whatever a test wants).
     * @param {object} options.index parseSidecarIndex()'s `ok:true` result.
     * @param {number} options.tileCount
     * @param {number} [options.budgetBytes]
     * @param {() => boolean} [options.isMovingView] polled before dispatching
     *   NEW jobs (design doc §1.7: "suspend sidecar fetches ... while moving");
     *   already-in-flight jobs are not cancelled.
     * @param {object} [options.connection] navigator.connection-shaped object,
     *   injected for testability (real caller passes navigator.connection).
     * @param {string} [options.sidecarBase] prepended to url_template output.
     */
    constructor({
        postJob,
        index,
        tileCount,
        budgetBytes = DEFAULT_BUDGET_BYTES,
        isMovingView = () => false,
        connection = null,
        sidecarBase = '',
    } = {}) {
        if (typeof postJob !== 'function') throw new Error('SidecarStore: postJob is required');
        if (!index?.ok) throw new Error('SidecarStore: index must be a parseSidecarIndex() ok:true result');
        if (!Number.isInteger(tileCount) || tileCount <= 0) throw new Error('SidecarStore: tileCount must be a positive integer');

        this.postJob = postJob;
        this.index = index;
        this.tileCount = tileCount;
        this.budgetBytes = budgetBytes;
        this.isMovingView = isMovingView;
        this.connection = connection;
        this.sidecarBase = sidecarBase;
        this.entryBytes = tileCount * PYRAMID_NODE_COUNT;

        this.onInstall = null; // caller-assigned: (layerId, epochHour, bytes) => void

        this.activeLayer = null;
        this.activeTimestamp = null;
        this.scrubStride = 1;
        this.scrubDirection = 0;

        this.cache = new Map(); // `${layerId}@${epochHour}` -> { bytes, lastUsed, epochHour, layerId }
        this.cacheBytes = 0;
        this._lastUsedCounter = 0;

        this.sidecarEpoch = 0;
        this._activeJobs = new Map(); // key -> { promise, isPrefetch, epoch }
        this._queue = []; // pending job descriptors, not yet dispatched (concurrency cap)
        this.retryScheduler = new SidecarRetry();
    }

    // -----------------------------------------------------------------
    // Layer/timestamp selection
    // -----------------------------------------------------------------

    setLayer(layerId) {
        if (layerId === this.activeLayer) return;
        this.activeLayer = layerId;
        // Amendment 3 (binding): stride comes from the layer's own coverage
        // bitmask density (coverageFor + inferCoverageStride), never a
        // hardcoded per-layer-id guess. A scrubber's explicit
        // setScrubStride() (hour vs. day track) still overrides this after
        // the fact -- this is only the default for a freshly-selected layer.
        this.scrubStride = inferCoverageStride(coverageFor(this.index, layerId));
        this.sidecarEpoch++;
        this._ensureActive();
        this._planPrefetch();
    }

    setTimestamp(epochHour) {
        if (epochHour === this.activeTimestamp) return;
        this.activeTimestamp = epochHour;
        this.sidecarEpoch++;
        this._ensureActive();
        this._planPrefetch();
    }

    setScrubStride(hours) {
        this.scrubStride = hours;
        this._planPrefetch();
    }

    setScrubDirection(direction) {
        this.scrubDirection = direction;
        this._planPrefetch();
    }

    // -----------------------------------------------------------------
    // Reads
    // -----------------------------------------------------------------

    /** True raw byte at (slot, address) for `${layerId}@${epochHour}`, or
     * undefined if that layer/timestamp isn't cached. */
    read(layerId, epochHour, slot, address) {
        const entry = this.cache.get(this._key(layerId, epochHour));
        if (!entry) return undefined;
        entry.lastUsed = ++this._lastUsedCounter;
        return entry.bytes[slot * PYRAMID_NODE_COUNT + address];
    }

    /** Raw bytes for every layer currently cached at the ACTIVE timestamp,
     * for one tile/address — design doc §3.4's tap-a-hex popup ("all cached
     * layers are already in RAM"). Layers not yet fetched for this hour are
     * simply absent from the result; decoding (e.g. packed_bits) is the
     * caller's job, not the store's. */
    readAll(slot, address) {
        const out = {};
        for (const layer of this.index.layers) {
            const value = this.read(layer.id, this.activeTimestamp, slot, address);
            if (value !== undefined) out[layer.id] = value;
        }
        return out;
    }

    hasPendingWork() {
        return this._activeJobs.size > 0 || this._queue.length > 0;
    }

    // -----------------------------------------------------------------
    // Internal: cache key, LRU, pins
    // -----------------------------------------------------------------

    _key(layerId, epochHour) {
        return `${layerId}@${epochHour}`;
    }

    _isPinned(key) {
        if (this.activeLayer != null && this.activeTimestamp != null && key === this._key(this.activeLayer, this.activeTimestamp)) return true;
        if (this.activeLayer != null && this.index.latest) {
            const liveHour = Math.floor(Date.parse(this.index.latest) / 3600000);
            if (key === this._key(this.activeLayer, liveHour)) return true;
        }
        return false;
    }

    _store(layerId, epochHour, bytes) {
        const key = this._key(layerId, epochHour);
        this.cache.set(key, { bytes, lastUsed: ++this._lastUsedCounter, epochHour, layerId });
        this.cacheBytes += bytes.byteLength;
        this._evictIfOverBudget();
    }

    _evictIfOverBudget() {
        while (this.cacheBytes > this.budgetBytes) {
            let oldestKey = null;
            let oldestUsed = Infinity;
            for (const [key, entry] of this.cache) {
                if (this._isPinned(key)) continue;
                if (entry.lastUsed < oldestUsed) { oldestUsed = entry.lastUsed; oldestKey = key; }
            }
            if (oldestKey === null) break; // everything left is pinned
            const evicted = this.cache.get(oldestKey);
            this.cache.delete(oldestKey);
            this.cacheBytes -= evicted.bytes.byteLength;
        }
    }

    // -----------------------------------------------------------------
    // Internal: dispatch
    // -----------------------------------------------------------------

    _ensureActive() {
        if (this.activeLayer == null || this.activeTimestamp == null) return;
        const key = this._key(this.activeLayer, this.activeTimestamp);
        const cached = this.cache.get(key);
        if (cached) {
            cached.lastUsed = ++this._lastUsedCounter;
            this.onInstall?.(this.activeLayer, this.activeTimestamp, cached.bytes);
            return;
        }
        this._enqueue({ layerId: this.activeLayer, epochHour: this.activeTimestamp, isPrefetch: false });
    }

    _enqueue(descriptor) {
        const key = this._key(descriptor.layerId, descriptor.epochHour);
        if (this.cache.has(key)) return; // already have it (prefetch landed first)
        if (this._activeJobs.has(key)) return; // already in flight
        if (this._queue.some((d) => this._key(d.layerId, d.epochHour) === key)) return; // already queued
        this._queue.push({ ...descriptor, epoch: this.sidecarEpoch });
        this._drainQueue();
    }

    _drainQueue() {
        if (this.isMovingView()) return; // §1.7: suspend while moving
        while (this._queue.length > 0 && this._activeJobs.size < MAX_CONCURRENT_SIDECAR_JOBS) {
            const descriptor = this._queue.shift();
            this._dispatch(descriptor);
        }
    }

    /** Call on the MOVING -> SETTLED transition (design doc §1.7: "SINTERING
     * / STATIC | drain the sidecar queue"). The store has no motion polling
     * of its own — isMovingView is only consulted when something tries to
     * enqueue or drain, so a queue built up entirely while moving needs an
     * explicit nudge once motion stops. */
    resume() {
        this._drainQueue();
    }

    _layerSpec(layerId) {
        return this.index.layers.find((l) => l.id === layerId) || null;
    }

    _dispatch(descriptor) {
        const { layerId, epochHour, isPrefetch, epoch } = descriptor;
        const key = this._key(layerId, epochHour);
        const layer = this._layerSpec(layerId);
        const url = this.sidecarBase + epochHourToUrl(this.index.urlTemplate, layerId, epochHour);

        const promise = this.retryScheduler.run(key, () => this.postJob({
            type: 'LOAD_SIDECAR',
            url,
            tileCount: this.tileCount,
            layerId,
            epochHour,
            encoding: layer?.encoding,
            aggregate: layer?.aggregate,
            fields: layer?.fields,
        })).then(
            (result) => this._onJobSuccess(descriptor, result),
            (error) => this._onJobFailure(descriptor, error),
        ).finally(() => {
            this._activeJobs.delete(key);
            this._drainQueue();
        });

        this._activeJobs.set(key, { promise, isPrefetch, epoch });
    }

    _onJobSuccess(descriptor, result) {
        const { layerId, epochHour, isPrefetch, epoch } = descriptor;
        // Cache regardless of supersession — a superseded fetch was still
        // paid for (design doc §1.8).
        this._store(layerId, epochHour, result.pyramid);
        if (isPrefetch) return; // prefetches only ever populate the cache
        if (epoch !== this.sidecarEpoch) return; // superseded by a newer setLayer/setTimestamp
        if (layerId !== this.activeLayer || epochHour !== this.activeTimestamp) return; // no longer the active pair
        this.onInstall?.(layerId, epochHour, result.pyramid);
    }

    _onJobFailure(descriptor, _error) {
        // Retry budget is exhausted by the time this fires (ResourceRetryScheduler
        // already retried internally). Nothing else to do: the store simply
        // doesn't have this hour: readAll()/install() calls for it stay absent,
        // and the caller (scrubber/popup) is expected to use coverageHas /
        // nearestPresentHour to steer away from known-bad hours going forward.
    }

    // -----------------------------------------------------------------
    // Prefetch planning (design doc §1.8)
    // -----------------------------------------------------------------

    _planPrefetch() {
        if (this.activeLayer == null || this.activeTimestamp == null) return;
        const layerId = this.activeLayer;
        const T = this.activeTimestamp;
        const S = this.scrubStride || 1;
        const D = this.scrubDirection || 0;
        const depthCap = constrainedNetwork(this.connection) ? SAVE_DATA_PREFETCH_DEPTH : Infinity;

        const candidates = [];
        if (D === 0) {
            const depth = Math.min(IDLE_PREFETCH_DEPTH, depthCap);
            for (let k = 1; k <= depth; k++) {
                candidates.push(T - k * S, T + k * S);
            }
        } else {
            const depth = Math.min(DRAG_PREFETCH_DEPTH, depthCap);
            for (let k = 1; k <= depth; k++) candidates.push(T + D * k * S);
            candidates.push(T - D * S); // single cheap backstop for an overshoot correction
        }

        for (const hour of candidates) {
            // Layer-aware skip (team-lead's consistency requirement): a
            // sparse layer's own bitmask decides what's worth prefetching,
            // never a hardcoded per-layer-id special case.
            if (!coverageHas(this.index, hour, layerId)) continue;
            this._enqueue({ layerId, epochHour: hour, isPrefetch: true });
        }
    }
}
