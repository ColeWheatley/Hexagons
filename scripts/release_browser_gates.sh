#!/usr/bin/env bash
# Opt-in AA-20 release gate: needs Chromium and a complete local baked corpus.
set -euo pipefail
cd "$(dirname "$0")/.."
PORT="${PORT:-8124}"
BASE_URL="${BASE_URL:-http://127.0.0.1:${PORT}}"
OUT="${OUT:-artifacts/release-browser}"
mkdir -p "$OUT"
if [[ ! -d frontend/app/tiles_bin || ! -d frontend/app/aerial_pages ]]; then
  echo 'release browser gate requires frontend/app/{tiles_bin,aerial_pages}; refusing partial/no-asset run' >&2
  exit 2
fi
python3 -m http.server "$PORT" --directory frontend/app >"$OUT/server.log" 2>&1 &
server=$!
trap 'kill "$server" 2>/dev/null || true' EXIT
sleep 1
for trial in 1 2 3; do
  python3 scripts/run_bench.py "${BASE_URL}/?bench=orbit" "$OUT/orbit-${trial}.json" --timeout 150
done
python3 scripts/validate_perf_medians.py "$OUT"/orbit-{1,2,3}.json
# Inspection artifacts, not pixel-goldens: GPU rasterization and terrain data vary by runner.
for width in 320 390 768 1280; do
  python3 scripts/run_bench.py "${BASE_URL}/?bench=coldload" "$OUT/viewport-${width}.json" --screenshot "$OUT/viewport-${width}.png" --viewport "${width},900" --timeout 150
done
