"""Capability-oriented execution profiles for Hexagons bakes.

These settings describe resource ceilings, not release coverage.  Coverage is
recorded independently in the durable run inventory so a machine profile can
never silently expand a release.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass


@dataclass(frozen=True)
class ExecutionProfile:
    name: str
    geometry_workers: int
    texture_workers: int
    upload_workers: int
    geometry_queue_depth: int
    texture_queue_depth: int
    upload_queue_depth: int
    ram_limit_gib: int
    reserve_ram_gib: int
    cuda_policy: str
    progressive_upload: bool
    require_full_corpus: bool

    def descriptor(self) -> dict[str, object]:
        return asdict(self)


EXECUTION_PROFILES = {
    # Conservative defaults for the 16 GiB Apple Silicon development machine.
    "mac-small": ExecutionProfile(
        name="mac-small",
        geometry_workers=1,
        texture_workers=1,
        upload_workers=1,
        geometry_queue_depth=1,
        texture_queue_depth=1,
        upload_queue_depth=2,
        ram_limit_gib=10,
        reserve_ram_gib=4,
        cuda_policy="disabled",
        progressive_upload=False,
        require_full_corpus=False,
    ),
    # Three concurrent BasisU processes used ~25.5 logical cores in the first
    # Rechner sample while leaving headroom for compositing, the OS, and I/O.
    "rechner-big": ExecutionProfile(
        name="rechner-big",
        geometry_workers=12,
        texture_workers=3,
        upload_workers=4,
        geometry_queue_depth=24,
        texture_queue_depth=6,
        upload_queue_depth=16,
        ram_limit_gib=48,
        reserve_ram_gib=12,
        cuda_policy="measured-only",
        progressive_upload=True,
        require_full_corpus=True,
    ),
}


def execution_profile(name: str) -> ExecutionProfile:
    try:
        return EXECUTION_PROFILES[name]
    except KeyError as exc:
        choices = ", ".join(EXECUTION_PROFILES)
        raise ValueError(f"Unknown execution profile {name!r}; choose one of: {choices}") from exc
