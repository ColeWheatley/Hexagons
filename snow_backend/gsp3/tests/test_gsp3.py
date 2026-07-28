"""GSP3-side contract tests, incl. the HARD first-tile emission-order test:
a PFL body's byte block 0 must be the tile the manifest lists first,
(271, -229) for beta-stubai — NOT the (yq, yr)-sorted first tile (271, -237).
This failure mode is silent (identical sizes, plausible values, every tile
painted one slot wrong), so it gets its own test.

    pixi run python -m unittest discover snow_backend/gsp3/tests -v
"""

import json
import os
import sys
import unittest

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.abspath(os.path.join(HERE, "..")))
sys.path.insert(0, os.path.abspath(os.path.join(HERE, "..", "..")))
sys.path.insert(0, os.path.abspath(os.path.join(HERE, "..", "..", "snowpack")))

import terrain_pack  # noqa: E402
from pfl_enums import manifest_hash  # noqa: E402

REPO = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
MANIFEST = os.path.join(REPO, "frontend", "app", "tile_manifest.json")
DATA = os.path.join(REPO, "snow_backend", "data")


class TestTileOrder(unittest.TestCase):
    def test_load_tile_list_is_manifest_order_not_sorted(self):
        tiles, _ = terrain_pack.load_tile_list(MANIFEST)
        raw = json.load(open(MANIFEST))["tiles"]
        self.assertEqual([(t["yq"], t["yr"]) for t in tiles],
                         [(t["yq"], t["yr"]) for t in raw])
        self.assertEqual((tiles[0]["yq"], tiles[0]["yr"]), (271, -229))
        by_sort = sorted(tiles, key=lambda t: (t["yq"], t["yr"]))
        self.assertNotEqual((by_sort[0]["yq"], by_sort[0]["yr"]),
                            (tiles[0]["yq"], tiles[0]["yr"]),
                            "sorted order coincides with manifest order — "
                            "this test would no longer discriminate")

    def test_built_pack_slot0_is_manifest_first_tile(self):
        pack = os.path.join(DATA, "terrain_columns.npz")
        if not os.path.exists(pack):
            self.skipTest("terrain pack not built")
        d = np.load(pack)
        self.assertEqual((int(d["tile_yq"][0]), int(d["tile_yr"][0])),
                         (271, -229))

    def test_emitted_pfl_block0_is_manifest_first_tile(self):
        """End-to-end: write a body whose per-tile blocks encode the tile's
        slot; block 0 of the file must decode to the manifest's first tile."""
        import tempfile
        sys.path.insert(0, os.path.join(REPO, "snow_backend", "snowpack"))
        import sidecar
        tiles, _ = terrain_pack.load_tile_list(MANIFEST)
        n = len(tiles)
        body = np.repeat(np.arange(n, dtype=np.uint16) % 255 + 1,
                         2401).astype(np.uint8)
        with tempfile.TemporaryDirectory() as td:
            p = sidecar.write_pfl(td, "depth", np.datetime64("2026-01-01T00"),
                                  body, n, manifest_hash(MANIFEST))
            _, data = sidecar.read_pfl(p)
        slot_of_first = int(data[0]) - 1
        self.assertEqual((tiles[slot_of_first]["yq"], tiles[slot_of_first]["yr"]),
                         (271, -229))
        self.assertEqual(slot_of_first, 0)


class TestManifestHash(unittest.TestCase):
    def test_ruled_value(self):
        # Triple-verified by the frontend against the deployed manifest.
        self.assertEqual(manifest_hash(MANIFEST), 3511903013)
        self.assertEqual(terrain_pack.manifest_hash_u32(MANIFEST), 3511903013)


if __name__ == "__main__":
    unittest.main()
