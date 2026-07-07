# @atlas: Core coordinate mathematics and projection logic. Defines fundamental unit hex constants (32px, 0.2m/px), sector bounds (1024x1024 or 4096px, 819.2m), and provides utilities for converting between universal unit axial (q, r) and world meters (x, y) with standard flat-top orientation support.
import math
import numpy as np

# =============================================================================
# PIXEL-FIRST CONSTANTS (UNIT-BASED)
# =============================================================================
UNIT_HEX_PX = 32.0           # Exactly 32 pixels flat-to-flat
METERS_PER_PIXEL = 0.2       # The "Tirol Truth"

# Scale Factors (Visual / LOD)
UNIT_HEX_WIDTH_METERS = UNIT_HEX_PX * METERS_PER_PIXEL  # 6.4 meters exactly

# SECTOR DEFINITION (Rectangular Bins)
# User mentioned expecting 1024x1024.
# If we want the "High Res" (1/4 scale) to be exactly 1024px:
# 1024 * 4 = 4096 pixels for Full Res.
# 4096 pixels * 0.2 m/pixel = 819.2 meters.
SECTOR_SIZE_METERS = 819.2 
SECTOR_PIXELS = 4096 # 819.2 / 0.2

# Directions (Source of Truth: Flat Top, North Start, Clockwise)
NORTH = 0      # +r (Axial 0, 1)
NORTH_EAST = 1 # (Axial 1, 0)
SOUTH_EAST = 2 # (Axial 1, -1)
SOUTH = 3      # (Axial 0, -1)
SOUTH_WEST = 4 # (Axial -1, 0)
NORTH_WEST = 5 # (Axial -1, 1)

def get_hex_dimensions():
    """
    Returns the calculated dimensions of the hexes based on pixel constants.
    """
    return {
        'sector_width_m': SECTOR_SIZE_METERS,
        'unit_hex_width_m': UNIT_HEX_WIDTH_METERS,
        'unit_hex_radius_m': UNIT_HEX_WIDTH_METERS / math.sqrt(3),
        'pixels_per_unit_hex': UNIT_HEX_PX,
        'texture_size_px': SECTOR_PIXELS
    }

def axial_to_world_meters(q, r):
    """
    Converts Universal Unit Axial (q, r) to World Meters (x, y).
    Standard Flat Top Orientation:
    - q axis points ~East/South-East
    - r axis points North
    """
    h = UNIT_HEX_WIDTH_METERS
    world_x = (q * (math.sqrt(3)/2) * h)
    world_y = (r * h + q * 0.5 * h)
    return world_x, world_y
    
def world_meters_to_axial_approx(x, y):
    """
    Finds the nearest q,r for a given x,y.
    """
    h = UNIT_HEX_WIDTH_METERS
    A = (math.sqrt(3)/2 * h)
    q = x / A
    r = (y - (q * 0.5 * h)) / h
    return q, r 

def world_meters_to_axial_scale(x, y, s):
    """
    Finds the nearest q,r for a given x,y at Scale s.
    """
    eff_h = UNIT_HEX_WIDTH_METERS * s
    A = (math.sqrt(3)/2 * eff_h)
    q = x / A
    r = (y - (q * 0.5 * eff_h)) / eff_h
    return q, r 

def round_axial(q, r):
    x_cube = q
    z_cube = r
    y_cube = -q - r
    rx, ry, rz = round(x_cube), round(y_cube), round(z_cube)
    x_diff, y_diff, z_diff = abs(rx - x_cube), abs(ry - y_cube), abs(rz - z_cube)
    if x_diff > y_diff and x_diff > z_diff: rx = -ry - rz
    elif y_diff > z_diff: ry = -rx - rz
    else: rz = -rx - ry
    return int(rx), int(rz)

def world_to_sector_id(x, y):
    sx = math.floor(x / SECTOR_SIZE_METERS)
    sy = math.floor(y / SECTOR_SIZE_METERS)
    return sx, sy

def sector_id_to_bounds_meters(sx, sy):
    min_x = sx * SECTOR_SIZE_METERS
    min_y = sy * SECTOR_SIZE_METERS
    max_x = min_x + SECTOR_SIZE_METERS
    max_y = min_y + SECTOR_SIZE_METERS
    return min_x, min_y, max_x, max_y

def get_sector_center(sx, sy):
    min_x, min_y, max_x, max_y = sector_id_to_bounds_meters(sx, sy)
    return (min_x + max_x) * 0.5, (min_y + max_y) * 0.5

def get_hexes_in_bbox(min_x, max_x, min_y, max_y, padding_m=0.0):
    min_x -= padding_m
    max_x += padding_m
    min_y -= padding_m
    max_y += padding_m
    corners = [(min_x, min_y), (max_x, min_y), (max_x, max_y), (min_x, max_y)]
    qs, rs = [], []
    for cx, cy in corners:
        fq, fr = world_meters_to_axial_approx(cx, cy)
        qs.append(fq); rs.append(fr)
    for q in range(int(min(qs)) - 2, int(max(qs)) + 2):
        for r in range(int(min(rs)) - 2, int(max(rs)) + 2):
            wx, wy = axial_to_world_meters(q, r)
            if min_x <= wx <= max_x and min_y <= wy <= max_y: yield (q, r)

def get_lod_grid_hexes_in_bbox(min_x, max_x, min_y, max_y, scale_factor, padding_m=0.0):
    eff_h = UNIT_HEX_WIDTH_METERS * scale_factor
    A = (math.sqrt(3)/2 * eff_h)
    
    # STRICT BOUNDS: Do not use padding for Center Containment.
    # Otherwise neighboring sectors generate the same hex multiple times (overlap).
    # padding_m parameter is kept for signature compatibility but ignored for clipping.
    
    def to_prime(x, y):
         q = x / A
         r = (y - (q * 0.5 * eff_h)) / eff_h
         return q, r
    corners = [(min_x, min_y), (max_x, min_y), (max_x, max_y), (min_x, max_y)]
    qs, rs = [], []
    for cx, cy in corners:
        q, r = to_prime(cx, cy)
        qs.append(q); rs.append(r)
    found = []
    
    # Iterate a slightly wider integer range to catch edges, but strict clip on centers
    for q in range(int(min(qs)) - 2, int(max(qs)) + 2):
        for r in range(int(min(rs)) - 2, int(max(rs)) + 2):
            wx = q * dx_dq_scaled(scale_factor)
            wy = r * dy_dr_scaled(scale_factor) + q * dy_dq_scaled(scale_factor)
            
            # STRICT Check against Sector Bounds
            # Use < max to ensure exclusive upper bound (prevent double ownership at exact boundary)
            if min_x <= wx < max_x and min_y <= wy < max_y:
                found.append((q, r, wx, wy))
    return found

def dx_dq_scaled(s): return (math.sqrt(3)/2) * (UNIT_HEX_WIDTH_METERS * s)
def dy_dq_scaled(s): return 0.5 * (UNIT_HEX_WIDTH_METERS * s)
def dy_dr_scaled(s): return UNIT_HEX_WIDTH_METERS * s

# =============================================================================
# GOSPER FRACTAL MATH — 1:1 mirror of frontend/app/gosper_core.js.
# Any change here MUST be reflected there; tests/gosper/run_parity.sh diffs
# the two implementations' full level-5 output.
#
# M(q,r) = (2q - r, q + 3r) is multiplication by the Eisenstein integer
# (2 + w): area x7 and, under THIS module's axial->world mapping, an exact
# similarity (scale sqrt(7), rotation +19.10660535 deg CCW, north-up).
# The older diagnostic matrix (2q + r, -q + 3r) is a similarity only for a
# mirrored axial convention — under ours it shears. Do not resurrect it.
# =============================================================================
GOSPER_TILE_LEVEL = 5              # streaming tile = level-5 island, 7^5 unit hexes
GOSPER_ROT_PER_LEVEL = math.atan2(math.sqrt(3) / 2, 5 / 2)  # radians, +19.1066 deg
GOSPER_DEPTH_COUNTS = [1, 7, 49, 343, 2401, 16807]

# Child order everywhere: Center, N, NE, SE, S, SW, NW (+r = north).
GOSPER_NEIGHBORS = [
    (0, 0), (0, 1), (1, 0), (1, -1), (0, -1), (-1, 0), (-1, 1),
]

def gosper_mul_m(q, r):
    return (2 * q - r, q + 3 * r)

def gosper_mul_m_inv_exact(q, r):
    nq, nr = 3 * q + r, -q + 2 * r
    if nq % 7 != 0 or nr % 7 != 0:
        raise ValueError(f"({q},{r}) is not on the M lattice")
    return (nq // 7, nr // 7)

def gosper_mul_m_pow(q, r, k):
    for _ in range(k):
        q, r = gosper_mul_m(q, r)
    return (q, r)

def generate_gosper_offsets(level, debug=False):
    """
    Heap-ordered unit-hex offsets of a level-`level` island from its center.
    Index digits are big-endian base-7: node (depth d, index i) has children
    (d+1, 7i..7i+6); child 0 is concentric with its parent.
    """
    cur = [(0, 0)]
    for l in range(1, level + 1):
        nxt = []
        for j, (nq, nr) in enumerate(GOSPER_NEIGHBORS):
            sq, sr = gosper_mul_m_pow(nq, nr, l - 1)
            if debug and l == level:
                print(f"Level {l}, child {j}: base({nq},{nr}) -> shift({sq},{sr})")
            nxt.extend((p[0] + sq, p[1] + sr) for p in cur)
        cur = nxt
    return cur

def gosper_parent(q, r):
    """Flower center (on the M lattice) whose 7-cell covers cell (q, r).
    Returns (parent_q, parent_r, child_index, lattice_q, lattice_r)."""
    fq, fr = (3 * q + r) / 7, (-q + 2 * r) / 7
    cq, cr = round_axial(fq, fr)
    for dq, dr in GOSPER_NEIGHBORS:
        yq, yr = cq + dq, cr + dr
        pq, pr = gosper_mul_m(yq, yr)
        d = (q - pq, r - pr)
        if d in GOSPER_NEIGHBORS:
            return (pq, pr, GOSPER_NEIGHBORS.index(d), yq, yr)
    raise RuntimeError(f"gosper_parent({q},{r}): no flower found (impossible)")

def gosper_lattice_to_center(yq, yr):
    return gosper_mul_m_pow(yq, yr, GOSPER_TILE_LEVEL)

def gosper_center_to_lattice(q, r):
    for _ in range(GOSPER_TILE_LEVEL):
        q, r = gosper_mul_m_inv_exact(q, r)
    return (q, r)

def gosper_tile_of_unit(q, r):
    """Lattice coords of the L5 tile owning unit cell (q, r). Each
    gosper_parent step descends into lattice coordinates (the flower's
    address), where the next-level grouping is the same flower pattern."""
    for _ in range(GOSPER_TILE_LEVEL):
        _, _, _, q, r = gosper_parent(q, r)
    return (q, r)

def gosper_level_size(k):
    """Effective flat-to-flat width (m) of a level-k cap."""
    return UNIT_HEX_WIDTH_METERS * (7 ** (k / 2.0))
