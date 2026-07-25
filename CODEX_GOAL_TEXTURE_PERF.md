# Goal: cut Hexagons texture-page bake time, output-identically

You are working in a standalone clone at `/home/cole/dev/Hexagons-codex/texture-perf`
on branch `codex/texture-perf`, forked from `master` at `c1407cc`.

## Why this matters

The owner needs to bake all validated Tirol terrain: **5,290 texture pages**.
A production run on 2026-07-20 completed only 123 pages before the machine was
shut down. At the measured rate the remaining ~5,167 pages are **25–30 hours** of
wall clock. Your job is to make that dramatically faster **without changing a
single output byte**.

This is a bench-gated optimization task. Measure, keep only what wins, revert
everything else. Judgement calls about "this feels faster" are worthless here —
only the numeric gate counts.

## Measured baseline (from the real run — trust these numbers)

Aggregated across the 123 completed pages, total real stage time 13,118 s:

| Stage | Time | Share |
|---|---|---|
| `boundary_padding` | 8,201 s | **62.5%** |
| `ktx2_high` (4096²) | 4,520 s | 34.5% |
| `ktx2_medium`, `ktx2_low`, `temporary_png`, `aerial_composite`, rest | ~397 s | 3% |

Per-page split, which matters for choosing a representative bench set:

| | n | mean | median | pad cost |
|---|---|---|---|---|
| pages needing boundary padding | 77 | 139.0 s | 54.5 s | 106.1 s |
| pages not needing it | 46 | 53.3 s | 56.7 s | 0.7 s |

Worst observed single page: **943.9 s**. The 123 completed pages are all at
`page_x` −17..−11 — the extreme western edge, the most padding-heavy strip in the
dataset (full range is `page_x` −17..99, `page_y` 194..264). Interior pages
mostly skip padding entirely.

The real run's inventory, with bounds for all 5,290 pages and per-stage timings
for the 123 completed ones, is readable at:

```
/home/cole/dev/Hexagons-big-bake-rechner/local_data/big_bake/runs/20260720T165339Z-5091432dfa16/inventory.json
```

Treat it as **read-only reference data**. Do not modify it. Do not modify
anything under `/home/cole/dev/Hexagons-big-bake-rechner/`.

## The three candidates, in priority order

### Candidate 1 — parallelise the KDTree query (targets 62.5% of cost)

In `hex_backend/waffle_iron.py`, inside the boundary-padding stage (search for
`tree.query`), there is:

```python
distances_px, nearest_indices = tree.query(query_coords, k=1, workers=1)
```

This is a `scipy.spatial.cKDTree` nearest-neighbour query over up to **13.8
million** missing pixels, pinned to a **single thread** on a 32-core machine.
`workers=-1` uses all cores. The query is embarrassingly parallel.

Expected to be output-identical, but **you must prove it** (see Output identity).
The one real risk: tie-breaking among exactly equidistant neighbours could in
principle differ with thread count, which would change padded pixel values.
If you find any output difference, do not silently accept it — report it and try
`workers=<N>` with a deterministic reduction instead, or reject the candidate.

Also look at the enclosing loop (it chunks rows by 128 via
`for row0 in range(0, coverage.shape[0], 128)`). If the chunk size interacts
badly with parallel queries — e.g. per-chunk thread pool setup dominating — tune
it, but only if it wins on the gate.

### Candidate 2 — texture worker count

`hex_backend/execution_profiles.py` defines the `rechner-big` profile with
`geometry_workers=12, texture_workers=3`. The comment says 3 was chosen to leave
headroom "for compositing, the OS, and I/O".

**Geometry is now irrelevant to the remaining work**: total geometry worker time
for all 8,120 tiles was **157 seconds**. The remaining bake is texture-only, so
the headroom that justified 3 workers is free. Find the throughput-optimal
`texture_workers` for a texture-only run on 32 cores.

Note `hex_backend/big_bake.py:381` reads `texture_workers` from the run
**inventory**, not from the profile constant, so a new run picks it up from the
profile at preflight time. Change the profile constant.

### Candidate 3 — `-max_threads` oversubscription

In `run_basisu_encode` (`hex_backend/waffle_iron.py`), each encode passes:

```python
"-max_threads", str(os.cpu_count() or 4),
```

That is **32** threads per encode, while `texture_workers` encodes run
concurrently — 3× oversubscription today, worse if you raise candidate 2. The
measured CPU during the real run was ~1,616% (≈16 of 32 cores), suggesting
basisu is not scaling as intended.

Read the `run_basisu_encode` docstring first. It records a real prior finding:
`-parallel` was measured to *disable* basisu's intra-image multithreading,
taking a 4096² encode from ~8 s to ~27 s. Do not re-add `-parallel`. Treat
`-max_threads` sizing (e.g. `cpu_count // texture_workers`) as the knob.

**Candidates 2 and 3 interact.** Do not tune them independently and assume the
results compose — once you have a promising value for each, measure the
combination.

### Explicitly OUT of scope

Do **not** change `quality` or `effort` in the texture encoding profile. Effort
is currently 4 and accounts for much of `ktx2_high`, but lowering it changes
output bytes and is a visual-quality decision the owner has reserved. Do not
touch the encoding profile, block size, tier resolutions, or mip settings.

## Output identity — the hard gate

All three candidates must be **byte-identical** in output. This is
non-negotiable and is what makes them safe to ship.

Build your bench so that for every bench page you retain the produced
`.webp` and all three `.ktx2` tiers, and compare SHA-256 against the baseline
run's artifacts for the same page. A candidate that changes any output hash is
**rejected**, regardless of speed — report it clearly rather than keeping it.

## Numeric gate

- **Primary metric:** median per-page `total` stage time over the bench set.
- **Keep a candidate iff** it improves the primary metric by **≥10%** AND every
  output hash is unchanged.
- **Also report** per-stage medians (`boundary_padding`, `ktx2_high`) so the
  owner can see where the win came from.
- **Measure 3×** and use the median of the three runs. For any candidate within
  5% of the gate, measure 5× instead — do not let noise decide.
- Record total wall clock for the whole bench set too, since worker-count changes
  affect throughput without changing per-page time.

## Bench set

Choose **10–12 pages** from the inventory, and justify the choice in your report:

- ~5 with heavy boundary padding, including at least one of the known-pathological
  ones (`texture_-14_206` took 943.9 s, `texture_-12_206` 756.5 s,
  `texture_-13_206` 633.3 s). Include at least one 900 s-class page — if your
  win doesn't show there, it isn't a real win.
- ~5 interior pages with no padding, drawn from the `page_x` 0..99 range that
  the real run never reached. These represent the bulk of the remaining work, so
  weight your conclusions toward them.

Keep the set **fixed** across all candidates. Reusing exactly the same pages is
what makes the comparison valid. Write the page list into the repo so it's
reproducible.

## Bench harness

`scripts/run_bench.py` is a CDP-driven **frontend** bench — not what you need,
but read it as a reference for structure (single-flight subprocess handling,
JSON report output, clean teardown).

Write a new harness, e.g. `scripts/bench_texture_pages.py`, that:

- bakes exactly the fixed page set into a scratch output root under
  `local_data/bench/<candidate>/` **inside this clone** (never the real run's
  directories, never S3);
- reads per-stage timings the way the pipeline already records them (the
  pipeline populates a `timings` dict per page — reuse that, don't reinvent
  timing);
- writes a JSON report per run with per-page and per-stage numbers plus output
  SHA-256s;
- prints a compact median table at the end.

**Process hygiene — structural, not introspective.** Never launch a new
subprocess until the previous handle's `.wait()` has returned. Use
`try/finally` with `terminate()` → `kill()` → `wait()`. Do not write logic that
depends on inspecting the process table.

**The machine is shared.** The owner may be running unrelated GPU work in
parallel. That work is GPU-bound and should not perturb your CPU timings, but
record `os.getloadavg()` at the start and end of every bench run into the JSON
report, and flag any run whose load average suggests external contention so
noisy results can be discarded rather than trusted. Do not attempt to kill or
inspect anything you did not start. Nothing you do should use the GPU.

## Hard constraints

- **Never run the production bake.** Do not invoke `hex_backend/run_big_bake.sh`
  with `start`, `resume`, or `publish`.
- **Never touch S3.** No `aws` calls of any kind, in any direction.
- **Never write outside this clone.** The symlinked `hex_backend/aerial_tifs`,
  the DEM, and the basisu binary are **read-only inputs**.
- Do not modify `/home/cole/dev/Hexagons` or
  `/home/cole/dev/Hexagons-big-bake-rechner`.
- Keep `.pixi` as-is; it is a symlink to a shared env. Use
  `.pixi/envs/default/bin/python` directly. Do not run `pixi install` or
  otherwise mutate the env.
- Do not change the texture encoding profile (see out-of-scope above).
- The existing test suite must stay green:
  `.pixi/envs/default/bin/python -m unittest tests/test_big_bake_pipeline.py tests/test_release_publish.py tests/test_verify_release_assets.py tests/test_rebake_texture_bootstrap.py`
  (28 tests, currently passing). Run it before your final commit.

## Commit discipline — this is the crash-durability mechanism

Commit after **every candidate, kept or rejected**, including a ledger-only
commit for a rejection. Uncommitted work is unrecoverable if this process dies.

Message format:

```
[texperf] <what you did> | next: <what's next> | status: ok|blocked:<reason>
```

Maintain `PERF_LEDGER_TEXTURE.md` in the repo root with one row per candidate:
candidate, change (file:line), median before, median after, % delta, output
hashes identical y/n, verdict kept/rejected, and why. This file is the
deliverable the owner reads first — keep it honest, including negative results.
A candidate that didn't work is valuable information, not a failure to hide.

## Definition of done

1. `PERF_LEDGER_TEXTURE.md` records all three candidates with real measured
   numbers, 3× (or 5×) medians, and output-hash verdicts.
2. Every kept change is byte-identical in output and beats the ≥10% gate.
3. Every rejected change is reverted from the working tree, with its measurement
   preserved in the ledger.
4. `scripts/bench_texture_pages.py` and the fixed page list are committed and
   reproducible.
5. The 28-test suite passes.
6. A final commit whose message states the **projected remaining bake time** for
   5,167 pages under the kept configuration, with the arithmetic shown.
7. Everything is committed to `codex/texture-perf`. Do not merge, do not push to
   any remote, do not delete branches.

## If you get stuck

If a candidate is ambiguous — output differs subtly, or the gate is borderline
across repeats — **stop and write it up in the ledger with a
`status: blocked:<reason>` commit** rather than guessing or quietly loosening the
gate. A clear blocked report is a good outcome. Silently shipping a change that
alters output bytes is the worst possible outcome, because it would corrupt a
30-hour production bake.
