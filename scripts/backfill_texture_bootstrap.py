#!/usr/bin/env python3
"""Backfill clean 64px WebP bootstrap pages from an existing low-tier KTX2 bake."""
from __future__ import annotations

import argparse
import json
import math
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
BUNDLED_BASISU = ROOT / "ktx2_nonrect_texture_test/.basisu_v2/source/bin/basisu"
sys.path.insert(0, str(ROOT / "hex_backend"))
from texture_contract import (  # noqa: E402
    TEXTURE_BOOTSTRAP_SIZE,
    TEXTURE_BOOTSTRAP_WEBP_METHOD,
    TEXTURE_BOOTSTRAP_WEBP_QUALITY,
    TEXTURE_TIER_SIZES,
)


def default_basisu() -> Path:
    if BUNDLED_BASISU.is_file():
        return BUNDLED_BASISU
    executable = shutil.which("basisu")
    if executable:
        return Path(executable)
    raise FileNotFoundError("Basis Universal v2 is required; pass --basisu")


def decode_bootstrap_level(basisu: Path, source: Path, work: Path) -> Path:
    ratio = TEXTURE_TIER_SIZES["low"] // TEXTURE_BOOTSTRAP_SIZE
    level = int(math.log2(ratio))
    if TEXTURE_BOOTSTRAP_SIZE * (2 ** level) != TEXTURE_TIER_SIZES["low"]:
        raise RuntimeError("bootstrap size must be a power-of-two low-tier mip")
    subprocess.run([
        str(basisu), "-unpack", "-quiet", str(source.resolve()),
    ], cwd=work, check=True, stdout=subprocess.DEVNULL)
    matches = list(work.glob(f"*_unpacked_rgb_RGBA32_level_{level}_face_0_layer0000.png"))
    if len(matches) != 1:
        raise RuntimeError(
            f"expected one {TEXTURE_BOOTSTRAP_SIZE}px RGBA32 mip for {source}, found {matches}"
        )
    return matches[0]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--basisu", type=Path)
    parser.add_argument("--low-dir", type=Path, default=ROOT / "frontend/app/aerial_pages/low")
    parser.add_argument("--output-dir", type=Path, default=ROOT / "frontend/app/aerial_pages/bootstrap")
    parser.add_argument("--manifest", type=Path, default=ROOT / "frontend/app/tile_manifest.json")
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()
    basisu = (args.basisu or default_basisu()).resolve()
    if args.manifest.is_file():
        manifest = json.loads(args.manifest.read_text())
        if manifest.get("texture_pages", {}).get("diagnostic_tattoos"):
            raise SystemExit(
                "refusing to inherit the green low-tier tattoo; rebake diagnostic bootstrap pages from source"
            )
    sources = sorted(args.low_dir.glob("texture_*.ktx2"))
    if not sources:
        raise SystemExit(f"no low-tier KTX2 pages found in {args.low_dir}")
    args.output_dir.mkdir(parents=True, exist_ok=True)
    written = skipped = 0
    for source in sources:
        destination = args.output_dir / f"{source.stem}.webp"
        if not args.force and destination.is_file() and destination.stat().st_mtime >= source.stat().st_mtime:
            skipped += 1
            continue
        with tempfile.TemporaryDirectory(prefix="hexagons-webp-") as temp:
            decoded = decode_bootstrap_level(basisu, source, Path(temp))
            with Image.open(decoded) as image:
                if image.size != (TEXTURE_BOOTSTRAP_SIZE, TEXTURE_BOOTSTRAP_SIZE):
                    image = image.resize(
                        (TEXTURE_BOOTSTRAP_SIZE, TEXTURE_BOOTSTRAP_SIZE),
                        Image.Resampling.LANCZOS,
                    )
                temporary = destination.with_suffix(".webp.tmp")
                image.convert("RGB").save(
                    temporary,
                    "WEBP",
                    quality=TEXTURE_BOOTSTRAP_WEBP_QUALITY,
                    method=TEXTURE_BOOTSTRAP_WEBP_METHOD,
                )
                temporary.replace(destination)
        written += 1
    print(f"bootstrap pages ready: {written} written, {skipped} current, {len(sources)} total")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
