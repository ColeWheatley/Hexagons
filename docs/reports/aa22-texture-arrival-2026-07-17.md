# AA-22 initial high-texture arrival: pre-ladder versus current

Measured 2026-07-17 on Apple M1 Pro, ANGLE Metal, and Chrome 150 headless.

## Result

Current master installed the first visible `high4096` texture in a median
**568.2 ms** from app start. The pre-direct-ladder baseline did not dispatch or
install a high texture in any of three 60-second trials, so its installation
median is right-censored at **>60,190.5 ms**.

At that censor boundary, current is demonstrably **>105.9x faster**, or a
**>99.05% latency reduction**. This is a lower bound: the baseline's eventual
arrival time is unknown because it never reached the event during observation.

## Revisions and asset identity

- Direct-ladder change: `3978cf626ec26e049ea81653d48c02135def0594`.
- Exact baseline, verified with `git rev-parse 3978cf6^`:
  `6b56f0d04f39576e2e97be8e36144cd07f6b08d7`.
- Candidate, current master at measurement:
  `1339efb` (`Fix isolated profiler soak runner`).
- Both detached worktrees used the same live geometry and imagery directories
  and the same 149-page tattoo-3 manifest.
- Manifest recipe: `4.1.0+codec-production+effort-1+tattoo-3`.
- Manifest SHA-256:
  `c2063907c0d36411c884872bdc13fe0e4cf59bd64ead8fa0ca3190a18e9d6728`.

## Methodology

1. Created detached worktrees for the exact baseline and candidate revisions.
2. Pointed both worktrees at the identical current `tile_manifest.json`,
   `aerial_pages`, and `tiles_bin` corpus.
3. Added only the three later-standardized `firstHighQueued`,
   `firstHighDispatched`, and `firstHighInstalled` profiler calls to the
   baseline. They were placed at the same queue, dispatch, and install points
   used by current master and did not change scheduling.
4. Served source trees on separate localhost ports.
5. Ran three trials per revision sequentially. Every trial used a new temporary
   Chrome profile, 1440x900 CSS viewport, DPR 1, no scripted camera motion
   (`?bench=1`), and a fixed 60-second high-install observation window.
6. Captured profiler milestones plus texture state, resident tiers, active jobs,
   and pending queue tiers at completion or timeout.
7. Ran the candidate request-plan unit gate; all six assertions passed.

Representative commands:

```sh
git worktree add --detach /tmp/hexagons-aa22-old 6b56f0d04f39576e2e97be8e36144cd07f6b08d7
git worktree add --detach /tmp/hexagons-aa22-new 1339efb
python3 -m http.server 8142 --bind 127.0.0.1  # baseline frontend/app
python3 -m http.server 8143 --bind 127.0.0.1  # candidate frontend/app
python3.14 probe.py 'http://localhost:8142/?bench=1' old/probe-N.json --timeout 60
python3.14 probe.py 'http://localhost:8143/?bench=1' new/probe-N.json --timeout 60
node --test test/texture_ladder.test.mjs
```

## Raw run values

Times are profiler-relative milliseconds from app start. A dash means the
event was not observed before the trial's censor time.

| Revision | Run | High queued | High dispatched | High installed | Observation end |
|---|---:|---:|---:|---:|---:|
| baseline `6b56f0d` | 1 | 311.9 | - | - | 60,314.1 |
| baseline `6b56f0d` | 2 | 314.1 | - | - | 60,235.6 |
| baseline `6b56f0d` | 3 | 309.9 | - | - | 60,190.5 |
| candidate `1339efb` | 1 | 319.2 | 438.6 | 635.5 | 1,022.7 |
| candidate `1339efb` | 2 | 311.0 | 313.2 | 568.2 | 1,025.0 |
| candidate `1339efb` | 3 | 317.5 | 319.6 | 550.0 | 924.7 |
| **baseline median** | | **311.9** | **not reached** | **>60,190.5** | |
| **candidate median** | | **317.5** | **319.6** | **568.2** | |

Baseline queue/residency at each timeout:

| Run | Resident `low128` | Resident `medium256` | Pending `medium256` | Pending `high4096` |
|---:|---:|---:|---:|---:|
| 1 | 149 | 2 | 147 | 6 |
| 2 | 149 | 4 | 145 | 6 |
| 3 | 149 | 4 | 145 | 6 |

Candidate state when first high was observed:

| Run | Resident `low128` | Resident `medium256` | Resident `high4096` | Pending `high4096` |
|---:|---:|---:|---:|---:|
| 1 | 0 | 14 | 1 | 3 |
| 2 | 0 | 14 | 2 | 2 |
| 3 | 0 | 14 | 2 | 2 |

## Request-plan correctness

The runtime state matches the intended plan:

- The baseline loaded all 149 low pages before high could dispatch and remained
  blocked behind 145-147 medium jobs, with all six visible high jobs pending.
- Current had no resident `low128` asset in any trial. The first installed high
  belonged to a `visible` page and that page's only resident asset was
  `high4096`.
- Fourteen `medium256` pages served guard or out-of-distance demand while
  visible near pages took the bootstrap-to-high path.
- The six passing request-plan assertions cover WebP32 directly to high4096,
  medium for guard/below-threshold pages, no outside-corpus demand, promotion
  only for an outside page bound by visible geometry, bounded WebP residency,
  and no low prerequisite after WebP is resident.

## Limitations

- The baseline result is right-censored. It establishes a lower bound, not the
  baseline's eventual high-arrival time.
- The candidate is current master, not isolated commit `3978cf6`. Later
  resource-state, material, and UI changes are part of the candidate, so the
  full measured gain cannot be attributed exclusively to one commit.
- Localhost removes WAN variance and measures scheduling, decode, and upload
  latency. Absolute public-S3 timings will differ, although the removed
  prerequisite ordering remains applicable.
- Headless Chrome/Metal is objective and repeatable, but it does not replace
  Safari coverage or human visual-quality review.
