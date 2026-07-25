#!/usr/bin/env python3
"""Reproducible CPU benchmark for the fixed Tirol texture-page sample.

The public ``repeat`` command launches one isolated child process per repeat
and waits for it to finish before starting the next. Each child calls the real
texture-page bake function, retains all four artifacts, records the pipeline's
stage timings, and hashes the outputs.

Examples:
  .pixi/envs/default/bin/python scripts/bench_texture_pages.py repeat \
      baseline --workers 3 --runs 3
  .pixi/envs/default/bin/python scripts/bench_texture_pages.py repeat \
      candidate1 --workers 3 --runs 3 --reference-candidate baseline
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
import re
import signal
import statistics
import subprocess
import sys
import time
from concurrent.futures import ProcessPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path

from shapely.geometry import box


REPO_ROOT = Path(__file__).resolve().parents[1]
HEX_BACKEND = REPO_ROOT / "hex_backend"
sys.path.insert(0, str(HEX_BACKEND))

import bake_inventory
import generate_manifest
import waffle_iron as waffle
from gosper_texture_page_adapter import tile_coverage_bounds
from texture_page_grid import TexturePage, pages_for_bounds


DEFAULT_INVENTORY = REPO_ROOT / "reference" / "baseline_inventory.json"
DEFAULT_PAGE_LIST = Path(__file__).with_name("texture_bench_pages.json")
DEFAULT_BENCH_ROOT = REPO_ROOT / "local_data" / "bench"
ARTIFACT_TIERS = ("bootstrap", "low", "medium", "high")
CANDIDATE_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]*$")
_BENCH_WORKER_CONTEXT: dict[str, object] = {}


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def atomic_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    try:
        with temporary.open("w", encoding="utf-8") as target:
            json.dump(payload, target, indent=2, sort_keys=True)
            target.write("\n")
            target.flush()
            os.fsync(target.fileno())
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)


def git_commit() -> str:
    return subprocess.run(
        ["git", "rev-parse", "HEAD"],
        cwd=REPO_ROOT,
        check=True,
        capture_output=True,
        text=True,
    ).stdout.strip()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load_pages(page_list_path: Path, inventory: dict) -> tuple[dict, list[TexturePage]]:
    specification = json.loads(page_list_path.read_text(encoding="utf-8"))
    rows = specification.get("pages", [])
    if not 10 <= len(rows) <= 12:
        raise ValueError("texture benchmark page list must contain 10-12 pages")
    inventory_keys = {
        (int(item["page_x"]), int(item["page_y"]))
        for item in inventory["texture_pages"]
    }
    seen: set[tuple[int, int]] = set()
    classes: dict[str, int] = {}
    pages = []
    for row in rows:
        key = (int(row["page_x"]), int(row["page_y"]))
        if key in seen:
            raise ValueError(f"duplicate texture benchmark page: {key}")
        if key not in inventory_keys:
            raise ValueError(f"texture benchmark page absent from inventory: {key}")
        seen.add(key)
        page_class = str(row["class"])
        classes[page_class] = classes.get(page_class, 0) + 1
        pages.append(TexturePage(*key))
    if classes.get("heavy_boundary") != 5 or classes.get("interior") != 5:
        raise ValueError("fixed benchmark must contain five heavy_boundary and five interior pages")
    if not any(
        (page.page_x, page.page_y) == (-14, 206)
        for page in pages
    ):
        raise ValueError("fixed benchmark must include pathological page texture_-14_206")
    return specification, pages


def _relevant_tiles_and_sources(
    inventory: dict,
    pages: list[TexturePage],
    binary_dir: Path,
) -> tuple[list[dict], dict[str, list[dict]]]:
    expected_geometry = bake_inventory.geometry_keys(inventory)
    tiles = generate_manifest.scan_binary_tiles(
        str(binary_dir),
        expected_tiles=expected_geometry,
        reject_unexpected=True,
    )
    geom = waffle.coord_util.gosper_tile_geometry()
    half_x = float(geom["render_half_x_m"])
    half_y = float(geom["render_half_y_m"])
    selected_keys = {page.key for page in pages}
    relevant_tiles = [
        tile
        for tile in tiles
        if any(
            candidate.key in selected_keys
            for candidate in pages_for_bounds(
                tile_coverage_bounds(tile, half_x, half_y)
            )
        )
    ]
    tile_sources = {}
    for tile in relevant_tiles:
        key = (int(tile["yq"]), int(tile["yr"]))
        tile_sources[key] = {
            "label": f"gosper_{key[0]}_{key[1]}",
            "x": tile["x"],
            "y": tile["y"],
            "unit_valid": waffle.read_gsp_unit_valid(
                binary_dir / waffle.gosper_asset_name(key[0], key[1], "bin")
            ),
        }
    sources_by_page = waffle.map_gosper_sources_to_texture_pages(
        pages,
        relevant_tiles,
        tile_sources,
        half_x,
        half_y,
    )
    return relevant_tiles, sources_by_page


def _aerial_context(inventory: dict, pages: list[TexturePage]) -> tuple[list[dict], object]:
    all_tifs = sorted(
        (
            {"path": item["path"], "poly": box(*item["bounds"])}
            for item in inventory["sources"]["aerial_files"]
        ),
        key=lambda item: item["path"],
    )
    max_aggregate_radius = (
        waffle.coord_util.gosper_level_size(waffle.coord_util.GOSPER_TILE_LEVEL)
        / math.sqrt(3.0)
        * waffle.coord_util.GOSPER_CAP_RENDER_OVERSCAN
    )
    valid_tifs = sorted(
        waffle.select_aerial_tifs_for_pages(
            all_tifs,
            pages,
            padding_m=max_aggregate_radius,
        ),
        key=lambda item: item["path"],
    )
    return valid_tifs, waffle.orthophoto_internal_holes(all_tifs)


def _init_bench_worker(
    valid_tifs: list[dict],
    sources_by_page: dict[str, list[dict]],
    output_dir: str,
    recipe_version: str,
    encoding_profile: str,
    encoding_effort: int | None,
    internal_holes: object,
    basisu_binary: str,
    basisu_max_threads: int | None,
) -> None:
    global _BENCH_WORKER_CONTEXT
    waffle.BASISU_BINARY = basisu_binary
    waffle.S3_ENABLED = False
    # Candidate 3 introduces this worker-local ceiling. Setting the attribute
    # early is harmless on baseline code, which does not read it.
    waffle.BASISU_MAX_THREADS = basisu_max_threads
    _BENCH_WORKER_CONTEXT = {
        "valid_tifs": valid_tifs,
        "sources_by_page": sources_by_page,
        "output_dir": output_dir,
        "recipe_version": recipe_version,
        "encoding_profile": encoding_profile,
        "encoding_effort": encoding_effort,
        "internal_holes": internal_holes,
    }


def _bake_bench_page(page: TexturePage) -> tuple[str, dict, dict, dict]:
    context = _BENCH_WORKER_CONTEXT
    paths, padding, timings = waffle.bake_texture_page(
        page,
        context["valid_tifs"],
        context["sources_by_page"][page.key],
        output_dir=context["output_dir"],
        texture_tattoos=False,
        texture_recipe_version=context["recipe_version"],
        encoding_profile=context["encoding_profile"],
        encoding_effort=context["encoding_effort"],
        internal_holes=context["internal_holes"],
    )
    return page.key, paths, padding, timings


def _load_reference_hashes(
    reference_candidate: str | None,
    inventory: dict,
    bench_root: Path,
    pages: list[TexturePage],
) -> tuple[str, dict[str, dict[str, str]]]:
    if reference_candidate:
        summary_path = bench_root / reference_candidate / "summary.json"
        summary = json.loads(summary_path.read_text(encoding="utf-8"))
        hashes = summary.get("reference_hashes", {})
        missing = [
            f"{page.key}/{tier}"
            for page in pages
            for tier in ARTIFACT_TIERS
            if tier not in hashes.get(page.key, {})
        ]
        if missing:
            raise ValueError(
                f"reference candidate {reference_candidate!r} lacks hashes: {missing[:8]}"
            )
        return f"candidate:{reference_candidate}", hashes

    production_root = Path(inventory["output_root"]) / "app" / "aerial_pages"
    hashes: dict[str, dict[str, str]] = {}
    for page in pages:
        for tier, raw_path in waffle.texture_page_asset_paths(
            page, str(production_root)
        ).items():
            path = Path(raw_path)
            if path.is_file():
                hashes.setdefault(page.key, {})[tier] = sha256_file(path)
    return f"production:{production_root}", hashes


def _stage_medians(rows: list[dict]) -> dict[str, float]:
    stage_names = sorted(
        {
            stage
            for row in rows
            for stage in row["timings"]
        }
    )
    return {
        stage: statistics.median(
            float(row["timings"].get(stage, 0.0))
            for row in rows
        )
        for stage in stage_names
    }


def _loadavg_payload(start: tuple[float, float, float], end: tuple[float, float, float]) -> dict:
    cpu_count = os.cpu_count() or 1
    threshold = max(8.0, cpu_count * 0.75)
    suspected = start[0] >= threshold or start[1] >= threshold
    return {
        "start": list(start),
        "end": list(end),
        "pre_run_contention_threshold": threshold,
        "external_contention_suspected": suspected,
        "flag_basis": (
            "pre-run 1m or 5m load exceeded 75% of logical CPU count"
            if suspected
            else "pre-run load below threshold; end load retained but includes this benchmark"
        ),
    }


def run_single(args: argparse.Namespace) -> int:
    if not CANDIDATE_RE.fullmatch(args.candidate):
        raise ValueError(f"unsafe candidate name: {args.candidate!r}")
    if args.workers < 1:
        raise ValueError("--workers must be positive")
    if args.basisu_max_threads is not None and args.basisu_max_threads < 1:
        raise ValueError("--basisu-max-threads must be positive")

    inventory_path = Path(args.inventory).resolve()
    page_list_path = Path(args.page_list).resolve()
    bench_root = Path(args.bench_root).resolve()
    if REPO_ROOT not in bench_root.parents and bench_root != REPO_ROOT:
        raise ValueError("benchmark root must stay inside this clone")
    inventory = json.loads(inventory_path.read_text(encoding="utf-8"))
    specification, pages = load_pages(page_list_path, inventory)
    run_dir = bench_root / args.candidate / f"run-{args.run_number:02d}"
    report_path = run_dir / "report.json"
    if run_dir.exists():
        raise FileExistsError(f"benchmark run directory already exists: {run_dir}")
    output_dir = run_dir / "artifacts"
    output_dir.mkdir(parents=True)

    started_at = utc_now()
    process_started = time.perf_counter()
    load_start = os.getloadavg()
    setup_started = time.perf_counter()
    binary_dir = Path(inventory["output_root"]) / "app" / "tiles_bin"
    relevant_tiles, sources_by_page = _relevant_tiles_and_sources(
        inventory, pages, binary_dir
    )
    valid_tifs, internal_holes = _aerial_context(inventory, pages)
    basisu_binary = waffle.resolve_basisu_binary()
    waffle.verify_basisu_xuastc(
        basisu_binary,
        inventory["texture_recipe"]["encoding_profile"],
    )
    reference_label, reference_hashes = _load_reference_hashes(
        args.reference_candidate,
        inventory,
        bench_root,
        pages,
    )
    setup_seconds = time.perf_counter() - setup_started

    recipe = inventory["texture_recipe"]
    waffle.S3_ENABLED = False
    bake_started = time.perf_counter()
    results: dict[str, tuple[dict, dict, dict]] = {}
    executor = ProcessPoolExecutor(
        max_workers=args.workers,
        initializer=_init_bench_worker,
        initargs=(
            valid_tifs,
            sources_by_page,
            str(output_dir),
            recipe["version"],
            recipe["encoding_profile"],
            recipe["encoding_effort"],
            internal_holes,
            basisu_binary,
            args.basisu_max_threads,
        ),
    )
    try:
        futures = {
            executor.submit(_bake_bench_page, page): page
            for page in pages
        }
        for future in as_completed(futures):
            page = futures[future]
            key, paths, padding, timings = future.result()
            results[key] = (paths, padding, timings)
            print(
                f"  {page.asset_stem}: total={timings['total']:.2f}s "
                f"padding={timings['boundary_padding']:.2f}s "
                f"ktx2_high={timings['ktx2_high']:.2f}s",
                flush=True,
            )
    finally:
        executor.shutdown(wait=True, cancel_futures=True)
    bake_wall_seconds = time.perf_counter() - bake_started

    page_rows = []
    all_compared_identical = True
    compared_count = 0
    for page in pages:
        paths, padding, timings = results[page.key]
        outputs = {}
        for tier in ARTIFACT_TIERS:
            path = Path(paths[tier])
            actual_hash = sha256_file(path)
            expected_hash = reference_hashes.get(page.key, {}).get(tier)
            identical = actual_hash == expected_hash if expected_hash else None
            if identical is not None:
                compared_count += 1
                all_compared_identical = all_compared_identical and identical
            outputs[tier] = {
                "path": str(path.relative_to(REPO_ROOT)),
                "bytes": path.stat().st_size,
                "sha256": actual_hash,
                "reference_sha256": expected_hash,
                "identical": identical,
            }
        spec_row = next(
            row
            for row in specification["pages"]
            if (int(row["page_x"]), int(row["page_y"]))
            == (page.page_x, page.page_y)
        )
        page_rows.append(
            {
                "page_x": page.page_x,
                "page_y": page.page_y,
                "key": page.key,
                "asset_stem": page.asset_stem,
                "class": spec_row["class"],
                "padding": padding,
                "timings": timings,
                "outputs": outputs,
            }
        )

    load_end = os.getloadavg()
    report = {
        "schema_version": 1,
        "candidate": args.candidate,
        "run_number": args.run_number,
        "started_at": started_at,
        "finished_at": utc_now(),
        "git_commit": git_commit(),
        "configuration": {
            "texture_workers": args.workers,
            "basisu_max_threads": args.basisu_max_threads,
            "encoding_profile": recipe["encoding_profile"],
            "encoding_effort": recipe["encoding_effort"],
            "page_list": str(page_list_path.relative_to(REPO_ROOT)),
            "page_count": len(pages),
        },
        "inputs": {
            "inventory": str(inventory_path),
            "binary_dir": str(binary_dir),
            "relevant_geometry_tiles": len(relevant_tiles),
            "selected_aerial_tifs": len(valid_tifs),
            "reference": reference_label,
        },
        "loadavg": _loadavg_payload(load_start, load_end),
        "setup_seconds": setup_seconds,
        "wall_clock_seconds": bake_wall_seconds,
        "process_wall_clock_seconds": time.perf_counter() - process_started,
        "stage_medians": _stage_medians(page_rows),
        "reference_artifacts_compared": compared_count,
        "reference_complete": compared_count == len(pages) * len(ARTIFACT_TIERS),
        "compared_hashes_identical": all_compared_identical,
        "pages": page_rows,
    }
    atomic_json(report_path, report)
    print_median_row(report)
    return 0


def print_median_row(report: dict) -> None:
    medians = report["stage_medians"]
    print(
        "candidate             run   workers  total-med  padding-med  high-med  wall",
        flush=True,
    )
    print(
        f"{report['candidate']:<21} {report['run_number']:>3} "
        f"{report['configuration']['texture_workers']:>9} "
        f"{medians['total']:>10.2f} {medians['boundary_padding']:>12.2f} "
        f"{medians['ktx2_high']:>9.2f} {report['wall_clock_seconds']:>7.2f}",
        flush=True,
    )


def _reference_hashes_from_report(report: dict) -> dict[str, dict[str, str]]:
    return {
        row["key"]: {
            tier: row["outputs"][tier]["sha256"]
            for tier in ARTIFACT_TIERS
        }
        for row in report["pages"]
    }


def aggregate_reports(
    candidate: str,
    candidate_root: Path,
    run_count: int,
    reference_candidate: str | None,
) -> dict:
    reports = [
        json.loads(
            (candidate_root / f"run-{run_number:02d}" / "report.json").read_text(
                encoding="utf-8"
            )
        )
        for run_number in range(1, run_count + 1)
    ]
    configurations = [report["configuration"] for report in reports]
    if any(configuration != configurations[0] for configuration in configurations[1:]):
        raise ValueError("cannot aggregate runs with different configurations")

    reference_hashes = _reference_hashes_from_report(reports[0])
    across_runs_identical = all(
        _reference_hashes_from_report(report) == reference_hashes
        for report in reports[1:]
    )
    compared_hashes_identical = all(
        report["compared_hashes_identical"]
        for report in reports
    )
    reference_complete = all(report["reference_complete"] for report in reports)
    stage_names = sorted(
        {
            stage
            for report in reports
            for stage in report["stage_medians"]
        }
    )
    summary = {
        "schema_version": 1,
        "candidate": candidate,
        "created_at": utc_now(),
        "run_count": run_count,
        "configuration": configurations[0],
        "reference_candidate": reference_candidate,
        "run_reports": [
            str(
                (candidate_root / f"run-{run_number:02d}" / "report.json")
                .relative_to(REPO_ROOT)
            )
            for run_number in range(1, run_count + 1)
        ],
        "run_stage_medians": [
            report["stage_medians"]
            for report in reports
        ],
        "median_of_run_stage_medians": {
            stage: statistics.median(
                report["stage_medians"][stage]
                for report in reports
            )
            for stage in stage_names
        },
        "run_wall_clock_seconds": [
            report["wall_clock_seconds"]
            for report in reports
        ],
        "median_wall_clock_seconds": statistics.median(
            report["wall_clock_seconds"]
            for report in reports
        ),
        "contention_flagged_runs": [
            report["run_number"]
            for report in reports
            if report["loadavg"]["external_contention_suspected"]
        ],
        "reference_complete": reference_complete,
        "compared_hashes_identical": compared_hashes_identical,
        "hashes_identical_across_runs": across_runs_identical,
        "hashes_identical": (
            across_runs_identical
            and compared_hashes_identical
            and (reference_complete or reference_candidate is None)
        ),
        "reference_hashes": reference_hashes,
    }
    atomic_json(candidate_root / "summary.json", summary)
    return summary


def _archive_partial_run(run_dir: Path) -> None:
    if not run_dir.exists():
        return
    if (run_dir / "report.json").is_file():
        return
    suffix = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    archived = run_dir.with_name(f"{run_dir.name}-incomplete-{suffix}")
    run_dir.rename(archived)
    print(f"archived incomplete scratch run as {archived}", flush=True)


def _run_child(command: list[str]) -> None:
    process = subprocess.Popen(command, cwd=REPO_ROOT)
    try:
        return_code = process.wait()
    finally:
        if process.poll() is None:
            process.terminate()
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()
    if return_code:
        raise subprocess.CalledProcessError(return_code, command)


def run_repeats(args: argparse.Namespace) -> int:
    if not CANDIDATE_RE.fullmatch(args.candidate):
        raise ValueError(f"unsafe candidate name: {args.candidate!r}")
    if args.runs not in (3, 5):
        raise ValueError("--runs must be 3 or 5")
    bench_root = Path(args.bench_root).resolve()
    if REPO_ROOT not in bench_root.parents and bench_root != REPO_ROOT:
        raise ValueError("benchmark root must stay inside this clone")
    candidate_root = bench_root / args.candidate
    candidate_root.mkdir(parents=True, exist_ok=True)

    for run_number in range(1, args.runs + 1):
        run_dir = candidate_root / f"run-{run_number:02d}"
        _archive_partial_run(run_dir)
        if (run_dir / "report.json").is_file():
            print(f"reusing completed {run_dir}", flush=True)
            continue
        command = [
            sys.executable,
            str(Path(__file__).resolve()),
            "_single",
            args.candidate,
            "--run-number",
            str(run_number),
            "--workers",
            str(args.workers),
            "--inventory",
            str(Path(args.inventory).resolve()),
            "--page-list",
            str(Path(args.page_list).resolve()),
            "--bench-root",
            str(bench_root),
        ]
        if args.reference_candidate:
            command.extend(["--reference-candidate", args.reference_candidate])
        if args.basisu_max_threads is not None:
            command.extend(["--basisu-max-threads", str(args.basisu_max_threads)])
        print(f"starting repeat {run_number}/{args.runs}: {' '.join(command)}", flush=True)
        _run_child(command)

    summary = aggregate_reports(
        args.candidate,
        candidate_root,
        args.runs,
        args.reference_candidate,
    )
    medians = summary["median_of_run_stage_medians"]
    print(
        "\naggregate             runs  total-med  padding-med  high-med  wall-med  hashes",
        flush=True,
    )
    print(
        f"{args.candidate:<21} {args.runs:>4} "
        f"{medians['total']:>10.2f} {medians['boundary_padding']:>12.2f} "
        f"{medians['ktx2_high']:>9.2f} {summary['median_wall_clock_seconds']:>9.2f} "
        f"{'identical' if summary['hashes_identical'] else 'FAILED'}",
        flush=True,
    )
    if summary["contention_flagged_runs"]:
        print(
            f"WARNING: pre-run load flagged repeats {summary['contention_flagged_runs']}",
            flush=True,
        )
    return 0 if summary["hashes_identical"] else 2


def add_common_arguments(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("candidate")
    parser.add_argument("--workers", type=int, required=True)
    parser.add_argument("--basisu-max-threads", type=int)
    parser.add_argument("--reference-candidate")
    parser.add_argument("--inventory", default=str(DEFAULT_INVENTORY))
    parser.add_argument("--page-list", default=str(DEFAULT_PAGE_LIST))
    parser.add_argument("--bench-root", default=str(DEFAULT_BENCH_ROOT))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)
    repeat = subparsers.add_parser(
        "repeat",
        help="run the fixed bench sequentially 3 or 5 times and aggregate it",
    )
    add_common_arguments(repeat)
    repeat.add_argument("--runs", type=int, default=3)
    single = subparsers.add_parser("_single", help=argparse.SUPPRESS)
    add_common_arguments(single)
    single.add_argument("--run-number", type=int, required=True)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.command == "repeat":
        return run_repeats(args)
    if args.command == "_single":
        return run_single(args)
    raise AssertionError(args.command)


if __name__ == "__main__":
    signal.signal(signal.SIGTERM, lambda _signum, _frame: sys.exit(143))
    raise SystemExit(main())
