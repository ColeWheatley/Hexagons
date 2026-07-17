#!/usr/bin/env python3
"""Encode remaining codec cells, recover existing KTX2s, and commit checkpoints."""

from __future__ import annotations

import argparse
import subprocess
import time
from pathlib import Path

from common import (
    BASISU_BIN,
    CELLS,
    CELLS_BY_NAME,
    COMMON_BASISU_ARGS,
    SELECTED_SECTORS,
    SWEEP_ROOT,
    encoded_dir_for_cell,
    encoded_path_for_cell_sector,
    gpu_bytes_for_block,
    image_size_for_tier,
    load_results,
    save_results,
    source_path_for_sector,
)


def gpu_bytes_etc2_no_alpha(width: int, height: int) -> int:
    total = 0
    while True:
        total += ((width + 3) // 4) * ((height + 3) // 4) * 8
        if width == 1 and height == 1:
            return total
        width = max(1, width // 2)
        height = max(1, height // 2)


def pending_cells(results: dict) -> list[str]:
    pending = []
    for cell in CELLS:
        for sector in SELECTED_SECTORS:
            sector_name = sector["sector"]
            entry = results["sectors"][sector_name][cell.tier].get(cell.name)
            if not entry or not encoded_path_for_cell_sector(cell, sector_name).exists():
                pending.append(cell.name)
                break
    return pending


def append_progress(message: str) -> None:
    with (SWEEP_ROOT / "PROGRESS.md").open("a", encoding="utf-8") as f:
        f.write(f"\n- `{message}`\n")
    print(f"progress: {message}", flush=True)


def git_checkpoint(message: str) -> None:
    # Persist progress in the worktree after each resumable unit. The caller or
    # supervising agent creates coherent Git commits at stage boundaries.
    append_progress(message)


def sector_result_entry(cell, encoded: Path, width: int, height: int, astc_gpu_bytes, bc7_gpu_bytes, etc2_gpu_bytes, elapsed, recovered=False) -> dict:
    note = cell.notes or ""
    if recovered:
        note = (note + "; " if note else "") + "recovered existing output after restart; encode_seconds unavailable"
    return {
        "codec_family": cell.codec_family,
        "quality": cell.quality,
        "effort": cell.effort,
        "args": list(cell.args),
        "common_args": COMMON_BASISU_ARGS,
        "path": str(encoded.relative_to(SWEEP_ROOT)),
        "ktx2_bytes": encoded.stat().st_size,
        "width": width,
        "height": height,
        "astc_block": list(cell.astc_block) if cell.astc_block else None,
        "astc_gpu_bytes": astc_gpu_bytes,
        "astc_gpu_bpp_with_mips": (astc_gpu_bytes / (width * height)) if astc_gpu_bytes else None,
        "bc7_gpu_bytes": bc7_gpu_bytes,
        "bc7_gpu_bpp_with_mips": bc7_gpu_bytes / (width * height),
        "etc2_gpu_bytes_estimate": etc2_gpu_bytes,
        "encode_seconds": elapsed,
        "encode_batch_seconds": elapsed,
        "encode_batch_size": 1,
        "encode_amortized_seconds": elapsed,
        "notes": note,
    }


def encode_one(command: list[str], log_path: Path) -> tuple[float, int]:
    start = time.perf_counter()
    proc = subprocess.run(command, cwd=SWEEP_ROOT.parent, capture_output=True, text=True)
    elapsed = time.perf_counter() - start
    log_path.parent.mkdir(parents=True, exist_ok=True)
    log_path.write_text("$ " + " ".join(command) + "\n\nSTDOUT:\n" + proc.stdout + "\nSTDERR:\n" + proc.stderr, encoding="utf-8")
    return elapsed, proc.returncode


def encode_cell(cell_name: str, force: bool = False, do_commit: bool = False, progress_every: int = 1) -> None:
    cell = CELLS_BY_NAME[cell_name]
    encoded_dir_for_cell(cell).mkdir(parents=True, exist_ok=True)
    (SWEEP_ROOT / "logs").mkdir(parents=True, exist_ok=True)
    results = load_results()
    width, height = image_size_for_tier(cell.tier)
    bc7_gpu_bytes = gpu_bytes_for_block(width, height, (4, 4))
    astc_gpu_bytes = gpu_bytes_for_block(width, height, cell.astc_block) if cell.astc_block else None
    etc2_gpu_bytes = gpu_bytes_etc2_no_alpha(width, height) if cell.codec_family == "etc1s" else None

    tasks = []
    recovered = 0
    for sector in SELECTED_SECTORS:
        sector_name = sector["sector"]
        source = source_path_for_sector(sector_name, cell.tier)
        if not source.exists():
            raise SystemExit(f"missing source {source}; run extract_sources.py")
        encoded = encoded_path_for_cell_sector(cell, sector_name)
        existing_entry = results["sectors"][sector_name][cell.tier].get(cell.name)
        if force or not encoded.exists():
            tasks.append((sector_name, source, encoded))
        elif not existing_entry:
            results["sectors"][sector_name][cell.tier][cell.name] = sector_result_entry(
                cell, encoded, width, height, astc_gpu_bytes, bc7_gpu_bytes, etc2_gpu_bytes, None, recovered=True
            )
            recovered += 1
    if recovered:
        save_results(results)
        message = f"[sweep] recovered {recovered} outputs for {cell.name} | next: continue {cell.name} | status: ok"
        git_checkpoint(message) if do_commit else append_progress(message)

    print(f"{cell.name}: encoding {len(tasks)} sector(s) sequentially", flush=True)
    for idx, (sector_name, source, encoded) in enumerate(tasks, start=1):
        command = [
            str(BASISU_BIN),
            *cell.args,
            *COMMON_BASISU_ARGS,
            "-no_status_output",
            "-file",
            str(source),
            "-output_file",
            str(encoded),
        ]
        log_path = SWEEP_ROOT / "logs" / f"encode_{cell.name}_{sector_name}.log"
        elapsed, returncode = encode_one(command, log_path)
        if returncode != 0:
            raise SystemExit(f"basisu failed for {cell.name}/{sector_name}; see {log_path}")
        if not encoded.exists():
            raise SystemExit(f"expected output missing after successful encode: {encoded}")
        results["sectors"][sector_name][cell.tier][cell.name] = sector_result_entry(
            cell, encoded, width, height, astc_gpu_bytes, bc7_gpu_bytes, etc2_gpu_bytes, elapsed
        )
        save_results(results)
        print(f"{cell.name}/{sector_name}: {elapsed:.2f}s", flush=True)
        if idx % progress_every == 0 or idx == len(tasks):
            message = f"[sweep] encoded {cell.name} sectors {idx}/{len(tasks)} | next: continue {cell.name} | status: ok"
            git_checkpoint(message) if do_commit else append_progress(message)

    for sector in SELECTED_SECTORS:
        sector_name = sector["sector"]
        encoded = encoded_path_for_cell_sector(cell, sector_name)
        if not encoded.exists() or cell.name not in results["sectors"][sector_name][cell.tier]:
            raise SystemExit(f"incomplete cell {cell.name}: {sector_name}")
    print(f"updated results for {cell.name}", flush=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cell")
    parser.add_argument("--all", action="store_true")
    parser.add_argument("--list", action="store_true")
    parser.add_argument("--pending", action="store_true")
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--commit", action="store_true")
    parser.add_argument("--progress-every", type=int, default=2)
    parser.add_argument("--jobs", type=int, default=1, help="ignored; this encoder is sequential for host safety")
    args = parser.parse_args()

    if args.list:
        for cell in CELLS:
            print(cell.name)
        return
    results = load_results()
    if args.pending:
        for cell in pending_cells(results):
            print(cell)
        return
    names = [args.cell] if args.cell else pending_cells(results) if args.all else []
    if not names:
        raise SystemExit("use --cell, --all, --list, or --pending")
    for name in names:
        encode_cell(name, force=args.force, do_commit=args.commit, progress_every=args.progress_every)
        if args.commit:
            remaining = pending_cells(load_results())
            next_name = remaining[0] if remaining else "quality metrics"
            git_checkpoint(f"[sweep] encoded {name} | next: {next_name} | status: ok")


if __name__ == "__main__":
    main()
