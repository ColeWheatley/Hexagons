#!/usr/bin/env python3
"""Execute one preflighted, inventory-isolated Hexagons production bake."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
import sys
import time
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

import rasterio

import bake_inventory
import generate_manifest
import waffle_iron as waffle
from bake_preflight import EXPECTED_FULL_CORPUS_BYTES, EXPECTED_FULL_CORPUS_FILES
from gosper_texture_page_adapter import exact_pages_for_tiles
from progressive_upload import ProgressiveUploadSpool

SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))
import release_publish


_GEOMETRY_CONTEXT = {}


def _init_geometry_worker(dem_path: str, gradient_path: str, output_dir: str) -> None:
    global _GEOMETRY_CONTEXT
    waffle.S3_ENABLED = False
    _GEOMETRY_CONTEXT = {
        "dem": rasterio.open(dem_path),
        "gradient": rasterio.open(gradient_path),
        "output_dir": output_dir,
    }


def _geometry_worker(key: tuple[int, int]) -> tuple[tuple[int, int], bool, dict[str, float]]:
    wrote, timings = waffle.bake_gosper_binary(
        key[0], key[1], _GEOMETRY_CONTEXT["dem"], _GEOMETRY_CONTEXT["gradient"],
        output_dir=_GEOMETRY_CONTEXT["output_dir"], return_timings=True,
    )
    return key, wrote, timings


def _git_commit(repo: Path) -> str:
    return subprocess.run(
        ["git", "rev-parse", "HEAD"], cwd=repo, text=True,
        capture_output=True, check=True,
    ).stdout.strip()


def _assert_pushed_clean_production_revision(repo: Path) -> None:
    status = subprocess.run(
        ["git", "status", "--porcelain=v1", "--untracked-files=no"], cwd=repo,
        text=True, capture_output=True, check=True,
    ).stdout.strip()
    if status:
        raise RuntimeError("production runtime checkout has tracked changes")
    branch = subprocess.run(
        ["git", "branch", "--show-current"], cwd=repo,
        text=True, capture_output=True, check=True,
    ).stdout.strip()
    remote = f"origin/{branch}"
    subprocess.run(["git", "rev-parse", "--verify", remote], cwd=repo, check=True, capture_output=True)
    result = subprocess.run(
        ["git", "merge-base", "--is-ancestor", "HEAD", remote], cwd=repo,
        check=False,
    )
    if result.returncode:
        raise RuntimeError(f"production runtime commit has not been pushed to {remote}")


def validate_runtime_inventory(inventory: dict) -> None:
    recipe = inventory["texture_recipe"]
    if inventory["release_profile"] == "production-tirol":
        required_tiers = {"low": 128, "medium": 256, "high": 4096}
        if inventory["execution_profile"]["name"] != "rechner-big":
            raise ValueError("production-tirol requires execution profile rechner-big")
        if recipe.get("encoding_profile") != "production" or recipe.get("encoding_effort") != 4:
            raise ValueError("production-tirol requires the sweep-verified production effort-4 recipe")
        if recipe.get("diagnostic_tattoos"):
            raise ValueError("production-tirol forbids diagnostic tattoos")
        if recipe.get("bootstrap_px") != waffle.TEXTURE_BOOTSTRAP_SIZE or recipe.get("tiers") != required_tiers:
            raise ValueError(
                f"production-tirol texture transaction must be WebP{waffle.TEXTURE_BOOTSTRAP_SIZE} "
                "plus 128/256/4096 tiers"
            )
        aerial = inventory["sources"]["aerial"]
        if (
            aerial.get("valid_count") != EXPECTED_FULL_CORPUS_FILES
            or aerial.get("total_bytes") != EXPECTED_FULL_CORPUS_BYTES
        ):
            raise ValueError("production-tirol inventory does not describe the complete source corpus")


def verify_inventory_sources(inventory: dict) -> None:
    changed = []
    for source in inventory["sources"].get("aerial_files", []):
        path = Path(source["path"])
        try:
            stat = path.stat()
            if (
                stat.st_size != int(source["bytes"])
                or (source.get("mtime_ns") is not None and stat.st_mtime_ns != int(source["mtime_ns"]))
            ):
                changed.append(str(path))
        except OSError:
            changed.append(str(path))
        if len(changed) >= 8:
            break
    dem = inventory["sources"]["dem"]
    dem_path = Path(dem["path"])
    if not dem_path.is_file() or dem_path.stat().st_size != int(dem["bytes"]):
        changed.append(str(dem_path))
    if changed:
        raise RuntimeError(f"preflighted source inventory changed or disappeared: {changed}")


def _gradient_cache_path(repo: Path, dem: Path) -> Path:
    stat = dem.stat()
    identity = hashlib.sha256(
        f"{dem.resolve()}:{stat.st_size}:{stat.st_mtime_ns}:upsample=2".encode()
    ).hexdigest()[:20]
    return repo / "local_data" / "cache" / "gradients" / identity / "gradient-2x.tif"


def _geometry_marker(output_dir: Path, key: tuple[int, int]) -> Path:
    return output_dir / ".recipes" / f"gosper_{key[0]}_{key[1]}.txt"


def _write_marker(path: Path, value: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    try:
        with temporary.open("w", encoding="utf-8") as target:
            target.write(value + "\n")
            target.flush()
            os.fsync(target.fileno())
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)


def _geometry_is_current(output_dir: Path, key: tuple[int, int], recipe: str) -> bool:
    path = output_dir / waffle.gosper_asset_name(key[0], key[1], "bin")
    marker = _geometry_marker(output_dir, key)
    if not path.is_file() or not marker.is_file() or marker.read_text().strip() != recipe:
        return False
    try:
        validity = waffle.read_gsp_unit_valid(path)
        return bool(validity.any())
    except Exception:
        return False


def _run_geometry(
    inventory_path: Path, inventory: dict, dem_path: Path, gradient_path: Path,
    output_dir: Path, on_completed=None,
) -> None:
    profile = inventory["execution_profile"]
    recipe = inventory["geometry_recipe"]["version"]
    output_dir.mkdir(parents=True, exist_ok=True)
    pending: list[tuple[int, int]] = []
    for item in inventory["geometry"]:
        key = (int(item["yq"]), int(item["yr"]))
        if _geometry_is_current(output_dir, key, recipe):
            item["status"] = "complete"
            item["last_error"] = None
        else:
            item["status"] = "pending"
            pending.append(key)
    bake_inventory.refresh_progress(inventory)
    bake_inventory.write_json_atomic(inventory_path, inventory)
    if not pending:
        print("geometry: all inventory units already complete and verified")
        return

    workers = min(int(profile["geometry_workers"]), len(pending))
    print(f"geometry: {len(pending)} pending, {workers} persistent workers")
    attempts = {key: 0 for key in pending}
    with ProcessPoolExecutor(
        max_workers=workers,
        initializer=_init_geometry_worker,
        initargs=(str(dem_path), str(gradient_path), str(output_dir)),
    ) as executor:
        futures = {}
        for key in pending:
            bake_inventory.mark_unit(inventory, "geometry", key, "running")
            futures[executor.submit(_geometry_worker, key)] = key
        bake_inventory.write_json_atomic(inventory_path, inventory)
        while futures:
            future = next(as_completed(futures))
            key = futures.pop(future)
            try:
                _key, wrote, timings = future.result()
                if not wrote:
                    reason = "exact DEM unit sampling contains no valid samples"
                    bake_inventory.exclude_empty_geometry(inventory, key, reason=reason)
                    print(f"geometry {key[0]},{key[1]} excluded: {reason}")
                    bake_inventory.write_json_atomic(inventory_path, inventory)
                    continue
                _write_marker(_geometry_marker(output_dir, key), recipe)
                bake_inventory.mark_unit(
                    inventory, "geometry", key, "complete", timings=timings
                )
                if on_completed is not None:
                    on_completed(key)
                print(f"geometry {key[0]},{key[1]} complete in {timings['total']:.2f}s")
            except Exception as exc:
                attempts[key] += 1
                if attempts[key] <= 2:
                    bake_inventory.mark_unit(
                        inventory, "geometry", key, "retrying", error=str(exc)
                    )
                    bake_inventory.mark_unit(inventory, "geometry", key, "running")
                    futures[executor.submit(_geometry_worker, key)] = key
                    print(f"geometry {key} retry {attempts[key]}/2: {exc}")
                else:
                    bake_inventory.mark_unit(
                        inventory, "geometry", key, "failed", error=str(exc)
                    )
                    bake_inventory.write_json_atomic(inventory_path, inventory)
                    raise
            bake_inventory.write_json_atomic(inventory_path, inventory)


def _exact_pages_and_tiles(inventory: dict, binary_dir: Path):
    expected = bake_inventory.geometry_keys(inventory)
    tiles = generate_manifest.scan_binary_tiles(
        str(binary_dir), expected_tiles=expected, reject_unexpected=True
    )
    unit_valid = {
        (tile["yq"], tile["yr"]): waffle.read_gsp_unit_valid(
            binary_dir / waffle.gosper_asset_name(tile["yq"], tile["yr"], "bin")
        )
        for tile in tiles
    }
    geom = waffle.coord_util.gosper_tile_geometry()
    pages = exact_pages_for_tiles(
        tiles, float(geom["render_half_x_m"]), float(geom["render_half_y_m"]), unit_valid
    )
    return tiles, pages


def run(inventory_path: Path) -> None:
    inventory = bake_inventory.load_inventory(inventory_path)
    validate_runtime_inventory(inventory)
    verify_inventory_sources(inventory)
    repo = Path(__file__).resolve().parents[1]
    if inventory["release_profile"] == "production-tirol":
        _assert_pushed_clean_production_revision(repo)
    if _git_commit(repo) != inventory["git_commit"]:
        raise RuntimeError("runtime checkout does not match the preflighted git commit")
    inventory.setdefault("milestones", {}).setdefault(
        "full_run_launched", time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    )
    bake_inventory.write_json_atomic(inventory_path, inventory)
    output_root = Path(inventory["output_root"])
    app_root = output_root / "app"
    binary_dir = app_root / "tiles_bin"
    texture_dir = app_root / "aerial_pages"
    manifest_path = app_root / "tile_manifest.json"
    dem_path = Path(inventory["sources"]["dem"]["path"])
    aerial_dir = Path(inventory["sources"]["aerial_dir"])

    waffle.BASISU_BINARY = waffle.resolve_basisu_binary()
    waffle.verify_basisu_xuastc(
        waffle.BASISU_BINARY, inventory["texture_recipe"]["encoding_profile"]
    )
    gradient_path = _gradient_cache_path(repo, dem_path)
    gradient_path.parent.mkdir(parents=True, exist_ok=True)
    gradient = waffle.get_or_create_gradient_map(str(dem_path), str(gradient_path), upsample_factor=2)
    gradient.close()

    publication = inventory.get("publication", {})
    uploader = None
    if publication.get("progressive_upload"):
        store = release_publish.AwsStore(publication["bucket"], publication["prefix"])
        uploader = ProgressiveUploadSpool(
            output_root / "upload_spool", store, inventory["release_id"],
            workers=int(inventory["execution_profile"]["upload_workers"]),
        )
        retried = uploader.retry_failed()
        if retried:
            print(f"upload: requeued {retried} durable failures")
        uploader.start()

    def geometry_completed(key):
        if uploader is None:
            return
        filename = waffle.gosper_asset_name(key[0], key[1], "bin")
        uploader.spool("geometry", key, [{
            "local": str(binary_dir / filename),
            "logical": f"tiles_bin/{filename}",
        }])

    _run_geometry(
        inventory_path, inventory, dem_path, gradient_path, binary_dir,
        on_completed=geometry_completed,
    )
    inventory = bake_inventory.load_inventory(inventory_path)
    if uploader:
        for item in inventory["geometry"]:
            if item.get("status") != "complete" or item.get("uploaded"):
                continue
            key = (int(item["yq"]), int(item["yr"]))
            geometry_completed(key)
    tiles, exact_pages = _exact_pages_and_tiles(inventory, binary_dir)
    bake_inventory.replace_texture_pages(inventory, exact_pages)
    recipe = inventory["texture_recipe"]["version"]
    for item in inventory["texture_pages"]:
        page = next(
            page for page in exact_pages
            if (page.page_x, page.page_y) == (item["page_x"], item["page_y"])
        )
        if waffle.texture_page_is_current(page, recipe, str(texture_dir)):
            item["status"] = "complete"
    bake_inventory.refresh_progress(inventory)
    bake_inventory.write_json_atomic(inventory_path, inventory)

    def page_completed(page, _paths, _padding, timings):
        bake_inventory.mark_unit(
            inventory, "texture_pages", (page.page_x, page.page_y), "complete", timings=timings
        )
        bake_inventory.write_json_atomic(inventory_path, inventory)
        if uploader:
            key = (page.page_x, page.page_y)
            uploader.spool("texture_pages", key, [
                {
                    "local": str(Path(path)),
                    "logical": (
                        f"aerial_pages/bootstrap/{Path(path).name}"
                        if tier == "bootstrap"
                        else f"aerial_pages/{tier}/{Path(path).name}"
                    ),
                }
                for tier, path in _paths.items()
            ])

    results = waffle.bake_global_texture_pages(
        force=False,
        texture_tattoos=False,
        output_dir=str(texture_dir),
        encoding_profile=inventory["texture_recipe"]["encoding_profile"],
        encoding_effort=inventory["texture_recipe"]["encoding_effort"],
        tiles=tiles,
        binary_dir=str(binary_dir),
        aerial_dir=str(aerial_dir),
        workers=int(inventory["execution_profile"]["texture_workers"]),
        max_retries=2,
        on_page_result=page_completed,
        tif_paths=[item["path"] for item in inventory["sources"]["aerial_files"]],
    )
    inventory = bake_inventory.load_inventory(inventory_path)
    for item in inventory["texture_pages"]:
        if item.get("status") != "complete":
            raise RuntimeError(f"texture page inventory is incomplete: {item}")
    if uploader:
        # Cached complete pages were not observed by the bake callback, so add
        # their durable jobs here before draining the independent queue.
        for item in inventory["texture_pages"]:
            if item.get("uploaded"):
                continue
            page = next(
                page for page in exact_pages
                if (page.page_x, page.page_y) == (item["page_x"], item["page_y"])
            )
            paths = waffle.texture_page_asset_paths(page, str(texture_dir))
            uploader.spool("texture_pages", (page.page_x, page.page_y), [
                {
                    "local": str(Path(path)),
                    "logical": (
                        f"aerial_pages/bootstrap/{Path(path).name}"
                        if tier == "bootstrap"
                        else f"aerial_pages/{tier}/{Path(path).name}"
                    ),
                }
                for tier, path in paths.items()
            ])
        uploader.finish_and_wait()
        for task in uploader.completed_tasks():
            bake_inventory.mark_unit(
                inventory, task["collection"], tuple(task["key"]), "complete", uploaded=True
            )
        inventory["upload"] = uploader.status()
        bake_inventory.write_json_atomic(inventory_path, inventory)

    metadata = {
        "release_profile": inventory["release_profile"],
        "baker_version": inventory["geometry_recipe"]["version"],
        "texture_page_version": inventory["texture_recipe"]["version"],
        "texture_encoding_profile": inventory["texture_recipe"]["encoding_profile"],
        "texture_encoding_effort": inventory["texture_recipe"]["encoding_effort"],
        "texture_page_tattoos": False,
        "run_id": inventory["run_id"],
        "git_commit": inventory["git_commit"],
        "texture_page_boundary_padding": results["padding"],
    }
    generate_manifest.write_json_atomic(str(binary_dir / "metadata.json"), metadata)
    generate_manifest.generate_manifest(
        str(inventory_path), binary_dir=str(binary_dir), texture_page_dir=str(texture_dir),
        output_file=str(manifest_path), metadata_file=str(binary_dir / "metadata.json"),
    )
    if publication.get("final_publication"):
        site_dist = output_root / "site_dist"
        subprocess.run(
            ["npm", "ci"], cwd=repo / "frontend/app", check=True,
        )
        build_env = dict(os.environ)
        build_env.update({
            "HEXAGONS_MANIFEST_PATH": str(manifest_path),
            "HEXAGONS_DIST_DIR": str(site_dist),
        })
        subprocess.run(
            ["npm", "run", "build"], cwd=repo / "frontend/app", env=build_env, check=True,
        )
        subprocess.run([
            sys.executable, str(repo / "scripts/publish_site.py"),
            "--bucket", publication["bucket"], "--base-prefix", "hexagons",
            "--app-dist", str(site_dist),
        ], check=True)
        store = release_publish.AwsStore(publication["bucket"], publication["prefix"])
        published = release_publish.publish(
            manifest_path, app_root, store, release_override=inventory["release_id"]
        )
        inventory["published_release"] = published
        subprocess.run([
            sys.executable, str(repo / "scripts/verify_public_release.py")
        ], check=True)
        inventory["public_verification"] = {
            "status": "complete", "landing": "https://wheatley.cloud/hexagons/",
            "application": "https://wheatley.cloud/hexagons/app/",
        }
    inventory["manifest"] = {
        "status": "complete", "path": str(manifest_path),
        "bytes": manifest_path.stat().st_size,
    }
    inventory.setdefault("milestones", {})["manifest_validated"] = time.strftime(
        "%Y-%m-%dT%H:%M:%SZ", time.gmtime()
    )
    if inventory.get("public_verification", {}).get("status") == "complete":
        inventory["milestones"]["public_urls_verified"] = time.strftime(
            "%Y-%m-%dT%H:%M:%SZ", time.gmtime()
        )
    inventory["completed_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    bake_inventory.write_json_atomic(inventory_path, inventory)
    print(json.dumps(inventory["progress"], sort_keys=True))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--inventory", type=Path, required=True)
    args = parser.parse_args()
    run(args.inventory.resolve())


if __name__ == "__main__":
    main()
