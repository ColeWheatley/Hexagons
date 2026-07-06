#!/usr/bin/env python3
"""Independent HEX4 binary parser used by the regression harness."""

from __future__ import annotations

import json
import struct
import sys
from pathlib import Path
from typing import Any

from hex4_common import (
    HEADER_SIZE,
    LAYER_SCALES,
    RECORD_SIZE,
    canonical_json,
    layer_center_axial,
)


HEADER_STRUCT = struct.Struct("<4siifffii")
COUNT_STRUCT = struct.Struct("<I")
RECORD_STRUCT = struct.Struct("<bbHhhhBBBBBx")


class Hex4ParseError(ValueError):
    pass


def _need(data: bytes, offset: int, size: int, label: str) -> None:
    if offset + size > len(data):
        raise Hex4ParseError(f"truncated while reading {label}: need {offset + size} bytes, have {len(data)}")


def parse_bytes(data: bytes, *, strict: bool = True) -> dict[str, Any]:
    _need(data, 0, HEADER_SIZE, "header")
    sig, sx, sy, min_z, max_z, scale_f, cq, cr = HEADER_STRUCT.unpack_from(data, 0)
    if sig != b"HEX4":
        raise Hex4ParseError(f"invalid signature {sig!r}")
    if scale_f == 0.0:
        raise Hex4ParseError("invalid zero height scale")

    offset = HEADER_SIZE
    layers: list[list[dict[str, Any]]] = []
    raw_counts: list[int] = []

    for layer_index, layer_scale in enumerate(LAYER_SCALES):
        _need(data, offset, COUNT_STRUCT.size, f"layer {layer_index} count")
        (count,) = COUNT_STRUCT.unpack_from(data, offset)
        raw_counts.append(count)
        offset += COUNT_STRUCT.size

        lcq, lcr = layer_center_axial(sx, sy, layer_scale)
        layer: list[dict[str, Any]] = []
        for record_index in range(count):
            _need(data, offset, RECORD_SIZE, f"layer {layer_index} record {record_index}")
            dq, dr, h_scaled, d1, d2, d3, s1, s2, s3, pnx, pnz = RECORD_STRUCT.unpack_from(data, offset)
            h = min_z + (h_scaled / scale_f)
            layer.append(
                {
                    "dq": dq,
                    "dr": dr,
                    "q": lcq + dq,
                    "r": lcr + dr,
                    "hScaled": h_scaled,
                    "h": h,
                    "deltas": [d1, d2, d3],
                    "slopes": [s1, s2, s3],
                    "norm": [pnx, pnz],
                }
            )
            offset += RECORD_SIZE
        layers.append(layer)

    if strict and offset != len(data):
        raise Hex4ParseError(f"trailing bytes after HEX4 payload: consumed {offset}, file has {len(data)}")

    return {
        "sx": sx,
        "sy": sy,
        "header": {
            "signature": "HEX4",
            "minZ": min_z,
            "maxZ": max_z,
            "scale": scale_f,
            "cq": cq,
            "cr": cr,
        },
        "stats": {"min": min_z, "max": max_z, "avg": (min_z + max_z) / 2.0, "base": min_z},
        "center": {"q": 0, "r": 0},
        "layerScales": list(LAYER_SCALES),
        "layerCounts": raw_counts,
        "layers": layers,
        "consumedBytes": offset,
        "byteLength": len(data),
    }


def parse_file(path: str | Path, *, strict: bool = True) -> dict[str, Any]:
    return parse_bytes(Path(path).read_bytes(), strict=strict)


def main(argv: list[str] | None = None) -> int:
    argv = argv if argv is not None else sys.argv[1:]
    if not argv:
        print("usage: parse_hex4.py PATH", file=sys.stderr)
        return 2
    try:
        parsed = parse_file(argv[0], strict="--allow-trailing" not in argv[1:])
    except Exception as exc:
        print(f"parse_hex4.py: {exc}", file=sys.stderr)
        return 1
    print(canonical_json(parsed))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
