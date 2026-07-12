"""Geometry-independent EPSG:31254 imagery page grid.

The terrain baker and browser share this small, deliberately geometry-blind
translation layer.  It maps absolute projected metres to globally anchored
square page keys; callers decide which geometry needs those pages.

Pages use half-open bounds ``[min_x, max_x) x [min_y, max_y)`` so a point on a
seam has exactly one owner.  The zero origin is stable across regional and
full-country bakes and makes a page key independently reproducible from world
coordinates.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Iterable, Iterator, Mapping, Sequence


CRS = "EPSG:31254"
PAGE_SIZE_M = 1024.0
ORIGIN_X_M = 0.0
ORIGIN_Y_M = 0.0


@dataclass(frozen=True, order=True)
class TexturePage:
    """One globally addressed imagery page."""

    page_x: int
    page_y: int

    @property
    def key(self) -> str:
        return f"{self.page_x}_{self.page_y}"

    @property
    def asset_stem(self) -> str:
        return f"texture_{self.key}"

    @property
    def bounds(self) -> tuple[float, float, float, float]:
        min_x = ORIGIN_X_M + self.page_x * PAGE_SIZE_M
        min_y = ORIGIN_Y_M + self.page_y * PAGE_SIZE_M
        return (min_x, min_y, min_x + PAGE_SIZE_M, min_y + PAGE_SIZE_M)

    def url(self, tier: str, root: str = "aerial_pages") -> str:
        return f"{root}/{tier}/{self.asset_stem}.ktx2"

    def manifest_entry(self, tiers: Sequence[Mapping[str, object]]) -> dict:
        min_x, min_y, max_x, max_y = self.bounds
        return {
            "key": self.key,
            "page_x": self.page_x,
            "page_y": self.page_y,
            "min_x": min_x,
            "min_y": min_y,
            "max_x": max_x,
            "max_y": max_y,
            "urls": {str(tier["name"]): self.url(str(tier["name"])) for tier in tiers},
        }


def page_index(coordinate_m: float, origin_m: float = 0.0) -> int:
    """Return the owner page for one projected coordinate."""
    coordinate_m = float(coordinate_m)
    if not math.isfinite(coordinate_m):
        raise ValueError("texture page coordinates must be finite")
    return math.floor((coordinate_m - origin_m) / PAGE_SIZE_M)


def page_for_point(x_m: float, y_m: float) -> TexturePage:
    return TexturePage(page_index(x_m, ORIGIN_X_M), page_index(y_m, ORIGIN_Y_M))


def pages_for_bounds(bounds: Sequence[float]) -> Iterator[TexturePage]:
    """Yield every page intersecting a positive-area half-open rectangle."""
    if len(bounds) != 4:
        raise ValueError("texture page bounds must contain four values")
    min_x, min_y, max_x, max_y = map(float, bounds)
    if not all(math.isfinite(v) for v in (min_x, min_y, max_x, max_y)):
        raise ValueError("texture page bounds must be finite")
    if min_x >= max_x or min_y >= max_y:
        raise ValueError("texture page bounds must have positive area")

    # nextafter preserves half-open ownership when max lies exactly on a page
    # seam, without an arbitrary metre/pixel epsilon.
    last_x = math.nextafter(max_x, -math.inf)
    last_y = math.nextafter(max_y, -math.inf)
    min_page_x = page_index(min_x, ORIGIN_X_M)
    max_page_x = page_index(last_x, ORIGIN_X_M)
    min_page_y = page_index(min_y, ORIGIN_Y_M)
    max_page_y = page_index(last_y, ORIGIN_Y_M)
    for page_x in range(min_page_x, max_page_x + 1):
        for page_y in range(min_page_y, max_page_y + 1):
            yield TexturePage(page_x, page_y)


def pages_for_coverage_bounds(bounds_iter: Iterable[Sequence[float]]) -> list[TexturePage]:
    """Return the sorted union of pages touched by arbitrary geometry bounds."""
    pages: set[TexturePage] = set()
    for bounds in bounds_iter:
        pages.update(pages_for_bounds(bounds))
    return sorted(pages)


