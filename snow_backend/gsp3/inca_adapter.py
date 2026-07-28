"""INCA (GeoSphere Austria, inca-v1-1h-1km) -> per-tile node forcing adapter.

The hub delivers NetCDF4/HDF5 subsets on the 1 km EPSG:31287 Lambert grid
(dims time/y/x; integer-packed variables with per-variable scale_factor;
x/y integer metre coordinates; time = seconds since 1961-01-01 UTC).

Reader backends, in order of preference: netCDF4, h5py, `ncdump` subprocess
(text parse — slow but dependency-free; works on the dev Mac where no python
HDF5 stack is installed).  All backends produce identical float32 output with
fills as NaN.

Bilinear sampling: tile centres (EPSG:31254 world metres) are transformed to
EPSG:31287 once and looked up in the file's actual x/y axes — no hard-coded
grid origin, so a re-downloaded subset with a different bbox just works.
"""

from __future__ import annotations

import re
import subprocess
from dataclasses import dataclass

import numpy as np

VARIABLES = ("T2M", "TD2M", "RH2M", "RR", "GL", "UU", "VV", "P0")
# Output units after conversion (SI-leaning, engine contract):
#   T2M, TD2M -> K;  RH2M -> %;  RR -> kg m-2 (1h sum);  GL -> W m-2;
#   UU, VV -> m s-1;  P0 -> Pa
KELVIN_VARS = {"T2M", "TD2M"}
TIME_EPOCH = np.datetime64("1961-01-01T00:00:00")


# --------------------------------------------------------------------------
# Backends: each returns dict {var: float32 [T,y,x] with NaN fills},
# plus x (int[X] m), y (int[Y] m), time (datetime64[s] [T]).
# --------------------------------------------------------------------------

def _read_netcdf4(path, variables):
    import netCDF4
    with netCDF4.Dataset(path) as ds:
        x = np.asarray(ds["x"][:], dtype=np.int64)
        y = np.asarray(ds["y"][:], dtype=np.int64)
        time = TIME_EPOCH + np.asarray(ds["time"][:], dtype="timedelta64[s]")
        out = {}
        for v in variables:
            var = ds[v]
            var.set_auto_maskandscale(True)
            data = np.ma.filled(var[:], np.nan).astype(np.float32)
            out[v] = data
    return out, x, y, time


def _read_h5py(path, variables):
    import h5py
    with h5py.File(path, "r") as f:
        x = np.asarray(f["x"][:], dtype=np.int64)
        y = np.asarray(f["y"][:], dtype=np.int64)
        time = TIME_EPOCH + np.asarray(f["time"][:], dtype="timedelta64[s]")
        out = {}
        for v in variables:
            ds = f[v]
            raw = ds[:].astype(np.float64)
            fill = ds.attrs.get("_FillValue", [None])[0]
            scale = float(ds.attrs.get("scale_factor", [1.0])[0])
            offs = float(ds.attrs.get("add_offset", [0.0])[0])
            data = raw * scale + offs
            if fill is not None:
                data[raw == fill] = np.nan
            out[v] = data.astype(np.float32)
    return out, x, y, time


_NCDUMP_NUM = re.compile(r"-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|_")


def _ncdump_var(path, name):
    """Parse `ncdump -v NAME` numeric payload ('_' = fill -> nan)."""
    text = subprocess.run(["ncdump", "-v", name, "-p", "9,17", path],
                          check=True, capture_output=True, text=True).stdout
    payload = text[text.index("data:"):]
    m = re.search(rf"^\s{re.escape(name)}\s*=", payload, re.M)
    seg = payload[m.end():payload.index(";", m.end())]
    return np.array([np.nan if tok == "_" else float(tok)
                     for tok in _NCDUMP_NUM.findall(seg)])


def _ncdump_attrs(path):
    hdr = subprocess.run(["ncdump", "-h", path], check=True,
                         capture_output=True, text=True).stdout
    scale = dict(re.findall(r"(\w+):scale_factor = ([\d.eE+-]+)", hdr))
    fill = dict(re.findall(r"(\w+):_FillValue = (-?\d+)", hdr))
    dims = dict(re.findall(r"\t(\w+) = (\d+) ;", hdr))
    return ({k: float(v) for k, v in scale.items()},
            {k: float(v) for k, v in fill.items()},
            {k: int(v) for k, v in dims.items()})


def _read_ncdump(path, variables):
    scale, fill, dims = _ncdump_attrs(path)
    nt, ny, nx = dims["time"], dims["y"], dims["x"]
    x = _ncdump_var(path, "x").astype(np.int64)
    y = _ncdump_var(path, "y").astype(np.int64)
    time = TIME_EPOCH + _ncdump_var(path, "time").astype("timedelta64[s]")
    out = {}
    for v in variables:
        raw = _ncdump_var(path, v)
        if raw.size != nt * ny * nx:
            raise ValueError(f"{path}:{v} has {raw.size} values, want {nt*ny*nx}")
        data = raw.reshape(nt, ny, nx)
        if v in fill:  # ncdump already prints '_' for fills, belt & braces
            data[data == fill[v]] = np.nan
        out[v] = (data * scale.get(v, 1.0)).astype(np.float32)
    return out, x, y, time


def read_inca(path, variables=VARIABLES):
    for backend in (_read_netcdf4, _read_h5py, _read_ncdump):
        try:
            return backend(path, variables)
        except ImportError:
            continue
    raise RuntimeError("no INCA reader backend available (netCDF4/h5py/ncdump)")


# --------------------------------------------------------------------------
# Bilinear node sampling
# --------------------------------------------------------------------------

@dataclass(frozen=True)
class BilinearMap:
    """Sampling weights of n points on a regular x/y grid."""
    ix: np.ndarray      # [n] lower x index
    iy: np.ndarray      # [n] lower y index
    w: np.ndarray       # [n, 4] weights for (iy,ix),(iy,ix+1),(iy+1,ix),(iy+1,ix+1)
    x31287: np.ndarray
    y31287: np.ndarray

    def apply(self, field: np.ndarray) -> np.ndarray:
        """field [..., Y, X] -> [..., n]"""
        c00 = field[..., self.iy, self.ix]
        c01 = field[..., self.iy, self.ix + 1]
        c10 = field[..., self.iy + 1, self.ix]
        c11 = field[..., self.iy + 1, self.ix + 1]
        return (c00 * self.w[:, 0] + c01 * self.w[:, 1]
                + c10 * self.w[:, 2] + c11 * self.w[:, 3]).astype(np.float32)


def bilinear_map(points_x31254, points_y31254, grid_x, grid_y) -> BilinearMap:
    from pyproj import Transformer
    tr = Transformer.from_crs("EPSG:31254", "EPSG:31287", always_xy=True)
    px, py = tr.transform(np.asarray(points_x31254), np.asarray(points_y31254))
    dx = float(grid_x[1] - grid_x[0]); dy = float(grid_y[1] - grid_y[0])
    fx = (px - grid_x[0]) / dx
    fy = (py - grid_y[0]) / dy
    ix = np.clip(np.floor(fx).astype(np.int64), 0, len(grid_x) - 2)
    iy = np.clip(np.floor(fy).astype(np.int64), 0, len(grid_y) - 2)
    if (fx < -0.5).any() or (fx > len(grid_x) - 0.5).any() \
            or (fy < -0.5).any() or (fy > len(grid_y) - 0.5).any():
        raise ValueError("point(s) outside INCA subset grid")
    tx = np.clip(fx - ix, 0.0, 1.0); ty = np.clip(fy - iy, 0.0, 1.0)
    w = np.stack([(1 - tx) * (1 - ty), tx * (1 - ty),
                  (1 - tx) * ty, tx * ty], axis=1)
    return BilinearMap(ix=ix, iy=iy, w=w, x31287=px, y31287=py)


def extract_node_series(paths, tile_x31254, tile_y31254, variables=VARIABLES):
    """Monthly INCA files -> (forcing [T, n_tiles, n_vars] f32, time [T]).

    Files are concatenated in the given order; unit conversion to the engine
    contract (Kelvin for T2M/TD2M) is applied here.
    """
    chunks, times, bmap = [], [], None
    for path in paths:
        data, x, y, time = read_inca(path, variables)
        if bmap is None:
            bmap = bilinear_map(tile_x31254, tile_y31254, x, y)
            grid0 = (x[0], y[0], len(x), len(y))
        elif (x[0], y[0], len(x), len(y)) != grid0:
            raise ValueError(f"{path}: grid mismatch across files")
        block = np.stack([bmap.apply(data[v]) for v in variables], axis=-1)
        for j, v in enumerate(variables):
            if v in KELVIN_VARS:
                block[..., j] += 273.15
        chunks.append(block)
        times.append(time)
    forcing = np.concatenate(chunks, axis=0)
    time = np.concatenate(times)
    if not (np.diff(time) == np.timedelta64(3600, "s")).all():
        raise ValueError("time axis is not contiguous hourly")
    return forcing, time, bmap
