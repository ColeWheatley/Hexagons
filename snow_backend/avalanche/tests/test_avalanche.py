# @atlas: Box-independent unit tests: energy-line analytic reach + blocking + Dijkstra equivalence on synthetic DEMs, harmonized byte contract invariants (no raw 128, floors, precedence), PFL header round-trip, hexpack max-pool with mock gather index, MPM change-skipping.
from datetime import datetime

import numpy as np
import pytest

from .. import bytelayer, config, energyline, mpm_driver, pfl


# ---------------------------------------------------------------------------
# Energy line
# ---------------------------------------------------------------------------

def _flat_dem(n=101, z=1000.0):
    return np.full((n, n), z, dtype=np.float32)


def test_pedestal_reach_matches_alpha():
    """A single seed on flat ground with seed energy h above terrain reaches
    r = h / (tan(alpha) * cell) cells along the axes, r / sqrt(2) diagonally."""
    dem = _flat_dem()
    seed = np.zeros(dem.shape, dtype=bool)
    seed[50, 50] = True
    h = 20.0
    E0 = np.full(dem.shape, -np.inf, dtype=np.float32)
    E0[50, 50] = dem[50, 50] + h
    alpha = 25.0
    E = energyline.sweep_fixpoint(dem, E0, alpha)
    reached = (E - dem) > 0

    expect_axis = int(h / (np.tan(np.radians(alpha)) * config.CELL))  # 8 cells
    row = reached[50, 50:]
    assert row[:expect_axis].all() and not row[expect_axis + 1:].any()
    diag = np.array([reached[50 + k, 50 + k] for k in range(0, 12)])
    expect_diag = int(h / (np.tan(np.radians(alpha)) * config.CELL * np.sqrt(2)))
    assert diag[:expect_diag].all() and not diag[expect_diag + 1:].any()


def test_wall_blocks_propagation():
    """A ridge higher than the energy line stops the flow; no tunneling."""
    dem = _flat_dem()
    dem[:, 60] = 1100.0  # 100 m wall east of the seed
    seed_E = 1000.0 + 30.0
    E0 = np.full(dem.shape, -np.inf, dtype=np.float32)
    E0[50, 50] = seed_E
    E = energyline.sweep_fixpoint(dem, E0, 25.0)
    reached = (E - dem) > 0
    assert not reached[:, 61:].any(), "energy tunneled through a blocking wall"


def test_downslope_plane_runs_out_and_stops():
    """On a 30 deg plane descending east, flow at alpha 25 keeps gaining
    margin; on the flat below it arrests at the alpha cutoff."""
    n = 200
    dem = np.zeros((n, n), dtype=np.float32)
    drop = np.tan(np.radians(30.0)) * config.CELL
    for j in range(100):
        dem[:, j] = 1000.0 + (99 - j) * drop  # slope from west, flat at j>=100
    dem[:, 100:] = 1000.0
    seed = np.zeros(dem.shape, dtype=bool)
    seed[100, 5] = True
    slab = np.full(dem.shape, 0.4, dtype=np.float32)
    E0 = energyline.seed_energy(dem, slab, seed)
    E = energyline.sweep_fixpoint(dem, E0, 25.0)
    reached = (E - dem) > 0
    assert reached[100, 99], "flow did not descend the slope"
    # Analytic flat-ground reach: margin at slope foot / per-cell loss.
    margin_foot = float(E[100, 99] - dem[100, 99])
    expect = int(margin_foot / (np.tan(np.radians(25.0)) * config.CELL))
    run_flat = int(reached[100, 100:].sum())
    assert abs(run_flat - expect) <= 1
    assert not reached[100, 100 + expect + 2:].any()


def test_sweep_equals_dijkstra_on_rough_terrain():
    rng = np.random.default_rng(7)
    dem = (rng.random((80, 80)).astype(np.float32) * 50.0)
    dem += np.linspace(400, 0, 80, dtype=np.float32)[None, :]  # eastward drop
    seed = np.zeros(dem.shape, dtype=bool)
    seed[::13, 5] = True
    slab = np.full(dem.shape, 0.6, dtype=np.float32)
    E0 = energyline.seed_energy(dem, slab, seed)
    Es = energyline.sweep_fixpoint(dem, E0, 24.0)
    Er = energyline.dijkstra_reference(dem, E0, 24.0)
    rs, rr = (Es - dem) > 0, (Er - dem) > 0
    assert (rs == rr).all(), "sweep fixpoint differs from Dijkstra"


def test_nan_dem_never_reached():
    dem = _flat_dem()
    dem[:, 70:] = np.nan
    E0 = np.full(dem.shape, -np.inf, dtype=np.float32)
    E0[50, 50] = 1030.0
    E = energyline.sweep_fixpoint(dem, E0, 25.0)
    m = energyline.runout_margin(dem, E)
    assert (m[:, 70:] == 0).all()


# ---------------------------------------------------------------------------
# Byte contract (harmonized)
# ---------------------------------------------------------------------------

def test_byte_contract_invariants():
    dem = np.array([[np.nan, 1000.0, 1000.0, 1000.0]], dtype=np.float32)
    f_agree = np.array([[0.0, 0.0, 1 / 3, 1.0]], dtype=np.float32)
    margin = np.array([[0.0, 0.0, 0.4, 500.0]], dtype=np.float32)
    release = np.array([[False, False, False, False]])
    slab = np.zeros((1, 4), dtype=np.float32)
    b = bytelayer.hazard_bytes(dem, f_agree, margin, release, slab)
    assert b[0, 0] == config.BYTE_NODATA          # NaN dem
    assert b[0, 1] == config.BYTE_SIMULATED_NONE  # simulated, unreached
    assert b[0, 2] >= config.RUNOUT_SEVERITY_MIN  # tiny margin still >= 2
    assert config.RUNOUT_SEVERITY_MIN <= b[0, 3] <= 127


def test_release_never_raw_128():
    slab = np.array([[0.0, 0.001, 0.05, 2.5, 99.0]], dtype=np.float32)
    rb = bytelayer.release_byte(slab)
    assert (rb >= 129).all(), "raw 128 (release with severity 0) must not exist"
    assert (rb <= 255).all()
    dem = np.full(slab.shape, 2000.0, dtype=np.float32)
    release = np.ones(slab.shape, dtype=bool)
    zeros = np.zeros(slab.shape, dtype=np.float32)
    b = bytelayer.hazard_bytes(dem, zeros, zeros, release, slab)
    assert (b >= 129).all()


def test_release_wins_over_runout():
    dem = np.full((1, 2), 2000.0, dtype=np.float32)
    f_agree = np.ones((1, 2), dtype=np.float32)
    margin = np.full((1, 2), 100.0, dtype=np.float32)
    release = np.array([[True, False]])
    slab = np.full((1, 2), 1.0, dtype=np.float32)
    b = bytelayer.hazard_bytes(dem, f_agree, margin, release, slab)
    assert b[0, 0] >= 129 and 2 <= b[0, 1] <= 127


# ---------------------------------------------------------------------------
# PFL container
# ---------------------------------------------------------------------------

def test_pfl_roundtrip(tmp_path):
    packed = np.arange(2 * config.TILE_BYTES, dtype=np.uint8).reshape(2, -1)
    when = datetime(2026, 1, 15, 12)
    p = pfl.write_sidecar(when, packed, meta={"x": 1}, base=tmp_path)
    assert p == tmp_path / "avalanche/2026/01/15/12.pfl"
    r = pfl.read_sidecar(p)
    assert r["tile_count"] == 2 and r["node_count"] == config.TILE_BYTES
    assert r["layer_id"] == config.PFL_LAYER_ID_AVALANCHE
    assert r["when"].hour == 12 and r["when"].day == 15
    assert (r["body"] == packed).all()
    assert p.stat().st_size == 32 + packed.size


# ---------------------------------------------------------------------------
# Hexpack (mock gather index)
# ---------------------------------------------------------------------------

def test_pack_tiles_max_and_nodata():
    from .. import hexpack

    mosaic = np.zeros((4, 4), dtype=np.uint8)
    mosaic[0, 0] = 5
    mosaic[1, 1] = 200
    # 1 tile, 2 hexes (padded shape irrelevant): hex0 samples cells {0,1,5},
    # hex1 samples all-NODATA cells {10, 11}.
    idx = np.array([[[0, 1, 5], [10, 11, 0]]], dtype=np.int64)
    valid = np.array([[[True, True, True], [True, True, False]]])
    out = hexpack.pack_tiles(mosaic, idx, valid)
    assert out.shape == (1, 2)
    assert out[0, 0] == 200  # max wins (release byte survives)
    assert out[0, 1] == 0    # all-NODATA hex stays NODATA


# ---------------------------------------------------------------------------
# MPM change-skipping (GPU-free logic)
# ---------------------------------------------------------------------------

def test_zones_to_run_skipping():
    labels = np.array([[1, 1, 2, 2]])
    zones = [dict(id=1), dict(id=2)]
    slab = np.array([[0.5, 0.5, 0.3, 0.3]], dtype=np.float32)
    wet = np.array([[False, False, False, False]])
    to_run, sigs = mpm_driver.zones_to_run(zones, labels, slab, wet, {})
    assert len(to_run) == 2  # first step: everything runs

    # unchanged -> nothing runs
    to_run, _ = mpm_driver.zones_to_run(zones, labels, slab, wet, sigs)
    assert len(to_run) == 0

    # slab moved on zone 2 only
    slab2 = slab.copy()
    slab2[0, 2:] += 0.2
    to_run, _ = mpm_driver.zones_to_run(zones, labels, slab2, wet, sigs)
    assert [z["id"] for z in to_run] == [2]

    # regime flip on zone 1 only
    wet2 = np.array([[True, True, False, False]])
    to_run, _ = mpm_driver.zones_to_run(zones, labels, slab, wet2, sigs)
    assert [z["id"] for z in to_run] == [1]


def test_zone_domain_clamps():
    zone = dict(row0=100, row1=200, col0=100, col1=200)
    win = mpm_driver.zone_domain((4000, 4000), zone, reach_cells=10000)
    cells = (win[0].stop - win[0].start) * (win[1].stop - win[1].start)
    assert cells <= mpm_driver.MAX_DOMAIN_CELLS
    assert win[0].start <= 100 and win[0].stop >= 200


if __name__ == "__main__":
    import sys

    sys.exit(pytest.main([__file__, "-v"]))
