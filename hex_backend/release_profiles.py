"""Authoritative release-profile names shared by bake and manifest publication.

Coverage must be selected by a named profile.  In particular, a manifest's
extent is evidence about an already-selected profile, never the way the
runtime decides whether it is beta or production.
"""

from __future__ import annotations


RELEASE_PROFILE_SCHEMA_VERSION = 1

RELEASE_PROFILES = {
    "beta-stubai": {
        "mode": "beta",
        "coverage_profile": "stubai-small-square",
    },
    # This is deliberately a named selection slot, not a Tirol-wide fallback.
    # A production bake must receive its approved bounds explicitly.
    "production-selected-tirol": {
        "mode": "production",
        "coverage_profile": "selected-tirol",
    },
    # Rechner production coverage is not a hand-drawn rectangle.  The durable
    # run inventory records the validated orthophoto/DEM intersection.
    "production-tirol": {
        "mode": "production",
        "coverage_profile": "validated-tif-dem-intersection",
    },
}


def manifest_release_descriptor(profile_name: str) -> dict[str, object]:
    """Return the canonical manifest release descriptor for ``profile_name``."""
    try:
        profile = RELEASE_PROFILES[profile_name]
    except KeyError as exc:
        choices = ", ".join(sorted(RELEASE_PROFILES))
        raise ValueError(
            f"Unknown release profile {profile_name!r}; choose one of: {choices}"
        ) from exc
    return {
        "schema_version": RELEASE_PROFILE_SCHEMA_VERSION,
        "profile": profile_name,
        "mode": profile["mode"],
        "coverage_profile": profile["coverage_profile"],
    }
