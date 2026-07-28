// PowFinder sidecar pyramid atlas + colour-ramp LUT: the GPU carrier for
// per-tile decoded pyramid bytes (design doc §1.5) and the shared ramp LUT
// (§2.5). THREE is dependency-injected, not imported, so the addressing /
// slot-assignment / interleave logic here is testable in Node with a small
// fake THREE (frontend-design's P1.3 ruling) — the same pattern already
// used by render_policy.js's createGeometryWithSharedStaticBuffers /
// createSharedLodInstanceAttributes.
import { buildLutData, RAMP_COUNT } from './sidecar_colormap.mjs';

// Channel assignment, fixed by design doc §1.5: one atlas carries four
// layers simultaneously via RGBA.
const CHANNEL_INDEX = Object.freeze({ sqh: 0, depth: 1, avalanche: 2, surface: 3 });

export const ATLAS_WIDTH = 1024; // device-proof: every WebGL2 impl allows >= 2048
export const ROWS_PER_TILE = 3;  // 3*1024 = 3072 >= 2801 pyramid addresses (271 padding texels)

/**
 * Allocate the per-session pyramid atlas and its manifest-order slot
 * assignment. Static path only (design doc §1.5) — beta needs 197 tiles,
 * well under the ATLAS_WIDTH-bounded slot ceiling; the pooled/LRU variant
 * for larger deployments is a documented future extension, not built here.
 *
 * @param {typeof import('three')} THREE
 * @param {{
 *   manifest: {tiles: Array<{yq: number, yr: number}>},
 *   atlasWidth?: number,
 *   rowsPerTile?: number,
 * }} options
 */
export function createSidecarAtlas(THREE, { manifest, atlasWidth = ATLAS_WIDTH, rowsPerTile = ROWS_PER_TILE } = {}) {
    const tiles = manifest?.tiles;
    if (!Array.isArray(tiles) || tiles.length === 0) {
        throw new Error('createSidecarAtlas: manifest.tiles must be a non-empty array');
    }
    const tileCount = tiles.length;
    const height = tileCount * rowsPerTile;

    // Slot = index into manifest.tiles[], assigned once here, stable for the
    // session (design doc §1.5) — no free list, no lifecycle coupling. Keyed
    // "yq_yr", matching main.js's own tile Map key convention exactly (see
    // `this.tiles = new Map(); // Key: "yq_yr"`), so callers can look up a
    // slot with the same key they already have on hand.
    //
    // Captured into this Map ONCE, here, and never re-derived from tiles[]
    // afterward — every lookup goes through slotByKey/slotFor(), never
    // `tiles.indexOf(...)` or similar. This matters: `slot === array index`
    // is true today but not structurally enforced by anything else, and a
    // future render-ordering refactor that sorted/filtered manifest.tiles
    // in place would silently reassign every tile's atlas row with no
    // errors and no CRC32 mismatch (the sidecar file bytes are unchanged;
    // the corruption is purely in-memory). Callers must call
    // createSidecarAtlas() before anything else has a chance to touch
    // manifest.tiles, and must never build a competing index->slot mapping
    // of their own.
    const slotByKey = new Map();
    tiles.forEach((tile, index) => slotByKey.set(`${tile.yq}_${tile.yr}`, index));

    const data = new Uint8Array(atlasWidth * height * 4);
    const texture = new THREE.DataTexture(data, atlasWidth, height, THREE.RGBAFormat, THREE.UnsignedByteType);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.unpackAlignment = 1;
    texture.needsUpdate = true;

    const installedLayers = new Set();

    function slotFor(key) {
        return slotByKey.has(key) ? slotByKey.get(key) : null;
    }

    function rowBaseFor(key) {
        const slot = slotFor(key);
        return slot === null ? null : slot * rowsPerTile;
    }

    /**
     * Strided interleave of one layer's pyramid bytes into the shared RGBA
     * atlas mirror, then a texSubImage2D GPU refresh. `pyramidBytes` is
     * tileCount * N bytes (N = nodes/tile — 2801 in production, see
     * sidecar_format.mjs's PYRAMID_NODE_COUNT); N is derived from the input
     * length, not hardcoded, so this module carries no dependency on that
     * constant.
     *
     * The "+ texSubImage2D" half of this happens implicitly: three.js only
     * does a full teximage2D allocation on a DataTexture's *first* upload —
     * every subsequent `needsUpdate = true` on an already-allocated texture
     * re-uploads via gl.texSubImage2D automatically (WebGLTextures.js), so
     * no separate low-level GL call belongs here. The renderer that actually
     * owns the GPU context (main.js's) performs the real upload at its next
     * render; this function only needs to touch the CPU-side mirror and flag
     * it dirty, which is also what keeps this fully testable without WebGL.
     */
    function installLayer(layerId, pyramidBytes) {
        const channel = CHANNEL_INDEX[layerId];
        if (channel === undefined) {
            throw new Error(`installLayer: unknown layer "${layerId}"`);
        }
        const bytes = pyramidBytes instanceof Uint8Array ? pyramidBytes : new Uint8Array(pyramidBytes);
        if (bytes.byteLength === 0 || bytes.byteLength % tileCount !== 0) {
            throw new RangeError(`installLayer: pyramidBytes length ${bytes.byteLength} is not a multiple of tileCount (${tileCount})`);
        }
        const nodesPerTile = bytes.byteLength / tileCount;
        const capacity = atlasWidth * rowsPerTile;
        if (nodesPerTile > capacity) {
            throw new RangeError(`installLayer: ${nodesPerTile} nodes/tile exceeds atlas capacity ${capacity} (${rowsPerTile} rows x ${atlasWidth})`);
        }

        for (let t = 0; t < tileCount; t++) {
            const rowBase = t * rowsPerTile;
            const srcBase = t * nodesPerTile;
            for (let addr = 0; addr < nodesPerTile; addr++) {
                const arow = (addr / atlasWidth) | 0;
                const acol = addr - arow * atlasWidth;
                const texelIndex = (rowBase + arow) * atlasWidth + acol;
                data[texelIndex * 4 + channel] = bytes[srcBase + addr];
            }
        }
        installedLayers.add(layerId);
        texture.needsUpdate = true;
    }

    // True once at least one layer has been installed for a valid slot.
    // Every manifest tile shares the same atlas and installLayer always
    // populates every tile's rows in one pass, so per-slot granularity only
    // matters for validating `slot` itself (a real, in-range index) — the
    // pooled/LRU variant (not built here) is where per-slot residency would
    // actually vary.
    function hasData(slot) {
        return Number.isInteger(slot) && slot >= 0 && slot < tileCount && installedLayers.size > 0;
    }

    // Raw CPU-mirror byte size, for VRAMLedger's `sidecar` category (design
    // doc §1.7 — registered for telemetry only, never governed by
    // CacheManager's imagery pool).
    function bytes() {
        return data.byteLength;
    }

    function dispose() {
        texture.dispose();
    }

    return Object.freeze({
        texture, tileCount, atlasWidth, rowsPerTile, height,
        slotFor, rowBaseFor, installLayer, hasData, bytes, dispose,
        // Diagnostics only — not part of the addressing contract other
        // modules should rely on.
        _debugData: data,
        _debugInstalledLayers: installedLayers,
    });
}

/**
 * The colour-ramp LUT, built once at boot from sidecar_colormap.mjs's real
 * buildLutData() (design doc §2.5). A separate function from
 * createSidecarAtlas because the LUT has nothing to do with tile addressing
 * — it needs no manifest at all, and is grouped here only because the P1.3
 * task spec bundles "build the LUT DataTexture" under the same deliverable.
 *
 * @param {typeof import('three')} THREE
 */
export function createSidecarLut(THREE) {
    const data = buildLutData(); // Uint8Array(256 * RAMP_COUNT * 4)
    const texture = new THREE.DataTexture(data, 256, RAMP_COUNT, THREE.RGBAFormat, THREE.UnsignedByteType);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    return texture;
}
