# Bake Speedup Analysis — texture pages on Rechner (5950X, 32 threads, 62 GiB)

Analysis only; no benchmarks were run (a bake is live on this machine). All numbers
are labeled VERIFIED (read from code/data), ESTIMATED (arithmetic from verified
inputs), or INFERRED (reasoned, needs measurement).

## Headline

**Estimated achievable wall clock: ~11–13 h (from ~22 h) with zero output-byte
changes, from a single change: rebalance `texture_workers` × `-max_threads`.**
Everything else is second-order. If the owner separately elects a lower basisu
effort (his call, changes bytes), the same run drops to roughly **4–6 h**.

Re-derived baseline: using the 123 completed pages' timings plus a
coverage-fraction model for all 5,290 pages (below), remaining worker time is
**≈ 239,000 s**, of which **≈ 218,000 s is `ktx2_high`**. At the current
effective ~16 busy cores that is ≈ 22 h wall — consistent with the 20–25 h
estimate. VERIFIED inputs, ESTIMATED total.

## Ranked table

| # | Change | Mechanism | Est. saving | Confidence | Risk | Changes output bytes |
|---|--------|-----------|-------------|------------|------|---------------------|
| 1 | `texture_workers` 3→~10, `-max_threads` 32→~3 | Fill the idle half of the CPU; basisu's intra-image scaling saturates ~5 cores | **~9–11 h** (22 h → 11–13 h) | High (mechanism verified, exact optimum needs a cheap sweep) | RAM growth — must measure basisu RSS; queue depth must rise too | **No** |
| 2 | effort 4 → 1 (or 2/3) — **owner's decision, not a recommendation** | 5.6× faster high-tier encode per prior M1 measurement | further ~7–8 h on top of #1 | Medium (M1 datapoint, not swept at q90) | Visual quality; needs sign-off | **Yes** |
| 3 | Skip the 664 zero-imagery pages | Don't encode all-black 4096² pages | ~0.4 h compute; real win is 12.6% fewer assets and ~3.7 GB runtime VRAM if resident | High on the count; product decision on skipping | Frontend/manifest must tolerate absent pages | Removes assets |
| 4 | GPU (3090 Ti) encode | — | **None available** — no XUASTC-compatible GPU encoder exists; format break for desktop clients | High (negative finding) | — | — |
| 5 | PNG round-trip / tier redundancy / upload | Already cheap: ~1 s/page combined; upload fully overlapped | < 0.5 h total | High | — | No |

## 1. Worker count and thread allocation (the lever)

**VERIFIED facts:**
- `hex_backend/waffle_iron.py:446` — every basisu call gets
  `-max_threads os.cpu_count()` = 32, while `rechner-big` runs
  `texture_workers=3` (`hex_backend/execution_profiles.py`, rechner-big block):
  96 requested threads on 32 cores, yet only ~1,616 % CPU observed.
- `hex_backend/big_bake.py:381` reads `texture_workers` from the **run
  inventory** (`inventory["execution_profile"]["texture_workers"]`), not the
  profile constant. **Operational note: editing `execution_profiles.py` does
  not change an already-created run — the inventory's stored profile must be
  updated (or the run re-preflighted).**
- `texture_queue_depth=6` in the same profile — must be raised with workers or
  the pool starves.
- Per-page stage means from `reference/baseline_inventory.json` (123 completed
  pages): `ktx2_high` 36.7 s mean overall, 48.4 s for unpadded pages; all other
  stages combined < 4 s/page. `aerial_composite` is 0.44 s — compositing is not
  a reason to hold workers back anymore.

**Explaining 1,616 % (INFERRED):** 3 processes × 32 permitted threads averaging
only ~5.4 busy cores each means basisu's single-image encode does not scale to
32 threads. A 4096² XUASTC encode has serial phases (PNG decode, mip-chain
generation, KTX2 assembly/supercompression write) and a block-parallel phase
whose per-thread work items are too coarse/contended past a handful of threads.
This is Amdahl saturation inside each process, not memory bandwidth: if DRAM
bandwidth were the wall, 3 processes would already pin whatever ceiling exists
and adding processes wouldn't help — but the machine is provably half idle, and
independent processes touching independent 48 MiB images are the easy way to
consume the idle half. (Memory-bandwidth ceiling at ~30 busy cores is the one
thing that could cap the gain below 2×; the sweep below detects it.)

**Arithmetic (ESTIMATED):** each in-flight encode currently gets ~16/3 ≈ 5.4
effective cores and a full page takes ~50 s → ≈ 270 core-seconds of work per
high encode. At `workers=10, -max_threads 3` (30 threads ≈ 30 cores): per-page
encode ≈ 90 s but 10 in flight → throughput 10/90 = 0.111 pages/s vs today's
3/50 = 0.060 → **≈ 1.85×**, i.e. ~22 h → ~12 h. Per-thread efficiency usually
*improves* at low thread counts, so this is conservative.

**Recommended configuration to validate:** sweep
{(5 w × 6 t), (6 w × 5 t), (8 w × 4 t), (10 w × 3 t)} — all ≈ 30 threads total.
Code change needed: `-max_threads` at `waffle_iron.py:446` is hardcoded to
`os.cpu_count()`; it must become a parameter (e.g. `cpu_count // texture_workers`
or a profile field).

**RAM (must measure):** budget is `ram_limit_gib=48`. Each texture worker holds
a 4096² RGB canvas plus PIL variants (order 150–250 MB) and each basisu process
some unknown RSS. If basisu peaks at ~2 GB, 10 workers ≈ ~25 GB — fine — but
this is INFERRED; measure before trusting (experiment below).

## 2. GPU: honest answer is no

- The frontend transcodes **XUASTC LDR KTX2** via a vendored Basis Universal v2
  WASM transcoder (`frontend/app/tile_worker.js:18-47`, VERIFIED). On
  ASTC-capable devices it targets ASTC 8×6, but on desktop it targets BC7/other
  — that universality *is* the point of XUASTC. A GPU encoder producing plain
  ASTC KTX2 (astcenc, NVTT3-CUDA, compute-shader BC) is not consumable by this
  transcoder and would break every non-ASTC client, or require a parallel asset
  set and loader path. No CUDA/GPU XUASTC encoder exists in Basis Universal
  v2.10 or anywhere else I know of (INFERRED from knowledge; basisu's `-opencl`
  path accelerates only the old ETC1S mode, not UASTC/XUASTC).
- `cuda_decision` in `hex_backend/bake_preflight.py:579-582` says
  `enabled: False, reason: "…no apples-to-apples CUDA benefit measured."` —
  read literally, that records that **nothing was ever measured** (VERIFIED
  wording; `cuda_policy="measured-only"` in the profile). The conclusion is a
  policy default, not a tested result — but for the reasons above the
  conclusion is still correct for this format: there is nothing to measure
  against. Revisit only if the pipeline ever drops the universal-transcode
  requirement.

## 3. Redundant work — mostly already clean

- Tiers are **not** re-composited: low/medium are Lanczos resizes of the high
  canvas (`prepare_texture_variants`, `waffle_iron.py:343-372`, VERIFIED).
  `ktx2_medium`+`ktx2_low` cost 2.0 s/page combined — deriving them from the
  high encode would save at most ~3 h of *worker* time (~0.4 h wall at 30
  cores) and is not worth the complexity.
- `temporary_png` is 0.79 s/page mean (VERIFIED). basisu v2 has no stdin/pipe
  input, so eliminating it means linking basisu as a library — not worth it.
  Cheap micro-win: `save(..., compress_level=1)` on the 4096 PNG shrinks the
  write and basisu's decode barely changes; sub-1 % effect. Skip unless free.
- Composite reads only intersecting TIFs via windowed reads
  (`composite_aerial_texture`, `waffle_iron.py:899-943`) and the TIF bounds
  come from `.tif_bounds_cache.json` (~5 s once, `waffle_iron.py:685`).
  `aerial_composite` = 0.44 s/page measured. Nothing to save here. VERIFIED.
- `upload_to_s3` (`waffle_iron.py:457-493`) fire-and-forgets one `aws s3 cp`
  **process per file**, but it is gated on `S3_ENABLED` which big_bake leaves
  False (it uses the spool instead) — no cost in production runs. VERIFIED.

## 4. Page count: 664 pages have zero imagery

Computed by intersecting all 5,290 page bounds
(`reference/baseline_inventory.json`) with the union of all 3,486 source TIF
rectangles (`hex_backend/aerial_tifs/.tif_bounds_cache.json`) — VERIFIED
geometry, run during this analysis:

| Imagery coverage of page | Pages |
|---|---|
| exactly 0 % | **664** |
| 0–5 % | 11 |
| 5–25 % | 263 |
| 25–50 % | 175 |
| 50–99.9 % | 660 |
| full | 3,517 |

Area-weighted imagery coverage is 78.6 %. But the **time** saving from skipping
zero pages is modest: encode time is content-dependent, and near-black pages
already encode fast — completed pages with < 50 % coverage averaged 18.0 s
`ktx2_high` and the zero-coverage ones 6.6–8.4 s (VERIFIED from the 123-page
sample). Skipping all 664 zero pages saves ≈ 4,700 worker-seconds ≈ **0.4 h
wall at 3 workers, minutes at 10** — plus 12.6 % fewer S3 objects and, more
meaningfully, ~5.6 MB ASTC VRAM per page (~3.7 GB) if the frontend would
otherwise make them resident. Whether the frontend/manifest tolerates absent
pages is a contract question I did not resolve; note that
`bake_texture_page` already refuses pages with neither geometry nor imagery
(`waffle_iron.py:1406-1408`), so these 664 must be pages with geometry but no
imagery. Skipping them is a product decision, not a pure perf win.

## 5. effort / quality — owner's decision (quantified only)

- Current: XUASTC 8×6, quality 90, effort 4 (`hex_backend/texture_contract.py:33-38`, VERIFIED).
- Existing evidence: `--fast-texture-encode` (effort 1) exists and README.md:85-87
  records **~8 s vs ~45 s** for one 4096² encode on the M1 (5.6×), with an
  earlier q75-era comparison showing < 2 % size change; `codec_sweep/REPORT.md`
  swept block sizes at fixed q90/e4, so there is **no quality data for effort
  1–3 at the production profile**. VERIFIED sources, unswept quality.
- Scaled: `ktx2_high` worker time 218,000 s → ≈ 39,000 s at effort 1; combined
  with lever #1, total run ≈ **4–6 h**. Efforts 2–3 would land in between.
  This changes output bytes and needs the owner's visual sign-off; presenting,
  not recommending.

## 6. I/O and upload

`progressive_upload.py` is a durable file-spool drained by 4 daemon-ish threads
fully decoupled from bake workers (VERIFIED: `spool()` just writes a JSON task;
workers claim from `pending/`). Total upload volume ≈ 37 GB
(`estimate.final_bytes`); even a 12 h run needs only ~7 Mbit/s average. Upload
cannot back-pressure baking — worst case the spool drains after the bake ends.
No action needed; `upload_workers=4` is fine.

## What needs measuring before trusting (cheap, on an idle machine)

1. **Worker/thread sweep (gates #1):** pick 3 representative full-coverage
   pages; for each config in {5×6, 6×5, 8×4, 10×3} (workers × max_threads),
   encode the same 3 high-tier PNGs concurrently at that worker count, 3
   repeats, record median pages/hour and total CPU %. ~20 min total. If
   throughput plateaus below ~2,800 % CPU, memory bandwidth is the ceiling —
   accept the plateau config.
2. **basisu peak RSS:** `/usr/bin/time -v <basisu cmd>` on one full 4096 page →
   multiply by worker count against the 48 GiB limit.
3. **Effort quality (only if owner opts in):** re-run the existing
   `codec_sweep` harness at 8×6 q90 with effort ∈ {1,2,3,4} on its source
   cells; compare SSIM columns like `REPORT.md` does, plus eyeball 2–3 pages.
4. **Zero-page skip:** confirm frontend behavior when a manifest page's KTX2 is
   absent before deleting anything from the plan.

## What I could not determine

- The exact intra-basisu scaling curve (where between 3 and 8 threads the
  per-image encoder stops scaling) — the sweep above answers it.
- basisu process RSS at 4096² (never recorded anywhere I found).
- Whether the frontend contract permits missing pages (item 4).
- Whether the 123-page sample (biased toward coverage-edge pages: 46 of 123 are
  < 50 % coverage vs 449 of 5,290 overall) skews the full-page 50 s mean; n=48
  full pages is decent but the true fleet mean could differ by a few seconds
  either way.
