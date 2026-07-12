#!/usr/bin/env python3
"""Locked backend contract for the three Gosper KTX2 texture tiers."""

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
        contract = texture_contract.manifest_texture_contract(
            980.0, recipe_version="3.0.0+tattoo-2", diagnostic_tattoos=True)
        self.assertEqual(contract["recipe_version"], "3.0.0+tattoo-2")
        self.assertEqual(contract["cache_key"], "3.0.0+tattoo-2")
        self.assertEqual(contract["container"], "ktx2")
        self.assertEqual(contract["codec"], "xuastc-ldr-6x6")
        self.assertEqual(contract["mip_chain"], "full")
        self.assertNotIn("webp", str(contract).lower())
        self.assertEqual(contract["url_template"], "aerial_tiles/{tier}/gosper_{yq}_{yr}.ktx2")
        self.assertEqual(contract["tiers"], [
            {"name": "low", "role": "postage", "size_px": 128},
            {"name": "medium", "role": "medium", "size_px": 256},
            {"name": "high", "role": "high", "size_px": 4096},
        ])

    def test_high_is_4096_without_a_parallel_fallback_tier(self):
        sizes = texture_contract.TEXTURE_TIER_SIZES
        self.assertEqual(sizes, {"low": 128, "medium": 256, "high": 4096})
        self.assertEqual(tuple(sizes), ("low", "medium", "high"))

    def test_global_page_recipe_is_independent_from_legacy_island_recipe(self):
        self.assertEqual(texture_contract.TEXTURE_RECIPE_VERSION, "3.0.0")
        self.assertEqual(texture_contract.TEXTURE_PAGE_RECIPE_VERSION, "4.0.2")
        self.assertNotEqual(
            texture_contract.TEXTURE_URL_TEMPLATE,
            texture_contract.TEXTURE_PAGE_URL_TEMPLATE,
        )

    def test_encoder_contract_is_xuastc_with_full_mips_and_no_fallback(self):
        old_binary = waffle.BASISU_BINARY
        waffle.BASISU_BINARY = "/test/basisu-v2"
        try:
            with mock.patch.object(waffle.subprocess, "run") as run:
                waffle.run_basisu_encode("high.png", "high.ktx2")
        finally:
            waffle.BASISU_BINARY = old_binary

        command = run.call_args.args[0]
        self.assertIn("-ldr_6x6i", command)
        self.assertIn("-mipmap", command)
        self.assertIn("-no_alpha", command)
        self.assertNotIn("webp", " ".join(command).lower())


if __name__ == "__main__":
    unittest.main()
