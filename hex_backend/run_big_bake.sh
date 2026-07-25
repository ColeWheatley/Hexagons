#!/usr/bin/env bash
# Durable Rechner production-bake control surface.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPT="$ROOT/hex_backend/run_big_bake.sh"
STATE_ROOT="${HEXAGONS_BIG_BAKE_STATE_ROOT:-$ROOT/local_data/big_bake}"
CURRENT="$STATE_ROOT/current.env"
COMMAND="${1:-status}"
PIXI_BIN="${HEXAGONS_PIXI_BIN:-}"

if [[ -z "$PIXI_BIN" ]]; then
  PIXI_BIN="$(command -v pixi 2>/dev/null || true)"
fi
if [[ -z "$PIXI_BIN" && -x "$HOME/.pixi/bin/pixi" ]]; then
  PIXI_BIN="$HOME/.pixi/bin/pixi"
fi
if [[ -z "$PIXI_BIN" || ! -x "$PIXI_BIN" ]]; then
  echo "Pixi executable not found; set HEXAGONS_PIXI_BIN to its absolute path." >&2
  exit 1
fi

mkdir -p "$STATE_ROOT"

load_current() {
  if [[ ! -f "$CURRENT" ]]; then
    echo "No current big-bake run. Run: $SCRIPT preflight" >&2
    exit 1
  fi
  # The file is written only by write_current with shell-escaped values.
  # shellcheck disable=SC1090
  source "$CURRENT"
}

write_current() {
  local temporary="$CURRENT.$$.tmp"
  {
    printf 'RUN_ID=%q\n' "$RUN_ID"
    printf 'RUN_ROOT=%q\n' "$RUN_ROOT"
    printf 'OUTPUT_ROOT=%q\n' "$OUTPUT_ROOT"
    printf 'REPORT=%q\n' "$REPORT"
    printf 'INVENTORY=%q\n' "$INVENTORY"
    printf 'LOG=%q\n' "$LOG"
    printf 'UNIT=%q\n' "$UNIT"
    printf 'COMMIT=%q\n' "$COMMIT"
    printf 'AERIAL_DIR=%q\n' "$AERIAL_DIR"
    printf 'DEM_PATH=%q\n' "$DEM_PATH"
    printf 'S3_BUCKET=%q\n' "$S3_BUCKET"
    printf 'S3_PREFIX=%q\n' "$S3_PREFIX"
  } > "$temporary"
  mv "$temporary" "$CURRENT"
}

new_run() {
  COMMIT="$(git -C "$ROOT" rev-parse HEAD)"
  RUN_ID="${HEXAGONS_RUN_ID:-$(date -u +%Y%m%dT%H%M%SZ)-${COMMIT:0:12}}"
  RUN_ROOT="$STATE_ROOT/runs/$RUN_ID"
  OUTPUT_ROOT="${HEXAGONS_OUTPUT_ROOT:-$ROOT/local_data/bakes/$RUN_ID}"
  REPORT="$RUN_ROOT/preflight.json"
  INVENTORY="$RUN_ROOT/inventory.json"
  LOG="$RUN_ROOT/bake.log"
  UNIT="hexagons-big-bake-$RUN_ID"
  AERIAL_DIR="${HEXAGONS_AERIAL_DIR:-$ROOT/hex_backend/aerial_tifs}"
  DEM_PATH="${HEXAGONS_DEM_PATH:-$ROOT/hex_backend/DGM_Tirol_5m_epsg31254_2006_2020.tif}"
  S3_BUCKET="${HEXAGONS_S3_BUCKET:-wheatley.cloud}"
  S3_PREFIX="${HEXAGONS_S3_PREFIX:-hexagons/app}"
  mkdir -p "$RUN_ROOT" "$OUTPUT_ROOT"
  write_current
}

preflight() {
  if [[ ! -f "$CURRENT" || "${HEXAGONS_NEW_RUN:-0}" == "1" ]]; then
    new_run
  else
    load_current
  fi
  git -C "$ROOT" fetch --prune origin
  echo "Repository: $ROOT"
  echo "Branch: $(git -C "$ROOT" branch --show-current)"
  echo "Commit: $(git -C "$ROOT" rev-parse HEAD)"
  echo "Worktrees:"
  git -C "$ROOT" worktree list
  echo "Dirty status:"
  git -C "$ROOT" status --short
  "$PIXI_BIN" run --manifest-path "$ROOT/pixi.toml" python -u "$ROOT/hex_backend/bake_preflight.py" \
    --repo "$ROOT" \
    --execution-profile rechner-big \
    --release-profile production-tirol \
    --run-id "$RUN_ID" \
    --aerial-dir "$AERIAL_DIR" \
    --dem "$DEM_PATH" \
    --output-root "$OUTPUT_ROOT" \
    --report "$REPORT" \
    --inventory "$INVENTORY" \
    --bucket "$S3_BUCKET" \
    --prefix "$S3_PREFIX" | tee "$RUN_ROOT/preflight.log"
}

assert_pushed_clean_revision() {
  if [[ -n "$(git -C "$ROOT" status --porcelain=v1 --untracked-files=no)" ]]; then
    echo "Refusing production launch from a dirty tracked checkout." >&2
    exit 1
  fi
  local branch remote_ref
  branch="$(git -C "$ROOT" branch --show-current)"
  remote_ref="origin/$branch"
  if ! git -C "$ROOT" rev-parse --verify "$remote_ref" >/dev/null 2>&1; then
    echo "Refusing launch: branch $branch has not been pushed to origin." >&2
    exit 1
  fi
  if ! git -C "$ROOT" merge-base --is-ancestor HEAD "$remote_ref"; then
    echo "Refusing launch: exact runtime commit is not on $remote_ref." >&2
    exit 1
  fi
}

start_service() {
  load_current
  assert_pushed_clean_revision
  [[ -f "$INVENTORY" ]] || preflight
  if systemctl --user is-active --quiet "$UNIT"; then
    echo "$UNIT is already active."
    exit 0
  fi
  systemctl --user reset-failed "$UNIT" >/dev/null 2>&1 || true
  systemd-run --user \
    --unit="$UNIT" \
    --collect \
    --property=Restart=no \
    --property=TimeoutStopSec=120 \
    --working-directory="$ROOT" \
    "$SCRIPT" worker
  sleep 1
  systemctl --user show "$UNIT" -p MainPID --value > "$RUN_ROOT/pid"
  date -u +%Y-%m-%dT%H:%M:%SZ > "$RUN_ROOT/started_at"
  "$PIXI_BIN" run --manifest-path "$ROOT/pixi.toml" python - "$ROOT" "$INVENTORY" "$UNIT" "$RUN_ROOT/pid" "$LOG" "$S3_BUCKET" "$S3_PREFIX" <<'PY'
import sys
from pathlib import Path
sys.path.insert(0, str(Path(sys.argv[1]) / "hex_backend"))
from bake_inventory import load_inventory, write_json_atomic
path=Path(sys.argv[2]); inventory=load_inventory(path)
inventory["execution"]={
  "service":sys.argv[3], "pid":int(Path(sys.argv[4]).read_text().strip()),
  "log":sys.argv[5], "s3_bucket":sys.argv[6], "s3_prefix":sys.argv[7],
  "started_at":Path(path).parent.joinpath("started_at").read_text().strip(),
}
write_json_atomic(path,inventory)
PY
  echo "Started $UNIT (PID $(cat "$RUN_ROOT/pid"))"
  echo "Log: $LOG"
  echo "Inventory: $INVENTORY"
}

show_status() {
  load_current
  systemctl --user status "$UNIT" --no-pager || true
  if [[ -f "$INVENTORY" ]]; then
    "$PIXI_BIN" run --manifest-path "$ROOT/pixi.toml" python "$ROOT/hex_backend/bake_status.py" \
      --inventory "$INVENTORY" --pid-file "$RUN_ROOT/pid" \
      --append "$RUN_ROOT/status_snapshots.jsonl"
  elif [[ -f "$REPORT" ]]; then
    "$PIXI_BIN" run --manifest-path "$ROOT/pixi.toml" python - "$REPORT" <<'PY'
import json, sys
p=json.load(open(sys.argv[1])); print(json.dumps({"passed":p["passed"],"failures":p["failures"]},indent=2))
PY
  fi
  echo "Recent log:"
  tail -n 30 "$LOG" 2>/dev/null || true
}

publish_site() {
  load_current
  [[ -f "$OUTPUT_ROOT/app/tile_manifest.json" ]] || {
    echo "Final validated manifest is absent; refusing publication." >&2
    exit 1
  }
  npm --prefix "$ROOT/frontend/app" ci
  HEXAGONS_MANIFEST_PATH="$OUTPUT_ROOT/app/tile_manifest.json" \
    HEXAGONS_DIST_DIR="$OUTPUT_ROOT/site_dist" \
    npm --prefix "$ROOT/frontend/app" run build
  "$PIXI_BIN" run --manifest-path "$ROOT/pixi.toml" python "$ROOT/scripts/publish_site.py" \
    --bucket "$S3_BUCKET" --base-prefix hexagons --app-dist "$OUTPUT_ROOT/site_dist"
  "$PIXI_BIN" run --manifest-path "$ROOT/pixi.toml" python "$ROOT/scripts/release_publish.py" \
    --manifest "$OUTPUT_ROOT/app/tile_manifest.json" \
    --app-root "$OUTPUT_ROOT/app" \
    --bucket "$S3_BUCKET" --prefix "$S3_PREFIX" --release-id "$RUN_ID"
  "$PIXI_BIN" run --manifest-path "$ROOT/pixi.toml" python "$ROOT/scripts/verify_public_release.py"
}

case "$COMMAND" in
  preflight)
    new_run
    preflight
    ;;
  start)
    if [[ -f "$CURRENT" ]]; then
      load_current
      if [[ "$COMMIT" != "$(git -C "$ROOT" rev-parse HEAD)" || ! -f "$INVENTORY" ]]; then
        new_run
      fi
    else
      new_run
    fi
    preflight
    start_service
    ;;
  resume)
    load_current
    start_service
    ;;
  worker)
    load_current
    exec > >(tee -a "$LOG") 2>&1
    echo "Worker start: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo "Run: $RUN_ID commit=$COMMIT inventory=$INVENTORY"
    "$PIXI_BIN" run --manifest-path "$ROOT/pixi.toml" python -u "$ROOT/hex_backend/big_bake.py" --inventory "$INVENTORY"
    echo "Worker complete: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    ;;
  status)
    show_status
    ;;
  stop)
    load_current
    systemctl --user stop "$UNIT"
    echo "Stopped $UNIT; committed transactions and inventory are preserved."
    ;;
  publish)
    publish_site
    ;;
  *)
    echo "Usage: $SCRIPT {preflight|start|status|stop|resume|publish}" >&2
    exit 2
    ;;
esac
