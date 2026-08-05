#!/usr/bin/env python3
"""Validate a Hexagons bake and create its authoritative run inventory."""

from __future__ import annotations

import argparse
import datetime as dt
import glob
import hashlib
import importlib.metadata
import json
import os
import platform
import shutil
import subprocess
import sys
import time
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

import psutil
import rasterio
import pyproj
from PIL import features as pillow_features
from shapely.geometry import box
from shapely.ops import unary_union
from shapely.strtree import STRtree

import coordinate_utility as coord_util
from bake_inventory import SCHEMA_VERSION, refresh_progress, write_json_atomic
from execution_profiles import EXECUTION_PROFILES, execution_profile
from texture_contract import (
    DEFAULT_TEXTURE_ENCODING_PROFILE,
    TEXTURE_BOOTSTRAP_SIZE,
    TEXTURE_PAGE_RECIPE_VERSION,
    TEXTURE_TIERS,
    texture_encoding_for_tier,
)
from texture_page_grid import pages_for_bounds
from waffle_iron import (
    BAKER_VERSION,
    enumerate_gosper_islands_for_bbox,
    resolve_basisu_binary,
    texture_page_cache_version,
    verify_basisu_xuastc,
)


GIB = 1024 ** 3
EXPECTED_FULL_CORPUS_BYTES = 28_185_093_979
EXPECTED_FULL_CORPUS_FILES = 3_718
# The recorded recipe version and the recorded effort must be derived from the
# same value: page markers on disk embed the effort, so a version string built
# with a different effort can never match a marker, and every already-baked
# page then looks stale to a regenerated inventory.
PRODUCTION_ENCODING_EFFORT = 4
DEFAULT_BUCKET = "wheatley.cloud"
DEFAULT_PREFIX = "hexagons/app"


def run_text(args: list[str], *, cwd: Path | None = None) -> str:
    result = subprocess.run(args, cwd=cwd, text=True, capture_output=True, check=False)
    return (result.stdout or result.stderr).strip()


def load_known_source_inventory(path: Path) -> dict[str, dict[str, Any]]:
    """Load the audited filename/size/full-digest source identity."""
    result: dict[str, dict[str, Any]] = {}
    for line_number, raw in enumerate(path.read_text().splitlines(), 1):
        parts = raw.split("\t")
        if len(parts) != 3:
            raise ValueError(f"{path}:{line_number}: expected name, bytes, sha256")
        name, size_text, digest = parts
        if name in result:
            raise ValueError(f"{path}:{line_number}: duplicate filename {name}")
        if len(digest) != 64 or any(char not in "0123456789abcdef" for char in digest):
            raise ValueError(f"{path}:{line_number}: invalid SHA-256")
        result[name] = {"bytes": int(size_text), "sha256": digest}
    if (
        len(result) != EXPECTED_FULL_CORPUS_FILES
        or sum(item["bytes"] for item in result.values()) != EXPECTED_FULL_CORPUS_BYTES
    ):
        raise ValueError(
            "source inventory identity mismatch: expected "
            f"{EXPECTED_FULL_CORPUS_FILES} files / {EXPECTED_FULL_CORPUS_BYTES} bytes"
        )
    return result


def sha256_path(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        while chunk := source.read(4 * 1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def compare_known_source_inventory(
    inventory_path: Path, valid_sources: list[dict[str, Any]], *, verify_hashes: bool,
) -> dict[str, Any]:
    expected = load_known_source_inventory(inventory_path)
    actual = {Path(item["path"]).name: item for item in valid_sources}
    missing = sorted(set(expected) - set(actual))
    unexpected = sorted(set(actual) - set(expected))
    size_mismatches = [
        {
            "name": name,
            "expected_bytes": expected[name]["bytes"],
            "actual_bytes": actual[name]["bytes"],
        }
        for name in sorted(set(expected) & set(actual))
        if expected[name]["bytes"] != actual[name]["bytes"]
    ]
    representative_hashes: dict[str, dict[str, Any]] = {}
    hash_mismatches = []
    if verify_hashes and not missing and not size_mismatches:
        names = sorted(expected)
        for name in (names[0], names[len(names) // 2], names[-1]):
            digest = sha256_path(Path(actual[name]["path"]))
            matches = digest == expected[name]["sha256"]
            representative_hashes[name] = {
                "algorithm": "sha256",
                "expected": expected[name]["sha256"],
                "actual": digest,
                "matches": matches,
            }
            if not matches:
                hash_mismatches.append(name)
    return {
        "path": str(inventory_path.resolve()),
        "expected_files": len(expected),
        "expected_bytes": sum(item["bytes"] for item in expected.values()),
        "missing": missing,
        "unexpected": unexpected,
        "size_mismatches": size_mismatches,
        "representative_full_hashes": representative_hashes,
        "hash_mismatches": hash_mismatches,
        "matches": not (missing or unexpected or size_mismatches or hash_mismatches),
    }


def git_state(repo: Path) -> dict[str, Any]:
    status = run_text(["git", "status", "--porcelain=v1"], cwd=repo)
    return {
        "repository": str(repo.resolve()),
        "branch": run_text(["git", "branch", "--show-current"], cwd=repo),
        "commit": run_text(["git", "rev-parse", "HEAD"], cwd=repo),
        "dirty": bool(status),
        "dirty_paths": status.splitlines(),
        "remote": run_text(["git", "remote", "get-url", "origin"], cwd=repo),
        "master_distance": run_text(
            ["git", "rev-list", "--left-right", "--count", "HEAD...origin/master"], cwd=repo
        ),
        "worktrees": run_text(["git", "worktree", "list", "--porcelain"], cwd=repo),
    }


def raster_descriptor(path: Path) -> dict[str, Any]:
    with rasterio.open(path) as dataset:
        scale = max(dataset.width, dataset.height) / 1024
        sample_width = max(1, int(dataset.width / max(1.0, scale)))
        sample_height = max(1, int(dataset.height / max(1.0, scale)))
        sample = dataset.read(
            1, out_shape=(sample_height, sample_width),
            resampling=rasterio.enums.Resampling.nearest, masked=True,
        )
        valid_fraction = float(sample.count()) / sample.size
        return {
            "path": str(path.resolve()),
            "bytes": path.stat().st_size,
            "width": dataset.width,
            "height": dataset.height,
            "count": dataset.count,
            "dtype": list(dataset.dtypes),
            "crs": str(dataset.crs),
            "resolution": [abs(float(dataset.transform.a)), abs(float(dataset.transform.e))],
            "bounds": [float(value) for value in dataset.bounds],
            "nodata": dataset.nodata,
            "valid_fraction_sampled": valid_fraction,
        }


def inspect_aerial_sources(paths: list[Path]) -> tuple[dict[str, Any], list[dict[str, Any]], Any | None]:
    started = time.perf_counter()
    valid: list[dict[str, Any]] = []
    invalid: list[dict[str, str]] = []
    zero_byte: list[str] = []
    bounds_groups: dict[tuple[float, ...], list[str]] = defaultdict(list)
    crs_counts: Counter[str] = Counter()
    resolution_counts: Counter[tuple[float, float]] = Counter()
    total_bytes = 0

    for path in sorted(paths):
        try:
            size = path.stat().st_size
            total_bytes += size
            if size == 0:
                zero_byte.append(str(path))
                raise ValueError("zero-byte file")
            with rasterio.open(path) as source:
                if source.count < 3 or source.width <= 0 or source.height <= 0:
                    raise ValueError("not a readable RGB raster")
                # Reading one tiny overview/window detects many truncated files
                # without spending hours hashing or decoding the whole corpus.
                source.read(1, window=rasterio.windows.Window(0, 0, 1, 1))
                bounds = tuple(float(value) for value in source.bounds)
                crs = str(source.crs)
                resolution = (
                    round(abs(float(source.transform.a)), 9),
                    round(abs(float(source.transform.e)), 9),
                )
                item = {
                    "path": str(path.resolve()),
                    "bytes": size,
                    "mtime_ns": path.stat().st_mtime_ns,
                    "width": source.width,
                    "height": source.height,
                    "bands": source.count,
                    "crs": crs,
                    "resolution": list(resolution),
                    "bounds": list(bounds),
                }
                valid.append(item)
                bounds_groups[bounds].append(str(path.resolve()))
                crs_counts[crs] += 1
                resolution_counts[resolution] += 1
        except Exception as exc:
            invalid.append({"path": str(path), "error": str(exc)})

    polygons = [box(*item["bounds"]) for item in valid]
    coverage = unary_union(polygons) if polygons else None
    duplicate_bounds = [members for members in bounds_groups.values() if len(members) > 1]
    overlap_anomalies = []
    if polygons:
        tree = STRtree(polygons)
        for left_index, polygon in enumerate(polygons):
            for right_index in tree.query(polygon, predicate="intersects"):
                right_index = int(right_index)
                if right_index <= left_index:
                    continue
                overlap_area = float(polygon.intersection(polygons[right_index]).area)
                if overlap_area > 0.01:
                    overlap_anomalies.append({
                        "left": valid[left_index]["path"],
                        "right": valid[right_index]["path"],
                        "area_m2": overlap_area,
                    })
    representative_hashes = {}
    for item in ([valid[0], valid[len(valid) // 2], valid[-1]] if valid else []):
        path = Path(item["path"])
        digest = hashlib.sha256()
        with path.open("rb") as source:
            digest.update(source.read(4 * 1024 * 1024))
        representative_hashes[path.name] = {
            "algorithm": "sha256-first-4MiB", "digest": digest.hexdigest()
        }

    if coverage is None:
        aggregate_bounds = None
        internal_holes = 0
        components = 0
    else:
        aggregate_bounds = [float(value) for value in coverage.bounds]
        geoms = list(coverage.geoms) if hasattr(coverage, "geoms") else [coverage]
        internal_holes = sum(len(getattr(geom, "interiors", ())) for geom in geoms)
        components = len(geoms)

    summary = {
        "path_glob_count": len(paths),
        "valid_count": len(valid),
        "invalid_count": len(invalid),
        "invalid": invalid,
        "zero_byte": zero_byte,
        "total_bytes": total_bytes,
        "coverage_bounds": aggregate_bounds,
        "coverage_components": components,
        "internal_holes": internal_holes,
        "duplicate_bounds": duplicate_bounds,
        "overlap_anomalies": overlap_anomalies,
        "crs_counts": dict(crs_counts),
        "resolution_counts": {f"{key[0]}x{key[1]}": value for key, value in resolution_counts.items()},
        "representative_hashes": representative_hashes,
        "metadata_validation_seconds": time.perf_counter() - started,
    }
    return summary, valid, coverage


def gpu_descriptor() -> dict[str, Any]:
    query = run_text([
        "nvidia-smi", "--query-gpu=name,driver_version,memory.total,memory.free",
        "--format=csv,noheader,nounits",
    ]) if shutil.which("nvidia-smi") else ""
    parts = [part.strip() for part in query.split(",")] if query else []
    return {
        "available": len(parts) >= 4,
        "model": parts[0] if len(parts) >= 4 else None,
        "driver": parts[1] if len(parts) >= 4 else None,
        "vram_total_mib": int(parts[2]) if len(parts) >= 4 else None,
        "vram_free_mib": int(parts[3]) if len(parts) >= 4 else None,
        "runtime": run_text(["nvidia-smi"]).split("CUDA Version:")[-1].split()[0]
        if query and "CUDA Version:" in run_text(["nvidia-smi"]) else None,
        "nvcc": run_text(["nvcc", "--version"]).splitlines()[-1] if shutil.which("nvcc") else None,
    }


def filesystem_descriptor(path: Path) -> dict[str, Any]:
    existing = path
    while not existing.exists() and existing != existing.parent:
        existing = existing.parent
    usage = shutil.disk_usage(existing)
    return {
        "path": str(path.resolve()), "filesystem_path": str(existing.resolve()),
        "filesystem_type": run_text(["findmnt", "-no", "FSTYPE", "-T", str(existing)]),
        "total_bytes": usage.total, "free_bytes": usage.free,
    }


def native_versions() -> dict[str, Any]:
    return {
        "gdal": getattr(rasterio, "__gdal_version__", None),
        "proj": pyproj.proj_version_str,
        "pillow_webp": pillow_features.version("webp"),
        "pillow_jpeg": pillow_features.version("jpg"),
    }


def select_geometry(coverage: Any, dem: dict[str, Any]) -> tuple[Any | None, list[dict[str, Any]]]:
    if coverage is None:
        return None, []
    intersection = coverage.intersection(box(*dem["bounds"]))
    if intersection.is_empty:
        return intersection, []
    candidates = enumerate_gosper_islands_for_bbox(intersection.bounds)
    selected = []
    with rasterio.open(dem["path"]) as dem_source:
        for info in candidates:
            if not info["poly"].intersects(intersection):
                continue
            window = rasterio.windows.from_bounds(*info["bounds"], dem_source.transform)
            try:
                window = window.intersection(
                    rasterio.windows.Window(0, 0, dem_source.width, dem_source.height)
                )
            except rasterio.errors.WindowError:
                continue
            if window.width <= 0 or window.height <= 0:
                continue
            sample = dem_source.read(
                1, window=window,
                out_shape=(
                    min(64, max(1, int(window.height))),
                    min(64, max(1, int(window.width))),
                ),
                resampling=rasterio.enums.Resampling.nearest, masked=True,
            )
            values = sample.compressed()
            if values.size == 0 or not ((values > -500.0) & (values < 9000.0)).any():
                continue
            selected.append({
                "yq": int(info["latQ"]), "yr": int(info["latR"]),
                "center": [float(info["centerX"]), float(info["centerY"])],
                "bounds": [float(value) for value in info["bounds"]],
                "status": "pending", "attempts": 0, "uploaded": False,
                "last_error": None, "timings": {},
            })
    return intersection, selected


def conservative_pages(geometry: list[dict[str, Any]]) -> list[dict[str, Any]]:
    pages = set()
    geom = coord_util.gosper_tile_geometry()
    half_x = float(geom["render_half_x_m"])
    half_y = float(geom["render_half_y_m"])
    for tile in geometry:
        x, y = tile["center"]
        pages.update(pages_for_bounds((x - half_x, y - half_y, x + half_x, y + half_y)))
    return [{
        "page_x": page.page_x, "page_y": page.page_y,
        "bounds": [float(value) for value in page.bounds],
        "status": "pending", "attempts": 0, "uploaded": False,
        "last_error": None, "timings": {},
    } for page in sorted(pages, key=lambda item: item.key)]


def estimate_output(
    geometry_count: int, page_count: int, texture_workers: int,
    dem: dict[str, Any] | None = None,
) -> dict[str, int]:
    # Rechner baseline, production 8x6: 280 KiB/GSP and ~6 MiB/page.  The
    # temporary estimate includes one uncompressed 4096 RGB image per worker.
    geometry_bytes = geometry_count * 300_000
    page_bytes = page_count * 6_500_000
    final_bytes = geometry_bytes + page_bytes
    texture_temporary_peak = texture_workers * 96 * 1024 * 1024 + 2 * GIB
    # The reusable 2x, two-band Float32 gradient is block-compressed on disk.
    # Reserve half the raw size (historically ~14 GiB) plus 25% instead of the
    # old generic five-gigabyte warning.
    gradient_cache_bytes = 0
    if dem:
        gradient_raw = int(dem["width"]) * int(dem["height"]) * 4 * 4 * 2
        gradient_cache_bytes = int(gradient_raw * 0.625)
    temporary_peak = texture_temporary_peak + gradient_cache_bytes
    return {
        "final_bytes": final_bytes,
        "temporary_peak_bytes": temporary_peak,
        "external_temp_peak_bytes": 512 * 1024 * 1024,
        "gradient_cache_bytes": gradient_cache_bytes,
        "required_free_bytes_with_margin": int((final_bytes + temporary_peak) * 1.5),
    }


def dependency_versions() -> dict[str, str | None]:
    versions = {}
    for package in ("python", "numpy", "rasterio", "shapely", "pyproj", "pillow", "scipy", "psutil"):
        if package == "python":
            versions[package] = platform.python_version()
            continue
        try:
            versions[package] = importlib.metadata.version(package)
        except importlib.metadata.PackageNotFoundError:
            versions[package] = None
    return versions


def aws_credentials_available() -> tuple[bool, str]:
    if not shutil.which("aws"):
        return False, "aws CLI not found"
    result = subprocess.run(
        ["aws", "sts", "get-caller-identity"], text=True, capture_output=True, check=False
    )
    return result.returncode == 0, (result.stdout or result.stderr).strip()


def build_preflight(args: argparse.Namespace) -> tuple[dict[str, Any], dict[str, Any] | None]:
    repo = args.repo.resolve()
    profile = execution_profile(args.execution_profile)
    now = dt.datetime.now(dt.timezone.utc).isoformat()
    failures: list[str] = []
    warnings: list[str] = []
    git = git_state(repo)
    if git["dirty"] and not args.allow_dirty:
        failures.append("runtime repository is dirty")
    if git["commit"] != run_text(["git", "rev-parse", "origin/master"], cwd=repo):
        warnings.append("runtime commit differs from origin/master")

    aerial_paths = [Path(path) for path in sorted(glob.glob(str(args.aerial_dir / "*.tif")))]
    aerial, valid_sources, coverage = inspect_aerial_sources(aerial_paths)
    known_source_inventory = None
    if not aerial_paths:
        failures.append(f"source TIFs are absent from {args.aerial_dir}")
    if aerial["invalid_count"]:
        failures.append(f"{aerial['invalid_count']} source TIFs are invalid")
    if set(aerial["crs_counts"]) - {"EPSG:31254"}:
        failures.append(f"source TIF CRS is incompatible: {aerial['crs_counts']}")
    unexpected_resolutions = [
        resolution for resolution in aerial["resolution_counts"]
        if resolution != "0.2x0.2"
    ]
    if unexpected_resolutions:
        failures.append(f"source TIF pixel size is unexpected: {unexpected_resolutions}")
    if aerial["duplicate_bounds"]:
        failures.append(f"source corpus has {len(aerial['duplicate_bounds'])} duplicate bounds")
    if aerial["overlap_anomalies"]:
        warnings.append(
            f"source corpus has {len(aerial['overlap_anomalies'])} positive-area overlaps"
        )
    if profile.require_full_corpus and (
        aerial["valid_count"] != EXPECTED_FULL_CORPUS_FILES
        or aerial["total_bytes"] != EXPECTED_FULL_CORPUS_BYTES
    ):
        failures.append(
            "rechner-big requires the complete Tirol corpus "
            f"(expected {EXPECTED_FULL_CORPUS_FILES} files / {EXPECTED_FULL_CORPUS_BYTES} bytes; "
            f"found {aerial['valid_count']} / {aerial['total_bytes']})"
        )
    if profile.require_full_corpus:
        if not args.source_inventory.is_file():
            failures.append(f"audited source inventory is absent: {args.source_inventory}")
        else:
            try:
                known_source_inventory = compare_known_source_inventory(
                    args.source_inventory, valid_sources, verify_hashes=True
                )
                if not known_source_inventory["matches"]:
                    failures.append(
                        "source corpus does not match the audited filename/size/hash inventory"
                    )
            except Exception as exc:
                failures.append(f"audited source inventory is invalid: {exc}")

    dem = None
    if not args.dem.is_file():
        failures.append(f"DEM is absent: {args.dem}")
    else:
        try:
            dem = raster_descriptor(args.dem)
            if dem["crs"] != "EPSG:31254":
                failures.append(f"DEM CRS is incompatible: {dem['crs']}")
        except Exception as exc:
            failures.append(f"DEM is unreadable: {exc}")
    expected_intersection, geometry = select_geometry(coverage, dem) if dem else (None, [])
    if coverage is not None and expected_intersection is not None and expected_intersection.is_empty:
        failures.append("DEM does not intersect useful imagery coverage")
    pages = conservative_pages(geometry)

    basisu = None
    try:
        basisu = resolve_basisu_binary()
        verify_basisu_xuastc(basisu, DEFAULT_TEXTURE_ENCODING_PROFILE)
    except Exception as exc:
        failures.append(f"BasisU is incompatible or absent: {exc}")

    upload_enabled = profile.progressive_upload and not args.no_upload
    aws_ok, aws_detail = aws_credentials_available() if upload_enabled else (False, "disabled")
    if upload_enabled and not aws_ok:
        failures.append(f"AWS credentials unavailable while upload is enabled: {aws_detail}")
    if not args.no_publish and (not shutil.which("node") or not shutil.which("npm")):
        failures.append("final publication requires node and npm")
    systemd_state = run_text(["systemctl", "--user", "is-system-running"]) if shutil.which("systemctl") else "absent"
    if args.execution_profile == "rechner-big" and systemd_state not in {"running", "degraded"}:
        failures.append(f"durable user systemd is unavailable: {systemd_state}")

    output_fs = filesystem_descriptor(args.output_root)
    temp_fs = filesystem_descriptor(args.temp_dir)
    estimate = estimate_output(len(geometry), len(pages), profile.texture_workers, dem)
    if output_fs["free_bytes"] < estimate["required_free_bytes_with_margin"]:
        failures.append("output disk is insufficient for estimated final+temporary bytes and safety margin")
    if temp_fs["free_bytes"] < estimate["external_temp_peak_bytes"]:
        failures.append("temporary disk is insufficient for preflight/release staging")

    memory = psutil.virtual_memory()
    physical_cores = psutil.cpu_count(logical=False)
    logical_cores = psutil.cpu_count(logical=True)
    if memory.total < (profile.ram_limit_gib + profile.reserve_ram_gib) * GIB * 0.9:
        failures.append("selected profile cannot retain its RAM limit plus OS reserve")

    encoding = {
        tier["name"]: texture_encoding_for_tier(DEFAULT_TEXTURE_ENCODING_PROFILE, tier["name"])
        for tier in TEXTURE_TIERS
    }
    dependencies = dependency_versions()
    missing_dependencies = [name for name, version in dependencies.items() if version is None]
    if missing_dependencies:
        failures.append(f"required Python dependencies are absent: {missing_dependencies}")
    report = {
        "schema_version": 1, "created_at": now, "passed": not failures,
        "failures": failures, "warnings": warnings, "git": git,
        "execution_profile": profile.descriptor(), "release_profile": args.release_profile,
        "python_environment": {
            "versions": dependencies, "pixi": run_text(["pixi", "--version"]),
            "pixi_manifest": os.environ.get("PIXI_PROJECT_MANIFEST"),
            "pixi_lock_sha256": hashlib.sha256((repo / "pixi.lock").read_bytes()).hexdigest()
            if (repo / "pixi.lock").is_file() else None,
            "native_versions": native_versions(),
        },
        "machine": {
            "os": platform.platform(), "cpu_model": run_text(["bash", "-lc", "lscpu | sed -n 's/^Model name:[[:space:]]*//p'"]),
            "physical_cores": physical_cores, "logical_cores": logical_cores,
            "ram_total_bytes": memory.total, "ram_available_bytes": memory.available,
            "gpu": gpu_descriptor(),
            "user_systemd": systemd_state,
        },
        "filesystems": {"output": output_fs, "temporary": temp_fs},
        "aerial": aerial, "known_source_inventory": known_source_inventory, "dem": dem,
        "expected_intersection_bounds": (
            [float(value) for value in expected_intersection.bounds]
            if expected_intersection is not None and not expected_intersection.is_empty else None
        ),
        "basisu": {"path": basisu, "version": run_text([basisu, "-version"]) if basisu else None},
        "inventory_counts": {"geometry_islands": len(geometry), "texture_pages_conservative": len(pages)},
        "estimate": estimate,
        "workers": profile.descriptor(),
        "texture": {
            "page_size_m": 1024, "bootstrap_px": TEXTURE_BOOTSTRAP_SIZE,
            "encoding_profile": DEFAULT_TEXTURE_ENCODING_PROFILE, "encoding": encoding,
            "tattoos": False,
        },
        "publication": {
            "bucket": args.bucket, "prefix": args.prefix,
            "progressive_upload": upload_enabled, "final_publication": not args.no_publish,
            "aws_credentials": aws_ok, "aws_detail": aws_detail,
        },
        "cuda_decision": {
            "enabled": False,
            "reason": "Baseline bottleneck is CPU BasisU encoding; no apples-to-apples CUDA benefit measured.",
        },
    }
    inventory = None
    if not failures:
        inventory = {
            "schema_version": SCHEMA_VERSION,
            "run_id": args.run_id, "release_id": args.run_id,
            "created_at": now, "git_commit": git["commit"],
            "execution_profile": profile.descriptor(), "release_profile": args.release_profile,
            "output_root": str(args.output_root.resolve()),
            "sources": {
                "aerial_dir": str(args.aerial_dir.resolve()), "aerial": aerial,
                "aerial_files": valid_sources, "dem": dem,
                "intersection_bounds": report["expected_intersection_bounds"],
            },
            "geometry_recipe": {"version": BAKER_VERSION, "format": "GSP3"},
            "texture_recipe": {
                "version": texture_page_cache_version(
                    False, DEFAULT_TEXTURE_ENCODING_PROFILE, PRODUCTION_ENCODING_EFFORT
                ),
                "contract_version": TEXTURE_PAGE_RECIPE_VERSION,
                "encoding_profile": DEFAULT_TEXTURE_ENCODING_PROFILE,
                "encoding_effort": PRODUCTION_ENCODING_EFFORT, "diagnostic_tattoos": False,
                "bootstrap_px": TEXTURE_BOOTSTRAP_SIZE,
                "tiers": {tier["name"]: tier["size_px"] for tier in TEXTURE_TIERS},
            },
            "geometry": geometry, "texture_pages": pages, "progress": {},
            "milestones": {"preflight_passed": now},
            "publication": report["publication"], "estimate": estimate,
            "preflight_report": str(args.report.resolve()),
        }
        refresh_progress(inventory)
    return report, inventory


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    repo = Path(__file__).resolve().parents[1]
    parser.add_argument("--repo", type=Path, default=repo)
    parser.add_argument("--execution-profile", choices=tuple(EXECUTION_PROFILES), required=True)
    parser.add_argument("--release-profile", default="production-tirol")
    parser.add_argument("--run-id", required=True)
    parser.add_argument("--aerial-dir", type=Path, default=repo / "hex_backend/aerial_tifs")
    parser.add_argument(
        "--source-inventory", type=Path,
        default=repo / "hex_backend/aerial_source_inventory.tsv",
    )
    parser.add_argument("--dem", type=Path, default=repo / "hex_backend/DGM_Tirol_5m_epsg31254_2006_2020.tif")
    parser.add_argument("--output-root", type=Path, required=True)
    parser.add_argument("--temp-dir", type=Path, default=Path(os.environ.get("TMPDIR", "/tmp")))
    parser.add_argument("--report", type=Path, required=True)
    parser.add_argument("--inventory", type=Path, required=True)
    parser.add_argument("--bucket", default=DEFAULT_BUCKET)
    parser.add_argument("--prefix", default=DEFAULT_PREFIX)
    parser.add_argument("--no-upload", action="store_true")
    parser.add_argument("--no-publish", action="store_true")
    parser.add_argument("--allow-dirty", action="store_true", help="test/benchmark only; production start forbids this")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    report, inventory = build_preflight(args)
    write_json_atomic(args.report, report)
    print(json.dumps(report, indent=2, sort_keys=True))
    if inventory is not None:
        write_json_atomic(args.inventory, inventory)
        print(f"authoritative inventory: {args.inventory.resolve()}")
    else:
        print(f"preflight failed; report recorded at {args.report.resolve()}", file=sys.stderr)
    return 0 if report["passed"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
