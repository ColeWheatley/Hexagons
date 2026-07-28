"""Canonical PFL sidecar enum registry — the single source of truth shared by
the snowpack writer (snow_backend/snowpack/sidecar.py) and the avalanche
writer (snow_backend/avalanche/pfl.py).

Header (32 bytes, ratified: 8 reserved):
  'PFL1' | u16 version | u16 layerId | u32 epochHour | u32 tileCount |
  u16 nodeCount | u8 encoding | u8 aggregate | u32 manifestHash | 8 reserved
Body: tileCount x 2401 bytes, tile_manifest.json tiles[] order, depth-4 heap
order within tile.  Byte 0 = NODATA in every layer.
epochHour = unix_seconds // 3600 (UTC).  manifestHash = CRC32 of the manifest
tiles[] (yq, yr) <i4 sequence.
"""

PFL_MAGIC = b"PFL1"
PFL_VERSION = 1
PFL_NODE_COUNT = 2401
PFL_HEADER_FORMAT = "<4sHHIIHBBI8x"          # struct format, 32 bytes

# --- layer ids ---------------------------------------------------------------
PFL_LAYER_ID = {
    "sqh": 1,
    "depth": 2,
    "surface": 3,
    "avalanche": 4,
    "slab": 5,
    "hn24": 6,
    "hn72": 7,
    "wet": 8,
    "sdens": 9,
}
PFL_LAYER_ID_SQH = PFL_LAYER_ID["sqh"]
PFL_LAYER_ID_DEPTH = PFL_LAYER_ID["depth"]
PFL_LAYER_ID_SURFACE = PFL_LAYER_ID["surface"]
PFL_LAYER_ID_AVALANCHE = PFL_LAYER_ID["avalanche"]

# --- encoding ----------------------------------------------------------------
PFL_ENCODING = {"u8_linear": 1, "u8_class": 2, "packed_bits": 3}
PFL_ENCODING_U8_LINEAR = PFL_ENCODING["u8_linear"]
PFL_ENCODING_U8_CLASS = PFL_ENCODING["u8_class"]
PFL_ENCODING_PACKED_BITS = PFL_ENCODING["packed_bits"]

# --- aggregate reducer -------------------------------------------------------
PFL_AGGREGATE = {"mean": 1, "max": 2, "mode": 3, "or": 4}
PFL_AGGREGATE_MEAN = PFL_AGGREGATE["mean"]
PFL_AGGREGATE_MAX = PFL_AGGREGATE["max"]
PFL_AGGREGATE_MODE = PFL_AGGREGATE["mode"]
PFL_AGGREGATE_OR = PFL_AGGREGATE["or"]

# --- harmonized avalanche byte ----------------------------------------------
# bit 7 = release flag, bits 0-6 = severity; 0 = NODATA, 1 = simulated-none.
AVALANCHE_RELEASE_SHIFT = 7
AVALANCHE_RELEASE_BITS = 1
AVALANCHE_SEVERITY_SHIFT = 0
AVALANCHE_SEVERITY_BITS = 7
