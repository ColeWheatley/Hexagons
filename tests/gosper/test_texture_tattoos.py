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
TEST_TIER_SIZES = {"low": 128, "medium": 256, "high": 1024}


def color_mask(image, color):
    pixels = np.asarray(image)
    return np.all(pixels == np.asarray(color, dtype=np.uint8), axis=2)


class TextureTattooTests(unittest.TestCase):
    def test_mode_defaults_and_cache_recipes_are_isolated(self):
        self.assertTrue(waffle.texture_tattoos_enabled(full_bake=False))
        self.assertFalse(waffle.texture_tattoos_enabled(full_bake=False, disable_requested=True))
        self.assertFalse(waffle.texture_tattoos_enabled(full_bake=True))
        self.assertFalse(waffle.texture_tattoos_enabled(full_bake=True, disable_requested=True))

        clean = waffle.texture_page_cache_version(False)
        diagnostic = waffle.texture_page_cache_version(True)
        self.assertEqual(clean, f"{waffle.TEXTURE_PAGE_VERSION}+codec-production")
        self.assertNotEqual(clean, diagnostic)
        self.assertIn("tattoo", diagnostic)

    def test_per_page_recipe_markers_prevent_cross_region_cache_reuse(self):
        clean = waffle.texture_page_cache_version(False)
        diagnostic = waffle.texture_page_cache_version(True)
        with tempfile.TemporaryDirectory() as output_dir:
            marker = waffle.texture_page_recipe_marker_path(
                waffle.TexturePage(12, -34), output_dir
            )

            self.assertEqual(waffle.read_texture_recipe_marker(marker, clean), clean)
            waffle.write_texture_recipe_marker(marker, diagnostic)
            self.assertEqual(waffle.read_texture_recipe_marker(marker, clean), diagnostic)
            waffle.write_texture_recipe_marker(marker, clean)
            self.assertEqual(waffle.read_texture_recipe_marker(marker, diagnostic), clean)

    def test_three_preencode_images_get_only_their_own_vibrant_color(self):
        canvas = Image.new("RGB", (1024, 1024), BASE_COLOR)
        variants = waffle.prepare_texture_variants(
            canvas, BOUNDS, tattoos_enabled=True, tier_sizes=TEST_TIER_SIZES)

        self.assertEqual({name: image.size for name, image in variants.items()}, {
            "low": (128, 128), "medium": (256, 256), "high": (1024, 1024),
        })
        masks = {
            tier: color_mask(variants[tier], waffle.TEXTURE_TATTOO_COLORS[tier])
            for tier in TEST_TIER_SIZES
        }
        self.assertGreater(int(masks["low"].sum()), 100)
        self.assertGreater(int(masks["medium"].sum()), 300)
        self.assertGreater(int(masks["high"].sum()), 5_000)
        for tier, image in variants.items():
            for other, color in waffle.TEXTURE_TATTOO_COLORS.items():
                if other != tier:
                    self.assertFalse(color_mask(image, color).any())

        # Sparse interior linework, not a filled diagnostic layer or an edge border.
        for mask in masks.values():
            self.assertLess(float(mask.mean()), 0.12)
            self.assertFalse(mask[0, :].all())
            self.assertFalse(mask[-1, :].all())
            self.assertFalse(mask[:, 0].all())
            self.assertFalse(mask[:, -1].all())

    def test_clean_variant_has_no_tattoo_pixels(self):
        canvas = Image.new("RGB", (1024, 1024), BASE_COLOR)
        variants = waffle.prepare_texture_variants(
            canvas, BOUNDS, tattoos_enabled=False, tier_sizes=TEST_TIER_SIZES)

        for image in variants.values():
            for color in waffle.TEXTURE_TATTOO_COLORS.values():
                self.assertFalse(color_mask(image, color).any())

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
        high = Image.new("RGB", (1024, 1024), BASE_COLOR)
        medium = Image.new("RGB", (256, 256), BASE_COLOR)
        low = Image.new("RGB", (128, 128), BASE_COLOR)
        waffle.apply_texture_tattoo(high, BOUNDS, "high")
        waffle.apply_texture_tattoo(medium, BOUNDS, "medium")
        waffle.apply_texture_tattoo(low, BOUNDS, "low")

        high_mask = color_mask(high, waffle.TEXTURE_TATTOO_COLORS["high"])
        medium_mask = color_mask(medium, waffle.TEXTURE_TATTOO_COLORS["medium"])
        low_mask = color_mask(low, waffle.TEXTURE_TATTOO_COLORS["low"])
        high_at_low_resolution = high_mask.reshape(128, 8, 128, 8).max(axis=(1, 3))
        medium_at_low_resolution = medium_mask.reshape(128, 2, 128, 2).max(axis=(1, 3))

        # Raster endpoints land differently after reduction, but the
        # occupied world-area fraction (the perceived line weight) stays the
        # same and the registration masks still substantially overlap.
        self.assertAlmostEqual(float(high_mask.mean()), float(low_mask.mean()), delta=0.01)
        self.assertAlmostEqual(float(medium_mask.mean()), float(low_mask.mean()), delta=0.01)
        for reduced in (high_at_low_resolution, medium_at_low_resolution):
            union = np.logical_or(reduced, low_mask).sum()
            intersection = np.logical_and(reduced, low_mask).sum()
            self.assertGreater(intersection / union, 0.40)

    def test_production_contract_is_three_versioned_xuastc_tiers(self):
        self.assertEqual(waffle.TEXTURE_PAGE_VERSION, "4.2.1")
        self.assertEqual(waffle.TEXTURE_TIER_SIZES, {
            "low": 128, "medium": 256, "high": 4096,
        })
        self.assertEqual(set(waffle.TEXTURE_TATTOO_COLORS), {
            "bootstrap", *waffle.TEXTURE_TIER_SIZES,
        })
        self.assertEqual(waffle.TEXTURE_TATTOO_COLORS["bootstrap"], (255, 220, 0))
        self.assertEqual(waffle.TEXTURE_TATTOO_STROKE_M, 3.85)

    def test_bootstrap_has_its_own_yellow_mark_after_downsample(self):
        # The delivery asset is built independently from clean high imagery;
        # this guards against inheriting the green low-tier mark.
        source = Image.new("RGB", (1024, 1024), BASE_COLOR)
        bootstrap = source.resize(
            (waffle.TEXTURE_BOOTSTRAP_SIZE, waffle.TEXTURE_BOOTSTRAP_SIZE),
            Image.Resampling.LANCZOS,
        )
        waffle.apply_texture_tattoo(bootstrap, BOUNDS, "bootstrap")
        self.assertTrue(color_mask(bootstrap, waffle.TEXTURE_TATTOO_COLORS["bootstrap"]).any())
        self.assertFalse(color_mask(bootstrap, waffle.TEXTURE_TATTOO_COLORS["low"]).any())

    def test_invalid_bounds_and_resolution_kind_fail_loudly(self):
        image = Image.new(
            "RGB",
            (waffle.TEXTURE_BOOTSTRAP_SIZE, waffle.TEXTURE_BOOTSTRAP_SIZE),
            BASE_COLOR,
        )
        with self.assertRaisesRegex(ValueError, "resolution kind"):
            waffle.apply_texture_tattoo(image, BOUNDS, "ultra")
        with self.assertRaisesRegex(ValueError, "positive area"):
            waffle.apply_texture_tattoo(image, (0.0, 0.0, 0.0, 1.0), "low")


if __name__ == "__main__":
    unittest.main()
