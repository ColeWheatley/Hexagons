# GOAL: Replace the per-sector HEX4 bake pipeline with the per-island GSP1 Gosper bake

You are working in a standalone clone on branch `codex/gosper-baker`. The
Gosper fractal math already exists and is tested — you are implementing the
**baker** (Python) side of a locked binary format spec. The frontend consumer
is being written in parallel against this same spec, so **the byte layout
below is a contract: do not deviate from it, extend it, or "improve" it.**

## Commit protocol (crash durability + cheap monitoring)

Commit after EVERY discrete step — even failed experiments (commit the
ledger note, then revert). Message format, always:

```
[gosper-baker] <did X> | next: <Y> | status: ok|blocked:<reason>
```

## Context you need (read these first)

- `hex_backend/coordinate_utility.py` — bottom half has all Gosper math:
  `generate_gosper_offsets`, `gosper_lattice_to_center`, `gosper_mul_m_pow`,
  `gosper_level_size`, `gosper_tile_geometry` (offsets as numpy arrays +
  `tex_half_m = 490.0` + `tile_pitch_m ≈ 829.7076`). Use these; never
  reimplement the math. GOSPER_TILE_LEVEL = 5; a tile = level-5 island =
  16807 unit hexes (6.4 m flat-to-flat each).
- `hex_backend/waffle_iron.py` — the current sector baker you are replacing.
  Its DEM/gradient/TIF/incremental/basisu infrastructure is GOOD — keep all
  of it. `bake_sector_binary` shows the exact per-hex sampling semantics
  (neighbor deltas, diamond slopes, packed normals) you must preserve at
  unit-hex level; `bake_sector_textures` shows the texture composite +
  encode path you must generalize to island-centered square bounds.
- `hex_backend/generate_manifest.py` — rewrite for gosper tiles (spec below).
- `tests/gosper/` — existing parity gates. `bash tests/gosper/run_parity.sh`
  must stay green (you shouldn't need to touch gosper math at all).

## Deliverable 1 — GSP1 binary format (bake per island)

New function(s) in `waffle_iron.py`; output file
`frontend/app/tiles_bin/gosper_{latQ}_{latR}.bin` (latQ/latR = island
lattice coords, may be negative).

All integers little-endian. One file =

### Header, 48 bytes, `struct` format `<4sHHiiiifffBBBBBxxxI`

| off | type | field | value |
|-----|------|-------|-------|
| 0  | 4s | magic     | `b"GSP1"` |
| 4  | H  | version   | 1 |
| 6  | H  | tileLevel | 5 |
| 8  | i  | centerQ   | unit-axial q of island center (`gosper_lattice_to_center`) |
| 12 | i  | centerR   | unit-axial r |
| 16 | i  | latQ      | island lattice q |
| 20 | i  | latR      | island lattice r |
| 24 | f  | hMean     | root node reconstructed height, meters absolute (see aggregation) |
| 28 | f  | hMin      | min valid unit-hex height in tile |
| 32 | f  | hMax      | max valid unit-hex height |
| 36 | B  | slopeMean | root aggregate, degrees, round+clip 0..255 |
| 37 | B  | slopeMax  | root aggregate max, degrees |
| 38 | B  | nx        | root packed normal x (pack: `clip(round(v*127+128),0,255)`) |
| 39 | B  | nz        | root packed normal z (same packing) |
| 40 | B  | flags     | bit0 = hasData (any valid unit hex) |
| 41 | 3x | pad       | zeros |
| 44 | I  | reserved  | 0 |

### Then 5 depth blocks, depths d = 1..5 in order

Each block: `<I` count (must equal 7^d), then `count` fixed-size records in
**heap order**: record index i at depth d is the child of record i//7 at
depth d-1; the 7 children of node i are 7i..7i+6; child 0 is concentric
with its parent. Unit hex for depth-5 index i sits at axial
`(centerQ + offq[i], centerR + offr[i])` from `gosper_tile_geometry()`.
Depth-d node i's center = unit position of depth-5 index `i * 7**(5-d)`
(this identity is already test-verified — rely on it).

**Aggregate record (depths 1..4), 8 bytes, `<hBBBBBB`:**

| type | field | semantics |
|------|-------|-----------|
| h | dH        | decimeters; `round((h_node - h_parent_recon) * 10)`, clip ±32767 |
| B | slopeMean | mean of valid children's slopeMean, degrees, round+clip 0..255 |
| B | slopeMax  | max of valid children's slopeMax |
| B | nx        | packed mean normal (see below) |
| B | nz        | packed mean normal |
| B | relief    | `(hMaxSubtree - hMinSubtree) / 4.0` meters→units, round, clip 0..255 |
| B | flags     | bit0 = hasData |

**Unit record (depth 5), 14 bytes, `<hhhhBBBBBB`:**

| type | field | semantics |
|------|-------|-----------|
| h | dH  | decimeters from depth-4 parent's reconstructed height |
| h | d1  | skirt delta SE, decimeters (EXACT semantics of current `bake_sector_binary`: own DEM height minus neighbor-center DEM height at unit-axial offsets SE(1,-1), S(0,-1), SW(-1,0); zero the delta when abs > 400 m) |
| h | d2  | skirt delta S |
| h | d3  | skirt delta SW |
| B | s1  | diamond edge slope SE, degrees (EXACT semantics of current `fast_diamond_slope`: mean gradient over the bbox slice between own center and neighbor center, from the 2-band gradient raster) |
| B | s2  | edge slope S |
| B | s3  | edge slope SW |
| B | nx  | packed center normal (EXACT semantics of `get_center_normal_packed`) |
| B | nz  | packed center normal |
| B | flags | bit0 = hasData |

### Height chain + quantization rule (IMPORTANT — prevents error accumulation)

Reconstructed heights are defined recursively:
`recon(root) = hMean` (header float), and for every non-root node
`recon(node) = recon(parent) + dH * 0.1`.
When packing depth d you MUST compute dH against the parent's
**reconstructed** (already-quantized) value, not its true float value:
`dH = round((h_true(node) - recon(parent)) * 10)` then
`recon(node) = recon(parent) + dH * 0.1`. Every node then lands within
±0.05 m of truth regardless of depth. Vectorize with numpy
(`np.repeat(recon_prev, 7)`), packing per depth with one
`struct.pack_into` loop or `numpy.tobytes` on a structured array.

### Sampling + aggregation semantics

- Unit heights: nearest-pixel DEM sample at each unit center (vectorized
  `rasterio.transform.rowcol` on arrays, like the current code). Read one
  windowed DEM chunk per island (island bbox + 40 m padding).
- Validity: a unit hex is valid (hasData) iff its DEM sample is inside the
  window, finite, not equal to `dem_ds.nodata`, and within (-500, 9000).
  Invalid units: set their h to the mean of valid units (so dH stays tiny),
  slopes/deltas/normals zero... normals packed value 128,128; flags bit0=0.
- If NO unit hex is valid, do not write a file (skip island, count it).
- h_true of an aggregate = mean of its VALID children's h_true (weighted by
  their valid-descendant counts so it equals the mean over valid unit
  descendants — implement by carrying (sum, count) up the tree, i.e.
  sum/count reshape(-1,7).sum(axis=1). Aggregate hasData = any child valid.
- slopeMean of a unit = mean(s1,s2,s3); slopeMax of a unit = max(s1,s2,s3).
  Aggregate slopeMean = valid-count-weighted mean like heights; slopeMax =
  max over valid children.
- Normals: unpack children to float vectors (nx, ny, nz) with
  ny = sqrt(max(0, 1-nx²-nz²)), average over valid children, renormalize,
  repack. (Unit normals from the gradient raster exactly like today.)
- relief: carry subtree hMin/hMax (valid only) up the tree.
- hMin/hMax in header: over valid units only.

## Deliverable 2 — island texture bake

Generalize the existing texture path: square canvas centered on the island
center, world bounds `center ± tex_half_m` (from `gosper_tile_geometry()`,
= 490.0), canvas 4096 px (`tex_mpp = 980/4096`), composited from
intersecting aerial TIFs exactly like today (same seam-rounding logic, same
`run_basisu_encode`), saved to
`frontend/app/aerial_tiles/full/gosper_{latQ}_{latR}.ktx2` and a /16
downscale to `aerial_tiles/low/...`. There is no longer any
content-vs-padding split — the whole canvas is one uniform world-metric
square (delete the TEXTURE_CONTENT_PX/TEXTURE_PADDING_PX concepts from the
new path; document in a comment that the shader maps
`uv = local_xz / 980 + 0.5`).

## Deliverable 3 — enumeration, CLI, incremental logic

- Enumerate islands whose square `center ± tex_half_m` intersects the
  requested region bbox. Island centers: `world(M^5 · (yq, yr))` — invert
  the 2x2 lattice basis to find the integer (yq, yr) range for a bbox, pad
  by 2, then exact-test each candidate.
- Keep the mini-bake flow: `--grid N` = region bbox of `(N*819.2)²` meters
  around the center point (Stubai default via existing lat/lon). `--center`
  now takes ISLAND LATTICE coords "yq,yr" (update help text). `--full`
  unchanged (all TIFs bounds).
- Per-island skip logic identical in spirit to today (bin + tex versioned
  separately). Set `BAKER_VERSION = "5.0.0"`, `TEXTURE_VERSION = "2.0.0"`.
- DEM presence / imagery presence checks per island as today.
- DELETE the old sector bake functions (`bake_sector_binary`,
  `bake_sector_textures`) and sector loop — full replacement, no fallback
  (same policy as the webp→KTX2 swap). Update the `# @atlas:` header
  comment. Keep `upload_to_s3`, gradient cache, TIF bounds cache, basisu
  helpers unchanged.

## Deliverable 4 — manifest

Rewrite `hex_backend/generate_manifest.py`: scan
`frontend/app/tiles_bin/gosper_*.bin`, read each 48-byte header, emit
`frontend/app/tile_manifest.json`:

```json
{
  "type": "gosper_l5",
  "tile_level": 5,
  "unit_hex_m": 6.4,
  "tile_pitch_m": <from gosper_tile_geometry>,
  "tex_world_side_m": 980.0,
  "bounds": {"min_x":..,"max_x":..,"min_y":..,"max_y":..},   // island centers ± tex_half + 2000 margin, like today
  "tiles": [
    {"yq":..,"yr":..,"x":..,"y":..,"hMean":..,"hMin":..,"hMax":..,
     "sMean":..,"sMax":..,"nx":..,"nz":..}
  ]
}
```

x/y = island center world meters (from lattice via coordinate_utility —
recompute, don't trust filenames beyond lattice ids). nx/nz raw packed
bytes 0..255. Round x/y to 2 decimals, heights to 1 decimal to keep the
file small.

## Deliverable 5 — validator (the test gate for everything above)

New `tests/gosper/validate_gsp1.py <bin...>`: for each file assert
- magic/version/tileLevel; latQ/latR match filename; centerQ/R match
  `gosper_lattice_to_center(latQ,latR)`; block counts are 7^d.
- file size exactly 48 + Σ_d (4 + count_d * recsize_d) = 257,766 bytes.
- reconstruct all heights via the dH chain; assert every valid depth-5
  height is within (-500, 9000) and hMin/hMax header matches the
  valid-unit min/max within 0.15 m; root recon == hMean exactly.
- re-aggregate valid-weighted means from the unit records bottom-up and
  assert every aggregate's recon height is within 0.35 m of the
  re-aggregated truth (quantization tolerance: 0.05 m per depth + rounding
  slack).
- relief consistency: aggregate relief*4 within 8 m of re-derived subtree
  (hMax-hMin).
- flags consistency: parent hasData == OR of children hasData.
- CROSS-CHECK vs DEM (only if `--dem` passed): sample 200 random valid
  unit hexes directly from the DEM and assert |recon - dem| <= 0.35 m.
Print a one-line PASS summary per file. Non-zero exit on any failure.

## Definition of done (all must hold)

1. `bash tests/gosper/run_parity.sh` green.
2. `python3 hex_backend/waffle_iron.py --grid 4` (Stubai) completes,
   baking every island intersecting the region that has DEM+imagery
   (expect roughly 12–25 islands), printing per-island timing. Target
   ≤ 20 s/island on this machine (M1); if slower, vectorize the height /
   delta / normal sampling (the per-edge diamond-slope loop may stay a
   Python loop like today).
3. `python3 tests/gosper/validate_gsp1.py frontend/app/tiles_bin/gosper_*.bin --dem hex_backend/DGM_Tirol_5m_epsg31254_2006_2020.tif` passes.
4. Manifest generated and fields spot-checked (`python3 -m json.tool`).
5. Full + low KTX2 exist for every baked island; spot-open one full KTX2
   with the basisu binary's `-info` flag (or size sanity 2–15 MB) to
   confirm it encoded.
6. Everything committed per the protocol.

## Environment

- Run from repo root. `python3` has rasterio 1.5.0, numpy, shapely, pyproj.
- basisu v2 binary is NOT in this clone; export
  `BASISU=/Users/cole/dev/Hexagons/ktx2_nonrect_texture_test/.basisu_v2/source/bin/basisu`
  before any bake (resolve_basisu_binary honors $BASISU).
- DEM + aerial TIFs are symlinked into hex_backend/ already.
- Do NOT touch anything under `frontend/app/` except nothing — no frontend
  edits at all (tiles_bin/aerial_tiles outputs are gitignored data, fine).
- Do NOT rebase/merge; stay on `codex/gosper-baker`.
