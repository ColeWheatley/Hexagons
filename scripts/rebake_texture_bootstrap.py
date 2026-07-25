#!/usr/bin/env python3
"""Rebuild only WebP bootstrap pages from clean aerial sources.

This is the safe migration path for diagnostic mini-bakes: decoding low128
would inherit its green tattoo. KTX2 payloads are hashed before/after and are
never opened for write.
"""
from __future__ import annotations

import argparse
import glob
import hashlib
import json
import math
import os
import shutil
import sys
import tempfile
import time
from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "hex_backend"
sys.path.insert(0, str(BACKEND))

import coordinate_utility as coord_util  # noqa: E402
import generate_manifest  # noqa: E402
import waffle_iron as waffle  # noqa: E402
from gosper_texture_page_adapter import exact_pages_for_tiles  # noqa: E402
from texture_contract import (  # noqa: E402
    TEXTURE_BOOTSTRAP_SIZE,
    TEXTURE_BOOTSTRAP_WEBP_METHOD,
    TEXTURE_BOOTSTRAP_WEBP_QUALITY,
)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        while chunk := source.read(4 * 1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def ktx2_hashes(texture_dir: Path) -> dict[str, str]:
    return {
        str(path.relative_to(texture_dir)): sha256(path)
        for tier in ("low", "medium", "high")
        for path in sorted((texture_dir / tier).glob("texture_*.ktx2"))
    }


def build_context(binary_dir: Path, aerial_dir: Path):
    tiles = generate_manifest.scan_binary_tiles(binary_dir=str(binary_dir))
    if not tiles:
        raise RuntimeError(f"no valid GSP tiles in {binary_dir}")
    geom = coord_util.gosper_tile_geometry()
    half_x = float(geom["render_half_x_m"])
    half_y = float(geom["render_half_y_m"])
    tile_sources = {}
    for tile in tiles:
        path = binary_dir / waffle.gosper_asset_name(tile["yq"], tile["yr"], "bin")
        tile_sources[(tile["yq"], tile["yr"])] = {
            "label": f"gosper_{tile['yq']}_{tile['yr']}",
            "x": tile["x"],
            "y": tile["y"],
            "unit_valid": waffle.read_gsp_unit_valid(path),
        }
    pages = exact_pages_for_tiles(
        tiles,
        half_x,
        half_y,
        {key: source["unit_valid"] for key, source in tile_sources.items()},
    )
    sources_by_page = waffle.map_gosper_sources_to_texture_pages(
        pages, tiles, tile_sources, half_x, half_y,
    )
    tif_paths = sorted(glob.glob(str(aerial_dir / "*.tif")))
    all_tifs = sorted(
        waffle.load_tif_bounds(tif_paths, cache_dir=str(aerial_dir)),
        key=lambda source: source["path"],
    )
    aggregate_radius = (
        coord_util.gosper_level_size(coord_util.GOSPER_TILE_LEVEL)
        / math.sqrt(3.0)
        * coord_util.GOSPER_CAP_RENDER_OVERSCAN
    )
    valid_tifs = sorted(
        waffle.select_aerial_tifs_for_pages(all_tifs, pages, padding_m=aggregate_radius),
        key=lambda source: source["path"],
    )
    return pages, sources_by_page, valid_tifs, waffle.orthophoto_internal_holes(all_tifs)


def render_bootstrap(page, page_sources, valid_tifs, internal_holes, destination: Path,
                     tattoos: bool) -> dict:
    canvas, coverage, source_domain = waffle.composite_aerial_texture(page.bounds, valid_tifs)
    canvas, coverage, padding = waffle.pad_aggregate_boundary_overdraw(
        canvas,
        coverage,
        source_domain,
        page,
        page_sources,
        internal_holes,
        valid_tifs,
    )
    checked = waffle.validate_texture_page_geometry_coverage(coverage, page, page_sources)
    if checked == 0 and not np.any(coverage):
        raise RuntimeError(f"{page.asset_stem}: no geometry samples or aerial imagery")
    bootstrap = canvas.resize(
        (TEXTURE_BOOTSTRAP_SIZE, TEXTURE_BOOTSTRAP_SIZE),
        Image.Resampling.LANCZOS,
    )
    canvas.close()
    if tattoos:
        waffle.apply_texture_tattoo(bootstrap, page.bounds, "bootstrap")
    destination.parent.mkdir(parents=True, exist_ok=True)
    bootstrap.save(
        destination,
        "WEBP",
        quality=TEXTURE_BOOTSTRAP_WEBP_QUALITY,
        method=TEXTURE_BOOTSTRAP_WEBP_METHOD,
    )
    bootstrap.close()
    return padding


def verify_staged(staged: Path, pages) -> None:
    expected = {f"{page.asset_stem}.webp" for page in pages}
    found = {path.name for path in staged.glob("texture_*.webp")}
    if found != expected:
        raise RuntimeError(
            f"staged bootstrap set mismatch: missing={sorted(expected - found)[:8]} "
            f"unexpected={sorted(found - expected)[:8]}"
        )
    for path in staged.glob("texture_*.webp"):
        with Image.open(path) as image:
            if image.format != "WEBP" or image.size != (
                TEXTURE_BOOTSTRAP_SIZE, TEXTURE_BOOTSTRAP_SIZE,
            ):
                raise RuntimeError(f"invalid staged bootstrap {path}")


def promote(
    staged: Path,
    texture_dir: Path,
    pages,
    recipe: str,
    *,
    binary_dir: Path,
    metadata_path: Path,
    manifest_path: Path,
    metadata: dict,
) -> None:
    destination = texture_dir / "bootstrap"
    backup = staged.parent / "backup"
    backup.mkdir()
    webp_targets = [destination / f"{page.asset_stem}.webp" for page in pages]
    marker_targets = [
        Path(waffle.texture_page_recipe_marker_path(page, str(texture_dir)))
        for page in pages
    ]
    transaction_targets = [*webp_targets, *marker_targets, metadata_path, manifest_path]
    snapshots = {}
    for index, target in enumerate(transaction_targets):
        snapshot = backup / f"{index:04d}"
        if target.is_file():
            shutil.copy2(target, snapshot)
            snapshots[target] = snapshot
        else:
            snapshots[target] = None

    temporary_metadata = metadata_path.with_suffix(".json.tmp")
    try:
        destination.mkdir(parents=True, exist_ok=True)
        for page, live in zip(pages, webp_targets, strict=True):
            os.replace(staged / f"{page.asset_stem}.webp", live)
        for marker in marker_targets:
            waffle.write_texture_recipe_marker(marker, recipe)

        promoted_metadata = dict(metadata)
        promoted_metadata["texture_page_version"] = recipe
        promoted_metadata["texture_bootstrap_size_px"] = TEXTURE_BOOTSTRAP_SIZE
        promoted_metadata["last_page_bake"] = time.ctime()
        temporary_metadata.write_text(json.dumps(promoted_metadata, separators=(",", ":")) + "\n")
        os.replace(temporary_metadata, metadata_path)
        generate_manifest.generate_manifest(
            binary_dir=str(binary_dir),
            texture_page_dir=str(texture_dir),
            output_file=str(manifest_path),
            metadata_file=str(metadata_path),
        )
    except BaseException:
        temporary_metadata.unlink(missing_ok=True)
        for target, snapshot in snapshots.items():
            if snapshot is None:
                target.unlink(missing_ok=True)
            else:
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(snapshot, target)
        raise


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--app-dir", type=Path, default=ROOT / "frontend/app")
    parser.add_argument("--aerial-dir", type=Path, default=ROOT / "hex_backend/aerial_tifs")
    parser.add_argument("--promote", action="store_true", help="replace live WebPs after full validation")
    args = parser.parse_args()

    app_dir = args.app_dir.resolve()
    texture_dir = app_dir / "aerial_pages"
    binary_dir = app_dir / "tiles_bin"
    metadata_path = binary_dir / "metadata.json"
    manifest_path = app_dir / "tile_manifest.json"
    metadata = json.loads(metadata_path.read_text())
    tattoos = bool(metadata.get("texture_page_tattoos"))
    profile = metadata.get("texture_encoding_profile", "production")
    effort = metadata.get("texture_encoding_effort")
    recipe = waffle.texture_page_cache_version(tattoos, profile, effort)

    pages, sources_by_page, valid_tifs, internal_holes = build_context(binary_dir, args.aerial_dir)
    before_hashes = ktx2_hashes(texture_dir)
    started = time.perf_counter()
    with tempfile.TemporaryDirectory(prefix=".bootstrap64-", dir=texture_dir) as temporary:
        temp = Path(temporary)
        staged = temp / "staged"
        padding = {}
        for index, page in enumerate(pages, 1):
            padding[page.key] = render_bootstrap(
                page,
                sources_by_page[page.key],
                valid_tifs,
                internal_holes,
                staged / f"{page.asset_stem}.webp",
                tattoos,
            )
            print(f"[{index}/{len(pages)}] {page.asset_stem}", flush=True)
        verify_staged(staged, pages)
        if args.promote:
            promote(
                staged,
                texture_dir,
                pages,
                recipe,
                binary_dir=binary_dir,
                metadata_path=metadata_path,
                manifest_path=manifest_path,
                metadata=metadata,
            )

    after_hashes = ktx2_hashes(texture_dir)
    if before_hashes != after_hashes:
        raise RuntimeError("KTX2 hashes changed during bootstrap-only migration")
    elapsed = time.perf_counter() - started
    total_bytes = sum(path.stat().st_size for path in (texture_dir / "bootstrap").glob("*.webp"))
    print(
        f"bootstrap64 {'promoted' if args.promote else 'validated'}: "
        f"pages={len(pages)} bytes={total_bytes} elapsed={elapsed:.1f}s recipe={recipe}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
