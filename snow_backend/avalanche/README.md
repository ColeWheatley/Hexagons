# Avalanche layer (beta)

Per-step avalanche **susceptibility** layer for the PowFinder beta: one byte per
L1 hex (~17 m), 2,401 B per L5 tile in heap order, tile order =
`tile_manifest.json` `tiles[]`. Design doc: session scratchpad
`avalanche_pipeline_design.md` (2026-07-28); frontend consumer contract:
`powfinder_frontend_design.md` §1.1–1.3.

## Byte contract (harmonized 2026-07-29)

| byte | meaning |
|---|---|
| 0 | NODATA — off-DEM / outside domain / not simulated |
| 1 | simulated, no hazard |
| 2–127 | runout severity (bits 0–6): `clamp(round(127 · f_agree · g), 2, 127)`, `g = log1p(margin) / log1p(600 m)` |
| 129–255 | release-zone cell (bit 7 set): `128 + clamp(round(127 · clamp(slab/2.5 m, 0, 1)), 1, 127)` |

**Raw 128 (release=1, severity=0) is invalid and never emitted** — release
intensity is clamped to ≥ 1 (a release zone with today's slab always has
nonzero intensity), and runout severity is clamped to ≥ 2 so it cannot alias
"simulated, no hazard". So: severity domain is [1,127] for release cells,
[2,127] for runout cells; the frontend may treat raw 128 as a data error.

index.json layer entry (owned by snowpack-design; values to mirror):
`fields: { release: {shift 7, bits 1, aggregate "or"}, severity: {shift 0,
bits 7, aggregate "max", domain [1,127]} }, nodata: 0`. `f_agree` is the
fraction of the 3-draw ensemble reaching the cell. **Semantics: susceptibility
under "every zone releases with today's slab" — not a forecast, not a
validated probability.** The wet regime is an uncalibrated placeholder.
Backends (`alpha` energy-line, `mpm` avalanchers) emit identical bytes; the
sibling `HH.meta.json` (debug, non-contract) records backend + whether the
snowpack inputs were synthetic.

## File format

`<out>/avalanche/<YYYY>/<MM>/<DD>/<HH>.pfl` — 32-byte `PFL1` header
(`pfl.py`: magic, u16 version, u16 layerId=3, u32 epochHour, u32 tileCount,
u16 nodeCount=2401, u8 encoding, u8 aggregate, u32 manifestHash = CRC32 of
tile_manifest.json, 8 reserved) + `tileCount × 2401` body. Header enums are
centralized in `config.py` and must stay byte-identical with the snowpack
writer — the design doc's field list sums to 36 B against a stated 32 B
header; this writer closes it with 8 reserved bytes (**flagged for byte-exact
confirmation with snowpack-design**). Daily cadence emits at `HH=12`.

## External interfaces

- **L1 centroids (task #7)**: preferred `snow_backend/data/l1_centroids.npy`,
  float64 `(n_tiles, 2401, 2)`, EPSG:31254 (x, y), heap order, manifest tile
  order; per-tile `l1_centroids_<t>.npy` also accepted. Absent either,
  `centroids.py` self-generates from the manifest +
  `hex_backend/coordinate_utility.py` (pitch- and footprint-validated in both
  paths — the generator doubles as a cross-check on the external file).
- **Snowpack sidecars (task #8)**: `registry.SidecarRegistry` reads `depth`
  (u8_linear, [0,500] cm) and `surface` (u8_class, class 4 = wet) PFL layers;
  byte→physical decode to be pinned with snowpack-design. Until then
  `SyntheticRegistry` (deterministic pseudo-storm slab + seasonal wet line)
  drives the pipeline, labeled `registry.synthetic: true` in step metadata.
  **Snow density is deliberately never consumed** — the simulator freezes
  density at 200 kg/m³ (samosAT freeze, see design doc).
- **Frozen MPM parameters**: `AVALANCHE_FROZEN_PARAMS` env → JSON settings
  patch for `PySimulation.create` (lives in the avalanchers calibration
  results; not in this repo).

## Files

| file | role |
|---|---|
| `config.py` | paths, gate thresholds, alpha draws, byte + PFL constants |
| `centroids.py` | L1 centroid table (external file or manifest-generated) |
| `terrain.py` | 5 m DEM mosaic (197 tiles + 4 km reach margin), Horn slope/aspect, VRM, optional forest raster |
| `gate.py` | release gate (slope 28–60°, ≥1500 m, VRM ≤0.01, forest ≤0.1) + zones (aspect-octant CC, 2–60 ha, fragment merge) |
| `zones_export.py` | zones.geojson + stats |
| `energyline.py` | fallback runout engine: iterated masked sweeps to the Bellman fixpoint (== Dijkstra, tested) |
| `registry.py` | snowpack inputs: sidecar reader / labeled synthetic stub |
| `bytelayer.py` | ensemble combine + harmonized hazard bytes |
| `hexpack.py` | 5 m mosaic → per-tile 2,401 B heap-order layers (max-pool ≤9 m) |
| `pfl.py` | PFL1 sidecar writer/reader |
| `retro.py` | daily retrospective / single-step driver (resumable, atomic) |
| `mpm_driver.py` | avalanchers backend: GPU calls isolated in `GpuZoneRunner` (**UNTESTED off-box**); windowing/change-skipping/byte logic unit-tested |
| `tests/test_avalanche.py` | synthetic-DEM engine tests, contract invariants, PFL round-trip, skip logic |

## Run

```bash
pixi run python -m pytest snow_backend/avalanche/tests -q   # unit tests
pixi run python -m snow_backend.avalanche.zones_export      # zones.geojson + count
pixi run python -m snow_backend.avalanche.retro --only 2026-01-15 --workers 1
pixi run python -m snow_backend.avalanche.retro --workers 5 # full winter, resumable
```

Outputs: `snow_backend/avalanche_work/out/avalanche/YYYY/MM/DD/12.pfl` (+
`.meta.json` debug siblings, `layer_summary.json` for the index owner).
Caches (~200 MB) build on first run in `snow_backend/avalanche_work/cache/`;
`avalanche_work/` is gitignored.

## Known deviations from the design doc

- Slab modulation is a seed-energy lift (30 m × clamp(slab−0.5, 0, 1)) instead
  of a per-seed alpha offset — backend-uniform, equally heuristic.
- Runout grade is log-scaled to 600 m margin (linear-to-50 m saturated: p50 was
  127 on real terrain).
- Fallback seeds are zone-member cells only (contract consistency with the MPM
  work-unit table); isolated sub-2 ha gate fragments that no zone absorbs do
  not seed (~35% of raw gate area, mostly slivers).
- Slab depth no longer rides in the display byte (harmonized contract) — the
  release low bits are an *intensity*, slab itself lives in the registry path.
