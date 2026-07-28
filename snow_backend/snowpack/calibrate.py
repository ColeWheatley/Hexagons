"""Calibration harness skeleton — station-column shortcut.

Per the design doc (section 7): fitting the ~8 calibratable scalars does NOT
need the full domain.  We extract the station columns' static terrain +
node forcing once (a handful of columns), run the full-winter scan on just
those columns (microseconds/step), and differentiate the HS misfit through
the whole winter with jax.grad — no checkpointing needed at this size.

STATUS: harness skeleton, wired and importable; the optimize loop is written
but intentionally not run in the backfill pipeline (needs a winter of station
obs joined, see station_compare.py, and a human eye on the loss surface).

    pixi run python snow_backend/snowpack/calibrate.py --check-grad
runs one loss+gradient evaluation on 30 days as a smoke test.
"""

from __future__ import annotations

import argparse
import json
import os
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import jax  # noqa: E402
import jax.numpy as jnp  # noqa: E402

from params import CALIBRATABLE, Theta  # noqa: E402
from physics import step  # noqa: E402
from state import Static, init_state  # noqa: E402

DATA_DEFAULT = os.path.abspath(os.path.join(HERE, "..", "data"))


def theta_from_vector(v):
    """Vector of the CALIBRATABLE fields (as multipliers of the defaults) ->
    Theta.  Multiplicative parameterization keeps scales comparable."""
    base = Theta()
    upd = {k: getattr(base, k) * v[i] for i, k in enumerate(CALIBRATABLE)}
    return base._replace(**upd)


def load_station_problem(data_dir, max_dist_m=float("inf")):
    """Stations that have observation files.  NOTE (data reality, 2026-07):
    every station with a numeric series lies OUTSIDE the beta footprint
    (9-52 km); their mapped columns are elevation-comparable proxies, so the
    fit is a magnitude calibration, not a point validation — weight by
    1/distance or gate on elevation similarity when running in earnest."""
    st = [s for s in json.load(open(os.path.join(data_dir, "station_columns.json")))
          if s["distance_m"] < max_dist_m and s.get("file")]
    if not st:
        raise SystemExit("no stations with observation files in station_columns.json")
    cols = np.array([s["column_id"] for s in st], dtype=np.int64)
    terr = np.load(os.path.join(data_dir, "terrain_columns.npz"))
    static = Static(
        elev=terr["elev_m"][cols], dz_node=terr["dz_node_m"][cols],
        n_east=terr["n_east"][cols], n_north=terr["n_north"][cols],
        n_up=terr["n_up"][cols], svf=terr["svf"][cols],
        valid=terr["valid"][cols],
        tile_of_col=(cols // 2401).astype(np.int32),
    )
    nf = np.load(os.path.join(data_dir, "node_forcing_winter.npz"))
    return st, static, nf


def winter_hs(theta_vec, static_dev, xs, n_tiles):
    """Differentiable: parameter vector -> modeled HS (cm) [T/24, n_st]
    sampled daily at 06 UTC."""
    th = theta_from_vector(theta_vec)
    state = jax.tree.map(jnp.asarray, init_state_np(static_dev, n_tiles))
    def body(s, x):
        s2, (out, diag) = step(s, x, static_dev, th)
        return s2, diag["hs_cm"]
    _, hs = jax.lax.scan(body, state, xs)
    return hs[6::24]                                   # daily 06 UTC


def init_state_np(static, n_tiles):
    import state as state_mod
    host_static = Static(*[np.asarray(a) for a in static])
    return state_mod.init_state(host_static, n_tiles)


def loss_fn(theta_vec, static_dev, xs, n_tiles, obs, obs_mask):
    hs = winter_hs(theta_vec, static_dev, xs, n_tiles)
    r = jnp.where(obs_mask, hs - obs, 0.0)
    return (r ** 2).sum() / jnp.maximum(obs_mask.sum(), 1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default=DATA_DEFAULT)
    ap.add_argument("--check-grad", action="store_true")
    ap.add_argument("--days", type=int, default=30)
    args = ap.parse_args()

    st, static, nf = load_station_problem(args.data)
    n_tiles = nf["forcing"].shape[1]
    h = args.days * 24
    xs = (jnp.asarray(nf["forcing"][:h]), jnp.asarray(nf["glcs"][:h]),
          jnp.asarray(nf["sun_enu"][:h]), jnp.arange(h, dtype=jnp.int32))
    static_dev = Static(*[jnp.asarray(a) for a in static])

    if args.check_grad:
        # smoke test: gradient of a synthetic zero-obs loss must be finite
        obs = jnp.zeros((h // 24, len(st)))
        mask = jnp.ones_like(obs, dtype=bool)
        v0 = jnp.ones(len(CALIBRATABLE))
        loss, grad = jax.value_and_grad(loss_fn)(v0, static_dev, xs,
                                                 n_tiles, obs, mask)
        print(f"{len(st)} station columns, {args.days} days")
        print(f"loss {float(loss):.2f}")
        for k, g in zip(CALIBRATABLE, np.asarray(grad)):
            print(f"  d loss / d {k:22s} {g:12.4f}")
        assert np.isfinite(np.asarray(grad)).all(), "non-finite gradient"
        print("gradient finite: OK")
        return

    print("full optimization intentionally not wired to run unattended; "
          "use --check-grad, then drive loss_fn with your optimizer of choice "
          "against station_compare.csv observations.")


if __name__ == "__main__":
    main()
