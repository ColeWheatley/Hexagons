# Rechner Big-Bake Representative Benchmark — 2026-07-17

## Scope

Both runs used commit base `3f161b2`, the same Rechner source and output
contract, and isolated output roots. The subset was `--grid 1` at the fixed
Stubai center: 81 source TIFs indexed, 19 intersecting, five GSP3 islands, and
eight exact 1,024 m texture pages. Textures were clean (tattoos off), production
8×6 quality 90, using effort 1 only to keep the iteration benchmark short.

Commands differed only by execution profile:

```bash
pixi run python -u hex_backend/waffle_iron.py \
  --release-profile beta-stubai --grid 1 --force \
  --fast-texture-encode --no-texture-tattoos \
  --execution-profile mac-small --output-root <serial-root>

pixi run python -u hex_backend/waffle_iron.py \
  --release-profile beta-stubai --grid 1 --force \
  --fast-texture-encode --no-texture-tattoos \
  --execution-profile rechner-big --output-root <parallel-root>
```

The complete logs and `/usr/bin/time -v` captures remain locally under
`local_data/benchmarks/final-{serial,parallel}/`.

## Results

| Measurement | Serial | Three page workers | Change |
|---|---:|---:|---:|
| Total wall time | 106.16 s | 57.54 s | -45.8% |
| Texture stage wall | 100.9 s | 52.4 s | -48.1% |
| Geometry wall | 4.6 s | 4.5 s¹ | parity |
| Geometry rate | 65.2/min | 66.7/min¹ | parity |
| Texture rate | 4.76 pages/min | 9.16 pages/min | +92.4% |
| Average CPU | 854% | 1,616% | +89.2% |
| Max child RSS | 2,360,040 KiB | 2,355,944 KiB | parity |
| Filesystem input blocks | 0 (warm cache) | 0 (warm cache) | parity |
| Filesystem output blocks | 617,040 | 617,024 | parity |
| Output files | 56 | 56 | identical count |
| Output bytes | 65,944,255 | 65,944,255 | identical |
| Failures / retries | 0 / 0 | 0 / 0 | — |

¹The comparison CLI retains sequential geometry so texture worker count is the
only variable. The actual inventory runner uses persistent geometry workers;
five sample islands completed concurrently in about 0.95 s worker wall each.

Serial stage sums across eight pages:

- aerial compositing/raster reads: 4.3 s
- aggregate-boundary padding: 2.2 s
- coverage validation: under 0.1 s
- temporary PNG creation: 7.4 s
- WebP resize/encode: under 0.1 s
- low KTX2: 4.9 s
- medium KTX2: 5.8 s
- high KTX2: 74.3 s
- atomic transaction publication: under 0.1 s

The high encoder is the dominant cost. Under three-way contention, summed high
worker wall rises to 113.7 s, but overlap halves overall texture wall. Three
workers averaged 16.16 logical cores for the complete command and left ample
RAM/disk headroom. A fourth was not selected because each BasisU child already
uses roughly 7–8 cores during high encoding; three keeps compositing and the OS
responsive on the 32-thread 5950X.

## Determinism

The two roots produced the same total byte count. SHA-256 matched for sampled
outputs across every major deterministic path:

- GSP `gosper_277_-235.bin`:
  `a44cbf0889846615342c85ba9badcf6832af1925a2e12300caf383fd11b5d51c`
- WebP `texture_57_201.webp`:
  `8ce4869b090d03895573c9f9d697d125de0f219e9442af76b895420fbc4416a0`
- high KTX2 `texture_57_201.ktx2`:
  `7b3734c99f45ae2424c19292b077b430e49f7d244340b84561a63a913d12a483`

## Resume and manifest gate

The actual inventory-isolated runner baked five geometry units and eight page
transactions in 54.82 s. Re-running the same inventory completed in 0.46 s:
all 5/5 GSP recipes and 8/8 complete page transactions were verified and
skipped. Strict manifest generation then validated exact inventory equality,
GSP headers, recipe and coverage markers, KTX2 signatures, 32×32 WebP decode,
all four URLs per page, clean diagnostic metadata, and no unexpected output.

## CUDA decision

No CUDA code ran in either path and no CUDA speedup is claimed. The measured
bottleneck is the CPU-only Basis Universal 2.10 encoder. Moving DEM sampling to
CUDA cannot materially improve a sample where geometry is about 4% of serial
wall time, and would add a Mac-incompatible dependency. The implementation
keeps `cuda_policy=measured-only`; a future GPU path must beat this same subset
end to end before activation.

## Upload measurement status

The durable local fake-S3 tests cover hashing, MIME/cache metadata, retries,
idempotent restart, and atomic manifest publication. Real S3 transfer timing is
not yet measurable because Rechner has no AWS credentials. The production
preflight intentionally fails before creating an inventory in that state.
