# PERF LEDGER

## Runner Setup / Safety Blocker - 2026-07-07

- Changed `scripts/run_bench.py` to use the orchestrator-style localStorage polling runner on CDP port `9345`.
- Added fail-closed Chrome hygiene:
  - before launch, `pgrep -f 'Google Chrome'` must succeed;
  - any matching Chrome PIDs are killed with `SIGKILL`, then re-checked;
  - memory headroom is checked with `vm_stat` and, when available, `ps aux -m`;
  - Chrome teardown uses `terminate()`, `kill()` fallback, `wait()`, per-run profile `rm -rf`, and post-teardown `pgrep` verification;
  - teardown verification warnings append to this ledger.
- Syntax check: `python3.14 -m py_compile scripts/run_bench.py` passed.
- Smoke attempt: `python3.14 scripts/run_bench.py http://127.0.0.1:8199/ /private/tmp/powfinder_bench_smoke.json --screenshot /private/tmp/powfinder_bench_smoke.png --timeout 30` failed before launching Chrome because `pgrep -f 'Google Chrome'` cannot get the process list in this sandbox:
  `sysmon request failed with error: sysmond service not found`.
- Verdict: **BLOCKED for Chrome benching** until `pgrep` works from this execution environment. No candidate bench was run after the new hard rules.
- Commit attempt: `git add scripts/run_bench.py` failed because this sandbox cannot create `.git/index.lock` (`Operation not permitted`). Repo files are writable, but `.git` is currently read-only to this process, so required durability commits are also blocked.

## Blocker Recheck - 2026-07-07

- Rechecked `git log --oneline -5`, `git status --short --branch`, `python3.14 -m py_compile scripts/run_bench.py`, `pgrep -f 'Google Chrome'`, and `.git` write access.
- `scripts/run_bench.py` still compiles.
- `pgrep -f 'Google Chrome'` still fails with `sysmon request failed with error: sysmond service not found`, so the mandatory Chrome pre-launch guard is unavailable.
- `.git` is still not writable from this process: `touch .git/codex_write_test` fails with `Operation not permitted`, so commits cannot be created.
- Verdict: **BLOCKED**. Continuing to launch Chrome would violate the hard safety rules, and continuing to edit candidates would violate the required commit-after-meaningful-step durability rule.

## Runner Policy Update - 2026-07-07

- Orchestrator confirmed `.git` writes are now allowed and withdrew the impossible `pgrep`/`ps` rule.
- Committed the prior runner/ledger checkpoint as `[grind] checkpoint: add bench runner and blocked ledger`.
- Removed all process-table checks from `scripts/run_bench.py`; runner now uses structural single-instance discipline only:
  one browser subprocess handle per invocation, `try/finally`, `terminate()`, `kill()` fallback, `wait()`, unique `--user-data-dir`, and immediate profile cleanup.
- Installed Chrome app and Chrome for Testing app both fail code-signing / launch checks in this sandbox. Direct Google Chrome launch exits with SIGABRT before CDP is usable.
- Playwright `chrome-headless-shell` launches only with `--single-process --no-sandbox`; CDP/localStorage smoke passes:
  `python3.14 scripts/run_bench.py http://127.0.0.1:8202/ /private/tmp/powfinder_bench_smoke3.json --screenshot /private/tmp/powfinder_bench_smoke3.png --timeout 30`.
- Smoke result: runner wrote JSON and screenshot, but GL probe returned `{"error":"no webgl"}`.
- Verdict: **BLOCKED for valid PowFinder benches** until a WebGL-capable Chrome/Chromium launch path is available. Running candidate benches with this browser would produce invalid "improvements" because the viewer cannot render WebGL.

## Browser Recovery Attempt - 2026-07-07

- Downloaded a fresh Chrome for Testing with `NPM_CONFIG_CACHE=/private/tmp/powfinder-npm-cache npx @puppeteer/browsers install chrome@stable --platform mac_arm --path /private/tmp/powfinder-browsers`.
- The downloaded app also failed code-sign verification initially; ad-hoc signing in `/private/tmp` made `codesign --verify --deep --strict` pass.
- Even after ad-hoc signing and background-app Info.plist tweaks, Chrome for Testing still exits with SIGABRT in `TransformProcessType` / RegisterApplication before WebGL or CDP is usable.
- Added runner guardrails:
  - `POWFINDER_BENCH_BROWSER` and `POWFINDER_BENCH_BROWSER_ARGS` can point the runner at a fixed WebGL-capable browser without code edits;
  - default runs refuse to continue if the GL probe returns `{"error":"no webgl"}`;
  - `--allow-no-webgl` exists only for fast runner-plumbing smoke tests.
- Smoke with the explicit escape hatch passed:
  `python3.14 scripts/run_bench.py http://127.0.0.1:8202/ /private/tmp/powfinder_bench_smoke4.json --screenshot /private/tmp/powfinder_bench_smoke4.png --timeout 30 --allow-no-webgl`.
- Verdict: **still BLOCKED for candidate 0**. No baseline/candidate bench can be trusted until the runner's GL probe reports a real WebGL context.
