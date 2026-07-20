#!/usr/bin/env python3
"""Contract tests for geometry-independent square imagery pages."""

import json
import math
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import numpy as np


REPO_ROOT = Path(__file__).resolve().parents[2]
BACKEND = REPO_ROOT / "hex_backend"
sys.path.insert(0, str(BACKEND))

import gosper_texture_page_adapter as adapter
import gsp_binary
import generate_manifest
import texture_contract
import texture_page_grid as grid
import waffle_iron as waffle


class TexturePageGridTests(unittest.TestCase):
    def test_atomic_json_publish_preserves_previous_file_on_failure(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            path = Path(temp_dir) / "manifest.json"
            path.write_text('{"old":true}', encoding="utf-8")
            with mock.patch.object(generate_manifest.json, "dump", side_effect=RuntimeError("boom")):
                with self.assertRaisesRegex(RuntimeError, "boom"):
                    generate_manifest.write_json_atomic(path, {"new": True})
            self.assertEqual(path.read_text(encoding="utf-8"), '{"old":true}')
            self.assertEqual(list(Path(temp_dir).glob(".*.tmp")), [])

    def test_generic_grid_source_has_no_gosper_knowledge(self):
        source = (BACKEND / "texture_page_grid.py").read_text(encoding="utf-8").lower()
        self.assertNotIn("gosper", source)

    def test_floor_ownership_is_stable_at_positive_and_negative_seams(self):
        self.assertEqual(grid.page_for_point(0.0, 0.0), grid.TexturePage(0, 0))
        self.assertEqual(grid.page_for_point(1023.999, 1023.999), grid.TexturePage(0, 0))
        self.assertEqual(grid.page_for_point(1024.0, 1024.0), grid.TexturePage(1, 1))
        self.assertEqual(grid.page_for_point(-0.001, -0.001), grid.TexturePage(-1, -1))
        self.assertEqual(grid.page_for_point(-1024.0, -1024.0), grid.TexturePage(-1, -1))

    def test_half_open_bounds_do_not_claim_neighbor_at_exact_max_seam(self):
        pages = list(grid.pages_for_bounds((0.0, 0.0, 1024.0, 1024.0)))
        self.assertEqual(pages, [grid.TexturePage(0, 0)])
        pages = list(grid.pages_for_bounds((-1024.0, -1024.0, 1024.0, 1024.0)))
        self.assertEqual(
            pages,
            [
                grid.TexturePage(-1, -1),
                grid.TexturePage(-1, 0),
                grid.TexturePage(0, -1),
                grid.TexturePage(0, 0),
            ],
        )

    def test_current_mini_corpus_conservative_shim_resolves_to_152_candidates(self):
        manifest = json.loads((REPO_ROOT / "frontend/app/tile_manifest.json").read_text())
        pages = adapter.pages_for_tiles(manifest["tiles"], 551.0, 551.0)
        self.assertEqual(len(manifest["tiles"]), 197)
        self.assertEqual(len(pages), 152)
        self.assertEqual((min(p.page_x for p in pages), max(p.page_x for p in pages)), (52, 64))
        self.assertEqual((min(p.page_y for p in pages), max(p.page_y for p in pages)), (196, 207))

    def test_current_mini_corpus_exact_render_union_is_149_pages(self):
        manifest = json.loads((REPO_ROOT / "frontend/app/tile_manifest.json").read_text())
        first = manifest["tiles"][0]
        if not (
            REPO_ROOT / "frontend/app/tiles_bin" / f"gosper_{first['yq']}_{first['yr']}.bin"
        ).is_file():
            self.skipTest("ignored 197-island GSP fixture is not installed in this worktree")
        valid = {
            (tile["yq"], tile["yr"]): gsp_binary.read_unit_valid(
                REPO_ROOT / "frontend/app/tiles_bin" / f"gosper_{tile['yq']}_{tile['yr']}.bin"
            )
            for tile in manifest["tiles"]
        }
        candidates = set(adapter.pages_for_tiles(manifest["tiles"], 551.0, 551.0))
        exact = adapter.exact_pages_for_tiles(manifest["tiles"], 551.0, 551.0, valid)
        self.assertEqual(len(exact), 149)
        self.assertEqual(
            candidates - set(exact),
            {grid.TexturePage(52, 199), grid.TexturePage(52, 204), grid.TexturePage(64, 206)},
        )
        self.assertTrue(all(
            any(
                adapter.page_intersects_render_caps(
                    page, tile, valid[(tile["yq"], tile["yr"])]
                )
                for tile in manifest["tiles"]
            )
            for page in exact
        ))
        tile_sources = {
            key: {
                "label": f"gosper_{key[0]}_{key[1]}",
                "x": next(tile["x"] for tile in manifest["tiles"] if (tile["yq"], tile["yr"]) == key),
                "y": next(tile["y"] for tile in manifest["tiles"] if (tile["yq"], tile["yr"]) == key),
                "unit_valid": unit_valid,
            }
            for key, unit_valid in valid.items()
        }
        mapped = waffle.map_gosper_sources_to_texture_pages(
            exact, manifest["tiles"], tile_sources, 551.0, 551.0
        )
        self.assertEqual(set(mapped), {page.key for page in exact})
        self.assertTrue(all(mapped[page.key] for page in exact))
        self.assertIn("gosper_271_-237", [item["label"] for item in mapped["64_196"]])

    def test_rotated_l5_edge_sliver_is_not_dropped(self):
        from shapely.geometry import Polygon, box

        manifest = json.loads((REPO_ROOT / "frontend/app/tile_manifest.json").read_text())
        if not (REPO_ROOT / "frontend/app/tiles_bin/gosper_271_-237.bin").is_file():
            self.skipTest("ignored 197-island GSP fixture is not installed in this worktree")
        tile = next(t for t in manifest["tiles"] if (t["yq"], t["yr"]) == (271, -237))
        valid = gsp_binary.read_unit_valid(
            REPO_ROOT / "frontend/app/tiles_bin/gosper_271_-237.bin"
        )
        page = grid.TexturePage(64, 196)
        radius = waffle.coord_util.gosper_level_size(5) / math.sqrt(3.0) * 1.15
        unrotated = Polygon([
            (
                tile["x"] + math.cos(i * math.pi / 3.0) * radius,
                tile["y"] + math.sin(i * math.pi / 3.0) * radius,
            )
            for i in range(6)
        ])
        self.assertTrue(unrotated.intersection(box(*page.bounds)).is_empty)
        self.assertTrue(adapter.page_intersects_render_caps(page, tile, valid))
        source = {"label": "gosper_271_-237", "x": tile["x"], "y": tile["y"], "unit_valid": valid}
        mapped = waffle.map_gosper_sources_to_texture_pages(
            [page],
            [tile],
            {(271, -237): source},
            551.0,
            551.0,
        )
        self.assertEqual([item["label"] for item in mapped[page.key]], ["gosper_271_-237"])
        unit_mask, aggregate_allowance = waffle.geometry_padding_masks(page, [source], (64, 64))
        self.assertFalse(np.any(unit_mask))
        self.assertGreater(np.count_nonzero(aggregate_allowance), 0)

    def test_render_footprint_includes_aggregate_cap_overscan(self):
        geom = waffle.coord_util.gosper_tile_geometry()
        self.assertEqual(geom["render_half_x_m"], 551.0)
        self.assertEqual(geom["render_half_y_m"], 551.0)
        self.assertGreater(geom["render_half_x_m"], geom["tex_half_m"])

    def test_manifest_page_contract_has_absolute_grid_urls_and_vertical_bounds(self):
        page = grid.TexturePage(57, 201)
        contract = texture_contract.manifest_texture_page_contract(
            [page],
            recipe_version="4.0.2+tattoo-2",
            diagnostic_tattoos=True,
            page_vertical_bounds={page.key: (900.0, 3300.0, 4)},
            page_padding_stats={page.key: {
                "padded_pixels": 123,
                "padded_area_m2": 7.6875,
                "max_distance_m": 12.5,
            }},
        )
        self.assertEqual(contract["grid"], {
            "crs": "EPSG:31254",
            "origin_x": 0.0,
            "origin_y": 0.0,
            "page_size_m": 1024.0,
            "index_rule": "floor",
        })
        self.assertEqual(contract["url_template"], "aerial_pages/{tier}/texture_{page_x}_{page_y}.ktx2")
        entry = contract["pages"][0]
        self.assertEqual(entry["key"], "57_201")
        self.assertEqual((entry["min_x"], entry["min_y"]), (58368.0, 205824.0))
        self.assertEqual(entry["urls"]["high"], "aerial_pages/high/texture_57_201.ktx2")
        self.assertEqual(entry["urls"]["bootstrap"], "aerial_pages/bootstrap/texture_57_201.webp")
        self.assertEqual((entry["hMin"], entry["hMax"], entry["coverage_tile_count"]), (900.0, 3300.0, 4))
        self.assertEqual((entry["renderMin"], entry["renderMax"]), (-1524.0, 3300.0))
        self.assertEqual(entry["boundary_padding"], {
            "padded_pixels": 123,
            "padded_area_m2": 7.6875,
            "max_distance_m": 12.5,
        })

    def test_page_recipe_markers_are_separate_and_restart_safe(self):
        page = grid.TexturePage(-2, 3)
        with tempfile.TemporaryDirectory() as temp_dir:
            marker = waffle.texture_page_recipe_marker_path(page, temp_dir)
            self.assertTrue(marker.endswith(".recipes/texture_-2_3.txt"))
            paths = waffle.texture_page_asset_paths(page, temp_dir)
            for path in paths.values():
                Path(path).parent.mkdir(parents=True, exist_ok=True)
                Path(path).write_bytes(b"ktx2")
            self.assertFalse(waffle.texture_page_is_current(page, "4.0.2+tattoo-2", temp_dir))
            waffle.write_texture_page_padding_stats(
                waffle.texture_page_padding_stats_path(page, temp_dir),
                {"padded_pixels": 0, "padded_area_m2": 0.0, "max_distance_m": 0.0},
            )
            waffle.write_texture_recipe_marker(marker, "4.0.2+tattoo-2")
            self.assertEqual(waffle.read_texture_recipe_marker(marker), "4.0.2+tattoo-2")
            self.assertTrue(waffle.texture_page_is_current(page, "4.0.2+tattoo-2", temp_dir))
            waffle.invalidate_texture_page_transaction(page, temp_dir)
            self.assertFalse(waffle.texture_page_is_current(page, "4.0.2+tattoo-2", temp_dir))
            # Interrupted same-recipe publication leaves old/mixed files, but
            # no valid commit marker, so a restart must rebake.
            self.assertTrue(all(Path(path).exists() for path in paths.values()))
            waffle.write_texture_recipe_marker(marker, "4.0.2+tattoo-2")
            Path(paths["medium"]).unlink()
            self.assertFalse(waffle.texture_page_is_current(page, "4.0.2+tattoo-2", temp_dir))
        self.assertEqual(
            waffle.texture_page_cache_version(False), "4.2.2+codec-production"
        )
        self.assertEqual(
            waffle.texture_page_cache_version(True),
            "4.2.2+codec-production+tattoo-3",
        )

    def test_page_coverage_validator_checks_only_samples_owned_by_page(self):
        page = grid.page_for_point(0.0, 0.0)
        valid = np.zeros(7 ** waffle.GSP1_TILE_LEVEL, dtype=bool)
        # Offset 0 is the island center for the heap-ordered unit array.
        valid[0] = True
        source = {"x": 100.0, "y": 100.0, "unit_valid": valid}
        coverage = np.ones((64, 64), dtype=bool)
        checked = waffle.validate_texture_page_geometry_coverage(coverage, page, [source])
        self.assertGreater(checked, 7)
        coverage[55:59, 5:8] = False
        with self.assertRaisesRegex(RuntimeError, "valid unit-cap samples unpainted"):
            waffle.validate_texture_page_geometry_coverage(coverage, page, [source])

    def _single_valid_center_source(self, x=100.0, y=100.0):
        valid = np.zeros(7 ** waffle.GSP1_TILE_LEVEL, dtype=bool)
        valid[0] = True
        return {"label": "test", "x": x, "y": y, "unit_valid": valid}

    def test_boundary_only_aggregate_overdraw_is_nearest_edge_padded(self):
        from PIL import Image

        page = grid.TexturePage(0, 0)
        coverage = np.zeros((64, 64), dtype=bool)
        coverage[:, :32] = True
        source_domain = coverage.copy()
        canvas = Image.new("RGB", (64, 64), (10, 20, 30))
        padded, padded_coverage, stats = waffle.pad_aggregate_boundary_overdraw(
            canvas, coverage, source_domain, page, [self._single_valid_center_source()]
        )
        try:
            self.assertGreater(stats["padded_pixels"], 0)
            self.assertGreater(stats["padded_area_m2"], 0.0)
            self.assertLessEqual(
                stats["max_distance_m"],
                waffle.coord_util.gosper_level_size(5) / math.sqrt(3.0) * 1.15 + 23.0,
            )
            self.assertGreater(np.count_nonzero(padded_coverage[:, 32:]), 0)
        finally:
            padded.close()

    def test_geometryless_exact_page_drift_hard_fails_even_with_full_imagery(self):
        from PIL import Image

        page = grid.TexturePage(0, 0)
        coverage = np.ones((64, 64), dtype=bool)
        canvas = Image.new("RGB", (64, 64), (10, 20, 30))
        try:
            with self.assertRaisesRegex(RuntimeError, "empty rasterized geometry mask"):
                waffle.pad_aggregate_boundary_overdraw(
                    canvas, coverage, coverage.copy(), page, []
                )
        finally:
            canvas.close()

    def test_l0_raster_area_is_hard_excluded_from_parent_padding(self):
        from PIL import Image

        page = grid.TexturePage(0, 0)
        source = self._single_valid_center_source()
        shape = (512, 512)
        unit_mask, aggregate_allowance = waffle.geometry_padding_masks(page, [source], shape)
        self.assertGreater(np.count_nonzero(unit_mask), 0)
        self.assertTrue(np.all(aggregate_allowance[unit_mask] == 0.0))
        radius = waffle.coord_util.UNIT_HEX_WIDTH_METERS / math.sqrt(3.0)
        sample_pixels = set()
        for angle in [None] + list(np.arange(6) * math.pi / 3.0):
            x = 100.0 if angle is None else 100.0 + math.cos(angle) * radius
            y = 100.0 if angle is None else 100.0 + math.sin(angle) * radius
            sample_pixels.add((math.floor((1024.0 - y) * shape[0] / 1024.0), math.floor(x * shape[1] / 1024.0)))
        row, col = next(tuple(pixel) for pixel in np.argwhere(unit_mask) if tuple(pixel) not in sample_pixels)
        coverage = np.ones(shape, dtype=bool)
        coverage[row, col] = False
        source_domain = coverage.copy()
        # Center/vertex sampling alone misses this interior L0 pixel.
        waffle.validate_texture_page_geometry_coverage(
            coverage, page, [source], allow_aggregate_boundary_missing=True
        )
        canvas = Image.new("RGB", (shape[1], shape[0]), (10, 20, 30))
        try:
            with self.assertRaisesRegex(RuntimeError, "valid L0 cap pixels unpainted"):
                waffle.pad_aggregate_boundary_overdraw(
                    canvas, coverage, source_domain, page, [source]
                )
        finally:
            canvas.close()

    def test_internal_read_gap_is_never_padded(self):
        from PIL import Image

        page = grid.TexturePage(0, 0)
        coverage = np.ones((64, 64), dtype=bool)
        coverage[56:59, 18:21] = False
        source_domain = np.ones_like(coverage)
        canvas = Image.new("RGB", (64, 64), (10, 20, 30))
        try:
            with self.assertRaisesRegex(RuntimeError, "unread internal source coverage"):
                waffle.pad_aggregate_boundary_overdraw(
                    canvas, coverage, source_domain, page, [self._single_valid_center_source()]
                )
        finally:
            canvas.close()

    def test_internal_corpus_hole_is_never_padded(self):
        from PIL import Image
        from shapely.geometry import box

        page = grid.TexturePage(0, 0)
        coverage = np.ones((64, 64), dtype=bool)
        coverage[56:59, 18:21] = False
        source_domain = coverage.copy()
        canvas = Image.new("RGB", (64, 64), (10, 20, 30))
        try:
            with self.assertRaisesRegex(RuntimeError, "internal orthophoto gap"):
                waffle.pad_aggregate_boundary_overdraw(
                    canvas,
                    coverage,
                    source_domain,
                    page,
                    [self._single_valid_center_source()],
                    internal_holes=box(288.0, 80.0, 336.0, 128.0),
                )
        finally:
            canvas.close()

    def test_global_internal_hole_crossing_page_edge_is_never_padded(self):
        from PIL import Image
        from shapely.geometry import box

        page = grid.TexturePage(0, 0)
        source = self._single_valid_center_source(x=500.0, y=500.0)
        _unit, allowance = waffle.geometry_padding_masks(page, [source], (64, 64))
        row, col = next(
            tuple(pixel) for pixel in np.argwhere(allowance > 0.0) if pixel[1] >= 62
        )
        coverage = np.ones((64, 64), dtype=bool)
        coverage[row, col] = False
        source_domain = coverage.copy()
        canvas = Image.new("RGB", (64, 64), (10, 20, 30))
        pixel_min_x = col * 16.0
        pixel_max_y = 1024.0 - row * 16.0
        try:
            with self.assertRaisesRegex(RuntimeError, "internal orthophoto gap"):
                waffle.pad_aggregate_boundary_overdraw(
                    canvas,
                    coverage,
                    source_domain,
                    page,
                    [source],
                    # The global hole continues beyond x=1024; page-local
                    # fill-holes logic would incorrectly call it exterior.
                    internal_holes=box(
                        pixel_min_x,
                        pixel_max_y - 16.0,
                        1056.0,
                        pixel_max_y,
                    ),
                )
        finally:
            canvas.close()

    def test_aggregate_only_page_can_pad_from_source_across_page_seam(self):
        from PIL import Image
        import rasterio
        from rasterio.transform import from_bounds
        from shapely.geometry import box

        page = grid.TexturePage(0, 0)
        source = self._single_valid_center_source(x=500.0, y=1100.0)
        coverage = np.zeros((64, 64), dtype=bool)
        source_domain = np.zeros_like(coverage)
        canvas = Image.new("RGB", (64, 64), (0, 0, 0))
        with tempfile.TemporaryDirectory() as temp_dir:
            path = Path(temp_dir) / "outside.tif"
            transform = from_bounds(0.0, 1024.0, 1024.0, 1280.0, 64, 16)
            with rasterio.open(
                path,
                "w",
                driver="GTiff",
                width=64,
                height=16,
                count=3,
                dtype="uint8",
                crs="EPSG:31254",
                transform=transform,
            ) as target:
                target.write(np.full((3, 16, 64), 77, dtype=np.uint8))
            aerial_sources = [{"path": str(path), "poly": box(0.0, 1024.0, 1024.0, 1280.0)}]
            padded, padded_coverage, stats = waffle.pad_aggregate_boundary_overdraw(
                canvas,
                coverage,
                source_domain,
                page,
                [source],
                aerial_sources=aerial_sources,
            )
            try:
                self.assertGreater(stats["padded_pixels"], 0)
                self.assertGreater(np.count_nonzero(padded_coverage), 0)
                self.assertTrue(np.all(np.asarray(padded)[padded_coverage] == 77))
            finally:
                padded.close()


if __name__ == "__main__":
    unittest.main()
