"""Small read-only helpers shared by manifest and bake inventory code."""

from __future__ import annotations

import struct

import numpy as np


HEADER = struct.Struct("<4sHHiiiifffBBBBBxxxI")
UNIT_COUNT = 7 ** 5
UNIT_RECORD_BYTES = 14
AGGREGATE_BYTES = {(b"GSP1", 1): 8, (b"GSP2", 2): 12, (b"GSP3", 3): 16}


def read_unit_valid(path):
    """Read final-depth validity from any supported rolling GSP generation."""
    with open(path, "rb") as source:
        blob = source.read()
    if len(blob) < HEADER.size:
        raise ValueError(f"short GSP file: {path}")
    header = HEADER.unpack_from(blob)
    aggregate_bytes = AGGREGATE_BYTES.get((header[0], header[1]))
    if aggregate_bytes is None or header[2] != 5:
        raise ValueError(f"unsupported GSP header: {path}")

    offset = HEADER.size
    for depth in range(1, 5):
        if offset + 4 > len(blob):
            raise ValueError(f"truncated GSP depth {depth}: {path}")
        count = struct.unpack_from("<I", blob, offset)[0]
        if count != 7 ** depth:
            raise ValueError(f"GSP depth {depth} count mismatch: {path}")
        offset += 4 + count * aggregate_bytes

    if offset + 4 > len(blob):
        raise ValueError(f"truncated GSP unit count: {path}")
    count = struct.unpack_from("<I", blob, offset)[0]
    if count != UNIT_COUNT:
        raise ValueError(f"GSP unit count mismatch: {path}")
    offset += 4
    if offset + count * UNIT_RECORD_BYTES != len(blob):
        raise ValueError(f"GSP unit payload length mismatch: {path}")
    records = np.frombuffer(blob, dtype=np.uint8, count=count * UNIT_RECORD_BYTES, offset=offset)
    flags = records.reshape(count, UNIT_RECORD_BYTES)[:, 13]
    return (flags & 1).astype(bool, copy=True)

