#!/usr/bin/env python3
"""Focused binary-contract tests for GSP3 terrain/render aggregate bounds."""

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
from tests.gosper import validate_gsp1


class GSP3BoundsTests(unittest.TestCase):
    def _build_blob(self):
        count = 7 ** waffle.GSP1_TILE_LEVEL
        # Curved, non-decimetre heights exercise reconstructed means and both
        # sides of the asymmetric range without approaching integer overflow.
        index = np.arange(count, dtype=np.float64)
        heights = 1700.037 + index * 0.011 + np.sin(index * 0.017) * 23.4
        valid = np.ones(count, dtype=bool)
        slopes = np.zeros((count, 3), dtype=np.uint8)
        normals = np.full(count, 128, dtype=np.uint8)
        deltas = np.empty((count, 3), dtype=np.int16)
        deltas[:, 0] = np.where((index.astype(np.int64) & 1) == 0, -124, 87)
        deltas[:, 1] = np.where((index.astype(np.int64) % 3) == 0, 156, -63)
        deltas[:, 2] = np.where((index.astype(np.int64) % 5) == 0, -211, 42)
        nodes = waffle._build_gsp1_nodes(heights, valid, slopes, normals, normals)
        info = {"centerQ": 0, "centerR": 0, "latQ": 0, "latR": 0}
        blob = waffle._pack_gsp3_blob(info, nodes, deltas, slopes, normals, normals, valid)
        return blob, nodes, valid, deltas

    def test_record_layout_is_explicit_and_stable(self):
        self.assertEqual(waffle.GSP_HEADER_STRUCT.size, 48)
        self.assertEqual(waffle.GSP2_AGG_STRUCT.size, 12)
        self.assertEqual(waffle.GSP2_AGG_DTYPE.itemsize, 12)
        self.assertEqual(waffle.GSP3_AGG_STRUCT.size, 16)
        self.assertEqual(waffle.GSP3_AGG_DTYPE.itemsize, 16)
        self.assertEqual(waffle.GSP_UNIT_STRUCT.size, 14)
        self.assertEqual(waffle.GSP1_UNIT_DTYPE.itemsize, 14)

    def test_extent_quantizer_rounds_outward(self):
        packed = waffle._pack_u16_extent_dm(np.array([0.0, 0.001, 0.1, 1.01, 6553.5]))
        np.testing.assert_array_equal(packed, np.array([0, 1, 1, 11, 65535], dtype=np.uint16))
        with self.assertRaises(OverflowError):
            waffle._pack_u16_extent_dm(np.array([6553.5001]))
        with self.assertRaises(ValueError):
            waffle._pack_u16_extent_dm(np.array([np.nan]))

    def test_empty_children_do_not_inflate_parent_terrain_extrema(self):
        count = 7 ** waffle.GSP1_TILE_LEVEL
        heights = np.zeros(count, dtype=np.float64)
        valid = np.zeros(count, dtype=bool)
        heights[:7] = 1000.0
        valid[:7] = True
        heights[-7:] = 3000.0
        valid[-7:] = True
        slopes = np.zeros((count, 3), dtype=np.uint8)
        normals = np.full(count, 128, dtype=np.uint8)

        nodes = waffle._build_gsp1_nodes(heights, valid, slopes, normals, normals)

        # Depth-3 node zero owns units [0, 343): one populated depth-4 child
        # at 1000m and six empty children whose representative is the 2000m
        # island mean. Only the populated child's terrain belongs in bounds.
        self.assertEqual(nodes[3]["count"][0], 7)
        self.assertEqual(nodes[3]["h_min"][0], 1000.0)
        self.assertEqual(nodes[3]["h_max"][0], 1000.0)
        self.assertEqual(nodes[0]["h_min"][0], 1000.0)
        self.assertEqual(nodes[0]["h_max"][0], 3000.0)

    def test_terrain_and_render_extents_have_separate_tight_contracts(self):
        blob, nodes, _, expected_deltas = self._build_blob()
        header = waffle.GSP_HEADER_STRUCT.unpack_from(blob)
        self.assertEqual(header[0:3], (b"GSP3", 3, waffle.GSP1_TILE_LEVEL))

        offset = waffle.GSP_HEADER_STRUCT.size
        reconstructed = np.array([header[7]], dtype=np.float64)
        reconstructed_by_depth = {0: reconstructed}
        aggregate_records = {}
        for depth in range(1, waffle.GSP1_TILE_LEVEL):
            count = struct.unpack_from("<I", blob, offset)[0]
            offset += 4
            self.assertEqual(count, 7 ** depth)
            records = np.frombuffer(blob, dtype=waffle.GSP3_AGG_DTYPE, count=count, offset=offset).copy()
            offset += count * waffle.GSP3_AGG_DTYPE.itemsize

            reconstructed = np.repeat(reconstructed, 7) + records["dH"].astype(np.float64) * 0.1
            reconstructed_by_depth[depth] = reconstructed
            aggregate_records[depth] = records
            self.assertTrue(np.all(records["reserved"] == 0))

        unit_count = struct.unpack_from("<I", blob, offset)[0]
        offset += 4
        self.assertEqual(unit_count, 7 ** waffle.GSP1_TILE_LEVEL)
        units = np.frombuffer(blob, dtype=waffle.GSP1_UNIT_DTYPE, count=unit_count, offset=offset)
        reconstructed_units = np.repeat(reconstructed, 7) + units["dH"].astype(np.float64) * 0.1
        reconstructed_by_depth[waffle.GSP1_TILE_LEVEL] = reconstructed_units
        encoded_deltas = np.column_stack((units["d1"], units["d2"], units["d3"]))
        np.testing.assert_array_equal(encoded_deltas, expected_deltas)
        # Terrain extents stay tight to terrain centers and source extrema;
        # signed edge endpoints must not inflate aggregate skirt sizing.
        for depth, records in aggregate_records.items():
            count = 7 ** depth
            descendants = 7 ** (waffle.GSP1_TILE_LEVEL - depth)
            reconstructed_min = reconstructed_units.reshape(count, descendants).min(axis=1)
            reconstructed_max = reconstructed_units.reshape(count, descendants).max(axis=1)
            expected_min = np.minimum(nodes[depth]["h_min"], reconstructed_min)
            expected_max = np.maximum(nodes[depth]["h_max"], reconstructed_max)
            mean = reconstructed_by_depth[depth]
            lower = mean - records["downExtent"].astype(np.float64) * 0.1
            upper = mean + records["upExtent"].astype(np.float64) * 0.1
            np.testing.assert_array_less(lower - 1e-10, expected_min)
            np.testing.assert_array_less(expected_max, upper + 1e-10)
            self.assertLess(float(np.max(expected_min - lower)), 0.150001)
            self.assertLess(float(np.max(upper - expected_max)), 0.150001)

        endpoints = reconstructed_units[:, np.newaxis] - encoded_deltas.astype(np.float64) * 0.1
        unit_render_min = np.minimum(
            reconstructed_units,
            endpoints.min(axis=1) - waffle.SHADER_SKIRT_EXTENSION_M,
        )
        unit_render_max = np.maximum(reconstructed_units, endpoints.max(axis=1))

        render_bounds = {waffle.GSP1_TILE_LEVEL: (unit_render_min, unit_render_max)}
        for depth in range(waffle.GSP1_TILE_LEVEL - 1, 0, -1):
            records = aggregate_records[depth]
            child_min, child_max = render_bounds[depth + 1]
            descendant_min = child_min.reshape(-1, 7).min(axis=1)
            descendant_max = child_max.reshape(-1, 7).max(axis=1)
            mean = reconstructed_by_depth[depth]
            relief = (
                records["downExtent"].astype(np.float64)
                + records["upExtent"].astype(np.float64)
            ) * 0.1
            own_min = (
                mean - relief
                - waffle.AGGREGATE_SKIRT_BASE_EXTENSION_M
                - waffle.SHADER_SKIRT_EXTENSION_M
            )
            expected_min = np.minimum(descendant_min, own_min)
            expected_max = np.maximum(descendant_max, mean)
            lower = mean - records["renderDown"].astype(np.float64) * 0.1
            upper = mean + records["renderUp"].astype(np.float64) * 0.1
            np.testing.assert_array_less(lower - 1e-10, expected_min)
            np.testing.assert_array_less(expected_max, upper + 1e-10)
            self.assertLess(float(np.max(expected_min - lower)), 0.100001)
            self.assertLess(float(np.max(upper - expected_max)), 0.100001)
            render_bounds[depth] = (expected_min, expected_max)

    def test_unit_valid_reader_accepts_current_gsp3(self):
        blob, _, valid, _ = self._build_blob()
        with tempfile.TemporaryDirectory() as temp_dir:
            path = Path(temp_dir) / "island.bin"
            path.write_bytes(blob)
            np.testing.assert_array_equal(waffle.read_gsp_unit_valid(path), valid)

    def test_independent_validator_accepts_current_gsp3(self):
        blob, _, _, _ = self._build_blob()
        with tempfile.TemporaryDirectory() as temp_dir:
            path = Path(temp_dir) / "gosper_0_0.bin"
            path.write_bytes(blob)
            validate_gsp1.validate_file(path)

    def test_unit_valid_reader_keeps_gsp1_and_gsp2_migration_paths(self):
        for magic, version, aggregate_dtype in (
            (b"GSP1", 1, waffle.GSP1_AGG_DTYPE),
            (b"GSP2", 2, waffle.GSP2_AGG_DTYPE),
        ):
            with self.subTest(magic=magic):
                blob = bytearray(waffle.GSP_HEADER_STRUCT.pack(
                    magic, version, waffle.GSP1_TILE_LEVEL,
                    0, 0, 0, 0, 1000.0, 900.0, 1100.0,
                    0, 0, 128, 128, 1, 0,
                ))
                for depth in range(1, waffle.GSP1_TILE_LEVEL):
                    count = 7 ** depth
                    blob.extend(struct.pack("<I", count))
                    blob.extend(np.zeros(count, dtype=aggregate_dtype).tobytes())
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
            metadata.write_text(
                '{"baker_version":"6.0.1",'
                '"texture_page_version":"4.0.2+codec-balanced",'
                '"texture_encoding_profile":"balanced",'
                '"texture_encoding_effort":4,"texture_page_tattoos":false}'
            )

            for magic, version, yq, yr in (
                (b"GSP1", 1, 0, 0),
                (b"GSP2", 2, 1, -1),
                (b"GSP3", 3, 2, -2),
            ):
                center_q, center_r = waffle.coord_util.gosper_lattice_to_center(yq, yr)
                header = waffle.GSP_HEADER_STRUCT.pack(
                    magic, version, waffle.GSP1_TILE_LEVEL,
                    center_q, center_r, yq, yr,
                    1000.0, 900.0, 1100.0, 0, 0, 128, 128, 1, 0,
                )
                aggregate_dtype = {
                    1: waffle.GSP1_AGG_DTYPE,
                    2: waffle.GSP2_AGG_DTYPE,
                    3: waffle.GSP3_AGG_DTYPE,
                }[version]
                blob = bytearray(header)
                for depth in range(1, waffle.GSP1_TILE_LEVEL):
                    count = 7 ** depth
                    blob.extend(struct.pack("<I", count))
                    aggregates = np.zeros(count, dtype=aggregate_dtype)
                    aggregates["flags"] = 1
                    blob.extend(aggregates.tobytes())
                unit_count = 7 ** waffle.GSP1_TILE_LEVEL
                blob.extend(struct.pack("<I", unit_count))
                units = np.zeros(unit_count, dtype=waffle.GSP1_UNIT_DTYPE)
                units["flags"] = 1
                blob.extend(units.tobytes())
                (binary_dir / f"gosper_{yq}_{yr}.bin").write_bytes(blob)

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
            self.assertEqual([tile["gspVersion"] for tile in manifest["tiles"]], [1, 2, 3])
            self.assertEqual(manifest["binary"]["cache_key"], "6.0.1")
            self.assertEqual(
                manifest["geometry"]["tile_source_footprint_half_m"],
                {"x": 551.0, "y": 551.0},
            )
            self.assertEqual(
                manifest["geometry"]["footprint_semantics"],
                "conservative_render_coverage",
            )
            self.assertEqual(manifest["binary"]["supported_versions"], [1, 2, 3])
            self.assertEqual(
                manifest["binary"]["aggregate_record_bytes"],
                {"1": 8, "2": 12, "3": 16},
            )
            self.assertNotIn("textures", manifest)
            self.assertNotIn("tex_world_side_m", manifest)
            self.assertEqual(
                manifest["texture_pages"]["recipe_version"],
                "4.0.2+codec-balanced",
            )
            self.assertEqual(manifest["texture_pages"]["codec"], "xuastc-ldr-6x6")
            self.assertEqual(
                manifest["texture_pages"]["encoding_profile"]["name"], "balanced"
            )
            self.assertEqual(manifest["texture_pages"]["grid"]["crs"], "EPSG:31254")
            self.assertEqual(manifest["texture_pages"]["grid"]["page_size_m"], 1024.0)
            for page in manifest["texture_pages"]["pages"]:
                self.assertLessEqual(page["hMin"], page["hMax"])
                self.assertLess(page["renderMin"], page["hMin"])
                self.assertGreaterEqual(page["renderMax"], page["hMax"])
                self.assertGreaterEqual(page["hMin"] - page["renderMin"], 412.0)
                self.assertGreater(page["coverage_tile_count"], 0)
                self.assertIn("texture_", page["urls"]["high"])


if __name__ == "__main__":
    unittest.main()
