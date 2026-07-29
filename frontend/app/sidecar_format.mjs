// PowFinder sidecar format: the consumer contract for per-(layer,timestamp)
// L1 bytes coming out of the bake pipeline, plus the additive `index.json`
// timestamp index. See docs/reports/powfinder-frontend-design.md §0-1 for the
// full rationale; this module is the single source of truth for the byte
// layout and pyramid-address math described there. No THREE.js, no DOM — this
// file must run identically in a worker, the main thread, and `node --test`.
//
// Extension note: this is `.mjs`, not `.js`. `frontend/app/package.json` sets
// `"type": "commonjs"`, so a plain `.js` file using `export` syntax cannot be
// imported by `node --test` (verified: Node throws `SyntaxError: Named export
// '<x>' not found` on the ESM import path, and a hard syntax error on a CJS
// `require()`). Every other logic module in this app that is unit-tested via
// real function calls (material_churn.mjs, navigation_overlay.mjs,
// app_lifecycle.mjs, loading_screen.mjs, resource_lifecycle.mjs) is already
// `.mjs` for exactly this reason — this file follows that precedent.

// -----------------------------------------------------------------------
// Pyramid geometry
// -----------------------------------------------------------------------

// Per-depth node counts for the L1 (depth 0..4) pyramid. This intentionally
// stops at depth 4 (2401 nodes/tile) — the sidecar has no finer granularity;
// depth-5 unit hexes resolve to their L1 parent (see pyramidAddress below).
export const PYRAMID_DEPTH_COUNTS = [1, 7, 49, 343, 2401];
// Running sum of PYRAMID_DEPTH_COUNTS, i.e. the flat offset where each
// depth's block starts inside the 2801-entry per-tile pyramid.
export const PYRAMID_DEPTH_OFFSETS = [0, 1, 8, 57, 400];
// Sum of PYRAMID_DEPTH_COUNTS: 1 + 7 + 49 + 343 + 2401 = 2801.
export const PYRAMID_NODE_COUNT = 2801;
// Depth at which the sidecar body's raw bytes live (one gosper level 1
// "flower", 16.93 m flat-to-flat). Also the deepest level the pyramid holds.
export const L1_DEPTH = 4;
// Bytes of raw sidecar body per tile: PYRAMID_DEPTH_COUNTS[L1_DEPTH].
export const L1_NODE_COUNT = PYRAMID_DEPTH_COUNTS[L1_DEPTH];
// Full gosper heap depth (unit hexes, 6.4 m). Node indices at this depth are
// only ever consumed by pyramidAddress() to resolve an L1 parent address —
// the sidecar/pyramid never stores anything at this depth.
export const UNIT_DEPTH = 5;

// Reserved sentinel byte value. Every layer treats 0 as "no data" (off-DEM,
// outside the model domain, glacier/rock/water, or an hour the model
// skipped) with the real domain living in 1..255. Confirmed convention —
// see design doc §1.1 backend ask.
export const SIDECAR_NODATA = 0;

/**
 * Pyramid address for a node at (depth, heapIndex), 0..2800.
 * Unit hexes (depth 5) resolve to their L1 parent — the sidecar has no finer
 * granularity than a level-1 flower. Depths 0..4 are a straight offset lookup
 * and round-trip exactly (address - PYRAMID_DEPTH_OFFSETS[depth] === index);
 * depth 5 is many-to-one (7 units share one L1 parent) by design.
 */
export function pyramidAddress(depth, index) {
    if (!Number.isInteger(depth) || depth < 0 || depth > UNIT_DEPTH) {
        throw new RangeError(`pyramidAddress: depth out of range [0,${UNIT_DEPTH}]: ${depth}`);
    }
    if (!Number.isInteger(index) || index < 0) {
        throw new RangeError(`pyramidAddress: index must be a non-negative integer: ${index}`);
    }
    return depth >= L1_DEPTH
        ? PYRAMID_DEPTH_OFFSETS[L1_DEPTH] + Math.floor(index / Math.pow(7, depth - L1_DEPTH))
        : PYRAMID_DEPTH_OFFSETS[depth] + index;
}

// -----------------------------------------------------------------------
// Pyramid reduction (buildPyramid)
// -----------------------------------------------------------------------

function reduceMean(values) {
    let sum = 0;
    for (let i = 0; i < values.length; i++) sum += values[i];
    return Math.round(sum / values.length);
}

function reduceMax(values) {
    let m = values[0];
    for (let i = 1; i < values.length; i++) if (values[i] > m) m = values[i];
    return m;
}

// Most common non-NODATA value among a node's children. Ties (equal counts)
// break toward the smaller byte value — arbitrary but deterministic, and
// irrelevant in practice since a real tie means the children disagree evenly
// and either choice is defensible.
function reduceMode(values) {
    let best = values[0];
    let bestCount = 0;
    for (let i = 0; i < values.length; i++) {
        let count = 0;
        for (let j = 0; j < values.length; j++) if (values[j] === values[i]) count++;
        if (count > bestCount || (count === bestCount && values[i] < best)) {
            best = values[i];
            bestCount = count;
        }
    }
    return best;
}

// Bitwise OR — the right reducer for a one-bit flag field (e.g. "did any
// child release?"): a coarse hex should show a hazard if ANY descendant has
// it, never average or vote it away.
function reduceOr(values) {
    let r = 0;
    for (let i = 0; i < values.length; i++) r |= values[i];
    return r;
}

const BUILTIN_REDUCERS = { mean: reduceMean, max: reduceMax, mode: reduceMode, or: reduceOr };

/**
 * Expand a sidecar body's flat depth-4 (L1) bytes into the full 2801-entry
 * per-tile pyramid (depths 0..4 concatenated), reducing depth 3 -> 0 with
 * `reducer`. NODATA children are skipped; a parent whose children are all
 * NODATA is itself NODATA (never fabricates a value from nothing).
 *
 * Scalar layers only (`u8_linear`, `u8_class`). A `packed_bits` layer's byte
 * is several independent fields, not one scalar — reducing it here would be
 * wrong (see buildPackedPyramid's doc comment for the exact failure mode).
 * Use buildPackedPyramid for those.
 *
 * @param {Uint8Array|ArrayBuffer} body   tileCount * 2401 bytes, tiles in
 *   manifest order, depth-4 heap order within each tile (post header-strip —
 *   see parseSidecarBody).
 * @param {number} tileCount
 * @param {'mean'|'max'|'mode'|'or'|(values: Uint8Array) => number} reducer
 * @param {number} [nodata]
 * @returns {Uint8Array} tileCount * 2801 bytes.
 */
export function buildPyramid(body, tileCount, reducer, nodata = SIDECAR_NODATA) {
    const reduceFn = typeof reducer === 'function' ? reducer : BUILTIN_REDUCERS[reducer];
    if (!reduceFn) throw new Error(`buildPyramid: unknown reducer "${reducer}"`);
    if (!Number.isInteger(tileCount) || tileCount <= 0) {
        throw new RangeError(`buildPyramid: tileCount must be a positive integer, got ${tileCount}`);
    }
    const bytes = body instanceof Uint8Array ? body : new Uint8Array(body);
    const expectedBytes = tileCount * L1_NODE_COUNT;
    if (bytes.byteLength !== expectedBytes) {
        throw new RangeError(
            `buildPyramid: body length ${bytes.byteLength} !== tileCount(${tileCount}) * ${L1_NODE_COUNT} (${expectedBytes})`,
        );
    }

    const pyramid = new Uint8Array(tileCount * PYRAMID_NODE_COUNT);
    const scratch = new Uint8Array(7);

    for (let t = 0; t < tileCount; t++) {
        const srcBase = t * L1_NODE_COUNT;
        const dstBase = t * PYRAMID_NODE_COUNT;

        // Depth-4 leaves copy straight across.
        pyramid.set(bytes.subarray(srcBase, srcBase + L1_NODE_COUNT), dstBase + PYRAMID_DEPTH_OFFSETS[L1_DEPTH]);

        // Reduce depth 3 -> 0, each parent from its 7 children.
        for (let d = L1_DEPTH - 1; d >= 0; d--) {
            const childBase = dstBase + PYRAMID_DEPTH_OFFSETS[d + 1];
            const parentBase = dstBase + PYRAMID_DEPTH_OFFSETS[d];
            const parentCount = PYRAMID_DEPTH_COUNTS[d];
            for (let i = 0; i < parentCount; i++) {
                const base = childBase + i * 7;
                let n = 0;
                for (let c = 0; c < 7; c++) {
                    const v = pyramid[base + c];
                    if (v !== nodata) scratch[n++] = v;
                }
                pyramid[parentBase + i] = n === 0 ? nodata : reduceFn(scratch.subarray(0, n));
            }
        }
    }

    return pyramid;
}

/**
 * Expand a `packed_bits` sidecar body's flat depth-4 bytes into the full
 * 2801-entry per-tile pyramid, reducing depth 3 -> 0 **field by field**
 * rather than on the raw byte (contract amendment, post-review — the design
 * doc originally called for a single scalar reducer on the raw byte, which
 * is wrong for a packed byte: its bits are independent fields, not one
 * scalar. Concretely, raw-byte `max(128, 127)` = 128 = {release: 1, severity:
 * 0} — one neighbour with release-but-no-severity would silently overwrite
 * six neighbours' severity=127 with severity=0). Each field in `fields`
 * (the shape of an index.json layer's `fields` object, e.g.
 * `{release: {shift,bits,aggregate}, severity: {shift,bits,aggregate}}`) is
 * decoded, reduced independently among non-NODATA children with its own
 * `aggregate`, then repacked with encodePacked.
 *
 * A whole child node is skipped (not per-field) when its raw byte === nodata
 * — NODATA is a property of the sidecar byte, not of any one field.
 *
 * @param {Uint8Array|ArrayBuffer} body tileCount * 2401 bytes (post header-strip)
 * @param {number} tileCount
 * @param {object} fields e.g. `{release: {shift, bits, aggregate}, ...}`
 * @param {number} [nodata]
 * @returns {Uint8Array} tileCount * 2801 bytes.
 */
export function buildPackedPyramid(body, tileCount, fields, nodata = SIDECAR_NODATA) {
    const fieldNames = Object.keys(fields || {});
    if (fieldNames.length === 0) {
        throw new Error('buildPackedPyramid: fields must declare at least one field');
    }
    const fieldReducers = {};
    for (const name of fieldNames) {
        const spec = fields[name];
        const reduceFn = typeof spec.aggregate === 'function' ? spec.aggregate : BUILTIN_REDUCERS[spec.aggregate];
        if (!reduceFn) throw new Error(`buildPackedPyramid: unknown aggregate "${spec.aggregate}" for field "${name}"`);
        fieldReducers[name] = reduceFn;
    }
    if (!Number.isInteger(tileCount) || tileCount <= 0) {
        throw new RangeError(`buildPackedPyramid: tileCount must be a positive integer, got ${tileCount}`);
    }
    const bytes = body instanceof Uint8Array ? body : new Uint8Array(body);
    const expectedBytes = tileCount * L1_NODE_COUNT;
    if (bytes.byteLength !== expectedBytes) {
        throw new RangeError(
            `buildPackedPyramid: body length ${bytes.byteLength} !== tileCount(${tileCount}) * ${L1_NODE_COUNT} (${expectedBytes})`,
        );
    }

    const pyramid = new Uint8Array(tileCount * PYRAMID_NODE_COUNT);
    // Per-field scratch buffers of decoded child values, reused across nodes.
    const scratch = {};
    for (const name of fieldNames) scratch[name] = new Uint8Array(7);

    for (let t = 0; t < tileCount; t++) {
        const srcBase = t * L1_NODE_COUNT;
        const dstBase = t * PYRAMID_NODE_COUNT;

        pyramid.set(bytes.subarray(srcBase, srcBase + L1_NODE_COUNT), dstBase + PYRAMID_DEPTH_OFFSETS[L1_DEPTH]);

        for (let d = L1_DEPTH - 1; d >= 0; d--) {
            const childBase = dstBase + PYRAMID_DEPTH_OFFSETS[d + 1];
            const parentBase = dstBase + PYRAMID_DEPTH_OFFSETS[d];
            const parentCount = PYRAMID_DEPTH_COUNTS[d];
            for (let i = 0; i < parentCount; i++) {
                const base = childBase + i * 7;
                let n = 0;
                for (let c = 0; c < 7; c++) {
                    const raw = pyramid[base + c];
                    if (raw === nodata) continue;
                    for (const name of fieldNames) scratch[name][n] = decodePacked(raw, fields[name]);
                    n++;
                }
                if (n === 0) {
                    pyramid[parentBase + i] = nodata;
                    continue;
                }
                const fieldValues = {};
                for (const name of fieldNames) fieldValues[name] = fieldReducers[name](scratch[name].subarray(0, n));
                pyramid[parentBase + i] = encodePacked(fieldValues, fields);
            }
        }
    }

    return pyramid;
}

// -----------------------------------------------------------------------
// Sidecar body: optional 32-byte PFL1 header, sniffed not required
// -----------------------------------------------------------------------

export const PFL1_MAGIC = 'PFL1';
export const PFL1_HEADER_BYTES = 32;

function parsePfl1Header(bytes) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    // Layout (little-endian, matching this repo's GSP3 binary convention):
    //   'PFL1' | u16 version | u16 layerId | u32 epochHour | u32 tileCount |
    //   u16 nodeCount | u8 encoding | u8 aggregate | u32 manifestHash | 8 reserved
    // = 32 bytes total. CANONICAL per team-lead ruling: the design doc's field
    // list sums to 24 bytes, so its "12 reserved" would make 36, contradicting
    // its own "32-byte header"; 24 fields + 8 reserved = 32 is correct and
    // matches the backend's own struct format (`snow_backend/snowpack/sidecar.py`
    // and `snow_backend/avalanche/pfl.py` both pack `"<4sHHIIHBBI8x"`, 8x = 8
    // reserved bytes, asserted to size 32).
    return {
        magic: PFL1_MAGIC,
        version: view.getUint16(4, true),
        layerId: view.getUint16(6, true),
        epochHour: view.getUint32(8, true),
        tileCount: view.getUint32(12, true),
        nodeCount: view.getUint16(16, true),
        encoding: view.getUint8(18),
        aggregate: view.getUint8(19),
        manifestHash: view.getUint32(20, true),
    };
}

/**
 * Consumer-side validation for one fetched sidecar file (design doc §1.1).
 * Not in the task's literal export list, but required by the contract text
 * it describes ("Consumer validation (sidecar_format.js): ... Assert
 * body.byteLength === tileCount*2401 ... never a partial render") and by
 * downstream tasks (P2.1 `loadSidecar`), so it lives here rather than being
 * re-implemented per caller.
 *
 * Sniffs bytes 0..3 for the 'PFL1' magic. If present, parses the 32-byte
 * header and takes the body from offset 32; otherwise the whole buffer is
 * the body (the headerless contract). Never throws — a length mismatch is a
 * hard reject (`ok: false`) with a console error, exactly as specified, so
 * the caller can show "conditions unavailable" instead of a partial render.
 *
 * @param {Uint8Array|ArrayBuffer} buffer
 * @param {number} tileCount
 * @param {number} [nodeCount] defaults to the L1 leaf count (2401)
 */
export function parseSidecarBody(buffer, tileCount, nodeCount = L1_NODE_COUNT) {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let header = null;
    let body = bytes;
    if (bytes.byteLength >= 4
        && bytes[0] === 0x50 && bytes[1] === 0x46 && bytes[2] === 0x4c && bytes[3] === 0x31) { // 'PFL1'
        if (bytes.byteLength < PFL1_HEADER_BYTES) {
            console.error(`[sidecar_format] PFL1 magic present but buffer shorter than the ${PFL1_HEADER_BYTES}-byte header (${bytes.byteLength} bytes)`);
            return { ok: false, reason: 'truncated-header', header: null };
        }
        header = parsePfl1Header(bytes);
        body = bytes.subarray(PFL1_HEADER_BYTES);
    }
    const expectedBytes = tileCount * nodeCount;
    if (body.byteLength !== expectedBytes) {
        console.error(`[sidecar_format] body length mismatch: expected ${expectedBytes} bytes (${tileCount} tiles x ${nodeCount}), got ${body.byteLength}`);
        return { ok: false, reason: 'length-mismatch', header, expectedBytes, actualBytes: body.byteLength };
    }
    return { ok: true, header, body };
}

// -----------------------------------------------------------------------
// Timestamp index (index.json)
// -----------------------------------------------------------------------

// Browser/worker-portable base64 <-> bytes. Prefers the standard Web API
// (available on window, Worker global scope, and Node 16+ globally) so this
// module needs no bundler-specific polyfill and no Node `Buffer` dependency.
function base64ToBytes(str) {
    const binary = atob(str || '');
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

function bytesToBase64(bytes) {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
}

function toEpochHour(isoOrMs) {
    const ms = typeof isoOrMs === 'number' ? isoOrMs : Date.parse(isoOrMs);
    return Math.floor(ms / 3600000);
}

// Bitmask convention (this module's own — nothing outside it reads raw
// bitmask bytes): LSB-first within each byte. slot 0 is bit 0 of byte 0.
function bitAt(bytes, slot) {
    const byteIndex = slot >> 3;
    if (byteIndex < 0 || byteIndex >= bytes.byteLength) return false;
    return (bytes[byteIndex] & (1 << (slot & 7))) !== 0;
}

function setBit(bytes, slot) {
    bytes[slot >> 3] |= (1 << (slot & 7));
}

export { bitAt as coverageBitAt, setBit as coverageSetBit, toEpochHour, bytesToBase64, base64ToBytes };

/**
 * Parse and validate a fetched `index.json` against the loaded tile manifest
 * (design doc §1.2's coupling guard). Never throws: a mismatch is the "loud,
 * self-disabling" failure the doc calls for, surfaced as `{ ok: false,
 * reason }` so the caller can disable PowFinder and fall back to plain
 * terrain instead of painting misaligned data.
 *
 * @param {object} json parsed index.json
 * @param {object} manifest parsed tile_manifest.json
 * @returns {{ok: true, ...} | {ok: false, reason: string}}
 */
export function parseSidecarIndex(json, manifest) {
    if (!json || typeof json !== 'object') {
        return { ok: false, reason: 'missing-index' };
    }
    const manifestProfile = manifest?.release?.profile;
    if (json.manifest_profile !== manifestProfile) {
        console.warn(`[sidecar_format] index/manifest profile mismatch: index="${json.manifest_profile}" manifest="${manifestProfile}"`);
        return { ok: false, reason: 'profile-mismatch' };
    }
    const manifestTileCount = Array.isArray(manifest?.tiles) ? manifest.tiles.length : -1;
    if (json.tile_count !== manifestTileCount) {
        console.warn(`[sidecar_format] index/manifest tile-count mismatch: index=${json.tile_count} manifest=${manifestTileCount}`);
        return { ok: false, reason: 'tile-count-mismatch' };
    }

    const coverage = json.coverage || {};
    const count = Number(coverage.count);
    if (!Number.isInteger(count) || count < 0) {
        return { ok: false, reason: 'bad-coverage' };
    }
    let present;
    try {
        present = base64ToBytes(coverage.present);
    } catch {
        return { ok: false, reason: 'bad-bitmask' };
    }
    const expectedBitmaskBytes = Math.ceil(count / 8);
    if (present.byteLength < expectedBitmaskBytes) {
        console.warn(`[sidecar_format] coverage bitmask truncated: expected >= ${expectedBitmaskBytes} bytes for ${count} hours, got ${present.byteLength}`);
        return { ok: false, reason: 'truncated-bitmask' };
    }

    // Per-layer coverage overrides (P2.1 scope-add — not in the original
    // design doc; the real backend emits this for sparse layers, e.g.
    // avalanche running once/day at 12:00 UTC rather than hourly:
    // snow_backend/snowpack/sidecar.py build_index()'s `layers_coverage`).
    // A layer absent here simply has no override and falls back to the base
    // `coverage` above — see coverageFor(). Each entry gets the SAME
    // base64/count/truncation validation as the base mask; a malformed
    // per-layer entry only drops that one layer's override (falls back to
    // base coverage, with a warning) rather than rejecting the whole index
    // — the base coverage is otherwise valid and unaffected.
    const layersCoverage = {};
    if (json.layers_coverage && typeof json.layers_coverage === 'object') {
        for (const [layerId, entry] of Object.entries(json.layers_coverage)) {
            const layerCount = Number(entry?.count);
            if (!Number.isInteger(layerCount) || layerCount < 0) {
                console.warn(`[sidecar_format] layers_coverage.${layerId}: bad count, ignoring override`);
                continue;
            }
            let layerPresent;
            try {
                layerPresent = base64ToBytes(entry.present);
            } catch {
                console.warn(`[sidecar_format] layers_coverage.${layerId}: bad bitmask, ignoring override`);
                continue;
            }
            const layerExpectedBytes = Math.ceil(layerCount / 8);
            if (layerPresent.byteLength < layerExpectedBytes) {
                console.warn(`[sidecar_format] layers_coverage.${layerId}: bitmask truncated (expected >= ${layerExpectedBytes} bytes for ${layerCount} hours, got ${layerPresent.byteLength}), ignoring override`);
                continue;
            }
            layersCoverage[layerId] = { count: layerCount, present: layerPresent, note: entry.note };
        }
    }

    return {
        ok: true,
        schema: json.schema,
        generatedAt: json.generated_at,
        tileOrder: json.tile_order,
        tileCount: json.tile_count,
        nodeCount: json.node_count,
        manifestProfile: json.manifest_profile,
        cacheKey: json.cache_key,
        urlTemplate: json.url_template,
        coverage: {
            startIso: coverage.start,
            startEpochHour: toEpochHour(coverage.start),
            stepHours: Number(coverage.step_hours) || 1,
            count,
            present,
        },
        latest: json.latest,
        layers: Array.isArray(json.layers) ? json.layers : [],
        // Layer ids the engine produces but the layer picker never shows
        // (e.g. slab/hn24/hn72/wet/sdens — engine-internal or not yet a UI
        // layer). Not in the original design doc; discovered in the real
        // backend's index.json shape (snow_backend/snowpack/sidecar.py
        // build_index()). Passed through defensively — absent in older or
        // hand-built index.json fixtures, so it defaults to [].
        engineLayers: Array.isArray(json.engine_layers) ? json.engine_layers : [],
        layersCoverage,
    };
}

/**
 * The effective coverage block for `layerId` — its own layers_coverage
 * override if it has a valid one, otherwise the base coverage. start/step
 * always come from the base coverage; only count/present can be overridden
 * (the real backend's layers_coverage shape has no start/step of its own).
 * Pass no layerId (or one with no override) to get the base coverage back.
 */
export function coverageFor(index, layerId) {
    if (!index?.ok) return null;
    const override = layerId ? index.layersCoverage?.[layerId] : null;
    if (!override) return index.coverage;
    return {
        startIso: index.coverage.startIso,
        startEpochHour: index.coverage.startEpochHour,
        stepHours: index.coverage.stepHours,
        count: override.count,
        present: override.present,
    };
}

/**
 * Does the parsed index have data for `epochHour` (hours since Unix epoch)?
 * False for a slot that does not land exactly on the index's hour grid, is
 * out of the covered range, or is present-but-unset in the bitmask.
 *
 * @param {number} epochHour
 * @param {string} [layerId] when given and the layer has a layers_coverage
 *   override (e.g. a daily-only layer), checks THAT layer's bitmask instead
 *   of the base hourly one — see coverageFor(). Omit for the base coverage.
 */
export function coverageHas(index, epochHour, layerId) {
    const coverage = coverageFor(index, layerId);
    if (!coverage) return false;
    const slot = (epochHour - coverage.startEpochHour) / coverage.stepHours;
    if (!Number.isInteger(slot) || slot < 0 || slot >= coverage.count) return false;
    return bitAt(coverage.present, slot);
}

/**
 * Nearest present epochHour to `epochHour`, expanding outward one slot at a
 * time. On an exact tie (equal distance on both sides) the earlier hour
 * wins. Returns null if the index (or the given layer's coverage) has no
 * present hours at all.
 *
 * @param {number} epochHour
 * @param {string} [layerId] see coverageHas — layer-aware when given.
 */
export function nearestPresentHour(index, epochHour, layerId) {
    const coverage = coverageFor(index, layerId);
    if (!coverage) return null;
    if (coverage.count <= 0) return null;
    const targetSlot = Math.round((epochHour - coverage.startEpochHour) / coverage.stepHours);
    for (let radius = 0; radius <= coverage.count; radius++) {
        const lo = targetSlot - radius;
        if (lo >= 0 && lo < coverage.count && bitAt(coverage.present, lo)) {
            return coverage.startEpochHour + lo * coverage.stepHours;
        }
        const hi = targetSlot + radius;
        if (radius > 0 && hi >= 0 && hi < coverage.count && bitAt(coverage.present, hi)) {
            return coverage.startEpochHour + hi * coverage.stepHours;
        }
    }
    return null;
}

/**
 * Fill `index.json`'s `url_template` for one (layer, epochHour). Does not
 * prepend `<sidecarBase>` or append `?v=<cache_key>` — callers own those
 * (see design doc §1.1's full path shape).
 */
export function epochHourToUrl(template, layerId, epochHour) {
    const d = new Date(epochHour * 3600000);
    const yyyy = String(d.getUTCFullYear()).padStart(4, '0');
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const hh = String(d.getUTCHours()).padStart(2, '0');
    return template
        .replace('{layer}', layerId)
        .replace('{yyyy}', yyyy)
        .replace('{mm}', mm)
        .replace('{dd}', dd)
        .replace('{hh}', hh);
}

// -----------------------------------------------------------------------
// Packed-bits decode/encode (avalanche layer, and any future packed layer)
// -----------------------------------------------------------------------

/**
 * Decode one named field out of a `packed_bits`-encoded raw byte, per the
 * `{shift, bits}` field spec published in `index.json`'s `layers[].fields`.
 * Generic by design — this module hardcodes no field layout; the layout is
 * data, per design doc §1.2's "all numeric semantics live in index.json."
 *
 * @param {number} raw the raw sidecar byte, 0..255
 * @param {{shift: number, bits: number}} fieldSpec
 */
export function decodePacked(raw, fieldSpec) {
    const { shift, bits } = fieldSpec;
    const mask = (1 << bits) - 1;
    return (raw >> shift) & mask;
}

/**
 * Inverse of decodePacked: pack named field values into one byte per the
 * `{shift, bits}` specs in `fields` (an index.json layer's `fields` object,
 * keyed the same way as `fieldValues`). Each value is masked to its declared
 * bit width before combining, so an out-of-range field value cannot bleed
 * into a neighbouring field.
 *
 * @param {Record<string, number>} fieldValues e.g. `{release: 1, severity: 127}`
 * @param {Record<string, {shift: number, bits: number}>} fields
 * @returns {number} raw byte, 0..255
 */
export function encodePacked(fieldValues, fields) {
    let raw = 0;
    for (const name of Object.keys(fields)) {
        const { shift, bits } = fields[name];
        const mask = (1 << bits) - 1;
        raw |= (fieldValues[name] & mask) << shift;
    }
    return raw & 0xff;
}
