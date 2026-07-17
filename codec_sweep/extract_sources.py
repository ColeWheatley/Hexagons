#!/usr/bin/env python3
"""Rebuild production-shaped source PNGs for the codec sweep."""

from __future__ import annotations

import numpy as np
import rasterio
import rasterio.enums
from PIL import Image
from rasterio.windows import from_bounds
from shapely.geometry import box

from common import (
    AERIAL_DIR,
    LOW_CANVAS_PX,
    SELECTED_SECTORS,
    SWEEP_ROOT,
    TEX_MPP,
    TEXTURE_CANVAS_PX,
    TEXTURE_PADDING_PX,
    sector_id_to_bounds_meters,
)


def discover_tifs() -> list[dict]:
    out = []
    for path in sorted(AERIAL_DIR.glob("*.tif")):
        with rasterio.open(path) as src:
            b = src.bounds
            out.append({"path": path, "poly": box(b.left, b.bottom, b.right, b.top)})
    return out


def build_canvas(sx: int, sy: int, tifs: list[dict]) -> Image.Image:
    min_x, min_y, max_x, max_y = sector_id_to_bounds_meters(sx, sy)
    padding_m = TEXTURE_PADDING_PX * TEX_MPP
    padded_min_x = min_x - padding_m
    padded_max_x = max_x + padding_m
    padded_min_y = min_y - padding_m
    padded_max_y = max_y + padding_m
    target_poly = box(padded_min_x, padded_min_y, padded_max_x, padded_max_y)
    canvas = Image.new("RGB", (TEXTURE_CANVAS_PX, TEXTURE_CANVAS_PX), (0, 0, 0))
    for tif in [t for t in tifs if t["poly"].intersects(target_poly)]:
        with rasterio.open(tif["path"]) as src:
            ix_min_x = max(padded_min_x, src.bounds.left)
            ix_max_x = min(padded_max_x, src.bounds.right)
            ix_min_y = max(padded_min_y, src.bounds.bottom)
            ix_max_y = min(padded_max_y, src.bounds.top)
            if ix_min_x >= ix_max_x or ix_min_y >= ix_max_y:
                continue
            window = from_bounds(ix_min_x, ix_min_y, ix_max_x, ix_max_y, src.transform)
            px0 = round((ix_min_x - padded_min_x) / TEX_MPP)
            px1 = round((ix_max_x - padded_min_x) / TEX_MPP)
            py0 = round((padded_max_y - ix_max_y) / TEX_MPP)
            py1 = round((padded_max_y - ix_min_y) / TEX_MPP)
            w_px = px1 - px0
            h_px = py1 - py0
            if w_px <= 0 or h_px <= 0:
                continue
            data = src.read(window=window, out_shape=(src.count, h_px, w_px), resampling=rasterio.enums.Resampling.lanczos)
            rgb = data[:3]
            if rgb.shape[0] == 1:
                rgb = np.repeat(rgb, 3, axis=0)
            canvas.paste(Image.fromarray(np.moveaxis(rgb, 0, -1).astype("uint8"), "RGB"), (px0, py0))
    return canvas


def main() -> None:
    sources = SWEEP_ROOT / "sources"
    sources_low = SWEEP_ROOT / "sources_low"
    sources.mkdir(parents=True, exist_ok=True)
    sources_low.mkdir(parents=True, exist_ok=True)
    tifs = discover_tifs()
    for sector in SELECTED_SECTORS:
        canvas = build_canvas(sector["sx"], sector["sy"], tifs)
        sector_name = sector["sector"]
        full_path = sources / f"{sector_name}.png"
        low_path = sources_low / f"{sector_name}.png"
        canvas.save(full_path)
        canvas.resize((LOW_CANVAS_PX, LOW_CANVAS_PX), Image.Resampling.LANCZOS).save(low_path)
        print(f"wrote {full_path} and {low_path}")


if __name__ == "__main__":
    main()
