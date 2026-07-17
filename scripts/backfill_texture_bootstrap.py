#!/usr/bin/env python3
"""Backfill 32px WebP bootstrap pages from an existing low-tier KTX2 bake."""
from __future__ import annotations

import argparse
import shutil
import subprocess
import tempfile
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
BUNDLED_BASISU = ROOT / "ktx2_nonrect_texture_test/.basisu_v2/source/bin/basisu"


def default_basisu() -> Path:
    if BUNDLED_BASISU.is_file():
        return BUNDLED_BASISU
    executable = shutil.which("basisu")
    if executable:
        return Path(executable)
    raise FileNotFoundError("Basis Universal v2 is required; pass --basisu")


def decode_level_32(basisu: Path, source: Path, work: Path) -> Path:
    subprocess.run([
        str(basisu), "-unpack", "-quiet", str(source.resolve()),
    ], cwd=work, check=True, stdout=subprocess.DEVNULL)
    matches = list(work.glob("*_unpacked_rgb_RGBA32_level_2_face_0_layer0000.png"))
    if len(matches) != 1:
        raise RuntimeError(f"expected one 32px RGBA32 mip for {source}, found {matches}")
    return matches[0]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--basisu", type=Path)
    parser.add_argument("--low-dir", type=Path, default=ROOT / "frontend/app/aerial_pages/low")
    parser.add_argument("--output-dir", type=Path, default=ROOT / "frontend/app/aerial_pages/bootstrap")
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()
    basisu = (args.basisu or default_basisu()).resolve()
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
            decoded = decode_level_32(basisu, source, Path(temp))
            with Image.open(decoded) as image:
                if image.size != (32, 32):
                    image = image.resize((32, 32), Image.Resampling.LANCZOS)
                temporary = destination.with_suffix(".webp.tmp")
                image.convert("RGB").save(temporary, "WEBP", quality=45, method=4)
                temporary.replace(destination)
        written += 1
    print(f"bootstrap pages ready: {written} written, {skipped} current, {len(sources)} total")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
