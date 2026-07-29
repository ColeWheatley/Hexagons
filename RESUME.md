# PowFinder Beta — Overnight Freeze State & Resume Plan

**Frozen 2026-07-29 ~01:25 Vienna: Claude session limit hit; all subagents down until 05:00 Vienna.**
Written by the orchestrating session while still alive. Everything below is verified state, not intention.

## What is DONE and safe

| Item | State | Where |
|---|---|---|
| Design docs (snowpack/avalanche/frontend) | final + errata'd | scratchpad `*.md` (session-tmp) — key rulings duplicated below |
| INCA winter 2025-11→2026-05 | done | `r2:avalanchers/powfinder/inca/winter-2025-26/` |
| Stations, bulletins (154/182 d), terrain artifacts | done | `r2:avalanchers/powfinder/{validation,bulletins,terrain}/` |
| Snowpack engine + winter backfill **generation 1** | done, mass-closed, manifest-order verified | `r2:avalanchers/powfinder/sidecars/` — 34,755 obj / 15.3 GiB (+ snapshots) |
| Station validation | done: valley RMSE ~10.6 cm; **high-alpine ~40-60% THIN** (Pitztaler −77 cm) | `station_model_hs.csv` on box, 23:21 |
| Avalanche fallback engine + gen-1 daily retro | done (synthetic slab, pre-ruling headers — superseded) | `snow_backend/avalanche_work/out/` (Mac worktree) |
| MPM port | VALIDATED on box (containment 0.996–1.0 vs fallback; ~3.1 sims/s) | wheel on box; `frozen_params_dry.json` committed |
| Frontend P0.1/P0.2/P3.2 + prep + full risk spine P1.1–P1.3 | done, 141/141 tests, first light + churn verified | branch `powfinder-beta` @ `017ecbf` |
| Deploy path recon + gzip ruling | done | `snow_backend/DEPLOY.md` |
| GPU box (Spain 3080, $0.117/hr, instance 46144782) | provisioned, idle | `ssh -p 24782 root@ssh8.vast.ai`, README at /workspace/README_BUILD.md |

## What is PENDING (the resume queue, in order)

1. **snowpack-design**: calibration VERDICT from station_model_hs.csv under my bounds
   (valley RMSE degrade ≤20%; Pitztaler bias at least halves, not chased to zero; factor documented).
   If accepted → 311-s box rerun → re-stage sidecars+index to R2 → declare FINAL.
   If bounds unmeetable → declare gen-1 FINAL, document bias. Also confirm the coverage-merged
   index.json overwrite happened (watcher may have died mid-chain).
2. **avalanche-design**: single final rerun (~90 min, Mac): real slab via SidecarRegistry +
   bulletin prior (`avalanche_work/inputs/timeline.json`) + canonical pfl_enums headers.
   Then upload avalanche .pfl set to R2 sidecars staging.
3. **Phase-2 frontend fleet** — five briefs ALREADY DELIVERED to agent inboxes; branches forked
   at 017ecbf, no work landed yet: fe-p01→pf/p21 (P2.1 + skirt pixel-verify + layers_coverage
   scope-add), fe-p02→pf/p22 (P2.2), fe-landing→pf/p23 (P2.3), fe-p24→pf/p24 (P2.4),
   fe-p25→pf/p25 (P2.5 + CRC32 guard). Worktrees at /Users/cole/dev/pf-wt/p2*.
   On resume: re-send each agent "resume your assigned task per your brief" (SendMessage).
4. **Integrator**: merge pf/p2* → powfinder-beta serially, then P3.1 perf gate (scripts/run_bench.py pattern).
5. **Deploy** per snow_backend/DEPLOY.md: build frontend, pre-gzip sidecars (Content-Encoding: gzip),
   `aws s3 sync` (region eu-central-1) to `s3://wheatley-cloud-eu/powfinder/beta/` (sqh/depth/surface/avalanche
   layers only, NOT engine layers), smoke-test wheatley.cloud/powfinder/beta, demo GIF.
6. **Post-deploy**: kick MPM gen-3 winter retro on the box (task #15, ~25 h, ~$3).

## Binding contract rulings (survive any context loss)

- .pfl: body = 197 tiles × 2,401 B, **tile_manifest.json tiles[] order**, depth-4 heap order/tile;
  32 B PFL1 header (24 B fields + 8 reserved); manifestHash = CRC32 of manifest FILE BYTES (3511903013).
- Enums (snow_backend/pfl_enums.py, sole source): sqh=1 depth=2 surface=3 avalanche=4 slab=5 hn24=6
  hn72=7 wet=8 sdens=9; u8_linear=1 u8_class=2 packed_bits=3; mean=1 max=2 mode=3 or=4.
- Avalanche byte: bit7 release + bits0-6 severity; domains release[1,127] runout[2,127];
  0=NODATA, 1=simulated-none (renders untinted, severity<1.5 guard), raw 128 = data error at every level;
  per-field reducers (release "or", severity "max").
- NODATA = byte 0 in EVERY layer; real domain 1..255.
- Sidecars served pre-gzipped WITH Content-Encoding: gzip (whole-file fetches only — no sub-file Range, ruled permanent).
- index.json: engine_layers passthrough; layers_coverage per layer (avalanche daily→nearest-present;
  scrubber/store infer stride from bitmask, never special-case ids).
- All new frontend modules .mjs; atlas entry `createSidecarAtlas(THREE, {...})` (DI).
- Git: per-agent worktrees/branches for Phase 2; shared tree = two-step PATH-SCOPED add+commit only.
- Beta labeling: avalanche = "susceptibility (beta)", never forecast; no smoothing below L1; no time interpolation.

## Costs so far
Box: ~$0.35 total (incl. two dead rentals ~3¢). Vast credit remaining: ~$89.5. S3/R2: cents.
