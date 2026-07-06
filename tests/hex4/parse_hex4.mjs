#!/usr/bin/env node
// Line-faithful port of frontend/app/tile_worker.js parseBinaryV3().

import fs from 'node:fs';

const SECTOR_WIDTH_METERS = 819.2;
const UNIT_HEX_PX = 32.0;
const METERS_PER_PIXEL = 0.2;
const UNIT_HEX_WIDTH_METERS = UNIT_HEX_PX * METERS_PER_PIXEL;

function worldToAxialScale(x, y, s) {
    const h = UNIT_HEX_WIDTH_METERS * s;
    const A = (Math.sqrt(3) / 2) * h;
    const q = x / A;
    const r = (y - (q * 0.5 * h)) / h;
    return { q, r };
}

function parseBinaryV3(buffer) {
    const view = new DataView(buffer);
    const sig = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
    if (sig !== 'HEX4') throw new Error("Invalid Sig");

    const sx = view.getInt32(4, true);
    const sy = view.getInt32(8, true);
    const minZ = view.getFloat32(12, true);
    const maxZ = view.getFloat32(16, true);
    const scale = view.getFloat32(20, true);
    const cq = view.getInt32(24, true);
    const cr = view.getInt32(28, true);

    let offset = 32;
    const layers = [];
    const layerCounts = [];
    const scales = [24.0, 6.0, 3.0, 1.0];

    const minX = sx * SECTOR_WIDTH_METERS;
    const minY = sy * SECTOR_WIDTH_METERS;
    const cenX = minX + SECTOR_WIDTH_METERS * 0.5;
    const cenY = minY + SECTOR_WIDTH_METERS * 0.5;

    for (let l = 0; l < 4; l++) {
        const count = view.getUint32(offset, true);
        layerCounts.push(count);
        offset += 4;
        const layer = [];
        const sc = scales[l];
        const rawC = worldToAxialScale(cenX, cenY, sc);
        const lcq = Math.round(rawC.q);
        const lcr = Math.round(rawC.r);

        for (let i = 0; i < count; i++) {
            const dq = view.getInt8(offset);
            const dr = view.getInt8(offset + 1);
            const hn = view.getUint16(offset + 2, true);
            const d1 = view.getInt16(offset + 4, true);
            const d2 = view.getInt16(offset + 6, true);
            const d3 = view.getInt16(offset + 8, true);
            const s1 = view.getUint8(offset + 10);
            const s2 = view.getUint8(offset + 11);
            const s3 = view.getUint8(offset + 12);
            const nx = view.getUint8(offset + 13);
            const nz = view.getUint8(offset + 14);
            offset += 16;

            layer.push({
                dq, dr,
                q: lcq + dq, r: lcr + dr,
                hScaled: hn,
                h: minZ + (hn / scale),
                deltas: [d1, d2, d3],
                slopes: [s1, s2, s3],
                norm: [nx, nz]
            });
        }
        layers.push(layer);
    }

    return {
        sx, sy,
        header: { signature: sig, minZ, maxZ, scale, cq, cr },
        stats: { min: minZ, max: maxZ, avg: (minZ + maxZ) / 2, base: minZ },
        center: { q: 0, r: 0 },
        layerScales: scales,
        layerCounts,
        layers,
        consumedBytes: offset,
        byteLength: buffer.byteLength
    };
}

function canonicalJson(value) {
    if (value === null || typeof value !== 'object') {
        return JSON.stringify(value);
    }
    if (Array.isArray(value)) {
        return '[' + value.map(canonicalJson).join(',') + ']';
    }
    const keys = Object.keys(value).sort();
    return '{' + keys.map((key) => JSON.stringify(key) + ':' + canonicalJson(value[key])).join(',') + '}';
}

function main() {
    const path = process.argv[2];
    if (!path) {
        console.error('usage: parse_hex4.mjs PATH');
        return 2;
    }
    try {
        const buf = fs.readFileSync(path);
        const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
        console.log(canonicalJson(parseBinaryV3(arrayBuffer)));
        return 0;
    } catch (err) {
        console.error(`parse_hex4.mjs: ${err.message}`);
        return 1;
    }
}

process.exitCode = main();
