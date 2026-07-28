"""GSP3 tile binary reader for the snowpack column registry.

Ground truth: hex_backend/waffle_iron.py (GSP_HEADER_STRUCT, GSP3_AGG_DTYPE,
GSP1_UNIT_DTYPE, _pack_gsp3_blob).  Layout of a level-5 island file:

    bytes 0..48        header  <4sHHiiiifffBBBBBxxxI
                       magic, version, tileLevel, centerQ, centerR, latQ, latR,
                       root_h(f32, absolute m), h_min, h_max,
                       rootSlopeMean, rootSlopeMax, rootNx, rootNz, rootFlags,
                       pad*3, u32(0)
    depth d = 1..4     <u32 count(=7^d)  +  count x 16B GSP3 aggregate records
    depth 5 (units)    <u32 count(=16807) + 16807 x 14B unit records
    total              280,166 bytes

The root (L5) aggregate lives in the header.  L1 snowpack columns are the
depth-4 block: 2,401 records at byte offsets 6,448 .. 44,864, heap-ordered
(children of node i are 7i..7i+6; child 0 is concentric with its parent).

Heights reconstruct as recon(d,i) = recon(d-1, i//7) + dH*0.1 with dH i16
decimetres; recon(0) = header.root_h.

Normals unpack as n = (packed-128)/127 for the two horizontal components
(east = nx, north = nz), n_up = sqrt(max(0, 1-ne^2-nn^2)); the horizontal
component points downslope, so aspect = atan2(n_east, n_north), clockwise
from north.  Slopes are stored in whole degrees (u8).
"""

from __future__ import annotations

import struct
from dataclasses import dataclass

import numpy as np

GSP3_MAGIC = b"GSP3"
GSP3_VERSION = 3
TILE_LEVEL = 5
DEPTH_COUNTS = (1, 7, 49, 343, 2401, 16807)
N_COLUMNS = 2401          # L1 columns per tile (depth-4 nodes)
UNITS_PER_COLUMN = 7

HEADER_STRUCT = struct.Struct("<4sHHiiiifffBBBBBxxxI")   # 48 bytes

AGG_DTYPE = np.dtype([
    ("dH", "<i2"), ("slopeMean", "u1"), ("slopeMax", "u1"),
    ("nx", "u1"), ("nz", "u1"),
    ("downExtent", "<u2"), ("upExtent", "<u2"),
    ("renderDown", "<u2"), ("renderUp", "<u2"),
    ("flags", "u1"), ("reserved", "u1"),
])                                                        # 16 bytes

UNIT_DTYPE = np.dtype([
    ("dH", "<i2"), ("d1", "<i2"), ("d2", "<i2"), ("d3", "<i2"),
    ("s1", "u1"), ("s2", "u1"), ("s3", "u1"),
    ("nx", "u1"), ("nz", "u1"), ("flags", "u1"),
])                                                        # 14 bytes

EXPECTED_FILE_BYTES = (
    HEADER_STRUCT.size
    + sum(4 + (7 ** d) * AGG_DTYPE.itemsize for d in range(1, TILE_LEVEL))
    + 4 + DEPTH_COUNTS[TILE_LEVEL] * UNIT_DTYPE.itemsize
)                                                         # 280,166


@dataclass(frozen=True)
class Gsp3Header:
    magic: bytes
    version: int
    tile_level: int
    center_q: int
    center_r: int
    lat_q: int
    lat_r: int
    root_h: float
    h_min: float
    h_max: float
    root_slope_mean: int
    root_slope_max: int
    root_nx: int
    root_nz: int
    root_flags: int


@dataclass(frozen=True)
class Gsp3Tile:
    header: Gsp3Header
    aggs: dict          # depth (1..4) -> structured array of AGG_DTYPE
    units: np.ndarray   # structured array of UNIT_DTYPE, 16,807 records
    recon: dict         # depth (0..5) -> float64 reconstructed heights (m)


def parse_gsp3(blob: bytes) -> Gsp3Tile:
    """Parse a GSP3 blob, validating layout, and reconstruct all heights."""
    if len(blob) != EXPECTED_FILE_BYTES:
        raise ValueError(f"GSP3 blob is {len(blob)} B, expected {EXPECTED_FILE_BYTES}")
    fields = HEADER_STRUCT.unpack_from(blob)
    header = Gsp3Header(*fields[:15])
    if header.magic != GSP3_MAGIC or header.version != GSP3_VERSION:
        raise ValueError(f"not a GSP3 blob: magic={header.magic!r} v{header.version}")
    if header.tile_level != TILE_LEVEL:
        raise ValueError(f"unsupported tile level {header.tile_level}")

    offset = HEADER_STRUCT.size
    aggs = {}
    for depth in range(1, TILE_LEVEL):
        (count,) = struct.unpack_from("<I", blob, offset)
        if count != DEPTH_COUNTS[depth]:
            raise ValueError(f"depth {depth} count {count} != {DEPTH_COUNTS[depth]}")
        offset += 4
        aggs[depth] = np.frombuffer(blob, dtype=AGG_DTYPE, count=count, offset=offset)
        offset += count * AGG_DTYPE.itemsize

    (count,) = struct.unpack_from("<I", blob, offset)
    if count != DEPTH_COUNTS[TILE_LEVEL]:
        raise ValueError(f"unit count {count} != {DEPTH_COUNTS[TILE_LEVEL]}")
    offset += 4
    units = np.frombuffer(blob, dtype=UNIT_DTYPE, count=count, offset=offset)
    if offset + count * UNIT_DTYPE.itemsize != len(blob):
        raise ValueError("unit payload length mismatch")

    recon = {0: np.array([header.root_h], dtype=np.float64)}
    for depth in range(1, TILE_LEVEL):
        parent = np.repeat(recon[depth - 1], 7)
        recon[depth] = parent + aggs[depth]["dH"].astype(np.float64) * 0.1
    recon[TILE_LEVEL] = (np.repeat(recon[TILE_LEVEL - 1], 7)
                         + units["dH"].astype(np.float64) * 0.1)
    return Gsp3Tile(header=header, aggs=aggs, units=units, recon=recon)


def read_gsp3(path: str) -> Gsp3Tile:
    with open(path, "rb") as fh:
        return parse_gsp3(fh.read())


def unpack_normals(nx_u8: np.ndarray, nz_u8: np.ndarray):
    """u8-packed horizontal normal components -> (n_east, n_north, n_up) f64.

    Mirrors waffle_iron._unpack_normals: nx is the world-x (east) component,
    nz the world-y (north) component; up is reconstructed.
    """
    n_east = (nx_u8.astype(np.float64) - 128.0) / 127.0
    n_north = (nz_u8.astype(np.float64) - 128.0) / 127.0
    n_up = np.sqrt(np.maximum(0.0, 1.0 - n_east**2 - n_north**2))
    return n_east, n_north, n_up


def l1_terrain(tile: Gsp3Tile) -> dict:
    """Per-column (L1 / depth-4, heap order) terrain features.

    Returns dict of 2,401-length arrays:
      elev_m f64, slope_mean_deg u8, slope_max_deg u8,
      n_east/n_north/n_up f64, aspect_rad f64 (atan2(E, N), cw from north;
      0 where the packed normal is exactly vertical), svf f64, valid bool.
    """
    agg = tile.aggs[4]
    n_east, n_north, n_up = unpack_normals(agg["nx"], agg["nz"])
    horiz = np.hypot(n_east, n_north)
    aspect = np.where(horiz > 0.0, np.arctan2(n_east, n_north), 0.0)
    # Sky-view factor from the normal's slope angle: isotropic (1+cos S)/2.
    svf = (1.0 + n_up) / 2.0
    return {
        "elev_m": tile.recon[4],
        "slope_mean_deg": agg["slopeMean"].copy(),
        "slope_max_deg": agg["slopeMax"].copy(),
        "n_east": n_east, "n_north": n_north, "n_up": n_up,
        "aspect_rad": aspect,
        "svf": svf,
        "valid": (agg["flags"] & 1).astype(bool),
    }
