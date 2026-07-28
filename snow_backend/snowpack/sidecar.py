"""Sidecar (.pfl) emission + index.json/latest.json — the frontend contract.

File: <base>/<layer>/<YYYY>/<MM>/<DD>/<HH>.pfl
Body: tileCount x 2401 bytes, tiles in tile_manifest.json tiles[] order,
depth-4 heap order within tile.  Byte 0 = NODATA in every layer; real domain
is 1..255 (u8_linear: value = (byte-1)/254 * (hi-lo) + lo; u8_class: byte is
the class index, classes[0] reserved for NODATA).

Header: exactly 32 bytes, always written:
  'PFL1' | u16 version | u16 layerId | u32 epochHour | u32 tileCount |
  u16 nodeCount | u8 encoding | u8 aggregate | u32 manifestHash | 8 reserved
(The design doc's field list said "12 reserved", which would make 36 B, but
the consumer takes the body from offset 32 — offset 32 wins; reserved is 8.)
epochHour = unix_seconds // 3600 of the forecast hour (UTC).
manifestHash = CRC32 of the raw tile_manifest.json file bytes (ruled;
beta-stubai: 3511903013 — pfl_enums.manifest_hash)
(terrain_pack.manifest_hash_u32).
"""

from __future__ import annotations

import base64
import json
import os
import struct
import sys
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from pfl_enums import (PFL_AGGREGATE as AGGREGATE,  # noqa: E402
                       PFL_ENCODING as ENCODING,
                       PFL_HEADER_FORMAT, PFL_LAYER_ID, PFL_MAGIC,
                       PFL_NODE_COUNT as N_NODES, PFL_VERSION)

HEADER_STRUCT = struct.Struct(PFL_HEADER_FORMAT)   # 32 bytes
assert HEADER_STRUCT.size == 32

SURFACE_CLASSES = ["—", "powder", "settled", "wind slab", "crust",
                   "wet", "refrozen", "bare"]
WET_CLASSES = ["—", "dry", "moist", "wet", "refrozen"]

# id, encoding, aggregate, domain/classes, units, ramp, in frontend index?
LAYERS = {
    "sqh":     dict(id=1, encoding="u8_linear", aggregate="mean",
                    domain=[0, 100], units="SQH", ramp="powder",
                    label="Snow quality", short="SQH", display=True),
    "depth":   dict(id=2, encoding="u8_linear", aggregate="mean",
                    domain=[0, 500], units="cm", ramp="depth",
                    label="Snow depth", short="HS", display=True),
    "surface": dict(id=3, encoding="u8_class", aggregate="mode",
                    classes=SURFACE_CLASSES, ramp="surface",
                    label="Surface state", short="SFC", display=True),
    # avalanche (id=4) is emitted by the avalanche pipeline, declared in the
    # index we own (per-field aggregate amendment).
    "slab":    dict(id=5, encoding="u8_linear", aggregate="max",
                    domain=[0, 508], units="cm", ramp="hazard",
                    label="Slab above weak layer", short="SLAB", display=False),
    "hn24":    dict(id=6, encoding="u8_linear", aggregate="mean",
                    domain=[0, 254], units="mm w.e.", ramp="depth",
                    label="New snow 24h", short="HN24", display=False),
    "hn72":    dict(id=7, encoding="u8_linear", aggregate="mean",
                    domain=[0, 254], units="mm w.e.", ramp="depth",
                    label="New snow 72h", short="HN72", display=False),
    "wet":     dict(id=8, encoding="u8_class", aggregate="mode",
                    classes=WET_CLASSES, ramp="surface",
                    label="Surface wetness", short="WET", display=False),
    "sdens":   dict(id=9, encoding="u8_linear", aggregate="mean",
                    domain=[0, 1016], units="kg/m3", ramp="depth",
                    label="Surface density", short="RHO", display=False),
}

# Layer ids must agree with the shared registry (avalanche writer relies on it).
assert all(spec["id"] == PFL_LAYER_ID[name] for name, spec in LAYERS.items())

AVALANCHE_LAYER_INDEX_ENTRY = {
    "id": "avalanche", "label": "Avalanche", "encoding": "packed_bits",
    "fields": {
        "release":  {"shift": 7, "bits": 1, "aggregate": "or",
                     "domain": [0, 1]},
        "severity": {"shift": 0, "bits": 7, "aggregate": "max",
                     "domain": [1, 127]},
    },
    "ramp": "hazard", "nodata": 0, "short": "AVY",
}

WINTER_START = np.datetime64("2025-11-01T00:00:00")
COVERAGE_COUNT = 4344            # 2025-11-01 -> 2026-05-01, hourly


def epoch_hour(t: np.datetime64) -> int:
    return int(np.datetime64(t, "s").astype("int64") // 3600)


def slot_of(t: np.datetime64) -> int:
    return int((np.datetime64(t, "h") - WINTER_START.astype("datetime64[h]"))
               .astype(int))


def pfl_path(base: str, layer: str, t: np.datetime64) -> str:
    s = str(np.datetime64(t, "s"))                   # YYYY-MM-DDTHH:..
    return os.path.join(base, layer, s[0:4], s[5:7], s[8:10], s[11:13] + ".pfl")


def write_pfl(base: str, layer: str, t: np.datetime64, body: np.ndarray,
              tile_count: int, manifest_hash: int) -> str:
    spec = LAYERS[layer]
    body = np.ascontiguousarray(body, dtype=np.uint8)
    if body.size != tile_count * N_NODES:
        raise ValueError(f"{layer}: body {body.size} != {tile_count}x{N_NODES}")
    header = HEADER_STRUCT.pack(
        PFL_MAGIC, PFL_VERSION, spec["id"], epoch_hour(t), tile_count, N_NODES,
        ENCODING[spec["encoding"]], AGGREGATE[spec["aggregate"]],
        manifest_hash)
    path = pfl_path(base, layer, t)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as fh:
        fh.write(header)
        fh.write(body.tobytes())
    return path


def read_pfl(path: str):
    with open(path, "rb") as fh:
        blob = fh.read()
    if blob[:4] == PFL_MAGIC:
        fields = HEADER_STRUCT.unpack_from(blob)
        return fields, np.frombuffer(blob, np.uint8, offset=32)
    return None, np.frombuffer(blob, np.uint8)


def coverage_mask_b64(present_slots) -> str:
    bits = np.zeros(COVERAGE_COUNT, dtype=bool)
    bits[np.asarray(list(present_slots), dtype=int)] = True
    return base64.b64encode(np.packbits(bits).tobytes()).decode()


def build_index(tile_count: int, manifest_profile: str, present_slots,
                latest_t: np.datetime64, cache_key: str = "pf-1.0.0",
                url_template: str = "powfinder/{layer}/{yyyy}/{mm}/{dd}/{hh}.pfl",
                include_avalanche: bool = True) -> dict:
    layers = []
    for name, spec in LAYERS.items():
        if not spec["display"]:
            continue
        entry = {"id": name, "label": spec["label"],
                 "encoding": spec["encoding"], "aggregate": spec["aggregate"],
                 "ramp": spec["ramp"], "nodata": 0, "short": spec["short"]}
        if "domain" in spec:
            entry["domain"] = spec["domain"]
            entry["units"] = spec["units"]
        if "classes" in spec:
            entry["classes"] = spec["classes"]
        layers.append(entry)
        if name == "depth" and include_avalanche:
            layers.append(AVALANCHE_LAYER_INDEX_ENTRY)
    now = np.datetime64("now", "s")
    return {
        "schema": 1,
        "generated_at": str(now) + "Z",
        "tile_order": "manifest",
        "tile_count": tile_count,
        "node_count": N_NODES,
        "manifest_profile": manifest_profile,
        "cache_key": cache_key,
        "url_template": url_template,
        "coverage": {"start": str(WINTER_START) + "Z", "step_hours": 1,
                     "count": COVERAGE_COUNT,
                     "present": coverage_mask_b64(present_slots)},
        "latest": str(np.datetime64(latest_t, "s")) + "Z",
        "layers": layers,
        "engine_layers": sorted(n for n, s in LAYERS.items()
                                if not s["display"]),
    }


def write_index(base: str, index: dict) -> None:
    with open(os.path.join(base, "index.json"), "w") as fh:
        json.dump(index, fh, indent=1)
    with open(os.path.join(base, "latest.json"), "w") as fh:
        json.dump({"latest": index["latest"],
                   "generated_at": index["generated_at"]}, fh)
