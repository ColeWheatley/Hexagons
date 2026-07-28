# @atlas: Bulletin prior: scales packed hex severities by a per-day danger factor from the LWD Tirol timeline (danger 1 -> x0.5 ... 4 -> x1.25), full factor where the hex matches a bulletin problem's aspects/elevation band, half-strength elsewhere; absent timeline -> factor 1.0 everywhere, labeled in metadata. A LABELED HEURISTIC, not an official hazard product.
import json
import math

import numpy as np

from . import config

# Danger level -> severity factor (lead-specified anchor points; 5 extrapolated).
DANGER_FACTOR = {1: 0.5, 2: 0.75, 3: 1.0, 4: 1.25, 5: 1.5}

# Aspect octant centers (deg from north, cw) for CAAML aspect codes.
ASPECT_DEG = {"N": 0, "NE": 45, "E": 90, "SE": 135, "S": 180, "SW": 225, "W": 270, "NW": 315}


def load_timeline(path=None):
    """timeline.json (recon task 13) or None.

    Expected shape per day (reader is tolerant of missing pieces):
      { "YYYY-MM-DD": {
          "danger":  int | {"below": int, "above": int, "elev_split_m": int},
          "problems": [ {"aspects": ["N","NE",...],
                         "elev_min_m": int|null, "elev_max_m": int|null}, ... ] } }
    Accepts either that mapping directly or nested under a "days" key.
    """
    path = path or config.BULLETIN_TIMELINE
    if path is None or not path.exists():
        return None
    data = json.loads(path.read_text())
    return data.get("days", data)


def _danger_at(day_entry, elev):
    d = day_entry.get("danger", 3)
    if isinstance(d, dict):
        split = d.get("elev_split_m", 2000)
        below, above = d.get("below", 3), d.get("above", 3)
        return np.where(elev >= split, above, below)
    return np.full_like(elev, float(d), dtype=np.float32)


def _matches_problem(day_entry, elev, aspect_rad):
    """Bool per hex: inside any problem's aspect set and elevation band."""
    problems = day_entry.get("problems") or []
    if not problems:
        return np.zeros(elev.shape, dtype=bool)
    aspect_deg = np.degrees(aspect_rad) % 360.0
    hit = np.zeros(elev.shape, dtype=bool)
    for p in problems:
        aspects = p.get("aspects") or list(ASPECT_DEG)
        a_ok = np.zeros(elev.shape, dtype=bool)
        for a in aspects:
            c = ASPECT_DEG.get(str(a).upper())
            if c is None:
                continue
            d = np.abs((aspect_deg - c + 180.0) % 360.0 - 180.0)
            a_ok |= d <= 22.5
        lo = p.get("elev_min_m") or -math.inf
        hi = p.get("elev_max_m") or math.inf
        hit |= a_ok & (elev >= lo) & (elev <= hi)
    return hit


def severity_factor(timeline, when, cols):
    """(factor float32 (n_tiles, 2401), meta dict).

    factor = DANGER_FACTOR[danger] where the hex matches a bulletin problem
    (aspect octant within the problem's aspects, elevation in band);
    elsewhere the factor is damped halfway toward 1.0. No timeline or no
    entry for the day -> factor 1.0, applied=False.
    """
    shape = cols["elev"].shape
    if timeline is None:
        return np.ones(shape, dtype=np.float32), dict(applied=False, reason="no timeline")
    entry = timeline.get(when.isoformat())
    if entry is None:
        return np.ones(shape, dtype=np.float32), dict(applied=False, reason="no entry for day")

    danger = _danger_at(entry, cols["elev"])
    lut = np.array([1.0] + [DANGER_FACTOR.get(i, 1.0) for i in range(1, 6)], dtype=np.float32)
    base = lut[np.clip(danger.astype(np.int32), 0, 5)]
    matched = _matches_problem(entry, cols["elev"], cols["aspect_rad"])
    factor = np.where(matched, base, 1.0 + (base - 1.0) * 0.5).astype(np.float32)
    meta = dict(
        applied=True,
        mapping="danger {1:0.5, 2:0.75, 3:1.0, 4:1.25, 5:1.5}; matched hexes full factor, unmatched damped halfway to 1.0",
        matched_hexes=int(matched.sum()),
        heuristic=True,
    )
    return factor, meta


def apply_to_packed(packed, factor):
    """Scale the severity bits of packed hex bytes; release flag, NODATA and
    the simulated-none floor survive unchanged. Runout clamps to [2,127],
    release severity to [1,127]."""
    release = packed >= config.BYTE_RELEASE_FLAG
    sev = np.where(release, packed - config.BYTE_RELEASE_FLAG, packed).astype(np.float32)
    scaled = np.round(sev * factor)
    out_rel = config.BYTE_RELEASE_FLAG + np.clip(scaled, 1, 127)
    out_run = np.clip(scaled, config.RUNOUT_SEVERITY_MIN, 127)
    out = np.where(release, out_rel, out_run).astype(np.uint8)
    keep = (packed == config.BYTE_NODATA) | (packed == config.BYTE_SIMULATED_NONE)
    return np.where(keep, packed, out)
