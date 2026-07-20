import json
import os
import struct
import sys
import tempfile
import unittest
from pathlib import Path

import numpy as np
import rasterio
from rasterio.transform import from_origin

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "hex_backend"
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(ROOT / "scripts"))

import bake_inventory
import bake_preflight
import big_bake
import coordinate_utility
import execution_profiles
import generate_manifest
import progressive_upload
import publish_site
import release_publish
import texture_page_grid
import waffle_iron
from aerial_downloader import restore_corpus


def inventory_fixture(root: Path):
    return {
        "schema_version": bake_inventory.SCHEMA_VERSION,
        "run_id": "run-test",
        "release_id": "run-test",
        "git_commit": "a" * 40,
        "execution_profile": execution_profiles.execution_profile("rechner-big").descriptor(),
        "release_profile": "production-tirol",
        "output_root": str(root.resolve()),
        "sources": {"aerial_files": [], "dem": {}},
        "geometry_recipe": {"version": waffle_iron.BAKER_VERSION, "format": "GSP3"},
        "texture_recipe": {
            "version": waffle_iron.texture_page_cache_version(False, "production", None),
            "contract_version": "4.1.0",
            "encoding_profile": "production",
            "encoding_effort": 4,
            "diagnostic_tattoos": False,
            "bootstrap_px": 32,
            "tiers": {"low": 128, "medium": 256, "high": 4096},
        },
        "geometry": [{
            "yq": 1, "yr": 2, "status": "pending", "attempts": 0,
            "uploaded": False, "last_error": None, "timings": {},
        }],
        "texture_pages": [],
        "progress": {},
    }


def write_header(path: Path, yq: int, yr: int):
    center_q, center_r = coordinate_utility.gosper_lattice_to_center(yq, yr)
    path.write_bytes(generate_manifest.GSP_HEADER.pack(
        b"GSP3", 3, coordinate_utility.GOSPER_TILE_LEVEL,
        center_q, center_r, yq, yr,
        1500.0, 1400.0, 1600.0,
        10, 20, 128, 128, 1, 0,
    ))


class ExecutionProfileTests(unittest.TestCase):
    def test_mac_and_rechner_profiles_preserve_distinct_resource_paths(self):
        mac = execution_profiles.execution_profile("mac-small")
        rechner = execution_profiles.execution_profile("rechner-big")
        self.assertEqual(mac.cuda_policy, "disabled")
        self.assertEqual(mac.texture_workers, 1)
        self.assertFalse(mac.require_full_corpus)
        self.assertEqual(rechner.texture_workers, 3)
        self.assertGreater(rechner.geometry_workers, mac.geometry_workers)
        self.assertEqual(rechner.ram_limit_gib + rechner.reserve_ram_gib, 60)
        self.assertTrue(rechner.require_full_corpus)


class InventoryTests(unittest.TestCase):
    def test_inventory_round_trip_and_progress_are_durable(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            payload = inventory_fixture(root)
            bake_inventory.refresh_progress(payload)
            path = root / "inventory.json"
            bake_inventory.write_json_atomic(path, payload)
            loaded = bake_inventory.load_inventory(path)
            self.assertEqual(loaded["progress"]["geometry_pending"], 1)
            bake_inventory.mark_unit(
                loaded, "geometry", (1, 2), "complete", timings={"total": 1.25}
            )
            bake_inventory.write_json_atomic(path, loaded)
            resumed = bake_inventory.load_inventory(path)
            self.assertEqual(resumed["progress"]["geometry_complete"], 1)
            self.assertEqual(resumed["geometry"][0]["timings"]["total"], 1.25)
            self.assertFalse(any(item.name.endswith(".tmp") for item in root.iterdir()))

    def test_exact_dem_empty_geometry_is_durably_excluded(self):
        payload = inventory_fixture(Path("/tmp/inventory-test"))
        bake_inventory.refresh_progress(payload)
        bake_inventory.exclude_empty_geometry(
            payload, (1, 2), reason="exact DEM unit sampling contains no valid samples"
        )
        self.assertEqual(payload["geometry"], [])
        self.assertEqual(payload["progress"]["geometry_total"], 0)
        self.assertEqual(payload["excluded_geometry"][0]["status"], "excluded")

    def test_exact_page_replacement_preserves_only_current_inventory_keys(self):
        with tempfile.TemporaryDirectory() as temp:
            payload = inventory_fixture(Path(temp))
            payload["texture_pages"] = [{
                "page_x": 4, "page_y": 5, "status": "complete", "attempts": 1,
                "uploaded": True, "last_error": None, "timings": {"total": 2.0},
            }, {
                "page_x": 99, "page_y": 99, "status": "complete", "attempts": 1,
                "uploaded": True, "last_error": None, "timings": {},
            }]
            bake_inventory.replace_texture_pages(
                payload, [texture_page_grid.TexturePage(4, 5), texture_page_grid.TexturePage(6, 7)]
            )
            self.assertEqual(
                {(item["page_x"], item["page_y"]) for item in payload["texture_pages"]},
                {(4, 5), (6, 7)},
            )
            kept = next(item for item in payload["texture_pages"] if item["page_x"] == 4)
            added = next(item for item in payload["texture_pages"] if item["page_x"] == 6)
            self.assertEqual(kept["status"], "complete")
            self.assertEqual(added["status"], "pending")

    def test_production_runtime_refuses_fast_or_tattooed_recipe(self):
        with tempfile.TemporaryDirectory() as temp:
            payload = inventory_fixture(Path(temp))
            payload["sources"]["aerial"] = {
                "valid_count": bake_preflight.EXPECTED_FULL_CORPUS_FILES,
                "total_bytes": bake_preflight.EXPECTED_FULL_CORPUS_BYTES,
            }
            big_bake.validate_runtime_inventory(payload)
            payload["texture_recipe"]["encoding_effort"] = 1
            with self.assertRaisesRegex(ValueError, "effort-4"):
                big_bake.validate_runtime_inventory(payload)
            payload["texture_recipe"]["encoding_effort"] = 4
            payload["texture_recipe"]["diagnostic_tattoos"] = True
            with self.assertRaisesRegex(ValueError, "diagnostic tattoos"):
                big_bake.validate_runtime_inventory(payload)


class IsolationTests(unittest.TestCase):
    def test_stale_stubai_binary_cannot_enter_explicit_inventory(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            write_header(root / "gosper_1_2.bin", 1, 2)
            write_header(root / "gosper_271_-237.bin", 271, -237)
            with self.assertRaisesRegex(ValueError, "unexpected GSP"):
                generate_manifest.scan_binary_tiles(
                    root, expected_tiles={(1, 2)}, reject_unexpected=True
                )

    def test_missing_inventory_binary_refuses_manifest_input(self):
        with tempfile.TemporaryDirectory() as temp:
            with self.assertRaisesRegex(ValueError, "missing or invalid"):
                generate_manifest.scan_binary_tiles(
                    temp, expected_tiles={(1, 2)}, reject_unexpected=True
                )

    def test_old_tattoo_and_fast_effort_markers_never_satisfy_production(self):
        page = texture_page_grid.TexturePage(4, 5)
        production = waffle_iron.texture_page_cache_version(False, "production", None)
        tattoo = waffle_iron.texture_page_cache_version(True, "production", None)
        fast = waffle_iron.texture_page_cache_version(False, "production", 1)
        with tempfile.TemporaryDirectory() as temp:
            for path in waffle_iron.texture_page_asset_paths(page, temp).values():
                Path(path).parent.mkdir(parents=True, exist_ok=True)
                Path(path).write_bytes(b"asset")
            waffle_iron.write_texture_page_padding_stats(
                waffle_iron.texture_page_padding_stats_path(page, temp),
                {"padded_pixels": 0, "padded_area_m2": 0.0, "max_distance_m": 0.0},
            )
            marker = waffle_iron.texture_page_recipe_marker_path(page, temp)
            for stale in (tattoo, fast):
                waffle_iron.write_texture_recipe_marker(marker, stale)
                self.assertFalse(waffle_iron.texture_page_is_current(page, production, temp))
            waffle_iron.write_texture_recipe_marker(marker, production)
            self.assertTrue(waffle_iron.texture_page_is_current(page, production, temp))
            Path(waffle_iron.texture_page_asset_paths(page, temp)["high"]).unlink()
            self.assertFalse(waffle_iron.texture_page_is_current(page, production, temp))


class ProgressiveUploadTests(unittest.TestCase):
    def test_durable_spool_uploads_idempotently_and_records_completion(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            asset = root / "texture_4_5.webp"
            asset.write_bytes(b"RIFFxxxxWEBPpayload")
            store = release_publish.LocalStore(root / "s3")
            spool = progressive_upload.ProgressiveUploadSpool(
                root / "spool", store, "release-test", workers=2
            )
            spool.spool("texture_pages", (4, 5), [{
                "local": str(asset),
                "logical": "aerial_pages/bootstrap/texture_4_5.webp",
            }])
            spool.start()
            spool.finish_and_wait()
            self.assertEqual(spool.status(), {
                "pending": 0, "running": 0, "completed": 1, "failed": 0,
            })
            key = "releases/release-test/aerial_pages/bootstrap/texture_4_5.webp"
            self.assertEqual(store.head(key)["ContentType"], "image/webp")
            completed = spool.completed_tasks()[0]
            self.assertEqual(completed["uploaded_bytes"], asset.stat().st_size)

            resumed = progressive_upload.ProgressiveUploadSpool(
                root / "spool", store, "release-test", workers=1
            )
            resumed.spool("texture_pages", (4, 5), [{
                "local": str(asset), "logical": completed["assets"][0]["logical"],
            }])
            self.assertEqual(resumed.status()["pending"], 0)

    def test_explicit_resume_requeues_durable_upload_failures(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            spool = progressive_upload.ProgressiveUploadSpool(
                root / "spool", release_publish.LocalStore(root / "s3"),
                "release-test", workers=1,
            )
            task = {
                "schema_version": 1, "task_id": "geometry-1-2",
                "collection": "geometry", "key": [1, 2],
                "release_id": "release-test", "assets": [],
                "attempts": 3, "last_error": "transient",
            }
            bake_inventory.write_json_atomic(
                spool.failed / "geometry-1-2.json", task
            )
            self.assertEqual(spool.retry_failed(), 1)
            requeued = json.loads((spool.pending / "geometry-1-2.json").read_text())
            self.assertEqual(requeued["attempts"], 0)
            self.assertIsNone(requeued["last_error"])

    def test_public_shell_content_types_and_cache_policies(self):
        content_type, cache, encoding = publish_site.metadata(Path("index.html"))
        self.assertEqual((content_type, cache, encoding), (
            "text/html", publish_site.REVALIDATE, None,
        ))
        content_type, cache, encoding = publish_site.metadata(Path("main.012345abcdef.js.br"))
        self.assertEqual((content_type, cache, encoding), (
            "text/javascript", publish_site.IMMUTABLE, "br",
        ))
        self.assertEqual(publish_site.metadata(Path("image.webp"))[0], "image/webp")
        self.assertEqual(publish_site.metadata(Path("page.ktx2"))[0], "image/ktx2")


class PreflightTests(unittest.TestCase):
    def _write_tif(self, path: Path, *, crs="EPSG:31254"):
        data = np.zeros((3, 8, 8), dtype=np.uint8)
        with rasterio.open(
            path, "w", driver="GTiff", width=8, height=8, count=3,
            dtype="uint8", crs=crs, transform=from_origin(1000, 2000, 0.2, 0.2),
        ) as target:
            target.write(data)

    def test_source_validation_reports_corruption_metadata_and_representative_hash(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            good = root / "good.tif"
            zero = root / "zero.tif"
            self._write_tif(good)
            zero.touch()
            summary, valid, coverage = bake_preflight.inspect_aerial_sources([good, zero])
            self.assertEqual(summary["valid_count"], 1)
            self.assertEqual(summary["invalid_count"], 1)
            self.assertEqual(summary["zero_byte"], [str(zero)])
            self.assertEqual(valid[0]["crs"], "EPSG:31254")
            self.assertIn("good.tif", summary["representative_hashes"])
            self.assertIsNotNone(coverage)

    def test_output_estimate_scales_with_inventory_not_a_generic_warning(self):
        small = bake_preflight.estimate_output(5, 8, 1, {"width": 100, "height": 100})
        big = bake_preflight.estimate_output(500, 800, 3, {"width": 100, "height": 100})
        self.assertGreater(big["final_bytes"], small["final_bytes"] * 50)
        self.assertGreater(big["temporary_peak_bytes"], small["temporary_peak_bytes"])

    def test_audited_source_inventory_has_exact_identity(self):
        inventory_path = BACKEND / "aerial_source_inventory.tsv"
        known = bake_preflight.load_known_source_inventory(inventory_path)
        restored = restore_corpus.load_inventory(inventory_path)
        self.assertEqual(len(known), bake_preflight.EXPECTED_FULL_CORPUS_FILES)
        self.assertEqual(
            sum(item["bytes"] for item in known.values()),
            bake_preflight.EXPECTED_FULL_CORPUS_BYTES,
        )
        self.assertEqual(
            [(item.name, item.size, item.sha256) for item in restored],
            [
                (name, item["bytes"], item["sha256"])
                for name, item in known.items()
            ],
        )

    def test_source_restorer_validates_seed_before_atomic_publish(self):
        payload = b"audited source payload"
        import hashlib

        asset = restore_corpus.SourceAsset(
            "dop_0000-00_2023.tif", len(payload), hashlib.sha256(payload).hexdigest()
        )
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            seed = root / "seed"
            destination = root / "destination"
            seed.mkdir()
            destination.mkdir()
            (seed / asset.name).write_bytes(payload)
            target = destination / asset.name
            self.assertTrue(restore_corpus.seed_asset(asset, target, [seed]))
            self.assertTrue(restore_corpus.valid_asset(target, asset))
            self.assertFalse(any(path.name.endswith(".tmp") for path in destination.iterdir()))

    def test_source_restore_resume_counts_existing_asset_once(self):
        payload = b"already complete"
        import hashlib

        asset = restore_corpus.SourceAsset(
            "dop_0000-00_2023.tif", len(payload), hashlib.sha256(payload).hexdigest()
        )
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            destination = root / "destination"
            destination.mkdir()
            (destination / asset.name).write_bytes(payload)
            outcome = restore_corpus.restore_one(
                asset,
                destination_dir=destination,
                seeds=[],
                base_url="https://unused.invalid",
                retries=1,
                timeout=1,
            )
            self.assertEqual(outcome, "existing")
            state = restore_corpus.RestoreState(root / "report.json", 1, len(payload))
            state.record(asset, outcome)
            state.finish()
            snapshot = state.snapshot()
            self.assertEqual(snapshot["verified_files"], 1)
            self.assertEqual(snapshot["existing_files"], 1)
            self.assertTrue(snapshot["completed"])


if __name__ == "__main__":
    unittest.main()
