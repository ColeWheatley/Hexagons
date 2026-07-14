"""Shared bake/manifest contract for aerial texture assets.

The browser consumes only KTX2 payloads encoded as XUASTC LDR 6x6.  Keeping
the tier names, dimensions, and URL shape in this small backend module prevents
the baker and generated manifest from drifting apart. The global page contract
has no geometry ownership. Runtime storage policy deliberately does not belong
here.
"""

TEXTURE_PAGE_RECIPE_VERSION = "4.0.2"  # rotated-cap validated aggregate-boundary padding
TEXTURE_CODEC = "xuastc-ldr-6x6"
TEXTURE_CONTAINER = "ktx2"
TEXTURE_PAGE_URL_TEMPLATE = "aerial_pages/{tier}/texture_{page_x}_{page_y}.ktx2"

# Ordered from cheapest/farthest to most detailed.  Each KTX2 contains a full
# mip chain. High fits the WebGL2 4096 minimum maximum texture size directly;
# there is no WebP or parallel fallback asset.
TEXTURE_TIERS = (
    {"name": "low", "role": "postage", "size_px": 128},
    {"name": "medium", "role": "medium", "size_px": 256},
    {"name": "high", "role": "high", "size_px": 4096},
)
TEXTURE_TIER_SIZES = {tier["name"]: tier["size_px"] for tier in TEXTURE_TIERS}


def manifest_texture_page_contract(
    pages,
    recipe_version=None,
    diagnostic_tattoos=False,
    page_vertical_bounds=None,
    page_padding_stats=None,
):
    """Return the geometry-independent global square imagery contract."""
    from texture_page_grid import CRS, ORIGIN_X_M, ORIGIN_Y_M, PAGE_SIZE_M

    version = recipe_version or TEXTURE_PAGE_RECIPE_VERSION
    entries = []
    vertical_by_key = page_vertical_bounds or {}
    padding_by_key = page_padding_stats or {}
    for page in pages:
        entry = page.manifest_entry(TEXTURE_TIERS)
        vertical = vertical_by_key.get(page.key)
        if vertical is not None:
            h_min = float(vertical[0])
            h_max = float(vertical[1])
            # GSP headers expose terrain-center extrema. Expand downward for
            # the maximum signed unit edge (400m + 12m skirt) and for a full
            # aggregate relief skirt (page relief + 24m), whichever is larger.
            render_min = h_min - max(412.0, (h_max - h_min) + 24.0)
            entry.update({
                "hMin": h_min,
                "hMax": h_max,
                "renderMin": render_min,
                "renderMax": h_max,
                "coverage_tile_count": int(vertical[2]),
            })
        padding = padding_by_key.get(page.key) or {}
        entry["boundary_padding"] = {
            "padded_pixels": int(padding.get("padded_pixels", 0)),
            "padded_area_m2": float(padding.get("padded_area_m2", 0.0)),
            "max_distance_m": float(padding.get("max_distance_m", 0.0)),
        }
        entries.append(entry)

    return {
        "recipe_version": version,
        "cache_key": version,
        "container": TEXTURE_CONTAINER,
        "codec": TEXTURE_CODEC,
        "mip_chain": "full",
        "diagnostic_tattoos": bool(diagnostic_tattoos),
        "url_template": TEXTURE_PAGE_URL_TEMPLATE,
        "grid": {
            "crs": CRS,
            "origin_x": ORIGIN_X_M,
            "origin_y": ORIGIN_Y_M,
            "page_size_m": PAGE_SIZE_M,
            "index_rule": "floor",
        },
        "tiers": [dict(tier) for tier in TEXTURE_TIERS],
        "pages": entries,
    }
