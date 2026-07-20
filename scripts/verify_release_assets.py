#!/usr/bin/env python3
"""Verify every local asset referenced by a release manifest without publishing it.

This deliberately shares the publisher's asset enumeration and diagnostic-tattoo
policy.  It is suitable for the asset-backed release gate: it only reads local
files, emits a machine-readable report, and never contacts S3 or copies assets.
"""
from __future__ import annotations

import argparse
from io import BytesIO
import json
import sys
from pathlib import Path
from typing import Any

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "hex_backend"
sys.path.insert(0, str(BACKEND))

from texture_contract import TEXTURE_BOOTSTRAP_SIZE  # noqa: E402

from release_publish import (
    Asset,
    decode_sample,
    referenced_assets,
    reject_diagnostics,
    release_id,
    sha256_bytes,
)


def verify_assets(manifest_path: Path, app_root: Path, *, allow_beta_diagnostics: bool = False) -> dict[str, Any]:
    """Return a complete local-asset verification report.

    All referenced files are inspected rather than using the publisher's
    upload-time representative sample.  This makes a corrupt page fail before
    a slow browser run starts.
    """
    report: dict[str, Any] = {
        "manifest": str(manifest_path),
        "app_root": str(app_root),
        "ok": False,
        "asset_count": 0,
        "total_bytes": 0,
        "release_id": None,
        "by_extension": {},
        "errors": [],
    }
    try:
        manifest = json.loads(manifest_path.read_text())
        tiles = manifest.get("tiles")
        contract = manifest.get("texture_pages")
        if not isinstance(tiles, list) or not tiles:
            raise ValueError("manifest must contain at least one terrain tile")
        if not isinstance(contract, dict):
            raise ValueError("manifest must contain a texture_pages contract")
        bootstrap = contract.get("bootstrap")
        if not isinstance(bootstrap, dict) or bootstrap.get("container") != "webp":
            raise ValueError("texture_pages must declare the WebP bootstrap tier")
        bootstrap_size_px = bootstrap.get("size_px")
        if bootstrap_size_px != TEXTURE_BOOTSTRAP_SIZE:
            raise ValueError(
                "texture_pages WebP bootstrap tier must declare "
                f"size_px={TEXTURE_BOOTSTRAP_SIZE}"
            )
        tier_names = [tier.get("name") for tier in contract.get("tiers", []) if isinstance(tier, dict)]
        if tier_names != ["low", "medium", "high"]:
            raise ValueError("texture_pages tiers must be exactly low, medium, high")
        if not isinstance(contract.get("pages"), list) or not contract["pages"]:
            raise ValueError("texture_pages must contain at least one page")
        # Intentionally use the exact publication policy.  A caller must make
        # the beta escape hatch explicit; the manifest must still be exactly
        # beta-stubai / stubai-small-square.
        reject_diagnostics(manifest, allow_beta_diagnostics=allow_beta_diagnostics)
        assets = referenced_assets(manifest, app_root)
        logical = [asset.logical for asset in assets]
        if not assets:
            raise ValueError("manifest references no release assets")
        if len(logical) != len(set(logical)):
            raise ValueError("manifest contains duplicate release asset references")
        bootstrap_dimensions = {
            f"aerial_pages/bootstrap/texture_{page['page_x']}_{page['page_y']}.webp": (
                bootstrap_size_px,
                bootstrap_size_px,
            )
            for page in contract["pages"]
        }
    except Exception as exc:  # keep a useful report even for malformed input
        report["errors"].append(str(exc))
        return report

    report["asset_count"] = len(assets)
    digests: dict[str, str] = {}
    for asset in assets:
        _verify_asset(
            asset,
            report,
            digests,
            expected_webp_size=bootstrap_dimensions.get(asset.logical),
        )
    if not report["errors"]:
        # This is the same content-addressed identity the atomic S3 publisher
        # will assign to this manifest and exact referenced asset set.
        report["release_id"] = release_id(manifest_path, assets, digests)
    report["ok"] = not report["errors"]
    return report


def _verify_asset(
    asset: Asset,
    report: dict[str, Any],
    digests: dict[str, str],
    *,
    expected_webp_size: tuple[int, int] | None = None,
) -> None:
    if not asset.local.is_file():
        report["errors"].append(f"missing: {asset.logical} ({asset.local})")
        return
    try:
        payload = asset.local.read_bytes()
        # decode_sample checks the format magic for GSP/KTX2/WebP.  Calling it
        # per asset is intentional here; release_publish samples once/type only
        # because it verifies immutable upload transport separately.
        decode_sample(asset, payload)
        if expected_webp_size is not None:
            with Image.open(BytesIO(payload)) as image:
                actual_size = image.size
                image.verify()
            if actual_size != expected_webp_size:
                expected = f"{expected_webp_size[0]}x{expected_webp_size[1]}"
                actual = f"{actual_size[0]}x{actual_size[1]}"
                raise ValueError(f"{asset.logical}: must be {expected}, got {actual}")
    except Exception as exc:
        report["errors"].append(str(exc))
        return
    size = len(payload)
    digests[asset.logical] = sha256_bytes(payload)
    suffix = asset.local.suffix.lower() or "<none>"
    report["total_bytes"] += size
    summary = report["by_extension"].setdefault(suffix, {"count": 0, "bytes": 0})
    summary["count"] += 1
    summary["bytes"] += size


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, default=Path("frontend/app/tile_manifest.json"))
    parser.add_argument("--app-root", type=Path, default=Path("frontend/app"))
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--allow-beta-diagnostics", action="store_true",
                        help="allow tattoos only for the explicit beta-stubai manifest")
    args = parser.parse_args()
    report = verify_assets(args.manifest, args.app_root,
                           allow_beta_diagnostics=args.allow_beta_diagnostics)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")
    if not report["ok"]:
        print(f"release asset verification failed; see {args.output}", file=sys.stderr)
        raise SystemExit(2)
    print(f"release asset verification passed: {report['asset_count']} assets, {report['total_bytes']} bytes")


if __name__ == "__main__":
    main()
