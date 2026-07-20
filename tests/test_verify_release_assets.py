import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
# The verifier imports its publisher sibling by module name.
sys.path.insert(0, str(ROOT / "scripts"))
SPEC = importlib.util.spec_from_file_location("verify_release_assets", ROOT / "scripts/verify_release_assets.py")
verifier = importlib.util.module_from_spec(SPEC)
assert SPEC.loader
sys.modules[SPEC.name] = verifier
SPEC.loader.exec_module(verifier)


class ReleaseAssetVerifierTest(unittest.TestCase):
    def fixture(self, root: Path) -> tuple[Path, Path]:
        app = root / "app"
        (app / "tiles_bin").mkdir(parents=True)
        (app / "aerial_pages" / "bootstrap").mkdir(parents=True)
        (app / "aerial_pages" / "low").mkdir(parents=True)
        (app / "aerial_pages" / "medium").mkdir(parents=True)
        (app / "aerial_pages" / "high").mkdir(parents=True)
        (app / "tiles_bin" / "gosper_1_2.bin").write_bytes(b"GSP3geometry")
        (app / "aerial_pages" / "bootstrap" / "texture_4_5.webp").write_bytes(b"RIFF\x04\x00\x00\x00WEBP")
        (app / "aerial_pages" / "low" / "texture_4_5.ktx2").write_bytes(b"\xabKTX 20\xbb\r\n\x1a\nlow")
        (app / "aerial_pages" / "medium" / "texture_4_5.ktx2").write_bytes(b"\xabKTX 20\xbb\r\n\x1a\nmedium")
        (app / "aerial_pages" / "high" / "texture_4_5.ktx2").write_bytes(b"\xabKTX 20\xbb\r\n\x1a\ntexture")
        manifest = {
            "tiles": [{"yq": 1, "yr": 2}],
            "texture_pages": {
                "diagnostic_tattoos": False,
                "bootstrap": {"container": "webp"},
                "tiers": [{"name": "low"}, {"name": "medium"}, {"name": "high"}],
                "pages": [{"page_x": 4, "page_y": 5}],
            },
        }
        path = app / "tile_manifest.json"
        path.write_text(json.dumps(manifest))
        return app, path

    def test_counts_every_valid_referenced_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            app, manifest = self.fixture(Path(tmp))
            report = verifier.verify_assets(manifest, app)
            self.assertTrue(report["ok"])
            self.assertEqual(report["asset_count"], 5)
            self.assertEqual(report["by_extension"][".bin"]["count"], 1)
            self.assertEqual(report["by_extension"][".webp"]["count"], 1)
            self.assertEqual(report["by_extension"][".ktx2"]["count"], 3)
            self.assertGreater(report["total_bytes"], 0)
            self.assertRegex(report["release_id"], r"^[0-9a-f]{20}$")

    def test_reports_missing_and_bad_magic(self):
        with tempfile.TemporaryDirectory() as tmp:
            app, manifest = self.fixture(Path(tmp))
            (app / "tiles_bin" / "gosper_1_2.bin").write_bytes(b"bad")
            (app / "aerial_pages" / "high" / "texture_4_5.ktx2").unlink()
            report = verifier.verify_assets(manifest, app)
            self.assertFalse(report["ok"])
            self.assertTrue(any("not a GSP" in error for error in report["errors"]))
            self.assertTrue(any(error.startswith("missing:") for error in report["errors"]))

    def test_rejects_empty_and_duplicate_asset_sets(self):
        with tempfile.TemporaryDirectory() as tmp:
            app, manifest = self.fixture(Path(tmp))
            payload = json.loads(manifest.read_text())
            payload["tiles"] = []
            manifest.write_text(json.dumps(payload))
            self.assertIn("terrain tile", verifier.verify_assets(manifest, app)["errors"][0])

            _, manifest = self.fixture(Path(tmp) / "duplicate")
            payload = json.loads(manifest.read_text())
            payload["tiles"].append(dict(payload["tiles"][0]))
            manifest.write_text(json.dumps(payload))
            self.assertIn("duplicate", verifier.verify_assets(manifest, app)["errors"][0])

    def test_rejects_partial_texture_contract(self):
        mutations = (
            (lambda contract: contract.pop("bootstrap"), "WebP bootstrap"),
            (lambda contract: contract.update(tiers=[{"name": "high"}]), "exactly low, medium, high"),
            (lambda contract: contract.update(pages=[]), "at least one page"),
        )
        with tempfile.TemporaryDirectory() as tmp:
            for index, (mutation, message) in enumerate(mutations):
                app, manifest = self.fixture(Path(tmp) / str(index))
                payload = json.loads(manifest.read_text())
                mutation(payload["texture_pages"])
                manifest.write_text(json.dumps(payload))
                self.assertIn(message, verifier.verify_assets(manifest, app)["errors"][0])

    def test_tattoos_require_explicit_beta_stubai(self):
        with tempfile.TemporaryDirectory() as tmp:
            app, manifest = self.fixture(Path(tmp))
            payload = json.loads(manifest.read_text())
            payload["texture_pages"]["diagnostic_tattoos"] = True
            payload["release"] = {"mode": "beta", "profile": "beta-stubai", "coverage_profile": "stubai-small-square"}
            manifest.write_text(json.dumps(payload))
            self.assertFalse(verifier.verify_assets(manifest, app)["ok"])
            self.assertTrue(verifier.verify_assets(manifest, app, allow_beta_diagnostics=True)["ok"])
            payload["release"]["mode"] = "production"
            manifest.write_text(json.dumps(payload))
            self.assertFalse(verifier.verify_assets(manifest, app, allow_beta_diagnostics=True)["ok"])


if __name__ == "__main__":
    unittest.main()
