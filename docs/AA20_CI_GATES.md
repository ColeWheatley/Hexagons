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

`scripts/release_browser_gates.sh` builds and serves the production `dist` bundle against the runner's release assets, then makes three orbit trials and accepts the median of loader hidden / ready <= 15 s, visible textured coverage (TTFTF) <= 30 s, and orbit p95 <= 100 ms. It captures 320, 390, 768 and 1280 px viewport screenshots as review artifacts and fails mechanically on horizontal overflow, out-of-viewport primary controls, or search/control-panel overlap. Screenshots remain review artifacts rather than pixel-goldens because GPU output, font rasterization and baked data vary by runner.

```bash
pixi run pip install websockets
pixi run bash scripts/release_browser_gates.sh
```

The browser tier is not a PR required check until the labelled asset-backed runner is provisioned. It fails early rather than running against missing tiles/textures, and preserves logs, JSON reports and screenshots as artifacts.
