# GOAL: HEX4 binary-format regression & parity harness (safety net for the upcoming Gosper rewrite)

You are a long-running autonomous agent. Work only inside this worktree (branch `codex/hex4-harness`). This is a prototype repo; pragmatism over polish.

## Progress protocol (mandatory — this is how you are monitored)

- **Commit after every completed step** with messages in this exact format:
  `[hex4] <what was done> | next: <what comes next> | status: ok|blocked:<reason>`
- Your commit log IS the progress report. Commit early, commit often, commit partial work.
- All new files go in `tests/hex4/` at the repo root. Do not modify any existing repo file. Never push. No network access — everything is local.

## Why

The repo bakes terrain into a custom 16-byte-per-hex binary format ("HEX4"): Python writes it (`bake_sector_binary()` in `hex_backend/waffle_iron.py`), a JS Web Worker parses it (`parseBinaryV3()` in `frontend/app/tile_worker.js`). The owner is about to rewrite the layout (Gosper-curve packing) BY HAND. Your harness is the regression net that will prove the rewrite didn't corrupt the format. It must therefore test the CURRENT format exhaustively and be trivially re-runnable (`python3 tests/hex4/run_all.py` = single entry point, nonzero exit on any failure, readable summary).

## Inputs (all verified present)

- DEM: `hex_backend/DGM_Tirol_5m_epsg31254_2006_2020.tif` (symlink; READ-ONLY). EPSG:31254, float32, 5m.
- Format writer: `bake_sector_binary(SX, SY, dem_ds, grad_ds, output_dir)` in `hex_backend/waffle_iron.py`. Struct layout is documented inline (~lines 618–691): header `<4siifffii` = sig "HEX4", SX, SY, min_z-10, max_z+10, scale_f, cq, cr — then 4 layers (scales 24/6/3/1), each `<I` count + count×16-byte records `<bbHhhhBBBBBx` = dq, dr, h_scaled, d1, d2, d3 (decimeter deltas SE/S/SW), s1, s2, s3 (slope degrees), pnx, pnz (packed normals), pad.
- Format reader to port: `parseBinaryV3()` + `worldToAxialScale()` in `frontend/app/tile_worker.js` (lines ~97–153).
- Coordinate math: `hex_backend/coordinate_utility.py`; JS/Python parity precedent: `hex_backend/test_gosper.py` vs `hex_backend/test_gosper_js.mjs`.
- `node` v19 and `python3` with rasterio/shapely/numpy (verified). If imports fail, try `pixi run python3`.

## Critical constraint

`waffle_iron.py`'s TEXTURE pipeline is being rewritten on a parallel branch. Your harness must depend ONLY on the `.bin` path: import `bake_sector_binary` (plus `generate_regional_gradient` / DEM opening logic) directly from `waffle_iron` and drive it yourself. Do NOT call `main()` and do NOT touch `bake_sector_textures` — if your import of waffle_iron would execute texture code, restructure your driver, not waffle_iron.

## Phase 1 — Bake driver

`tests/hex4/bake_fixtures.py`: opens the DEM, generates a small regional gradient (see `generate_regional_gradient`, writes its output TIF under `tests/hex4/fixtures/` — pass the output path in), and bakes a fixed set of sectors into `tests/hex4/fixtures/bins/`. Sector set (document the world coords of each):
1. 2–3 "normal" interior sectors near Stubai (center sector is (73, 252); use `coordinate_utility.world_to_sector_id` on the STUBAI_LAT/LON in waffle_iron to be sure).
2. A sector straddling the DEM boundary (find DEM bounds via rasterio; pick a sector ID whose bbox partially exits them).
3. A sector fully at steep high-relief terrain (large height range → exercises the 65535 height quantization).
Fixtures are deterministic given the DEM — bake once per run, or cache with a hash check.

## Phase 2 — Dual parsers

- `tests/hex4/parse_hex4.py`: struct-accurate Python parser (independent implementation from the writer — read the bytes, don't reuse writer variables).
- `tests/hex4/parse_hex4.mjs`: line-faithful port of `parseBinaryV3()` from `tile_worker.js` (keep its exact semantics, including the layer-center recomputation via `worldToAxialScale` rounding), reading a file path argv, emitting canonical JSON to stdout.

## Phase 3 — The test suites (each its own file, each committed separately)

1. **Structural invariants** (`test_structure.py`): signature, header field sanity (SX/SY echo, min<max, scale_f>0), layer count == 4, per-record ranges (dq/dr within int8, slopes 0–255, h_scaled 0–65535), total byte length exactly header+Σ(4+16n), no trailing bytes.
2. **Python↔JS parity** (`test_parity.py`): run both parsers on every fixture; every derived field (q, r, reconstructed height h, deltas, slopes, norms, layer counts) must match exactly (floats within 1e-9 — both do the same arithmetic).
3. **Semantic ground truth** (`test_semantics.py`): for K≥50 random hexes per layer per fixture (fixed seed), recompute the expected values straight from the DEM with your own independent sampling (same nearest-pixel convention the baker uses: floor rowcol on the window transform) and assert: reconstructed height within quantization error (height range/65535 + epsilon), deltas = own-height − neighbor-height in decimeters within ±1 (SE/S/SW neighbor offsets (1,-1),(0,-1),(-1,0) at that layer's scale), the >400m NODATA clamp behavior, packed normals decode to unit-ish vectors (|n|≈1 within packing error).
4. **Round-trip determinism** (`test_determinism.py`): bake the same sector twice → byte-identical files.
5. **Golden files** (`test_golden.py` + `tests/hex4/golden/`): store per-fixture SHA256 + a compact stats summary (per-layer count, min/max/mean height, delta histograms). Test compares against goldens; a mismatch prints a field-level diff of the stats, not just "hash changed". Include a `--regen` flag (documented as: only after an INTENTIONAL format change).
6. **Corruption detection** (`test_corruption.py`): flip bytes in copies (signature, a count field, truncation mid-layer, garbage tail) and assert both parsers fail loudly or the structural suite catches it — document any silent-acceptance cases you find as KNOWN GAPS in the README (the JS parser is known to be trusting; finding its blind spots is valuable output, not a failure).

## Phase 4 — Entry point + docs (final commits)

- `tests/hex4/run_all.py`: bake/refresh fixtures → run all suites → summary table (suite, checks run, passed, failed), exit code.
- `tests/hex4/README.md`: what each suite guards, how to run, what to do when the Gosper rewrite intentionally changes the format (which suites should break and how to regen goldens), plus the KNOWN GAPS list.
- If you find actual bugs in the current writer/parser (e.g. the duplicated `struct.pack_into` call in the writer, quantization edge cases), do NOT fix them — document them in `tests/hex4/FINDINGS.md` with evidence. The harness tests reality as-is.

Definition of done: `python3 tests/hex4/run_all.py` passes clean on the current format. Final commit: `[hex4] DONE — <n> checks green, <m> findings | ...`.
