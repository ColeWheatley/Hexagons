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

    def __init__(self, sidecar_dir, idx, valid, mosaic_shape):
        """idx/valid: the hexpack gather index ((n_tiles, 2401, k) flat mosaic
        cell indices + validity). The scatter inverts it: each hex writes its
        sampled cells. Cells no hex covers — the 4 km reach margin outside the
        197-tile footprint, whose release zones exist precisely to throw
        hazard INTO the footprint — are filled from the nearest hex-covered
        cell (one-time EDT; geometry is static)."""
        self.dir = Path(sidecar_dir)
        self.idx = idx
        self.valid = valid
        self.shape = mosaic_shape
        covered = np.zeros(mosaic_shape, dtype=bool)
        covered.ravel()[idx[valid]] = True
        from scipy.ndimage import distance_transform_edt

        near = distance_transform_edt(
            ~covered, return_distances=False, return_indices=True
        )
        self._near_flat = (near[0] * mosaic_shape[1] + near[1]).ravel()

    def _read_layer(self, when, layer):
        # PFL convention: <base>/<layer>/YYYY/MM/DD/HH.pfl (32 B header + body).
        from . import pfl

        p = (self.dir / layer / f"{when.year:04d}" / f"{when.month:02d}"
             / f"{when.day:02d}" / f"{getattr(when, 'hour', config.EMIT_HOUR):02d}.pfl")
        if not p.exists():
            raise FileNotFoundError(f"no {layer} sidecar: {p}")
        return pfl.read_sidecar(p)["body"]

    def _to_mosaic(self, hex_vals, dtype):
        """(n_tiles, 2401) hex values -> 5 m mosaic: scatter each hex onto its
        sampled cells, then nearest-hex fill for the uncovered margin."""
        flat = np.zeros(self.shape[0] * self.shape[1], dtype=dtype)
        expand = np.broadcast_to(hex_vals[..., None], self.idx.shape)
        flat[self.idx[self.valid]] = expand[self.valid]
        return flat[self._near_flat].reshape(self.shape)

    def fields_for(self, when, dem):
        from snow_backend import pfl_enums

        # Ratified decode (snowpack-design pins, 2026-07-29): `slab` is
        # slab-above-active-weak-layer (the quantity the simulator wants, NOT
        # total snow depth); `wet` is the surface-wetness state layer (class
        # 3 = wet; the `surface` layer's class 4 is CRUST, never use it here).
        slab_b = self._read_layer(when, "slab")  # u8_linear [0, 508] cm
        wet_b = self._read_layer(when, "wet")    # u8_class WET_CLASSES
        lo, hi, _units = pfl_enums.U8_LINEAR_DOMAINS["slab"]
        slab_hex = (np.nan_to_num(pfl_enums.u8_linear_decode(slab_b, lo, hi)) / 100.0
                    ).astype(np.float32)
        wet_hex = (wet_b == pfl_enums.WET_CLASS_WET).astype(np.uint8)

        slab = self._to_mosaic(slab_hex, np.float32)
        wet = self._to_mosaic(wet_hex, np.uint8).astype(bool)
        return dict(
            slab=slab, wet=wet,
            meta=dict(
                synthetic=False, source=str(self.dir),
                margin_fill="nearest-hex EDT",
                slab_hex_p50_cm=round(float(np.percentile(slab_hex, 50)) * 100, 1),
                wet_hex_frac=round(float(wet_hex.mean()), 4),
            ),
        )


def retro_dates():
    d0 = date.fromisoformat(config.RETRO_START)
    d1 = date.fromisoformat(config.RETRO_END)
    out = []
    d = d0
    while d < d1:
        out.append(d)
        d += timedelta(days=1)
    return out
