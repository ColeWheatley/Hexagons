# snow_backend/gsp3 — GSP3 reader, terrain table, forcing adapters

Ground truth for the GSP3 tile binary is `hex_backend/waffle_iron.py`; this
package re-derives it byte-exactly (48 B header with the root aggregate inside
it, a `<u32` count prefix per depth block, L1 = depth-4 block of 2,401 × 16 B
records at bytes 6,448–44,864, unit block 16,807 × 14 B, file = 280,166 B).
Heights: `elev[i] = root_h + 0.1*(dH1[i//343] + dH2[i//49] + dH3[i//7] + dH4[i])`.
Hex addressing parity with the JS engine is guarded by the repo's own
`tests/gosper/run_parity.sh`.

## Canonical column order (every consumer relies on this)

Tiles in **`frontend/app/tile_manifest.json` `tiles[]` order** (`tile_slot`),
depth-4 **heap order** within each tile (children of node i are `7i..7i+6`).
Global `column_id = tile_slot * 2401 + heap_index`.  This is byte-identical to
the GSP3 depth-4 block order and to the sidecar body layout.

## Build everything

```
cd <repo> && pixi run python snow_backend/gsp3/build_terrain.py
```

Outputs in `snow_backend/data/` (gitignored, reproducible; tiles auto-sync
from `s3://wheatley.cloud/hexagons/beta/tiles_bin/`):

| file | contents |
|---|---|
| `terrain_columns.npz` | per-column `elev_m, dz_node_m, slope_mean_deg, slope_max_deg, n_east/n_north/n_up, aspect_rad, svf, valid`; per-tile `yq/yr/x/y/node_elev/lat/lon`; `meta` JSON incl. `manifest_hash_u32` |
| `centroids_l1_epsg31254.npz` | **avalanche-driver export**, see below |
| `inca_node_map.npz` | per-tile bilinear idx/weights on the INCA EPSG:31287 grid |
| `node_forcing_winter.npz` | `[4344, 197, 8]` f32 (T2M/TD2M K, RH2M %, RR kg/m², GL W/m², UU/VV m/s, P0 Pa) + `glcs`, `sun_enu`, `time_s`, `qc_filled_hours` (gap-filled hours, linear interp) |
| `station_columns.json` | every station → nearest column (`inside`, `distance_m` recorded) |

## AVALANCHE-DRIVER CENTROID CONTRACT (`centroids_l1_epsg31254.npz`)

- `xy`: float64 `[n_tiles, 2401, 2]` — (x, y) **EPSG:31254** centroids of the
  L1 hexes, `tile_slot`-major, **depth-4 heap order** within tile.
- `t{yq}_{yr}`: float64 `[2401, 2]` — the same rows keyed per tile, so a
  consumer that iterates tiles by lattice coords never touches slot order.
- `tile_yq`, `tile_yr`: int32 `[n_tiles]` — slot → lattice mapping.
- `meta`: JSON string (order statement, CRS, `manifest_hash_u32`).

Facts safe to build on: L1 pitch is exactly `6.4*sqrt(7)` ≈ 16.9328 m
(verified uniform); row 0 of every tile is the island centre; world metres
are EPSG:31254 metres (no offset).  `gosper_geometry.column_of_point(x, y)`
inverts a point to `((yq, yr), heap_index)`.

## Terrain conventions

- `slope_mean_deg` / `slope_max_deg`: whole degrees (u8, from the bake).
- normal: ENU unit vector; horizontal component points downslope.
- `aspect_rad = atan2(n_east, n_north)`: clockwise from north; 0 where the
  packed normal is exactly vertical.
- `svf = (1 + n_up)/2` (isotropic sky-view from slope only).
- `valid` = GSP3 flag bit 0.  2,861 columns (0.60 %) on 3 SE-edge tiles are
  no-data (Tirol DEM clips at the border) — permanently masked; every sidecar
  byte for them is NODATA 0.

## INCA reader

`inca_adapter.read_inca` picks the first working backend: `netCDF4` → `h5py`
→ `ncdump` subprocess (dependency-free; what runs on the dev Mac).  Variables
are integer-packed with per-var `scale_factor`; fills → NaN; `T2M/TD2M`
converted to Kelvin.  `build_terrain.gap_fill_time` linear-interps missing
hours (winter 2025/26 has 4: two GL/P0 gaps) and records them in
`qc_filled_hours`.
