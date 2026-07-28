# @atlas: Hazard byte assembly under the harmonized contract: NODATA 0 / simulated-none 1 / runout severity 2..127 (log-scaled ensemble-agreement x margin) / bit7 release flag with slab-derived intensity 1..127 (raw 128 never emitted); backend-independent so the MPM path emits identical bytes.
import warnings

import numpy as np

from . import config


def combine_draws(dem, margins):
    """margins: list of per-draw runout-margin arrays (0 where unreached).

    Returns (f_agree float32 in {0, 1/n .. 1}, margin_med float32 = median
    margin over the draws that reached the cell, 0 where none did)."""
    stack = np.stack(margins)
    reached = stack > 0
    f_agree = reached.mean(axis=0, dtype=np.float32)
    any_reached = reached.any(axis=0)
    masked = np.where(reached, stack, np.nan)
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", RuntimeWarning)  # all-NaN slices expected
        med_reached = np.nanmedian(masked, axis=0)
    margin_med = np.where(any_reached, np.nan_to_num(med_reached), 0.0).astype(np.float32)
    return f_agree, margin_med


def runout_severity(f_agree, margin_med):
    """Severity 2..127 for reached cells, 0 elsewhere (uint8).

    Log-scaled in the energy margin (linear scaling saturates the mid-path:
    measured p50 = 127 at a 50 m linear cap on real terrain). Clamped to >= 2
    so a reached cell never aliases BYTE_SIMULATED_NONE."""
    g = np.clip(
        np.log1p(margin_med) / np.log1p(config.GRADE_FULL_MARGIN_M), 0.0, 1.0
    )
    s = np.round(127.0 * f_agree * g).astype(np.int16)
    return np.where(
        f_agree > 0, np.clip(s, config.RUNOUT_SEVERITY_MIN, 127), 0
    ).astype(np.uint8)


def release_byte(slab, runout_sev=None):
    """128 + release severity 1..127 (uint8).

    Release severity = max(runout severity computed at the cell, loading
    grade), loading grade = round(127 * clamp(slab / 1.5 m, 0, 1)). This is a
    loading-scaled *severity*, not a decodable slab depth (slab itself rides
    in the metadata/popup path). Raw 128 is never produced: severity is
    clamped to >= 1."""
    load = np.round(
        127.0 * np.clip(np.nan_to_num(slab) / config.RELEASE_SLAB_FULL_M, 0.0, 1.0)
    ).astype(np.int16)
    if runout_sev is not None:
        load = np.maximum(load, runout_sev.astype(np.int16))
    return (config.BYTE_RELEASE_FLAG + np.clip(load, 1, 127)).astype(np.uint8)


def hazard_bytes(dem, f_agree, margin_med, release_mask, slab):
    """Assemble the harmonized hazard byte mosaic (uint8).

    Precedence: NODATA (NaN dem) < simulated-none < runout < release."""
    out = np.where(
        np.isnan(dem), config.BYTE_NODATA, config.BYTE_SIMULATED_NONE
    ).astype(np.uint8)
    runout = runout_severity(f_agree, margin_med)
    out = np.where(runout > 0, runout, out)
    rel = release_byte(slab, runout_sev=runout)
    return np.where(release_mask, rel, out)
