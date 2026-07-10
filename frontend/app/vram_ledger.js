// Deterministic GPU/network accounting. Geometry and texture allocations are
// tracked independently because their residency lifetimes are independent.

export class VRAMLedger {
    constructor() {
        // Geometry entries keep the historic public shape used by telemetry.
        this.entries = new Map(); // key -> { geometryBytes, q, r, lx, lz }
        this.textureEntries = new Map(); // `${key}:${tier}` -> { key, tier, bytes, ... }

        this.totalGeometryBytes = 0;
        this.totalTextureBytes = 0;
        this.totalNetworkBytes = 0;
        this._networkBin = 0;
        this._networkTex = 0;
    }

    get totalVRAMBytes() {
        return this.totalGeometryBytes + this.totalTextureBytes;
    }

    registerGeometry(key, entry) {
        this.deregisterGeometry(key);
        const value = {
            geometryBytes: entry.geometryBytes || 0,
            q: entry.q,
            r: entry.r,
            lx: entry.lx,
            lz: entry.lz,
        };
        this.entries.set(key, value);
        this.totalGeometryBytes += value.geometryBytes;
    }

    deregisterGeometry(key) {
        const entry = this.entries.get(key);
        if (!entry) return;
        this.totalGeometryBytes -= entry.geometryBytes;
        this.entries.delete(key);
    }

    setTexture(key, tier, bytes, location = null) {
        const id = `${key}:${tier}`;
        this.removeTexture(key, tier);
        const geo = this.entries.get(key);
        const source = location || geo || {};
        this.textureEntries.set(id, {
            key,
            tier,
            bytes: bytes || 0,
            q: source.q,
            r: source.r,
            lx: source.lx,
            lz: source.lz,
        });
        this.totalTextureBytes += bytes || 0;
    }

    removeTexture(key, tier) {
        const id = `${key}:${tier}`;
        const entry = this.textureEntries.get(id);
        if (!entry) return;
        this.totalTextureBytes -= entry.bytes;
        this.textureEntries.delete(id);
    }

    textureBytesFor(key) {
        let total = 0;
        for (const entry of this.textureEntries.values()) {
            if (entry.key === key) total += entry.bytes;
        }
        return total;
    }

    addNetworkPayload(_key, bytes) {
        if (bytes?.bin) {
            this._networkBin += bytes.bin;
            this.totalNetworkBytes += bytes.bin;
        }
        if (bytes?.tex) {
            this._networkTex += bytes.tex;
            this.totalNetworkBytes += bytes.tex;
        }
    }

    getSpatialBreakdown(frustum, cameraPosition, tilesMap) {
        const result = {
            inFrustumBytes: 0,
            outFrustumBytes: 0,
            nearBytes: 0,
            midBytes: 0,
            farBytes: 0,
            tileBreakdown: { inFrustum: 0, outFrustum: 0 },
        };

        for (const [key, entry] of this.entries) {
            const tile = tilesMap?.get(key);
            const tileBytes = entry.geometryBytes + this.textureBytesFor(key);
            const inFrustum = !tile?.bounds || !frustum || frustum.intersectsBox(tile.bounds);
            if (inFrustum) {
                result.inFrustumBytes += tileBytes;
                result.tileBreakdown.inFrustum++;
            } else {
                result.outFrustumBytes += tileBytes;
                result.tileBreakdown.outFrustum++;
            }

            const dx = (entry.lx || 0) - cameraPosition.x;
            const dz = (entry.lz || 0) - cameraPosition.z;
            const dist = Math.hypot(dx, cameraPosition.y, dz);
            if (dist < 2000) result.nearBytes += tileBytes;
            else if (dist < 5000) result.midBytes += tileBytes;
            else result.farBytes += tileBytes;
        }
        return result;
    }

    static formatBytes(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(1)} MB`;
    }
}
