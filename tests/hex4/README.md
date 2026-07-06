# HEX4 Regression Harness

Run everything from the repo root:

```bash
python3 tests/hex4/run_all.py
```

The entry point refreshes binary fixtures, runs every suite, prints a summary table, and exits nonzero on any failure. It touches only `tests/hex4/fixtures/` for generated bins and gradient caches; that directory is ignored.

## Fixtures

Fixtures are baked through `bake_sector_binary()` only. The texture path and `waffle_iron.main()` are not called.

| label | sector | world bounds `(min_x,min_y,max_x,max_y)` | why |
| --- | ---: | --- | --- |
| `stubai_center` | `(73,252)` | `(59801.6,206438.4,60620.8,207257.6)` | normal Stubai sector from `STUBAI_LAT/LON` |
| `stubai_east` | `(74,252)` | `(60620.8,206438.4,61440.0,207257.6)` | adjacent normal interior sector |
| `stubai_north` | `(73,253)` | `(59801.6,207257.6,60620.8,208076.8)` | adjacent normal interior sector |
| `dem_west_edge` | `(-28,252)` | `(-22937.6,206438.4,-22118.4,207257.6)` | straddles the DEM western boundary |
| `high_relief` | `(109,305)` | `(89292.8,249856.0,90112.0,250675.2)` | fully interior high-relief sector with >400 m clamp cases |

## Suites

`test_structure.py` checks signature, header sanity, four layer counts, record ranges, exact byte length, and no trailing bytes.

`test_parity.py` compares the independent Python parser with a line-faithful Node port of `parseBinaryV3()` for q/r, reconstructed height, deltas, slopes, normals, layer counts, and header-derived values.

`test_semantics.py` samples the DEM independently using the current writer’s row/col conventions. It checks quantized heights, SE/S/SW deltas within ±1 dm, the >400 m delta clamp, and packed normal sanity.

`test_determinism.py` bakes the same sector twice into ignored temp directories and compares bytes and SHA256.

`test_golden.py` compares per-fixture SHA256 plus compact stats: per-layer count, height min/max/mean, and exact delta histograms.

`test_corruption.py` mutates signature, count, truncation, and tail bytes. A corruption passes the suite only if both parsers reject it or structural validation catches it.

## Intentional Format Changes

After an intentional binary format change such as Gosper packing:

1. Run `python3 tests/hex4/run_all.py`.
2. Expect structure, parity, semantic, and golden failures until both parsers and semantic expectations are updated.
3. Once the new format is verified, regenerate goldens with:

```bash
python3 tests/hex4/run_all.py --regen
```

Only use `--regen` after confirming the changed bytes are intentional. Golden mismatches print field-level stats diffs so the hash change is inspectable.

## Known Gaps

The JS worker parser accepts garbage tail bytes because `parseBinaryV3()` never checks the final offset. The corruption suite documents this and relies on structural validation to catch it.

The JS worker parser is generally trusting: it validates the signature and then reads counts/records until `DataView` throws. It does not independently validate count reasonableness, total byte length, or header `cq/cr`.
