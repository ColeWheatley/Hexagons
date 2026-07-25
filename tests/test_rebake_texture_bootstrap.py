import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest import mock


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "rebake_texture_bootstrap",
    ROOT / "scripts/rebake_texture_bootstrap.py",
)
rebake = importlib.util.module_from_spec(SPEC)
assert SPEC.loader
sys.modules[SPEC.name] = rebake
SPEC.loader.exec_module(rebake)


class BootstrapPromotionTransactionTest(unittest.TestCase):
    def test_manifest_failure_restores_images_markers_and_metadata(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            texture_dir = root / "aerial_pages"
            staged = root / "migration" / "staged"
            binary_dir = root / "tiles_bin"
            metadata_path = binary_dir / "metadata.json"
            manifest_path = root / "tile_manifest.json"
            staged.mkdir(parents=True)
            binary_dir.mkdir()

            pages = [
                SimpleNamespace(asset_stem="texture_1_2"),
                SimpleNamespace(asset_stem="texture_3_4"),
            ]
            old_page = texture_dir / "bootstrap" / "texture_1_2.webp"
            old_marker = texture_dir / ".recipes" / "texture_1_2.txt"
            old_page.parent.mkdir(parents=True)
            old_marker.parent.mkdir(parents=True)
            old_page.write_bytes(b"old-webp")
            old_marker.write_text("old-recipe\n")
            (staged / "texture_1_2.webp").write_bytes(b"new-one")
            (staged / "texture_3_4.webp").write_bytes(b"new-two")
            metadata_path.write_text(json.dumps({"texture_page_version": "old"}))
            manifest_path.write_text("old-manifest\n")

            with mock.patch.object(
                rebake.generate_manifest,
                "generate_manifest",
                side_effect=RuntimeError("manifest failed"),
            ):
                with self.assertRaisesRegex(RuntimeError, "manifest failed"):
                    rebake.promote(
                        staged,
                        texture_dir,
                        pages,
                        "new-recipe",
                        binary_dir=binary_dir,
                        metadata_path=metadata_path,
                        manifest_path=manifest_path,
                        metadata={"texture_page_version": "old"},
                    )

            self.assertEqual(old_page.read_bytes(), b"old-webp")
            self.assertEqual(old_marker.read_text(), "old-recipe\n")
            self.assertFalse((texture_dir / "bootstrap" / "texture_3_4.webp").exists())
            self.assertFalse((texture_dir / ".recipes" / "texture_3_4.txt").exists())
            self.assertEqual(json.loads(metadata_path.read_text()), {"texture_page_version": "old"})
            self.assertEqual(manifest_path.read_text(), "old-manifest\n")


if __name__ == "__main__":
    unittest.main()
