#!/usr/bin/env python3
"""Generate KTX2-only assets for the non-rectangular texture experiment."""

from __future__ import annotations

import json
import math
import os
import shutil
import subprocess
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image


REPO_ROOT = Path(__file__).resolve().parents[2]
TEST_ROOT = REPO_ROOT / "ktx2_nonrect_texture_test"
SOURCE_IMAGE = REPO_ROOT / "frontend" / "landing" / "strava_glacier.jpg"
ASSET_ROOT = TEST_ROOT / "assets"
KTX_ROOT = ASSET_ROOT / "ktx2"
BASISU_BIN = os.environ.get("BASISU", "basisu")

SIZE = 1024
LOCK_AMPLITUDE = 0.22

CODECS = {
    "xuastc_6x6": {
        "label": "XUASTC LDR 6x6 + KTX2 Zstd profile",
        "basisu_args": [
            "-ldr_6x6i",
            "-quality",
            "75",
            "-effort",
            "4",
            "-ktx2",
            "-mipmap",
            "-mip_srgb",
            "-no_alpha",
            "-y_flip",
        ],
        "required_options": ["-ldr_6x6i"],
        "notes": "Preferred target payload. Requires Basis Universal v2.x tooling and an XUASTC-capable browser transcoder path.",
    },
    "uastc": {
        "label": "UASTC + RDO + KTX2 Zstd",
        "basisu_args": [
            "-uastc",
            "-uastc_level",
            "2",
            "-uastc_rdo_l",
            "3.0",
            "-ktx2",
            "-mipmap",
            "-mip_srgb",
            "-no_alpha",
            "-y_flip",
        ],
        "notes": "Higher quality payload. Three can transcode this to ASTC when WEBGL_compressed_texture_astc is exposed.",
    },
    "etc1s": {
        "label": "ETC1S + KTX2",
        "basisu_args": [
            "-etc1s",
            "-q",
            "180",
            "-comp_level",
            "2",
            "-ktx2",
            "-mipmap",
            "-mip_srgb",
            "-no_alpha",
            "-y_flip",
        ],
        "notes": "Smaller supercompressed payload. In Three r160 this path does not select ASTC; it usually picks ETC2, BC/BPTC, S3TC, or another supported target.",
    },
}


def basisu_help_text() -> str:
    result = subprocess.run(
        [BASISU_BIN, "-help"],
        cwd=REPO_ROOT,
        check=False,
        capture_output=True,
        text=True,
    )
    return f"{result.stdout}\n{result.stderr}"


def codec_available(codec: str, help_text: str) -> tuple[bool, str]:
    required = CODECS[codec].get("required_options", [])
    missing = [option for option in required if option not in help_text]
    if missing:
        return False, f"basisu help does not expose {', '.join(missing)}"
    return True, "available"


def cover_square(image: Image.Image, size: int) -> Image.Image:
    image = image.convert("RGB")
    src_w, src_h = image.size
    scale = max(size / src_w, size / src_h)
    resized = image.resize(
        (round(src_w * scale), round(src_h * scale)),
        Image.Resampling.LANCZOS,
    )
    left = (resized.width - size) // 2
    top = (resized.height - size) // 2
    return resized.crop((left, top, left + size, top + size))


def boundary(v_gl: np.ndarray | float) -> np.ndarray | float:
    """Lock/key boundary in normalized GL coordinates, bottom=0 and top=1."""
    return 0.5 + LOCK_AMPLITUDE * np.sin(2.0 * math.pi * v_gl)


def save_tga(path: Path, image: Image.Image) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, "TGA")


def run_basisu(input_image: Path, output_ktx2: Path, codec: str) -> None:
    output_ktx2.parent.mkdir(parents=True, exist_ok=True)
    command = [
        BASISU_BIN,
        *CODECS[codec]["basisu_args"],
        "-file",
        str(input_image),
        "-output_file",
        str(output_ktx2),
    ]
    subprocess.run(command, cwd=REPO_ROOT, check=True)


def piece_stats(width: int, height: int, colored_pixels: int, file_path: Path) -> dict:
    raw_rgba_bytes = width * height * 4
    return {
        "path": str(file_path.relative_to(TEST_ROOT)),
        "width": width,
        "height": height,
        "coloredPixels": int(colored_pixels),
        "blackFillPixels": int(width * height - colored_pixels),
        "rawRGBABytes": raw_rgba_bytes,
        "ktx2Bytes": file_path.stat().st_size,
    }


def main() -> None:
    if shutil.which(BASISU_BIN) is None:
        raise SystemExit(f"{BASISU_BIN} is required to generate these KTX2 assets.")
    help_text = basisu_help_text()
    skipped_codecs: dict[str, str] = {}

    source = Image.open(SOURCE_IMAGE)
    base = cover_square(source, SIZE)
    base_arr = np.asarray(base, dtype=np.uint8)

    half_w = SIZE // 2
    rect_left = base.crop((0, 0, half_w, SIZE))
    rect_right = base.crop((half_w, 0, SIZE, SIZE))

    xs = (np.arange(SIZE, dtype=np.float32) + 0.5) / SIZE
    ys_top = (np.arange(SIZE, dtype=np.float32) + 0.5) / SIZE
    v_gl = 1.0 - ys_top
    split_x = boundary(v_gl)[:, None]
    lock_left_mask = xs[None, :] <= split_x
    lock_right_mask = ~lock_left_mask

    black = np.zeros_like(base_arr)
    lock_left = Image.fromarray(np.where(lock_left_mask[:, :, None], base_arr, black), "RGB")
    lock_right = Image.fromarray(np.where(lock_right_mask[:, :, None], base_arr, black), "RGB")

    sources = {
        "rect_left": (rect_left, rect_left.width, rect_left.height, rect_left.width * rect_left.height),
        "rect_right": (rect_right, rect_right.width, rect_right.height, rect_right.width * rect_right.height),
        "lock_left": (lock_left, SIZE, SIZE, int(lock_left_mask.sum())),
        "lock_right": (lock_right, SIZE, SIZE, int(lock_right_mask.sum())),
    }

    with tempfile.TemporaryDirectory(prefix="ktx2_nonrect_") as temp_dir_name:
        temp_dir = Path(temp_dir_name)
        source_paths: dict[str, Path] = {}
        for name, (image, *_rest) in sources.items():
            source_path = temp_dir / f"{name}.tga"
            save_tga(source_path, image)
            source_paths[name] = source_path

        files_by_codec: dict[str, dict[str, dict]] = {}
        for codec in CODECS:
            available, reason = codec_available(codec, help_text)
            if not available:
                skipped_codecs[codec] = reason
                continue
            codec_dir = KTX_ROOT / codec
            files_by_codec[codec] = {}
            for name, (_image, width, height, colored_pixels) in sources.items():
                output_path = codec_dir / f"{name}.ktx2"
                run_basisu(source_paths[name], output_path, codec)
                files_by_codec[codec][name] = piece_stats(width, height, colored_pixels, output_path)

    if not files_by_codec:
        raise SystemExit(f"No configured codecs are supported by this basisu build: {skipped_codecs}")

    manifest = {
        "source": str(SOURCE_IMAGE.relative_to(REPO_ROOT)),
        "sourceSize": list(source.size),
        "baseSize": [SIZE, SIZE],
        "runtimeLoadsOnly": [".ktx2", ".json", ".js", ".css", ".html", ".wasm"],
        "preferredCodecOrder": [codec for codec in CODECS if codec in files_by_codec],
        "skippedCodecs": skipped_codecs,
        "boundary": {
            "kind": "sine lock/key",
            "equation": "x = 0.5 + 0.22 * sin(2 * pi * v)",
            "amplitude": LOCK_AMPLITUDE,
            "coordinateSpace": "normalized GL texture coordinates, bottom=0 top=1",
        },
        "cases": {
            "rect": {
                "label": "A: two half rectangles",
                "pieces": ["rect_left", "rect_right"],
                "description": "Two half-size rectangles. No deliberate black fill.",
            },
            "lock": {
                "label": "B: lock/key full-coordinate masks",
                "pieces": ["lock_left", "lock_right"],
                "description": "Two full-size textures sharing one coordinate system; non-owned pixels are pure black.",
            },
        },
        "codecs": {
            codec: {
                "label": data["label"],
                "notes": data["notes"],
                "basisuArgs": data["basisu_args"],
                "files": files_by_codec[codec],
            }
            for codec, data in CODECS.items()
            if codec in files_by_codec
        },
    }

    ASSET_ROOT.mkdir(parents=True, exist_ok=True)
    (ASSET_ROOT / "asset_manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Wrote {ASSET_ROOT / 'asset_manifest.json'}")
    for codec, reason in skipped_codecs.items():
        print(f"\nSkipped {codec}: {reason}")
    for codec, codec_data in manifest["codecs"].items():
        print(f"\n{codec}: {codec_data['label']}")
        for name, stats in codec_data["files"].items():
            print(
                f"  {name:10} {stats['width']:4}x{stats['height']:<4} "
                f"{stats['ktx2Bytes'] / 1024:8.1f} KiB "
                f"black-fill={stats['blackFillPixels']:,}"
            )


if __name__ == "__main__":
    main()
