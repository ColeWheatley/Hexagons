# Rechner Big Bake Operations

This is the reproducible production workflow for baking all usable terrain in
the validated Tirol orthophoto/DEM intersection on Rechner. The source corpus,
not a hand-selected rectangle and not old output files, defines coverage.

## Definitions and invariants

- `mac-small` is the conservative CPU-only, one-page-worker development path.
  `run_lil_bake.sh` retains the fixed Stubai workflow and fast effort-1 cache.
- `rechner-big` reserves 12 GiB for the OS/cache, bounds the baker to 48 GiB,
  uses 12 persistent geometry workers, three concurrent multithreaded BasisU
  page workers, and four independent upload workers.
- CUDA is optional. The measured sample was dominated by CPU BasisU encoding;
  no GPU path is enabled or claimed faster.
- Production is clean 8×6 XUASTC, quality 90, effort 4, with exactly one 32×32
  WebP and low 128 / medium 256 / high 4096 KTX2 per texture page. Production
  tattoos are rejected. Low and medium remain independent tiers, never a
  prerequisite for a visible page to jump from WebP to high.
- Every run has its own `local_data/bakes/<run-id>/app` output and durable JSON
  inventory. Manifest generation accepts only inventory GSP/page keys and
  rejects unexpected, missing, stale-recipe, incomplete, or malformed assets.
- Geometry, coverage metadata, recipe markers, and all four page assets use
  same-filesystem temporary writes and atomic replacement/commit markers.

## Rechner prerequisites

Set paths when the assets are not directly below `hex_backend/`:

```bash
export HEXAGONS_AERIAL_DIR=/absolute/path/to/complete/tirol/aerial_tifs
export HEXAGONS_DEM_PATH=/absolute/path/to/DGM_Tirol_5m_epsg31254_2006_2020.tif
```

The repository no longer tracks a Mac-only `aerial_tifs` symlink. A local
directory or symlink at that path is ignored safely. The full corpus preflight
expects substantially more than 1,000 files / 20 GiB (the known set is 3,486
files / 26,417,719,175 bytes) and validates every header plus a tiny pixel read,
CRS, 0.2 m pixel size, bounds, duplicates, overlaps, zero-byte/corrupt files,
aggregate coverage, and holes/components. The tracked
`hex_backend/aerial_source_inventory.tsv` is the authoritative identity
recovered from the original Rechner corpus before deletion: every filename and
byte count must match, and preflight compares full SHA-256 for deterministic
representatives. The restorer validates the full SHA-256 of every downloaded
file.

If the local corpus must be rebuilt from the public Land Tirol endpoint, use
the transactional restorer. Stable `.part` files resume HTTP ranges, completed
files are atomically renamed, existing/seed files are accepted only after full
digest verification, and the JSON report makes another invocation idempotent:

```bash
pixi run python -u hex_backend/aerial_downloader/restore_corpus.py \
  --destination /home/cole/data/Hexagons/aerial_tifs \
  --seed /home/cole/dev/Hexagons/hex_backend/stubai \
  --workers 8 \
  --report /home/cole/data/Hexagons/aerial-restore-report.json
```

On Rechner this recovery is run durably as the user unit
`hexagons-aerial-restore.service`, with its log at
`/home/cole/data/Hexagons/logs/aerial-restore.log`. Keep the ignored local
`hex_backend/aerial_tifs` symlink pointed at the stable data directory, not a
path inside another Git checkout.

AWS CLI v2 is pinned by Pixi. Credentials must work non-interactively:

```bash
pixi run aws sts get-caller-identity
```

The production bucket/prefix default to `s3://wheatley.cloud/hexagons/app`.
Override with `HEXAGONS_S3_BUCKET` and `HEXAGONS_S3_PREFIX` if required.

## Commands

```bash
./hex_backend/run_big_bake.sh preflight
./hex_backend/run_big_bake.sh start
./hex_backend/run_big_bake.sh status
./hex_backend/run_big_bake.sh stop
./hex_backend/run_big_bake.sh resume
./hex_backend/run_big_bake.sh publish
```

`preflight` is non-interactive and records repository/branch/commit/dirty
state, Pixi and native versions, CPU/RAM/GPU/driver/CUDA/VRAM, filesystems and
capacity estimates, all source/DEM metadata, BasisU v2 flags, source-derived
island/page counts, worker/queue limits, recipe/tattoo state, and publication
configuration. Capacity is derived from inventory counts, measured page/GSP
sizes, the full gradient cache, bounded worker temporaries, and a 50% margin.

`start` refuses dirty or unpushed tracked source, then launches a user-systemd
unit named `hexagons-big-bake-<run-id>`. It records the exact pushed commit,
PID, UTC start time, log, report, inventory, output, and S3 destination below
`local_data/big_bake/runs/<run-id>/`. The worker survives terminal/Codex exit.

`status` records a snapshot with process/service state, completed/pending/
failed/retrying/uploaded counts, units/minute, ETA, process-tree CPU/RAM/I/O,
BasisU process count, system RAM/CPU/network counters, GPU/VRAM, output/disk
growth, and durable upload backlog. `stop` preserves completed transactions.
`resume` reuses the same inventory; it verifies recipe markers and payloads,
skips complete geometry/pages, and rebuilds incomplete or mixed generations.

## Upload and publication

Completed transactions are spooled atomically under the run output. Four
bounded workers upload immutable `releases/<run-id>/...` objects independently
of compute. The spool survives crashes, retries three times, never sees temp
files, and records hashing/upload timings and completion. Uploads are
idempotent by size, content type, cache policy, and SHA-256 metadata.

After strict manifest validation, the isolated app build and landing files are
copied without deletion to:

- `https://wheatley.cloud/hexagons/`
- `https://wheatley.cloud/hexagons/app/`

Static versioned files use immutable caching. HTML and the mutable manifest
revalidate. The final manifest pointer flips only after immutable assets exist.
No `sync --delete` is used, so old releases, beta data, unrelated objects, and
the `powfinder` hierarchy remain rollback material. The public verifier checks
landing/app refresh, JS/CSS/service worker, manifest, and representative WebP,
KTX2, and GSP URLs with exact MIME types.

## Rechner benchmark (2026-07-17)

Representative subset: fixed one-grid Stubai area, 81 available source TIFs
indexed, 19 intersecting, five GSP3 islands, eight global texture pages, clean
8×6 XUASTC at effort 1 for iteration. Both runs emitted 56 files / 65,944,255
bytes. Representative GSP, WebP, and high KTX2 SHA-256 values were identical.

| Metric | Serial (`mac-small`) | Rechner (3 page workers) |
|---|---:|---:|
| Total wall time | 106.16 s | 57.54 s |
| Texture stage | 100.9 s | 52.4 s |
| Pages/minute | 4.76 | 9.16 |
| Average CPU | 854% | 1,616% |
| Geometry | 5 islands / 4.6 s | 5 islands / 4.5 s in comparison CLI |
| Max child RSS (`time -v`) | 2.36 GiB | 2.36 GiB |
| Output bytes | 65,944,255 | 65,944,255 |

Serial worker-stage sums: aerial composite 4.3 s, boundary padding 2.2 s,
temporary PNG 7.4 s, low/medium/high KTX2 4.9/5.8/74.3 s, WebP under 0.1 s.
Three-way concurrency makes individual high encodes slower under contention
(113.7 s summed) but overlaps them, reducing texture wall time by 48.1% and
total wall time by 45.8%. BasisU is therefore the dominant cost and three
workers are the measured Rechner default. Filesystem input was warm-cache zero;
both wrote about 617,000 filesystem blocks. No CUDA code ran; GPU usage is not
presented as an optimization result.

The actual inventory runner completed the same five-island/eight-page sample
in 54.82 s, then resumed in 0.46 s with all five geometry units and eight page
transactions verified/skipped. Its strict manifest contained WebP plus all
three KTX2 URLs for every page and every WebP decoded as exactly 32×32.

## Current Rechner audit (2026-07-19)

Hardware passes: Ryzen 9 5950X (16C/32T), 62 GiB RAM, RTX 3090 Ti with 23,028
MiB VRAM, driver 580.167.08, CUDA runtime 13.0/toolkit 12.5, and 204 GiB free.
Basis Universal 2.10.0 exposes the required 8×6 flag. User systemd is running.

The durable source restore completed in 779.7 seconds: all 3,486 files / exactly
26,417,719,175 bytes passed their original full SHA-256 identities, including
eight resumed partials and 81 verified Stubai seed files, with zero failures.
The stable source path is `/home/cole/data/Hexagons/aerial_tifs`.

Full-corpus preflight run `20260719T153440Z-c09db6f9fabf` validates all TIFF
headers and pixels, exact audited names/sizes, representative full hashes,
EPSG:31254 at 0.2 m, five legal coverage components, three internal holes, no
invalid files, duplicate bounds, positive-area overlaps, missing files, or
unexpected files. The source/DEM intersection is
`[-16250, 200000, 101250, 270000]`; it selects 8,172 geometry islands and 5,330
texture pages. Estimated final output is 37.10 GB, temporary peak 26.69 GB, and
the safety-margin requirement is 95.67 GB against 219.01 GB free.

The sole remaining preflight failure is that AWS CLI has no non-interactive
credentials. No production inventory or bake service is created until
`pixi run aws login` succeeds. After login, rerun `preflight`, then `start`;
do not hand-edit coverage bounds or copy stale output into the run.
