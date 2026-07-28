"""Solar geometry + clear-sky GHI (numpy; used by the forcing-pack builder).

NOAA low-precision solar position — adequate at 1 h / 17 m scales (verified:
19.56 deg solstice noon elevation at 47N vs 19.5 expected).
"""

from __future__ import annotations

import numpy as np

SOLAR_CONST = 1361.0  # W m-2


def sun_vector_enu(lat_deg, lon_deg, times_utc):
    """ENU unit sun vector(s) for datetime64 times.  Returns [..., 3] (E, N, up)."""
    t = np.asarray(times_utc, dtype="datetime64[s]")
    doy = (t.astype("datetime64[D]") - t.astype("datetime64[Y]")).astype(float) + 1.0
    hour = (t - t.astype("datetime64[D]")).astype("timedelta64[s]").astype(float) / 3600.0
    g = 2.0 * np.pi / 365.0 * (doy - 1.0 + (hour - 12.0) / 24.0)
    decl = (0.006918 - 0.399912 * np.cos(g) + 0.070257 * np.sin(g)
            - 0.006758 * np.cos(2 * g) + 0.000907 * np.sin(2 * g)
            - 0.002697 * np.cos(3 * g) + 0.00148 * np.sin(3 * g))
    eqtime = 229.18 * (0.000075 + 0.001868 * np.cos(g) - 0.032077 * np.sin(g)
                       - 0.014615 * np.cos(2 * g) - 0.040849 * np.sin(2 * g))
    tst = hour * 60.0 + eqtime + 4.0 * lon_deg
    ha = np.deg2rad(tst / 4.0 - 180.0)
    lat = np.deg2rad(lat_deg)
    sin_el = np.sin(lat) * np.sin(decl) + np.cos(lat) * np.cos(decl) * np.cos(ha)
    el = np.arcsin(np.clip(sin_el, -1.0, 1.0))
    az = np.arctan2(np.sin(ha),
                    np.cos(ha) * np.sin(lat) - np.tan(decl) * np.cos(lat)) + np.pi
    return np.stack([np.sin(az) * np.cos(el),
                     np.cos(az) * np.cos(el),
                     np.sin(el)], axis=-1).astype(np.float32)


def pressure_at_elevation(p_msl_Pa, elev_m):
    """Standard-atmosphere reduction of MSL pressure to elevation."""
    return p_msl_Pa * (1.0 - 0.0065 * elev_m / 288.15) ** 5.2559


def clearsky_ghi(sun_up, p_msl_Pa, elev_m=0.0):
    """Meinel-style clear-sky GHI using elevation-corrected pressure."""
    mu = np.maximum(sun_up, 0.0)
    airmass = 1.0 / np.maximum(mu, 0.02)
    p = pressure_at_elevation(p_msl_Pa, elev_m)
    tau = 0.75 ** ((p / 101325.0) * airmass ** 0.678)
    return (SOLAR_CONST * mu * tau).astype(np.float32)
