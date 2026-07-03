#!/usr/bin/env python3
"""
Does hex-coupled paging ever beat square paging on RESIDENT CONTAINER AREA
(the VRAM proxy: GPU bytes follow full rectangle, confirmed empirically)?

Fair comparison: square tile area == hex area == 1.0 (same ground granularity).
A square tile costs 1.0 resident. A hex costs its AABB bounding box = 1.3333
(regular hexagon fills 0.75 of its box), and each hex is its own KTX2 so
neighbor overlaps are double-counted in VRAM -- faithful to the masked scheme.

A cell is "needed" iff some in-view point lands in it. We sample the view
densely and count distinct touched square cells and hex cells, sweeping the
view across random offsets relative to both grids.
"""
import numpy as np

HEX_FILL = 0.75               # regular hexagon area / AABB
HEX_BOX  = 1.0 / HEX_FILL     # 1.3333 resident cost per touched hex
S = np.sqrt(2.0 / (3.0 * np.sqrt(3.0)))  # hex side so hex area == 1.0

def hex_ids_flat_top(x, y):
    """Axial cube-rounded flat-top hex id for points (x,y), hex area == 1."""
    q = (2.0 / 3.0 * x) / S
    r = (-1.0 / 3.0 * x + np.sqrt(3.0) / 3.0 * y) / S
    xs, zs = q, r
    ys = -xs - zs
    rx, ry, rz = np.round(xs), np.round(ys), np.round(zs)
    dx, dy, dz = np.abs(rx - xs), np.abs(ry - ys), np.abs(rz - zs)
    fixx = (dx > dy) & (dx > dz)
    fixz = (~fixx) & (dz > dy)
    rx = np.where(fixx, -ry - rz, rx)
    rz = np.where(fixz, -rx - ry, rz)
    return np.round(rx).astype(np.int64) * 100003 + np.round(rz).astype(np.int64)

def trial(W, H, ox, oy, n=600):
    gx = ox + (np.arange(n) + 0.5) / n * W
    gy = oy + (np.arange(n) + 0.5) / n * H
    X, Y = np.meshgrid(gx, gy)
    X, Y = X.ravel(), Y.ravel()
    sq = np.floor(X).astype(np.int64) * 100003 + np.floor(Y).astype(np.int64)
    n_sq = np.unique(sq).size
    n_hx = np.unique(hex_ids_flat_top(X, Y)).size
    return n_sq * 1.0, n_hx * HEX_BOX, n_sq, n_hx

rng = np.random.default_rng(7)
sizes = [1.0, 1.5, 2.0, 3.0, 4.0, 6.0, 8.0, 12.0]  # square view side, in tile units
OFFS = 120

print(f"hex side S={S:.4f}  hex AABB cost={HEX_BOX:.4f}x  (square tile area=hex area=1.0)\n")
print(f"{'view(tiles)':>11} | {'sq area':>8} {'hex area':>8} {'hex/sq':>7} {'hexwin%':>7} | "
      f"{'sq files':>8} {'hex files':>9} {'hexwin%':>7}")
print("-" * 88)
for L in sizes:
    sa = ha = sf = hf = 0.0
    hexwin_area = hexwin_files = 0
    for _ in range(OFFS):
        ox, oy = rng.uniform(0, 5), rng.uniform(0, 5)
        a_s, a_h, c_s, c_h = trial(L, L, ox, oy)
        sa += a_s; ha += a_h; sf += c_s; hf += c_h
        hexwin_area  += a_h < a_s
        hexwin_files += c_h < c_s
    sa/=OFFS; ha/=OFFS; sf/=OFFS; hf/=OFFS
    print(f"{L:>11.1f} | {sa:>8.2f} {ha:>8.2f} {ha/sa:>7.3f} {100*hexwin_area/OFFS:>6.0f}% | "
          f"{sf:>8.1f} {hf:>9.1f} {100*hexwin_files/OFFS:>6.0f}%")

# Also: the absolute floor -- ideal area is L*L. How much does each OVER-fetch?
print("\nover-fetch vs ideal L*L (mean):")
for L in [1.0, 2.0, 4.0, 8.0]:
    sa = ha = 0.0
    for _ in range(OFFS):
        ox, oy = rng.uniform(0, 5), rng.uniform(0, 5)
        a_s, a_h, _, _ = trial(L, L, ox, oy)
        sa += a_s/(L*L); ha += a_h/(L*L)
    print(f"  view {L:.0f}x{L:.0f}: square {sa/OFFS:.2f}x ideal,  hex {ha/OFFS:.2f}x ideal")
