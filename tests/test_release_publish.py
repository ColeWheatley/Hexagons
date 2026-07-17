import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("release_publish", ROOT / "scripts/release_publish.py")
release_publish = importlib.util.module_from_spec(SPEC)
assert SPEC.loader
sys.modules[SPEC.name] = release_publish
SPEC.loader.exec_module(release_publish)


class AtomicReleasePublishTest(unittest.TestCase):
    def fixture(self, root):
        app = root / "app"
        (app / "tiles_bin").mkdir(parents=True)
        (app / "aerial_pages" / "low").mkdir(parents=True)
        (app / "tiles_bin" / "gosper_1_2.bin").write_bytes(b"GSP3" + b"geometry")
        (app / "aerial_pages" / "low" / "texture_4_5.ktx2").write_bytes(b"\xabKTX 20\xbb\r\n\x1a\n" + b"texture")
        manifest = {
            "tiles": [{"yq": 1, "yr": 2}],
            "binary": {},
            "texture_pages": {"diagnostic_tattoos": False, "tiers": [{"name": "low"}], "pages": [{"page_x": 4, "page_y": 5}]},
        }
        path = app / "tile_manifest.json"; path.write_text(json.dumps(manifest))
        return app, path

    def test_interruption_keeps_previous_release_active_then_new_keys_publish(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); app, manifest = self.fixture(root); store = release_publish.LocalStore(root / "s3")
            old = root / "old.json"; old.write_text('{"release":"old"}')
            store.put(old, "tile_manifest.json", cache_control=release_publish.NO_CACHE, content_type="application/json")
            with self.assertRaisesRegex(RuntimeError, "interrupted"):
                release_publish.publish(manifest, app, store, interrupt_after=1)
            self.assertEqual(store.get("tile_manifest.json"), b'{"release":"old"}')
            first = release_publish.publish(manifest, app, store)
            active = json.loads(store.get("tile_manifest.json"))
            self.assertEqual(active["release"]["asset_release"], first)
            self.assertTrue(store.get(f"releases/{first}/tiles_bin/gosper_1_2.bin").startswith(b"GSP3"))
            self.assertEqual(store.head(f"releases/{first}/tiles_bin/gosper_1_2.bin")["CacheControl"], release_publish.IMMUTABLE)
            self.assertEqual(store.head(f"releases/{first}/aerial_pages/low/texture_4_5.ktx2")["ContentType"], "image/ktx2")
            self.assertEqual(store.head("tile_manifest.json")["CacheControl"], release_publish.NO_CACHE)
            self.assertIn(f"releases/{first}/", active["binary"]["url_template"])
            (app / "tiles_bin" / "gosper_1_2.bin").write_bytes(b"GSP3changed")
            second = release_publish.publish(manifest, app, store)
            self.assertNotEqual(first, second)
            self.assertTrue((root / "s3" / "releases" / first).is_dir())
            self.assertEqual(json.loads(store.get("tile_manifest.json"))["release"]["asset_release"], second)

    def test_rejects_diagnostic_tattoos_before_any_write(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); app, manifest = self.fixture(root); payload = json.loads(manifest.read_text())
            payload["texture_pages"]["diagnostic_tattoos"] = True; manifest.write_text(json.dumps(payload))
            store = release_publish.LocalStore(root / "s3")
            with self.assertRaisesRegex(ValueError, "diagnostic-tattoo"):
                release_publish.publish(manifest, app, store)
            self.assertFalse((root / "s3").exists())


if __name__ == "__main__": unittest.main()
