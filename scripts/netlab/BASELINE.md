# Offline cafe baseline — 2026-09-27

Production app replayed from a local mirror, with a fresh Chrome profile for every run. Release manifest query: `v=v0.10.0-rc6`. The mirror occupies 623 MB after seeding the default view and the manifest-listed texture pages around the east-pan and west-jump paths. Every accepted run was service-worker controlled, every reference reached the 8-second server-quiet condition, and there were **zero 504 mirror misses**. A lone `/favicon.ico` 404 appears in most runs because that browser request is outside the app mount. Raw curves, category/range accounting, and contact sheets are in [`baselines/`](baselines/).

## Exact run commands

The final baseline server was started with:

```sh
node scripts/netlab/netlab_server.mjs \
  --proxy-mount /hexagons/app/=https://wheatley.cloud/hexagons/app/ \
  --profile cafe --offline --log scripts/netlab/tmp/server-final.jsonl
```

These commands reproduce the eight accepted runs (the original runs were executed in sequential batches while the mirror was being completed):

```sh
for item in cold-1 cold-2 warm-1 warm-2 pan-1 pan-2 jump-1 jump-2; do
  scenario=${item%-*}
  /opt/homebrew/bin/python3.14 scripts/netlab/netlab_bench.py \
    --scenario "$scenario" \
    --out "scripts/netlab/tmp/baseline-$item" \
    --server-log scripts/netlab/tmp/server-final.jsonl
done
```

`--observe` and `--seed-seconds` both used their 90-second defaults; `--dpr` used its default 1. The pan and jump durations are fixed by their scenario definitions. Before offline runs, the mirror was populated by the README's `none` seeding commands and further GETs for the manifest-listed pages in the coordinate bands `x=59..64,y=199..204` and `x=43..49,y=199..204` across bootstrap, low, medium, and high tiers. Failed diagnostic runs with 504s were discarded and are not included below.

## Visual completeness

SpeedIndex is the integral of `1−VC`; smaller is faster. Times are milliseconds from the start of each phase. Pan phases are initial/east/return; jump phases are initial/west.

| Scenario | Run | Phase | SpeedIndex ms | VC50 ms | VC85 ms | VC95 ms |
|---|---:|---|---:|---:|---:|---:|
| cold | 1 | load | 3,611.3 | 3,501.1 | 5,001.1 | 14,501.1 |
| cold | 2 | load | 3,604.9 | 3,501.1 | 5,001.1 | 14,501.1 |
| warm | 1 | load | 3,229.0 | 2,502.1 | 5,001.2 | 14,001.1 |
| warm | 2 | load | 3,250.4 | 2,500.2 | 5,002.1 | 14,002.1 |
| pan | 1 | initial | 2,017.9 | 2,000.8 | 3,501.1 | 5,001.1 |
| pan | 1 | east | 4,349.2 | 6,001.1 | 6,001.1 | 6,001.1 |
| pan | 1 | return | 4,017.8 | 6,001.2 | 6,001.2 | 6,001.2 |
| pan | 2 | initial | 3,602.8 | 3,502.1 | 5,002.0 | 14,502.1 |
| pan | 2 | east | 5,518.9 | 6,002.3 | 6,002.3 | 16,500.5 |
| pan | 2 | return | 4,648.7 | 6,001.2 | 6,001.2 | 12,000.9 |
| jump | 1 | initial | 3,597.5 | 3,502.2 | 5,001.1 | 14,502.1 |
| jump | 1 | west | 2,217.8 | 1,000.7 | 4,002.1 | 9,002.2 |
| jump | 2 | initial | 3,605.6 | 3,501.2 | 5,003.0 | 14,501.5 |
| jump | 2 | west | 2,225.6 | 1,002.1 | 4,002.5 | 9,002.1 |

## Network and milestones

MB uses decimal millions of body bytes. The full category breakdown and ranges are in each `result.json`.

| Scenario | Run | Body MB | High-tier MB | Re-download MB | Manifest last byte ms | First tile last byte ms | Loader hidden ms | JS heap MiB | Chrome RSS MiB |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| cold | 1 | 50.96 | 41.96 | 0.84 | 797 | 1,404 | 1,695 | 22.5 | 429 |
| cold | 2 | 50.96 | 41.96 | 0.84 | 787 | 1,397 | 1,695 | 22.5 | 583 |
| warm | 1 | 50.07 | 41.96 | 0.03 | 829 | 1,515 | 1,712 | 22.5 | 366 |
| warm | 2 | 50.07 | 41.96 | 0.03 | 839 | 1,522 | 1,720 | 22.5 | 527 |
| pan | 1 | 17.63 | 0.00 | 4.61 | 802 | 1,219 | 1,703 | 42.1 | 438 |
| pan | 2 | 144.55 | 126.47 | 35.00 | 790 | 1,397 | 1,717 | 30.2 | 535 |
| jump | 1 | 104.22 | 88.09 | 0.84 | 789 | 1,400 | 1,747 | 28.2 | 477 |
| jump | 2 | 104.22 | 88.09 | 0.85 | 789 | 1,389 | 1,698 | 28.2 | 649 |

## Repeat variance

The two cold runs differ by 0.18% in load SpeedIndex; warm by 0.66%; jump west by 0.35%. Their body bytes are identical or within 0.003%. Pan is substantially less stable: initial SpeedIndex is 2,017.9 vs 3,602.8 ms, east SpeedIndex 4,349.2 vs 5,518.9 ms, and total bytes 17.63 vs 144.55 MB. The difference is high-tier texture demand: zero high-tier requests in pan run 1 versus 21 requests (126.47 MB) in run 2. The camera path and mirror contents were the same. Treat pan A/B differences of this size as workload variation and compare request categories and contact sheets, not only one aggregate score.

## Link-model self-check

With the final offline cafe server, `curl --http2` requested a mirrored 6,004,025-byte KTX2 object at `releases/20260730T071045Z-1548e536091d/aerial_pages/high/texture_57_201.ktx2?v=4.2.2%2Bcodec-production%2Beffort-4`. Server JSONL timings exclude occasional client TLS setup delays:

| Probe | Server duration | Server TTFB |
|---|---:|---:|
| One 6.0 MB transfer | 2,760.8 ms | 92.1 ms |
| Two transfers in parallel | 5,425.9 / 5,427.3 ms | 91.4 / 91.2 ms |
| 9,153-byte HTML during large transfer | 549.9 ms | 540.5 ms |
| Same HTML while idle | 96.0 ms | 91.8 ms |

The first cold VC curve scored 0.0079 at 0 s, 0.456 at 2 s, 0.873 at 5 s, 0.972 at 15 s, and 1.0 by 30 s against its settled reference. The VC postprocessor asserts an identical-frame score of 1.0.
