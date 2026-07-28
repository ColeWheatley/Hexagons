# @atlas: Avalanche-layer constants: paths, mosaic frame, release-gate thresholds, energy-line parameter draws, and the harmonized hazard byte contract (NODATA 0 / simulated-none 1 / severity 2..127 / bit7 release).
import os
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]

# --- Inputs -----------------------------------------------------------------
DGM_PATH = Path(
    os.environ.get(
        "POWFINDER_DGM",
        "/Users/cole/dev/PowFinder/backend/terrains/DGM_Tirol_5m_epsg31254_2006_2020.tif",
    )
)
TILE_MANIFEST = REPO / "frontend/app/tile_manifest.json"

# L1 centroid table produced under task #7. Preferred: one file
#   snow_backend/data/l1_centroids.npy  -> float64 (n_tiles, 2401, 2), EPSG:31254
#   (x, y), heap order, tile order = tile_manifest.json tiles[].
# Per-tile variant also accepted: snow_backend/data/l1_centroids_<t>.npy with
# <t> the manifest tile index. If neither exists, centroids.py self-generates
# from the manifest + hex_backend/coordinate_utility.py (parity-validated).
CENTROID_FILE = REPO / "snow_backend/data/l1_centroids.npy"
CENTROID_TILE_PATTERN = str(REPO / "snow_backend/data/l1_centroids_{t}.npy")

# Optional forest raster (EPSG:31254, any resolution; >0.1 = forest). None -> no
# forest gating (documented over-prediction in the 1500-2200 m band).
FOREST_PATH = os.environ.get("POWFINDER_FOREST") or None

# --- Working/output dirs ----------------------------------------------------
WORK_DIR = Path(os.environ.get("AVALANCHE_WORK", REPO / "snow_backend/avalanche_work"))
CACHE_DIR = WORK_DIR / "cache"
OUT_DIR = WORK_DIR / "out"  # sidecars land in OUT_DIR/avalanche/YYYY/MM/DD/HH.pfl

# --- Mosaic frame (EPSG:31254, 5 m grid) ------------------------------------
CELL = 5.0
# Reach margin around the 197-tile footprint so out-of-footprint releases that
# can run INTO the beta area are seeded (4 km covers ~1.6 km of drop at 22 deg).
REACH_MARGIN_M = 4000.0
TILE_HALF_M = 551.0  # manifest geometry.tile_source_footprint_half_m

# --- Release gate (parity with avalanchers compute_release_areas.wgsl) ------
GATE_MIN_SLOPE_DEG = 28.0
GATE_MAX_SLOPE_DEG = 60.0
GATE_MIN_ELEV_M = 1500.0
GATE_MAX_VRM = 0.01
GATE_MAX_FOREST = 0.1

# --- Zones ------------------------------------------------------------------
ZONE_MIN_AREA_M2 = 20_000.0   # 2 ha  (repo case-filter floor)
ZONE_MAX_AREA_M2 = 600_000.0  # 60 ha (split above this)

# --- Slab handling ----------------------------------------------------------
SLAB_MIN_M = 0.05  # cells below this do not release
SLAB_MAX_M = 3.0

# --- Energy-line (fallback backend) -----------------------------------------
# Alpha (angle-of-reach) draws per regime, degrees. Draw 0 is the base value.
ALPHA_DRAWS_DRY = (24.0, 22.0, 26.0)
ALPHA_DRAWS_WET = (28.0, 26.0, 30.0)
# Runout grade is log-scaled in the energy margin and saturates here
# (margin 1 m -> 0.11, 10 m -> 0.37, 100 m -> 0.72, 600 m -> 1.0).
GRADE_FULL_MARGIN_M = 600.0

# --- Hazard byte, harmonized contract (2026-07-29, team-lead) ---------------
# byte 0            NODATA (off-DEM / outside domain / not simulated)
# byte 1            simulated, no hazard (severity floor, release=0)
# bits 0-6          severity: runout cells 2..127, release cells 1..127
# bit 7             release-zone flag
# Raw 128 (release=1, severity=0) is INVALID and never emitted: release
# severity is clamped to >= 1. Runout severity is clamped to >= 2 so it can
# never alias the "simulated, no hazard" value.
BYTE_NODATA = 0
BYTE_SIMULATED_NONE = 1
BYTE_RELEASE_FLAG = 128
RUNOUT_SEVERITY_MIN = 2
BYTE_SLAB_FULL_M = 2.5  # slab-derived release *intensity* saturation

# --- PFL sidecar container ---------------------------------------------------
# 32-byte PFL1 header + tileCount x 2401 body (manifest tile order).
# Enum values below must stay byte-identical with the snowpack writer
# (coordinated with snowpack-design, who owns index.json).
PFL_VERSION = 1
PFL_LAYER_ID_AVALANCHE = 3
PFL_ENCODING_PACKED_BITS = 2
PFL_AGGREGATE_MAX = 1
EMIT_HOUR = 12  # daily cadence emits one step at 12:00 local

# --- Winter retrospective ---------------------------------------------------
RETRO_START = "2025-11-01"
RETRO_END = "2026-05-01"  # exclusive

TILE_BYTES = 2401  # 7^4 L1 hexes per L5 tile, heap order
