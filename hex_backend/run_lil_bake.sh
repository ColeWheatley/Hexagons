#!/bin/bash
set -euo pipefail
# @atlas: Orchestration script for rapid iteration local testing. Triggers a small-scale (e.g. 12x12 grid) 'Mini-Bake' focused around Stubai using waffle_iron.py, specifically disabling S3 synchronization to allow for quick frontend layout and texture tuning.
# 🧇 Waffle Iron - Rapid Iteration Bake
# This script runs the default Mini-Bake logic (12x12 grid around Stubai)
# This is the smallest representative bake for layout/texture testing. The
# shared global page grid is restart-safe; forced rebakes remain dominated by
# the 4096px high XUASTC encode, while completed 1024m pages are skipped.
# To rebuild only imagery from existing GSP binaries:
#   ./hex_backend/run_lil_bake.sh --texture-pages-only
#
# The production profiles use the sweep's effort=4. Local mini-bakes preserve
# the measured rapid-iteration path at effort=1: on the reference M1, a 4096px
# encode was ~8s instead of ~45s, with <2% size difference in the earlier q75
# effort benchmark. Block size and q90 remain profile-controlled and unchanged.

# Ensure we are in the project root
cd "$(dirname "$0")/.."

echo "--------------------------------------------------"
echo "🧪 Starting PowFinder MINI-BAKE (Stubai 12x12)"
echo "Mode: Rapid Iteration"
echo "S3 Sync: DISABLED (Local Only)"
echo "Time: $(date)"
echo "--------------------------------------------------"

# Run inside the pinned project environment. pipefail prevents a failed bake
# from being hidden by tee and falsely reported as complete.
pixi run python -u hex_backend/waffle_iron.py --release-profile beta-stubai --execution-profile mac-small --fast-texture-encode "$@" 2>&1 | tee "lil_bake_$(date +%Y%m%d_%H%M%S).log"

echo "--------------------------------------------------"
echo "✅ Mini-Bake Complete."
echo "Map is ready for local testing in frontend/app/."
echo "--------------------------------------------------"
