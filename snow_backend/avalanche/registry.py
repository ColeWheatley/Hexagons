# @atlas: Snowpack inputs for the avalanche layer: SidecarRegistry reads task-8 heap-order sidecars when they exist; SyntheticRegistry is a clearly-labeled deterministic stand-in (pseudo-storm slab series + seasonal wet line) so the pipeline runs end-to-end before the snowpack backfill lands. Registry density is deliberately never exposed.
import hashlib
from datetime import date, timedelta
from pathlib import Path

import numpy as np

from . import config


class SyntheticRegistry:
    """Deterministic synthetic slab/wetness fields, labeled synthetic=True.

    Slab: pseudo-storm series (storms every ~6 days, seeded by date so reruns
    are identical) with 15%/day settling decay and a linear elevation factor.
    Wetness: cells below a seasonal wet line (rises 1200 m Nov -> 3200 m May).
    This is scaffolding for pipeline bring-up and scrubbing demos, NOT snow
    science; swap for SidecarRegistry when task-8 sidecars exist.
    """

    synthetic = True

    def __init__(self, start=config.RETRO_START):
        self.start = date.fromisoformat(start)
        # Precompute the storm series once for the whole winter (365 d cap).
        rng = np.random.default_rng(
            int.from_bytes(hashlib.sha256(b"powfinder-synthetic-v1").digest()[:8], "big")
        )
        days = 365
        hn = np.zeros(days)
        d = 0
        while d < days:
            gap = rng.integers(4, 9)
            d += int(gap)
            if d < days:
                hn[d] = rng.uniform(0.15, 0.6)  # storm new-snow at 1500 m [m]
        slab = np.zeros(days)
        for i in range(1, days):
            slab[i] = slab[i - 1] * 0.85 + hn[i]
        self.slab_series = np.clip(slab, 0.0, None)
        self.hn_series = hn

    def _day_index(self, when):
        return (when - self.start).days

    def fields_for(self, when, dem):
        """Returns dict(slab, wet, meta) on the mosaic grid for date `when`."""
        i = max(0, self._day_index(when))
        base = float(self.slab_series[min(i, len(self.slab_series) - 1)])
        elev_factor = 1.0 + np.clip((dem - 1500.0) / 2000.0, 0.0, 1.0) * 0.5
        slab = np.clip(base * elev_factor, 0.0, config.SLAB_MAX_M).astype(np.float32)

        # Seasonal wet line: 1200 m on Nov 1 -> 3200 m by May 1, with a
        # deterministic +-300 m wobble for warm spells.
        frac = np.clip(i / 181.0, 0.0, 1.2)
        wobble = 300.0 * np.sin(i / 9.0)
        wet_line = 1200.0 + 2000.0 * frac + wobble
        wet = (dem < wet_line) & ~np.isnan(dem)

        return dict(
            slab=slab,
            wet=wet,
            meta=dict(
                synthetic=True,
                slab_base_1500m=round(base, 3),
                new_snow=round(float(self.hn_series[min(i, 364)]), 3),
                wet_line_m=round(float(wet_line), 0),
            ),
        )


class SidecarRegistry:
    """Reads the snowpack engine's heap-order sidecars (task 8 contract:
    hourly layers, 2,401 B/tile/layer, manifest tile order) and upsamples the
    L1 hex values to the 5 m mosaic via the precomputed hex->cell index.

    Note: consumes slab depth and surface wetness only. Snow DENSITY is
    intentionally not read — the simulator freezes density at 200 kg/m^3
    (samosAT freeze; see the avalanche design doc).
    """

    synthetic = False

    def __init__(self, sidecar_dir, hex_to_cells, mosaic_shape):
        self.dir = Path(sidecar_dir)
        self.hex_to_cells = hex_to_cells  # from hexpack.build_gather_index
        self.shape = mosaic_shape

    def _read_layer(self, when, layer):
        # PFL convention: <base>/<layer>/YYYY/MM/DD/HH.pfl (32 B header + body).
        from . import pfl

        p = (self.dir / layer / f"{when.year:04d}" / f"{when.month:02d}"
             / f"{when.day:02d}" / f"{getattr(when, 'hour', config.EMIT_HOUR):02d}.pfl")
        if not p.exists():
            raise FileNotFoundError(f"no {layer} sidecar: {p}")
        return pfl.read_sidecar(p)["body"]

    def fields_for(self, when, dem):
        depth_b = self._read_layer(when, "depth")    # u8_linear, domain [0,500] cm
        state_b = self._read_layer(when, "surface")  # u8_class, 4 = "wet"
        # Decode per index.json layer entries; exact byte->physical mapping to
        # be pinned with snowpack-design (nodata 0 excluded from both).
        slab_hex = np.where(
            depth_b > 0, depth_b.astype(np.float32) * (5.0 / 255.0), 0.0
        )  # 0..500 cm -> m
        wet_hex = state_b == 4

        slab = np.zeros(self.shape, dtype=np.float32)
        wet = np.zeros(self.shape, dtype=bool)
        for t in range(depth_b.shape[0]):
            for h, cells in enumerate(self.hex_to_cells[t]):
                slab.ravel()[cells] = slab_hex[t, h]
                wet.ravel()[cells] |= bool(wet_hex[t, h])
        return dict(slab=slab, wet=wet, meta=dict(synthetic=False))


def retro_dates():
    d0 = date.fromisoformat(config.RETRO_START)
    d1 = date.fromisoformat(config.RETRO_END)
    out = []
    d = d0
    while d < d1:
        out.append(d)
        d += timedelta(days=1)
    return out
