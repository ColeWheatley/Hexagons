#!/usr/bin/env python3
"""Dumps canonical Gosper math output for parity-diffing against the JS
implementation (tests/gosper/dump_js.mjs). Property assertions run first.
Usage: python3 tests/gosper/dump_py.py > py.json"""
import json
import math
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "hex_backend"))
import coordinate_utility as cu

# --- Property 1: counts + uniqueness ---
for L in range(6):
    off = cu.generate_gosper_offsets(L)
    assert len(off) == 7 ** L, f"offsets({L}) count"
    assert len(set(off)) == 7 ** L, f"offsets({L}) unique"

# --- Property 2: adjacent L5 tiles are disjoint ---
off5 = cu.generate_gosper_offsets(5)
seen = set()
for nq, nr in cu.GOSPER_NEIGHBORS:
    sq, sr = cu.gosper_mul_m_pow(nq, nr, 5)
    seen.update((q + sq, r + sr) for q, r in off5)
assert len(seen) == 7 * 16807, "L5 island + 6 neighbors tile disjointly"

# --- Property 3: parent round-trips ---
for yq in range(-40, 41, 7):
    for yr in range(-40, 41, 7):
        pq, pr = cu.gosper_mul_m(yq, yr)
        for j, (dq, dr) in enumerate(cu.GOSPER_NEIGHBORS):
            rq, rr, child, _, _ = cu.gosper_parent(pq + dq, pr + dr)
            assert (rq, rr, child) == (pq, pr, j), f"parent({pq+dq},{pr+dr})"

# --- Property 4: tile ownership ---
for yq, yr in [(0, 0), (1, 0), (-2, 3), (5, -4)]:
    cq, cr = cu.gosper_lattice_to_center(yq, yr)
    for i in [0, 1, 7, 2400, 16806, 8403]:
        oq, orr = off5[i]
        assert cu.gosper_tile_of_unit(cq + oq, cr + orr) == (yq, yr), f"tileOfUnit {i}"

# --- Property 5: Int8 range ---
max_abs = max(max(abs(q), abs(r)) for q, r in off5)
assert max_abs < 127, f"L5 offsets fit int8 (max {max_abs})"

# --- Property 6: conformality ---
for q, r in [(1, 0), (0, 1), (3, -2)]:
    wx0, wy0 = cu.axial_to_world_meters(q, r)
    mq, mr = cu.gosper_mul_m(q, r)
    wx1, wy1 = cu.axial_to_world_meters(mq, mr)
    ratio = math.hypot(wx1, wy1) / math.hypot(wx0, wy0)
    assert abs(ratio - math.sqrt(7)) < 1e-9, f"|Mv|/|v| for ({q},{r})"
    d_ang = math.atan2(wy1, wx1) - math.atan2(wy0, wx0)
    norm = math.atan2(math.sin(d_ang), math.cos(d_ang))
    assert abs(norm - cu.GOSPER_ROT_PER_LEVEL) < 1e-9, f"rotation for ({q},{r})"

# --- Property 7: heap indexing ---
depth = [(0, 0)]
for d in range(5):
    nxt = []
    for cq_, cr_ in depth:
        for nq, nr in cu.GOSPER_NEIGHBORS:
            sq, sr = cu.gosper_mul_m_pow(nq, nr, 4 - d)
            nxt.append((cq_ + sq, cr_ + sr))
    depth = nxt
    stride = 7 ** (5 - (d + 1))
    step = max(1, len(depth) // 97)
    for i in range(0, len(depth), step):
        assert off5[i * stride] == depth[i], f"heap center depth {d+1} node {i}"

# --- Canonical dump ---
xs, ys = zip(*(cu.axial_to_world_meters(q, r) for q, r in off5))
out = {
    "matrix": list(cu.gosper_mul_m(1, 0)) + list(cu.gosper_mul_m(0, 1)),
    "rotPerLevelDeg": round(math.degrees(cu.GOSPER_ROT_PER_LEVEL), 9),
    "levelSizes": [round(cu.gosper_level_size(k), 9) for k in range(6)],
    "maxAbsOffset": max_abs,
    "worldBBox": [round(min(xs), 6), round(max(xs), 6), round(min(ys), 6), round(max(ys), 6)],
    "latticeCenters": [list(cu.gosper_lattice_to_center(a, b)) for a, b in [(0, 0), (1, 0), (0, 1), (-3, 2)]],
    "offsets5": [v for qr in off5 for v in qr],
}
print(json.dumps(out, separators=(",", ":")))
print("PY: all gosper property checks passed.", file=sys.stderr)
