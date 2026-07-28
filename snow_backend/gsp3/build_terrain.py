"""Build all gsp3-side artifacts: terrain pack, centroid export, INCA node
map, winter node-forcing pack, station->column table.

    cd <repo> && pixi run python snow_backend/gsp3/build_terrain.py \
        [--inca-dir DIR] [--stations FILE] [--out DIR]

The node-forcing pack is the engine's forcing input:
  node_forcing_winter.npz
    forcing  f32 [T, n_tiles, 8]   T2M,TD2M(K) RH2M(%) RR(kg/m2) GL(W/m2)
                                   UU,VV(m/s) P0(Pa)
    glcs     f32 [T, n_tiles]      clear-sky GHI at node elevation
    sun_enu  f32 [T, n_tiles, 3]   unit sun vector (E, N, up)
    time_s   i64 [T]               seconds since epoch, UTC, hourly
"""

from __future__ import annotations

import argparse
import glob
import json
import os
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.abspath(os.path.join(HERE, "..", "snowpack")))

import terrain_pack  # noqa: E402
from gosper_geometry import column_of_point  # noqa: E402
from inca_adapter import VARIABLES, bilinear_map, extract_node_series, read_inca  # noqa: E402

DEFAULT_SCRATCH = ("/private/tmp/claude-501/-Users-cole-dev/"
                   "af754c65-5383-45a7-ae6c-4108255c1107/scratchpad")


def gap_fill_time(forcing):
    """Linear-interp NaN gaps along the time axis per (tile, var); INCA
    analysis occasionally misses an hour of GL/P0 domain-wide.  Returns the
    filled array + indices of hours that had any fill (QC record)."""
    t_idx = np.arange(forcing.shape[0], dtype=np.float64)
    filled_hours = np.where(~np.isfinite(forcing).all(axis=(1, 2)))[0]
    for j in range(forcing.shape[1]):
        for k in range(forcing.shape[2]):
            s = forcing[:, j, k]
            bad = ~np.isfinite(s)
            if bad.any():
                good = ~bad
                s[bad] = np.interp(t_idx[bad], t_idx[good], s[good])
    if not np.isfinite(forcing).all():
        raise ValueError("gap fill failed: non-finite forcing remains")
    return forcing, filled_hours


def build_node_forcing(inca_dir, out_dir, tile_x, tile_y, tile_lat, tile_lon,
                       tile_node_elev):
    from solar import clearsky_ghi, sun_vector_enu
    paths = sorted(glob.glob(os.path.join(inca_dir, "inca_stubai_*.nc")))
    if not paths:
        raise FileNotFoundError(f"no INCA files in {inca_dir}")
    forcing, time, _ = extract_node_series(paths, tile_x, tile_y)
    forcing, filled_hours = gap_fill_time(forcing)
    if len(filled_hours):
        print(f"  gap-filled {len(filled_hours)} hours: {list(filled_hours)}")
    t_s = time.astype("datetime64[s]")
    sun = np.empty(forcing.shape[:2] + (3,), np.float32)
    glcs = np.empty(forcing.shape[:2], np.float32)
    p0 = forcing[..., list(VARIABLES).index("P0")]
    for j in range(forcing.shape[1]):
        s = sun_vector_enu(tile_lat[j], tile_lon[j], t_s)
        sun[:, j, :] = s
        glcs[:, j] = clearsky_ghi(s[..., 2], p0[:, j], tile_node_elev[j])
    path = os.path.join(out_dir, "node_forcing_winter.npz")
    np.savez_compressed(
        path,
        meta=json.dumps({"format": "node-forcing", "version": 1,
                         "variables": list(VARIABLES),
                         "start": str(t_s[0]), "hours": len(t_s),
                         "source_files": [os.path.basename(p) for p in paths]}),
        forcing=forcing, glcs=glcs, sun_enu=sun,
        time_s=t_s.astype(np.int64),
        tile_node_elev_m=tile_node_elev,
        qc_filled_hours=np.asarray(filled_hours, np.int32),
    )
    return path, forcing.shape


def build_inca_node_map(inca_dir, out_dir, tile_x, tile_y, tile_yq, tile_yr):
    sample = sorted(glob.glob(os.path.join(inca_dir, "inca_stubai_*.nc")))[0]
    _, x, y, _ = read_inca(sample, variables=())
    bmap = bilinear_map(tile_x, tile_y, x, y)
    path = os.path.join(out_dir, "inca_node_map.npz")
    np.savez_compressed(
        path,
        meta=json.dumps({"format": "inca-bilinear-node-map", "version": 1,
                         "grid_crs": "EPSG:31287",
                         "grid_x0": int(x[0]), "grid_y0": int(y[0]),
                         "grid_nx": len(x), "grid_ny": len(y),
                         "grid_dx_m": 1000, "variables": list(VARIABLES)}),
        tile_yq=tile_yq, tile_yr=tile_yr, ix=bmap.ix, iy=bmap.iy, w=bmap.w,
        tile_x31287=bmap.x31287, tile_y31287=bmap.y31287,
    )
    return path


def build_station_forcing(inca_dir, out_dir):
    """SYNTHETIC station-column forcing for calibration: INCA bilinear AT the
    station point (not the tile node), sun/clear-sky at the station lat/lon/
    elevation.  Pairs with flat/open synthetic terrain (slope 0, SVF 1) in
    calibrate.py --synthetic.  Only stations with observation files.

    Caveat (documented, accepted): dz_node = 0 for synthetic columns — the
    INCA cell's own model elevation is not read, so the lapse/precip-gradient
    parameters have no lever at stations; they calibrate against the real
    in-domain columns later, not here."""
    from solar import clearsky_ghi, sun_vector_enu
    st = [s for s in json.load(open(os.path.join(out_dir, "station_columns.json")))
          if s.get("file")]
    paths = sorted(glob.glob(os.path.join(inca_dir, "inca_stubai_*.nc")))
    # keep only stations inside the downloaded INCA subset bbox
    from pyproj import Transformer
    _, gx, gy, _ = read_inca(paths[0], variables=())
    tr = Transformer.from_crs("EPSG:31254", "EPSG:31287", always_xy=True)
    px, py = tr.transform(np.array([s["x31254"] for s in st]),
                          np.array([s["y31254"] for s in st]))
    inside = ((px >= gx[0]) & (px <= gx[-1]) & (py >= gy[0]) & (py <= gy[-1]))
    dropped = [s["id"] for s, k in zip(st, inside) if not k]
    if dropped:
        print(f"  station forcing: {len(dropped)} outside INCA subset "
              f"dropped: {dropped}")
    st = [s for s, k in zip(st, inside) if k]
    x = np.array([s["x31254"] for s in st])
    y = np.array([s["y31254"] for s in st])
    forcing, time, _ = extract_node_series(paths, x, y)
    forcing, filled = gap_fill_time(forcing)
    t_s = time.astype("datetime64[s]")
    sun = np.empty(forcing.shape[:2] + (3,), np.float32)
    glcs = np.empty(forcing.shape[:2], np.float32)
    for j, s in enumerate(st):
        sv = sun_vector_enu(s["lat"], s["lon"], t_s)
        sun[:, j, :] = sv
        glcs[:, j] = clearsky_ghi(sv[..., 2], forcing[:, j, 7],
                                  float(s["elevation_m"]))
    path = os.path.join(out_dir, "station_forcing_winter.npz")
    np.savez_compressed(
        path,
        meta=json.dumps({"format": "station-forcing", "version": 1,
                         "station_ids": [s["id"] for s in st],
                         "elevations_m": [s["elevation_m"] for s in st],
                         "files": [s["file"] for s in st],
                         "dz_node": "zero by construction (see docstring)",
                         "gap_filled_hours": [int(h) for h in filled]}),
        forcing=forcing, glcs=glcs, sun_enu=sun,
        time_s=t_s.astype(np.int64),
    )
    return path, forcing.shape


def build_station_map(stations_path, out_dir, tile_yq, tile_yr):
    """Every station -> nearest registry column.  Stations inside the beta
    footprint resolve exactly via the gosper walk (`inside: true`); stations
    outside map to the nearest centroid by brute force with `distance_m`
    recorded so comparisons can discount far ones."""
    from pyproj import Transformer
    tr = Transformer.from_crs("EPSG:4326", "EPSG:31254", always_xy=True)
    with open(stations_path) as fh:
        stations = json.load(fh)
    cent = np.load(os.path.join(out_dir, "centroids_l1_epsg31254.npz"))
    xy = cent["xy"].reshape(-1, 2)                     # [n_tiles*2401, 2]
    slot_of = {(int(q), int(r)): i for i, (q, r) in enumerate(zip(tile_yq, tile_yr))}
    rows = []
    for s in stations:
        if s.get("lat") is None or s.get("lon") is None:
            continue
        x, y = tr.transform(s["lon"], s["lat"])
        slot = None
        try:
            (yq, yr), idx = column_of_point(x, y)
            slot = slot_of.get((yq, yr))
        except Exception:
            pass
        if slot is not None:
            col = slot * 2401 + idx
            inside = True
        else:
            col = int(np.argmin((xy[:, 0] - x) ** 2 + (xy[:, 1] - y) ** 2))
            slot, idx = col // 2401, col % 2401
            yq, yr = int(tile_yq[slot]), int(tile_yr[slot])
            inside = False
        dist = float(np.hypot(xy[col, 0] - x, xy[col, 1] - y))
        rows.append({"id": s["id"], "name": s["name"], "lat": s["lat"],
                     "lon": s["lon"], "elevation_m": s.get("elevation_m"),
                     "source": s.get("source"), "file": s.get("file"),
                     "x31254": x, "y31254": y, "tile_yq": yq, "tile_yr": yr,
                     "tile_slot": slot, "heap_index": idx, "column_id": col,
                     "inside": inside, "distance_m": round(dist, 1)})
    path = os.path.join(out_dir, "station_columns.json")
    with open(path, "w") as fh:
        json.dump(rows, fh, indent=1)
    return path, sum(r["inside"] for r in rows)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--inca-dir", default=os.path.join(DEFAULT_SCRATCH, "inca"))
    ap.add_argument("--stations", default=None, help="stations.json; default "
                    "scratchpad validation/stations/stations.json, falling "
                    "back to scratchpad stations.json")
    ap.add_argument("--out", default=terrain_pack.DEFAULT_DATA_DIR)
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)

    terr_path, cent_path = terrain_pack.build(out_dir=args.out)
    print("terrain pack :", terr_path)
    print("centroids    :", cent_path)
    terr = np.load(terr_path)

    print("inca node map:", build_inca_node_map(
        args.inca_dir, args.out, terr["tile_x"], terr["tile_y"],
        terr["tile_yq"], terr["tile_yr"]))

    nf_path, shape = build_node_forcing(
        args.inca_dir, args.out, terr["tile_x"], terr["tile_y"],
        terr["tile_lat"], terr["tile_lon"], terr["tile_node_elev_m"])
    print(f"node forcing : {nf_path} {shape}")

    stations = args.stations
    if stations is None:
        for cand in (os.path.join(DEFAULT_SCRATCH, "validation/stations/stations.json"),
                     os.path.join(DEFAULT_SCRATCH, "stations.json")):
            if os.path.exists(cand):
                stations = cand
                break
    st_path, n_in = build_station_map(stations, args.out,
                                      terr["tile_yq"], terr["tile_yr"])
    print(f"station map  : {st_path} ({n_in} stations in footprint)")

    sf_path, sf_shape = build_station_forcing(args.inca_dir, args.out)
    print(f"station frc  : {sf_path} {sf_shape}")


if __name__ == "__main__":
    main()
