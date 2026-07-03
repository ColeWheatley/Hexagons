#!/usr/bin/env python3
"""Generate a production-ish KTX2 zoom benchmark from real Tirol aerial TIFs."""

from __future__ import annotations

import json
import math
import os
import shutil
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import rasterio
from PIL import Image, ImageDraw


REPO_ROOT = Path(__file__).resolve().parents[3]
TEST_ROOT = REPO_ROOT / "ktx2_nonrect_texture_test" / "production_zoom"
ASSET_ROOT = TEST_ROOT / "assets"
PATCH_ROOT = ASSET_ROOT / "patches"
TIF_ROOT = REPO_ROOT / "hex_backend" / "aerial_tifs"
BASISU_BIN = os.environ.get("BASISU", "basisu")

UNIT_HEX_PX = 32.0
METERS_PER_PIXEL = 0.2
UNIT_HEX_WIDTH_M = UNIT_HEX_PX * METERS_PER_PIXEL
PINK = np.array([255, 0, 255], dtype=np.uint8)

STATES = [
    {
        "id": "unit_s1",
        "scale": 1,
        "label": "LOD unit hexes",
        "viewPixels": [512, 288],
        "note": "Close zoom: true 6.4 m / 32 px unit cells.",
    },
    {
        "id": "lod_s3",
        "scale": 3,
        "label": "LOD 3x hexes",
        "viewPixels": [1024, 576],
        "note": "Mid-close zoom: larger world view with 3x cells.",
    },
    {
        "id": "lod_s6",
        "scale": 6,
        "label": "LOD 6x hexes",
        "viewPixels": [2048, 1152],
        "note": "Mid zoom: fewer larger cells.",
    },
    {
        "id": "lod_s24",
        "scale": 24,
        "label": "LOD 24x hexes",
        "viewPixels": [6144, 3456],
        "note": "Far zoom: a large real aerial area with big cells.",
    },
]

BASE_BASISU_ARGS = [
    "-parallel",
    "-max_threads",
    "8",
    "-ktx2",
    "-mipmap",
    "-mip_srgb",
    "-no_alpha",
    "-y_flip",
]

CODECS = {
    "xuastc_6x6": {
        "label": "XUASTC LDR 6x6 + KTX2 Zstd profile",
        "basisu_args": [
            *BASE_BASISU_ARGS,
            "-ldr_6x6i",
            "-quality",
            "75",
            "-effort",
            "4",
        ],
        "required_options": ["-ldr_6x6i"],
        "gpu_block": [6, 6],
        "expected_gpu_format": "RGBA ASTC 6x6",
        "notes": "Preferred production target once Basis Universal v2.x encoder and browser transcoder support are installed.",
    },
    "uastc": {
        "label": "UASTC LDR 4x4 + RDO + KTX2 Zstd",
        "basisu_args": [
            *BASE_BASISU_ARGS,
            "-uastc",
            "-uastc_level",
            "1",
            "-uastc_rdo_l",
            "3.5",
        ],
        "required_options": ["-uastc"],
        "gpu_block": [4, 4],
        "expected_gpu_format": "RGBA ASTC 4x4",
        "notes": "Current compatible fallback for Three KTX2Loader/Basis v1.x stacks.",
    },
}


@dataclass(frozen=True)
class TileInfo:
    path: Path
    left: float
    bottom: float
    right: float
    top: float
    width: int
    height: int


def scan_tiles() -> list[TileInfo]:
    infos: list[TileInfo] = []
    for path in TIF_ROOT.glob("*.tif"):
        with rasterio.open(path) as ds:
            bounds = ds.bounds
            infos.append(
                TileInfo(
                    path=path,
                    left=bounds.left,
                    bottom=bounds.bottom,
                    right=bounds.right,
                    top=bounds.top,
                    width=ds.width,
                    height=ds.height,
                )
            )
    if not infos:
        raise SystemExit(f"No TIFs found under {TIF_ROOT}")
    return infos


def choose_3x3_cluster(infos: list[TileInfo]) -> list[TileInfo]:
    by_origin = {(round(t.left, 3), round(t.bottom, 3)): t for t in infos}
    for center in infos:
        tile_w = round(center.right - center.left, 3)
        tile_h = round(center.top - center.bottom, 3)
        cells = []
        ok = True
        for dy in [tile_h, 0, -tile_h]:
            for dx in [-tile_w, 0, tile_w]:
                key = (round(center.left + dx, 3), round(center.bottom + dy, 3))
                tile = by_origin.get(key)
                if tile is None:
                    ok = False
                    break
                cells.append(tile)
            if not ok:
                break
        if ok:
            return cells
    raise SystemExit("Could not find a complete 3x3 adjacent TIF cluster.")


def build_vrt(cluster: list[TileInfo], vrt_path: Path) -> None:
    vrt_path.parent.mkdir(parents=True, exist_ok=True)
    inputs = [str(t.path) for t in cluster]
    subprocess.run(
        ["gdalbuildvrt", "-overwrite", "-resolution", "user", "-tr", "0.2", "0.2", str(vrt_path), *inputs],
        cwd=REPO_ROOT,
        check=True,
        stdout=subprocess.DEVNULL,
    )


def basisu_help_text() -> str:
    result = subprocess.run(
        [BASISU_BIN, "-help"],
        cwd=REPO_ROOT,
        check=False,
        capture_output=True,
        text=True,
    )
    return f"{result.stdout}\n{result.stderr}"


def choose_codec(help_text: str) -> tuple[str, dict[str, str]]:
    skipped: dict[str, str] = {}
    for codec, config in CODECS.items():
        missing = [option for option in config.get("required_options", []) if option not in help_text]
        if missing:
            skipped[codec] = f"basisu help does not expose {', '.join(missing)}"
            continue
        return codec, skipped
    raise SystemExit(f"No configured codecs are supported by this basisu build: {skipped}")


def axial_to_world(q: int, r: int, scale: int) -> tuple[float, float]:
    h = UNIT_HEX_WIDTH_M * scale
    return q * (math.sqrt(3) / 2) * h, r * h + q * 0.5 * h


def world_to_axial(x: float, y: float, scale: int) -> tuple[float, float]:
    h = UNIT_HEX_WIDTH_M * scale
    a = (math.sqrt(3) / 2) * h
    q = x / a
    r = (y - q * 0.5 * h) / h
    return q, r


def read_window(ds: rasterio.io.DatasetReader, x: int, y: int, width: int, height: int) -> np.ndarray:
    out = np.empty((height, width, 3), dtype=np.uint8)
    out[:, :] = PINK

    read_x0 = max(0, x)
    read_y0 = max(0, y)
    read_x1 = min(ds.width, x + width)
    read_y1 = min(ds.height, y + height)
    if read_x0 >= read_x1 or read_y0 >= read_y1:
        return out

    window = rasterio.windows.Window(read_x0, read_y0, read_x1 - read_x0, read_y1 - read_y0)
    data = ds.read([1, 2, 3], window=window)
    data = np.moveaxis(data, 0, -1).astype(np.uint8, copy=False)
    dst_x = read_x0 - x
    dst_y = read_y0 - y
    out[dst_y:dst_y + data.shape[0], dst_x:dst_x + data.shape[1]] = data
    return out


def make_hex_mask(width: int, height: int, scale: int) -> np.ndarray:
    h_px = UNIT_HEX_PX * scale
    radius = h_px / math.sqrt(3)
    cx = width / 2
    cy = height / 2
    points = []
    for deg in [0, 60, 120, 180, 240, 300]:
        rad = math.radians(deg)
        points.append((cx + radius * math.cos(rad), cy - radius * math.sin(rad)))
    mask = Image.new("L", (width, height), 0)
    ImageDraw.Draw(mask).polygon(points, fill=255)
    return np.asarray(mask, dtype=np.uint8) > 0


def encode_batch(source_paths: list[Path], output_dir: Path, basisu_args: list[str]) -> None:
    if not source_paths:
        return
    output_dir.mkdir(parents=True, exist_ok=True)
    command = [BASISU_BIN, *basisu_args, "-output_path", str(output_dir), *map(str, source_paths)]
    subprocess.run(command, cwd=REPO_ROOT, check=True, stdout=subprocess.DEVNULL)


def ktx2_gpu_block_bytes(width: int, height: int, block_width: int, block_height: int) -> int:
    total = 0
    w = width
    h = height
    while True:
        blocks_x = max(1, math.ceil(w / block_width))
        blocks_y = max(1, math.ceil(h / block_height))
        total += blocks_x * blocks_y * 16
        if w == 1 and h == 1:
            return total
        w = max(1, w // 2)
        h = max(1, h // 2)


def generate_assets() -> dict:
    if shutil.which(BASISU_BIN) is None:
        raise SystemExit(f"{BASISU_BIN} is required.")
    if shutil.which("gdalbuildvrt") is None:
        raise SystemExit("gdalbuildvrt is required.")
    codec, skipped_codecs = choose_codec(basisu_help_text())
    basisu_args = CODECS[codec]["basisu_args"]
    block_width, block_height = CODECS[codec]["gpu_block"]

    infos = scan_tiles()
    cluster = choose_3x3_cluster(infos)
    cluster = sorted(cluster, key=lambda t: (-t.top, t.left))

    shutil.rmtree(PATCH_ROOT / codec, ignore_errors=True)
    ASSET_ROOT.mkdir(parents=True, exist_ok=True)
    vrt_path = ASSET_ROOT / "mosaic_3x3.vrt"
    build_vrt(cluster, vrt_path)

    with rasterio.open(vrt_path) as ds:
        center_x = ds.bounds.left + (ds.bounds.right - ds.bounds.left) * 0.5
        center_y = ds.bounds.bottom + (ds.bounds.top - ds.bounds.bottom) * 0.5
        center_row, center_col = rasterio.transform.rowcol(ds.transform, center_x, center_y)
        center_col = int(center_col)
        center_row = int(center_row)

        manifest = {
            "source": {
                "kind": "real 3x3 Tirol aerial TIF cluster",
                "vrt": str(vrt_path.relative_to(TEST_ROOT)),
                "tifs": [str(t.path.relative_to(REPO_ROOT)) for t in cluster],
                "boundsMeters": [ds.bounds.left, ds.bounds.bottom, ds.bounds.right, ds.bounds.top],
                "resolutionMetersPerPixel": METERS_PER_PIXEL,
                "mosaicPixels": [ds.width, ds.height],
            },
            "basis": {
                "codec": codec,
                "payload": CODECS[codec]["label"],
                "notes": CODECS[codec]["notes"],
                "args": basisu_args,
                "preferredCodecOrder": list(CODECS.keys()),
                "skippedCodecs": skipped_codecs,
                "expectedAppleChromeFormat": CODECS[codec]["expected_gpu_format"],
                "gpuBlockEstimate": {
                    "format": CODECS[codec]["expected_gpu_format"],
                    "block": [block_width, block_height],
                },
            },
            "unit": {
                "unitHexPixels": UNIT_HEX_PX,
                "unitHexMeters": UNIT_HEX_WIDTH_M,
                "debugFill": "#ff00ff",
            },
            "states": [],
        }

        with tempfile.TemporaryDirectory(prefix="prod_zoom_ktx2_") as temp_name:
            temp_dir = Path(temp_name)
            for state in STATES:
                scale = int(state["scale"])
                side = int(round(UNIT_HEX_PX * scale))
                view_w, view_h = [int(v) for v in state["viewPixels"]]
                view_x = int(center_col - view_w // 2)
                view_y = int(center_row - view_h // 2)
                view_left_m = ds.bounds.left + view_x * METERS_PER_PIXEL
                view_top_m = ds.bounds.top - view_y * METERS_PER_PIXEL
                view_right_m = view_left_m + view_w * METERS_PER_PIXEL
                view_bottom_m = view_top_m - view_h * METERS_PER_PIXEL

                state_entry = {
                    **state,
                    "viewOriginPixels": [view_x, view_y],
                    "viewBoundsMeters": [view_left_m, view_bottom_m, view_right_m, view_top_m],
                    "squareSidePixels": side,
                    "squareSideMeters": side * METERS_PER_PIXEL,
                    "rect": {"patches": []},
                    "hex": {"patches": []},
                }

                rect_sources: list[Path] = []
                rect_out = PATCH_ROOT / codec / state["id"] / "rect"
                i0 = math.floor(view_x / side)
                j0 = math.floor(view_y / side)
                i1 = math.ceil((view_x + view_w) / side)
                j1 = math.ceil((view_y + view_h) / side)
                rect_idx = 0
                for j in range(j0, j1):
                    for i in range(i0, i1):
                        px = i * side
                        py = j * side
                        image = read_window(ds, px, py, side, side)
                        name = f"rect_{rect_idx:04d}"
                        src_path = temp_dir / f"{state['id']}_{name}.tga"
                        Image.fromarray(image, "RGB").save(src_path, "TGA")
                        rect_sources.append(src_path)
                        path = rect_out / f"{state['id']}_{name}.ktx2"
                        state_entry["rect"]["patches"].append(
                            {
                                "path": str(path.relative_to(TEST_ROOT)),
                                "x": px - view_x,
                                "y": py - view_y,
                                "width": side,
                                "height": side,
                                "pixels": side * side,
                                "pinkPixels": 0,
                                "gpuBlockBytesEstimate": ktx2_gpu_block_bytes(side, side, block_width, block_height),
                            }
                        )
                        rect_idx += 1
                encode_batch(rect_sources, rect_out, basisu_args)

                hex_sources: list[Path] = []
                hex_out = PATCH_ROOT / codec / state["id"] / "hex"
                h_px = UNIT_HEX_PX * scale
                hex_w = int(math.ceil((2 * h_px / math.sqrt(3)) / 4) * 4)
                hex_h = int(math.ceil(h_px / 4) * 4)
                mask = make_hex_mask(hex_w, hex_h, scale)
                pad_x_m = (hex_w * 0.5) * METERS_PER_PIXEL
                pad_y_m = (hex_h * 0.5) * METERS_PER_PIXEL
                corners = [
                    (view_left_m - pad_x_m, view_bottom_m - pad_y_m),
                    (view_right_m + pad_x_m, view_bottom_m - pad_y_m),
                    (view_right_m + pad_x_m, view_top_m + pad_y_m),
                    (view_left_m - pad_x_m, view_top_m + pad_y_m),
                ]
                qs, rs = [], []
                for x_m, y_m in corners:
                    q, r = world_to_axial(x_m, y_m, scale)
                    qs.append(q)
                    rs.append(r)
                hex_idx = 0
                for q in range(math.floor(min(qs)) - 2, math.ceil(max(qs)) + 3):
                    for r in range(math.floor(min(rs)) - 2, math.ceil(max(rs)) + 3):
                        wx, wy = axial_to_world(q, r, scale)
                        row, col = rasterio.transform.rowcol(ds.transform, wx, wy)
                        col = int(col)
                        row = int(row)
                        px = int(round(col - hex_w / 2))
                        py = int(round(row - hex_h / 2))
                        if px + hex_w <= view_x or px >= view_x + view_w or py + hex_h <= view_y or py >= view_y + view_h:
                            continue
                        image = read_window(ds, px, py, hex_w, hex_h)
                        out = np.empty_like(image)
                        out[:, :] = PINK
                        out[mask] = image[mask]
                        name = f"hex_{hex_idx:04d}"
                        src_path = temp_dir / f"{state['id']}_{name}.tga"
                        Image.fromarray(out, "RGB").save(src_path, "TGA")
                        hex_sources.append(src_path)
                        path = hex_out / f"{state['id']}_{name}.ktx2"
                        pink_pixels = int(mask.size - mask.sum())
                        state_entry["hex"]["patches"].append(
                            {
                                "path": str(path.relative_to(TEST_ROOT)),
                                "q": int(q),
                                "r": int(r),
                                "x": px - view_x,
                                "y": py - view_y,
                                "width": hex_w,
                                "height": hex_h,
                                "centerX": int(col - view_x),
                                "centerY": int(row - view_y),
                                "pinkPixels": pink_pixels,
                                "sourcePixels": int(mask.sum()),
                                "gpuBlockBytesEstimate": ktx2_gpu_block_bytes(hex_w, hex_h, block_width, block_height),
                            }
                        )
                        hex_idx += 1
                encode_batch(hex_sources, hex_out, basisu_args)

                for kind in ["rect", "hex"]:
                    total_ktx = 0
                    total_gpu = 0
                    total_pixels = 0
                    total_pink = 0
                    for patch in state_entry[kind]["patches"]:
                        file_path = TEST_ROOT / patch["path"]
                        patch["ktx2Bytes"] = file_path.stat().st_size
                        total_ktx += patch["ktx2Bytes"]
                        total_gpu += patch["gpuBlockBytesEstimate"]
                        total_pixels += patch["width"] * patch["height"]
                        total_pink += patch.get("pinkPixels", 0)
                    state_entry[kind]["summary"] = {
                        "patchCount": len(state_entry[kind]["patches"]),
                        "ktx2Bytes": total_ktx,
                        "gpuBlockBytesEstimate": total_gpu,
                        "containerPixels": total_pixels,
                        "pinkPixels": total_pink,
                    }

                manifest["states"].append(state_entry)
                print(
                    f"{state['id']}: rect {state_entry['rect']['summary']['patchCount']} files, "
                    f"hex {state_entry['hex']['summary']['patchCount']} files"
                )

    manifest_path = ASSET_ROOT / "production_manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    return manifest


def main() -> None:
    manifest = generate_assets()
    print(f"Wrote {ASSET_ROOT / 'production_manifest.json'}")
    for state in manifest["states"]:
        r = state["rect"]["summary"]
        h = state["hex"]["summary"]
        print(
            f"{state['id']:8} rect={r['patchCount']:3} {r['ktx2Bytes']/1024:8.1f} KiB "
            f"hex={h['patchCount']:3} {h['ktx2Bytes']/1024:8.1f} KiB"
        )


if __name__ == "__main__":
    main()
