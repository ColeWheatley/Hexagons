"""Engine state pytree + static per-column terrain container.

All arrays are fp32, SoA, flat [N] (or [K, N]) in canonical column order
(tile_manifest tiles[] order x depth-4 heap order).  The state is a NamedTuple
so JAX treats it as a pytree; in-place semantics come from buffer donation.
"""

from __future__ import annotations

from typing import NamedTuple

import numpy as np

from params import NL, TM

RING_H = 72                 # snowfall history hours (HN24/48/72)
NMARK = 3                   # weak-layer marker slots


class SnowState(NamedTuple):
    tsno: np.ndarray        # [NL, N] K   (empty layers carry TM)
    ice: np.ndarray         # [NL, N] kg m-2
    liq: np.ndarray         # [NL, N] kg m-2
    thick: np.ndarray       # [NL, N] m
    tsoil: np.ndarray       # [2, N] K
    albedo: np.ndarray      # [N]
    ring: np.ndarray        # [RING_H, N] snowfall mm w.e. per hour
    m_swe_below: np.ndarray  # [NMARK, N] kg m-2; SWE beneath marker at burial
    m_strength: np.ndarray  # [NMARK, N] 0..1 (>=1 -> retired/inactive)
    m_age: np.ndarray       # [NMARK, N] h
    facet_pot: np.ndarray   # [N] h of facet-building conditions
    crust_age: np.ndarray   # [N] h since surface refroze (0 = no crust)
    wet_prev: np.ndarray    # [N] 0/1 surface was wet last step
    cloud: np.ndarray       # [n_tiles] persisted cloudiness 0..1
    runoff: np.ndarray      # [N] cumulative mm (mass audit)
    subl: np.ndarray        # [N] cumulative mm sublimated (+) / deposited (-)


class Static(NamedTuple):
    elev: np.ndarray            # [N] m
    dz_node: np.ndarray         # [N] m (elev - tile node elev)
    n_east: np.ndarray          # [N]
    n_north: np.ndarray         # [N]
    n_up: np.ndarray            # [N]
    svf: np.ndarray             # [N]
    valid: np.ndarray           # [N] bool
    tile_of_col: np.ndarray     # [N] int32


def init_state(static: Static, n_tiles: int) -> SnowState:
    n = static.elev.shape[0]
    f32 = np.float32
    # Soil starts at a crude elevation-dependent mean-annual temperature.
    tso = np.clip(284.0 - 0.0065 * static.elev, 271.0, 284.0).astype(f32)
    return SnowState(
        tsno=np.full((NL, n), TM, f32),
        ice=np.zeros((NL, n), f32),
        liq=np.zeros((NL, n), f32),
        thick=np.zeros((NL, n), f32),
        tsoil=np.stack([tso, tso]),
        albedo=np.full(n, 0.8, f32),
        ring=np.zeros((RING_H, n), f32),
        m_swe_below=np.zeros((NMARK, n), f32),
        m_strength=np.full((NMARK, n), 2.0, f32),      # inactive
        m_age=np.zeros((NMARK, n), f32),
        facet_pot=np.zeros(n, f32),
        crust_age=np.zeros(n, f32),
        wet_prev=np.zeros(n, f32),
        cloud=np.full(n_tiles, 0.5, f32),
        runoff=np.zeros(n, f32),
        subl=np.zeros(n, f32),
    )


def load_static(terrain_npz_path: str, tile_slots=None) -> tuple[Static, dict]:
    """Terrain pack -> Static (optionally restricted to a tile-slot subset;
    tile_of_col stays the ORIGINAL slot so forcing gathers keep working)."""
    d = np.load(terrain_npz_path, allow_pickle=False)
    n_tiles = len(d["tile_yq"])
    tile_of_col = np.repeat(np.arange(n_tiles, dtype=np.int32), 2401)
    sel = slice(None)
    if tile_slots is not None:
        sel = np.concatenate([np.arange(s * 2401, (s + 1) * 2401)
                              for s in tile_slots])
    st = Static(
        elev=d["elev_m"][sel].astype(np.float32),
        dz_node=d["dz_node_m"][sel].astype(np.float32),
        n_east=d["n_east"][sel], n_north=d["n_north"][sel],
        n_up=d["n_up"][sel], svf=d["svf"][sel],
        valid=d["valid"][sel],
        tile_of_col=tile_of_col[sel],
    )
    info = {"n_tiles": n_tiles,
            "tile_yq": d["tile_yq"], "tile_yr": d["tile_yr"],
            "meta": str(d["meta"])}
    return st, info
