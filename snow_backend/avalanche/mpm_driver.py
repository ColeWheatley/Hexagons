# @atlas: MPM backend driver (box leg): per-zone padded domains, PySimulation (avalanchers wheel) with per-cell slab via set_release_areas, change-skipping between cadence steps, peak-flow-thickness mosaic -> the same harmonized hazard bytes as the alpha backend. GPU-touching code is isolated in GpuZoneRunner and marked UNTESTED.
"""MPM (avalanchers) backend for the avalanche layer.

Runs ONLY on a wgpu-capable box with the avalanchers python wheel installed
(maturin build of the private fork's python_bindings). Everything GPU-side is
isolated in `GpuZoneRunner` and is **UNTESTED** until the box run; the rest
(windowing, change-skipping, byte assembly) is plain numpy and unit-tested.

Usage (box):
    python -m snow_backend.avalanche.mpm_driver --date 2026-01-15 --zones 5

Key conventions (verified against the avalanchers source; see design doc):
- avalanchers `Dem` rows run south->north (row 0 = south); our mosaic is
  north-up. DEM window and release texture are flipped with np.flipud on the
  way in, peak flow thickness flipped back on the way out.
- set_release_areas carries per-cell slab depth in meters; SimSettings
  slab_thickness stays 1.0 so load_release_areas.wgsl passes it through
  (input R channel is multiplied by slab_thickness, cutoff > 0.01).
- density stays at the frozen 200 kg/m^3. Registry density is never used.
- The frozen dry samosAT vector is read from AVALANCHE_FROZEN_PARAMS (a
  settings-patch dict as accepted by PySimulation.create). The wet vector is
  an uncalibrated Voellmy placeholder.
"""
import argparse
import json
import os
from datetime import date, datetime
from pathlib import Path

import numpy as np

from . import bytelayer, config, gate, hexpack, pfl, registry, terrain

FROZEN_PARAMS_JSON = os.environ.get(
    "AVALANCHE_FROZEN_PARAMS",
    str(Path(__file__).with_name("frozen_params_dry.json")),
)

# Uncalibrated wet-regime placeholder (Voellmy; see design doc section 5).
WET_PARAMS = dict(
    friction_model=1,  # Voellmy
    friction_coefficient=0.22,
    drag_coefficient=1200.0,
)

DOMAIN_MARGIN_M = 300.0
MAX_DOMAIN_CELLS = 1600 * 1600
FLOW_THRESHOLD_M = 0.05

# Change-skipping thresholds (zone re-simulated only if inputs moved).
SKIP_SLAB_DELTA_M = 0.05


# ---------------------------------------------------------------------------
# Tested, GPU-free logic
# ---------------------------------------------------------------------------

def zone_domain(dem_shape, zone, reach_cells):
    """Padded per-zone window: zone bbox grown by the alpha-envelope reach,
    clamped to MAX_DOMAIN_CELLS by trimming the pad (worst case: bbox only)."""
    pad = int(np.ceil(reach_cells + DOMAIN_MARGIN_M / config.CELL))
    while pad >= 0:
        r0 = max(0, zone["row0"] - pad)
        r1 = min(dem_shape[0], zone["row1"] + pad)
        c0 = max(0, zone["col0"] - pad)
        c1 = min(dem_shape[1], zone["col1"] + pad)
        if (r1 - r0) * (c1 - c0) <= MAX_DOMAIN_CELLS:
            return np.s_[r0:r1, c0:c1]
        pad = pad // 2 if pad > 8 else -1
    return np.s_[zone["row0"]:zone["row1"], zone["col0"]:zone["col1"]]


def estimate_reach_cells(zone, dem):
    """Conservative alpha=22deg reach bound for windowing."""
    drop = max(0.0, zone["z_max"] - float(np.nanmin(dem)))
    return drop / np.tan(np.radians(22.0)) / config.CELL


def zone_signature(zone_mask, slab, wet):
    """Per-zone input state used for change-skipping."""
    return dict(
        slab_mean=float(np.round(slab[zone_mask].mean(), 3)),
        wet=bool(wet[zone_mask].mean() > 0.5),
    )


def zones_to_run(zones, labels, slab, wet, prev_signatures):
    """(to_run, signatures): re-simulate a zone iff its slab moved by more
    than SKIP_SLAB_DELTA_M or its wet/dry regime flipped since its last run."""
    to_run, signatures = [], {}
    for z in zones:
        sig = zone_signature(labels == z["id"], slab, wet)
        signatures[str(z["id"])] = sig
        prev = prev_signatures.get(str(z["id"]))
        if (
            prev is None
            or abs(sig["slab_mean"] - prev["slab_mean"]) > SKIP_SLAB_DELTA_M
            or sig["wet"] != prev["wet"]
        ):
            to_run.append(z)
    return to_run, signatures


def peak_to_hazard_bytes(dem, peaks, release_mask, slab):
    """Ensemble peak-thickness rasters -> the same harmonized bytes as the
    alpha backend. Margin proxy: peak flow thickness scaled so ~2 m of flow
    saturates like a ~600 m energy margin (both are 'intensity'; the byte
    consumer never sees the difference)."""
    margins = [np.where(p > FLOW_THRESHOLD_M, p * 300.0, 0.0).astype(np.float32)
               for p in peaks]
    f_agree, margin_med = bytelayer.combine_draws(dem, margins)
    return bytelayer.hazard_bytes(dem, f_agree, margin_med, release_mask, slab)


# ---------------------------------------------------------------------------
# GPU leg — UNTESTED until the box run
# ---------------------------------------------------------------------------

class GpuZoneRunner:
    """Wraps PySimulation. Everything in here is UNTESTED off-box."""

    def __init__(self, dry_params):
        from avalanchers import _avalanchers as av  # the maturin wheel

        self.sim = av.PySimulation.new()
        self.dry_params = dry_params

    def run_zone(self, dem, slab, zone_mask, window, wet, transform, draw_scale=1.0):
        sub = dem[window]
        rel = np.where(zone_mask[window], slab[window] * draw_scale, 0.0).astype(np.float32)
        sub_s = np.flipud(sub).copy()   # avalanchers rows are south-up
        rel_s = np.flipud(rel).copy()

        r0, r1 = window[0].start, window[0].stop
        c0, c1 = window[1].start, window[1].stop
        x0, y1 = transform * (c0, r0)   # NW corner
        x1, y0 = transform * (c1, r1)   # SE corner

        params = {**self.dry_params, **(WET_PARAMS if wet else {})}
        self.sim.create({**params, "slab_thickness": 1.0, "max_steps": 3000})
        self.sim.set_dem_with_bounds(sub_s, config.CELL, x0, x1, y0, y1, 1.0)
        self.sim.set_release_areas(rel_s)
        self.sim.run()
        # pyo3 #[getter] get_peak_flow_thickness exposes `peak_flow_thickness`.
        h = np.asarray(self.sim.peak_flow_thickness)
        return np.flipud(h)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", required=True)
    ap.add_argument("--zones", type=int, default=0, help="limit for smoke tests")
    args = ap.parse_args()

    when = date.fromisoformat(args.date)
    t = terrain.prepare()
    labels, zones = gate.build()
    reg = registry.SyntheticRegistry()
    f = reg.fields_for(when, t["dem"])
    release = (labels > 0) & (f["slab"] >= config.SLAB_MIN_M)

    sig_path = config.WORK_DIR / "mpm_signatures.json"
    prev = json.loads(sig_path.read_text()) if sig_path.exists() else {}
    to_run, signatures = zones_to_run(zones, labels, f["slab"], f["wet"], prev)
    if args.zones:
        to_run = to_run[: args.zones]
    print(f"{len(to_run)}/{len(zones)} zones to run (change-skipping)")

    runner = GpuZoneRunner(json.loads(open(FROZEN_PARAMS_JSON).read()))
    slab_scales = (1.0, 0.7, 1.4)  # ensemble draws (design doc section 5)
    peaks = [np.zeros(t["dem"].shape, dtype=np.float32) for _ in slab_scales]
    for z in to_run:
        win = zone_domain(t["dem"].shape, z, estimate_reach_cells(z, t["dem"]))
        zone_mask = labels == z["id"]
        wet = signatures[str(z["id"])]["wet"]
        for d, scale in enumerate(slab_scales):
            h = runner.run_zone(t["dem"], f["slab"], zone_mask, win, wet,
                                t["transform"], draw_scale=scale)
            np.maximum(peaks[d][win], h, out=peaks[d][win])
        print(f"zone {z['id']} ({z['area_ha']:.1f} ha, {'wet' if wet else 'dry'}) done")

    byte_mosaic = peak_to_hazard_bytes(t["dem"], peaks, release, f["slab"])
    idx, valid = hexpack.build_gather_index(t["transform"], t["dem"].shape)
    packed = hexpack.pack_tiles(byte_mosaic, idx, valid)
    when_dt = datetime(when.year, when.month, when.day, config.EMIT_HOUR)
    meta = dict(date=when.isoformat(), backend="mpm", registry=f["meta"],
                zones_run=len(to_run), zones_total=len(zones))
    out = pfl.write_sidecar(when_dt, packed, meta)
    sig_path.write_text(json.dumps(signatures))
    print("wrote", out)


if __name__ == "__main__":
    main()
