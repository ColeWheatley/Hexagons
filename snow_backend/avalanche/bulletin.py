# @atlas: Bulletin prior against the recon timeline.json (LWD Tirol CAAML distillate): per-day danger factor from elevation-banded ratings (low x0.5 .. very_high x1.5), full factor on hexes matching a problem's aspects/elevation band, damped halfway toward 1.0 elsewhere; 12:00Z emit uses all_day+later periods; nulled service-window days and absent timeline -> identity, labeled. A LABELED HEURISTIC, not an official hazard product.
import json
import math
from datetime import datetime

import numpy as np

from . import config

# EAWS level -> severity factor (lead-specified anchors; very_high extrapolated).
LEVEL_NUM = {"low": 1, "moderate": 2, "considerable": 3, "high": 4, "very_high": 5}
DANGER_FACTOR = {1: 0.5, 2: 0.75, 3: 1.0, 4: 1.25, 5: 1.5}

# Aspect octant centers (deg from north, cw) for CAAML aspect codes.
ASPECT_DEG = {"N": 0, "NE": 45, "E": 90, "SE": 135, "S": 180, "SW": 225, "W": 270, "NW": 315}

# The layer emits at 12:00Z (~13:00 CET): "later" is the applicable half-day
# when a bulletin splits its ratings/problems by time of day.
_ACTIVE_PERIODS = {"all_day", "later", None, ""}


def load_timeline(path=None):
    """{date_iso: entry} for the primary region, or None if the file is absent.

    Multiple entries can share a date (overlapping validity windows); the one
    whose [valid_from, valid_to) contains the date's 12:00Z wins, first-seen
    otherwise. Nulled days (LWD service window) keep their null-fielded entry
    so the factor stays identity with an explicit metadata reason.
    """
    path = path or config.BULLETIN_TIMELINE
    if path is None or not path.exists():
        return None
    data = json.loads(path.read_text())
    primary = data.get("primary_region", "AT-07-22")
    out = {}
    for e in data.get("entries", []):
        date = e.get("date")
        if not date:
            continue
        regs = e.get("regions") or []
        if regs and not any(r.get("regionID") == primary for r in regs):
            continue
        cur = out.get(date)
        if cur is None or (_covers_noon(e, date) and not _covers_noon(cur, date)):
            out[date] = e
    return out


def _covers_noon(entry, date_iso):
    try:
        noon = datetime.fromisoformat(f"{date_iso}T12:00:00+00:00")
        f = datetime.fromisoformat(entry["valid_from"].replace("Z", "+00:00"))
        t = datetime.fromisoformat(entry["valid_to"].replace("Z", "+00:00"))
        return f <= noon < t
    except (KeyError, TypeError, ValueError, AttributeError):
        return False


def _elev(v, default):
    try:
        return float(v)
    except (TypeError, ValueError):
        return default


def _danger_levels(entry, elev):
    """Per-hex danger level from the elevation-banded ratings (worst applicable
    rating among the active time periods); 0 where no rating applies."""
    levels = np.zeros(elev.shape, dtype=np.int8)
    for r in entry.get("danger_ratings") or []:
        if r.get("valid_time_period") not in _ACTIVE_PERIODS:
            continue
        num = LEVEL_NUM.get(str(r.get("level")).lower())
        if num is None:
            continue
        lo = _elev(r.get("elevation_lower"), -math.inf)
        hi = _elev(r.get("elevation_upper"), math.inf)
        band = (elev >= lo) & (elev < hi)
        levels = np.where(band, np.maximum(levels, np.int8(num)), levels)
    return levels


def _matches_problem(entry, elev, aspect_rad):
    """Bool per hex: inside any active problem's aspect set and elevation band."""
    problems = entry.get("problems") or []
    hit = np.zeros(elev.shape, dtype=bool)
    aspect_deg = np.degrees(aspect_rad) % 360.0
    for p in problems:
        if p.get("time_of_day") not in _ACTIVE_PERIODS:
            continue
        aspects = p.get("aspects") or list(ASPECT_DEG)
        a_ok = np.zeros(elev.shape, dtype=bool)
        for a in aspects:
            c = ASPECT_DEG.get(str(a).upper())
            if c is None:
                continue
            d = np.abs((aspect_deg - c + 180.0) % 360.0 - 180.0)
            a_ok |= d <= 22.5
        lo = _elev(p.get("elevation_min"), -math.inf)
        hi = _elev(p.get("elevation_max"), math.inf)
        hit |= a_ok & (elev >= lo) & (elev <= hi)
    return hit


def severity_factor(timeline, when, cols):
    """(factor float32 (n_tiles, 2401), meta dict).

    factor = DANGER_FACTOR[level(elevation)] on hexes matching a bulletin
    problem (aspect octant + elevation band, active time period); elsewhere
    damped halfway toward 1.0. Identity (applied=False) when the timeline,
    the day's entry, or the day's ratings are absent (the 28 nulled LWD
    service-window days emit reason "day nulled in timeline").
    """
    shape = cols["elev"].shape
    ident = np.ones(shape, dtype=np.float32)
    if timeline is None:
        return ident, dict(applied=False, reason="no timeline")
    entry = timeline.get(when.isoformat())
    if entry is None:
        return ident, dict(applied=False, reason="no entry for day")
    if not entry.get("danger_ratings"):
        return ident, dict(applied=False, reason="day nulled in timeline")

    levels = _danger_levels(entry, cols["elev"])
    lut = np.array([1.0] + [DANGER_FACTOR[i] for i in range(1, 6)], dtype=np.float32)
    base = lut[np.clip(levels, 0, 5)]
    matched = _matches_problem(entry, cols["elev"], cols["aspect_rad"])
    factor = np.where(matched, base, 1.0 + (base - 1.0) * 0.5).astype(np.float32)
    meta = dict(
        applied=True,
        mapping="danger {1:0.5, 2:0.75, 3:1.0, 4:1.25, 5:1.5} by elevation band; matched hexes full factor, unmatched damped halfway to 1.0; 12:00Z uses all_day+later periods",
        levels_present=sorted(int(v) for v in np.unique(levels) if v > 0),
        matched_hexes=int(matched.sum()),
        problem_types=[p.get("type") for p in entry.get("problems") or []],
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
