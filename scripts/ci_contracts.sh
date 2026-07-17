#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p artifacts/ci
echo '== production build =='
(cd frontend/app && npm ci && npm run build) | tee artifacts/ci/build.log
echo '== frontend unit contracts =='
(cd frontend/app && npm test) | tee artifacts/ci/frontend-unit.log
echo '== Gosper JavaScript contracts =='
for test in tests/gosper/test_*.mjs; do node --experimental-vm-modules "$test"; done | tee artifacts/ci/gosper-js.log
echo '== Gosper Python contracts =='
for test in tests/gosper/test_*.py; do PYTHONPATH="$PWD${PYTHONPATH:+:$PYTHONPATH}" python "$test"; done | tee artifacts/ci/gosper-python.log
echo '== Gosper JS/Python parity =='
bash tests/gosper/run_parity.sh | tee artifacts/ci/gosper-parity.log
