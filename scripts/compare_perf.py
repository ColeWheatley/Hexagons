#!/usr/bin/env python3
"""
compare_perf.py — side-by-side comparison of two Hexagons PerfProfiler reports.

Usage:
    python3 scripts/compare_perf.py baseline.json candidate.json

Stdlib-only. Designed to read the JSON produced by frontend/app/perf_profiler.js's
getReport()/finalize() (see PROFILING.md for the schema and how to capture reports).

Handles `meta.crashed: true` gracefully — a crashed baseline vs. a clean candidate
(or vice versa) is itself treated as the headline result rather than a formatting error.
"""

import json
import sys
from pathlib import Path


# ─── Small formatting helpers ───────────────────────────────────────────

def fmt_bytes(n):
    if n is None:
        return "N/A"
    n = float(n)
    for unit, div in (("GB", 1024**3), ("MB", 1024**2), ("KB", 1024)):
        if abs(n) >= div:
            return f"{n / div:.2f} {unit}"
    return f"{n:.0f} B"


def fmt_ms(n):
    return "N/A" if n is None else f"{n:.1f} ms"


def fmt_pct(n):
    return "N/A" if n is None else f"{n * 100:.1f}%"


def fmt_num(n):
    if n is None:
        return "N/A"
    if isinstance(n, float):
        return f"{n:.1f}"
    return str(n)


def fmt_bool(n):
    return "N/A" if n is None else ("yes" if n else "no")


def get(d, path, default=None):
    """Dotted-path getter, e.g. get(report, 'frames.p95_ms')."""
    cur = d
    for part in path.split("."):
        if not isinstance(cur, dict) or part not in cur:
            return default
        cur = cur[part]
    return default if cur is None else cur


# ─── Table rendering ─────────────────────────────────────────────────────

class Row:
    __slots__ = ("label", "path", "fmt", "lower_is_better")

    def __init__(self, label, path, fmt=fmt_num, lower_is_better=None):
        self.label = label
        self.path = path
        self.fmt = fmt
        self.lower_is_better = lower_is_better


def print_section(title, rows, base, cand):
    print(f"\n── {title} " + "─" * max(1, 60 - len(title)))

    computed = []
    for r in rows:
        a = get(base, r.path)
        b = get(cand, r.path)
        a_s, b_s = r.fmt(a), r.fmt(b)
        if a is not None and b is not None:
            diff = b - a
            sign = "+" if diff >= 0 else "-"
            d_s = f"{sign}{r.fmt(abs(diff))}"
        else:
            d_s = "N/A"
        tag = ""
        if r.lower_is_better is not None and a is not None and b is not None and a != b:
            improved = (b < a) if r.lower_is_better else (b > a)
            tag = "better" if improved else "worse"
        computed.append((r.label, a_s, b_s, d_s, tag))

    GUT = "  "
    label_w = max(len(c[0]) for c in computed + [("", "", "", "", "")])
    base_w = max([len("baseline")] + [len(c[1]) for c in computed])
    cand_w = max([len("candidate")] + [len(c[2]) for c in computed])
    delta_w = max([len("delta")] + [len(c[3]) for c in computed])

    header = (f"{'':<{label_w}}{GUT}{'baseline':>{base_w}}{GUT}"
              f"{'candidate':>{cand_w}}{GUT}{'delta':>{delta_w}}")
    print(header)
    print("-" * len(header))
    for label, a_s, b_s, d_s, tag in computed:
        line = (f"{label:<{label_w}}{GUT}{a_s:>{base_w}}{GUT}"
                f"{b_s:>{cand_w}}{GUT}{d_s:>{delta_w}}")
        if tag:
            line += f"  ({tag})"
        print(line)


# ─── Verdicts ────────────────────────────────────────────────────────────

def verdict_frames(base, cand):
    bc, cc = get(base, "meta.crashed", False), get(cand, "meta.crashed", False)
    b_fps, c_fps = get(base, "frames.fps_avg_active"), get(cand, "frames.fps_avg_active")
    b_p95, c_p95 = get(base, "frames.p95_ms"), get(cand, "frames.p95_ms")
    b_o100, c_o100 = get(base, "frames.over100", 0), get(cand, "frames.over100", 0)

    if bc and not cc:
        return "Baseline run crashed before finishing; candidate completed cleanly — that alone is the headline win."
    if cc and not bc:
        return "Candidate run crashed before finishing while baseline completed — regression, investigate before shipping."
    if b_fps is None or c_fps is None:
        return "Not enough frame data in one or both reports to compare."

    parts = []
    if c_fps > b_fps * 1.02:
        parts.append(f"candidate is faster ({c_fps:.1f} vs {b_fps:.1f} fps active-avg)")
    elif c_fps < b_fps * 0.98:
        parts.append(f"candidate is slower ({c_fps:.1f} vs {b_fps:.1f} fps active-avg)")
    else:
        parts.append(f"fps roughly unchanged (~{c_fps:.1f} fps)")

    if b_o100 or c_o100:
        if c_o100 < b_o100:
            parts.append(f"big stutters (>100ms) down {b_o100}→{c_o100}")
        elif c_o100 > b_o100:
            parts.append(f"big stutters (>100ms) up {b_o100}→{c_o100}")
    if b_p95 is not None and c_p95 is not None:
        parts.append(f"p95 {b_p95:.0f}→{c_p95:.0f}ms")
    return "Frame timing: " + "; ".join(parts) + "."


def verdict_memory(base, cand):
    b_peak, c_peak = get(base, "memory.jsHeapPeakBytes"), get(cand, "memory.jsHeapPeakBytes")
    b_cl, c_cl = get(base, "memory.contextLostCount", 0), get(cand, "memory.contextLostCount", 0)
    b_oom, c_oom = get(base, "memory.glOutOfMemoryCount", 0), get(cand, "memory.glOutOfMemoryCount", 0)

    if b_cl or b_oom or c_cl or c_oom:
        oom_msg = (f"baseline: {b_cl} context-loss / {b_oom} gl-OOM events; "
                   f"candidate: {c_cl} context-loss / {c_oom} gl-OOM events.")
        if (b_cl or b_oom) and not (c_cl or c_oom):
            return "OOM eliminated: " + oom_msg
        if not (b_cl or b_oom) and (c_cl or c_oom):
            return "OOM regression introduced: " + oom_msg
        return "OOM signals present in both runs: " + oom_msg

    if b_peak is None or c_peak is None:
        return "No performance.memory data available in one or both reports (non-Chrome browser?)."
    diff_pct = ((c_peak - b_peak) / b_peak * 100) if b_peak else 0
    direction = "lower" if c_peak < b_peak else "higher"
    return (f"No OOM signals in either run. Peak JS heap {direction} in candidate: "
            f"{fmt_bytes(b_peak)} → {fmt_bytes(c_peak)} ({diff_pct:+.0f}%).")


def verdict_vram(base, cand):
    b_peak, c_peak = get(base, "vram.peakLedgerBytes"), get(cand, "vram.peakLedgerBytes")
    b_util, c_util = get(base, "vram.peakUtilization"), get(cand, "vram.peakUtilization")
    if b_peak is None or c_peak is None:
        return "No VRAM ledger data available in one or both reports."
    diff_pct = ((c_peak - b_peak) / b_peak * 100) if b_peak else 0
    msg = f"Peak VRAM ledger {fmt_bytes(b_peak)} → {fmt_bytes(c_peak)} ({diff_pct:+.0f}%)"
    if b_util is not None and c_util is not None:
        msg += f", peak budget utilization {fmt_pct(b_util)} → {fmt_pct(c_util)}"
    return msg + "."


def verdict_cache(base, cand):
    b_ev, c_ev = get(base, "cache.evictions"), get(cand, "cache.evictions")
    b_re, c_re = get(base, "cache.redownloads"), get(cand, "cache.redownloads")
    if b_ev is None or c_ev is None:
        return "No cache manager data available in one or both reports."
    msg = f"Evictions {b_ev} → {c_ev}"
    if b_re is not None and c_re is not None:
        msg += f", redownloads (thrash indicator) {b_re} → {c_re}"
    return msg + "."


def verdict_textures(base, cand):
    b_pipe, c_pipe = get(base, "meta.texturePipeline", "?"), get(cand, "meta.texturePipeline", "?")
    b_up, c_up = get(base, "textures.upgrades"), get(cand, "textures.upgrades")
    b_ts, c_ts = get(base, "textures.texStats"), get(cand, "textures.texStats")
    msg = f"Pipeline: baseline={b_pipe}, candidate={c_pipe}."
    if b_up is not None or c_up is not None:
        msg += f" Texture upgrades: {fmt_num(b_up)} → {fmt_num(c_up)}."
    if c_ts and not b_ts:
        msg += " Candidate exposes texStats (KTX2 transcode telemetry) that baseline lacks."
    return msg


# ─── Main ────────────────────────────────────────────────────────────────

def load(path):
    p = Path(path)
    if not p.exists():
        print(f"error: file not found: {path}", file=sys.stderr)
        sys.exit(1)
    try:
        return json.loads(p.read_text())
    except json.JSONDecodeError as e:
        print(f"error: {path} is not valid JSON: {e}", file=sys.stderr)
        sys.exit(1)


def print_meta_banner(base, cand, base_path, cand_path):
    print("=" * 78)
    print("HEXAGONS PERF COMPARISON")
    print("=" * 78)
    print(f"  baseline : {base_path}")
    print(f"             scenario={get(base, 'meta.scenario')}  pipeline={get(base, 'meta.texturePipeline')}  "
          f"duration={fmt_num(get(base, 'meta.duration_s'))}s  crashed={fmt_bool(get(base, 'meta.crashed', False))}")
    print(f"  candidate: {cand_path}")
    print(f"             scenario={get(cand, 'meta.scenario')}  pipeline={get(cand, 'meta.texturePipeline')}  "
          f"duration={fmt_num(get(cand, 'meta.duration_s'))}s  crashed={fmt_bool(get(cand, 'meta.crashed', False))}")

    if get(base, "meta.scenario") != get(cand, "meta.scenario"):
        print("\n  WARNING: comparing two different scenarios — numbers below are not apples-to-apples.")
    if get(base, "meta.crashed", False) or get(cand, "meta.crashed", False):
        print("\n  ** One or both runs are marked crashed (unfinalized/partial). See frame verdict below. **")


def main():
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1 if len(sys.argv) != 1 else 0)

    base_path, cand_path = sys.argv[1], sys.argv[2]
    base = load(base_path)
    cand = load(cand_path)

    print_meta_banner(base, cand, base_path, cand_path)

    print_section("Frame timing (active frames only)", [
        Row("Total frames (rAF ticks)", "frames.total"),
        Row("Rendered frames", "frames.rendered"),
        Row("Skipped (idle) frames", "frames.skipped"),
        Row("Active-time avg FPS", "frames.fps_avg_active", lower_is_better=False),
        Row("p50 frametime", "frames.p50_ms", fmt_ms, lower_is_better=True),
        Row("p95 frametime", "frames.p95_ms", fmt_ms, lower_is_better=True),
        Row("p99 frametime", "frames.p99_ms", fmt_ms, lower_is_better=True),
        Row("Worst frame", "frames.worst_ms", fmt_ms, lower_is_better=True),
        Row("Frames > 20ms", "frames.over20", lower_is_better=True),
        Row("Frames > 33ms", "frames.over33", lower_is_better=True),
        Row("Frames > 100ms", "frames.over100", lower_is_better=True),
    ], base, cand)
    print(f"  => {verdict_frames(base, cand)}")

    for state in ("MOVING_2D", "MOVING_3D", "SINTERING", "STATIC"):
        if get(base, f"frames.perState.{state}") or get(cand, f"frames.perState.{state}"):
            print_section(f"Per-state: {state}", [
                Row("Count", f"frames.perState.{state}.count"),
                Row("Avg FPS", f"frames.perState.{state}.fps_avg", lower_is_better=False),
                Row("p95 frametime", f"frames.perState.{state}.p95_ms", fmt_ms, lower_is_better=True),
                Row("Worst frame", f"frames.perState.{state}.worst_ms", fmt_ms, lower_is_better=True),
            ], base, cand)

    print_section("Memory / OOM", [
        Row("Peak JS heap", "memory.jsHeapPeakBytes", fmt_bytes, lower_is_better=True),
        Row("End JS heap", "memory.jsHeapEndBytes", fmt_bytes, lower_is_better=True),
        Row("WebGL context-lost events", "memory.contextLostCount", lower_is_better=True),
        Row("gl.OUT_OF_MEMORY events", "memory.glOutOfMemoryCount", lower_is_better=True),
    ], base, cand)
    print(f"  => {verdict_memory(base, cand)}")

    print_section("VRAM ledger", [
        Row("Peak ledger total", "vram.peakLedgerBytes", fmt_bytes, lower_is_better=True),
        Row("End ledger total", "vram.endLedgerBytes", fmt_bytes, lower_is_better=True),
        Row("Budget", "vram.budgetBytes", fmt_bytes),
        Row("Peak budget utilization", "vram.peakUtilization", fmt_pct, lower_is_better=True),
    ], base, cand)
    print(f"  => {verdict_vram(base, cand)}")

    print_section("Cache manager", [
        Row("Evictions", "cache.evictions", lower_is_better=True),
        Row("Evicted bytes", "cache.evictedBytes", fmt_bytes, lower_is_better=True),
        Row("Redownloads (thrash)", "cache.redownloads", lower_is_better=True),
    ], base, cand)
    print(f"  => {verdict_cache(base, cand)}")

    print_section("Textures", [
        Row("Upgrades (low→full res)", "textures.upgrades"),
    ], base, cand)
    print(f"  => {verdict_textures(base, cand)}")

    print("\n" + "=" * 78)


if __name__ == "__main__":
    main()
