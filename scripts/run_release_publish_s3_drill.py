#!/usr/bin/env python3
"""Exercise atomic release publication in an isolated, disposable S3 prefix."""
from __future__ import annotations
import argparse, hashlib, importlib.util, json, os, subprocess, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("release_publish", ROOT / "scripts" / "release_publish.py")
release_publish = importlib.util.module_from_spec(SPEC); sys.modules[SPEC.name] = release_publish; SPEC.loader.exec_module(release_publish)

def write(path: Path, data: bytes): path.parent.mkdir(parents=True, exist_ok=True); path.write_bytes(data)
def digest(data: bytes) -> str: return hashlib.sha256(data).hexdigest()
def delete_prefix(bucket: str, prefix: str) -> None:
    subprocess.run(["aws", "s3", "rm", f"s3://{bucket}/{prefix.strip('/')}/", "--recursive", "--only-show-errors"], check=True)

def fixture(root: Path) -> tuple[Path, Path]:
    app = root / "app"; x, y = 1, 2
    write(app / "tiles_bin" / "gosper_1_2.bin", b"GSP3\x03\x00minimal-drill")
    write(app / "aerial_pages" / "bootstrap" / f"texture_{x}_{y}.webp", b"RIFF\x04\x00\x00\x00WEBP")
    for tier in ("low", "medium", "high"):
        write(app / "aerial_pages" / tier / f"texture_{x}_{y}.ktx2", b"\xabKTX 20\xbb\r\n\x1a\nminimal-drill")
    manifest = {"release": {"mode":"production", "profile":"drill", "coverage_profile":"drill"},
        "binary": {"default_format":"GSP3", "default_version":3},
        "tiles": [{"yq":1,"yr":2}], "texture_pages": {"diagnostic_tattoos":False,
        "bootstrap": {"container":"webp"}, "tiers":[{"name":"low"},{"name":"medium"},{"name":"high"}],
        "pages":[{"page_x":x,"page_y":y}]}}
    manifest_path = app / "tile_manifest.json"; manifest_path.write_text(json.dumps(manifest))
    return app, manifest_path

def tattoo_checks() -> dict:
    real = json.loads((ROOT / "frontend/app/tile_manifest.json").read_text())
    accepted = rejected_without_flag = rejected_production_copy = False
    try: release_publish.reject_diagnostics(real, allow_beta_diagnostics=True); accepted = True
    except ValueError: pass
    try: release_publish.reject_diagnostics(real, allow_beta_diagnostics=False)
    except ValueError: rejected_without_flag = True
    production = json.loads(json.dumps(real)); production["release"]["mode"] = "production"; production["release"]["profile"] = "production"
    try: release_publish.reject_diagnostics(production, allow_beta_diagnostics=True)
    except ValueError: rejected_production_copy = True
    if not all((accepted, rejected_without_flag, rejected_production_copy)): raise RuntimeError("tattoo policy drill failed")
    return {"real_beta_stubai_accepted_with_explicit_flag":accepted, "real_beta_stubai_rejected_without_flag":rejected_without_flag, "production_mode_copy_rejected_with_flag":rejected_production_copy}

def main():
    parser = argparse.ArgumentParser(); parser.add_argument("--bucket", default="wheatley.cloud"); parser.add_argument("--region", default="eu-central-2"); parser.add_argument("--prefix", required=True); parser.add_argument("--evidence", type=Path, required=True)
    args = parser.parse_args(); os.environ["AWS_DEFAULT_REGION"] = args.region; prefix = args.prefix.strip("/")
    if not prefix.startswith("hexagons/beta-drills/"): parser.error("prefix must stay below hexagons/beta-drills/")
    store = release_publish.AwsStore(args.bucket, prefix); old = b'{"sentinel":"old-live-pointer"}'
    evidence = {"bucket":args.bucket,"prefix":prefix,"live_beta_pointer_touched":False,"tattoo_policy":tattoo_checks()}
    try:
        with tempfile.TemporaryDirectory(prefix="aa1-release-drill-") as temp:
            app, manifest = fixture(Path(temp)); sentinel = Path(temp) / "old.json"; sentinel.write_bytes(old)
            store.put(sentinel, "tile_manifest.json", cache_control=release_publish.NO_CACHE, content_type="application/json")
            before = store.get("tile_manifest.json")
            try: release_publish.publish(manifest, app, store, interrupt_after=1)
            except RuntimeError as exc:
                if str(exc) != "simulated interrupted upload": raise
            after_interrupt = store.get("tile_manifest.json")
            if before != after_interrupt: raise RuntimeError("interrupted publish altered mutable pointer")
            release = release_publish.publish(manifest, app, store)
            pointer = store.get("tile_manifest.json"); pointer_data = json.loads(pointer)
            if pointer == before or pointer_data["release"]["asset_release"] != release: raise RuntimeError("publish did not atomically flip pointer")
            assets = release_publish.referenced_assets(json.loads(manifest.read_text()), app)
            verified = []
            for asset in assets:
                key = f"releases/{release}/{asset.logical}"; release_publish.verify(store, key, asset, release_publish.IMMUTABLE, decode=True)
                verified.append({"key":key,"sha256":release_publish.sha256(asset.local),"content_type":release_publish.content_type(asset.local),"cache_control":release_publish.IMMUTABLE,"decode_sample":True})
            staged = f"releases/{release}/tile_manifest.json"; head = store.head(staged)
            evidence.update({"interrupted_publish":{"uploads_before_interrupt":1,"mutable_pointer_sha256_before":digest(before),"mutable_pointer_sha256_after":digest(after_interrupt),"byte_identical":before == after_interrupt},"completed_publish":{"release":release,"pointer_sha256":digest(pointer),"pointer_flipped":pointer != before,"pointer_cache_control":store.head("tile_manifest.json")["CacheControl"],"staged_manifest_cache_control":head["CacheControl"],"assets_verified":verified}})
        evidence["cleanup"] = "temporary prefix removed"
    finally:
        delete_prefix(args.bucket, prefix)
    args.evidence.parent.mkdir(parents=True, exist_ok=True); args.evidence.write_text(json.dumps(evidence, indent=2, sort_keys=True) + "\n")
    print(args.evidence)
if __name__ == "__main__": main()
