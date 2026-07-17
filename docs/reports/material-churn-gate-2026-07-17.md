# A*-3 material/shader churn gate — 2026-07-17

## Result

PASS. The optimized renderer reduced median measured main-thread render-cycle
time from **1.2931 ms to 1.0999 ms (14.94%)**, exceeding the required 10%.
The final framebuffer was pixel-identical under an in-process replay of the
pre-fix uniform writes, and the timed LOD selection was structurally identical.

## Reproducible control

The control and candidate were served from separate worktrees against the same
current Stubai manifest, geometry, textures, Chrome build, viewport, and
instrumentation. The control was derived from commit `a0a59c3` and changed only
the uniform writer back to its pre-fix behavior: every candidate uniform was
assigned on every rendered frame. The candidate shares frame-global uniform
objects and updates them once, while retaining per-material LOD/finest state.

Environment:

- Chrome headless, ANGLE Metal, Apple M1 Pro
- 1440×900 framebuffer
- deterministic 20-second orbit sample (5 s settle, 10 s tilt, 5 s orbit)
- three fresh-profile control runs and three fresh-profile candidate runs
- render-cycle timer surrounds render statistics, visibility/material update,
  and `renderer.render()` on the main thread

## Measurements

| Trial | Control (ms) | Candidate (ms) |
|---|---:|---:|
| 1 | 1.2243 | 1.0774 |
| 2 | 1.2931 | 1.1114 |
| 3 / proof | 1.2985 | 1.0999 |
| **Median** | **1.2931** | **1.0999** |

Median uniform writes fell from **5,372,461 to 2,518**. All six runs recorded
zero texture-serialization warnings.

## Equivalence gates

- Pixel parity: the candidate rendered its optimized state, replayed the old
  unconditional per-material writes with identical values, rendered again, and
  read both 5,184,000-byte RGBA framebuffers directly with `gl.readPixels`.
  Both fingerprints were exactly `fnv32=3483336364`,
  `weighted32=3086732840`.
- LOD parity: the control and candidate timed fingerprints matched exactly for
  all 138 resident tiles, including moving state, finest-built level, geometry
  selection signature, and visible levels. The optimized/baseline replay also
  left that fingerprint unchanged.
- Draw parity: both proof runs ended at 635 draw calls, 5,722,284 triangles,
  and 2 WebGL programs.

## Verification

Run from the repository root:

```sh
python3 scripts/validate_material_churn_gate.py perf_reports/material_churn_gate
```

The checked-in raw reports are the exact inputs used by the validator. The
frontend unit suite and production bundle build are separate required gates.
