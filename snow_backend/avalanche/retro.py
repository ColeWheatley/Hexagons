# @atlas: Winter-retrospective / single-step driver: per step runs dry+wet energy-line ensembles, assembles harmonized hazard bytes, packs L1 tiles, writes PFL sidecars atomically (resumable, multiprocessing over steps). The production cadence reuses compute_step unchanged.
import argparse
import json
import multiprocessing as mp
import os
import time
from datetime import date, datetime

import numpy as np

from . import (
    bulletin, bytelayer, columns, config, energyline, gate, hexpack, pfl,
    registry, terrain,
)

_CTX = {}


def _init_worker():
    """Load shared inputs once per worker process."""
    t = terrain.prepare()
    labels, _zones = gate.build()
    idx, valid = hexpack.build_gather_index(t["transform"], t["dem"].shape)
    _CTX.update(
        dem=t["dem"], labels=labels, idx=idx, valid=valid,
        registry=registry.SyntheticRegistry(),
        cols=columns.load_terrain_columns(),
        timeline=bulletin.load_timeline(),
    )


def compute_step(when, dem, labels, reg):
    """One cadence step -> (byte mosaic uint8, meta dict)."""
    f = reg.fields_for(when, dem)
    slab, wet = f["slab"], f["wet"]
    release = (labels > 0) & (slab >= config.SLAB_MIN_M)
    seeds = {"dry": release & ~wet, "wet": release & wet}
    alphas = {"dry": config.ALPHA_DRAWS_DRY, "wet": config.ALPHA_DRAWS_WET}

    n_draws = len(config.ALPHA_DRAWS_DRY)
    margins = []
    for d in range(n_draws):
        margin_d = np.zeros(dem.shape, dtype=np.float32)
        for regime in ("dry", "wet"):
            if not seeds[regime].any():
                continue
            E0 = energyline.seed_energy(dem, slab, seeds[regime])
            E = energyline.sweep_fixpoint(dem, E0, alphas[regime][d])
            np.maximum(margin_d, energyline.runout_margin(dem, E), out=margin_d)
        margins.append(margin_d)

    f_agree, margin_med = bytelayer.combine_draws(dem, margins)
    byte_mosaic = bytelayer.hazard_bytes(dem, f_agree, margin_med, release, slab)
    meta = dict(
        date=when.isoformat(),
        backend="alpha",
        contract="hazard-byte-harmonized-v2",
        semantics="susceptibility",
        regimes=dict(
            dry=dict(alphas_deg=list(config.ALPHA_DRAWS_DRY), seeds=int(seeds["dry"].sum())),
            wet=dict(alphas_deg=list(config.ALPHA_DRAWS_WET), seeds=int(seeds["wet"].sum()),
                     calibration="uncalibrated placeholder"),
        ),
        registry=f["meta"],
        release_cells=int(release.sum()),
        reached_cells=int((f_agree > 0).sum()),
        # Slab depth rides here (popup path), not in the display byte.
        slab_release_p10_p50_p90_m=[
            round(float(v), 3)
            for v in np.percentile(slab[release], [10, 50, 90])
        ] if release.any() else None,
    )
    return byte_mosaic, meta


def run_step(when):
    when_dt = datetime(when.year, when.month, when.day, config.EMIT_HOUR)
    out_path = pfl.sidecar_path(when_dt)
    if out_path.exists():
        return (when, "skip", 0.0)
    t0 = time.time()
    byte_mosaic, meta = compute_step(when, _CTX["dem"], _CTX["labels"], _CTX["registry"])
    packed = hexpack.pack_tiles(byte_mosaic, _CTX["idx"], _CTX["valid"])

    cols = _CTX["cols"]
    if cols is not None:
        factor, bmeta = bulletin.severity_factor(_CTX["timeline"], when, cols)
        packed = bulletin.apply_to_packed(packed, factor)
        packed = np.where(cols["valid"], packed, config.BYTE_NODATA)
        meta["bulletin_prior"] = bmeta
        meta["column_validity_masked"] = int((~cols["valid"]).sum())
    else:
        meta["bulletin_prior"] = dict(applied=False, reason="no terrain columns pack")

    meta["tiles"] = int(packed.shape[0])
    meta["nodata_hexes"] = int((packed == config.BYTE_NODATA).sum())
    meta["release_hexes"] = int((packed >= config.BYTE_RELEASE_FLAG).sum())
    pfl.write_sidecar(when_dt, packed, meta)
    return (when, "ok", time.time() - t0)


def main():
    ap = argparse.ArgumentParser(description="Avalanche layer winter retrospective")
    ap.add_argument("--workers", type=int, default=max(1, (os.cpu_count() or 4) // 2))
    ap.add_argument("--only", help="single date YYYY-MM-DD (debug)")
    args = ap.parse_args()

    dates = [date.fromisoformat(args.only)] if args.only else registry.retro_dates()
    print(f"retro: {len(dates)} steps, {args.workers} workers, "
          f"out {config.OUT_DIR / 'avalanche'}", flush=True)

    if args.workers == 1 or len(dates) == 1:
        _init_worker()
        results = map(run_step, dates)
        for when, status, dt in results:
            print(f"  {when} {status} {dt:.1f}s", flush=True)
    else:
        with mp.get_context("spawn").Pool(args.workers, initializer=_init_worker) as pool:
            done = 0
            for when, status, dt in pool.imap_unordered(run_step, dates):
                done += 1
                print(f"  [{done}/{len(dates)}] {when} {status} {dt:.1f}s", flush=True)

    steps = sorted(str(p.relative_to(config.OUT_DIR))
                   for p in (config.OUT_DIR / "avalanche").rglob("*.pfl"))
    summary = dict(
        layer="avalanche",
        contract="hazard-byte-harmonized-v2",
        backend="alpha",
        emit_hour=config.EMIT_HOUR,
        fields=dict(
            release=dict(shift=7, bits=1, aggregate="or"),
            severity=dict(shift=0, bits=7, aggregate="max",
                          domain=[1, 127],
                          notes="0 only inside NODATA byte; runout >= 2; release intensity >= 1"),
        ),
        nodata=0,
        steps=steps,
    )
    (config.OUT_DIR / "avalanche" / "layer_summary.json").write_text(
        json.dumps(summary, indent=1)
    )
    print(f"layer_summary: {len(steps)} steps")


if __name__ == "__main__":
    main()
