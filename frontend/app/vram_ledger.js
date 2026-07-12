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
            kind: source.kind || 'texture',
            q: source.q,
            r: source.r,
            pageX: source.pageX,
            pageY: source.pageY,
            lx: source.lx,
            lz: source.lz,
            bounds: source.bounds || null,
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

    updateTextureLocation(key, location) {
        if (!location) return;
        for (const entry of this.textureEntries.values()) {
            if (entry.key !== key) continue;
            entry.kind = location.kind || entry.kind;
            entry.q = location.q;
            entry.r = location.r;
            entry.pageX = location.pageX;
            entry.pageY = location.pageY;
            entry.lx = location.lx;
            entry.lz = location.lz;
            entry.bounds = location.bounds || null;
        }
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
            texturePageBreakdown: {
                inFrustum: 0,
                outFrustum: 0,
                inFrustumAllocations: 0,
                outFrustumAllocations: 0,
            },
            geometryBytes: this.totalGeometryBytes,
            textureBytes: this.totalTextureBytes,
        };

        for (const [key, entry] of this.entries) {
            const tile = tilesMap?.get(key);
            const tileBytes = entry.geometryBytes;
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

        // Texture pages are allocations in their own spatial identity domain.
        // Count each shared GPU object once, never once per geometry consumer.
        const inFrustumPageKeys = new Set();
        const outFrustumPageKeys = new Set();
        for (const entry of this.textureEntries.values()) {
            const inFrustum = !entry.bounds || !frustum || frustum.intersectsBox(entry.bounds);
            if (inFrustum) {
                result.inFrustumBytes += entry.bytes;
                result.texturePageBreakdown.inFrustumAllocations++;
                inFrustumPageKeys.add(entry.key);
            } else {
                result.outFrustumBytes += entry.bytes;
                result.texturePageBreakdown.outFrustumAllocations++;
                outFrustumPageKeys.add(entry.key);
            }
            const dx = (entry.lx || 0) - cameraPosition.x;
            const dz = (entry.lz || 0) - cameraPosition.z;
            const dist = Math.hypot(dx, cameraPosition.y, dz);
            if (dist < 2000) result.nearBytes += entry.bytes;
            else if (dist < 5000) result.midBytes += entry.bytes;
            else result.farBytes += entry.bytes;
        }
        result.texturePageBreakdown.inFrustum = inFrustumPageKeys.size;
        result.texturePageBreakdown.outFrustum = outFrustumPageKeys.size;
        return result;
    }

    static formatBytes(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(1)} MB`;
    }
}
