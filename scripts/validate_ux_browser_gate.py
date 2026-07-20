#!/usr/bin/env python3
"""Fixture-testable policy for the AA-20 UX and axe browser report."""
import argparse
import json
import math
import re
import sys
from pathlib import Path
from urllib.parse import parse_qs, urlsplit


EXPECTED_CONTROL_ACTIONS = {
    "minimize-btn", "disclosure:debug-content", "disclosure:geometry-content",
    "copy-view-link", "haze-distance-slider", "tex-upgrade-slider",
    "gradient-slope", "gradient-terrain", "lod-pause-toggle", "copy-log-btn",
    "hex-search-input", "fatal-retry-btn",
}
HUD_REQUIRED_VALUES = {
    "fps-counter", "hex-count", "tri-count", "draw-stats", "sector-val", "hex-val",
    "tile-height", "camera-height", "near-lod-bands", "far-lod-bands",
    "moving-lod-summary", "settled-lod-summary", "distance-scale-label",
}
PLACEHOLDER_RE = re.compile(r"--|—|Waiting for system|Initializing|N/A", re.I)


def real_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def reduced_duration_seconds(value):
    if not isinstance(value, str) or not value.endswith("s"):
        return None
    try:
        parsed = float(value[:-1])
    except ValueError:
        return None
    return parsed if math.isfinite(parsed) else None


def hud_values_valid(values):
    if not isinstance(values, dict) or not HUD_REQUIRED_VALUES.issubset(values):
        return False
    if any(not isinstance(values[key], str) or not values[key].strip()
           or PLACEHOLDER_RE.search(values[key]) for key in HUD_REQUIRED_VALUES):
        return False
    checks = {
        "fps-counter": re.compile(r"^FPS:\s*IDLE\s*\|\s*Zoom:\s*\d+", re.I),
        "tri-count": re.compile(r"^[\d,.]+(?:[KMB])?$", re.I),
        "draw-stats": re.compile(r"^Calls:\s*[\d,.]+(?:[KMB])?\s*\|\s*G:[\d,.]+(?:[KMB])?\s*\|\s*T:[\d,.]+(?:[KMB])?$", re.I),
        "sector-val": re.compile(r"^-?\d+\s*,\s*-?\d+$"),
        "hex-val": re.compile(r"^-?\d+\s*,\s*-?\d+$"),
        "tile-height": re.compile(r"^-?[\d,.]+m$", re.I),
        "camera-height": re.compile(r"^-?[\d,.]+m$", re.I),
        "near-lod-bands": re.compile(r"^[\d.]+(?:\s*/\s*[\d.]+)+\s*km$", re.I),
        "far-lod-bands": re.compile(r"^[\d.]+(?:\s*/\s*[\d.]+)+\s*km$", re.I),
        "moving-lod-summary": re.compile(r"^moving:\s+", re.I),
        "settled-lod-summary": re.compile(r"^settled:\s+", re.I),
        "distance-scale-label": re.compile(r"^[\d.]+\s*(?:m|km)$", re.I),
    }
    if not all(pattern.search(values[key].strip()) for key, pattern in checks.items()):
        return False
    return "TOPS" in values["hex-count"] and "SKIRTS" in values["hex-count"]


def evaluate(report):
    search = report.get("search") or {}
    controls = report.get("controls") or {}
    hud = report.get("hud") or {}
    navigation = report.get("navigation") or {}
    persistence = report.get("persistence") or {}
    reload = report.get("reload") or {}
    reduced = report.get("reducedMotion") or {}
    axe = report.get("axe") or {}
    actions = controls.get("actions") if isinstance(controls.get("actions"), list) else []
    action_names = {row.get("name") for row in actions if isinstance(row, dict)}
    action_rows_valid = all(isinstance(row, dict) and row.get("passed") is True for row in actions)
    selection_ms = search.get("selectionMs")
    local = persistence.get("localRestore") or {}
    shared = persistence.get("sharedUrlOverride") or {}
    local_query = parse_qs(urlsplit(local.get("url") or "").query)
    shared_query = parse_qs(urlsplit(shared.get("url") or "").query)
    local_delta, shared_delta = local.get("maxPoseDelta"), shared.get("maxPoseDelta")
    duration = reduced_duration_seconds(reduced.get("duration"))
    fps_samples = hud.get("fpsSamples")
    fps_samples_valid = isinstance(fps_samples, list) and len(fps_samples) >= 20 \
        and all(isinstance(text, str) and re.search(r"FPS:\s*IDLE", text, re.I)
                and not re.search(r"FPS:\s*(?:2|3|4)(?:\.\d+)?(?:\D|$)", text)
                for text in fps_samples)
    rows = [
        ("search task", isinstance(search.get("results"), int) and not isinstance(search.get("results"), bool)
            and search["results"] >= 1 and real_number(search.get("maxLongTaskMs"))
            and 0 <= search["maxLongTaskMs"] <= 50),
        ("keyboard search selection", search.get("tabFocused") is True
            and search.get("typedByKeyboard") is True
            and search.get("oneFrameResponse") is True
            and search.get("keyboardSelected") is True
            and search.get("selectedName") == "Habicht"
            and search.get("cameraMoved") is True
            and search.get("urlUpdated") is True
            and isinstance(search.get("statusAfter"), str) and "selected" in search["statusAfter"].lower()
            and real_number(selection_ms) and 0 <= selection_ms <= 500),
        ("truthful controls", action_names == EXPECTED_CONTROL_ACTIONS
            and action_rows_valid
            and len(actions) == len(EXPECTED_CONTROL_ACTIONS)
            and len(action_names) == len(actions)
            and controls.get("uncovered") == []),
        ("truthful HUD", hud.get("settled") is True and hud.get("engineState") == "STATIC"
            and fps_samples_valid and hud_values_valid(hud.get("values"))
            and hud.get("placeholders") == []),
        ("keyboard navigation", navigation.get("moved") is True and navigation.get("urlUpdated") is True and navigation.get("inputIsolated") is True),
        ("view persistence", persistence.get("stored") is True
            and local.get("ready") is True and local.get("stored") is True
            and real_number(local_delta) and 0 <= local_delta <= 0.1
            and not {"view", "at", "eye"}.intersection(local_query)
            and shared.get("ready") is True
            and real_number(shared_delta) and 0 <= shared_delta <= 0.1
            and shared.get("url") == persistence.get("sharedExplicitUrl")
            and persistence.get("conflictingStoredUrl") != persistence.get("sharedExplicitUrl")
            and shared_query.get("view") == ["1"] and "at" in shared_query and "eye" in shared_query
            and reload.get("stored") is True),
        ("reduced motion", reduced.get("matches") is True
            and duration is not None and 0 <= duration <= 0.001
            and reduced.get("iterationCount") == "1"),
        ("axe serious/critical", isinstance(axe.get("seriousCritical"), list) and not axe["seriousCritical"]),
    ]
    return [{"name": name, "passed": passed} for name, passed in rows]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("report", type=Path)
    args = parser.parse_args()
    report = json.loads(args.report.read_text())
    checks = evaluate(report)
    report["checks"] = checks
    report["passed"] = all(row["passed"] for row in checks)
    args.report.write_text(json.dumps(report, indent=2) + "\n")
    for row in checks:
        print(f"{'PASS' if row['passed'] else 'FAIL'} {row['name']}", file=sys.stdout if row["passed"] else sys.stderr)
    return 0 if report["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
