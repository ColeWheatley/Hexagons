"""Durable, atomic authoritative inventory for one Hexagons bake run."""

from __future__ import annotations

import json
import os
import time
from pathlib import Path
from typing import Any, Iterable


SCHEMA_VERSION = 1


def write_json_atomic(path: str | Path, payload: dict[str, Any]) -> None:
    destination = Path(path).resolve()
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_name(f".{destination.name}.{os.getpid()}.tmp")
    try:
        with temporary.open("w", encoding="utf-8") as target:
            json.dump(payload, target, separators=(",", ":"), sort_keys=True)
            target.write("\n")
            target.flush()
            os.fsync(target.fileno())
        os.replace(temporary, destination)
    finally:
        temporary.unlink(missing_ok=True)


def load_inventory(path: str | Path) -> dict[str, Any]:
    source = Path(path).resolve()
    with source.open(encoding="utf-8") as handle:
        inventory = json.load(handle)
    validate_inventory(inventory)
    return inventory


def validate_inventory(inventory: dict[str, Any]) -> None:
    if inventory.get("schema_version") != SCHEMA_VERSION:
        raise ValueError("unsupported bake inventory schema")
    required = {
        "run_id", "release_id", "git_commit", "execution_profile",
        "release_profile", "output_root", "sources", "geometry_recipe", "texture_recipe",
        "geometry", "texture_pages", "progress",
    }
    missing = sorted(required - set(inventory))
    if missing:
        raise ValueError(f"bake inventory missing fields: {', '.join(missing)}")
    output_root = Path(inventory["output_root"])
    if not output_root.is_absolute():
        raise ValueError("bake inventory output_root must be absolute")
    tile_keys = [(int(item["yq"]), int(item["yr"])) for item in inventory["geometry"]]
    if len(tile_keys) != len(set(tile_keys)):
        raise ValueError("bake inventory has duplicate geometry islands")
    page_keys = [(int(item["page_x"]), int(item["page_y"])) for item in inventory["texture_pages"]]
    if len(page_keys) != len(set(page_keys)):
        raise ValueError("bake inventory has duplicate texture pages")


def geometry_keys(inventory: dict[str, Any], *, completed_only: bool = False) -> set[tuple[int, int]]:
    return {
        (int(item["yq"]), int(item["yr"]))
        for item in inventory["geometry"]
        if not completed_only or item.get("status") == "complete"
    }


def texture_page_keys(inventory: dict[str, Any], *, completed_only: bool = False) -> set[tuple[int, int]]:
    return {
        (int(item["page_x"]), int(item["page_y"]))
        for item in inventory["texture_pages"]
        if not completed_only or item.get("status") == "complete"
    }


def replace_texture_pages(
    inventory: dict[str, Any], pages: Iterable[Any], *, preserve_status: bool = True
) -> None:
    old = {
        (int(item["page_x"]), int(item["page_y"])): item
        for item in inventory.get("texture_pages", [])
    }
    entries = []
    for page in sorted(pages, key=lambda item: item.key):
        previous = old.get((page.page_x, page.page_y), {}) if preserve_status else {}
        entries.append({
            "page_x": int(page.page_x),
            "page_y": int(page.page_y),
            "bounds": [float(value) for value in page.bounds],
            "status": previous.get("status", "pending"),
            "attempts": int(previous.get("attempts", 0)),
            "uploaded": bool(previous.get("uploaded", False)),
            "last_error": previous.get("last_error"),
            "timings": previous.get("timings", {}),
        })
    inventory["texture_pages"] = entries
    refresh_progress(inventory)


def mark_unit(
    inventory: dict[str, Any], collection: str, key: tuple[int, int], status: str,
    *, error: str | None = None, timings: dict[str, float] | None = None,
    uploaded: bool | None = None,
) -> None:
    fields = ("yq", "yr") if collection == "geometry" else ("page_x", "page_y")
    for item in inventory[collection]:
        if (int(item[fields[0]]), int(item[fields[1]])) == key:
            item["status"] = status
            item["attempts"] = int(item.get("attempts", 0)) + (status == "running")
            item["last_error"] = error
            if timings is not None:
                item["timings"] = {name: round(float(value), 6) for name, value in timings.items()}
            if uploaded is not None:
                item["uploaded"] = bool(uploaded)
            refresh_progress(inventory)
            record_progress_milestones(inventory)
            return
    raise KeyError(f"{collection} unit {key} is not in the run inventory")


def exclude_empty_geometry(
    inventory: dict[str, Any], key: tuple[int, int], *, reason: str
) -> None:
    """Remove a source-selected island proven empty by exact DEM sampling."""
    for index, item in enumerate(inventory["geometry"]):
        if (int(item["yq"]), int(item["yr"])) != key:
            continue
        excluded = dict(item)
        excluded.update({"status": "excluded", "last_error": reason})
        inventory.setdefault("excluded_geometry", []).append(excluded)
        del inventory["geometry"][index]
        refresh_progress(inventory)
        return
    raise KeyError(f"geometry unit {key} is not in the run inventory")


def refresh_progress(inventory: dict[str, Any]) -> None:
    progress: dict[str, int] = {}
    for label, collection in (("geometry", "geometry"), ("pages", "texture_pages")):
        items = inventory.get(collection, [])
        progress[f"{label}_total"] = len(items)
        for state in ("pending", "running", "complete", "failed", "retrying"):
            progress[f"{label}_{state}"] = sum(item.get("status") == state for item in items)
        progress[f"{label}_uploaded"] = sum(bool(item.get("uploaded")) for item in items)
    inventory["progress"] = progress


def record_progress_milestones(inventory: dict[str, Any]) -> None:
    progress = inventory.get("progress", {})
    milestones = inventory.setdefault("milestones", {})
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    if progress.get("geometry_complete", 0) and "first_geometry" not in milestones:
        milestones["first_geometry"] = now
    if progress.get("pages_complete", 0) and "first_texture_page" not in milestones:
        milestones["first_texture_page"] = now
    if (
        progress.get("geometry_uploaded", 0) + progress.get("pages_uploaded", 0) > 0
        and "first_upload" not in milestones
    ):
        milestones["first_upload"] = now
    complete = progress.get("geometry_complete", 0) + progress.get("pages_complete", 0)
    total = progress.get("geometry_total", 0) + progress.get("pages_total", 0)
    if total:
        fraction = complete / total
        for percent in (10, 25, 50, 75, 100):
            if fraction >= percent / 100 and f"progress_{percent}_percent" not in milestones:
                milestones[f"progress_{percent}_percent"] = now
