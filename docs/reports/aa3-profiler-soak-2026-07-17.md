# AA-3 Stubai beta profiler soak

Date: 2026-07-17  
Build: `716f321` (application bundle `main.108c608a4c9f.js`)  
Command: `python3 -u scripts/run_profiler_soak.py http://127.0.0.1:8134/ artifacts/aa1-aa3/stubai-beta-profiler-soak-30m.json 1800`

The normal Stubai beta URL was opened without `?bench`. Headless Chrome used
ANGLE Metal on the Apple M1 Pro. The harness required the release policy to
select `bounded-recovery`, sampled at the beginning and end of a 1,800-second
session, and failed on an unbounded profiler buffer, WebGL context loss, or GL
out-of-memory event.

## Result

| Gate | Result |
| --- | ---: |
| Requested duration | 1,800 s |
| Profiler mode, start and end | `bounded-recovery` |
| Samples, start to end | 0 to 180 |
| Ring-buffer cap | 180, passed |
| Used JS heap, start to end | 98,784,108 to 112,279,507 bytes |
| Total allocated JS heap, start to end | 129,129,124 to 113,106,043 bytes |
| End profiler-reported heap peak | 113,589,481 bytes |
| WebGL context losses | 0 |
| GL out-of-memory events | 0 |

Verdict: **PASS**. Telemetry storage reached its fixed 180-sample bound rather
than growing with session length. The browser's total allocated heap decreased
by 16.0 MB over the run; the 13.5 MB increase in used heap includes initial
terrain/texture settlement and remained below the final allocated heap.

The complete raw report remains in the ignored local artifact
`artifacts/aa1-aa3/stubai-beta-profiler-soak-30m.json`.
