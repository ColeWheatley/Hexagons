# Avalanche layer (beta)

Per-step avalanche **susceptibility** layer for the PowFinder beta: one byte per
L1 hex (~17 m), 2,401 B per L5 tile in heap order, tile order =
`tile_manifest.json` `tiles[]`. Design doc: session scratchpad
`avalanche_pipeline_design.md` (2026-07-28); frontend consumer contract:
`powfinder_frontend_design.md` §1.1–1.3.

## Byte contract (harmonized 2026-07-29)

| byte | meaning |
|---|---|
| 0 | NODATA — off-DEM / DEM-clipped columns (2,861 on 3 SE-border tiles, from terrain_columns.npz validity) / not simulated |
| 1 | simulated, no hazard |
| 2–127 | runout severity (bits 0–6): `clamp(round(127 · f_agree · g), 2, 127)`, `g = log1p(margin) / log1p(600 m)` |
| 129–255 | release-zone cell (bit 7 set): severity = `clamp(max(runout severity at the cell, round(127 · clamp(slab/1.5 m, 0, 1))), 1, 127)` |

**Release cells carry SEVERITY, not a slab-depth encoding** — the loading
grade is a severity scale (slab depth itself rides in the step metadata /
popup path, `slab_release_p10_p50_p90_m`). **Raw 128 (release=1, severity=0)
is invalid and never emitted** — release severity clamps to ≥ 1, and runout
severity clamps to ≥ 2 so it cannot alias "simulated, no hazard". So:
severity domain is [1,127] for release cells, [2,127] for runout cells; the
frontend may treat raw 128 as a data error.

⚠ **The runout floor of 2 is LOAD-BEARING, not cosmetic.** The frontend's
per-field LOD reduction takes `max` over severity — if runout could emit
severity 1, a coarse hex whose worst child is a barely-reached runout cell
would aggregate to byte 1 and be indistinguishable from "simulated, no
hazard": real hazard manufactured into the no-hazard value. Starting runout
at 2 makes that impossible by construction. Do not "tidy" the runout domain
to [1,127].

**Coarse-level semantics under per-field reduction** (release "or",
severity "max"): a reduced byte can be a combination no child cell had —
e.g. children {129 (release, sev 1), 127 (runout, sev 127)} reduce to 255.
Read a coarse byte as: *"this hex CONTAINS at least one release-zone cell,
and the worst severity ANYWHERE in it is X"* — deliberately conservative,
never understating, and NOT "there is a single release cell with severity
X". This is intended behavior, matching the safety rationale for `max`
aggregation in the frontend design (§1.3).

**Bulletin prior** (`bulletin.py`, a labeled heuristic): when the recon
timeline (`avalanche_work/inputs/timeline.json` or
`AVALANCHE_BULLETIN_TIMELINE`) is present, packed severities are scaled by a
per-day danger factor — danger {1: ×0.5, 2: ×0.75, 3: ×1.0, 4: ×1.25,
5: ×1.5} — at full strength on hexes matching a bulletin problem's aspects
and elevation band, damped halfway toward 1.0 elsewhere; elevation-split
danger levels are honored. Absent timeline → factor 1.0 and
`bulletin_prior.applied: false` in metadata. Floors/ceilings survive
scaling; NODATA and simulated-none are untouched.

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

- **L1 centroids (task #7)**: parity-verified against the delivered
  `centroids_l1_epsg31254.npz` — geometry agrees to 5 mm **after reordering**:
  ⚠ the snowpack terrain pack uses "canonical slot" order (tiles sorted by
  `(yq, yr)`), which is NOT the manifest `tiles[]` order that the frontend
  contract and our PFL bodies use. `columns.manifest_perm` converts; every
  consumer of pack arrays must apply it. `centroids.py` self-generates from
  the manifest + `hex_backend/coordinate_utility.py` (pitch- and
  footprint-validated), so no runtime dependency on the pack for centroids.
- **Terrain columns pack (task #7)**: `avalanche_work/inputs/
  terrain_columns.npz` (or `AVALANCHE_TERRAIN_COLUMNS`) supplies per-column
  elev/aspect/validity in canonical order; `columns.py` reorders to manifest
  order. Used for the bulletin prior's aspect/elevation matching and to mask
  the 2,861 invalid (DEM-clipped) columns to NODATA.
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
