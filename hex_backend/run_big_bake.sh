#!/bin/bash
# @atlas: Orchestration script for an explicitly approved selected-Tirol bake.
# A full-Tirol bake is intentionally not a release mode.

# Ensure we are in the project root
cd "$(dirname "$0")/.."

echo "--------------------------------------------------"
echo "🚀 Starting PowFinder selected-Tirol bake & S3 sync"
echo "Bucket: wheatley.cloud"
echo "Time: $(date)"
echo "--------------------------------------------------"

# Check for AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ Error: AWS CLI not found. Please install it first."
    exit 1
fi

# The production boundary is a product decision. Keeping it external makes an
# accidental all-Tirol bake impossible while still making an approved run
# repeatable from the deploy environment.
: "${PRODUCTION_COVERAGE_BOUNDS:?Set min_x,min_y,max_x,max_y for the approved production boundary}"

# Run the bake
# We use stdbuf to ensure python output isn't buffered so we can tail the log
python3 -u hex_backend/waffle_iron.py \
  --release-profile production-selected-tirol \
  --coverage-bounds "$PRODUCTION_COVERAGE_BOUNDS" \
  2>&1 | tee bake_log_$(date +%Y%m%d_%H%M%S).log

echo "--------------------------------------------------"
echo "✅ Bake Complete."
echo "Check the log file for details."
echo "--------------------------------------------------"
