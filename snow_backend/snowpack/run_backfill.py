"""Winter backfill driver: scan the engine over hourly INCA forcing, emit
.pfl sidecars + snapshots + station comparison.

    cd <repo> && pixi run python snow_backend/snowpack/run_backfill.py \
        --tiles station --days 181

--tiles all       every manifest tile (CPU: hours; GPU box: minutes)
--tiles station   tiles containing/nearest the validation stations (mini E2E)
--tiles 3,17,42   explicit tile slots

Sidecar bodies are ALWAYS full tile_count x 2401 (frontend hard-asserts the
length); columns of tiles not simulated in this run are NODATA=0.
"""

from __future__ import annotations

import argparse
import csv
import functools
import json
import os
import sys
import time as _time

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import jax  # noqa: E402
import jax.numpy as jnp  # noqa: E402

import sidecar  # noqa: E402
from params import Theta  # noqa: E402
from physics import step  # noqa: E402
from state import Static, init_state, load_static  # noqa: E402

DATA_DEFAULT = os.path.abspath(os.path.join(HERE, "..", "data"))
CHUNK_H = 24


def make_chunk_runner(static_dev, theta):
    @functools.partial(jax.jit, donate_argnums=0)
    def run_chunk(state, xs):
        return jax.lax.scan(lambda s, x: step(s, x, static_dev, theta),
                            state, xs)
    return run_chunk


def station_positions(stations, col_sel):
    """Map station column ids into subset positions (or -1)."""
    pos_of = {int(c): i for i, c in enumerate(col_sel)}
    return [(s, pos_of.get(s["column_id"], -1)) for s in stations]


def save_snapshot(path, state, t_next, theta):
    arrays = {f: np.asarray(getattr(state, f)) for f in state._fields}
    np.savez_compressed(path, meta=json.dumps(
        {"format": "snowpack-state", "version": 1, "next_hour_index": int(t_next),
         "theta": {k: float(v) for k, v in theta._asdict().items()}}), **arrays)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default=DATA_DEFAULT)
    ap.add_argument("--out", default=None, help="sidecar base dir")
    ap.add_argument("--tiles", default="station")
    ap.add_argument("--days", type=int, default=181)
    ap.add_argument("--snapshot-every-days", type=int, default=7)
    ap.add_argument("--no-sidecars", action="store_true")
    args = ap.parse_args()
    out_base = args.out or os.path.join(args.data, "sidecars")
    snap_dir = os.path.join(args.data, "snapshots")
    os.makedirs(snap_dir, exist_ok=True)

    terr_path = os.path.join(args.data, "terrain_columns.npz")
    static_full, info = load_static(terr_path)
    meta = json.loads(str(np.load(terr_path)["meta"]))
    n_tiles = info["n_tiles"]
    manifest_hash = meta["manifest_hash_u32"]
    profile = meta["release_profile"].get("profile", "beta-stubai")

    stations = json.load(open(os.path.join(args.data, "station_columns.json")))
    if args.tiles == "all":
        slots = list(range(n_tiles))
    elif args.tiles == "station":
        slots = sorted({s["tile_slot"] for s in stations if s["distance_m"] < 3000})
    else:
        slots = sorted(int(x) for x in args.tiles.split(","))
    static, _ = load_static(terr_path, tile_slots=slots)
    col_sel = np.concatenate([np.arange(s * 2401, (s + 1) * 2401) for s in slots])
    n_sub = len(col_sel)
    print(f"tiles: {len(slots)} slots {slots} -> {n_sub} columns")

    nf = np.load(os.path.join(args.data, "node_forcing_winter.npz"))
    forcing, glcs, sun = nf["forcing"], nf["glcs"], nf["sun_enu"]
    for name, a in (("forcing", forcing), ("glcs", glcs), ("sun", sun)):
        if not np.isfinite(a).all():
            raise ValueError(f"non-finite {name}; rebuild node forcing pack "
                             "(gap fill lives in build_terrain.py)")
    time_s = nf["time_s"]
    n_hours = min(args.days * 24, forcing.shape[0])
    times = time_s.astype("datetime64[s]")

    theta = Theta()
    static_dev = Static(*[jnp.asarray(a) for a in static])
    state = jax.tree.map(jnp.asarray, init_state(static, n_tiles))
    run_chunk = make_chunk_runner(static_dev, theta)

    st_pos = station_positions(stations, col_sel)
    st_rows = []
    present_slots = []
    audit = {"snowf": 0.0, "rain": 0.0, "melt": 0.0}
    t0 = _time.time()

    for day in range(n_hours // CHUNK_H):
        h0, h1 = day * CHUNK_H, (day + 1) * CHUNK_H
        xs = (jnp.asarray(forcing[h0:h1]), jnp.asarray(glcs[h0:h1]),
              jnp.asarray(sun[h0:h1]), jnp.arange(h0, h1, dtype=jnp.int32))
        state, (outs, diag) = run_chunk(state, xs)
        outs = {k: np.asarray(v) for k, v in outs.items()}
        hs = np.asarray(diag["hs_cm"])
        audit["snowf"] += float(np.asarray(diag["snowf"]).sum(0).mean())
        audit["rain"] += float(np.asarray(diag["rain"]).sum(0).mean())
        audit["melt"] += float(np.asarray(diag["melt"]).sum(0).mean())

        if not args.no_sidecars:
            for h in range(CHUNK_H):
                t = times[h0 + h]
                present_slots.append(sidecar.slot_of(t))
                for layer in sidecar.LAYERS:
                    body = np.zeros(n_tiles * 2401, np.uint8)
                    body[col_sel] = outs[layer][h]
                    sidecar.write_pfl(out_base, layer, t, body,
                                      n_tiles, manifest_hash)
        for h in (6,):                                  # 06 UTC daily sample
            t = times[h0 + h]
            for s, pos in st_pos:
                if pos >= 0:
                    st_rows.append({"time": str(t), "station": s["id"],
                                    "model_hs_cm": round(float(hs[h, pos]), 1),
                                    "elevation_m": s["elevation_m"],
                                    "distance_m": s["distance_m"]})
        if (day + 1) % args.snapshot_every_days == 0 or day == n_hours // CHUNK_H - 1:
            save_snapshot(os.path.join(snap_dir, f"state_d{day+1:03d}.npz"),
                          state, h1, theta)

    wall = _time.time() - t0
    swe = np.asarray((state.ice + state.liq).sum(0))
    runoff = np.asarray(state.runoff)
    subl = np.asarray(state.subl)
    balance = audit["snowf"] + audit["rain"] - swe.mean() - runoff.mean() - subl.mean()
    print(f"{n_hours} h x {n_sub} cols in {wall:.1f}s "
          f"({1e3*wall/n_hours:.1f} ms/step)")
    print(f"mass audit (domain mean, mm): precip {audit['snowf']+audit['rain']:.1f} "
          f"= SWE {swe.mean():.1f} + runoff {runoff.mean():.1f} "
          f"+ subl {subl.mean():.1f} + residual {balance:.2f}")

    if not args.no_sidecars:
        idx = sidecar.build_index(n_tiles, profile, present_slots, times[n_hours - 1])
        sidecar.write_index(out_base, idx)
        print(f"sidecars + index.json at {out_base}")

    cmp_path = os.path.join(args.data, "station_model_hs.csv")
    with open(cmp_path, "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=["time", "station", "model_hs_cm",
                                           "elevation_m", "distance_m"])
        w.writeheader()
        w.writerows(st_rows)
    print(f"station series: {cmp_path} ({len(st_rows)} rows)")


if __name__ == "__main__":
    main()
