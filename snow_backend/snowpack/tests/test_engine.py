"""Engine unit tests: conservation, refreeze, marker burial, sidecar format.

    cd <repo> && pixi run python -m unittest discover snow_backend/snowpack/tests -v
"""

import os
import sys
import unittest

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.abspath(os.path.join(HERE, "..")))

import jax  # noqa: E402
import jax.numpy as jnp  # noqa: E402

import sidecar  # noqa: E402
from params import CI, CW, NL, TM, Theta  # noqa: E402
from physics import remap, step  # noqa: E402
from state import Static, init_state  # noqa: E402

N = 4          # tiny column set
THETA = Theta()


def toy_static(n=N, elev=2400.0):
    f32 = np.float32
    return Static(
        elev=np.full(n, elev, f32), dz_node=np.zeros(n, f32),
        n_east=np.zeros(n, f32), n_north=np.zeros(n, f32),
        n_up=np.ones(n, f32), svf=np.ones(n, f32),
        valid=np.ones(n, bool), tile_of_col=np.zeros(n, np.int32),
    )


def forcing_row(t2m=265.0, rh=70.0, rr=0.0, gl=0.0, u=2.0, p=101325.0):
    """[1, 8] tile row: T2M TD2M RH2M RR GL UU VV P0."""
    return np.array([[t2m, t2m - 2.0, rh, rr, gl, u, 0.0, p]], np.float32)


def run_hours(state, static, rows, t0=0):
    """rows: list of (forcing_row, gl_cs, sun_up). Returns state, diags list."""
    diags = []
    for i, (fr, glcs, sun_up) in enumerate(rows):
        xs = (jnp.asarray(fr), jnp.asarray([glcs], jnp.float32),
              jnp.asarray([[0.0, 0.0, sun_up]], jnp.float32),
              jnp.int32(t0 + i))
        state, (out, diag) = step(state, xs, static, THETA)
        diags.append((out, diag))
    return state, diags


class TestRemapConservation(unittest.TestCase):
    def test_random_states_conserve(self):
        rng = np.random.default_rng(0)
        n = 64
        ice = jnp.asarray(rng.uniform(0, 80, (NL, n)).astype(np.float32))
        liq = jnp.asarray(rng.uniform(0, 5, (NL, n)).astype(np.float32))
        thick = jnp.asarray((np.asarray(ice) / 250.0))
        tsno = jnp.asarray(rng.uniform(250, 273, (NL, n)).astype(np.float32))
        t2, i2, l2, d2 = remap(tsno, ice, liq, thick)
        np.testing.assert_allclose(np.asarray(i2.sum(0)), np.asarray(ice.sum(0)),
                                   rtol=2e-5)
        np.testing.assert_allclose(np.asarray(l2.sum(0)), np.asarray(liq.sum(0)),
                                   rtol=2e-4, atol=1e-3)
        h1 = np.asarray(((CI * ice + CW * liq) * (tsno - TM)).sum(0))
        h2 = np.asarray(((CI * i2 + CW * l2) * (t2 - TM)).sum(0))
        np.testing.assert_allclose(h2, h1, rtol=2e-4, atol=50.0)

    def test_thin_snow_single_layer(self):
        n = 2
        ice = jnp.zeros((NL, n)).at[0, :].set(5.0)
        liq = jnp.zeros((NL, n))
        thick = jnp.zeros((NL, n)).at[0, :].set(0.05)
        tsno = jnp.full((NL, n), TM - 5.0)
        t2, i2, l2, d2 = remap(tsno, ice, liq, thick)
        self.assertAlmostEqual(float(i2[0, 0]), 5.0, places=4)
        self.assertAlmostEqual(float(i2[1:, 0].sum()), 0.0, places=5)
        self.assertAlmostEqual(float(t2[0, 0]), TM - 5.0, places=3)


class TestMassConservation(unittest.TestCase):
    def test_winter_storm_cycle(self):
        static = toy_static()
        state = jax.tree.map(jnp.asarray, init_state(static, 1))
        rows = []
        rows += [(forcing_row(t2m=268.0, rr=2.0), 0.0, 0.0)] * 48   # snow
        rows += [(forcing_row(t2m=276.0, rr=1.0, gl=300.0), 400.0, 0.5)] * 24  # rain+melt
        rows += [(forcing_row(t2m=262.0), 0.0, 0.0)] * 48           # cold
        state, diags = run_hours(state, static, rows)
        snowf = sum(float(d["snowf"][0]) for _, d in diags)
        rain = sum(float(d["rain"][0]) for _, d in diags)
        swe = float(np.asarray((state.ice + state.liq).sum(0))[0])
        runoff = float(np.asarray(state.runoff)[0])
        subl = float(np.asarray(state.subl)[0])
        residual = snowf + rain - swe - runoff - subl
        self.assertLess(abs(residual), 0.15,
                        f"mass residual {residual:.3f} mm "
                        f"(P {snowf+rain:.1f} SWE {swe:.1f} R {runoff:.1f})")
        self.assertGreater(swe, 30.0)


class TestRefreezeCycle(unittest.TestCase):
    def test_melt_then_refreeze(self):
        static = toy_static()
        state = jax.tree.map(jnp.asarray, init_state(static, 1))
        state, _ = run_hours(state, static,
                             [(forcing_row(t2m=266.0, rr=3.0), 0.0, 0.0)] * 48)
        # warm sunny afternoon -> liquid appears
        state, _ = run_hours(state, static,
                             [(forcing_row(t2m=278.0, gl=500.0, u=3.0),
                               600.0, 0.6)] * 8, t0=48)
        liq_warm = float(np.asarray(state.liq).sum(0)[0])
        self.assertGreater(liq_warm, 0.5, "no melt water after warm spell")
        t_top_warm = float(np.asarray(state.tsno)[0, 0])
        self.assertAlmostEqual(t_top_warm, TM, delta=0.5)   # remap mixing
        # cold clear night -> refreeze, surface cools below freezing
        state, _ = run_hours(state, static,
                             [(forcing_row(t2m=258.0, u=1.0), 0.0, 0.0)] * 16,
                             t0=56)
        liq_cold = float(np.asarray(state.liq).sum(0)[0])
        self.assertLess(liq_cold, 0.05, "liquid failed to refreeze")
        self.assertLess(float(np.asarray(state.tsno)[0, 0]), TM - 2.0)
        self.assertGreater(float(np.asarray(state.crust_age)[0]), 0.0,
                           "refreeze crust not flagged")


class TestMarkerBurial(unittest.TestCase):
    def test_facet_burial_sequence(self):
        static = toy_static()
        state = jax.tree.map(jnp.asarray, init_state(static, 1))
        # base snowpack
        state, _ = run_hours(state, static,
                             [(forcing_row(t2m=267.0, rr=2.5), 0.0, 0.0)] * 48)
        swe_base = float(np.asarray((state.ice + state.liq).sum(0))[0])
        # cold clear calm week (16 h night / 8 h clear day so the inferred
        # cloudiness actually observes clear sky): facet potential builds
        clear_week = []
        for _day in range(3):
            clear_week += [(forcing_row(t2m=248.0, u=1.0, rh=50.0),
                            0.0, 0.0)] * 16
            clear_week += [(forcing_row(t2m=248.0, u=1.0, rh=50.0, gl=360.0),
                            380.0, 0.35)] * 8
        state, _ = run_hours(state, static, clear_week, t0=48)
        pot = float(np.asarray(state.facet_pot)[0])
        self.assertGreater(pot, THETA.facet_hours_min,
                           f"facet potential only {pot:.1f} h")
        swe_pre = float(np.asarray((state.ice + state.liq).sum(0))[0])
        # storm buries the weak surface
        state, diags = run_hours(state, static,
                                 [(forcing_row(t2m=266.0, rr=2.0), 0.0, 0.0)] * 24,
                                 t0=120)
        strength = np.asarray(state.m_strength)[:, 0]
        below = np.asarray(state.m_swe_below)[:, 0]
        active = strength < 1.0
        self.assertTrue(active.any(), "no marker pushed after burial")
        j = int(np.argmax(active))
        self.assertLess(abs(below[j] - swe_pre), 25.0,
                        f"marker at swe_below {below[j]:.1f}, expected ~{swe_pre:.1f}")
        slab_byte = int(np.asarray(diags[-1][0]["slab"])[0])
        self.assertGreater(slab_byte, 1, "slab layer did not report the burial")


class TestBareGroundStability(unittest.TestCase):
    def test_no_snow_no_nan(self):
        static = toy_static(elev=1200.0)
        state = jax.tree.map(jnp.asarray, init_state(static, 1))
        state, diags = run_hours(
            state, static,
            [(forcing_row(t2m=280.0, gl=400.0, rr=0.5), 500.0, 0.5)] * 72)
        for f in state._fields:
            self.assertTrue(np.isfinite(np.asarray(getattr(state, f))).all(),
                            f"NaN in state.{f}")
        self.assertLess(float(np.asarray((state.ice + state.liq).sum(0)).max()),
                        0.5, "phantom snow on warm bare ground")
        self.assertEqual(int(np.asarray(diags[-1][0]["surface"])[0]), 7)  # bare
        self.assertAlmostEqual(float(np.asarray(state.runoff)[0]),
                               0.5 * 72, delta=1.0)  # rain runs off


class TestSidecarFormat(unittest.TestCase):
    def test_pfl_roundtrip_and_nodata(self):
        import tempfile
        with tempfile.TemporaryDirectory() as td:
            t = np.datetime64("2026-01-15T09:00:00")
            body = np.zeros(3 * 2401, np.uint8)
            body[2401:2 * 2401] = 42
            p = sidecar.write_pfl(td, "sqh", t, body, 3, 0xDEADBEEF)
            self.assertTrue(p.endswith("sqh/2026/01/15/09.pfl"))
            fields, data = sidecar.read_pfl(p)
            self.assertEqual(fields[0], b"PFL1")
            self.assertEqual(fields[2], sidecar.LAYERS["sqh"]["id"])
            self.assertEqual(fields[3], sidecar.epoch_hour(t))
            self.assertEqual(fields[4], 3)
            self.assertEqual(fields[5], 2401)
            self.assertEqual(fields[8], 0xDEADBEEF)
            self.assertEqual(len(data), 3 * 2401)
            self.assertTrue((data[:2401] == 0).all())          # NODATA tile
            self.assertTrue((data[2401:2 * 2401] == 42).all())

    def test_index_schema(self):
        idx = sidecar.build_index(197, "beta-stubai", [0, 1, 2, 26],
                                  np.datetime64("2025-11-02T02:00:00"))
        self.assertEqual(idx["tile_count"], 197)
        self.assertEqual(idx["coverage"]["count"], 4344)
        ids = [l["id"] for l in idx["layers"]]
        self.assertEqual(ids, ["sqh", "depth", "avalanche", "surface"])
        avy = idx["layers"][2]
        self.assertEqual(avy["fields"]["release"],
                         {"shift": 7, "bits": 1, "aggregate": "or",
                          "domain": [0, 1]})
        self.assertEqual(avy["fields"]["severity"]["aggregate"], "max")
        import base64
        bits = np.unpackbits(np.frombuffer(
            base64.b64decode(idx["coverage"]["present"]), np.uint8))
        self.assertEqual(list(np.flatnonzero(bits)), [0, 1, 2, 26])


if __name__ == "__main__":
    unittest.main()
