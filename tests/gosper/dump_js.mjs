// Dumps canonical Gosper math output for parity-diffing against the Python
// implementation (tests/gosper/dump_py.py). Runs property assertions first;
// any failure exits non-zero. Usage: node tests/gosper/dump_js.mjs > js.json
import '../../frontend/app/gosper_core.js';

const G = globalThis.GosperCore;
const assert = (cond, msg) => { if (!cond) { console.error(`ASSERT FAIL: ${msg}`); process.exit(1); } };

// --- Property 1: counts + uniqueness at every level ---
for (let L = 0; L <= 5; L++) {
    const off = G.offsets(L);
    assert(off.length === 2 * Math.pow(7, L), `offsets(${L}) count`);
    const seen = new Set();
    for (let i = 0; i < off.length; i += 2) seen.add(`${off[i]},${off[i + 1]}`);
    assert(seen.size === Math.pow(7, L), `offsets(${L}) unique`);
}

// --- Property 2: adjacent L5 tiles are disjoint (rep-tile tiling) ---
{
    const off = G.offsets(5);
    const seen = new Set();
    for (let j = 0; j < 7; j++) {
        const [sq, sr] = G.mulMPow(G.NEIGHBORS[j][0], G.NEIGHBORS[j][1], 5);
        for (let i = 0; i < off.length; i += 2) seen.add(`${off[i] + sq},${off[i + 1] + sr}`);
    }
    assert(seen.size === 7 * 16807, 'L5 island + 6 neighbors tile disjointly');
}

// --- Property 3: parentOf round-trips for every child slot ---
for (let yq = -40; yq <= 40; yq += 7) {
    for (let yr = -40; yr <= 40; yr += 7) {
        const [pq, pr] = G.mulM(yq, yr);
        for (let j = 0; j < 7; j++) {
            const c = { q: pq + G.NEIGHBORS[j][0], r: pr + G.NEIGHBORS[j][1] };
            const p = G.parentOf(c.q, c.r);
            assert(p.q === pq && p.r === pr && p.child === j,
                `parentOf(${c.q},${c.r}) -> (${p.q},${p.r},${p.child}) expected (${pq},${pr},${j})`);
        }
    }
}

// --- Property 4: tileOfUnit finds the owning tile for member cells ---
{
    const off = G.offsets(5);
    for (const [yq, yr] of [[0, 0], [1, 0], [-2, 3], [5, -4]]) {
        const [cq, cr] = G.latticeToCenter(yq, yr);
        for (const i of [0, 1, 7, 2400, 16806, 8403]) {
            const [tq, tr] = G.tileOfUnit(cq + off[i * 2], cr + off[i * 2 + 1]);
            assert(tq === yq && tr === yr, `tileOfUnit lattice(${yq},${yr}) member ${i}`);
        }
    }
}

// --- Property 5: L5 offsets fit Int8 (needed for picking arrays) ---
let maxAbs = 0;
{
    const off = G.offsets(5);
    for (const v of off) maxAbs = Math.max(maxAbs, Math.abs(v));
    assert(maxAbs < 127, `L5 offsets fit int8 (max ${maxAbs})`);
}

// --- Property 6: M is conformal under the axial->world mapping ---
{
    const h = G.UNIT_HEX_WIDTH_METERS;
    for (const [q, r] of [[1, 0], [0, 1], [3, -2]]) {
        const [wx0, wy0] = G.axialToWorld(q, r);
        const [mq, mr] = G.mulM(q, r);
        const [wx1, wy1] = G.axialToWorld(mq, mr);
        const ratio = Math.hypot(wx1, wy1) / Math.hypot(wx0, wy0);
        assert(Math.abs(ratio - Math.sqrt(7)) < 1e-9, `|M v|/|v| = sqrt(7) for (${q},${r})`);
        const dAng = Math.atan2(wy1, wx1) - Math.atan2(wy0, wx0);
        const norm = Math.atan2(Math.sin(dAng), Math.cos(dAng));
        assert(Math.abs(norm - G.ROT_PER_LEVEL) < 1e-9, `rotation +19.1066deg for (${q},${r})`);
    }
}

// --- Property 7: heap indexing — depth-d node center == offsets5[i * 7^(5-d)] ---
{
    const off5 = G.offsets(5);
    let depth = [[0, 0]];
    for (let d = 0; d < 5; d++) {
        const next = [];
        for (let i = 0; i < depth.length; i++) {
            for (let j = 0; j < 7; j++) {
                const [sq, sr] = G.mulMPow(G.NEIGHBORS[j][0], G.NEIGHBORS[j][1], 4 - d);
                next.push([depth[i][0] + sq, depth[i][1] + sr]);
            }
        }
        depth = next;
        const stride = Math.pow(7, 5 - (d + 1));
        for (let i = 0; i < depth.length; i += Math.max(1, Math.floor(depth.length / 97))) {
            const u = i * stride;
            assert(off5[u * 2] === depth[i][0] && off5[u * 2 + 1] === depth[i][1],
                `heap center depth ${d + 1} node ${i}`);
        }
    }
}

// --- Canonical dump for the cross-language diff ---
const off5 = G.offsets(5);
const world = [];
{ // world bbox of unit-cell centers, for the baker's texture-extent constant
    let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    for (let i = 0; i < off5.length; i += 2) {
        const [x, y] = G.axialToWorld(off5[i], off5[i + 1]);
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
    world.push(+minX.toFixed(6), +maxX.toFixed(6), +minY.toFixed(6), +maxY.toFixed(6));
}
const out = {
    matrix: G.mulM(1, 0).concat(G.mulM(0, 1)),
    rotPerLevelDeg: +(G.ROT_PER_LEVEL * 180 / Math.PI).toFixed(9),
    levelSizes: [0, 1, 2, 3, 4, 5].map(k => +G.levelSize(k).toFixed(9)),
    maxAbsOffset: maxAbs,
    worldBBox: world,
    latticeCenters: [[0, 0], [1, 0], [0, 1], [-3, 2]].map(([a, b]) => G.latticeToCenter(a, b)),
    offsets5: Array.from(off5),
};
console.log(JSON.stringify(out));
console.error('JS: all gosper property checks passed.');
