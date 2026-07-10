#!/usr/bin/env python3
"""Regression tests for mini-bake aerial selection and coverage validation."""

import sys
import unittest
from pathlib import Path

import numpy as np
from shapely.geometry import box


REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "hex_backend"))

import waffle_iron as waffle


class TextureCoverageTests(unittest.TestCase):
    def test_candidate_union_includes_sources_beyond_old_half_width_filter(self):
        # The second candidate intersects the requested region at its near edge,
        # while most of its texture square extends beyond region + tex_half.
        # That far strip was previously omitted and encoded as black.
        requested_region = box(0.0, 0.0, 100.0, 100.0)
        old_filter = requested_region.buffer(10.0, cap_style="square", join_style="mitre")
        islands = [
            {"poly": box(-10.0, 10.0, 40.0, 90.0)},
            {"poly": box(90.0, 10.0, 160.0, 90.0)},
        ]
        far_edge = {"path": "far-edge.tif", "poly": box(140.0, 20.0, 170.0, 80.0)}
        union_gap = {"path": "union-gap.tif", "poly": box(60.0, 20.0, 80.0, 80.0)}

        self.assertFalse(far_edge["poly"].intersects(old_filter))
        selected = waffle.select_aerial_tifs_for_islands([far_edge, union_gap], islands)
        self.assertEqual([item["path"] for item in selected], ["far-edge.tif"])

    def test_complete_coverage_accepts_valid_hexes(self):
        coverage = np.ones((64, 64), dtype=bool)
        count = waffle.validate_geometry_texture_coverage(
            coverage,
            (0.0, 0.0, 64.0, 64.0),
            np.array([12.0, 50.0]),
            np.array([32.0, 32.0]),
            np.array([True, True]),
            tile_label="complete",
        )
        self.assertEqual(count, 2)

    def test_missing_source_strip_rejects_valid_geometry(self):
        coverage = np.ones((64, 64), dtype=bool)
        coverage[:, 40:] = False
        with self.assertRaisesRegex(RuntimeError, r"missing-strip.*1/2 valid terrain hexes unpainted"):
            waffle.validate_geometry_texture_coverage(
                coverage,
                (0.0, 0.0, 64.0, 64.0),
                np.array([12.0, 50.0]),
                np.array([32.0, 32.0]),
                np.array([True, True]),
                tile_label="missing-strip",
            )

    def test_unpainted_off_dem_area_is_ignored(self):
        coverage = np.ones((64, 64), dtype=bool)
        coverage[:, 40:] = False
        count = waffle.validate_geometry_texture_coverage(
            coverage,
            (0.0, 0.0, 64.0, 64.0),
            np.array([12.0, 50.0]),
            np.array([32.0, 32.0]),
            np.array([True, False]),
            tile_label="partial-edge",
        )
        self.assertEqual(count, 1)

    def test_texture_recipe_bump_invalidates_stale_partial_assets(self):
        self.assertEqual(waffle.TEXTURE_VERSION, "3.0.0")
        self.assertEqual(waffle.texture_cache_version(False), "3.0.0")
        self.assertEqual(waffle.texture_cache_version(True), "3.0.0+tattoo-2")


if __name__ == "__main__":
    unittest.main()
