"""Translation shim from Gosper geometry coverage to the global page grid.

All fractal/island knowledge stops here.  The page grid, imagery assets,
sampler coordinates, and page cache remain independently addressed by
absolute EPSG:31254 metres.
"""

from __future__ import annotations

import math
from typing import Iterable, Mapping

import numpy as np

import coordinate_utility as coord_util

from texture_page_grid import TexturePage, pages_for_bounds, pages_for_coverage_bounds


def tile_coverage_bounds(
    tile: Mapping[str, object], half_extent_x_m: float, half_extent_y_m: float | None = None
) -> tuple[float, float, float, float]:
    x = float(tile["x"])
    y = float(tile["y"])
    half_x = float(half_extent_x_m)
    half_y = half_x if half_extent_y_m is None else float(half_extent_y_m)
    if half_x <= 0.0 or half_y <= 0.0:
        raise ValueError("Gosper coverage half-extents must be positive")
    return (x - half_x, y - half_y, x + half_x, y + half_y)


def pages_for_tiles(
    tiles: Iterable[Mapping[str, object]],
    half_extent_x_m: float,
    half_extent_y_m: float | None = None,
) -> list[TexturePage]:
    """Return shared pages touched by the conservative render coverage."""
    return pages_for_coverage_bounds(
        tile_coverage_bounds(tile, half_extent_x_m, half_extent_y_m) for tile in tiles
    )


def page_intersects_render_caps(page, tile, unit_valid=None):
    """Exact rotated-hex/page SAT test over every renderable hierarchy cap."""
    geom = coord_util.gosper_tile_geometry()
    total_units = 7 ** coord_util.GOSPER_TILE_LEVEL
    if unit_valid is None:
        unit_valid = np.ones(total_units, dtype=bool)
    else:
        unit_valid = np.asarray(unit_valid, dtype=bool)
        if unit_valid.size != total_units:
            raise ValueError("Gosper unit validity mask has the wrong length")

    min_x, min_y, max_x, max_y = page.bounds
    page_cx = (min_x + max_x) * 0.5
    page_cy = (min_y + max_y) * 0.5
    page_half_x = (max_x - min_x) * 0.5
    page_half_y = (max_y - min_y) * 0.5

    for cap_level in range(coord_util.GOSPER_TILE_LEVEL + 1):
        stride = 7 ** cap_level
        node_indices = np.arange(0, total_units, stride)
        node_valid = unit_valid.reshape(-1, stride).any(axis=1)
        if not np.any(node_valid):
            continue
        radius = coord_util.gosper_level_size(cap_level) / math.sqrt(3.0)
        if cap_level > 0:
            radius *= coord_util.GOSPER_CAP_RENDER_OVERSCAN
        rotation = cap_level * coord_util.GOSPER_ROT_PER_LEVEL
        vertex_angles = rotation + np.arange(6, dtype=np.float64) * math.pi / 3.0
        extent_x = radius * float(np.max(np.abs(np.cos(vertex_angles))))
        extent_y = radius * float(np.max(np.abs(np.sin(vertex_angles))))
        dx = float(tile["x"]) + geom["offx"][node_indices] - page_cx
        dy = float(tile["y"]) + geom["offy"][node_indices] - page_cy
        intersects = node_valid & (
            (np.abs(dx) <= page_half_x + extent_x) &
            (np.abs(dy) <= page_half_y + extent_y)
        )
        if not np.any(intersects):
            continue

        # Remaining separating axes are the three unique hex edge normals.
        apothem = radius * math.cos(math.pi / 6.0)
        for normal_angle in rotation + math.pi / 6.0 + np.arange(3) * math.pi / 3.0:
            nx, ny = math.cos(normal_angle), math.sin(normal_angle)
            page_radius = page_half_x * abs(nx) + page_half_y * abs(ny)
            intersects &= np.abs(dx * nx + dy * ny) <= apothem + page_radius
        if np.any(intersects):
            return True
    return False


def exact_pages_for_tiles(
    tiles,
    half_extent_x_m,
    half_extent_y_m=None,
    unit_valid_by_tile=None,
):
    """Return the exact rotated-cap page union in O(neighbor-pages × tiles).

    The geometry-independent grid remains unaware of Gosper packing. This
    adapter takes advantage of the packing by testing only the at-most-nine
    conservative cells neighboring each island, rather than every page against
    every island in a regional/full-state bake.
    """
    valid_by_tile = unit_valid_by_tile or {}
    exact: set[TexturePage] = set()
    for tile in tiles:
        key = (int(tile["yq"]), int(tile["yr"]))
        bounds = tile_coverage_bounds(tile, half_extent_x_m, half_extent_y_m)
        for page in pages_for_bounds(bounds):
            if page_intersects_render_caps(page, tile, valid_by_tile.get(key)):
                exact.add(page)
    return sorted(exact)
