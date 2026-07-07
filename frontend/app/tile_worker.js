// @atlas: Asynchronous background Web Worker dedicated to parsing 'GSP1' Gosper-island binary tiles and transcoding XUASTC LDR 6x6 KTX2 aerial textures. Decodes the hierarchical offset-coded height tree (level-5 island root + per-depth decimeter deltas), reconstructs absolute heights, and builds per-level instanced mesh buffers whose matrices bake in each Gosper level's sqrt(7)^k scale and k*19.1066deg rotation, plus the parent-center attribute the CDLOD shader cut needs. Textures transcode via the vendored Basis Universal v2 WASM transcoder to whatever GPU format the main thread's capability handshake selected; everything returns via zero-copy transferables.
importScripts('gosper_core.js');

const G = self.GosperCore;
const TILE_LEVEL = G.TILE_LEVEL; // 5

// Aggregate caps (levels >= 1) are hexagon approximations of fractal Gosper
// islands: a parent hex never exactly covers its 7 children's union, so ring
// boundaries between LOD levels show sliver gaps. Overscanning the aggregate
// caps turns gaps into overlaps — invisible top-down (coplanar, same world-
// registered texture) and benign in 3D (nearer/higher cap wins, matching the
// skirtless mosaic look). Units (level 0) stay exact for skirt continuity.
const CAP_OVERSCAN = 1.15;

// =============================================================================
// XUASTC KTX2 TRANSCODING (Basis Universal v2 WASM)
// Ported from ktx2_nonrect_texture_test/BasisV2KTX2Loader.js, minus all DOM
// code — this runs in a classic Web Worker where `importScripts` is available
// but `document`/script-tag loading is not. No THREE import here (workers
// can't reach the CDN module graph); the main thread maps formatKey -> THREE
// compressed-texture format constants.
// =============================================================================

// Only the Basis transcoder target formats this pipeline can ever select.
// The encoder always emits XUASTC LDR 6x6 with -no_alpha, so only the
// no-alpha branches of the original loader's selectTarget() apply.
const BASIS_FORMAT = {
    cTFETC1: 0,
    cTFBC1: 2,
    cTFBC7: 6,
    cTFPVRTC1_4_RGB: 8,
    cTFASTC_LDR_6x6_RGBA: 31,
};

const VENDOR_BASE = new URL('./vendor/basisu_v2/', self.location.href).href;

let workerSupport = null; // set once via INIT, before any texture job runs
let basisModulePromise = null;
let texFailLogged = false;

function loadBasisModule() {
    if (!basisModulePromise) {
        importScripts(new URL('basis_transcoder.js', VENDOR_BASE).href);
        basisModulePromise = globalThis.BASIS({
            locateFile: (file) => new URL(file, VENDOR_BASE).href,
        }).then((module) => {
            module.initializeBasis();
            return module;
        });
    }
    return basisModulePromise;
}

// Select a GPU transcode target using the capability flags reported by the
// main thread's renderer.extensions handshake (worker has no renderer/DOM).
function selectTarget(support) {
    if (!support) return null;
    if (support.astc) {
        // Our encoder always emits XUASTC LDR 6x6 — no other source block size
        // is produced by this pipeline, so no need to branch on the source's
        // reported block dimensions.
        return { basis: BASIS_FORMAT.cTFASTC_LDR_6x6_RGBA, formatKey: 'astc-6x6' };
    }
    if (support.bptc) {
        return { basis: BASIS_FORMAT.cTFBC7, formatKey: 'bc7' };
    }
    if (support.s3tc) {
        // -no_alpha source → BC1/DXT1, never BC3/DXT5
        return { basis: BASIS_FORMAT.cTFBC1, formatKey: 'bc1' };
    }
    if (support.etc1 || support.etc2) {
        return { basis: BASIS_FORMAT.cTFETC1, formatKey: 'etc1' };
    }
    if (support.pvrtc) {
        return { basis: BASIS_FORMAT.cTFPVRTC1_4_RGB, formatKey: 'pvrtc-rgb' };
    }
    return null;
}

async function transcodeKTX2(arrayBuffer) {
    const module = await loadBasisModule();
    const target = selectTarget(workerSupport);
    if (!target) {
        throw new Error('No supported GPU compressed texture format available.');
    }

    const ktx2File = new module.KTX2File(new Uint8Array(arrayBuffer));
    try {
        if (!ktx2File.isValid()) {
            throw new Error('Invalid or unsupported KTX2 file for Basis v2 transcoder.');
        }
        if (!ktx2File.startTranscoding()) {
            throw new Error('Basis v2 startTranscoding failed.');
        }

        const mipmaps = [];
        let gpuBytes = 0;
        let transcodeMs = 0;
        const levels = ktx2File.getLevels();

        for (let level = 0; level < levels; level++) {
            const info = ktx2File.getImageLevelInfo(level, 0, 0);
            const dstSize = ktx2File.getImageTranscodedSizeInBytes(level, 0, 0, target.basis);
            const dst = new Uint8Array(dstSize);
            const levelStart = performance.now();
            if (!ktx2File.transcodeImageWithFlags(dst, level, 0, 0, target.basis, 0, -1, -1)) {
                throw new Error(`Basis v2 transcodeImage failed at mip ${level}.`);
            }
            transcodeMs += performance.now() - levelStart;
            mipmaps.push({ data: dst, width: info.origWidth, height: info.origHeight });
            gpuBytes += dst.byteLength;
        }

        return {
            mipmaps,
            width: ktx2File.getWidth(),
            height: ktx2File.getHeight(),
            formatKey: target.formatKey,
            gpuBytes,
            transcodeMs,
            isSRGB: ktx2File.isSRGB(),
        };
    } finally {
        ktx2File.close();
        ktx2File.delete();
    }
}

// =============================================================================
// GOSPER TILE GEOMETRY (computed once per worker)
// Scene-local convention: x = worldX - islandCenterX, z = -(worldY - centerY).
// =============================================================================
let GEOM = null;
function tileGeometry() {
    if (GEOM) return GEOM;
    const off = G.offsets(TILE_LEVEL); // Int32Array, 2 * 16807, heap order
    const n = off.length / 2;
    const px = new Float32Array(n);
    const pz = new Float32Array(n);
    const h = G.UNIT_HEX_WIDTH_METERS;
    const A = (Math.sqrt(3) / 2) * h;
    for (let i = 0; i < n; i++) {
        const q = off[i * 2], r = off[i * 2 + 1];
        px[i] = q * A;
        pz[i] = -(r * h + q * 0.5 * h);
    }
    const depths = [];
    for (let d = 0; d <= TILE_LEVEL; d++) {
        const level = TILE_LEVEL - d;
        depths.push({
            level,
            count: Math.pow(7, d),
            stride: Math.pow(7, level),      // unit index of node i = i * stride
            xz: G.levelXZ(level),            // {a,b,c,d}: x' = a x + b z ; z' = c x + d z
        });
    }
    GEOM = { n, px, pz, depths };
    return GEOM;
}

self.onmessage = async function (e) {
    const { id, type, data } = e.data;

    if (type === 'INIT') {
        // Capability handshake from main.js — no reply expected.
        workerSupport = data.support;
        return;
    }

    try {
        if (type === 'LOAD_TILE') {
            const result = await loadTile(data);
            // Transfer buffers to avoid copy
            const transferables = [];

            Object.values(result.lods).forEach(lod => {
                if (lod) {
                    transferables.push(lod.matrix.buffer);
                    transferables.push(lod.nz1.buffer);
                    transferables.push(lod.nz2.buffer);
                    transferables.push(lod.slopes.buffer);
                    transferables.push(lod.deltas.buffer);
                    transferables.push(lod.norms.buffer);
                    transferables.push(lod.parentPos.buffer);
                }
            });
            transferables.push(result.unitHeights.buffer);

            // Transfer transcoded mip buffers if a texture was decoded
            if (result.texture) {
                result.texture.mipmaps.forEach(m => transferables.push(m.data.buffer));
            }

            self.postMessage({ id, status: 'success', result }, transferables);

        } else if (type === 'LOAD_TEXTURE') {
            const result = await loadTextureOnly(data);
            const transferables = result.mipmaps.map(m => m.data.buffer);
            self.postMessage({ id, status: 'success', result }, transferables);
        }
    } catch (err) {
        // Error communicated to main thread via postMessage — no console spam
        self.postMessage({ id, status: 'error', error: err.message });
    }
};

async function loadTile({ yq, yr, texUrl, binUrl }) {
    // Parallel Fetch: Bin + LowTexture
    const [binRes, texRes] = await Promise.all([
        fetch(binUrl),
        fetch(texUrl)
    ]);

    if (!binRes.ok) throw new Error(`Failed to load bin: ${binUrl}`);
    const binBuf = await binRes.arrayBuffer();

    let texture = null;
    let texBytes = 0;
    if (texRes.ok) {
        const texBuf = await texRes.arrayBuffer();
        texBytes = texBuf.byteLength;
        try {
            texture = await transcodeKTX2(texBuf);
        } catch (err) {
            // Texture failure is non-fatal by design: bin still succeeds and
            // the tile renders with the magenta no-texture material.
            texture = null;
            if (!texFailLogged) {
                texFailLogged = true;
                console.warn(`[TEX_FAIL] worker transcode failed (further failures suppressed): ${err.message}`);
            }
        }
    }

    const parsed = parseGSP1(binBuf, yq, yr);
    const lods = buildLevelBuffers(parsed);

    let geometryBytes = 0;
    Object.values(lods).forEach(lod => {
        if (!lod) return;
        geometryBytes += lod.matrix.byteLength + lod.nz1.byteLength + lod.nz2.byteLength
            + lod.slopes.byteLength + lod.deltas.byteLength + lod.norms.byteLength
            + lod.parentPos.byteLength;
    });

    return {
        lods,
        texture,
        stats: parsed.stats,
        center: parsed.center,
        unitHeights: parsed.unitHeights, // Float32Array(16807), heap order — main keeps ONE static (dq,dr)->index map
        geometryBytes,
        networkBytes: { bin: binBuf.byteLength, tex: texBytes },
    };
}

async function loadTextureOnly({ url }) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load tex: ${url}`);
    const buf = await res.arrayBuffer();
    // Let transcode failures propagate — main.js's upgradeTexture catch
    // already dedups these warnings, no need to swallow here.
    const texture = await transcodeKTX2(buf);
    return { ...texture, networkBytes: buf.byteLength };
}

// =============================================================================
// GSP1 PARSER — see hex_backend/waffle_iron.py for the authoring side and
// CODEX_GOAL byte tables. Heights are offset-coded against the parent's
// reconstructed value: recon(node) = recon(parent) + dH * 0.1.
// =============================================================================
function parseGSP1(buffer, expectYq, expectYr) {
    const view = new DataView(buffer);
    const sig = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
    if (sig !== 'GSP1') throw new Error(`Invalid signature '${sig}' (want GSP1)`);
    const version = view.getUint16(4, true);
    const tileLevel = view.getUint16(6, true);
    if (version !== 1 || tileLevel !== TILE_LEVEL) {
        throw new Error(`Unsupported GSP1 version ${version} / tileLevel ${tileLevel}`);
    }
    const centerQ = view.getInt32(8, true);
    const centerR = view.getInt32(12, true);
    const latQ = view.getInt32(16, true);
    const latR = view.getInt32(20, true);
    if (expectYq !== undefined && (latQ !== expectYq || latR !== expectYr)) {
        throw new Error(`GSP1 lattice mismatch: file (${latQ},${latR}) vs requested (${expectYq},${expectYr})`);
    }
    const hMean = view.getFloat32(24, true);
    const hMin = view.getFloat32(28, true);
    const hMax = view.getFloat32(32, true);

    // Per-depth decoded arrays. Depth 0 = the header root node.
    const depths = [{
        h: new Float32Array([hMean]),
        slopeMean: new Uint8Array([view.getUint8(36)]),
        nx: new Uint8Array([view.getUint8(38)]),
        nz: new Uint8Array([view.getUint8(39)]),
        valid: new Uint8Array([view.getUint8(40) & 1]),
    }];

    let off = 48;
    let unit = null;
    for (let d = 1; d <= TILE_LEVEL; d++) {
        const count = view.getUint32(off, true); off += 4;
        if (count !== Math.pow(7, d)) throw new Error(`GSP1 depth ${d} count ${count}`);
        const parentH = depths[d - 1].h;
        const h = new Float32Array(count);
        const slopeMean = new Uint8Array(count);
        const nx = new Uint8Array(count);
        const nz = new Uint8Array(count);
        const valid = new Uint8Array(count);

        if (d < TILE_LEVEL) {
            const relief = new Uint8Array(count); // subtree hMax-hMin, 4 m units
            for (let i = 0; i < count; i++) {
                const dH = view.getInt16(off, true);
                slopeMean[i] = view.getUint8(off + 2);
                // off+3 = slopeMax (unused by the renderer for now)
                nx[i] = view.getUint8(off + 4);
                nz[i] = view.getUint8(off + 5);
                relief[i] = view.getUint8(off + 6);
                valid[i] = view.getUint8(off + 7) & 1;
                h[i] = parentH[(i / 7) | 0] + dH * 0.1;
                off += 8;
            }
            depths.push({ h, slopeMean, nx, nz, valid, relief });
        } else {
            const d1 = new Int16Array(count), d2 = new Int16Array(count), d3 = new Int16Array(count);
            const s1 = new Uint8Array(count), s2 = new Uint8Array(count), s3 = new Uint8Array(count);
            for (let i = 0; i < count; i++) {
                const dH = view.getInt16(off, true);
                d1[i] = view.getInt16(off + 2, true);
                d2[i] = view.getInt16(off + 4, true);
                d3[i] = view.getInt16(off + 6, true);
                s1[i] = view.getUint8(off + 8);
                s2[i] = view.getUint8(off + 9);
                s3[i] = view.getUint8(off + 10);
                nx[i] = view.getUint8(off + 11);
                nz[i] = view.getUint8(off + 12);
                valid[i] = view.getUint8(off + 13) & 1;
                h[i] = parentH[(i / 7) | 0] + dH * 0.1;
                off += 14;
            }
            unit = { d1, d2, d3, s1, s2, s3 };
            depths.push({ h, slopeMean, nx, nz, valid });
        }
    }

    return {
        depths, unit,
        unitHeights: depths[TILE_LEVEL].h,
        stats: { min: hMin, max: hMax, avg: hMean, base: hMin },
        center: { q: centerQ, r: centerR, latQ, latR },
    };
}

// =============================================================================
// INSTANCE BUFFER BUILDER — one buffer set per gosper level k (5..0).
// Matrix = T(node) * Ry(k * 19.1066deg) * Sxz(sqrt(7)^k), baked into the 4x4.
// aParentPos carries the parent node's tile-local XZ so the vertex shader can
// evaluate the hierarchical CDLOD cut (draw iff selfDist >= R(k) AND
// parentDist < R(k+1)) without gaps or double-draw at ring boundaries.
// =============================================================================
function buildLevelBuffers(parsed) {
    const { n, px, pz, depths: geomDepths } = tileGeometry();
    const lods = {};

    for (let d = 0; d <= TILE_LEVEL; d++) {
        const gd = geomDepths[d];
        const pd = parsed.depths[d];
        const level = gd.level;
        const isUnit = (level === 0);

        // Count valid instances first (invalid = off-DEM, never rendered)
        let num = 0;
        for (let i = 0; i < pd.valid.length; i++) num += pd.valid[i];
        if (num === 0) { lods[level] = null; continue; }

        const matrix = new Float32Array(num * 16);
        const nz1 = new Float32Array(num * 4);
        const nz2 = new Float32Array(num * 4);
        const slopes = new Float32Array(num * 3);
        const deltas = new Float32Array(num * 3);
        const norms = new Float32Array(num * 2);
        const parentPos = new Float32Array(num * 2);
        const over = isUnit ? 1.0 : CAP_OVERSCAN;
        const a = gd.xz.a * over, b = gd.xz.b * over, c = gd.xz.c * over, dd = gd.xz.d * over;
        const parentStride = gd.stride * 7;

        let w = 0;
        let activeSkirts = 0;
        for (let i = 0; i < pd.valid.length; i++) {
            if (!pd.valid[i]) continue;
            const u = i * gd.stride;         // unit index of this node's center
            const lx = px[u], lz = pz[u];

            const mIdx = w * 16;
            matrix[mIdx + 0] = a; matrix[mIdx + 4] = 0; matrix[mIdx + 8] = b; matrix[mIdx + 12] = lx;
            matrix[mIdx + 1] = 0; matrix[mIdx + 5] = 1; matrix[mIdx + 9] = 0; matrix[mIdx + 13] = 0;
            matrix[mIdx + 2] = c; matrix[mIdx + 6] = 0; matrix[mIdx + 10] = dd; matrix[mIdx + 14] = lz;
            matrix[mIdx + 3] = 0; matrix[mIdx + 7] = 0; matrix[mIdx + 11] = 0; matrix[mIdx + 15] = 1;

            const hh = parsed.depths[d].h[i];
            const n1 = w * 4;
            nz1[n1] = hh; nz1[n1 + 1] = hh; nz1[n1 + 2] = hh; nz1[n1 + 3] = hh;
            nz2[n1] = hh; nz2[n1 + 1] = hh; nz2[n1 + 2] = hh; nz2[n1 + 3] = 0.0;

            const sIdx = w * 3;
            if (isUnit) {
                slopes[sIdx] = parsed.unit.s1[i];
                slopes[sIdx + 1] = parsed.unit.s2[i];
                slopes[sIdx + 2] = parsed.unit.s3[i];
                deltas[sIdx] = parsed.unit.d1[i];
                deltas[sIdx + 1] = parsed.unit.d2[i];
                deltas[sIdx + 2] = parsed.unit.d3[i];
                if (parsed.unit.d1[i] !== 0 || parsed.unit.d2[i] !== 0 || parsed.unit.d3[i] !== 0) activeSkirts++;
            } else {
                const sm = pd.slopeMean[i];
                slopes[sIdx] = sm; slopes[sIdx + 1] = sm; slopes[sIdx + 2] = sm;
                if (level === 1) {
                    // Level-1 caps sit in the most scrutinized ring
                    // (~400-1100 m); hang relief-depth skirts (subtree
                    // hMax-hMin + margin) so neighbor height steps don't
                    // show as black slivers. Deeper levels stay skirtless
                    // by design — the far mosaic look.
                    const dDm = (pd.relief[i] * 4 + 12) * 10; // meters -> decimeters
                    deltas[sIdx] = dDm; deltas[sIdx + 1] = dDm; deltas[sIdx + 2] = dDm;
                    activeSkirts++;
                }
            }

            const nIdx = w * 2;
            norms[nIdx] = pd.nx[i] / 255.0;
            norms[nIdx + 1] = pd.nz[i] / 255.0;

            // Parent center (tile-local). Root (d=0) points at itself, and its
            // material's uLodRadii.y is effectively infinite, so it always draws
            // when the tile is resident and beyond R(5).
            const pu = (d === 0) ? u : ((i / 7) | 0) * parentStride;
            parentPos[nIdx] = px[pu];
            parentPos[nIdx + 1] = pz[pu];

            w++;
        }

        lods[level] = { matrix, nz1, nz2, slopes, deltas, norms, parentPos, activeSkirts, count: num, level };
    }

    return lods;
}
