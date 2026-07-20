// High-resolution texture safety pool.
//
// Geometry and the two always-available imagery tiers are deliberately not
// governed here.  They have different lifetimes and must never be torn down as
// a side effect of admitting a 4096px texture.  The browser has no portable
// "free VRAM" query, so one conservative, globally tunable high-tier ceiling is
// the only policy this module enforces for now.

export const DEFAULT_HIGH_TEXTURE_BUDGET = 256 * 1024 * 1024;

export class CacheManager {
    constructor(budget = DEFAULT_HIGH_TEXTURE_BUDGET) {
        this.budget = budget;
        this.highEntries = new Map(); // key -> { bytes, lastUsed, priority }
        this.highBytes = 0;
        // Monotonic signal used by temporarily rejected arrivals. A change to
        // resident membership or distance priority means admission should be
        // reconsidered without retrying the same doomed upload every frame.
        this.revision = 0;

        // Browser-observable lifetime telemetry.
        this.evictionCount = 0;
        this.evictedBytes = 0;
        this.redownloadCount = 0;
        this.evictedHistory = new Set();
    }

    get utilization() {
        return this.budget > 0 ? this.highBytes / this.budget : 1;
    }

    get headroom() {
        return Math.max(0, this.budget - this.highBytes);
    }

    touch(key, now = performance.now()) {
        const entry = this.highEntries.get(key);
        if (entry) entry.lastUsed = now;
    }

    /** Update camera-distance value without perturbing LRU recency. */
    updatePriority(key, priority) {
        const entry = this.highEntries.get(key);
        if (!entry) return;
        const next = Number.isFinite(priority) ? priority : 0;
        if (entry.priority === next) return;
        entry.priority = next;
        this.revision++;
    }

    /**
     * Admit one decoded high texture. Least-recently-used high textures are
     * downgraded first; geometry and lower texture tiers are never involved.
     * `evictHigh` must synchronously switch the affected tile to a lower tier
     * before disposing its high texture.
     */
    admitHigh(
        key,
        bytes,
        evictHigh,
        protectedKeys = new Set(),
        priority = 0,
        canEvictHigh = () => true,
    ) {
        if (bytes > this.budget) return false;
        const incomingPriority = Number.isFinite(priority) ? priority : 0;

        const previous = this.highEntries.get(key);
        const previousBytes = previous?.bytes || 0;
        let projectedBytes = this.highBytes - previousBytes + bytes;
        const victims = Array.from(this.highEntries.entries())
            .filter(([candidateKey]) => candidateKey !== key
                && !protectedKeys.has(candidateKey)
                && canEvictHigh(candidateKey))
            .sort((a, b) => (a[1].priority - b[1].priority)
                || (a[1].lastUsed - b[1].lastUsed));
        const plannedVictims = [];
        for (const [victimKey, victim] of victims) {
            if (projectedBytes <= this.budget) break;
            // Plan the entire transaction before mutating anything. This
            // prevents evicting one peripheral texture and only later finding
            // that the remaining required victim outranks the arrival.
            if (victim.priority > incomingPriority) return false;
            plannedVictims.push([victimKey, victim]);
            projectedBytes -= victim.bytes;
        }
        if (projectedBytes > this.budget) return false;

        for (const [victimKey, victim] of plannedVictims) {
            if (evictHigh(victimKey) === false) {
                throw new Error(`preflighted high-texture eviction failed for ${victimKey}`);
            }
            this.removeHigh(victimKey);
            this.evictionCount++;
            this.evictedBytes += victim.bytes;
            this.evictedHistory.add(victimKey);
        }

        if (previous) this.highBytes -= previous.bytes;
        this.highEntries.set(key, {
            bytes,
            lastUsed: performance.now(),
            priority: incomingPriority,
        });
        this.highBytes += bytes;
        this.revision++;
        if (this.evictedHistory.has(key)) this.redownloadCount++;
        return true;
    }

    removeHigh(key) {
        const entry = this.highEntries.get(key);
        if (!entry) return;
        this.highEntries.delete(key);
        this.highBytes -= entry.bytes;
        this.revision++;
        // The caller owns actual texture disposal/ledger removal; this manager
        // tracks only the high-tier safety pool.
    }
}
