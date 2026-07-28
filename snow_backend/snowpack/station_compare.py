"""Join modeled HS (station_model_hs.csv from run_backfill) against the
GeoSphere klima-v2-1d station observations and print/emit a comparison.

Observation format (scratchpad validation/stations/geosphere_*.csv):
  time,station,tl_mittel,tlmax,tlmin,rr,sh,sh_manu,shneu_manu,substation
  daily rows; sh = snow depth cm; -1.0 AND empty both mean missing.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
from collections import defaultdict

DEFAULT_SCRATCH = ("/private/tmp/claude-501/-Users-cole-dev/"
                   "af754c65-5383-45a7-ae6c-4108255c1107/scratchpad")


def load_obs(stations_dir, station_files):
    """{(station_id, 'YYYY-MM-DD'): sh_cm}"""
    obs = {}
    for sid, fname in station_files.items():
        path = os.path.join(stations_dir, fname)
        if not os.path.exists(path):
            continue
        with open(path) as fh:
            for row in csv.DictReader(fh):
                sh = row.get("sh") or row.get("sh_manu") or ""
                try:
                    v = float(sh)
                except ValueError:
                    continue
                if v < 0.0:                      # -1.0 sentinel
                    continue
                obs[(sid, row["time"][:10])] = v
    return obs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default=os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "data")))
    ap.add_argument("--stations-dir",
                    default=os.path.join(DEFAULT_SCRATCH, "validation/stations"))
    args = ap.parse_args()

    station_meta = {s["id"]: s for s in json.load(
        open(os.path.join(args.data, "station_columns.json")))}
    station_files = {sid: s["file"] for sid, s in station_meta.items()
                     if s.get("file")}
    obs = load_obs(args.stations_dir, station_files)

    rows = list(csv.DictReader(open(os.path.join(args.data,
                                                 "station_model_hs.csv"))))
    out_path = os.path.join(args.data, "station_compare.csv")
    per_station = defaultdict(list)
    with open(out_path, "w", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["date", "station", "elevation_m", "distance_m",
                    "obs_sh_cm", "model_hs_cm", "bias_cm"])
        for r in rows:
            date = r["time"][:10]
            sid = r["station"]
            o = obs.get((sid, date))
            m = float(r["model_hs_cm"])
            if o is None:
                continue
            w.writerow([date, sid, r["elevation_m"], r["distance_m"],
                        o, m, round(m - o, 1)])
            per_station[sid].append((o, m))

    print(f"wrote {out_path}")
    print(f"{'station':22s} {'elev':>5s} {'dist':>6s} {'n':>4s} "
          f"{'obs max':>8s} {'mod max':>8s} {'bias':>7s} {'rmse':>7s}")
    for sid, pairs in sorted(per_station.items()):
        o = [p[0] for p in pairs]; m = [p[1] for p in pairs]
        n = len(pairs)
        bias = sum(mi - oi for oi, mi in pairs) / n
        rmse = (sum((mi - oi) ** 2 for oi, mi in pairs) / n) ** 0.5
        s = station_meta[sid]
        print(f"{sid:22s} {s['elevation_m']:5.0f} {s['distance_m']:6.0f} "
              f"{n:4d} {max(o):8.1f} {max(m):8.1f} {bias:7.1f} {rmse:7.1f}")


if __name__ == "__main__":
    main()
