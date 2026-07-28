# @atlas: PFL sidecar writer: 32-byte PFL1 header (magic, version, layerId, epochHour, tileCount, nodeCount, encoding, aggregate, manifestHash, 8 reserved) + tileCount x 2401 body, atomic write to <out>/avalanche/YYYY/MM/DD/HH.pfl; enum values centralized in config for byte-exact alignment with the snowpack writer.
import json
import os
import struct
from datetime import datetime, timezone

from snow_backend import pfl_enums

from . import config

# Header layout and enums come from the canonical registry
# (snow_backend/pfl_enums.py); 8 reserved bytes, 32 total, ratified.
_HEADER_FMT = pfl_enums.PFL_HEADER_FORMAT
assert struct.calcsize(_HEADER_FMT) == 32


def manifest_hash():
    """CRC32 of the raw tile_manifest.json bytes (coupling guard)."""
    return pfl_enums.manifest_hash(str(config.TILE_MANIFEST))


def epoch_hour(when_dt):
    return int(when_dt.replace(tzinfo=timezone.utc).timestamp() // 3600)


def header(when_dt, tile_count):
    return struct.pack(
        _HEADER_FMT,
        b"PFL1",
        config.PFL_VERSION,
        config.PFL_LAYER_ID_AVALANCHE,
        epoch_hour(when_dt),
        tile_count,
        config.TILE_BYTES,
        config.PFL_ENCODING_PACKED_BITS,
        config.PFL_AGGREGATE_MAX,
        manifest_hash(),
    )


def sidecar_path(when_dt, base=None):
    base = base or (config.OUT_DIR)
    return (
        base / "avalanche" / f"{when_dt.year:04d}" / f"{when_dt.month:02d}"
        / f"{when_dt.day:02d}" / f"{when_dt.hour:02d}.pfl"
    )


def write_sidecar(when_dt, packed, meta=None, base=None):
    """Atomic write of header+body; optional sibling HH.meta.json (debug,
    not part of the consumer contract). Returns the sidecar path."""
    path = sidecar_path(when_dt, base)
    path.parent.mkdir(parents=True, exist_ok=True)
    blob = header(when_dt, packed.shape[0]) + packed.tobytes()
    tmp = str(path) + ".tmp"
    with open(tmp, "wb") as f:
        f.write(blob)
    os.replace(tmp, path)
    if meta is not None:
        mp = path.with_suffix(".meta.json")
        tmp = str(mp) + ".tmp"
        with open(tmp, "w") as f:
            json.dump(meta, f, indent=1)
        os.replace(tmp, mp)
    return path


def read_sidecar(path):
    """Parse header+body (round-trip check / debugging)."""
    raw = open(path, "rb").read()
    magic, ver, layer, eh, tc, nc, enc, agg, mh = struct.unpack(
        _HEADER_FMT, raw[:32]
    )
    assert magic == b"PFL1", "bad magic"
    body = raw[32:]
    assert len(body) == tc * nc, "body size mismatch"
    import numpy as np

    return dict(
        version=ver, layer_id=layer, epoch_hour=eh, tile_count=tc,
        node_count=nc, encoding=enc, aggregate=agg, manifest_hash=mh,
        when=datetime.fromtimestamp(eh * 3600, tz=timezone.utc),
        body=np.frombuffer(body, dtype=np.uint8).reshape(tc, nc),
    )
