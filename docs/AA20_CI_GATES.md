# AA-20 CI gates

AA-20 has two tiers. The required PR tier is deterministic and has no GPU or baked-data dependency after installing locked dependencies. The release tier is opt-in because a meaningful terrain/browser result needs the non-versioned baked corpus and target Chromium/WebGL configuration.

## Required PR tier

GitHub Actions runs `pixi run bash scripts/ci_contracts.sh`. It installs the exact Pixi lockfile, builds `frontend/app/dist`, and relies on the build's own checks for parseability, dead output and external origins. It then runs every `tests/gosper/test_*.mjs`, every Python Gosper contract, and the canonical JS/Python parity dump. The retry test injects repeated failures and asserts shared exhaustion/reset behaviour; the UI accessibility contract asserts semantic DOM, keyboard behaviour, focus styling and reduced-motion support. Logs are retained as `aa20-contract-reports` even on failure.

```bash
pixi install --locked
pixi run bash scripts/ci_contracts.sh
```

## Opt-in release browser tier

Dispatch **AA-20 CI gates** with `release_browser=true` on a runner labelled `self-hosted`, `hexagons-assets`, and `chromium`. It needs complete `frontend/app/tiles_bin` and `frontend/app/aerial_pages` directories plus a Chromium binary (`CHROME_BIN` can override discovery). No secrets or deployment are assumed.

`scripts/release_browser_gates.sh` builds and serves the production `dist` bundle against the runner's release assets. Three fresh-profile orbit trials are reused for both cold-start and active-frame verdicts: median loader hidden / ready <= 15 s, TTFTF <= 30 s, frame p95 <= 100 ms, and frame p99 <= 150 ms. This avoids a redundant second three-run cold matrix while preserving three independent cold starts. These numbers are release budgets: exceeding one is treated as a regression even if the other metrics improve.

The tier also runs the deterministic fault/retry gate, and rejects any retry storm (more than three attempts for a resource or attempts above the injected-failure budget). The UX report is rejected if axe reports any serious/critical violation or if axe output is absent. Viewport validation requires exactly the 320, 390, 768 and 1280 px reports and fails on overflow, out-of-viewport controls, failed center hit-tests, or overlap at any width.

Finally, normal Stubai beta mode receives a 30-minute profiler soak (`SOAK_SECONDS=1800` by default). Once per minute it requests browser GC and records retained JS heap, profiler serialized size, ring-buffer occupancy, context loss, and GL OOM. The validator rejects a short/incomplete soak, more than 180 profiler samples, profiler size above 512 KiB, profiler tail growth above 4 KiB/min, retained heap slope above 512 KiB/min, start-to-end heap growth above 16 MiB, or any context loss/OOM. `SOAK_SECONDS` is configurable for local harness development, but release CI does not override the faithful 30-minute default.

It captures 320, 390, 768 and 1280 px screenshots as review artifacts. Screenshots remain review artifacts rather than pixel-goldens because GPU output, font rasterization and baked data vary by runner; geometric overlap and hit-testing are the mechanical gate.

```bash
pixi run pip install websockets
pixi run bash scripts/release_browser_gates.sh
```

The browser tier is not a PR required check until the labelled asset-backed runner is provisioned. It fails early rather than running against missing tiles/textures, and preserves logs, JSON reports and screenshots as artifacts.

## Remaining limitations

- The asset-backed tier remains opt-in on a specially labelled runner, so it is
  not yet a required check on every pull request.
- Frame regression is enforced against fixed release budgets, not by rebuilding
  and benchmarking the pull request's parent revision. This keeps the matrix to
  three trials rather than six but will not flag a slowdown that remains below
  the budget.
- Retained-heap telemetry and explicit GC are Chromium/CDP-specific. Other
  browsers still need their own release coverage.
- Screenshots are retained for human review; the automated visual assertion is
  geometric overlap/visibility/hit-testing rather than pixel identity.
