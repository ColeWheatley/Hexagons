"""Heap-order L1 centroid geometry for level-5 Gosper islands.

Imports hex_backend/coordinate_utility.py from this repo so the offset table
is the same code the baker and the JS frontend parity gate use
(tests/gosper/run_parity.sh diffs it against frontend/app/gosper_core.js).

Structural facts this module leans on (coordinate_utility docstrings):
  * node (depth d, index i) has children (d+1, 7i..7i+6);
  * child 0 is CONCENTRIC with its parent, so the depth-4 (L1) node centres
    are the unit-hex centres at heap indices 0, 7, 14, ... = unit_offsets[0::7];
  * world metres ARE EPSG:31254 (waffle_iron.latlon_to_world_meters is a bare
    4326 -> 31254 transform with no further shift).
"""

from __future__ import annotations

import os
import sys
from functools import lru_cache

import numpy as np

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.join(REPO_ROOT, "hex_backend"))

import coordinate_utility as cu  # noqa: E402

N_COLUMNS = 2401
L1_PITCH_M = 6.4 * np.sqrt(7.0)          # 16.9328 m flat-to-flat


@lru_cache(maxsize=1)
def l1_offsets_world():
    """(offx, offy) float64 [2401] — L1 node centres relative to the island
    centre, world metres (== EPSG:31254 metres), depth-4 heap order."""
    geom = cu.gosper_tile_geometry()
    offx = geom["offx"][0::7].copy()
    offy = geom["offy"][0::7].copy()
    assert offx.shape == (N_COLUMNS,)
    assert offx[0] == 0.0 and offy[0] == 0.0   # child-0 chain is concentric
    return offx, offy


def tile_center_world(lat_q: int, lat_r: int):
    """Island centre in world metres (EPSG:31254) from L5 lattice coords."""
    q, r = cu.gosper_lattice_to_center(lat_q, lat_r)
    return cu.axial_to_world_meters(q, r)


def l1_centroids_epsg31254(lat_q: int, lat_r: int) -> np.ndarray:
    """[2401, 2] float64 (x, y) EPSG:31254 centroids, depth-4 heap order."""
    cx, cy = tile_center_world(lat_q, lat_r)
    offx, offy = l1_offsets_world()
    out = np.empty((N_COLUMNS, 2), dtype=np.float64)
    out[:, 0] = cx + offx
    out[:, 1] = cy + offy
    return out


def column_of_point(x_m: float, y_m: float):
    """EPSG:31254 point -> ((lat_q, lat_r), depth4_index) of the owning column.

    Walks unit hex -> owning L5 tile via gosper_parent chains, accumulating
    the big-endian base-7 heap digits of the unit, then divides by 7 for the
    L1 (depth-4) index.  Used for station -> column mapping.
    """
    fq, fr = cu.world_meters_to_axial_approx(x_m, y_m)
    q, r = cu.round_axial(fq, fr)
    digits = []
    for _ in range(cu.GOSPER_TILE_LEVEL):
        _, _, child_idx, q, r = cu.gosper_parent(q, r)
        digits.append(child_idx)
    unit_index = 0
    for d in reversed(digits):
        unit_index = unit_index * 7 + d
    return (q, r), unit_index // 7
