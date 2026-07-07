#!/bin/bash
# Cross-language Gosper math parity gate: JS (gosper_core.js) vs Python
# (coordinate_utility.py) must produce byte-identical canonical dumps.
set -e
cd "$(dirname "$0")/../.."
TMP=$(mktemp -d)
trap "rm -rf $TMP" EXIT

node tests/gosper/dump_js.mjs > "$TMP/js.json"
python3 tests/gosper/dump_py.py > "$TMP/py.json"

# Normalize through python json (key order, float formatting) then diff.
python3 - "$TMP/js.json" "$TMP/py.json" <<'EOF'
import json, sys
a = json.load(open(sys.argv[1]))
b = json.load(open(sys.argv[2]))
if a == b:
    print(f"PARITY OK — {len(a['offsets5'])//2} L5 offsets identical, "
          f"matrix {a['matrix']}, rot {a['rotPerLevelDeg']} deg")
else:
    for k in a:
        if a[k] != b.get(k):
            print(f"MISMATCH in '{k}':")
            print(f"  js: {str(a[k])[:200]}")
            print(f"  py: {str(b.get(k))[:200]}")
    sys.exit(1)
EOF
