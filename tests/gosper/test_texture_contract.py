#!/usr/bin/env python3
"""Locked backend contract for the three global-page KTX2 texture tiers."""

import sys
import unittest
from pathlib import Path
from unittest import mock


REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "hex_backend"))

import texture_contract
import waffle_iron as waffle


class TextureContractTests(unittest.TestCase):
    def test_three_tier_manifest_contract(self):
        contract = texture_contract.manifest_texture_page_contract(
            [], recipe_version="4.0.2+tattoo-2", diagnostic_tattoos=True)
        self.assertEqual(contract["recipe_version"], "4.0.2+tattoo-2")
        self.assertEqual(contract["cache_key"], "4.0.2+tattoo-2")
        self.assertEqual(contract["container"], "ktx2")
        self.assertEqual(contract["codec"], "xuastc-ldr-8x6")
        self.assertEqual(contract["mip_chain"], "full")
        self.assertNotIn("webp", str(contract).lower())
        self.assertEqual(contract["url_template"], "aerial_pages/{tier}/texture_{page_x}_{page_y}.ktx2")
        self.assertEqual(contract["tiers"], [
            {"name": "low", "role": "postage", "size_px": 128},
            {"name": "medium", "role": "medium", "size_px": 256},
            {"name": "high", "role": "high", "size_px": 4096},
        ])
        self.assertEqual(contract["encoding_profile"]["name"], "production")
        self.assertEqual(contract["encoding_profile"]["source_report"],
                         "docs/reports/aerial-codec-sweep-2026-07-15.md")
        self.assertEqual(contract["encoding_profile"]["tiers"], {
            tier: {
                "codec": "xuastc-ldr-8x6",
                "block_width": 8,
                "block_height": 6,
                "quality": 90,
                "effort": 4,
            }
            for tier in ("low", "medium", "high")
        })

    def test_high_is_4096_without_a_parallel_fallback_tier(self):
        sizes = texture_contract.TEXTURE_TIER_SIZES
        self.assertEqual(sizes, {"low": 128, "medium": 256, "high": 4096})
        self.assertEqual(tuple(sizes), ("low", "medium", "high"))

    def test_legacy_island_contract_is_not_exposed(self):
        self.assertEqual(texture_contract.TEXTURE_PAGE_RECIPE_VERSION, "4.0.2")
        self.assertFalse(hasattr(texture_contract, "TEXTURE_RECIPE_VERSION"))
        self.assertFalse(hasattr(texture_contract, "TEXTURE_URL_TEMPLATE"))
        self.assertFalse(hasattr(texture_contract, "manifest_texture_contract"))

    def test_sweep_profiles_lock_every_tier_to_an_intentional_encoding(self):
        expected = {
            "production": (8, 6, "-ldr_8x6i"),
            "balanced": (6, 6, "-ldr_6x6i"),
            "close-inspection": (4, 4, "-ldr_4x4i"),
        }
        self.assertEqual(tuple(texture_contract.TEXTURE_ENCODING_PROFILES), tuple(expected))
        for profile_name, (width, height, flag) in expected.items():
            profile = texture_contract.texture_encoding_profile(profile_name)
            self.assertEqual(tuple(profile["tiers"]), ("low", "medium", "high"))
            for tier_name in profile["tiers"]:
                encoding = texture_contract.texture_encoding_for_tier(profile_name, tier_name)
                self.assertEqual((encoding["block_width"], encoding["block_height"]),
                                 (width, height))
                self.assertEqual(encoding["basisu_flag"], flag)
                self.assertEqual((encoding["quality"], encoding["effort"]), (90, 4))

    def test_encoder_contract_uses_selected_profile_with_full_mips_and_no_fallback(self):
        old_binary = waffle.BASISU_BINARY
        waffle.BASISU_BINARY = "/test/basisu-v2"
        try:
            with mock.patch.object(waffle.subprocess, "run") as run:
                waffle.run_basisu_encode(
                    "high.png", "high.ktx2", encoding_profile="production")
        finally:
            waffle.BASISU_BINARY = old_binary

        command = run.call_args.args[0]
        self.assertIn("-ldr_8x6i", command)
        self.assertEqual(command[command.index("-quality") + 1], "90")
        self.assertEqual(command[command.index("-effort") + 1], "4")
        self.assertIn("-mipmap", command)
        self.assertIn("-no_alpha", command)
        self.assertNotIn("webp", " ".join(command).lower())

    def test_fast_iteration_effort_is_explicit_and_cache_separated(self):
        old_binary = waffle.BASISU_BINARY
        waffle.BASISU_BINARY = "/test/basisu-v2"
        try:
            with mock.patch.object(waffle.subprocess, "run") as run:
                waffle.run_basisu_encode(
                    "low.png",
                    "low.ktx2",
                    encoding_profile="balanced",
                    tier_name="low",
                    encoding_effort=1,
                )
        finally:
            waffle.BASISU_BINARY = old_binary

        command = run.call_args.args[0]
        self.assertIn("-ldr_6x6i", command)
        self.assertEqual(command[command.index("-quality") + 1], "90")
        self.assertEqual(command[command.index("-effort") + 1], "1")
        self.assertEqual(
            waffle.texture_page_cache_version(False, "balanced", 1),
            "4.0.2+codec-balanced+effort-1",
        )

    def test_frontend_accepts_every_profile_astc_block_size(self):
        worker = (REPO_ROOT / "frontend/app/tile_worker.js").read_text(encoding="utf-8")
        main = (REPO_ROOT / "frontend/app/main.js").read_text(encoding="utf-8")
        for block in ("4x4", "6x6", "8x6"):
            self.assertIn(f"'{block}'", worker)
            self.assertIn(f"'astc-{block}'", worker)
            self.assertIn(f"'astc-{block}'", main)


if __name__ == "__main__":
    unittest.main()
