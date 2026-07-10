"""Shared bake/manifest contract for Gosper aerial texture assets.

The browser consumes only KTX2 payloads encoded as XUASTC LDR 6x6.  Keeping
the tier names, dimensions, and URL shape in this small backend module prevents
the baker and generated manifest from drifting apart.  Runtime storage policy
(web versus a future bundled app) deliberately does not belong here.
"""

TEXTURE_RECIPE_VERSION = "3.0.0"
TEXTURE_CODEC = "xuastc-ldr-6x6"
TEXTURE_CONTAINER = "ktx2"
TEXTURE_URL_TEMPLATE = "aerial_tiles/{tier}/gosper_{yq}_{yr}.ktx2"

# Ordered from cheapest/farthest to most detailed.  Each KTX2 contains a full
# mip chain. High fits the WebGL2 4096 minimum maximum texture size directly;
# there is no WebP or parallel fallback asset.
TEXTURE_TIERS = (
    {"name": "low", "role": "postage", "size_px": 128},
    {"name": "medium", "role": "medium", "size_px": 256},
    {"name": "high", "role": "high", "size_px": 4096},
)
TEXTURE_TIER_SIZES = {tier["name"]: tier["size_px"] for tier in TEXTURE_TIERS}


def manifest_texture_contract(world_side_m, recipe_version=None, diagnostic_tattoos=False):
    """Return the JSON-ready texture contract embedded in the tile manifest."""
    return {
        "recipe_version": recipe_version or TEXTURE_RECIPE_VERSION,
        "cache_key": recipe_version or TEXTURE_RECIPE_VERSION,
        "container": TEXTURE_CONTAINER,
        "codec": TEXTURE_CODEC,
        "mip_chain": "full",
        "world_side_m": float(world_side_m),
        "url_template": TEXTURE_URL_TEMPLATE,
        "diagnostic_tattoos": bool(diagnostic_tattoos),
        "tiers": [dict(tier) for tier in TEXTURE_TIERS],
    }
