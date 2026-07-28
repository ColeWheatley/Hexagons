"""The hourly step: downscale -> semi-implicit SEB -> phase/percolation/
compaction -> accumulation -> canonical remap -> markers -> u8 outputs.

Pure jnp function of (state, forcing-hour, static, theta); no data-dependent
python control flow — everything is where/masked with fixed loop counts, per
the design doc (snowpack_engine_design.md sections 1, 4.2, 5.1).

Numerical scheme: backward-Euler heat conduction over 5 snow + 2 soil rows,
surface flux linearized about the previous surface temperature, 2 fixed
Newton outer iterations, Thomas solve unrolled over 7 rows.  Empty snow
layers become pass-through nodes (tiny capacity, tiny resistance) so one
uniform tridiagonal covers snow-on-ground and bare-ground columns alike.
"""

from __future__ import annotations

import jax.numpy as jnp

from params import (CANONICAL_DZ, CI, CP, CW, DT, G, LF, LS, NL, RD, RHO_ICE,
                    RHO_W, SIGMA, TM, Theta)
from state import NMARK, RING_H, SnowState

EPS_MASS = 0.01      # kg m-2: below this a layer counts as empty
TERRAIN_ALBEDO = 0.5


# ----------------------------------------------------------------- downscale
def _magnus_water_hPa(t_K):
    tc = t_K - TM
    return 6.112 * jnp.exp(17.62 * tc / (243.12 + tc))


def _magnus_ice_hPa(t_K):
    tc = t_K - TM
    return 6.112 * jnp.exp(22.46 * tc / (272.62 + tc))


def _wetbulb_stull_C(t_K, rh_pct):
    tc = t_K - TM
    rh = jnp.clip(rh_pct, 5.0, 99.0)
    return (tc * jnp.arctan(0.151977 * jnp.sqrt(rh + 8.313659))
            + jnp.arctan(tc + rh) - jnp.arctan(rh - 1.676331)
            + 0.00391838 * rh ** 1.5 * jnp.arctan(0.023101 * rh)
            - 4.686035)


def _pressure_col(p_msl, elev):
    return p_msl * (1.0 - 0.0065 * elev / 288.15) ** 5.2559


def _k_snow_calonne(rho):
    return 0.024 - 1.23e-4 * rho + 2.5e-6 * rho * rho


def downscale(fr, glcs_t, sun_t, cloud_t, static, th: Theta):
    """Per-tile forcing row -> per-column forcing.  fr: [n_tiles, 8] in
    (T2M,TD2M,RH2M,RR,GL,UU,VV,P0); returns dict of [N] + new cloud [tiles]."""
    tid = static.tile_of_col
    kt_t = jnp.clip(fr[:, 4] / jnp.maximum(glcs_t, 5.0), 0.0, 1.5)
    # kt ~0.9-1.0 on clear days (clear-sky model bias tolerant), ~0.2 overcast
    n_day = jnp.clip((1.0 - kt_t) / 0.7, 0.0, 1.0)
    cloud_new = jnp.where(sun_t[:, 2] > 0.05, n_day, cloud_t)

    t_a = fr[tid, 0] + th.lapse_K_per_m * static.dz_node
    rh = fr[tid, 2]
    e_a = _magnus_water_hPa(t_a) * jnp.clip(rh, 0.0, 100.0) / 100.0
    twb = _wetbulb_stull_C(t_a, rh)
    u = jnp.hypot(fr[tid, 5], fr[tid, 6])
    p_col = _pressure_col(fr[tid, 7], static.elev)

    pf = jnp.clip(1.0 + th.precip_beta_per_m * static.dz_node,
                  th.precip_factor_lo, th.precip_factor_hi)
    rr = fr[tid, 3] * pf * th.precip_mult
    f_snow = jnp.clip((th.phase_center_C + th.phase_halfwidth_C - twb)
                      / (2.0 * th.phase_halfwidth_C), 0.0, 1.0)
    snowf = rr * f_snow
    rain = rr - snowf

    s = sun_t[tid]                                   # [N, 3]
    kt = kt_t[tid]
    f_diff = jnp.clip(1.0 - 1.13 * kt, 0.15, 1.0)
    cos_inc = (static.n_east * s[:, 0] + static.n_north * s[:, 1]
               + static.n_up * s[:, 2])
    f_dir = jnp.where(s[:, 2] > 0.0,
                      jnp.maximum(cos_inc, 0.0) / jnp.maximum(s[:, 2], 0.02),
                      0.0)
    sw = fr[tid, 4] * ((1.0 - f_diff) * f_dir + f_diff * static.svf
                       + TERRAIN_ALBEDO * (1.0 - static.svf))

    w = 46.5 * e_a / t_a
    eps_cs = 1.0 - (1.0 + w) * jnp.exp(-jnp.sqrt(1.2 + 3.0 * w))
    n2 = jnp.clip(cloud_new[tid], 0.0, 1.0) ** 2
    eps = jnp.clip(eps_cs * (1.0 - n2) + th.cloud_emiss * n2, 0.65, 1.0)
    lw = eps * SIGMA * t_a ** 4

    return {"t_a": t_a, "e_a": e_a, "u": u, "p": p_col, "sw": sw, "lw": lw,
            "snowf": snowf, "rain": rain}, cloud_new


# ------------------------------------------------------- SEB + conduction
def _surface_flux_lin(ts, f, alb_eff, th: Theta):
    """Linearized surface energy balance about ts: returns (F0, lambda)."""
    rho_a = f["p"] / (RD * f["t_a"])
    ex0 = rho_a * th.turb_exchange * f["u"]
    ri = G * th.z0_ref_wind_m * (f["t_a"] - ts) / (f["t_a"] * f["u"] ** 2 + 0.1)
    f_stab = jnp.where(ri > 0.0, 1.0 / (1.0 + 10.0 * ri),
                       jnp.sqrt(1.0 - 16.0 * jnp.minimum(ri, 0.0)))
    ex = ex0 * jnp.clip(f_stab, 0.05, 3.0)

    p_hPa = f["p"] / 100.0
    q_a = 0.622 * f["e_a"] / p_hPa
    es_i = _magnus_ice_hPa(ts)
    q_s = 0.622 * es_i / p_hPa
    tc = ts - TM
    dqs = q_s * 22.46 * 272.62 / (272.62 + tc) ** 2

    sw_net = (1.0 - alb_eff) * f["sw"]
    lw_net = th.emissivity * (f["lw"] - SIGMA * ts ** 4)
    h_sens = CP * ex * (f["t_a"] - ts)
    le = LS * ex * (q_a - q_s)
    f0 = sw_net + lw_net + h_sens + le
    lam = 4.0 * th.emissivity * SIGMA * ts ** 3 + CP * ex + LS * ex * dqs
    e_flux = ex * (q_a - q_s)                        # kg m-2 s-1, + = deposition
    return f0, lam, e_flux


def _thomas7(a, b, c, d):
    """Solve 7-row tridiagonal per column; a/b/c/d: [7, N]."""
    cp = [c[0] / b[0]]
    dp = [d[0] / b[0]]
    for i in range(1, 7):
        m = b[i] - a[i] * cp[-1]
        cp.append(c[i] / m)
        dp.append((d[i] - a[i] * dp[-1]) / m)
    t = [dp[6]]
    for i in range(5, -1, -1):
        t.append(dp[i] - cp[i] * t[-1])
    return jnp.stack(t[::-1])                        # [7, N]


def solve_heat(state: SnowState, f, th: Theta):
    """2 fixed Newton outers of the backward-Euler 7-row solve.
    Returns (tsno', tsoil', e_flux at final linearization)."""
    mass = state.ice + state.liq
    nonempty = mass > EPS_MASS
    d_sn = jnp.where(nonempty, jnp.maximum(state.thick, 1e-3), 1e-4)
    rho = mass / d_sn
    k_sn = jnp.where(nonempty,
                     jnp.clip(_k_snow_calonne(rho), 0.02, 2.0), 40.0)
    c_sn = jnp.where(nonempty, jnp.maximum(CI * state.ice + CW * state.liq,
                                           100.0), 1.0)

    n = state.albedo.shape[0]
    d = jnp.concatenate([d_sn, jnp.full((1, n), th.soil_dz1_m),
                         jnp.full((1, n), th.soil_dz2_m)])
    k = jnp.concatenate([k_sn, jnp.full((2, n), th.soil_k)])
    c = jnp.concatenate([c_sn, jnp.full((1, n), th.soil_cvol * th.soil_dz1_m),
                         jnp.full((1, n), th.soil_cvol * th.soil_dz2_m)])
    t_old = jnp.concatenate([state.tsno, state.tsoil])

    g = 1.0 / (0.5 * d[:-1] / k[:-1] + 0.5 * d[1:] / k[1:])   # [6, N]
    zero = jnp.zeros((1, n))
    g_up = jnp.concatenate([zero, g])                # coupling above row i
    g_dn = jnp.concatenate([g, zero])                # coupling below row i

    swe = (state.ice + state.liq).sum(0)
    snow_present = swe > th.swe_present_kgm2
    alb_eff = jnp.where(snow_present, state.albedo, th.ground_albedo)

    t_sol = t_old
    e_flux = jnp.zeros(n)
    for _ in range(2):                               # fixed Newton outers
        ts = t_sol[0]
        f0, lam, e_flux = _surface_flux_lin(ts, f, alb_eff, th)
        row0 = jnp.zeros((7, n)).at[0].set(1.0)
        b = c / DT + g_up + g_dn + row0 * lam
        a = -g_up
        cc = -g_dn
        rhs = c / DT * t_old + row0 * (f0 + lam * ts)
        t_sol = _thomas7(a, b, cc, rhs)

    return t_sol[:NL], t_sol[NL:], e_flux, snow_present


# ------------------------------------------------- phase, water, compaction
def melt_refreeze(tsno, ice, liq):
    c_l = jnp.maximum(CI * ice + CW * liq, 1.0)
    melt = jnp.minimum(ice, jnp.maximum(tsno - TM, 0.0) * c_l / LF)
    tsno = tsno - melt * LF / c_l
    ice = ice - melt
    liq = liq + melt
    frz = jnp.minimum(liq, jnp.maximum(TM - tsno, 0.0) * c_l / LF)
    tsno = tsno + frz * LF / c_l
    ice = ice + frz
    liq = liq - frz
    return tsno, ice, liq, melt.sum(0)


def percolate(ice, liq, thick, rain_on_snow, th: Theta):
    inflow = rain_on_snow
    outs = []
    for l in range(NL):
        li = liq[l] + inflow
        cap = jnp.where(ice[l] > EPS_MASS,
                        th.w_irr * RHO_W
                        * jnp.maximum(thick[l] - ice[l] / RHO_ICE, 0.0), 0.0)
        out = jnp.maximum(li - cap, 0.0)
        outs.append(li - out)
        inflow = out
    return jnp.stack(outs), inflow                   # new liq, runoff mm


def compact(tsno, ice, liq, thick, th: Theta):
    mass = ice + liq
    has = ice > EPS_MASS
    rho = jnp.clip(mass / jnp.maximum(thick, 1e-4), th.rho_min, 900.0)
    above = jnp.cumsum(mass, axis=0) - 0.5 * mass
    sigma_ov = G * above
    eta = th.eta0_Pa_s * jnp.exp(th.eta_c_T * (TM - tsno) + th.eta_c_rho * rho)
    drho_v = rho * sigma_ov / eta * DT
    meta = (th.meta_c0 * jnp.exp(-th.meta_c_T * (TM - tsno))
            * jnp.where(rho < 150.0, 1.0,
                        jnp.exp(-th.meta_c_rho * (rho - 150.0)))
            * jnp.where(liq > 0.1, 2.0, 1.0))
    rho_new = jnp.clip(rho + drho_v + rho * meta * DT, th.rho_min, th.rho_max)
    return jnp.where(has, mass / rho_new, thick)


def accumulate(tsno, ice, liq, thick, albedo, f, snow_present, th: Theta):
    snowf = f["snowf"]
    rho_ns = jnp.clip(109.0 + 6.0 * (f["t_a"] - TM)
                      + 26.0 * jnp.sqrt(jnp.maximum(f["u"], 0.0)), 50.0, 250.0)
    c_old = jnp.maximum(CI * ice[0] + CW * liq[0], 1.0)
    c_add = CI * snowf
    t0 = (c_old * tsno[0] + c_add * jnp.minimum(f["t_a"], TM)) / (c_old + c_add)
    tsno = tsno.at[0].set(jnp.where(snowf > 0.0, t0, tsno[0]))
    ice = ice.at[0].add(snowf)
    thick = thick.at[0].add(snowf / rho_ns)

    melting = (tsno[0] >= TM - 0.1) & snow_present
    target = jnp.where(melting, th.albedo_melt_min, th.albedo_cold_min)
    tau = jnp.where(melting, th.albedo_melt_tau_h, th.albedo_cold_tau_h)
    albedo = albedo - (albedo - target) / tau \
        + (th.albedo_max - albedo) * jnp.minimum(1.0, snowf / th.albedo_refresh_kg)
    albedo = jnp.clip(albedo, 0.4, 0.9)
    return tsno, ice, liq, thick, albedo


# --------------------------------------------------------------- remap
def remap(tsno, ice, liq, thick):
    """Conservative remap of (ice, liq, enthalpy) onto the canonical profile."""
    mass = ice + liq
    thick = jnp.where(mass > EPS_MASS,
                      jnp.where(thick > 1e-4, thick, mass / 300.0), 0.0)
    h = thick.sum(0)

    rem = h
    targets = []
    for dz in CANONICAL_DZ:
        t = jnp.minimum(dz, rem)
        targets.append(t)
        rem = rem - t
    targets.append(rem)
    d_new = jnp.stack(targets)                       # [NL, N]

    zo = jnp.concatenate([jnp.zeros((1,) + h.shape), jnp.cumsum(thick, 0)])
    zn = jnp.concatenate([jnp.zeros((1,) + h.shape), jnp.cumsum(d_new, 0)])
    lo = jnp.maximum(zo[:-1, None, :], zn[None, :-1, :])
    hi = jnp.minimum(zo[1:, None, :], zn[None, 1:, :])
    frac = jnp.clip(hi - lo, 0.0, None) / jnp.maximum(thick[:, None, :], 1e-9)

    enth = jnp.maximum(CI * ice + CW * liq, 0.0) * (tsno - TM)
    ice_n = jnp.einsum("ijn,in->jn", frac, ice)
    liq_n = jnp.einsum("ijn,in->jn", frac, liq)
    ent_n = jnp.einsum("ijn,in->jn", frac, enth)
    c_n = jnp.maximum(CI * ice_n + CW * liq_n, 1.0)
    t_n = jnp.where(ice_n + liq_n > EPS_MASS, TM + ent_n / c_n, TM)
    return t_n, ice_n, liq_n, d_new


# --------------------------------------------------------------- markers
def update_markers(state: SnowState, tsno, ice, liq, thick, hn24,
                   snow_present, cloud_col, f, th: Theta):
    swe = (ice + liq).sum(0)
    mass = ice + liq
    t_rep = (tsno * mass).sum(0) / jnp.maximum(mass.sum(0), 1e-3)

    grad = (tsno[1] - tsno[0]) / jnp.maximum(0.5 * (thick[0] + thick[1]),
                                             0.05)
    cond = (snow_present & (grad > th.facet_grad_K_per_m)
            & (cloud_col < th.facet_cloud_max) & (f["u"] < th.facet_wind_max))
    facet_pot = jnp.where(cond, state.facet_pot + 1.0, state.facet_pot * 0.98)

    strength = state.m_strength
    swe_below = state.m_swe_below
    age = state.m_age
    active = (strength < 1.0) & (swe_below < swe - 0.5)
    strength = jnp.where(active,
                         strength + (1.0 / 240.0)
                         * jnp.exp(-(TM - t_rep) / 8.0)
                         * (1.0 + (swe - swe_below) / 300.0),
                         strength)
    age = jnp.where(active, age + 1.0, age)
    strength = jnp.where(swe_below >= swe, 2.0, strength)   # melt reached it

    near_surface = (active & (swe_below > swe - 30.0)).any(0)
    push = (snow_present & (facet_pot > th.facet_hours_min)
            & (hn24 > th.burial_hn24_mm) & ~near_surface)
    keep_value = jnp.where(active, 1.0 - strength, -1.0)
    slot = jnp.argmin(keep_value, axis=0)
    onehot = jnp.arange(NMARK)[:, None] == slot[None, :]
    sel = onehot & push[None, :]
    new_below = jnp.maximum(swe - hn24, 0.0)
    swe_below = jnp.where(sel, new_below, swe_below)
    strength = jnp.where(sel, 0.1, strength)
    age = jnp.where(sel, 0.0, age)
    facet_pot = jnp.where(push, 0.0, facet_pot)

    ob = jnp.where((strength < 1.0) & (swe_below < swe - 0.5),
                   swe - swe_below, jnp.inf)
    slab_swe = jnp.where(jnp.isfinite(ob.min(0)), ob.min(0), 0.0)
    return facet_pot, swe_below, strength, age, slab_swe


# --------------------------------------------------------------- outputs
def _u8lin(v, lo, hi, valid):
    b = 1.0 + jnp.round(jnp.clip((v - lo) / (hi - lo), 0.0, 1.0) * 254.0)
    return jnp.where(valid, b, 0.0).astype(jnp.uint8)


SURFACE_CLASSES = ["—", "powder", "settled", "wind slab", "crust",
                   "wet", "refrozen", "bare"]


def emit_outputs(ice, liq, thick, hn24, hn72, crust_age, slab_swe, valid,
                 th: Theta):
    swe = (ice + liq).sum(0)
    hs_cm = 100.0 * thick.sum(0)
    mass0 = ice[0] + liq[0]
    rho0 = jnp.where(mass0 > EPS_MASS,
                     mass0 / jnp.maximum(thick[0], 1e-4), 0.0)
    wetfrac = liq[0] / jnp.maximum(mass0, 1e-3)

    dry = wetfrac < 0.005
    moist = (wetfrac >= 0.005) & (wetfrac < 0.03)
    wet = wetfrac >= 0.03
    refrozen = (crust_age >= 1.0) & (crust_age <= 72.0) & dry
    wet_class = jnp.where(refrozen, 4.0,
                          jnp.where(wet, 3.0, jnp.where(moist, 2.0, 1.0)))

    snow_free = swe < 0.5
    surf = jnp.full(swe.shape, 2.0)                          # settled
    surf = jnp.where((crust_age > 72.0) & dry & (hn72 < 3.0), 4.0, surf)
    surf = jnp.where((hn72 > 3.0) & (rho0 >= 250.0) & dry, 3.0, surf)
    surf = jnp.where((hn72 > 10.0) & (rho0 < 180.0) & dry, 1.0, surf)
    surf = jnp.where(refrozen, 6.0, surf)
    surf = jnp.where(wet | moist, 5.0, surf)
    surf = jnp.where(snow_free, 7.0, surf)

    s_fresh = 1.0 - jnp.exp(-hn72 / th.sqh_fresh_efold_mm)
    s_soft = jnp.clip((th.sqh_soft_rho_hi - rho0)
                      / (th.sqh_soft_rho_hi - th.sqh_soft_rho_lo), 0.0, 1.0)
    s_dry = jnp.where(refrozen, 0.1,
                      jnp.where(wet, 0.15, jnp.where(moist, 0.5, 1.0)))
    s_base = jnp.clip(hs_cm / th.sqh_base_cm, 0.0, 1.0)
    sqh = 100.0 * s_fresh * s_soft * s_dry * s_base
    sqh = jnp.where(snow_free, 0.0, sqh)

    slab_cm = jnp.where(swe > 0.5, hs_cm * slab_swe / jnp.maximum(swe, 1.0), 0.0)

    out = {
        "sqh": _u8lin(sqh, 0.0, 100.0, valid),
        "depth": _u8lin(hs_cm, 0.0, 500.0, valid),
        "surface": jnp.where(valid, surf, 0.0).astype(jnp.uint8),
        "slab": _u8lin(slab_cm, 0.0, 508.0, valid),
        "hn24": _u8lin(hn24, 0.0, 254.0, valid),
        "hn72": _u8lin(hn72, 0.0, 254.0, valid),
        "wet": jnp.where(valid, wet_class, 0.0).astype(jnp.uint8),
        "sdens": _u8lin(rho0, 0.0, 1016.0, valid),
    }
    diag = {"hs_cm": hs_cm, "swe": swe}
    return out, diag


# --------------------------------------------------------------- full step
def step(state: SnowState, xs, static, th: Theta):
    """xs = (forcing_row [tiles,8], glcs [tiles], sun [tiles,3], t int)."""
    fr, glcs_t, sun_t, t = xs
    f, cloud_new = downscale(fr, glcs_t, sun_t, state.cloud, static, th)
    cloud_col = cloud_new[static.tile_of_col]

    # 1. implicit heat + surface balance
    tsno, tsoil, e_flux, snow_present = solve_heat(state, f, th)

    # 2. sublimation / deposition on the surface snow layer
    dm = e_flux * DT
    dep = jnp.maximum(dm, 0.0) * snow_present
    subl = jnp.minimum(state.ice[0], jnp.maximum(-dm, 0.0)) * snow_present
    ice = state.ice.at[0].add(dep - subl)
    ratio = (ice[0] + state.liq[0]) / jnp.maximum(state.ice[0] + state.liq[0],
                                                  1e-3)
    thick = state.thick.at[0].multiply(jnp.clip(ratio, 0.0, 2.0))

    # 3. melt / refreeze, percolation, compaction
    tsno, ice, liq, melt_mm = melt_refreeze(tsno, ice, state.liq)
    rain_on_snow = f["rain"] * snow_present
    runoff_ground = f["rain"] * (1.0 - snow_present)
    liq, runoff = percolate(ice, liq, thick, rain_on_snow, th)
    thick = compact(tsno, ice, liq, thick, th)

    # 4. accumulation + albedo, then canonical remap
    tsno, ice, liq, thick, albedo = accumulate(tsno, ice, liq, thick,
                                               state.albedo, f, snow_present,
                                               th)
    tsno, ice, liq, thick = remap(tsno, ice, liq, thick)
    swe_after = (ice + liq).sum(0)
    snow_present2 = swe_after > th.swe_present_kgm2
    albedo = jnp.where(snow_present2, albedo, 0.8)

    # 5. snowfall ring + HN trackers
    ring = state.ring.at[t % RING_H].set(f["snowf"])
    idx24 = (t - jnp.arange(24)) % RING_H
    idx48 = (t - jnp.arange(48)) % RING_H
    hn24 = jnp.take(ring, idx24, axis=0).sum(0)
    hn48 = jnp.take(ring, idx48, axis=0).sum(0)
    hn72 = ring.sum(0)

    # 6. crust bookkeeping
    mass0 = ice[0] + liq[0]
    wet_now = (liq[0] / jnp.maximum(mass0, 1e-3)) > 0.01
    refroze = (state.wet_prev > 0.5) & ~wet_now & (tsno[0] < TM - 0.05)
    crust_age = jnp.where(refroze, 1.0,
                          jnp.where(state.crust_age > 0.0,
                                    state.crust_age + 1.0, 0.0))
    # re-wetting or fresh snow ON the crust ends its life as the surface
    crust_age = jnp.where(wet_now | (f["snowf"] > 1.0), 0.0, crust_age)

    # 7. weak-layer markers
    facet_pot, m_below, m_str, m_age, slab_swe = update_markers(
        state, tsno, ice, liq, thick, hn24, snow_present2, cloud_col, f, th)

    out, diag = emit_outputs(ice, liq, thick, hn24, hn72, crust_age,
                             slab_swe, static.valid, th)
    diag = dict(diag, snowf=f["snowf"], rain=f["rain"], hn48=hn48,
                melt=melt_mm)

    new_state = SnowState(
        tsno=tsno, ice=ice, liq=liq, thick=thick, tsoil=tsoil,
        albedo=albedo, ring=ring, m_swe_below=m_below, m_strength=m_str,
        m_age=m_age, facet_pot=facet_pot, crust_age=crust_age,
        wet_prev=wet_now.astype(jnp.float32), cloud=cloud_new,
        runoff=state.runoff + runoff + runoff_ground,
        subl=state.subl + subl - dep,
    )
    return new_state, (out, diag)
