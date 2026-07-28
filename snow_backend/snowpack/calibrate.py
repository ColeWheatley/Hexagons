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


def load_synthetic_problem(data_dir):
    """SYNTHETIC station columns (team-lead ruling): station elevation from
    metadata, flat/open terrain (slope 0, n_up 1, SVF 1 — stations are flat
    mounts), INCA forcing bilinear AT the station point
    (station_forcing_winter.npz from build_terrain).  The engine's tile
    gather works unchanged with n_tiles == n_stations and
    tile_of_col == arange."""
    nf = np.load(os.path.join(data_dir, "station_forcing_winter.npz"))
    meta = json.loads(str(nf["meta"]))
    n = len(meta["station_ids"])
    f32 = np.float32
    static = Static(
        elev=np.asarray(meta["elevations_m"], f32),
        dz_node=np.zeros(n, f32),
        n_east=np.zeros(n, f32), n_north=np.zeros(n, f32),
        n_up=np.ones(n, f32), svf=np.ones(n, f32),
        valid=np.ones(n, bool),
        tile_of_col=np.arange(n, dtype=np.int32),
    )
    st = [{"id": i, "file": f, "elevation_m": e, "distance_m": 0.0,
           "column_id": k}
          for k, (i, f, e) in enumerate(zip(meta["station_ids"],
                                            meta["files"],
                                            meta["elevations_m"]))]
    return st, static, nf


def load_obs_matrix(st, times_daily, stations_dir):
    """Daily sh (cm) observations -> (obs [D, n_st], mask); -1.0/empty = NaN."""
    import csv
    n = len(st)
    dates = [str(t)[:10] for t in times_daily]
    date_idx = {d: i for i, d in enumerate(dates)}
    obs = np.full((len(dates), n), np.nan, np.float32)
    for j, s in enumerate(st):
        p = os.path.join(stations_dir, s["file"])
        if not os.path.exists(p):
            continue
        for row in csv.DictReader(open(p)):
            i = date_idx.get(row["time"][:10])
            if i is None:
                continue
            try:
                v = float(row.get("sh") or "nan")
            except ValueError:
                continue
            if v >= 0.0:
                obs[i, j] = v
    mask = np.isfinite(obs)
    return np.nan_to_num(obs), mask


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default=DATA_DEFAULT)
    ap.add_argument("--check-grad", action="store_true")
    ap.add_argument("--synthetic", action="store_true",
                    help="flat synthetic station columns + station-point INCA")
    ap.add_argument("--stations-dir", default=(
        "/private/tmp/claude-501/-Users-cole-dev/"
        "af754c65-5383-45a7-ae6c-4108255c1107/scratchpad/validation/stations"))
    ap.add_argument("--days", type=int, default=30)
    args = ap.parse_args()

    if args.synthetic:
        st, static, nf = load_synthetic_problem(args.data)
    else:
        st, static, nf = load_station_problem(args.data)
    n_tiles = nf["forcing"].shape[1]
    h = args.days * 24
    xs = (jnp.asarray(nf["forcing"][:h]), jnp.asarray(nf["glcs"][:h]),
          jnp.asarray(nf["sun_enu"][:h]), jnp.arange(h, dtype=jnp.int32))
    static_dev = Static(*[jnp.asarray(a) for a in static])

    if args.check_grad:
        # loss vs REAL daily sh observations where present (else zeros)
        times = nf["time_s"].astype("datetime64[s]")[6::24][:h // 24]
        obs_np, mask_np = load_obs_matrix(st, times, args.stations_dir)
        if not mask_np.any():
            obs_np = np.zeros((h // 24, len(st)), np.float32)
            mask_np = np.ones_like(obs_np, bool)
            print("(no observations found in window; zero-target smoke)")
        obs, mask = jnp.asarray(obs_np), jnp.asarray(mask_np)
        v0 = jnp.ones(len(CALIBRATABLE))
        loss, grad = jax.value_and_grad(loss_fn)(v0, static_dev, xs,
                                                 n_tiles, obs, mask)
        print(f"{len(st)} station columns, {args.days} days, "
              f"{int(mask_np.sum())} obs")
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
