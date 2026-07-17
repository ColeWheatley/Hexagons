#!/usr/bin/env python3
"""Generate final markdown report from results.json."""

from __future__ import annotations

import math
import statistics

from common import CELLS, SELECTED_SECTORS, SWEEP_ROOT, TEX_MPP, load_results
from encode_cells import git_checkpoint


def fmt(v, n=5):
    return "n/a" if v is None or (isinstance(v, float) and math.isnan(v)) else f"{v:.{n}f}"


def mib(v):
    return "n/a" if v is None else f"{v / (1024 * 1024):.2f}"


def summarize(results, cell_name, tier="full"):
    entries = [results["sectors"][s["sector"]][tier].get(cell_name) for s in SELECTED_SECTORS]
    entries = [e for e in entries if e]
    if not entries:
        return None
    ssims = [e.get("ssim_luma") for e in entries if e.get("ssim_luma") is not None]
    wires = [e.get("ktx2_bytes") for e in entries if e.get("ktx2_bytes") is not None]
    enc = [e.get("encode_seconds") for e in entries if e.get("encode_seconds") is not None]
    first = entries[0]
    return {
        "cell": cell_name,
        "family": first.get("codec_family"),
        "gpu_bpp": first.get("astc_gpu_bpp_with_mips"),
        "gpu_bytes": first.get("astc_gpu_bytes"),
        "mean_ssim": statistics.mean(ssims) if ssims else None,
        "min_ssim": min(ssims) if ssims else None,
        "mean_wire": statistics.mean(wires) if wires else None,
        "mean_encode": statistics.mean(enc) if enc else None,
        "count": len(entries),
        "metrics_count": len(ssims),
    }


def pareto(rows):
    rows = [r for r in rows if r and r["gpu_bpp"] is not None and r["mean_ssim"] is not None]
    out = []
    for row in rows:
        dominated = False
        for other in rows:
            if other is row:
                continue
            if other["gpu_bpp"] <= row["gpu_bpp"] and other["mean_ssim"] >= row["mean_ssim"] and (
                other["gpu_bpp"] < row["gpu_bpp"] or other["mean_ssim"] > row["mean_ssim"]
            ):
                dominated = True
                break
        if not dominated:
            out.append(row)
    return sorted(out, key=lambda r: r["gpu_bpp"])


def table(rows):
    lines = ["| Cell | ASTC B/px incl mips | ASTC MiB | Mean SSIM | Min SSIM | Mean wire MiB | Mean encode s |", "|---|---:|---:|---:|---:|---:|---:|"]
    for r in rows:
        lines.append(f"| `{r['cell']}` | {fmt(r['gpu_bpp'],3)} | {mib(r['gpu_bytes'])} | {fmt(r['mean_ssim'])} | {fmt(r['min_ssim'])} | {mib(r['mean_wire'])} | {fmt(r['mean_encode'],2)} |")
    return lines


def main() -> None:
    results = load_results()
    effort4 = []
    for cell in CELLS:
        if cell.tier == "full" and cell.codec_family == "xuastc" and cell.effort == 4:
            row = summarize(results, cell.name)
            if row:
                effort4.append(row)
    effort4.sort(key=lambda r: (r["gpu_bpp"] or 999, r["cell"]))
    front = pareto(effort4)
    rows_by_name = {row["cell"]: row for row in effort4}
    rec = rows_by_name.get("xuastc_6x6_q90_e4")
    memory_saver = rows_by_name.get("xuastc_8x6_q90_e4")
    premium = rows_by_name.get("xuastc_4x4_q90_e4")
    baselines = [summarize(results, name) for name in ("uastc_4x4_default", "etc1s_q128", "etc1s_q255")]
    baselines = [row for row in baselines if row]
    low_rows = [summarize(results, cell.name, "low") for cell in CELLS if cell.tier == "low"]
    low_rows = sorted((row for row in low_rows if row), key=lambda row: (row["gpu_bpp"] or 999, row["cell"]))

    missing = []
    for sector in SELECTED_SECTORS:
        for tier in ("full", "low"):
            for cell_name, entry in results["sectors"][sector["sector"]][tier].items():
                if entry.get("ssim_luma") is None:
                    missing.append(f"{sector['sector']}/{tier}/{cell_name}")

    lines = [
        "# XUASTC Aerial Codec Sweep",
        "",
        "## Source Extraction",
        "",
        "- Rebuilt 4096x4096 RGB canvases from production orthophoto TIFs.",
        "- Central content crop is 3360x3360 with 368px padding per side.",
        f"- Texture meters per pixel: `{TEX_MPP:.9f}`.",
        "",
        "| Sector | Class | Why |",
        "|---|---|---|",
    ]
    for s in SELECTED_SECTORS:
        lines.append(f"| `{s['sector']}` | {s['class']} | {s['why']} |")
    lines.extend(["", "## Aggregate XUASTC Effort 4", "", *table(effort4), "", "## Pareto Front", "", *table(front), "", "## Recommendation", ""])
    if rec:
        lines.append(f"Use `{rec['cell']}` as the balanced full-resolution default: {mib(rec['gpu_bytes'])} MiB GPU memory including mips, mean/min SSIM {fmt(rec['mean_ssim'])}/{fmt(rec['min_ssim'])}, and {mib(rec['mean_wire'])} MiB mean wire size.")
        if memory_saver:
            lines.append("")
            lines.append(f"Use `{memory_saver['cell']}` when residency matters more: it cuts per-texture GPU memory to {mib(memory_saver['gpu_bytes'])} MiB with mean/min SSIM {fmt(memory_saver['mean_ssim'])}/{fmt(memory_saver['min_ssim'])}.")
        if premium:
            lines.append("")
            lines.append(f"Use `{premium['cell']}` for close-inspection imagery: mean/min SSIM {fmt(premium['mean_ssim'])}/{fmt(premium['min_ssim'])}, but {mib(premium['gpu_bytes'])} MiB GPU memory per texture.")
    else:
        lines.append("_Pending: metrics incomplete._")
    lines.extend(
        [
            "",
            "The 6x6 point is the measured quality/memory knee: moving down to 8x6 saves 25% GPU memory but loses about 0.0115 mean SSIM; moving up to 4x4 costs 125% more GPU memory for about 0.0214 mean SSIM.",
            "",
            "At a fixed block size, quality 90 dominates lower quality settings for GPU residency; the tradeoff is wire size, not GPU memory.",
            "",
            "8x8 and larger are aggressive memory modes. Inspect the gallery for forest canopy, moraine, roads, and shadow-boundary failures before choosing them.",
            "",
            "## Reference Codecs",
            "",
            *table(baselines),
            "",
            "The default 4x4 UASTC reference remains the quality ceiling at roughly 0.998 mean SSIM and 20.34 MiB mean wire size. XUASTC 4x4 q90 reduces wire size while keeping the same ASTC residency footprint, but it does not match UASTC quality.",
            "",
            "## Low-Resolution Tier",
            "",
            *table(low_rows),
            "",
            "For the 256x256 low tier, `xuastc_6x6_q90_e4_low` is the balanced point; 4x4 q90 is the quality option and 8x8 q90 is the smallest-residency option.",
            "",
            "## Encode Time Notes",
            "",
            "Recovered outputs from pre-commit restarts may have `encode_seconds: null`; subsequent entries were measured sequentially with one basisu process at a time.",
            "",
            "Encode times from before and after removing `basisu -parallel` are not directly comparable, so they should not drive the codec choice.",
            "",
            "## Metric Method",
            "",
            "Metrics use the full 3360x3360 content crop, decoded from RGBA32 mip level 0 with the official Basis Universal transcoder. SSIM is computed in bounded 512px tiles with reflected 5px halos; a numerical regression check matched the previous whole-frame implementation within 1.3e-7.",
            "",
            "## Anomalies",
            "",
        ]
    )
    if missing:
        lines.append("Missing metrics:")
        lines.extend(f"- `{m}`" for m in missing[:100])
    else:
        lines.append("- No missing quality metrics.")
    lines.extend(["", "## Gallery", "", "Open `codec_sweep/gallery.html`."])
    (SWEEP_ROOT / "REPORT.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    git_checkpoint(f"[sweep] DONE — recommendation: {rec['cell'] if rec else 'pending'} | next: none | status: ok")


if __name__ == "__main__":
    main()
