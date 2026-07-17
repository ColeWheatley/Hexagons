# AA-20 CI gates

AA-20 has two tiers. The required portable tier is deterministic and has no GPU or baked-data dependency after installing locked dependencies. The asset-backed tier runs automatically for trusted same-repository pull requests and every master push; fork pull requests are excluded because untrusted code must never execute on a self-hosted runner. A manual opt-in remains available for maintenance runs.

## Required portable tier

GitHub Actions runs `pixi run bash scripts/ci_contracts.sh`. It installs the exact Pixi lockfile, builds `frontend/app/dist`, and relies on the build's own checks for parseability, dead output and external origins. It then runs every `tests/gosper/test_*.mjs`, every Python Gosper contract, and the canonical JS/Python parity dump. The retry test injects repeated failures and asserts shared exhaustion/reset behaviour; the UI accessibility contract asserts semantic DOM, keyboard behaviour, focus styling and reduced-motion support. Logs are retained as `aa20-contract-reports` even on failure.

```bash
pixi install --locked
pixi run bash scripts/ci_contracts.sh
```

## Trusted release browser tier

The `release-browser` job targets a runner labelled `self-hosted`, `hexagons-assets`, and `chromium`. It needs complete `frontend/app/tiles_bin` and `frontend/app/aerial_pages` directories plus a Chromium binary (`CHROME_BIN` can override discovery). GitHub queues the job until a matching trusted runner is registered. No deployment credentials are assumed.

Before building, `scripts/verify_release_assets.py` enumerates assets through the same manifest and diagnostic-tattoo policy as the atomic S3 publisher. Every referenced GSP, KTX2, and WebP must exist and have the correct signature; empty/duplicate asset sets fail. The report records counts, bytes, and the publisher's content-addressed release ID, so the browser matrix cannot quietly run against a partial or different corpus.

`scripts/release_browser_gates.sh` then builds and serves the production `dist` bundle against those verified assets. Three fresh-profile orbit trials are reused for both cold-start and active-frame verdicts. `config/aa20_perf_medians_baseline.json` stores the versioned M1 Pro reference medians; ready, TTFTF, frame p95, and frame p99 each fail at more than 25% above that reference. Independent hard safety ceilings of 15 s, 30 s, 100 ms, and 150 ms remain in force. This avoids a redundant second three-run cold matrix while preserving three independent cold starts and turns a material under-ceiling slowdown into a failure.

The tier also runs the deterministic fault/retry gate, and rejects any retry storm (more than three attempts for a resource or attempts above the injected-failure budget). The UX report is rejected if axe reports any serious/critical violation or if axe output is absent. Viewport validation requires exactly the 320, 390, 768 and 1280 px reports and fails on overflow, out-of-viewport controls, failed center hit-tests, or overlap at any width.

Finally, normal Stubai beta mode receives a 30-minute profiler soak (`SOAK_SECONDS=1800` by default). Once per minute it requests browser GC and records retained JS heap, profiler serialized size, ring-buffer occupancy, context loss, and GL OOM. The validator rejects a short/incomplete soak, more than 180 profiler samples, profiler size above 512 KiB, profiler tail growth above 4 KiB/min, retained heap slope above 512 KiB/min, start-to-end heap growth above 16 MiB, or any context loss/OOM. `SOAK_SECONDS` is configurable for local harness development, but release CI does not override the faithful 30-minute default.

It captures 320, 390, 768 and 1280 px screenshots as review artifacts. Screenshots remain review artifacts rather than pixel-goldens because GPU output, font rasterization and baked data vary by runner; geometric overlap and hit-testing are the mechanical gate.

```bash
pixi run pip install websockets
pixi run bash scripts/release_browser_gates.sh
```

The job fails early rather than running against missing/corrupt tiles or textures, and preserves logs, JSON reports, and screenshots as artifacts. Repository branch protection still determines whether the job is merge-blocking; the workflow itself schedules it for every trusted release candidate.

## Remaining limitations

- A matching trusted asset-backed runner is infrastructure, not repository
  content. Without one GitHub correctly leaves the release job queued rather
  than substituting a no-asset or software-rendered result.
- Performance is compared with a checked-in versioned baseline rather than
  rebuilding the pull request parent. Updating the reference is therefore an
  explicit reviewed change when the runner or intentional performance floor changes.
- Retained-heap telemetry and explicit GC are Chromium/CDP-specific. Other
  browsers still need their own release coverage.
- Screenshots are retained for human review; the automated visual assertion is
  geometric overlap/visibility/hit-testing rather than pixel identity.
