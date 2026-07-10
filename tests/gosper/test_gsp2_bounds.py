#!/usr/bin/env python3
"""Focused binary-contract tests for conservative GSP2 aggregate bounds."""

import struct
import sys
import tempfile
import unittest
from pathlib import Path

import numpy as np


REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "hex_backend"))

import waffle_iron as waffle
import generate_manifest


class GSP2BoundsTests(unittest.TestCase):
    def _build_blob(self):
        count = 7 ** waffle.GSP1_TILE_LEVEL
        # Curved, non-decimetre heights exercise reconstructed means and both
        # sides of the asymmetric range without approaching integer overflow.
        index = np.arange(count, dtype=np.float64)
        heights = 1700.037 + index * 0.011 + np.sin(index * 0.017) * 23.4
        valid = np.ones(count, dtype=bool)
        slopes = np.zeros((count, 3), dtype=np.uint8)
        normals = np.full(count, 128, dtype=np.uint8)
        deltas = np.zeros((count, 3), dtype=np.int16)
        nodes = waffle._build_gsp1_nodes(heights, valid, slopes, normals, normals)
        info = {"centerQ": 0, "centerR": 0, "latQ": 0, "latR": 0}
        blob = waffle._pack_gsp2_blob(info, nodes, deltas, slopes, normals, normals, valid)
        return blob, nodes, valid

    def test_record_layout_is_explicit_and_stable(self):
        self.assertEqual(waffle.GSP_HEADER_STRUCT.size, 48)
        self.assertEqual(waffle.GSP2_AGG_STRUCT.size, 12)
        self.assertEqual(waffle.GSP2_AGG_DTYPE.itemsize, 12)
        self.assertEqual(waffle.GSP_UNIT_STRUCT.size, 14)
        self.assertEqual(waffle.GSP1_UNIT_DTYPE.itemsize, 14)

    def test_extent_quantizer_rounds_outward(self):
        packed = waffle._pack_u16_extent_dm(np.array([0.0, 0.001, 0.1, 1.01, 6553.5]))
        np.testing.assert_array_equal(packed, np.array([0, 1, 1, 11, 65535], dtype=np.uint16))
        with self.assertRaises(OverflowError):
            waffle._pack_u16_extent_dm(np.array([6553.5001]))
        with self.assertRaises(ValueError):
            waffle._pack_u16_extent_dm(np.array([np.nan]))

    def test_aggregate_extents_enclose_descendants_from_reconstructed_mean(self):
        blob, nodes, _ = self._build_blob()
        header = waffle.GSP_HEADER_STRUCT.unpack_from(blob)
        self.assertEqual(header[0:3], (b"GSP2", 2, waffle.GSP1_TILE_LEVEL))

        offset = waffle.GSP_HEADER_STRUCT.size
        reconstructed = np.array([header[7]], dtype=np.float64)
        for depth in range(1, waffle.GSP1_TILE_LEVEL):
            count = struct.unpack_from("<I", blob, offset)[0]
            offset += 4
            self.assertEqual(count, 7 ** depth)
            records = np.frombuffer(blob, dtype=waffle.GSP2_AGG_DTYPE, count=count, offset=offset)
            offset += count * waffle.GSP2_AGG_DTYPE.itemsize

            reconstructed = np.repeat(reconstructed, 7) + records["dH"].astype(np.float64) * 0.1
            lower = reconstructed - records["downExtent"].astype(np.float64) * 0.1
            upper = reconstructed + records["upExtent"].astype(np.float64) * 0.1
            np.testing.assert_array_less(lower - 1e-10, nodes[depth]["h_min"])
            np.testing.assert_array_less(nodes[depth]["h_max"], upper + 1e-10)
            # Less than one extent quantum plus the final dH reconstruction's
            # sub-half-decimetre deviation from the source statistic.
            self.assertLess(float(np.max(nodes[depth]["h_min"] - lower)), 0.150001)
            self.assertLess(float(np.max(upper - nodes[depth]["h_max"])), 0.150001)
            self.assertTrue(np.all(records["reserved"] == 0))

    def test_unit_valid_reader_accepts_current_gsp2(self):
        blob, _, valid = self._build_blob()
        with tempfile.TemporaryDirectory() as temp_dir:
            path = Path(temp_dir) / "island.bin"
            path.write_bytes(blob)
            np.testing.assert_array_equal(waffle.read_gsp_unit_valid(path), valid)

    def test_unit_valid_reader_keeps_legacy_gsp1_migration_path(self):
        blob = bytearray(waffle.GSP_HEADER_STRUCT.pack(
            b"GSP1", 1, waffle.GSP1_TILE_LEVEL,
            0, 0, 0, 0, 1000.0, 900.0, 1100.0,
            0, 0, 128, 128, 1, 0,
        ))
        for depth in range(1, waffle.GSP1_TILE_LEVEL):
            count = 7 ** depth
            blob.extend(struct.pack("<I", count))
            blob.extend(np.zeros(count, dtype=waffle.GSP1_AGG_DTYPE).tobytes())
        count = 7 ** waffle.GSP1_TILE_LEVEL
        expected = (np.arange(count) % 3) != 0
        units = np.zeros(count, dtype=waffle.GSP1_UNIT_DTYPE)
        units["flags"] = expected.astype(np.uint8)
        blob.extend(struct.pack("<I", count))
        blob.extend(units.tobytes())

        with tempfile.TemporaryDirectory() as temp_dir:
            path = Path(temp_dir) / "legacy.bin"
            path.write_bytes(blob)
            np.testing.assert_array_equal(waffle.read_gsp_unit_valid(path), expected)

    def test_manifest_exposes_per_tile_version_during_rolling_rebake(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            temp = Path(temp_dir)
            binary_dir = temp / "bins"
            binary_dir.mkdir()
            output = temp / "manifest.json"
            metadata = temp / "metadata.json"
            metadata.write_text('{"texture_version":"3.0.0+tattoo-2","texture_tattoos":true}')

            for magic, version, yq, yr in ((b"GSP1", 1, 0, 0), (b"GSP2", 2, 1, -1)):
                center_q, center_r = waffle.coord_util.gosper_lattice_to_center(yq, yr)
                header = waffle.GSP_HEADER_STRUCT.pack(
                    magic, version, waffle.GSP1_TILE_LEVEL,
                    center_q, center_r, yq, yr,
                    1000.0, 900.0, 1100.0, 0, 0, 128, 128, 1, 0,
                )
                (binary_dir / f"gosper_{yq}_{yr}.bin").write_bytes(header)

            old_values = (
                generate_manifest.BINARY_DIR,
                generate_manifest.OUTPUT_FILE,
                generate_manifest.METADATA_FILE,
            )
            try:
                generate_manifest.BINARY_DIR = str(binary_dir)
                generate_manifest.OUTPUT_FILE = str(output)
                generate_manifest.METADATA_FILE = str(metadata)
                generate_manifest.generate_manifest()
            finally:
                (generate_manifest.BINARY_DIR,
                 generate_manifest.OUTPUT_FILE,
                 generate_manifest.METADATA_FILE) = old_values

            import json
            manifest = json.loads(output.read_text())
            self.assertEqual([tile["gspVersion"] for tile in manifest["tiles"]], [1, 2])
            self.assertEqual(manifest["binary"]["aggregate_record_bytes"], {"1": 8, "2": 12})
            self.assertEqual(manifest["textures"]["recipe_version"], "3.0.0+tattoo-2")
            self.assertTrue(manifest["textures"]["diagnostic_tattoos"])


if __name__ == "__main__":
    unittest.main()
