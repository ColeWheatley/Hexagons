"""Shared bake/manifest contract for aerial texture assets.

The browser consumes KTX2 payloads encoded with one explicit XUASTC profile.
Keeping the profile, tier names, dimensions, and URL shape in this small
backend module prevents the baker and generated manifest from drifting apart.
The global page contract has no geometry ownership. Runtime storage policy
deliberately does not belong here.
"""

TEXTURE_PAGE_RECIPE_VERSION = "4.1.0"  # demand-driven WebP bootstrap + KTX2 tiers
TEXTURE_CONTAINER = "ktx2"
TEXTURE_PAGE_URL_TEMPLATE = "aerial_pages/{tier}/texture_{page_x}_{page_y}.ktx2"
TEXTURE_BOOTSTRAP_SIZE = 32
TEXTURE_BOOTSTRAP_URL_TEMPLATE = "aerial_pages/bootstrap/texture_{page_x}_{page_y}.webp"

# Ordered from cheapest/farthest to most detailed.  Each KTX2 contains a full
# mip chain. High fits the WebGL2 4096 minimum maximum texture size directly;
# there is no WebP or parallel fallback asset.
TEXTURE_TIERS = (
    {"name": "low", "role": "postage", "size_px": 128},
    {"name": "medium", "role": "medium", "size_px": 256},
    {"name": "high", "role": "high", "size_px": 4096},
)
TEXTURE_TIER_SIZES = {tier["name"]: tier["size_px"] for tier in TEXTURE_TIERS}


def _tier_encoding(block_width, block_height):
    """Return one intentionally complete sweep-verified tier setting."""
    block = f"{block_width}x{block_height}"
    return {
        "codec": f"xuastc-ldr-{block}",
        "block_width": block_width,
        "block_height": block_height,
        "basisu_flag": f"-ldr_{block}i",
        "quality": 90,
        "effort": 4,
    }


def _all_tiers(block_width, block_height):
    # Spell out all production tiers in the contract so a future change to a
    # single tier cannot silently inherit an unrelated default.
    return {
        "low": _tier_encoding(block_width, block_height),
        "medium": _tier_encoding(block_width, block_height),
        "high": _tier_encoding(block_width, block_height),
    }


# Verified by docs/reports/aerial-codec-sweep-2026-07-15.md. Profile names are
# stable CLI/cache identifiers; labels may be made friendlier without forcing a
# rebake. The production default favors page residency because several global
# pages may be live at once.
TEXTURE_ENCODING_PROFILES = {
    "production": {
        "label": "Production / residency",
        "tiers": _all_tiers(8, 6),
    },
    "balanced": {
        "label": "Balanced / high fidelity",
        "tiers": _all_tiers(6, 6),
    },
    "close-inspection": {
        "label": "Close inspection",
        "tiers": _all_tiers(4, 4),
    },
}
DEFAULT_TEXTURE_ENCODING_PROFILE = "production"
TEXTURE_CODEC = TEXTURE_ENCODING_PROFILES[DEFAULT_TEXTURE_ENCODING_PROFILE]["tiers"]["high"]["codec"]


def texture_encoding_profile(profile_name=None):
    """Return a named encoding profile or fail with the supported names."""
    name = profile_name or DEFAULT_TEXTURE_ENCODING_PROFILE
    try:
        return TEXTURE_ENCODING_PROFILES[name]
    except KeyError as exc:
        supported = ", ".join(TEXTURE_ENCODING_PROFILES)
        raise ValueError(f"Unknown texture encoding profile {name!r}; choose one of: {supported}") from exc


def texture_encoding_for_tier(profile_name, tier_name, effort_override=None):
    """Return the exact basisu settings for one profile/tier pair."""
    profile = texture_encoding_profile(profile_name)
    try:
        encoding = dict(profile["tiers"][tier_name])
    except KeyError as exc:
        supported = ", ".join(profile["tiers"])
        raise ValueError(f"Unknown texture tier {tier_name!r}; choose one of: {supported}") from exc
    if effort_override is not None:
        effort = int(effort_override)
        if effort < 0 or effort > 10:
            raise ValueError("basisu effort override must be between 0 and 10")
        encoding["effort"] = effort
    return encoding


def manifest_texture_page_contract(
    pages,
    recipe_version=None,
    encoding_profile=None,
    encoding_effort=None,
    diagnostic_tattoos=False,
    page_vertical_bounds=None,
    page_padding_stats=None,
):
    """Return the geometry-independent global square imagery contract."""
    from texture_page_grid import CRS, ORIGIN_X_M, ORIGIN_Y_M, PAGE_SIZE_M

    version = recipe_version or TEXTURE_PAGE_RECIPE_VERSION
    profile_name = encoding_profile or DEFAULT_TEXTURE_ENCODING_PROFILE
    profile = texture_encoding_profile(profile_name)
    effective_settings = {
        tier_name: texture_encoding_for_tier(
            profile_name, tier_name, effort_override=encoding_effort
        )
        for tier_name in profile["tiers"]
    }
    tier_encoding = {
        tier_name: {key: value for key, value in settings.items() if key != "basisu_flag"}
        for tier_name, settings in effective_settings.items()
    }
    codecs = {settings["codec"] for settings in effective_settings.values()}
    if len(codecs) != 1:
        raise ValueError("The browser contract currently requires one XUASTC block size across all tiers")
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
        "codec": next(iter(codecs)),
        "encoding_profile": {
            "name": profile_name,
            "label": profile["label"],
            "source_report": "docs/reports/aerial-codec-sweep-2026-07-15.md",
            "tiers": tier_encoding,
        },
        "mip_chain": "full",
        "diagnostic_tattoos": bool(diagnostic_tattoos),
        "url_template": TEXTURE_PAGE_URL_TEMPLATE,
        "bootstrap": {
            "container": "webp",
            "role": "transient-first-paint",
            "size_px": TEXTURE_BOOTSTRAP_SIZE,
            "gpu_bytes": TEXTURE_BOOTSTRAP_SIZE * TEXTURE_BOOTSTRAP_SIZE * 4,
            "url_template": TEXTURE_BOOTSTRAP_URL_TEMPLATE,
        },
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
