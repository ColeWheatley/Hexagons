# AA-20 release CI matrix — 2026-07-17

## Result

The release-gate implementation and local acceptance matrix are green. AA-20 remains unchecked only because the repository has no trusted self-hosted runner, so the asset-backed workflow cannot execute operationally on GitHub yet.

## Exact release corpus

- Manifest: `frontend/app/tile_manifest.json`
- Release ID: `f8602483bdb475fc3ff7`
- Verified assets: 793
- Verified bytes: 939,955,356
- Every manifest-selected file passed existence, non-empty, duplicate-reference, signature, tier-order, WebP-bootstrap, terrain, and beta tattoo-policy checks.
- Evidence: `artifacts/release-browser-20260717-r7-wiring/release-assets.json`

## Current-build browser matrix

The calibrated r7 run built and served fingerprinted bundle `main.638496ae5146.js`, verified that the local server matched the current `dist`, and passed:

- Three cold orbit trials: ready median 875.3 ms, TTFTF median 214.9 ms, frame p95 median 9.8 ms, and p99 median 16.1 ms. All are inside the checked-in M1 Pro baseline plus the 25% regression envelope.
- Three cold-to-warm pairs: 2,098.4 ms cold median to 275.3 ms warm median, an 86.7% improvement.
- Idle/hidden scheduling: zero settled frames/renders, zero hidden frames/renders, and one recovery frame/render.
- Five capability profiles: low/mid/high select 2/3/6 workers and 64/128/256 MiB texture budgets; Save-Data and 3g transfer 98.7% fewer texture bytes than high; high retains 4096 px quality; no context loss/OOM.
- Deterministic fault injection: all 6 of 63 first-attempt drops recovered within bounded retry budgets.
- WebGL loss/restore: restored and repainted in 163.0 ms observed / 107.1 ms app time, with zero recovery failures.
- Viewport gates at 320, 390, 768, and 1280 px: no shell overlap and all hit-test checks passed.
- UX/accessibility: all eight search, keyboard, control, HUD, persistence, reduced-motion, and axe serious/critical checks passed.

Evidence is under `artifacts/release-browser-20260717-r7-wiring/`. The r7 wrapper deliberately used `SOAK_SECONDS=1`; the memory validator correctly rejected two points as insufficient rather than weakening the 30-minute gate.

## Faithful memory gate

The faithful r4 soak ran for 1,800.018 seconds and passed:

- 31 retained-memory points
- bounded 180-sample profiler ring
- maximum serialized profiler size 134,141 bytes
- profiler tail slope 7.07 bytes/minute (limit 4,096)
- retained-heap slope -15,095 bytes/minute
- start-to-end retained-heap growth -2,891,108 bytes
- zero WebGL context loss or GL OOM

Evidence: `artifacts/release-browser-20260717-r4/profiler-soak.json` and `docs/reports/aa3-profiler-soak-2026-07-17.md`.

## Defects caught while closing the matrix

- `09cb063` permits a resource that was already retrying at context loss to resume that legal state after recovery. The live gate caught the prior `recovered -> retrying` omission; focused and integrated fault gates now pass.
- `9157ad0`, `8902540`, and `c41c6cc` migrated stale contracts from brittle legend markup, dead HUD placeholders, and retired `queued/loading/failed` sets to the accessible DOM, truthful HUD, and explicit per-tier state machine.
- `pixi run bash scripts/ci_contracts.sh` then passed the production build, all frontend units, 45 browser-gate validator tests, every Gosper JavaScript and Python contract, and exact JS/Python parity.

## Operational close gate

`.github/workflows/aa20-ci.yml` is automatic for trusted `master` pushes and same-repository pull requests, verifies the exact persistent corpus before building, rejects a stale local server, and runs on labels `self-hosted`, `hexagons-assets`, and `chromium` using repository variable `AA20_ASSET_ROOT`.

The GitHub API currently reports zero registered self-hosted runners. Registering Rechner would grant repository workflows code execution on that machine, so it requires Cole's explicit security/operations approval. Rechner must then receive the exact release corpus, the repository variable must point to it, and a Rechner-specific performance baseline must be measured and reviewed because the checked-in baseline is from an M1 Pro.
