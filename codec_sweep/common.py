#!/usr/bin/env python3
"""Shared configuration for the aerial texture codec sweep."""

from __future__ import annotations

import json
import math
from dataclasses import dataclass
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
SWEEP_ROOT = REPO_ROOT / "codec_sweep"
BASISU_BIN = Path("/Users/cole/dev/Hexagons/ktx2_nonrect_texture_test/.basisu_v2/source/bin/basisu")
LOCAL_AERIAL_DIR = REPO_ROOT / "hex_backend" / "aerial_tifs"
ABS_AERIAL_DIR = Path("/Users/cole/dev/Hexagons/hex_backend/aerial_tifs")
AERIAL_DIR = LOCAL_AERIAL_DIR if LOCAL_AERIAL_DIR.exists() else ABS_AERIAL_DIR

TEXTURE_CANVAS_PX = 4096
TEXTURE_CONTENT_PX = 3360
TEXTURE_PADDING_PX = 368
SECTOR_SIZE_METERS = 819.2
TEX_MPP = SECTOR_SIZE_METERS / TEXTURE_CONTENT_PX
LOW_SCALE = 16
LOW_CANVAS_PX = TEXTURE_CANVAS_PX // LOW_SCALE
LOW_CONTENT_PX = TEXTURE_CONTENT_PX // LOW_SCALE
LOW_PADDING_PX = TEXTURE_PADDING_PX // LOW_SCALE

COMMON_BASISU_ARGS = [
    "-ktx2",
    "-mipmap",
    "-mip_srgb",
    "-no_alpha",
    "-y_flip",
    "-max_threads",
    "8",
]

SELECTED_SECTORS = [
    {"sector": "sector_77_248", "sx": 77, "sy": 248, "class": "glacier_snow", "why": "bright glacier and snowfields with exposed rock edges"},
    {"sector": "sector_78_250", "sx": 78, "sy": 250, "class": "shadowed_rock", "why": "steep dark rock gullies against pale scree"},
    {"sector": "sector_79_249", "sx": 79, "sy": 249, "class": "ice_shadow", "why": "glacier/ice with a hard deep-shadow boundary"},
    {"sector": "sector_80_251", "sx": 80, "sy": 251, "class": "lake_rock", "why": "turquoise alpine lake surrounded by bare rock"},
    {"sector": "sector_77_255", "sx": 77, "sy": 255, "class": "roads_valley", "why": "roads and ski infrastructure through mixed vegetation"},
    {"sector": "sector_78_254", "sx": 78, "sy": 254, "class": "forest_shadow", "why": "dark conifer canopy and slope shadow"},
    {"sector": "sector_79_253", "sx": 79, "sy": 253, "class": "mixed_valley", "why": "mixed meadow, forest, paths, and rocky cuts"},
    {"sector": "sector_80_255", "sx": 80, "sy": 255, "class": "valley_floor", "why": "lower valley roads, forest, and open slopes"},
]


@dataclass(frozen=True)
class CodecCell:
    name: str
    tier: str
    codec_family: str
    args: tuple[str, ...]
    astc_block: tuple[int, int] | None
    quality: int | None = None
    effort: int | None = None
    notes: str = ""


XUASTC_BLOCKS = {
    "4x4": (4, 4),
    "6x6": (6, 6),
    "8x6": (8, 6),
    "8x8": (8, 8),
    "10x10": (10, 10),
    "12x12": (12, 12),
}


def _xuastc_args(block: str, quality: int, effort: int) -> tuple[str, ...]:
    return (f"-ldr_{block}i", "-quality", str(quality), "-effort", str(effort))


def build_cells() -> list[CodecCell]:
    cells: list[CodecCell] = []
    for block, astc in XUASTC_BLOCKS.items():
        for quality in (50, 75, 90):
            cells.append(CodecCell(f"xuastc_{block}_q{quality}_e4", "full", "xuastc", _xuastc_args(block, quality, 4), astc, quality, 4))
    for effort in (1, 2, 5):
        cells.append(CodecCell(f"xuastc_6x6_q75_e{effort}", "full", "xuastc", _xuastc_args("6x6", 75, effort), (6, 6), 75, effort, "6x6@75 effort sensitivity point"))
    cells.extend(
        [
            CodecCell("uastc_4x4_default", "full", "uastc", ("-uastc",), (4, 4), notes="UASTC LDR 4x4 default settings"),
            CodecCell("etc1s_q128", "full", "etc1s", ("-etc1s", "-q", "128"), None, 128, notes="ETC1S -q 128 reference"),
            CodecCell("etc1s_q255", "full", "etc1s", ("-etc1s", "-q", "255"), None, 255, notes="ETC1S -q 255 reference"),
        ]
    )
    for block in ("4x4", "6x6", "8x8"):
        for quality in (75, 90):
            cells.append(CodecCell(f"xuastc_{block}_q{quality}_e4_low", "low", "xuastc", _xuastc_args(block, quality, 4), XUASTC_BLOCKS[block], quality, 4))
    return cells


CELLS = build_cells()
CELLS_BY_NAME = {cell.name: cell for cell in CELLS}


def sector_id_to_bounds_meters(sx: int, sy: int) -> tuple[float, float, float, float]:
    min_x = sx * SECTOR_SIZE_METERS
    min_y = sy * SECTOR_SIZE_METERS
    return min_x, min_y, min_x + SECTOR_SIZE_METERS, min_y + SECTOR_SIZE_METERS


def source_dir_for_tier(tier: str) -> Path:
    return SWEEP_ROOT / ("sources" if tier == "full" else "sources_low")


def source_path_for_sector(sector: str, tier: str) -> Path:
    return source_dir_for_tier(tier) / f"{sector}.png"


def encoded_dir_for_cell(cell: CodecCell) -> Path:
    return SWEEP_ROOT / "encoded" / cell.tier / cell.name


def encoded_path_for_cell_sector(cell: CodecCell, sector: str) -> Path:
    return encoded_dir_for_cell(cell) / f"{sector}.ktx2"


def content_crop_for_tier(tier: str) -> tuple[int, int, int, int]:
    pad = TEXTURE_PADDING_PX if tier == "full" else LOW_PADDING_PX
    size = TEXTURE_CONTENT_PX if tier == "full" else LOW_CONTENT_PX
    return pad, pad, pad + size, pad + size


def image_size_for_tier(tier: str) -> tuple[int, int]:
    return (TEXTURE_CANVAS_PX, TEXTURE_CANVAS_PX) if tier == "full" else (LOW_CANVAS_PX, LOW_CANVAS_PX)


def mip_dimensions(width: int, height: int) -> list[tuple[int, int]]:
    dims = []
    while True:
        dims.append((width, height))
        if width == 1 and height == 1:
            return dims
        width = max(1, width // 2)
        height = max(1, height // 2)


def gpu_bytes_for_block(width: int, height: int, block: tuple[int, int]) -> int:
    bw, bh = block
    return sum(math.ceil(w / bw) * math.ceil(h / bh) * 16 for w, h in mip_dimensions(width, height))


def default_results() -> dict:
    return {
        "meta": {
            "basisu": str(BASISU_BIN),
            "common_args": COMMON_BASISU_ARGS,
            "y_flip_encoded": True,
            "recovery_note": "Some early KTX2 outputs were recovered after restart; encode_seconds may be null for recovered files. Later resumed encodes omit basisu -parallel because it slows single-file encodes.",
        },
        "sectors": {
            s["sector"]: {"sx": s["sx"], "sy": s["sy"], "class": s["class"], "why": s["why"], "full": {}, "low": {}}
            for s in SELECTED_SECTORS
        },
    }


def load_results(path: Path | None = None) -> dict:
    path = path or SWEEP_ROOT / "results.json"
    if not path.exists():
        return default_results()
    return json.loads(path.read_text(encoding="utf-8"))


def save_results(results: dict, path: Path | None = None) -> None:
    path = path or SWEEP_ROOT / "results.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(results, indent=2, sort_keys=True) + "\n", encoding="utf-8")
