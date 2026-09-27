#!/usr/bin/env python3
"""Lossless-in-practice compaction of a Hexagons tile manifest.

The production manifest is ~4.6 MB of JSON (≈477 KB on the wire) because every
one of the ~5,300 texture pages repeats four full URL strings and derivable
bounds, and every tile repeats its derivable world centre. This rewrites it as
column arrays (delta-coded integers, decimetre-quantised heights) and drops
everything the client can recompute. `frontend/app/manifest_codec.js` expands
it back into exactly the in-memory shape the viewer has always consumed.

Rules (enforced, never assumed):
  * a field is dropped only if the expander reproduces it for EVERY record;
  * heights are quantised to 0.1 m only if every value already is a multiple
    of 0.1 m within float noise (the baker rounds to 0.1 m);
  * any unknown per-record field is kept as an explicit column;
  * `--check` expands the result and compares it with the input.

Usage:
  compact_manifest.py IN.json OUT.json [--asset-base /hexagons/app/] [--check]

`--asset-base` prefixes the relative url_template fields (binary, texture
pages, bootstrap) so a shell published at another path (e.g. /hexagons/next/)
can reuse an existing release's immutable assets.
"""
from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

FORMAT = "hexagons-compact-manifest"
FORMAT_VERSION = 1
SQRT3 = math.sqrt(3.0)
UNIT_HEX_M = 6.4
TILE_LEVEL = 5


# --- Gosper math (mirror of frontend/app/gosper_core.js) --------------------
def mul_m(q: int, r: int) -> tuple[int, int]:
    return 2 * q - r, q + 3 * r


def lattice_to_world(yq: int, yr: int, unit_hex_m: float = UNIT_HEX_M) -> tuple[float, float]:
    q, r = yq, yr
    for _ in range(TILE_LEVEL):
        q, r = mul_m(q, r)
    return q * (SQRT3 / 2.0) * unit_hex_m, r * unit_hex_m + q * 0.5 * unit_hex_m


# --- helpers ----------------------------------------------------------------
def delta(values: list[int]) -> list[int]:
    out, prev = [], 0
    for value in values:
        out.append(value - prev)
        prev = value
    return out


def undelta(values: list[int]) -> list[int]:
    out, acc = [], 0
    for value in values:
        acc += value
        out.append(acc)
    return out


def is_decimetre(values: list) -> bool:
    return all(isinstance(v, (int, float)) and not isinstance(v, bool)
               and abs(v * 10 - round(v * 10)) < 1e-6 for v in values)


def is_int_column(values: list) -> bool:
    return all(isinstance(v, int) and not isinstance(v, bool) for v in values)


def fill(template: str, **values) -> str:
    out = template
    for key, value in values.items():
        out = out.replace("{" + key + "}", str(value))
    return out


def encode_column(values: list) -> dict:
    """Pick the tightest faithful encoding for one per-record column."""
    first = values[0]
    if all(json.dumps(v, sort_keys=True) == json.dumps(first, sort_keys=True) for v in values):
        return {"enc": "const", "value": first}
    if is_int_column(values):
        return {"enc": "delta", "data": delta(values)}
    if is_decimetre(values):
        return {"enc": "dm-delta", "data": delta([int(round(v * 10)) for v in values])}
    return {"enc": "raw", "data": values}


def decode_column(column: dict, count: int) -> list:
    enc = column["enc"]
    if enc == "const":
        return [json.loads(json.dumps(column["value"])) for _ in range(count)]
    if enc == "delta":
        return undelta(column["data"])
    if enc == "dm-delta":
        return [round(v / 10, 1) for v in undelta(column["data"])]
    if enc == "raw":
        return list(column["data"])
    raise ValueError(f"unknown column encoding {enc!r}")


# --- compaction -------------------------------------------------------------
TILE_DERIVED = ("x", "y")
PAGE_DERIVED = ("key", "min_x", "min_y", "max_x", "max_y", "urls")


def page_urls(contract: dict, page_x: int, page_y: int) -> dict:
    urls = {}
    template = contract.get("url_template") or ""
    for tier in contract.get("tiers", []):
        urls[tier["name"]] = fill(template, tier=tier["name"], page_x=page_x, page_y=page_y)
    bootstrap = contract.get("bootstrap")
    if bootstrap and bootstrap.get("url_template"):
        urls["bootstrap"] = fill(bootstrap["url_template"], page_x=page_x, page_y=page_y)
    return urls


def compact(manifest: dict) -> dict:
    tiles = manifest.get("tiles", [])
    contract = manifest.get("texture_pages", {})
    pages = contract.get("pages", [])
    unit = manifest.get("unit_hex_m", UNIT_HEX_M)
    size = contract.get("grid", {}).get("page_size_m")

    # Tiles: prove x/y derivable, then column-encode everything else in order.
    tile_keys: list[str] = []
    for tile in tiles:
        for key in tile:
            if key not in tile_keys:
                tile_keys.append(key)
    derive_xy = all(
        abs(lattice_to_world(t["yq"], t["yr"], unit)[0] - t["x"]) <= 0.0051
        and abs(lattice_to_world(t["yq"], t["yr"], unit)[1] - t["y"]) <= 0.0051
        for t in tiles
    )
    tile_columns = {}
    for key in tile_keys:
        if derive_xy and key in TILE_DERIVED:
            continue
        values = [t.get(key) for t in tiles]
        if any(v is None for v in values):
            raise ValueError(f"tile field {key!r} missing on some tiles")
        tile_columns[key] = encode_column(values)

    # Pages: prove the derivable fields, then column-encode the rest.
    page_keys: list[str] = []
    for page in pages:
        for key in page:
            if key not in page_keys:
                page_keys.append(key)
    derivable = {}
    for key in PAGE_DERIVED:
        ok = True
        for page in pages:
            px, py = page["page_x"], page["page_y"]
            if key == "key":
                ok = page.get("key") == f"{px}_{py}"
            elif key == "urls":
                ok = page.get("urls") == page_urls(contract, px, py)
            elif size is None:
                ok = False
            else:
                expected = {"min_x": px * size, "min_y": py * size,
                            "max_x": (px + 1) * size, "max_y": (py + 1) * size}[key]
                ok = page.get(key) == expected
            if not ok:
                break
        derivable[key] = ok
    render_max_is_hmax = bool(pages) and all(p.get("renderMax") == p.get("hMax") for p in pages)
    page_columns = {}
    for key in page_keys:
        if derivable.get(key):
            continue
        if key == "renderMax" and render_max_is_hmax:
            continue
        values = [p.get(key) for p in pages]
        if any(v is None for v in values):
            raise ValueError(f"page field {key!r} missing on some pages")
        if key == "renderMin" and not is_decimetre(values):
            # The baker computes renderMin = hMin - skirt in float; the stored
            # values carry binary noise around a 0.1 m grid. Keep 0.1 m.
            rounded = [round(v, 1) for v in values]
            if max(abs(a - b) for a, b in zip(values, rounded)) < 1e-6:
                values = rounded
        page_columns[key] = encode_column(values)

    out = {k: v for k, v in manifest.items() if k not in ("tiles", "texture_pages")}
    out = {"format": FORMAT, "format_version": FORMAT_VERSION, **out}
    contract_out = {k: v for k, v in contract.items() if k != "pages"}
    out["texture_pages"] = contract_out
    out["tiles_compact"] = {
        "count": len(tiles), "keys": tile_keys,
        "derived": [k for k in TILE_DERIVED if derive_xy and k in tile_keys],
        "columns": tile_columns,
    }
    out["pages_compact"] = {
        "count": len(pages), "keys": page_keys,
        "derived": [k for k in PAGE_DERIVED if derivable.get(k) and k in page_keys]
                   + (["renderMax"] if render_max_is_hmax and "renderMax" in page_keys else []),
        "columns": page_columns,
    }
    return out


def expand(compact_manifest: dict) -> dict:
    if compact_manifest.get("format") != FORMAT:
        return compact_manifest
    if compact_manifest.get("format_version") != FORMAT_VERSION:
        raise ValueError("unsupported compact manifest version")
    base = {k: v for k, v in compact_manifest.items()
            if k not in ("format", "format_version", "tiles_compact", "pages_compact", "texture_pages")}
    unit = base.get("unit_hex_m", UNIT_HEX_M)
    tc = compact_manifest["tiles_compact"]
    columns = {k: decode_column(c, tc["count"]) for k, c in tc["columns"].items()}
    tiles = []
    for i in range(tc["count"]):
        tile = {}
        for key in tc["keys"]:
            if key in ("x", "y") and key in tc["derived"]:
                x, y = lattice_to_world(columns["yq"][i], columns["yr"][i], unit)
                tile[key] = round(x if key == "x" else y, 2)
            else:
                tile[key] = columns[key][i]
        tiles.append(tile)
    contract = dict(compact_manifest["texture_pages"])
    pc = compact_manifest["pages_compact"]
    size = contract.get("grid", {}).get("page_size_m")
    pcols = {k: decode_column(c, pc["count"]) for k, c in pc["columns"].items()}
    pages = []
    for i in range(pc["count"]):
        px, py = pcols["page_x"][i], pcols["page_y"][i]
        page = {}
        for key in pc["keys"]:
            if key not in pc["derived"]:
                page[key] = pcols[key][i]
            elif key == "key":
                page[key] = f"{px}_{py}"
            elif key == "urls":
                page[key] = page_urls(contract, px, py)
            elif key == "renderMax":
                page[key] = pcols["hMax"][i]
            else:
                page[key] = {"min_x": px * size, "min_y": py * size,
                             "max_x": (px + 1) * size, "max_y": (py + 1) * size}[key]
        pages.append(page)
    contract["pages"] = pages
    return {**base, "texture_pages": contract, "tiles": tiles}


def rebase_urls(manifest: dict, asset_base: str) -> None:
    base = asset_base if asset_base.endswith("/") else asset_base + "/"
    binary = manifest.get("binary")
    if binary and binary.get("url_template") and not binary["url_template"].startswith(("/", "http")):
        binary["url_template"] = base + binary["url_template"]
    contract = manifest.get("texture_pages", {})
    if contract.get("url_template") and not contract["url_template"].startswith(("/", "http")):
        contract["url_template"] = base + contract["url_template"]
    boot = contract.get("bootstrap")
    if boot and boot.get("url_template") and not boot["url_template"].startswith(("/", "http")):
        boot["url_template"] = base + boot["url_template"]
    for page in contract.get("pages", []):
        page["urls"] = {k: (v if v.startswith(("/", "http")) else base + v) for k, v in page.get("urls", {}).items()}


def equivalent(a, b, path="") -> list[str]:
    diffs: list[str] = []
    if isinstance(a, dict) and isinstance(b, dict):
        for key in set(a) | set(b):
            if key not in a or key not in b:
                diffs.append(f"{path}.{key}: missing on one side")
                continue
            diffs += equivalent(a[key], b[key], f"{path}.{key}")
    elif isinstance(a, list) and isinstance(b, list):
        if len(a) != len(b):
            return [f"{path}: length {len(a)} != {len(b)}"]
        for i, (x, y) in enumerate(zip(a, b)):
            diffs += equivalent(x, y, f"{path}[{i}]")
            if len(diffs) > 20:
                break
    elif isinstance(a, float) or isinstance(b, float):
        if not (isinstance(a, (int, float)) and isinstance(b, (int, float))) or abs(a - b) > 0.0051:
            diffs.append(f"{path}: {a!r} != {b!r}")
    elif a != b:
        diffs.append(f"{path}: {a!r} != {b!r}")
    return diffs


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("source", type=Path)
    parser.add_argument("dest", type=Path)
    parser.add_argument("--asset-base", default=None)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    manifest = json.loads(args.source.read_text())
    if args.asset_base:
        rebase_urls(manifest, args.asset_base)
    result = compact(manifest)
    payload = json.dumps(result, separators=(",", ":"))
    args.dest.write_text(payload)
    print(f"{args.source} ({args.source.stat().st_size:,} B) -> {args.dest} ({len(payload):,} B)")
    if args.check:
        diffs = equivalent(manifest, expand(json.loads(payload)))
        if diffs:
            print("EXPANSION MISMATCH:\n  " + "\n  ".join(diffs[:20]), file=sys.stderr)
            return 1
        print("check: expansion reproduces the source manifest")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
