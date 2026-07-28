# @atlas: Energy-line runout engine (fallback backend): iterated 8-direction masked sweeps relax E(cell) = max(E, E_neighbor - tan(alpha)*d) to the Bellman fixpoint (exact blocking through unreached cells, identical result to Dijkstra); small heapq Dijkstra kept for crop validation.
import heapq

import numpy as np

from . import config

# Slab -> seed-energy lift (m): deeper slab runs slightly farther. Replaces the
# design doc's per-seed alpha tweak with a backend-uniform equivalent heuristic.
SLAB_E_GAIN_M = 30.0


def seed_energy(dem, slab, seed_mask):
    """Seed energy-line height for release cells: terrain + slab + slab-driven
    lift. Including the slab keeps every seed strictly above terrain, so seeds
    always forward energy (reached test is E > z, strict)."""
    lift = SLAB_E_GAIN_M * np.clip(slab - 0.5, 0.0, 1.0)
    E = np.full(dem.shape, -np.inf, dtype=np.float32)
    s = np.clip(slab[seed_mask], config.SLAB_MIN_M, config.SLAB_MAX_M)
    E[seed_mask] = dem[seed_mask] + s + lift[seed_mask]
    return E


def sweep_fixpoint(dem, E0, alpha_deg, max_iter=80, tol=1e-3, verbose=False):
    """Relax to the energy-line fixpoint.

    dem: float32, NaN = outside data (never reached, never forwards).
    E0:  seed energies (-inf elsewhere).
    Returns E (float32). A cell is *reached* iff E > dem (seeds trivially so).

    Propagation forwards energy only through reached cells (E > dem), so flow
    cannot tunnel under terrain. Each iteration does 8 sequential masked
    sweeps (vectorized across the perpendicular axis); iteration converges
    because E is bounded above by max(E0) and non-decreasing.
    """
    t = np.float32(np.tan(np.radians(alpha_deg)))
    cs = t * np.float32(config.CELL)          # straight step cost
    cd = t * np.float32(config.CELL * np.sqrt(2))  # diagonal step cost

    z = np.where(np.isnan(dem), np.float32(np.inf), dem)
    E = E0.copy()
    neg_inf = np.float32(-np.inf)

    def pass_axis(E, axis, reverse, cost):
        """Straight sweep along `axis`; vectorized across the other axis."""
        n = E.shape[axis]
        rng = range(n - 2, -1, -1) if reverse else range(1, n)
        step = 1 if reverse else -1
        for i in rng:
            src = np.take(E, i + step, axis=axis)
            zsrc = np.take(z, i + step, axis=axis)
            fwd = np.where(src > zsrc, src, neg_inf) - cost
            dst = np.take(E, i, axis=axis)
            np.copyto(dst, np.maximum(dst, fwd))
            if axis == 0:
                E[i, :] = dst
            else:
                E[:, i] = dst
        return E

    def pass_diag(E, di, dj, cost):
        """Diagonal sweep: row loop, vectorized along columns with shift dj."""
        n = E.shape[0]
        rng = range(1, n) if di == 1 else range(n - 2, -1, -1)
        for i in rng:
            src_row = E[i - di]
            z_row = z[i - di]
            fwd = np.where(src_row > z_row, src_row, neg_inf) - cost
            if dj == 1:
                E[i, 1:] = np.maximum(E[i, 1:], fwd[:-1])
            else:
                E[i, :-1] = np.maximum(E[i, :-1], fwd[1:])
        return E

    for it in range(max_iter):
        before = E
        E = E.copy()
        E = pass_axis(E, axis=1, reverse=False, cost=cs)  # W -> E
        E = pass_axis(E, axis=1, reverse=True, cost=cs)   # E -> W
        E = pass_axis(E, axis=0, reverse=False, cost=cs)  # N -> S
        E = pass_axis(E, axis=0, reverse=True, cost=cs)   # S -> N
        E = pass_diag(E, di=1, dj=1, cost=cd)
        E = pass_diag(E, di=1, dj=-1, cost=cd)
        E = pass_diag(E, di=-1, dj=1, cost=cd)
        E = pass_diag(E, di=-1, dj=-1, cost=cd)
        finite = np.isfinite(E) & np.isfinite(before)
        delta = float(np.max(E[finite] - before[finite])) if finite.any() else 0.0
        grew = int((np.isfinite(E) & ~np.isfinite(before)).sum())
        if verbose:
            print(f"  iter {it + 1}: max dE {delta:.4f}, new cells {grew}")
        if delta < tol and grew == 0:
            break
    return E


def dijkstra_reference(dem, E0, alpha_deg):
    """Exact reference (heapq). For validation on crops only — slow."""
    t = np.tan(np.radians(alpha_deg))
    cs, cd = t * config.CELL, t * config.CELL * np.sqrt(2)
    z = np.where(np.isnan(dem), np.inf, dem)
    E = E0.astype(np.float64).copy()
    h, w = E.shape
    heap = [(-E[i, j], i, j) for i, j in zip(*np.where(np.isfinite(E0)))]
    heapq.heapify(heap)
    nbrs = [(-1, 0, cs), (1, 0, cs), (0, -1, cs), (0, 1, cs),
            (-1, -1, cd), (-1, 1, cd), (1, -1, cd), (1, 1, cd)]
    while heap:
        negE, i, j = heapq.heappop(heap)
        e = -negE
        if e < E[i, j]:
            continue
        if e <= z[i, j]:
            continue  # not reached -> does not forward
        for di, dj, c in nbrs:
            ni, nj = i + di, j + dj
            if 0 <= ni < h and 0 <= nj < w:
                ne = e - c
                if ne > E[ni, nj]:
                    E[ni, nj] = ne
                    heapq.heappush(heap, (-ne, ni, nj))
    return E.astype(np.float32)


def runout_margin(dem, E):
    """Energy margin above terrain (m) where reached, else 0."""
    m = E - dem
    return np.where(np.isfinite(m) & (m > 0), m, 0.0).astype(np.float32)
