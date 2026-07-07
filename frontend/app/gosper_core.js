// @atlas: Canonical Gosper-fractal hex math, shared verbatim by the main thread (ES module side-effect import), the tile worker (importScripts), and mirrored 1:1 in hex_backend/coordinate_utility.py. Defines the conformal scaling matrix M(q,r)=(2q−r, q+3r) (area ×7, rotation +19.1066°/level for the app's flat-top axial→world mapping), heap-ordered island offset enumeration, flower parent/child lookup, L5 tile lattice conversions, and precomputed scene-space (XZ) linear maps for rendering level-k caps.
//
// Loaded two ways from one file (do not convert to an ES module):
//   worker:  importScripts('gosper_core.js')  -> self.GosperCore
//   main.js: import './gosper_core.js'        -> window.GosperCore
//
// COORDINATE CONVENTIONS (must match hex_backend/coordinate_utility.py):
//   axial->world:  x = q * (sqrt(3)/2) * h,  y = r * h + q * h/2   (h = 6.4 m, flat-top, +y north)
//   THREE scene:   x_scene = world_x, z_scene = -world_y
//
// THE MATRIX: multiplying an axial coordinate by M(q,r) = (2q - r, q + 3r) is
// multiplication by the Eisenstein integer (2 + w), |2 + w|^2 = 7. Under the
// axial->world mapping above this is an exact similarity: scale sqrt(7),
// rotation +19.10660535 deg CCW (north-up world). NB the older diagnostic
// scripts used (2q + r, -q + 3r), which is only a similarity under a MIRRORED
// axial convention — under ours it shears (basis images sqrt(3)h and
// sqrt(13)h). Everything downstream (bins, manifests, rendering) uses M below.
(function (root) {
    'use strict';

    const UNIT_HEX_WIDTH_METERS = 6.4;    // flat-to-flat, the "Tirol Truth" 32px * 0.2 m/px
    const TILE_LEVEL = 5;                 // streaming tile = level-5 island (7^5 = 16807 unit hexes)
    const SQRT7 = Math.sqrt(7);
    const ROT_PER_LEVEL = Math.atan2(Math.sqrt(3) / 2, 5 / 2); // +19.10660535° in world x/y

    // Child order is canonical everywhere: Center, then N, NE, SE, S, SW, NW
    // (matches coordinate_utility.py direction constants, +r = north).
    const NEIGHBORS = [
        [0, 0],   // 0: C
        [0, 1],   // 1: N
        [1, 0],   // 2: NE
        [1, -1],  // 3: SE
        [0, -1],  // 4: S
        [-1, 0],  // 5: SW
        [-1, 1],  // 6: NW
    ];

    function mulM(q, r) { return [2 * q - r, q + 3 * r]; }

    // Exact inverse: M^-1 = 1/7 * [[3, 1], [-1, 2]]. Throws off-lattice.
    function mulMInvExact(q, r) {
        const nq = 3 * q + r;
        const nr = -q + 2 * r;
        if (nq % 7 !== 0 || nr % 7 !== 0) {
            throw new Error(`(${q},${r}) is not on the M lattice`);
        }
        return [nq / 7, nr / 7];
    }

    function mulMPow(q, r, k) {
        for (let i = 0; i < k; i++) { const t = mulM(q, r); q = t[0]; r = t[1]; }
        return [q, r];
    }

    // ------------------------------------------------------------------
    // Heap-ordered island offsets.
    // offsets(L)[i] = axial offset of the i-th unit hex of a level-L island
    // from the island center. Index digits are big-endian base-7: the most
    // significant digit picks the level-(L-1) sub-island (shift M^(L-1)*n_j),
    // so the aggregate node (depth d, index i) has children (d+1, 7i..7i+6)
    // and child j=0 is concentric with its parent.
    // ------------------------------------------------------------------
    const _offsetsCache = new Map();
    function offsets(level) {
        if (_offsetsCache.has(level)) return _offsetsCache.get(level);
        let cur = new Int32Array([0, 0]); // level 0: the hex itself
        for (let l = 1; l <= level; l++) {
            const prev = cur;
            const prevCount = prev.length / 2;
            cur = new Int32Array(prevCount * 7 * 2);
            for (let j = 0; j < 7; j++) {
                const [sq, sr] = mulMPow(NEIGHBORS[j][0], NEIGHBORS[j][1], l - 1);
                const base = j * prevCount * 2;
                for (let i = 0; i < prevCount; i++) {
                    cur[base + i * 2] = prev[i * 2] + sq;
                    cur[base + i * 2 + 1] = prev[i * 2 + 1] + sr;
                }
            }
            _offsetsCache.set(l, cur);
        }
        _offsetsCache.set(level, cur);
        return cur;
    }

    // ------------------------------------------------------------------
    // Flower parent: the 7-hex flower tiling has centers on the M lattice;
    // parentOf(x) returns the flower center whose 7-cell covers unit cell x.
    // Self-similar: also groups L5 tile lattice coords into L6 parents, etc.
    // ------------------------------------------------------------------
    function parentOf(q, r) {
        // float inverse, then search the rounded candidate + its 6 neighbors
        const fq = (3 * q + r) / 7;
        const fr = (-q + 2 * r) / 7;
        const [cq, cr] = _axialRound(fq, fr);
        for (let j = 0; j < 7; j++) {
            const yq = cq + NEIGHBORS[j][0];
            const yr = cr + NEIGHBORS[j][1];
            const [pq, pr] = mulM(yq, yr);
            const dq = q - pq, dr = r - pr;
            for (let n = 0; n < 7; n++) {
                if (NEIGHBORS[n][0] === dq && NEIGHBORS[n][1] === dr) {
                    return { q: pq, r: pr, child: n, latQ: yq, latR: yr };
                }
            }
        }
        throw new Error(`parentOf(${q},${r}): no flower found (impossible)`);
    }

    function _axialRound(q, r) {
        const x = q, z = r, y = -q - r;
        let rx = Math.round(x), ry = Math.round(y), rz = Math.round(z);
        const dx = Math.abs(rx - x), dy = Math.abs(ry - y), dz = Math.abs(rz - z);
        if (dx > dy && dx > dz) rx = -ry - rz;
        else if (dy > dz) ry = -rx - rz;
        else rz = -rx - ry;
        return [rx, rz];
    }

    // L5 tile lattice: island centers are M^5 * (yq, yr).
    function latticeToCenter(yq, yr) { return mulMPow(yq, yr, TILE_LEVEL); }
    function centerToLattice(q, r) {
        for (let i = 0; i < TILE_LEVEL; i++) { const t = mulMInvExact(q, r); q = t[0]; r = t[1]; }
        return [q, r];
    }

    // Which L5 tile owns unit cell (q, r)? Each parentOf step descends into
    // lattice coordinates (the flower's address), where the next-level
    // grouping is the same flower pattern again — self-similar.
    function tileOfUnit(q, r) {
        for (let i = 0; i < TILE_LEVEL; i++) { const p = parentOf(q, r); q = p.latQ; r = p.latR; }
        return [q, r];
    }

    function axialToWorld(q, r) {
        const h = UNIT_HEX_WIDTH_METERS;
        return [q * (Math.sqrt(3) / 2) * h, r * h + q * 0.5 * h];
    }

    // Effective flat-to-flat width of a level-k cap.
    function levelSize(k) { return UNIT_HEX_WIDTH_METERS * Math.pow(SQRT7, k); }

    // Scene-space (XZ, z = -world_y) linear map for a level-k cap:
    // [x'] = [a b][x]     scale sqrt(7)^k, rotation k * ROT_PER_LEVEL
    // [z']   [c d][z]     (CCW in world == this exact matrix in scene coords)
    function levelXZ(k) {
        const s = Math.pow(SQRT7, k);
        const th = k * ROT_PER_LEVEL;
        const cos = Math.cos(th) * s, sin = Math.sin(th) * s;
        // world (x,y): [x'] = [cos -sin][x] ; scene z = -y flips both off-diagonals
        // scene:       x' = cos*x + sin*z ; z' = -sin*x + cos*z
        return { a: cos, b: sin, c: -sin, d: cos };
    }

    // Per-depth record counts for a TILE_LEVEL tile: depth d holds level (5-d).
    const DEPTH_COUNTS = [1, 7, 49, 343, 2401, 16807];

    root.GosperCore = {
        UNIT_HEX_WIDTH_METERS, TILE_LEVEL, SQRT7, ROT_PER_LEVEL, NEIGHBORS, DEPTH_COUNTS,
        mulM, mulMInvExact, mulMPow, offsets, parentOf,
        latticeToCenter, centerToLattice, tileOfUnit, axialToWorld, levelSize, levelXZ,
    };
})(typeof self !== 'undefined' ? self : globalThis);
