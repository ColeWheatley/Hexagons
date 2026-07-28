#!/usr/bin/env node
// Dev-only synthetic sidecar season for PowFinder frontend work. NOT part of
// the bake pipeline — see design doc §6 P0.1. Writes:
//   <outDir>/index.json                              timestamp index (§1.2)
//   <outDir>/latest.json                              tiny live-poll sibling
//   <outDir>/<layer>/<yyyy>/<mm>/<dd>/<hh>.pfl         headered (32-byte PFL1)
//   <outDir>/headerless/<layer>/<epochHour>.pfl        a few headerless samples
//     (the backend commits to always shipping the header; the headerless
//     samples exist purely so parseSidecarBody's sniff-fallback path has
//     something real to parse in tests)
//
// `<outDir>` defaults to frontend/app/powfinder_fixtures/, which is
// gitignored (see .gitignore's "Generated Assets" block, which already
// covers frontend/app/aerial_pages/ and tiles_bin/ the same way) — a "few
// hundred hour" season at 4 layers x 197 tiles is hundreds of MB, and like
// every other generated-and-regenerable asset in this repo it does not
// belong in git. Every downstream PowFinder task regenerates it locally by
// running this script; it is deterministic given the same --seed.
//
// Usage: node scripts/make_sidecar_fixtures.mjs [--hours=240] [--seed=1337]
//                                                [--out-dir=path] [--tile-count=N]
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
    L1_NODE_COUNT,
    PFL1_HEADER_BYTES,
    SIDECAR_NODATA,
    coverageSetBit,
    bytesToBase64,
    epochHourToUrl,
} from '../frontend/app/sidecar_format.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const DEFAULT_MANIFEST_PATH = join(REPO_ROOT, 'frontend/app/tile_manifest.json');
const DEFAULT_OUT_DIR = join(REPO_ROOT, 'frontend/app/powfinder_fixtures');

// Layer definitions. Mirrors the real backend's index.json shape as closely
// as possible now that it exists (`snow_backend/snowpack/sidecar.py`
// LAYERS / AVALANCHE_LAYER_INDEX_ENTRY / SURFACE_CLASSES), not just the
// design doc's original draft, so these fixtures exercise the actual
// contract downstream tasks will see. Two confirmed corrections since the
// doc was written:
//  - avalanche's packed_bits layout is {release: shift 7, bits 1} +
//    {severity: shift 0, bits 7}, not the release/runout split originally
//    drafted.
//  - packed_bits fields reduce independently, each with its own aggregate
//    (release: "or", severity: "max") — see buildPackedPyramid. There is no
//    layer-level `aggregate` for avalanche any more; only per-field.
export const LAYERS = [
    { id: 'sqh', label: 'Snow quality', encoding: 'u8_linear', domain: [0, 100], units: 'SQH', aggregate: 'mean', ramp: 'powder', nodata: 0, short: 'SQH' },
    { id: 'depth', label: 'Snow depth', encoding: 'u8_linear', domain: [0, 500], units: 'cm', aggregate: 'mean', ramp: 'depth', nodata: 0, short: 'HS' },
    {
        id: 'avalanche', label: 'Avalanche', encoding: 'packed_bits',
        fields: {
            release: { shift: 7, bits: 1, aggregate: 'or', domain: [0, 1] },
            severity: { shift: 0, bits: 7, aggregate: 'max', domain: [1, 127] },
        },
        ramp: 'hazard', nodata: 0, short: 'AVY',
    },
    {
        id: 'surface', label: 'Surface state', encoding: 'u8_class',
        // Real backend list (snow_backend/snowpack/sidecar.py SURFACE_CLASSES) —
        // 8 entries, index 0 reserved ("—", collides with NODATA=0 by design).
        classes: ['—', 'powder', 'settled', 'wind slab', 'crust', 'wet', 'refrozen', 'bare'],
        aggregate: 'mode', ramp: 'surface', nodata: 0, short: 'SFC',
    },
];

// Numeric ids for the PFL1 header's u16 layerId / u8 encoding / u8 aggregate
// fields. sqh/depth/surface mirror the real backend table in
// snow_backend/snowpack/sidecar.py (LAYERS/ENCODING/AGGREGATE dicts), the
// only concrete source for those three. avalanche uses the values
// team-lead pinned directly to this task, matching
// snow_backend/avalanche/config.py (PFL_LAYER_ID_AVALANCHE=3,
// PFL_ENCODING_PACKED_BITS=2, PFL_AGGREGATE_MAX=1).
//
// KNOWN CONFLICT, flagged upstream, unresolved as of this commit: those two
// backend tables disagree with each other on every axis — snowpack's table
// has avalanche=4/packed_bits=3/max=2, not 3/2/1 — including a direct id
// collision (avalanche=3 here vs surface=3 in snowpack's own table) and an
// encoding collision (packed_bits=2 here vs u8_class=2 in snowpack's
// table). This is header-only bookkeeping: nothing in sidecar_format.mjs's
// consumer parser validates these numbers against anything, and pyramid
// decode is driven entirely by index.json's string-keyed encoding/
// aggregate/fields, so the collision cannot mis-decode a sidecar — but the
// two backend modules will write mutually inconsistent header bytes for
// the same concepts until reconciled.
const LAYER_ID_CODES = { sqh: 1, depth: 2, surface: 3, avalanche: 3 };
const ENCODING_CODES = { u8_linear: 1, u8_class: 2, packed_bits: 2 };
// avalanche's per-field aggregates (release:"or", severity:"max") don't
// collapse to one header byte; team-lead pinned "max"=1 for it specifically
// (a vestigial/informational value only — see buildPfl1Header below).
const AGGREGATE_CODES = { mean: 1, mode: 3, max: 1 };

// Standard CRC-32 (IEEE 802.3 / zlib / PNG polynomial 0xEDB88320), verified
// to match Python's zlib.crc32 on the real tile_manifest.json bytes.
const CRC32_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
        table[n] = c >>> 0;
    }
    return table;
})();

function crc32(bytes) {
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) {
        crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function mulberry32(seed) {
    let a = seed >>> 0;
    return function rand() {
        a |= 0; a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

// Low-frequency function of a depth-4 heap index used as a "spatial jitter."
// Hierarchical heap indices are locality-preserving (children of one parent
// are index-adjacent), so a couple of low-frequency sine terms over the
// index approximate a smooth spatial blob without needing real per-node
// coordinates in a dev-only fixture generator — not geometrically exact, but
// smooth, deterministic, and clearly documented as an approximation.
function spatialJitter(nodeIndex, tileSeed) {
    return 0.06 * Math.sin(nodeIndex * 0.017 + tileSeed)
         + 0.04 * Math.sin(nodeIndex * 0.051 + tileSeed * 1.7);
}

// Smooth, deterministic "how much weather is happening" signal over the
// season, in [0,1]. Two superimposed periods (a multi-day front cadence and
// a faster ripple) so the map has visible but gentle temporal structure.
function stormSignal(hour, seed) {
    const a = 0.5 + 0.5 * Math.sin((2 * Math.PI * hour) / 71 + seed);
    const b = 0.5 + 0.5 * Math.sin((2 * Math.PI * hour) / 17 + seed * 2.3);
    return clamp01(0.6 * a + 0.4 * b);
}

function toByte(v01) {
    // Real domain is 1..255; 0 is the reserved NODATA sentinel (confirmed).
    return Math.min(255, Math.max(1, Math.round(v01 * 254) + 1));
}

/**
 * Synthesize one tile's L1_NODE_COUNT (2401) raw bytes for one layer at one
 * hour. `elevNorm`/`slopeNorm` are this tile's hMean/sMean normalized to
 * [0,1] across the manifest so higher-elevation, steeper tiles read
 * differently — "spatially smooth... so it looks like real terrain-driven
 * data" per the P0.1 brief, not a physically accurate model.
 */
function synthesizeTileLayer(layerId, elevNorm, slopeNorm, hour, tileSeed, seed) {
    const out = new Uint8Array(L1_NODE_COUNT);
    const storm = stormSignal(hour, seed);
    for (let i = 0; i < L1_NODE_COUNT; i++) {
        const jitter = spatialJitter(i, tileSeed);
        if (layerId === 'sqh') {
            const q = 0.35 + 0.45 * elevNorm - 0.15 * slopeNorm + 0.35 * storm + jitter;
            out[i] = toByte(clamp01(q));
        } else if (layerId === 'depth') {
            const d = 0.15 + 0.55 * elevNorm - 0.10 * slopeNorm + 0.30 * storm + jitter;
            out[i] = toByte(clamp01(d));
        } else if (layerId === 'avalanche') {
            const s = 0.30 * slopeNorm + 0.50 * storm + 0.20 * elevNorm + jitter;
            const severity = Math.min(127, Math.max(1, Math.round(clamp01(s) * 126) + 1));
            const release = severity > 95 ? 1 : 0;
            out[i] = ((release << 7) | (severity & 0x7f)) & 0xff;
        } else if (layerId === 'surface') {
            // 7 real classes (index 0 of the 8-entry classes list is "—",
            // reserved/NODATA-coincident).
            const score = clamp01(0.40 * elevNorm + 0.30 * slopeNorm + 0.30 * storm + jitter);
            out[i] = Math.min(7, Math.max(1, Math.floor(score * 7) + 1));
        } else {
            throw new Error(`synthesizeTileLayer: unknown layer "${layerId}"`);
        }
    }
    return out;
}

function buildPfl1Header({ layerId, epochHour, tileCount, encoding, aggregate, manifestHash }) {
    const header = new Uint8Array(PFL1_HEADER_BYTES);
    const view = new DataView(header.buffer);
    header[0] = 0x50; header[1] = 0x46; header[2] = 0x4c; header[3] = 0x31; // 'PFL1'
    view.setUint16(4, 1, true); // version
    view.setUint16(6, LAYER_ID_CODES[layerId] ?? 0xffff, true);
    view.setUint32(8, epochHour >>> 0, true);
    view.setUint32(12, tileCount, true);
    view.setUint16(16, L1_NODE_COUNT, true);
    view.setUint8(18, ENCODING_CODES[encoding] ?? 0xff);
    // Packed-bits layers have no single layer-level aggregate any more (each
    // field reduces independently — see buildPackedPyramid); `aggregate` is
    // undefined for them here, so fall back to the pinned "max"=1 team-lead
    // specified for avalanche's header byte. Vestigial/informational only —
    // nothing decodes a packed layer using this byte.
    view.setUint8(19, AGGREGATE_CODES[aggregate ?? 'max'] ?? 0xff);
    view.setUint32(20, manifestHash, true);
    return header;
}

/**
 * Core generator, factored out of the CLI so tests can call it directly with
 * a small `hours` count instead of paying for a full season on every
 * `npm test` run.
 *
 * @returns a manifest of everything written: { outDir, tileCount, coverage,
 *   indexPath, latestPath, files: [{ path, bytes, layerId, epochHour,
 *   headered }] }
 */
export async function generateFixtures({
    outDir = DEFAULT_OUT_DIR,
    manifest,
    manifestBytes = null,
    hours = 240,
    seed = 1337,
    headerlessSampleHours = 2,
} = {}) {
    if (!manifest || !Array.isArray(manifest.tiles) || manifest.tiles.length === 0) {
        throw new Error('generateFixtures: a parsed tile_manifest.json (with .tiles[]) is required');
    }
    const tiles = manifest.tiles;
    const tileCount = tiles.length;
    const manifestProfile = manifest.release?.profile;
    // manifestHash = CRC32 of the raw tile_manifest.json file bytes (pinned by
    // team-lead, matching snow_backend/avalanche/pfl.py's manifest_hash()).
    // NOTE: snow_backend/snowpack/sidecar.py's docstring describes a
    // *different* algorithm — CRC32 of the manifest tiles[] (yq,yr) int32
    // sequence — for the same field. Flagged upstream; this generator follows
    // the literal instruction given to this task (whole-file CRC32). Falls
    // back to hashing the parsed-and-reserialized JSON when raw bytes aren't
    // supplied (test/dev convenience only — not byte-identical to the real
    // file, so not a substitute for passing manifestBytes when it matters).
    const manifestHash = crc32(manifestBytes ?? new TextEncoder().encode(JSON.stringify(manifest)));

    const hMeans = tiles.map((t) => t.hMean);
    const sMeans = tiles.map((t) => t.sMean);
    const hMin = Math.min(...hMeans), hMax = Math.max(...hMeans);
    const sMin = Math.min(...sMeans), sMax = Math.max(...sMeans);
    const elevNormOf = (t) => (hMax > hMin ? (t.hMean - hMin) / (hMax - hMin) : 0.5);
    const slopeNormOf = (t) => (sMax > sMin ? (t.sMean - sMin) / (sMax - sMin) : 0.5);

    // Deliberate NODATA region (§6 P0.1 brief): one tile, roughly central in
    // manifest order, has a contiguous block of its depth-4 nodes forced to
    // NODATA in every layer and every hour — an "off-DEM" style hole that
    // never fills in, distinct from the temporal coverage holes below.
    const nodataTileIndex = Math.floor(tileCount / 2);
    const nodataNodeStart = 0;
    const nodataNodeEnd = 200; // ~8% of a tile's 2401 nodes

    // Coverage: `hours` hourly slots starting at a fixed date, with two
    // deliberate holes (one longer, one short) so the availability rail and
    // nearestPresentHour both have something real to chew on.
    const startIso = '2025-11-01T00:00:00Z';
    const present = new Uint8Array(Math.ceil(hours / 8));
    const holeAStart = Math.floor(hours * 0.35);
    const holeALen = Math.max(6, Math.floor(hours * 0.08));
    const holeBStart = Math.floor(hours * 0.7);
    const holeBLen = 2;
    for (let slot = 0; slot < hours; slot++) {
        const inHoleA = slot >= holeAStart && slot < holeAStart + holeALen;
        const inHoleB = slot >= holeBStart && slot < holeBStart + holeBLen;
        if (!inHoleA && !inHoleB) coverageSetBit(present, slot);
    }
    const startEpochHour = Math.floor(Date.parse(startIso) / 3600000);
    const presentSlots = [];
    for (let slot = 0; slot < hours; slot++) {
        if (present[slot >> 3] & (1 << (slot & 7))) presentSlots.push(slot);
    }

    await mkdir(outDir, { recursive: true });
    const urlTemplate = 'powfinder/{layer}/{yyyy}/{mm}/{dd}/{hh}.pfl';
    const files = [];
    let headerlessWritten = 0;

    for (const slot of presentSlots) {
        const epochHour = startEpochHour + slot;
        for (const layer of LAYERS) {
            const body = new Uint8Array(tileCount * L1_NODE_COUNT);
            for (let t = 0; t < tileCount; t++) {
                const tile = tiles[t];
                const tileSeed = (t * 2654435761) % 1000 / 1000 + seed * 0.0001;
                const tileBytes = synthesizeTileLayer(
                    layer.id, elevNormOf(tile), slopeNormOf(tile), slot, tileSeed, seed,
                );
                if (t === nodataTileIndex) {
                    tileBytes.fill(SIDECAR_NODATA, nodataNodeStart, nodataNodeEnd);
                }
                body.set(tileBytes, t * L1_NODE_COUNT);
            }

            const header = buildPfl1Header({
                layerId: layer.id, epochHour, tileCount,
                encoding: layer.encoding, aggregate: layer.aggregate, manifestHash,
            });
            const headered = new Uint8Array(PFL1_HEADER_BYTES + body.byteLength);
            headered.set(header, 0);
            headered.set(body, PFL1_HEADER_BYTES);

            const relUrl = epochHourToUrl(urlTemplate, layer.id, epochHour);
            const path = join(outDir, relUrl);
            await mkdir(dirname(path), { recursive: true });
            await writeFile(path, headered);
            files.push({ path, bytes: headered.byteLength, layerId: layer.id, epochHour, headered: true });

            if (headerlessWritten < headerlessSampleHours * LAYERS.length) {
                const headerlessPath = join(outDir, 'headerless', layer.id, `${epochHour}.pfl`);
                await mkdir(dirname(headerlessPath), { recursive: true });
                await writeFile(headerlessPath, body);
                files.push({ path: headerlessPath, bytes: body.byteLength, layerId: layer.id, epochHour, headered: false });
                headerlessWritten++;
            }
        }
    }

    const index = {
        schema: 1,
        generated_at: new Date().toISOString(),
        tile_order: 'manifest',
        tile_count: tileCount,
        node_count: L1_NODE_COUNT,
        manifest_profile: manifestProfile,
        cache_key: 'pf-fixture-1.0.0',
        url_template: urlTemplate,
        coverage: { start: startIso, step_hours: 1, count: hours, present: bytesToBase64(present) },
        latest: new Date((startEpochHour + presentSlots[presentSlots.length - 1]) * 3600000).toISOString(),
        layers: LAYERS,
        // Real backend index.json also carries engine-only layer ids (slab,
        // hn24, hn72, wet, sdens — see snow_backend/snowpack/sidecar.py); this
        // generator doesn't synthesize those, so honestly reports none rather
        // than advertising fixture files that don't exist.
        engine_layers: [],
    };
    const indexPath = join(outDir, 'index.json');
    await writeFile(indexPath, JSON.stringify(index, null, 2));

    const latestPath = join(outDir, 'latest.json');
    await writeFile(latestPath, JSON.stringify({ latest: index.latest, generated_at: index.generated_at }, null, 2));

    return {
        outDir, tileCount, indexPath, latestPath, files,
        coverage: { startEpochHour, hours, presentSlots },
        nodataRegion: { tileIndex: nodataTileIndex, nodeStart: nodataNodeStart, nodeEnd: nodataNodeEnd },
    };
}

async function main() {
    const args = {};
    for (const arg of process.argv.slice(2)) {
        const m = /^--([a-zA-Z-]+)=(.*)$/.exec(arg);
        if (m) args[m[1].replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = m[2];
    }
    const manifestPath = args.manifestPath || DEFAULT_MANIFEST_PATH;
    const { readFile } = await import('node:fs/promises');
    const manifestBytes = new Uint8Array(await readFile(manifestPath));
    const manifest = JSON.parse(new TextDecoder().decode(manifestBytes));
    const result = await generateFixtures({
        outDir: args.outDir || DEFAULT_OUT_DIR,
        manifest,
        manifestBytes,
        hours: args.hours ? Number(args.hours) : 240,
        seed: args.seed ? Number(args.seed) : 1337,
        headerlessSampleHours: args.headerlessSampleHours ? Number(args.headerlessSampleHours) : 2,
    });
    const totalBytes = result.files.reduce((sum, f) => sum + f.bytes, 0);
    console.log(`[make_sidecar_fixtures] wrote ${result.files.length} sidecar files (${(totalBytes / 1e6).toFixed(1)} MB) + index.json + latest.json to ${result.outDir}`);
    console.log(`[make_sidecar_fixtures] tiles=${result.tileCount} coverage=${result.coverage.hours}h present=${result.coverage.presentSlots.length}h nodataTile=${result.nodataRegion.tileIndex}`);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
    main().catch((err) => {
        console.error('[make_sidecar_fixtures] failed:', err);
        process.exitCode = 1;
    });
}
