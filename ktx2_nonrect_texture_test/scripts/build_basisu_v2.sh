#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
test_root="$(cd "$script_dir/.." && pwd)"

ref="${BASISU_REF:-v2_1_0r}"
src_dir="${BASISU_V2_SRC:-$test_root/.basisu_v2/source}"
build_dir="$src_dir/build"

if [[ ! -d "$src_dir/.git" ]]; then
    mkdir -p "$(dirname "$src_dir")"
    git clone --depth 1 --branch "$ref" https://github.com/BinomialLLC/basis_universal.git "$src_dir"
else
    git -C "$src_dir" fetch --tags --depth 1 origin "$ref"
    git -C "$src_dir" checkout --detach FETCH_HEAD
fi

cmake -S "$src_dir" -B "$build_dir" -DCMAKE_BUILD_TYPE=Release
cmake --build "$build_dir" --config Release --parallel

basisu_bin="$src_dir/bin/basisu"
if [[ ! -x "$basisu_bin" ]]; then
    basisu_bin="$(find "$src_dir" -type f -name basisu -perm -111 | head -1)"
fi

if [[ -z "$basisu_bin" || ! -x "$basisu_bin" ]]; then
    echo "Built Basis Universal, but could not find an executable basisu binary." >&2
    exit 1
fi

echo "Built: $basisu_bin"
echo "Try: BASISU=$basisu_bin pixi run texture-stack"
