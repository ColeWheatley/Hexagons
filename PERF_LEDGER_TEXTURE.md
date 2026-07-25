# Texture-page performance ledger

This ledger is the decision record for the byte-identical Tirol texture-page
optimization. Generated artifacts and machine-readable reports live under
`local_data/bench/` and are intentionally gitignored.

## Gate

- Fixed sample: `scripts/texture_bench_pages.json` (five pathological western
  boundary pages and five previously unbaked interior pages).
- Primary metric: median per-page `total` within each repeat, then the median of
  three repeats (five repeats when within 5% of the 10% gate).
- Secondary metrics: the same aggregation for `boundary_padding` and
  `ktx2_high`, plus median whole-set wall clock.
- Keep only at least 10% lower primary time with all WebP/KTX2 SHA-256 hashes
  unchanged.
- Baseline western hashes are checked against the 2026-07-20 production
  artifacts. Baseline interior hashes must agree across all repeats; that
  complete baseline hash set is the reference for every candidate.

## Results

| Candidate | Change (file:line) | Median before (s) | Median after (s) | Delta | `boundary_padding` median (s) | `ktx2_high` median (s) | Bench wall median (s) | Hashes identical | Verdict | Why |
|---|---|---:|---:|---:|---:|---:|---:|:---:|---|---|

## Projection

Pending measured kept configuration.
