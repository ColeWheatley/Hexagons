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
        this.highEntries = new Map(); // key -> { bytes, lastUsed }
        this.highBytes = 0;

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

    /**
     * Admit one decoded high texture. Least-recently-used high textures are
     * downgraded first; geometry and lower texture tiers are never involved.
     * `evictHigh` must synchronously switch the affected tile to a lower tier
     * before disposing its high texture.
     */
    admitHigh(key, bytes, evictHigh, protectedKeys = new Set()) {
        if (bytes > this.budget) return false;

        const previous = this.highEntries.get(key);
        const previousBytes = previous?.bytes || 0;
        while (this.highBytes - previousBytes + bytes > this.budget) {
            let victimKey = null;
            let oldest = Infinity;
            for (const [candidateKey, entry] of this.highEntries) {
                if (candidateKey === key || protectedKeys.has(candidateKey)) continue;
                if (entry.lastUsed < oldest) {
                    oldest = entry.lastUsed;
                    victimKey = candidateKey;
                }
            }
            if (victimKey === null) return false;

            const victim = this.highEntries.get(victimKey);
            if (evictHigh(victimKey) === false) {
                // The caller could not provide a safe lower-tier replacement.
                // Protect it for this admission attempt and look elsewhere.
                protectedKeys.add(victimKey);
                continue;
            }
            this.removeHigh(victimKey);
            this.evictionCount++;
            this.evictedBytes += victim.bytes;
            this.evictedHistory.add(victimKey);
        }

        if (previous) this.highBytes -= previous.bytes;
        this.highEntries.set(key, { bytes, lastUsed: performance.now() });
        this.highBytes += bytes;
        if (this.evictedHistory.has(key)) this.redownloadCount++;
        return true;
    }

    removeHigh(key) {
        const entry = this.highEntries.get(key);
        if (!entry) return;
        this.highEntries.delete(key);
        this.highBytes -= entry.bytes;
        // The caller owns actual texture disposal/ledger removal; this manager
        // tracks only the high-tier safety pool.
    }
}
