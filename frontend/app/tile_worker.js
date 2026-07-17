// @atlas: Worker for GSP1/GSP2/current GSP3 island parsing, range-filtered Gosper geometry construction, and XUASTC KTX2 transcoding. GSP2+ loading is two-stage; GSP3 separates terrain relief from exact rendered bounds.
if (!self.GosperCore) {
    importScripts('gosper_core.js');
}

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
// Every named encoder profile emits XUASTC LDR with -no_alpha, so only the
// no-alpha branches of the original loader's selectTarget() apply.
const BASIS_FORMAT = {
    cTFETC1: 0,
    cTFBC1: 2,
    cTFBC7: 6,
    cTFPVRTC1_4_RGB: 8,
    cTFASTC_4x4: 10,
    cTFASTC_LDR_6x6_RGBA: 31,
    cTFASTC_LDR_8x6_RGBA: 33,
};

const ASTC_BY_BLOCK = {
    '4x4': { basis: BASIS_FORMAT.cTFASTC_4x4, formatKey: 'astc-4x4' },
    '6x6': { basis: BASIS_FORMAT.cTFASTC_LDR_6x6_RGBA, formatKey: 'astc-6x6' },
    '8x6': { basis: BASIS_FORMAT.cTFASTC_LDR_8x6_RGBA, formatKey: 'astc-8x6' },
};

const BASIS_TRANSCODER_JS_URL = typeof __BASIS_TRANSCODER_JS_URL__ === 'string'
    ? __BASIS_TRANSCODER_JS_URL__
    : './vendor/basisu_v2/basis_transcoder.js';
const BASIS_TRANSCODER_WASM_URL = typeof __BASIS_TRANSCODER_WASM_URL__ === 'string'
    ? __BASIS_TRANSCODER_WASM_URL__
    : './vendor/basisu_v2/basis_transcoder.wasm';

function resolveWorkerUrl(url) {
    return new URL(url, self.location.href).href;
}

let workerSupport = null; // set once via INIT, before any texture job runs
let basisModulePromise = null;

function loadBasisModule() {
    if (!basisModulePromise) {
        const transcoderUrl = resolveWorkerUrl(BASIS_TRANSCODER_JS_URL);
        const wasmUrl = resolveWorkerUrl(BASIS_TRANSCODER_WASM_URL);
        importScripts(transcoderUrl);
        basisModulePromise = globalThis.BASIS({
            locateFile: (file) => {
                if (file === 'basis_transcoder.wasm') return wasmUrl;
                return new URL(file, transcoderUrl).href;
            },
        }).then((module) => {
            module.initializeBasis();
            return module;
        });
    }
    return basisModulePromise;
}

// Select a GPU transcode target using the capability flags reported by the
// main thread's renderer.extensions handshake (worker has no renderer/DOM).
function selectTarget(support, ktx2File) {
    if (!support) return null;
    if (support.astc) {
        const block = `${ktx2File.getBlockWidth()}x${ktx2File.getBlockHeight()}`;
        const target = ASTC_BY_BLOCK[block];
        if (!target) {
            throw new Error(`Unsupported production XUASTC ASTC block size: ${block}`);
        }
        return target;
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
    const ktx2File = new module.KTX2File(new Uint8Array(arrayBuffer));
    try {
        if (!ktx2File.isValid()) {
            throw new Error('Invalid or unsupported KTX2 file for Basis v2 transcoder.');
        }
        if (!ktx2File.isXUASTC_LDR()) {
            throw new Error('Texture page is not an XUASTC LDR payload.');
        }
        const target = selectTarget(workerSupport, ktx2File);
        if (!target) {
            throw new Error('No supported GPU compressed texture format available.');
        }
        if (!ktx2File.startTranscoding()) {
            throw new Error('Basis v2 startTranscoding failed.');
        }

        const mipmaps = [];
        let gpuBytes = 0;
        let transcodeMs = 0;
        const levels = ktx2File.getLevels();
        const maxTextureSize = Math.max(1, workerSupport?.maxTextureSize || 4096);
        let firstLevel = 0;
        while (firstLevel < levels - 1) {
            const info = ktx2File.getImageLevelInfo(firstLevel, 0, 0);
            if (info.origWidth <= maxTextureSize && info.origHeight <= maxTextureSize) break;
            firstLevel++;
        }

        // A high source remains one logical tier. Devices whose hard GL limit
        // is smaller start at the first supported mip instead of failing upload;
        // this is capability handling, not quality/device profiling.
        for (let level = firstLevel; level < levels; level++) {
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
            width: mipmaps[0].width,
            height: mipmaps[0].height,
            sourceWidth: ktx2File.getWidth(),
            sourceHeight: ktx2File.getHeight(),
            skippedTopMips: firstLevel,
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

            Object.values(result.lods || {}).forEach(lod => {
                if (lod) {
                    transferables.push(lod.matrix.buffer);
                    transferables.push(lod.nz1.buffer);
                    transferables.push(lod.nz2.buffer);
                    transferables.push(lod.slopes.buffer);
                    transferables.push(lod.deltas.buffer);
                    transferables.push(lod.norms.buffer);
                    transferables.push(lod.parentPos.buffer);
                    transferables.push(lod.parentHeight.buffer);
                }
            });
            transferables.push(result.unitHeights.buffer);
            if (result.geometrySource?.byteLength) {
                transferables.push(result.geometrySource);
            }
            if (result.visibilityData) {
                const seen = new Set(transferables);
                for (const depth of result.visibilityData.depths) {
                    for (const array of [
                        depth.h, depth.valid, depth.relief,
                        depth.downExtent, depth.upExtent,
                        depth.renderDown, depth.renderUp,
                    ]) {
                        if (array?.buffer && !seen.has(array.buffer)) {
                            transferables.push(array.buffer);
                            seen.add(array.buffer);
                        }
                    }
                }
                for (const array of Object.values(result.visibilityData.unit || {})) {
                    if (array?.buffer && !seen.has(array.buffer)) {
                        transferables.push(array.buffer);
                        seen.add(array.buffer);
                    }
                }
            }

            self.postMessage({ id, status: 'success', result }, transferables);

        } else if (type === 'BUILD_GEOMETRY') {
            const result = buildGeometryFromSource(data);
            const transferables = [];
            Object.values(result.lods).forEach(lod => {
                if (!lod) return;
                transferables.push(lod.matrix.buffer);
                transferables.push(lod.nz1.buffer);
                transferables.push(lod.nz2.buffer);
                transferables.push(lod.slopes.buffer);
                transferables.push(lod.deltas.buffer);
                transferables.push(lod.norms.buffer);
                transferables.push(lod.parentPos.buffer);
                transferables.push(lod.parentHeight.buffer);
            });
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

async function fetchFirst(urls) {
    const candidates = Array.isArray(urls) ? urls : [urls];
    let last = null;
    for (const url of candidates.filter(Boolean)) {
        const response = await fetch(url);
        last = response;
        if (response.ok) return { response, url };
    }
    return { response: last, url: candidates[candidates.length - 1] };
}

async function loadTile({ yq, yr, binUrl, expectedGspVersion }) {
    const binRes = await fetch(binUrl);
    if (!binRes.ok) throw new Error(`Failed to load bin: ${binUrl}`);
    const binBuf = await binRes.arrayBuffer();

    const parsed = parseGSP1(binBuf, yq, yr);
    if (expectedGspVersion !== undefined && parsed.binaryVersion !== expectedGspVersion) {
        throw new Error(
            `Binary cache mismatch for ${yq}_${yr}: manifest GSP${expectedGspVersion}, parsed GSP${parsed.binaryVersion}`,
        );
    }
    // GSP2+ is a deliberate two-stage load: return its compact hierarchy and
    // source bytes first, let the main thread's generic planner choose L3
    // subtrees, then BUILD_GEOMETRY constructs only those contiguous ranges.
    // Legacy GSP1 keeps the safe, proven full-build fallback.
    const lods = parsed.binaryVersion >= 2 ? null : buildLevelBuffers(parsed);
    const geometryBytes = geometryBytesForLods(lods);

    return {
        lods,
        stats: parsed.stats,
        center: parsed.center,
        unitHeights: parsed.unitHeights, // Float32Array(16807), heap order — main keeps ONE static (dq,dr)->index map
        binaryVersion: parsed.binaryVersion,
        geometrySource: parsed.binaryVersion >= 2 ? binBuf : null,
        visibilityData: {
            depths: parsed.depths.map(depth => ({
                h: depth.h,
                valid: depth.valid,
                relief: depth.relief,
                downExtent: depth.downExtent,
                upExtent: depth.upExtent,
                renderDown: depth.renderDown,
                renderUp: depth.renderUp,
            })),
            unit: parsed.unit,
        },
        geometryBytes,
        networkBytes: { bin: binBuf.byteLength, tex: 0 },
    };
}

function geometryBytesForLods(lods) {
    let geometryBytes = 0;
    Object.values(lods || {}).forEach(lod => {
        if (!lod) return;
        geometryBytes += lod.matrix.byteLength + lod.nz1.byteLength + lod.nz2.byteLength
            + lod.slopes.byteLength + lod.deltas.byteLength + lod.norms.byteLength
            + lod.parentPos.byteLength + lod.parentHeight.byteLength;
    });
    return geometryBytes;
}

function buildGeometryFromSource({
    binBuffer,
    yq,
    yr,
    expectedGspVersion,
    rangesByDepth,
}) {
    if (!(binBuffer instanceof ArrayBuffer)) throw new TypeError('BUILD_GEOMETRY needs binBuffer');
    const parsed = parseGSP1(binBuffer, yq, yr);
    if (expectedGspVersion !== undefined && parsed.binaryVersion !== expectedGspVersion) {
        throw new Error(
            `Geometry source mismatch for ${yq}_${yr}: expected GSP${expectedGspVersion}, parsed GSP${parsed.binaryVersion}`,
        );
    }
    const lods = buildLevelBuffers(parsed, { rangesByDepth });
    return {
        lods,
        geometryBytes: geometryBytesForLods(lods),
        binaryVersion: parsed.binaryVersion,
    };
}

async function loadTextureOnly({ url, urls }) {
    const fetched = await fetchFirst(urls || url);
    const res = fetched.response;
    if (!res?.ok) throw new Error(`Failed to load tex: ${fetched.url}`);
    const buf = await res.arrayBuffer();
    // Let transcode failures propagate — main.js's upgradeTexture catch
    // already dedups these warnings, no need to swallow here.
    const texture = await transcodeKTX2(buf);
    return { ...texture, networkBytes: buf.byteLength, sourceUrl: fetched.url };
}

// =============================================================================
// GSP1/GSP2/GSP3 PARSER. GSP2 adds terrain down/up extents; GSP3 adds exact
// rendered down/up extents. Unit records stay byte-for-byte compatible.
// =============================================================================
function parseGSP1(buffer, expectYq, expectYr) {
    const view = new DataView(buffer);
    const sig = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
    if (sig !== 'GSP1' && sig !== 'GSP2' && sig !== 'GSP3') {
        throw new Error(`Invalid signature '${sig}' (want GSP1/GSP2/GSP3)`);
    }
    const version = view.getUint16(4, true);
    const tileLevel = view.getUint16(6, true);
    const isGsp2 = sig === 'GSP2';
    const isGsp3 = sig === 'GSP3';
    const expectedVersion = isGsp3 ? 3 : (isGsp2 ? 2 : 1);
    if (version !== expectedVersion || tileLevel !== TILE_LEVEL) {
        throw new Error(`Unsupported ${sig} version ${version} / tileLevel ${tileLevel}`);
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

    // Per-depth decoded arrays. Depth 0 = the header root node (its relief
    // comes from the header's exact hMin/hMax, same 4 m quantization).
    const depths = [{
        h: new Float32Array([hMean]),
        slopeMean: new Uint8Array([view.getUint8(36)]),
        nx: new Uint8Array([view.getUint8(38)]),
        nz: new Uint8Array([view.getUint8(39)]),
        valid: new Uint8Array([view.getUint8(40) & 1]),
        relief: new Uint8Array([Math.min(255, Math.round((hMax - hMin) / 4))]),
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
            const hasTerrainExtents = isGsp2 || isGsp3;
            const downExtent = hasTerrainExtents ? new Uint16Array(count) : null;
            const upExtent = hasTerrainExtents ? new Uint16Array(count) : null;
            const renderDown = isGsp3 ? new Uint16Array(count) : null;
            const renderUp = isGsp3 ? new Uint16Array(count) : null;
            for (let i = 0; i < count; i++) {
                const dH = view.getInt16(off, true);
                slopeMean[i] = view.getUint8(off + 2);
                // off+3 = slopeMax (unused by the renderer for now)
                nx[i] = view.getUint8(off + 4);
                nz[i] = view.getUint8(off + 5);
                if (hasTerrainExtents) {
                    downExtent[i] = view.getUint16(off + 6, true);
                    upExtent[i] = view.getUint16(off + 8, true);
                    relief[i] = Math.min(255, Math.ceil((downExtent[i] + upExtent[i]) * 0.1 / 4));
                    if (isGsp3) {
                        renderDown[i] = view.getUint16(off + 10, true);
                        renderUp[i] = view.getUint16(off + 12, true);
                        valid[i] = view.getUint8(off + 14) & 1;
                    } else {
                        valid[i] = view.getUint8(off + 10) & 1;
                    }
                } else {
                    relief[i] = view.getUint8(off + 6);
                    valid[i] = view.getUint8(off + 7) & 1;
                }
                h[i] = parentH[(i / 7) | 0] + dH * 0.1;
                off += isGsp3 ? 16 : (isGsp2 ? 12 : 8);
            }
            depths.push({
                h, slopeMean, nx, nz, valid, relief,
                downExtent, upExtent, renderDown, renderUp,
            });
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
        binaryVersion: version,
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
function validateSelectedRanges(rawRanges, count, depth) {
    if (rawRanges === undefined || rawRanges === null) return null;
    if (typeof rawRanges.length !== 'number' || rawRanges.length % 2 !== 0) {
        throw new TypeError(`depth ${depth} ranges must be start/count pairs`);
    }
    let previousEnd = 0;
    for (let pair = 0; pair < rawRanges.length; pair += 2) {
        const start = Number(rawRanges[pair]);
        const length = Number(rawRanges[pair + 1]);
        const end = start + length;
        if (!Number.isInteger(start) || !Number.isInteger(length) || length <= 0
            || start < previousEnd || end > count) {
            throw new RangeError(`invalid depth ${depth} geometry range ${start}+${length}/${count}`);
        }
        previousEnd = end;
    }
    return rawRanges;
}

function buildLevelBuffers(parsed, selection = null) {
    const { n, px, pz, depths: geomDepths } = tileGeometry();
    const lods = {};

    for (let d = 0; d <= TILE_LEVEL; d++) {
        const gd = geomDepths[d];
        const pd = parsed.depths[d];
        const level = gd.level;
        const isUnit = (level === 0);
        const selectedRanges = validateSelectedRanges(
            selection?.rangesByDepth?.[d],
            pd.valid.length,
            d,
        );
        const rangePairCount = selectedRanges ? selectedRanges.length : 2;

        // Count valid instances first (invalid = off-DEM, never rendered)
        let num = 0;
        for (let pair = 0; pair < rangePairCount; pair += 2) {
            const start = selectedRanges ? selectedRanges[pair] : 0;
            const count = selectedRanges ? selectedRanges[pair + 1] : pd.valid.length;
            const end = start + count;
            for (let i = start; i < end; i++) num += pd.valid[i];
        }
        if (num === 0) { lods[level] = null; continue; }

        const matrix = new Float32Array(num * 16);
        const nz1 = new Float32Array(num * 4);
        const nz2 = new Float32Array(num * 4);
        const slopes = new Float32Array(num * 3);
        const deltas = new Float32Array(num * 3);
        const norms = new Float32Array(num * 2);
        const parentPos = new Float32Array(num * 2);
        const parentHeight = new Float32Array(num);
        const over = isUnit ? 1.0 : CAP_OVERSCAN;
        const a = gd.xz.a * over, b = gd.xz.b * over, c = gd.xz.c * over, dd = gd.xz.d * over;
        const parentStride = gd.stride * 7;

        let w = 0;
        let activeSkirts = 0;
        for (let pair = 0; pair < rangePairCount; pair += 2) {
            const start = selectedRanges ? selectedRanges[pair] : 0;
            const count = selectedRanges ? selectedRanges[pair + 1] : pd.valid.length;
            const end = start + count;
            // This loop visits selected contiguous descendants only. Rejected
            // L3 subtrees never incur per-unit validity/geometry work.
            for (let i = start; i < end; i++) {
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
                // Aggregate caps hang relief-depth skirts (subtree hMax-hMin
                // + margin) so neighbor height steps don't read as black
                // sliver stripes when SETTLED. While MOVING the main thread
                // hides aggregate skirt meshes — large skirtless caps, the
                // fast panning mode.
                //
                // Every aggregate keeps its subtree slope class, and hangs a
                // full-relief skirt. The main thread gives aggregates six-sided
                // skirt geometry, so exposed edges at mixed-size LOD cuts are
                // sealed and remain immediately identifiable by slope color.
                    const sm = pd.slopeMean[i];
                    slopes[sIdx] = sm; slopes[sIdx + 1] = sm; slopes[sIdx + 2] = sm;
                    const reliefMeters = pd.downExtent && pd.upExtent
                        ? (pd.downExtent[i] + pd.upExtent[i]) * 0.1
                        : pd.relief[i] * 4;
                    const dDm = (reliefMeters + 12) * 10;
                    deltas[sIdx] = dDm; deltas[sIdx + 1] = dDm; deltas[sIdx + 2] = dDm;
                    activeSkirts++;
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
                parentHeight[w] = (d === 0) ? hh : parsed.depths[d - 1].h[(i / 7) | 0];

                w++;
            }
        }

        lods[level] = {
            matrix, nz1, nz2, slopes, deltas, norms, parentPos, parentHeight,
            activeSkirts, count: num, level,
            selectedSourceCount: selectedRanges
                ? Array.from({ length: selectedRanges.length / 2 }, (_, pair) => selectedRanges[pair * 2 + 1])
                    .reduce((sum, count) => sum + count, 0)
                : pd.valid.length,
            sourceCount: pd.valid.length,
        };
    }

    return lods;
}
