#!/usr/bin/env bash
# Opt-in AA-20 release gate: needs Chromium and a complete local baked corpus.
set -euo pipefail
cd "$(dirname "$0")/.."
PORT="${PORT:-8124}"
BASE_URL="${BASE_URL:-http://localhost:${PORT}}"
OUT="${OUT:-artifacts/release-browser}"
BENCH_DURATION="${BENCH_DURATION:-20}"
SOAK_SECONDS="${SOAK_SECONDS:-1800}"
mkdir -p "$OUT"
if [[ ! -d frontend/app/tiles_bin || ! -d frontend/app/aerial_pages ]]; then
  echo 'release browser gate requires frontend/app/{tiles_bin,aerial_pages}; refusing partial/no-asset run' >&2
  exit 2
fi
(cd frontend/app && npm ci && npm run build)
ln -sfn ../tiles_bin frontend/app/dist/tiles_bin
ln -sfn ../aerial_pages frontend/app/dist/aerial_pages
python3 -m http.server "$PORT" --directory frontend/app/dist >"$OUT/server.log" 2>&1 &
server=$!
trap 'kill "$server" 2>/dev/null || true' EXIT
sleep 1
for trial in 1 2 3; do
  # A fresh Chrome profile makes each orbit startup a cold trial. The same
  # three reports therefore gate cold ready/TTFTF and active p95/p99 without a
  # redundant second set of browser launches.
  python3 scripts/run_bench.py "${BASE_URL}/?bench=orbit&benchDuration=${BENCH_DURATION}" "$OUT/cold-orbit-${trial}.json" --timeout 150
done
# AA-7 returning-visitor gate. Each pair uses a fresh profile internally, but
# the cold and warm navigation inside a pair share one tab/profile. Three
# independent pairs keep Chrome startup and filesystem noise out of the verdict.
for trial in 1 2 3; do
  python3 scripts/run_bench.py "${BASE_URL}/?bench=coldload&benchDuration=${BENCH_DURATION}" "$OUT/warm-reload-${trial}.json" --warm-reload --timeout 150
done
python3 scripts/validate_warm_reload.py "$OUT"/warm-reload-{1,2,3}.json --min-improvement-percent 60
python3 scripts/validate_perf_medians.py "$OUT"/cold-orbit-{1,2,3}.json \
  --cold-reports "$OUT"/warm-reload-{1,2,3}.json
# AA-8: prove the real viewer sleeps once settled and resumes after a CDP
# hidden/visible transition. This is intentionally separate from scripted
# benchmarks, whose camera driver keeps rAF active by design.
python3 scripts/run_idle_browser_gate.py "${BASE_URL}/?idle-gate=1" "$OUT/idle-browser.json" --timeout 150
# AA-11: emulate standard low/mid/high, Save-Data, and effective-network
# signals before application startup. The validator proves the selected live
# budgets, measured transfer reduction, unchanged high quality, and clean
# context-loss/OOM counters. This remains in the asset-backed opt-in tier.
python3 scripts/run_capability_matrix.py "${BASE_URL}/" "$OUT/capability-matrix.json" --timeout 150
python3 scripts/validate_capability_matrix.py "$OUT/capability-matrix.json"
# AA-2: deterministic 10% first-attempt request loss, followed by a forced
# WEBGL_lose_context round trip. The viewer-side hook is enabled only by the
# paired bench=1/fault-gate=1 query and reports global retry attempt numbers
# across its worker lanes.
python3 scripts/run_fault_recovery_gate.py \
  "${BASE_URL}/?bench=1&fault-gate=1" "$OUT/fault-recovery.json" \
  --full-assets --screenshot "$OUT/fault-recovery.png" --timeout 150
python3 scripts/validate_fault_recovery_gate.py "$OUT/fault-recovery.json"
# Inspection artifacts, not pixel-goldens: GPU rasterization and terrain data vary by runner.
for width in 320 390 768 1280; do
  python3 scripts/run_bench.py "${BASE_URL}/?bench=coldload&benchDuration=${BENCH_DURATION}" "$OUT/viewport-${width}.json" --screenshot "$OUT/viewport-${width}.png" --viewport "${width},900" --timeout 150
done
python3 scripts/validate_viewport_audits.py "$OUT"/viewport-*.json
# AA-12/13/15/16: real search long-task, truthful control, persistence,
# keyboard shell/reduced-motion and axe serious/critical acceptance.
python3 scripts/run_ux_browser_gate.py "${BASE_URL}/" "$OUT/ux-browser.json"
python3 scripts/validate_ux_browser_gate.py "$OUT/ux-browser.json"
# AA-3/AA-20: normal beta mode, not ?bench, with GC-normalized retained-memory
# samples. Release CI is faithful to 30 minutes; SOAK_SECONDS is only for local
# harness development and the validator receives the same explicit minimum.
python3 scripts/run_profiler_soak.py "${BASE_URL}/" "$OUT/profiler-soak.json" "$SOAK_SECONDS"
python3 scripts/validate_profiler_soak.py "$OUT/profiler-soak.json" --min-duration-seconds "$SOAK_SECONDS"
