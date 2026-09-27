// @atlas: Growing byte prefixes of published KTX2 texture pages. A page is
// fetched with HTTP Range requests only as far as the finest mip level the
// view actually needs (see ktx2_prefix.js); later refinements append to the
// same prefix, so no byte is ever downloaded twice in a session, and every
// prefix is persisted to Cache Storage so later visits and pan-backs re-use it
// without the network. Transfers go through the shared NetScheduler in
// ≤ chunkBytes pieces so urgent requests can overtake a multi-MB refinement.
import './ktx2_prefix.js';
import { NET_PRIORITY, NetAbortError } from './net_scheduler.mjs';

const K = globalThis.Ktx2Prefix;

export const TEXTURE_PREFIX_CACHE = 'hx2-ktx2-prefix-v1';

function concat(a, aLength, b) {
    const out = new Uint8Array(aLength + b.byteLength);
    if (aLength) out.set(a.subarray(0, aLength), 0);
    out.set(b, aLength);
    return out;
}

export class TextureByteStore {
    constructor({
        scheduler,
        cacheStorage = globalThis.caches ?? null,
        cacheName = TEXTURE_PREFIX_CACHE,
        memoryBudgetBytes = 192 * 1024 * 1024,
        firstRangeBytes = 32 * 1024,
        chunkBytes = 1024 * 1024,
        now = () => globalThis.performance?.now?.() ?? Date.now(),
    }) {
        this.scheduler = scheduler;
        this.cacheStorage = cacheStorage;
        this.cacheName = cacheName;
        this.memoryBudgetBytes = memoryBudgetBytes;
        this.firstRangeBytes = firstRangeBytes;
        this.chunkBytes = chunkBytes;
        this.now = now;
        this.entries = new Map();
        this.memoryBytes = 0;
        this.stats = { networkBytes: 0, cacheHits: 0, cacheBytes: 0, requests: 0, persistFailures: 0, earlyResolves: 0 };
        this._cachePromise = null;
        // Without a working Cache Storage (plain-http LAN hosts, disabled
        // storage) nothing is ever "persisted", so eviction may not wait for it.
        this._noCache = !cacheStorage;
    }

    _cache() {
        if (!this.cacheStorage) return Promise.resolve(null);
        this._cachePromise ??= this.cacheStorage.open(this.cacheName).catch(() => {
            this._noCache = true;
            return null;
        });
        return this._cachePromise;
    }

    _entry(url) {
        let entry = this.entries.get(url);
        if (!entry) {
            entry = {
                url, bytes: null, length: 0, header: null, total: null,
                lastUsed: this.now(), chain: Promise.resolve(), persistedLength: 0,
                restored: false, activeHandle: null, activePriority: null,
                waiters: new Set(), runningWaiter: null, persistFailed: false,
            };
            this.entries.set(url, entry);
        }
        return entry;
    }

    /** Synchronous view of what is already in memory. */
    peek(url) {
        const entry = this.entries.get(url);
        if (!entry) return null;
        if (entry.generic) return { length: entry.length, total: entry.total, inMemory: entry.bytes !== null };
        if (!entry.header) return null;
        return {
            length: entry.length,
            total: entry.total,
            header: entry.header,
            level: K.levelForPrefix(entry.header, entry.length),
            inMemory: entry.bytes !== null,
        };
    }

    setPriority(url, priority) {
        const entry = this.entries.get(url);
        if (!entry) return;
        for (const waiter of entry.waiters) waiter.priority = priority;
        this._syncActivePriority(entry);
    }

    /**
     * Download priority of a URL = the most urgent caller still waiting on it
     * (a prefetch that a visible request queued behind inherits the visible
     * priority only while that request waits, never permanently).
     */
    _effectivePriority(entry, floor = -Infinity) {
        let priority = floor;
        for (const waiter of entry.waiters) priority = Math.max(priority, waiter.priority);
        return Number.isFinite(priority) ? priority : NET_PRIORITY.BACKGROUND;
    }

    _syncActivePriority(entry) {
        if (!entry.activeHandle) return;
        const priority = this._effectivePriority(entry, entry.activePriority ?? -Infinity);
        this.scheduler.setPriority(entry.activeHandle, priority);
    }

    /**
     * Serialize work per URL (appends must stay contiguous), but let a caller
     * finish as soon as the bytes it needs are present — whether they already
     * were, or arrive as part of another caller's larger download — instead of
     * waiting for that whole download.
     */
    _enqueue(entry, priority, ready, work) {
        entry.lastUsed = this.now();
        const early = ready();
        if (early) return Promise.resolve(early);
        const waiter = { priority, ready, resolve: null, settled: false };
        const woken = new Promise(resolve => { waiter.resolve = resolve; });
        entry.waiters.add(waiter);
        this._syncActivePriority(entry);
        const run = async () => {
            if (waiter.settled) return null;
            const done = ready();
            if (done) return done;
            entry.runningWaiter = waiter; // gets the full result (incl. networkBytes) from work()
            try {
                return await work();
            } finally {
                if (entry.runningWaiter === waiter) entry.runningWaiter = null;
            }
        };
        const chained = entry.chain.then(run, run);
        entry.chain = chained.catch(() => {});
        return Promise.race([chained, woken]).finally(() => {
            waiter.settled = true;
            entry.waiters.delete(waiter);
            this._syncActivePriority(entry);
        });
    }

    _wakeWaiters(entry) {
        for (const waiter of entry.waiters) {
            if (waiter.settled || waiter === entry.runningWaiter) continue;
            const result = waiter.ready();
            if (result) {
                this.stats.earlyResolves++;
                waiter.resolve(result);
            }
        }
    }

    _prefixReady(entry, needEnd) {
        if (!entry.bytes || entry.length === 0) return null;
        if (entry.length < needEnd && (entry.total === null || entry.length < entry.total)) return null;
        return { bytes: entry.bytes.subarray(0, entry.length), total: entry.total, networkBytes: 0 };
    }

    _levelReady(entry, level) {
        if (!entry.bytes || !entry.header) return null;
        const target = Math.max(0, Math.min(entry.header.levels - 1, level));
        if (entry.length < K.prefixEndForLevel(entry.header, target)) return null;
        return {
            bytes: entry.bytes.subarray(0, entry.length),
            header: entry.header,
            level: K.levelForPrefix(entry.header, entry.length),
            networkBytes: 0,
        };
    }

    /**
     * Generic prefix: resolve once bytes [0, needEnd) are present (or the
     * whole object, if shorter). Used for terrain tiles, whose coarse levels
     * sit at fixed offsets. Returns { bytes, total, networkBytes }.
     */
    ensurePrefix(url, needEnd, { priority = NET_PRIORITY.BACKGROUND, signal = null } = {}) {
        const entry = this._entry(url);
        entry.generic = true;
        return this._enqueue(entry, priority, () => this._prefixReady(entry, needEnd),
            () => this._ensurePrefix(entry, needEnd, priority, signal));
    }

    /**
     * Make logical bytes [start, end) of `url` present by fetching a whole
     * separate object (`sourceUrl`) that holds exactly that span — e.g. a
     * brotli-encoded part of a terrain tile, which the browser decodes
     * transparently. Overlap with bytes already held is dropped, so the
     * prefix stays contiguous and nothing already present is re-appended.
     */
    ensureSegment(url, { start, end, sourceUrl, total = null, priority = NET_PRIORITY.BACKGROUND, signal = null }) {
        const entry = this._entry(url);
        entry.generic = true;
        return this._enqueue(entry, priority, () => this._prefixReady(entry, end),
            () => this._ensureSegment(entry, start, end, sourceUrl, total, priority, signal));
    }

    async _ensureSegment(entry, start, end, sourceUrl, total, priority, signal) {
        entry.lastUsed = this.now();
        await this._reloadEvictedBytes(entry);
        await this._restore(entry);
        let networkBytes = 0;
        if (entry.length < end) {
            if (entry.length < start) {
                throw new Error(`Segment [${start}, ${end}) of ${entry.url} needs bytes from ${entry.length}`);
            }
            const { promise, handle } = this.scheduler.request({
                url: sourceUrl, priority: this._effectivePriority(entry, priority),
                expectedBytes: Math.max(1, Math.round((end - start) * 0.55)), signal, label: 'segment',
            });
            entry.activeHandle = handle;
            entry.activePriority = priority;
            let result;
            try {
                result = await promise;
            } finally {
                entry.activeHandle = null;
                entry.activePriority = null;
            }
            this.stats.requests++;
            this.stats.networkBytes += result.bytes.byteLength; // decoded size (wire is smaller)
            networkBytes += result.bytes.byteLength;
            if (result.bytes.byteLength !== end - start) {
                throw new Error(`Segment ${sourceUrl} is ${result.bytes.byteLength} B, expected ${end - start}`);
            }
            const tail = result.bytes.subarray(entry.length - start);
            this._append(entry, { status: 206, start: entry.length, bytes: tail, total: total ?? entry.total });
            this._persist(entry);
        }
        entry.lastUsed = this.now();
        this._enforceMemoryBudget(entry);
        return {
            bytes: entry.bytes ? entry.bytes.subarray(0, entry.length) : new Uint8Array(0),
            total: entry.total,
            networkBytes,
        };
    }

    async _ensurePrefix(entry, needEnd, priority, signal) {
        entry.lastUsed = this.now();
        await this._reloadEvictedBytes(entry);
        await this._restore(entry);
        let networkBytes = 0;
        try {
            while (entry.length < needEnd && (entry.total === null || entry.length < entry.total)) {
                const end = Math.min(needEnd, entry.length + this.chunkBytes);
                const chunk = await this._fetchRange(entry, entry.length, end, priority, signal);
                networkBytes += chunk.bytes.byteLength;
                this._append(entry, chunk);
            }
        } finally {
            this._persist(entry);
        }
        entry.lastUsed = this.now();
        this._enforceMemoryBudget(entry);
        return {
            bytes: entry.bytes ? entry.bytes.subarray(0, entry.length) : new Uint8Array(0),
            total: entry.total,
            networkBytes,
        };
    }

    /**
     * Resolve with a prefix holding every mip level >= `level`.
     * Returns { bytes, header, level, networkBytes }. `bytes` is a view the
     * caller must copy before transferring.
     */
    ensureLevel(url, level, { priority = NET_PRIORITY.BACKGROUND, signal = null } = {}) {
        const entry = this._entry(url);
        return this._enqueue(entry, priority, () => this._levelReady(entry, level),
            () => this._ensure(entry, level, priority, signal));
    }

    async _restore(entry) {
        if (entry.restored) return;
        entry.restored = true;
        if (entry.bytes !== null && entry.length > 0) return;
        const cache = await this._cache();
        if (!cache) return;
        try {
            const response = await cache.match(entry.url);
            if (!response) return;
            const bytes = new Uint8Array(await response.arrayBuffer());
            const header = entry.generic ? null : K.parseHeader(bytes);
            if ((!entry.generic && !header) || bytes.byteLength <= entry.length) return;
            const total = Number(response.headers.get('X-Hx-Total')) || null;
            this._setBytes(entry, bytes, bytes.byteLength);
            entry.header = header;
            entry.total = total;
            if (entry.header) entry.header.fileSize = total;
            entry.persistedLength = bytes.byteLength;
            this.stats.cacheHits++;
            this.stats.cacheBytes += bytes.byteLength;
            this._wakeWaiters(entry);
        } catch {
            // A corrupt or evicted cache entry just means a network refetch.
        }
    }

    async _reloadEvictedBytes(entry) {
        if (entry.bytes !== null || entry.length === 0) return;
        // Metadata survived a memory eviction; the bytes live in Cache Storage.
        const keepLength = entry.length;
        entry.length = 0;
        entry.restored = false;
        await this._restore(entry);
        if (entry.length < keepLength) {
            // Cache lost it: start over from the network.
            entry.header = null;
            entry.total = null;
            entry.length = entry.bytes ? entry.bytes.byteLength : 0;
        }
    }

    async _fetchRange(entry, start, end, priority, signal) {
        const { promise, handle } = this.scheduler.request({
            url: entry.url, start, end, priority: this._effectivePriority(entry, priority),
            expectedBytes: end - start, signal, label: 'texture-prefix',
        });
        entry.activeHandle = handle;
        entry.activePriority = priority;
        try {
            const result = await promise;
            this.stats.requests++;
            this.stats.networkBytes += result.bytes.byteLength;
            return result;
        } finally {
            entry.activeHandle = null;
            entry.activePriority = null;
        }
    }

    _append(entry, result) {
        if (!entry.bytes && entry.length > 0) {
            // Evicted between chunks; appending would leave a hole of zeros.
            throw new Error(`Prefix of ${entry.url} was evicted mid-download`);
        }
        if (result.status === 200) {
            // The server ignored the Range header: we now own the whole file.
            this._setBytes(entry, result.bytes, result.bytes.byteLength);
            entry.total = result.bytes.byteLength;
            return;
        }
        if (result.start !== entry.length) {
            throw new Error(`Non-contiguous range for ${entry.url}: have ${entry.length}, got ${result.start}`);
        }
        this._setBytes(entry, concat(entry.bytes || new Uint8Array(0), entry.length, result.bytes), entry.length + result.bytes.byteLength);
        if (result.total) entry.total = result.total;
        this._wakeWaiters(entry);
    }

    _setBytes(entry, bytes, length) {
        this.memoryBytes -= entry.bytes ? entry.bytes.byteLength : 0;
        entry.bytes = bytes;
        entry.length = length;
        this.memoryBytes += bytes.byteLength;
    }

    async _ensure(entry, level, priority, signal) {
        entry.lastUsed = this.now();
        await this._reloadEvictedBytes(entry);
        await this._restore(entry);
        let networkBytes = 0;
        if (!entry.header) {
            const first = await this._fetchRange(entry, entry.length, Math.max(entry.length + 1, this.firstRangeBytes), priority, signal);
            networkBytes += first.bytes.byteLength;
            this._append(entry, first);
            let header = K.parseHeader(entry.bytes.subarray(0, entry.length));
            while (!header) {
                const need = K.headerBytesNeeded(entry.bytes.subarray(0, entry.length));
                if (entry.total !== null && entry.length >= entry.total) throw new Error(`Truncated KTX2 header: ${entry.url}`);
                const more = await this._fetchRange(entry, entry.length, need, priority, signal);
                networkBytes += more.bytes.byteLength;
                this._append(entry, more);
                header = K.parseHeader(entry.bytes.subarray(0, entry.length));
            }
            entry.header = header;
            entry.header.fileSize = entry.total;
            this._wakeWaiters(entry);
        }
        entry.header.fileSize = entry.total;
        const target = Math.max(0, Math.min(entry.header.levels - 1, level));
        const need = K.prefixEndForLevel(entry.header, target);
        try {
            while (entry.length < need) {
                const end = Math.min(need, entry.length + this.chunkBytes);
                const chunk = await this._fetchRange(entry, entry.length, end, priority, signal);
                networkBytes += chunk.bytes.byteLength;
                this._append(entry, chunk);
            }
        } finally {
            // Whatever arrived is kept (and persisted) even if we were cancelled.
            this._persist(entry);
        }
        entry.lastUsed = this.now();
        this._enforceMemoryBudget(entry);
        return {
            bytes: entry.bytes.subarray(0, entry.length),
            header: entry.header,
            level: K.levelForPrefix(entry.header, entry.length),
            networkBytes,
        };
    }

    _persist(entry) {
        if (!entry.bytes || entry.length <= entry.persistedLength || (!entry.generic && !entry.header)) return;
        const length = entry.length;
        const body = entry.bytes.slice(0, length);
        this._cache().then(cache => {
            if (!cache) return;
            return cache.put(entry.url, new Response(body, {
                headers: { 'Content-Type': 'application/octet-stream', 'X-Hx-Total': String(entry.total ?? '') },
            })).then(() => {
                entry.persistedLength = Math.max(entry.persistedLength, length);
                entry.persistFailed = false;
            });
        }).catch(() => {
            // Quota or storage errors: this entry may now be evicted unsaved.
            entry.persistFailed = true;
            this.stats.persistFailures++;
        });
    }

    _enforceMemoryBudget(keep) {
        if (this.memoryBytes <= this.memoryBudgetBytes) return;
        const victims = [...this.entries.values()]
            .filter(entry => entry !== keep && entry.bytes !== null && entry.activeHandle === null
                && entry.waiters.size === 0
                && (entry.persistedLength >= entry.length || this._noCache || entry.persistFailed))
            .sort((a, b) => a.lastUsed - b.lastUsed);
        for (const victim of victims) {
            if (this.memoryBytes <= this.memoryBudgetBytes) break;
            this.memoryBytes -= victim.bytes.byteLength;
            victim.bytes = null;
            if (victim.persistedLength < victim.length) {
                // Nothing (or only an older, shorter copy) is in Cache Storage:
                // forget the prefix so the next use restores or re-fetches it.
                victim.length = 0;
                victim.header = null;
                victim.total = null;
                victim.persistedLength = 0;
                victim.restored = false;
            }
            // Otherwise header/length metadata stay; bytes reload from Cache Storage.
        }
    }

    snapshot() {
        let resident = 0;
        for (const entry of this.entries.values()) if (entry.bytes) resident++;
        return {
            pages: this.entries.size,
            residentPages: resident,
            memoryMB: +(this.memoryBytes / 1048576).toFixed(1),
            networkMB: +(this.stats.networkBytes / 1048576).toFixed(2),
            cacheMB: +(this.stats.cacheBytes / 1048576).toFixed(2),
            requests: this.stats.requests,
            cacheHits: this.stats.cacheHits,
            persistFailures: this.stats.persistFailures,
        };
    }
}

export { NetAbortError };
