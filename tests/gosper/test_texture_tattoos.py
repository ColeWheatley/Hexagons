#!/usr/bin/env python3
"""Focused pre-encode tests for mini-bake texture registration tattoos."""

import sys
import tempfile
import unittest
from pathlib import Path

import numpy as np
from PIL import Image


REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "hex_backend"))

import waffle_iron as waffle


BASE_COLOR = (41, 52, 63)
BOUNDS = (0.0, 0.0, 512.0, 512.0)


def color_mask(image, color):
    pixels = np.asarray(image)
    return np.all(pixels == np.asarray(color, dtype=np.uint8), axis=2)


class TextureTattooTests(unittest.TestCase):
    def test_mode_defaults_and_cache_recipes_are_isolated(self):
        self.assertTrue(waffle.texture_tattoos_enabled(full_bake=False))
        self.assertFalse(waffle.texture_tattoos_enabled(full_bake=False, disable_requested=True))
        self.assertFalse(waffle.texture_tattoos_enabled(full_bake=True))
        self.assertFalse(waffle.texture_tattoos_enabled(full_bake=True, disable_requested=True))

        clean = waffle.texture_cache_version(False)
        diagnostic = waffle.texture_cache_version(True)
        self.assertEqual(clean, waffle.TEXTURE_VERSION)
        self.assertNotEqual(clean, diagnostic)
        self.assertIn("tattoo", diagnostic)

    def test_per_island_recipe_markers_prevent_cross_region_cache_reuse(self):
        clean = waffle.texture_cache_version(False)
        diagnostic = waffle.texture_cache_version(True)
        with tempfile.TemporaryDirectory() as output_dir:
            marker = waffle.texture_recipe_marker_path(12, -34, output_dir)

            # Existing pre-marker assets retain the legacy clean identity even
            # after metadata says a different mini-bake ran most recently.
            self.assertEqual(waffle.read_texture_recipe_marker(marker, clean), clean)
            waffle.write_texture_recipe_marker(marker, diagnostic)
            self.assertEqual(waffle.read_texture_recipe_marker(marker, clean), diagnostic)
            waffle.write_texture_recipe_marker(marker, clean)
            self.assertEqual(waffle.read_texture_recipe_marker(marker, diagnostic), clean)

    def test_full_and_low_preencode_images_get_only_their_own_vibrant_color(self):
        canvas = Image.new("RGB", (1024, 1024), BASE_COLOR)
        full, low = waffle.prepare_texture_variants(canvas, BOUNDS, tattoos_enabled=True)

        pink = waffle.TEXTURE_TATTOO_COLORS["full"]
        blue = waffle.TEXTURE_TATTOO_COLORS["low"]
        full_pink = color_mask(full, pink)
        low_blue = color_mask(low, blue)

        self.assertGreater(int(full_pink.sum()), 1_000)
        self.assertGreater(int(low_blue.sum()), 100)
        self.assertFalse(color_mask(full, blue).any())
        self.assertFalse(color_mask(low, pink).any())

        # Sparse interior linework, not a filled diagnostic layer or an edge border.
        self.assertLess(float(full_pink.mean()), 0.08)
        self.assertLess(float(low_blue.mean()), 0.08)
        self.assertFalse(full_pink[0, :].all())
        self.assertFalse(full_pink[-1, :].all())
        self.assertFalse(full_pink[:, 0].all())
        self.assertFalse(full_pink[:, -1].all())

    def test_clean_variant_has_no_tattoo_pixels(self):
        canvas = Image.new("RGB", (1024, 1024), BASE_COLOR)
        full, low = waffle.prepare_texture_variants(canvas, BOUNDS, tattoos_enabled=False)

        for image in (full, low):
            self.assertFalse(color_mask(image, waffle.TEXTURE_TATTOO_COLORS["full"]).any())
            self.assertFalse(color_mask(image, waffle.TEXTURE_TATTOO_COLORS["low"]).any())

    def test_world_anchoring_matches_exactly_across_overlapping_canvases(self):
        left_bounds = (0.0, 0.0, 512.0, 512.0)
        right_bounds = (256.0, 0.0, 768.0, 512.0)
        left = Image.new("RGB", (512, 512), BASE_COLOR)
        right = Image.new("RGB", (512, 512), BASE_COLOR)

        waffle.apply_texture_tattoo(left, left_bounds, "low")
        waffle.apply_texture_tattoo(right, right_bounds, "low")
        left_mask = color_mask(left, waffle.TEXTURE_TATTOO_COLORS["low"])
        right_mask = color_mask(right, waffle.TEXTURE_TATTOO_COLORS["low"])

        np.testing.assert_array_equal(left_mask[:, 256:], right_mask[:, :256])

    def test_world_space_stroke_weight_is_comparable_across_resolutions(self):
        full = Image.new("RGB", (1024, 1024), BASE_COLOR)
        low = Image.new("RGB", (256, 256), BASE_COLOR)
        waffle.apply_texture_tattoo(full, BOUNDS, "full")
        waffle.apply_texture_tattoo(low, BOUNDS, "low")

        full_mask = color_mask(full, waffle.TEXTURE_TATTOO_COLORS["full"])
        low_mask = color_mask(low, waffle.TEXTURE_TATTOO_COLORS["low"])
        full_at_low_resolution = full_mask.reshape(256, 4, 256, 4).max(axis=(1, 3))
        union = np.logical_or(full_at_low_resolution, low_mask).sum()
        intersection = np.logical_and(full_at_low_resolution, low_mask).sum()

        # Raster endpoints land differently after a 4x reduction, but the
        # occupied world-area fraction (the perceived line weight) stays the
        # same and the registration masks still substantially overlap.
        self.assertAlmostEqual(float(full_mask.mean()), float(low_mask.mean()), delta=0.003)
        self.assertGreater(intersection / union, 0.50)

    def test_invalid_bounds_and_resolution_kind_fail_loudly(self):
        image = Image.new("RGB", (32, 32), BASE_COLOR)
        with self.assertRaisesRegex(ValueError, "resolution kind"):
            waffle.apply_texture_tattoo(image, BOUNDS, "medium")
        with self.assertRaisesRegex(ValueError, "positive area"):
            waffle.apply_texture_tattoo(image, (0.0, 0.0, 0.0, 1.0), "low")


if __name__ == "__main__":
    unittest.main()
