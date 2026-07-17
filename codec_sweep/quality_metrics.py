#!/usr/bin/env python3
"""Decode KTX2 outputs and compute PSNR/SSIM against source PNGs."""

from __future__ import annotations

import argparse
import gc
import math
import re
import shutil
import subprocess
import tempfile
import time
from pathlib import Path

import numpy as np
from PIL import Image

try:
    from scipy.ndimage import convolve1d
except Exception:
    convolve1d = None

from common import BASISU_BIN, CELLS_BY_NAME, SELECTED_SECTORS, SWEEP_ROOT, content_crop_for_tier, encoded_path_for_cell_sector, load_results, save_results, source_path_for_sector
from encode_cells import git_checkpoint


KERNEL = np.exp(-(np.arange(-5, 6, dtype=np.float32) ** 2) / (2 * 1.5 * 1.5))
KERNEL = KERNEL / KERNEL.sum()
SSIM_RADIUS = len(KERNEL) // 2
METRIC_TILE_PX = 512
DECODE_METHOD = "Basis Universal transcoder RGBA32 level 0, vertical flip to undo encode -y_flip"
LEVEL0_DECODER_SOURCE = SWEEP_ROOT / "ktx2_decode_level0.cpp"
LEVEL0_DECODER_BIN = SWEEP_ROOT / ".bin" / "ktx2_decode_level0"


def ensure_level0_decoder() -> Path:
    if LEVEL0_DECODER_BIN.exists() and LEVEL0_DECODER_BIN.stat().st_mtime >= LEVEL0_DECODER_SOURCE.stat().st_mtime:
        return LEVEL0_DECODER_BIN
    compiler = shutil.which("c++")
    if not compiler:
        raise RuntimeError("C++ compiler not found; required to build the level-0 KTX2 decoder")
    basisu_source = BASISU_BIN.parent.parent
    library = basisu_source / "build" / "libbasisu_encoder.a"
    if not library.exists():
        raise RuntimeError(f"Basis Universal static library not found: {library}")
    LEVEL0_DECODER_BIN.parent.mkdir(parents=True, exist_ok=True)
    command = [
        compiler,
        "-std=c++17",
        "-O3",
        "-DBASISU_SUPPORT_SSE=0",
        "-I",
        str(basisu_source / "transcoder"),
        str(LEVEL0_DECODER_SOURCE),
        str(library),
        "-lm",
        "-lpthread",
        "-o",
        str(LEVEL0_DECODER_BIN),
    ]
    proc = subprocess.run(command, capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(f"failed to build level-0 KTX2 decoder:\n{proc.stdout}\n{proc.stderr}")
    return LEVEL0_DECODER_BIN


def filt(img: np.ndarray) -> np.ndarray:
    if convolve1d is not None:
        return convolve1d(convolve1d(img, KERNEL, axis=1, mode="reflect"), KERNEL, axis=0, mode="reflect")
    out = np.zeros_like(img, dtype=np.float32)
    tmp = np.zeros_like(img, dtype=np.float32)
    px = np.pad(img, ((0, 0), (5, 5)), mode="reflect")
    for i, w in enumerate(KERNEL):
        tmp += w * px[:, i : i + img.shape[1]]
    py = np.pad(tmp, ((5, 5), (0, 0)), mode="reflect")
    for i, w in enumerate(KERNEL):
        out += w * py[i : i + img.shape[0], :]
    return out


def luma(rgb: np.ndarray) -> np.ndarray:
    f = rgb.astype(np.float32)
    return f[:, :, 0] * 0.2126 + f[:, :, 1] * 0.7152 + f[:, :, 2] * 0.0722


def psnr(a: np.ndarray, b: np.ndarray) -> float:
    mse = float(np.mean((a.astype(np.float32) - b.astype(np.float32)) ** 2))
    return float("inf") if mse == 0 else 10.0 * math.log10((255.0 * 255.0) / mse)


def ssim(a: np.ndarray, b: np.ndarray) -> float:
    a = a.astype(np.float32)
    b = b.astype(np.float32)
    c1 = (0.01 * 255.0) ** 2
    c2 = (0.03 * 255.0) ** 2
    ma = filt(a)
    mb = filt(b)
    va = filt(a * a) - ma * ma
    vb = filt(b * b) - mb * mb
    vab = filt(a * b) - ma * mb
    return float(np.mean(((2 * ma * mb + c1) * (2 * vab + c2)) / ((ma * ma + mb * mb + c1) * (va + vb + c2))))


def decode(encoded: Path, expected_size: tuple[int, int]) -> tuple[Image.Image, str]:
    with tempfile.TemporaryDirectory(prefix="codec_decode_") as tmp_name:
        tmp = Path(tmp_name)
        decoded_path = tmp / "level0.ppm"
        cmd = [str(ensure_level0_decoder()), str(encoded), str(decoded_path)]
        proc = subprocess.run(cmd, cwd=tmp, capture_output=True, text=True)
        if proc.returncode != 0:
            raise RuntimeError(f"level-0 KTX2 decode failed for {encoded}: {proc.stderr}")
        with Image.open(decoded_path) as selected:
            if selected.size != expected_size:
                raise RuntimeError(f"decoded {encoded} to {selected.size}, expected {expected_size}")
            decoded = selected.convert("RGB").transpose(Image.Transpose.FLIP_TOP_BOTTOM)
            decoded.load()
        return decoded, decoded_path.name


def tiled_metrics(a: np.ndarray, b: np.ndarray) -> tuple[float, float, float]:
    """Compute full-resolution metrics with bounded intermediate allocations.

    The old whole-frame SSIM path retained several 3360x3360 float32 arrays at
    once. This computes the same local 11x11 Gaussian statistic in 512px tiles,
    with a reflected halo so tile seams do not affect the result.
    """
    if a.shape != b.shape or a.ndim != 3 or a.shape[2] != 3:
        raise ValueError(f"metric inputs must be matching RGB arrays, got {a.shape} and {b.shape}")
    pad = ((SSIM_RADIUS, SSIM_RADIUS), (SSIM_RADIUS, SSIM_RADIUS), (0, 0))
    ap = np.pad(a, pad, mode="reflect")
    bp = np.pad(b, pad, mode="reflect")
    rgb_squared_error = 0.0
    luma_squared_error = 0.0
    ssim_sum = 0.0
    pixel_count = 0
    c1 = (0.01 * 255.0) ** 2
    c2 = (0.03 * 255.0) ** 2
    height, width = a.shape[:2]
    for y0 in range(0, height, METRIC_TILE_PX):
        y1 = min(height, y0 + METRIC_TILE_PX)
        for x0 in range(0, width, METRIC_TILE_PX):
            x1 = min(width, x0 + METRIC_TILE_PX)
            ah = luma(ap[y0 : y1 + 2 * SSIM_RADIUS, x0 : x1 + 2 * SSIM_RADIUS])
            bh = luma(bp[y0 : y1 + 2 * SSIM_RADIUS, x0 : x1 + 2 * SSIM_RADIUS])
            core = (slice(SSIM_RADIUS, SSIM_RADIUS + y1 - y0), slice(SSIM_RADIUS, SSIM_RADIUS + x1 - x0))
            ac = ah[core]
            bc = bh[core]
            rgb_delta = a[y0:y1, x0:x1].astype(np.float32) - b[y0:y1, x0:x1]
            luma_delta = ac - bc
            rgb_squared_error += float(np.sum(rgb_delta * rgb_delta, dtype=np.float64))
            luma_squared_error += float(np.sum(luma_delta * luma_delta, dtype=np.float64))
            ma = filt(ah)
            mb = filt(bh)
            va = filt(ah * ah) - ma * ma
            vb = filt(bh * bh) - mb * mb
            vab = filt(ah * bh) - ma * mb
            ssim_map = ((2 * ma * mb + c1) * (2 * vab + c2)) / ((ma * ma + mb * mb + c1) * (va + vb + c2))
            ssim_sum += float(np.sum(ssim_map[core], dtype=np.float64))
            pixel_count += (y1 - y0) * (x1 - x0)
    rgb_mse = rgb_squared_error / (pixel_count * 3)
    luma_mse = luma_squared_error / pixel_count
    rgb_psnr = float("inf") if rgb_mse == 0 else 10.0 * math.log10((255.0 * 255.0) / rgb_mse)
    luma_psnr = float("inf") if luma_mse == 0 else 10.0 * math.log10((255.0 * 255.0) / luma_mse)
    return rgb_psnr, luma_psnr, ssim_sum / pixel_count


def system_memory_free_percent() -> int | None:
    proc = subprocess.run(["memory_pressure"], capture_output=True, text=True)
    if proc.returncode != 0:
        return None
    match = re.search(r"System-wide memory free percentage: (\d+)%", proc.stdout)
    return int(match.group(1)) if match else None


def measure_one(sector: str, tier: str, cell_name: str) -> dict:
    cell = CELLS_BY_NAME[cell_name]
    crop = content_crop_for_tier(tier)
    with Image.open(source_path_for_sector(sector, tier)) as src:
        expected_size = src.size
        a = np.asarray(src.crop(crop).convert("RGB"), dtype=np.uint8)
    dec, png_name = decode(encoded_path_for_cell_sector(cell, sector), expected_size)
    b = np.asarray(dec.crop(crop), dtype=np.uint8)
    dec.close()
    psnr_rgb, psnr_luma, ssim_luma = tiled_metrics(a, b)
    return {
        "decode_method": DECODE_METHOD,
        "decode_png_selected": png_name,
        "metrics_crop": list(crop),
        "metric_tile_px": METRIC_TILE_PX,
        "psnr_rgb": psnr_rgb,
        "psnr_luma": psnr_luma,
        "ssim_luma": ssim_luma,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--commit-every", type=int, default=16)
    parser.add_argument("--min-free-percent", type=int, default=20)
    args = parser.parse_args()
    results = load_results()
    measured = 0
    start = time.perf_counter()
    for sector_info in SELECTED_SECTORS:
        sector = sector_info["sector"]
        for tier in ("full", "low"):
            for cell_name in sorted(results["sectors"][sector][tier]):
                entry = results["sectors"][sector][tier][cell_name]
                if not args.force and entry.get("ssim_luma") is not None and entry.get("decode_method") == DECODE_METHOD:
                    continue
                free_percent = system_memory_free_percent()
                if free_percent is not None and free_percent < args.min_free_percent:
                    raise SystemExit(
                        f"stopping cleanly before {sector}/{tier}/{cell_name}: "
                        f"system memory free {free_percent}% < {args.min_free_percent}%"
                    )
                print(f"measuring {sector} {tier} {cell_name} (memory free {free_percent if free_percent is not None else 'unknown'}%)", flush=True)
                entry.update(measure_one(sector, tier, cell_name))
                save_results(results)
                gc.collect()
                measured += 1
                if measured % args.commit_every == 0:
                    git_checkpoint(f"[sweep] measured quality {measured} decodes | next: continue quality metrics | status: ok")
    git_checkpoint(f"[sweep] measured quality metrics | next: build gallery | status: ok")
    print(f"measured {measured} in {time.perf_counter() - start:.2f}s")


if __name__ == "__main__":
    main()
