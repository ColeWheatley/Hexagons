"""Physics + downscaling parameters.  A flat NamedTuple of python floats so it
jits as static constants; the CALIBRATABLE tuple names the ~8 scalars the
station-column calibration harness optimizes (see calibrate.py).
"""

from __future__ import annotations

from typing import NamedTuple

NL = 5                     # snow layers
NSOIL = 2
NLAYERS = NL + NSOIL
DT = 3600.0                # s
TM = 273.15                # K
CI = 2100.0                # J kg-1 K-1 ice
CW = 4180.0                # J kg-1 K-1 water
LF = 0.334e6               # J kg-1 fusion
LS = 2.834e6               # J kg-1 sublimation
RHO_W = 1000.0
RHO_ICE = 917.0
SIGMA = 5.670374419e-8
G = 9.81
RD = 287.05
CP = 1005.0

# canonical layer thickness targets (m), surface down; last takes remainder
CANONICAL_DZ = (0.1, 0.2, 0.4, 0.8)


class Theta(NamedTuple):
    # --- calibratable (8) ---
    lapse_K_per_m: float = -0.0065
    precip_beta_per_m: float = 5.0e-4
    precip_mult: float = 1.0
    phase_center_C: float = 0.7
    albedo_cold_tau_h: float = 1000.0
    albedo_melt_tau_h: float = 100.0
    turb_exchange: float = 2.3e-3       # neutral bulk coefficient C_H = C_E
    cloud_emiss: float = 0.963
    # --- fixed ---
    phase_halfwidth_C: float = 0.5
    precip_factor_lo: float = 0.7
    precip_factor_hi: float = 1.8
    albedo_max: float = 0.85
    albedo_cold_min: float = 0.70
    albedo_melt_min: float = 0.55
    albedo_refresh_kg: float = 10.0
    ground_albedo: float = 0.15
    emissivity: float = 0.98
    z0_ref_wind_m: float = 10.0         # INCA wind height
    w_irr: float = 0.05                 # irreducible liquid / pore volume
    rho_max: float = 550.0
    rho_min: float = 50.0
    eta0_Pa_s: float = 3.7e7            # Anderson viscosity prefactor
    eta_c_T: float = 0.081
    eta_c_rho: float = 0.018
    meta_c0: float = 2.778e-6
    meta_c_T: float = 0.04
    meta_c_rho: float = 0.046
    soil_dz1_m: float = 0.2
    soil_dz2_m: float = 1.0
    soil_cvol: float = 2.0e6            # J m-3 K-1
    soil_k: float = 1.2                 # W m-1 K-1
    swe_present_kgm2: float = 0.1       # snow-presence threshold
    # weak-layer heuristics
    facet_grad_K_per_m: float = 20.0
    facet_cloud_max: float = 0.3
    facet_wind_max: float = 4.0
    facet_hours_min: float = 12.0
    burial_hn24_mm: float = 8.0
    # SQH v1 weights
    sqh_fresh_efold_mm: float = 30.0    # HN72 e-folding
    sqh_soft_rho_hi: float = 250.0
    sqh_soft_rho_lo: float = 100.0
    sqh_base_cm: float = 40.0


CALIBRATABLE = ("lapse_K_per_m", "precip_beta_per_m", "precip_mult",
                "phase_center_C", "albedo_cold_tau_h", "albedo_melt_tau_h",
                "turb_exchange", "cloud_emiss")
