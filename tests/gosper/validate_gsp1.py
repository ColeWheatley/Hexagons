#!/usr/bin/env python3
"""Validate legacy GSP1 and current GSP2 Gosper island binaries.

Usage:
  python3 tests/gosper/validate_gsp1.py frontend/app/tiles_bin/gosper_*.bin
  python3 tests/gosper/validate_gsp1.py frontend/app/tiles_bin/gosper_*.bin --dem hex_backend/DGM_Tirol_5m_epsg31254_2006_2020.tif
"""
import argparse
import os
import re
import struct
import sys

import numpy as np
import rasterio

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "hex_backend"))
import coordinate_utility as cu


HEADER = struct.Struct("<4sHHiiiifffBBBBBxxxI")
COUNT = struct.Struct("<I")
GSP1_AGG_DTYPE = np.dtype([
    ("dH", "<i2"), ("slopeMean", "u1"), ("slopeMax", "u1"),
    ("nx", "u1"), ("nz", "u1"), ("relief", "u1"), ("flags", "u1"),
])
GSP2_AGG_DTYPE = np.dtype([
    ("dH", "<i2"), ("slopeMean", "u1"), ("slopeMax", "u1"),
    ("nx", "u1"), ("nz", "u1"),
    ("downExtent", "<u2"), ("upExtent", "<u2"),
    ("flags", "u1"), ("reserved", "u1"),
])
UNIT_DTYPE = np.dtype([
    ("dH", "<i2"), ("d1", "<i2"), ("d2", "<i2"), ("d3", "<i2"),
    ("s1", "u1"), ("s2", "u1"), ("s3", "u1"),
    ("nx", "u1"), ("nz", "u1"), ("flags", "u1"),
])
AGG_DTYPES = {(b"GSP1", 1): GSP1_AGG_DTYPE, (b"GSP2", 2): GSP2_AGG_DTYPE}
FILENAME_RE = re.compile(r"gosper_(-?\d+)_(-?\d+)\.bin$")


def require(cond, msg):
    if not cond:
        raise AssertionError(msg)


def parse_file(path):
    data = open(path, "rb").read()
    require(len(data) >= HEADER.size, f"size {len(data)} < header {HEADER.size}")
    header = HEADER.unpack_from(data, 0)
    aggregate_dtype = AGG_DTYPES.get((header[0], header[1]))
    require(aggregate_dtype is not None, f"unsupported GSP format {(header[0], header[1])}")
    expected_size = HEADER.size + sum(
        COUNT.size + (7 ** depth) * (aggregate_dtype.itemsize if depth < 5 else UNIT_DTYPE.itemsize)
        for depth in range(1, 6)
    )
    require(len(data) == expected_size, f"size {len(data)} != {expected_size}")
    offset = HEADER.size
    records = {}

    for depth in range(1, 6):
        count = COUNT.unpack_from(data, offset)[0]
        offset += COUNT.size
        expected_count = 7 ** depth
        require(count == expected_count, f"depth {depth} count {count} != {expected_count}")
        dtype = aggregate_dtype if depth < 5 else UNIT_DTYPE
        nbytes = count * dtype.itemsize
        records[depth] = np.frombuffer(data, dtype=dtype, count=count, offset=offset).copy()
        offset += nbytes

    require(offset == len(data), f"parser stopped at {offset}, file has {len(data)} bytes")
    return header, records


def reconstruct_heights(h_mean, records):
    recon = {0: np.array([float(h_mean)], dtype=np.float64)}
    for depth in range(1, 6):
        parent = np.repeat(recon[depth - 1], 7)
        recon[depth] = parent + records[depth]["dH"].astype(np.float64) * 0.1
    return recon


def validate_header(path, header):
    filename = os.path.basename(path)
    match = FILENAME_RE.match(filename)
    require(match is not None, f"filename is not gosper_yq_yr.bin: {filename}")
    file_yq, file_yr = int(match.group(1)), int(match.group(2))

    (magic, version, tile_level, center_q, center_r, yq, yr,
     h_mean, h_min, h_max, s_mean, s_max, nx, nz, flags, reserved) = header

    require((magic, version) in AGG_DTYPES, f"bad magic/version {(magic, version)!r}")
    require(tile_level == cu.GOSPER_TILE_LEVEL, f"bad tileLevel {tile_level}")
    require((yq, yr) == (file_yq, file_yr), f"header lat {(yq, yr)} != filename {(file_yq, file_yr)}")
    expected_center = cu.gosper_lattice_to_center(yq, yr)
    require((center_q, center_r) == expected_center, f"center {(center_q, center_r)} != {expected_center}")
    require(reserved == 0, f"reserved {reserved} != 0")
    require(flags & 1, "root hasData flag is not set")
    require(h_min <= h_mean <= h_max, "hMean not inside hMin/hMax")
    require(0 <= s_mean <= 255 and 0 <= s_max <= 255 and 0 <= nx <= 255 and 0 <= nz <= 255, "packed header byte out of range")
    return {
        "center_q": center_q,
        "center_r": center_r,
        "yq": yq,
        "yr": yr,
        "h_mean": h_mean,
        "h_min": h_min,
        "h_max": h_max,
        "flags": flags,
    }


def validate_flags(header_flags, records):
    flags = {0: np.array([bool(header_flags & 1)])}
    for depth in range(1, 6):
        flags[depth] = (records[depth]["flags"] & 1).astype(bool)
    for depth in range(0, 5):
        child_or = flags[depth + 1].reshape(-1, 7).any(axis=1)
        require(np.array_equal(flags[depth], child_or), f"depth {depth} hasData != OR(children)")
    return flags


def validate_aggregates(recon, flags, records):
    valid_units = flags[5]
    require(np.any(valid_units), "no valid unit records")
    valid_h = recon[5][valid_units]
    require(np.all((valid_h > -500.0) & (valid_h < 9000.0)), "valid unit height outside DEM range")

    count = valid_units.astype(np.int32)
    h_sum = np.where(valid_units, recon[5], 0.0)
    h_min = np.where(valid_units, recon[5], np.inf)
    h_max = np.where(valid_units, recon[5], -np.inf)

    for depth in range(4, -1, -1):
        count = count.reshape(-1, 7).sum(axis=1)
        h_sum = h_sum.reshape(-1, 7).sum(axis=1)
        h_min = h_min.reshape(-1, 7).min(axis=1)
        h_max = h_max.reshape(-1, 7).max(axis=1)
        has_data = count > 0
        truth = np.zeros_like(h_sum, dtype=np.float64)
        truth[has_data] = h_sum[has_data] / count[has_data]

        if depth > 0:
            err = np.abs(recon[depth][has_data] - truth[has_data])
            require(err.size == 0 or float(err.max()) <= 0.35, f"depth {depth} aggregate height max error {err.max():.3f}m")
            if "relief" in records[depth].dtype.names:
                relief = records[depth]["relief"].astype(np.float64) * 4.0
                derived_relief = h_max - h_min
                rel_err = np.abs(relief[has_data] - derived_relief[has_data])
                require(rel_err.size == 0 or float(rel_err.max()) <= 8.0, f"depth {depth} relief max error {rel_err.max():.3f}m")
            else:
                require(np.all(records[depth]["reserved"] == 0), f"depth {depth} nonzero GSP2 reserved byte")
                lower = recon[depth] - records[depth]["downExtent"].astype(np.float64) * 0.1
                upper = recon[depth] + records[depth]["upExtent"].astype(np.float64) * 0.1
                require(np.all(lower[has_data] <= h_min[has_data] + 1e-9), f"depth {depth} downExtent clips descendants")
                require(np.all(upper[has_data] >= h_max[has_data] - 1e-9), f"depth {depth} upExtent clips descendants")
                require(np.all(h_min[has_data] - lower[has_data] < 0.16), f"depth {depth} downExtent is unexpectedly loose")
                require(np.all(upper[has_data] - h_max[has_data] < 0.16), f"depth {depth} upExtent is unexpectedly loose")
        else:
            root_err = abs(float(recon[0][0] - truth[0]))
            require(root_err <= 0.35, f"root height mean error {root_err:.3f}m")

    return valid_h


def validate_dem_crosscheck(parsed, records, recon, flags, dem_ds):
    if dem_ds is None:
        return

    geom = cu.gosper_tile_geometry()
    center_x, center_y = cu.axial_to_world_meters(parsed["center_q"], parsed["center_r"])
    unit_x = center_x + geom["offx"]
    unit_y = center_y + geom["offy"]
    valid_idx = np.flatnonzero(flags[5])
    require(valid_idx.size > 0, "DEM cross-check has no valid units")

    seed = ((parsed["yq"] * 73856093) ^ (parsed["yr"] * 19349663)) & 0xFFFFFFFF
    rng = np.random.default_rng(seed)
    sample_count = min(200, valid_idx.size)
    chosen = rng.choice(valid_idx, size=sample_count, replace=False)
    xs = unit_x[chosen]
    ys = unit_y[chosen]
    rows, cols = rasterio.transform.rowcol(dem_ds.transform, xs, ys)
    rows = np.asarray(rows, dtype=np.int64)
    cols = np.asarray(cols, dtype=np.int64)
    inside = (rows >= 0) & (rows < dem_ds.height) & (cols >= 0) & (cols < dem_ds.width)
    require(np.all(inside), "valid unit sampled outside DEM")

    r0, r1 = int(rows.min()), int(rows.max())
    c0, c1 = int(cols.min()), int(cols.max())
    window = rasterio.windows.Window(c0, r0, c1 - c0 + 1, r1 - r0 + 1)
    data = dem_ds.read(1, window=window)
    dem_h = data[rows - r0, cols - c0].astype(np.float64)
    dem_valid = np.isfinite(dem_h)
    if dem_ds.nodata is not None:
        dem_valid &= dem_h != dem_ds.nodata
    dem_valid &= (dem_h > -500.0) & (dem_h < 9000.0)
    require(np.all(dem_valid), "valid unit cross-check hit invalid DEM sample")

    err = np.abs(recon[5][chosen] - dem_h)
    require(float(err.max()) <= 0.35, f"DEM cross-check max error {err.max():.3f}m")


def validate_file(path, dem_ds=None):
    header, records = parse_file(path)
    parsed = validate_header(path, header)
    recon = reconstruct_heights(parsed["h_mean"], records)
    require(float(recon[0][0]) == float(parsed["h_mean"]), "root recon != hMean")

    flags = validate_flags(parsed["flags"], records)
    valid_h = validate_aggregates(recon, flags, records)
    require(abs(float(valid_h.min()) - float(parsed["h_min"])) <= 0.15, "hMin header mismatch")
    require(abs(float(valid_h.max()) - float(parsed["h_max"])) <= 0.15, "hMax header mismatch")
    validate_dem_crosscheck(parsed, records, recon, flags, dem_ds)

    print(
        f"PASS {os.path.basename(path)}: valid={flags[5].sum()} "
        f"h=[{valid_h.min():.1f},{valid_h.max():.1f}]"
    )


def main():
    parser = argparse.ArgumentParser(description="Validate GSP1/GSP2 Gosper island binaries")
    parser.add_argument("bins", nargs="+", help="GSP1 or GSP2 .bin files")
    parser.add_argument("--dem", help="Optional DEM path for direct sample cross-checks")
    args = parser.parse_args()

    dem_ds = rasterio.open(args.dem) if args.dem else None
    ok = True
    try:
        for path in args.bins:
            try:
                validate_file(path, dem_ds)
            except Exception as exc:
                ok = False
                print(f"FAIL {path}: {exc}", file=sys.stderr)
    finally:
        if dem_ds is not None:
            dem_ds.close()
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
