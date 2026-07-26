# Replacing the 1.15× Aggregate-Cap Overscan

_Design investigation, 2026-07-26. No code changed. Everything below is marked
VERIFIED (read from code / computed) or INFERRED._

## 1. Why cracks happen — the exact geometry

### The setup

Same-level caps tile the plane exactly: level-k cap centers form a hex lattice
with pitch `gosper_level_size(k) = 6.4·√7^k` m, and each cap is a hexagon of
exactly that flat-to-flat width (`gosper_visibility_adapter.js:142`,
`coordinate_utility.py:232-234`). VERIFIED. So there is never a crack *within*
a ring, or between two refined regions, or between two unrefined regions.

The CDLOD cut is per-parent: a level-(k+1) node P **draws** iff
`dist(P) > R(k)` and **refines** (its 7 level-k children draw) iff
`dist(P) ≤ R(k)` — the shader evaluates the identical distance for both tests
(`main.js:2499-2525`, radii wired per level at `main.js:5201-5203`). VERIFIED.
So a ring boundary is always the same local configuration: a **refined**
parent A (drawing the "flower" of its 7 child hexes) next to an **unrefined**
parent B (drawing one big hex). The flower and the big hex have equal area
(both = 7 child hexes) but different shapes — the flower is the 1st-iteration
approximation of the fractal Gosper island, the big hex is the 0th-iteration —
and the big hex is rotated `GOSPER_ROT_PER_LEVEL = atan2(√3/2, 5/2) ≈
19.1066°` relative to the child lattice (`coordinate_utility.py:163`).

The crack is precisely `H_A \ F_A`: the part of A's ideal hexagonal territory
that A's flower fails to cover. B stops exactly at the shared ideal edge, so
nothing draws in those pockets. (The dual regions where the flower overshoots
into B produce only benign overlap.) Because "one level finer" is always the
flower-of-7 shape regardless of depth, the crack geometry is **scale-invariant
and identical at every ring**.

### The minimum overscan factor (computed)

Monte-Carlo computation (4M samples; child flat-to-flat = 1; parent
flat-to-flat = √7, rotated +19.1066°; hexagon membership via the 3-axis gauge
`max|p·n_i| / inradius`, edge normals at 30°/90°/150° matching the
CircleGeometry orientation in `main.js:1660`):

| quantity | value |
|---|---|
| Pocket area (uncovered fraction of parent hex) | **7.15 %** |
| Flower overshoot area (overlap fraction) | 7.12 % |
| Max pocket depth perpendicular to the ideal edge | 0.189 child flat-to-flats |
| **f_min if only the coarse (unrefined) side inflates** | **1.1425** |
| f_min if the fine side's caps inflate too (rings ≥ L1/L2) | 1.0998 |
| f_min if only the fine side inflates (coarse stays 1.0) | 1.333 |

Multi-level gaps (e.g. resident-tile L3 meeting a non-resident L5 horizon cap
at the residency frontier) converge to the same number: coarse-side f_min =
1.1423 / 1.1428 / 1.1427 for 1-, 2-, 3-level gaps (3M samples each). The
fractal wiggles get finer but not deeper.

**Conclusion: the empirical 1.15 was almost exactly minimal — the true
requirement is ≈1.143 (supremum; Monte-Carlo max slightly underestimates, so
treat 1.145 as the derived constant with margin).** It is neither wasteful nor
unsafe; the binding case is the L0/L1 ring, because unit caps are pinned to
1.0 for skirt continuity (`tile_worker.js:598`,
`coordinate_utility.py:278`) so the coarse side must do all the covering
there. The 1.0998 figure shows a *split* scheme (inflate both sides ~10%)
buys almost nothing. The key derived fact for alternatives: **only the coarse
side of a ring boundary ever needs inflation, and only within one
coarse-pitch of the boundary.**

Note: a fourth copy of the constant exists as a default parameter —
`gosper_page_binding_adapter.js:4` still defaults `capOverscan = 1.15`
(currently overridden by the 1.0 experiment via `main.js:1963`). Any fix must
account for four sites, not three.

## 2. Why skirts don't already cover it

VERIFIED from code:

1. **Hidden while moving, by owner contract.** `main.js:1611`
   (`g.children[1].visible = !forceCoarse`) and `main.js:4430-4431`
   ("Aggregate skirts only render when settled — moving mode is large
   SKIRTLESS caps"). Any pan/orbit/zoom shows raw ring boundaries with no
   skirts at all — and moving mode is when LOD rings sweep across terrain,
   i.e. exactly when boundaries are most on-screen. (Mitigating fact: while
   moving, the cut is a *uniform* L3 (`main.js:1592-1614`), so cross-level
   ring cracks don't exist in the interior; the residency frontier L3-vs-L5
   boundary still does.)
2. **Skirts have zero projected area top-down.** They are vertical quads
   hanging from the cap edge (`makeSkirtGeometry`, `main.js:1704-1750`).
   From above — the map's primary reading angle — a plan-view coverage hole
   shows background through, skirt or no skirt.
3. **Skirts collapse entirely in 2D mode.** The skirt drop is
   `animH − dVal·uHeightFactor` (`main.js:2584`) and D9 (GOSPER_DESIGN.md:151-157)
   animates `uHeightFactor → 0` top-down. In 2D the field is coplanar caps
   only; every pocket is naked.
4. **Skirts hang at the wrong place anyway.** B's skirt hangs at B's
   *uninflated* hex edge; the pocket lies beyond it, inside A's territory.
   Obliquely a deep skirt wall happens to occlude the pocket (which is why
   settled 3D looks sealed today), but that is occlusion luck, not coverage:
   an uphill-facing boundary viewed from below can still show sky through the
   pocket between B's wall and A's children.

So skirts are a *silhouette* sealant for height steps, and only when settled
and in 3D. They cannot be the plan-coverage mechanism. Making them one
(always-visible, outward-flaring "aprons") would break the owner's
moving-mode contract and still fail in 2D.

## 3. Ranked candidates

### C1 — Targeted shader-side inflation of coarse boundary caps (RECOMMENDED)

Inflate cap vertices **in the vertex shader**, only for coarse caps within one
pitch of their ring's near edge, by the derived 1.145.

The shader already has everything needed: `instDist` and `uLodRadii.x`
(= R(k−1), this level's near edge) are computed per instance
(`main.js:2508-2520`). A level-j cap can have a refined same-level neighbor
only if `instDist ≤ uLodRadii.x + pitch_j` (neighbor center at most one pitch
away, and neighbors refine iff their own distance ≤ R(j−1)). So, caps only
(`isCap` branch, `main.js:2534`):

```glsl
float f = 1.0 + 0.145 * (1.0 - smoothstep(uLodRadii.x, uLodRadii.x + uPitch, instDist));
transformed.xz *= f;   // before instanceMatrix is applied
```

`uPitch` = `levelSize(j)`, a per-level constant beside `uLodRadii`. Level 0
excluded (units stay exact). The residency-frontier case (resident L3 vs
horizon L5) needs the same treatment on the horizon-mesh material or on the
L5 root cap when adjacent tiles are resident — the multi-level f_min is the
same 1.143.

- **Closes the crack?** Yes, in exactly the configurations global overscan
  closed (same factor, same side, same mechanism — coverage by the coarse
  cap's fringe), it just stops paying for it away from boundaries.
- **World footprint?** *Unchanged at 1.0 everywhere that matters.* Instance
  matrices, visibility bounds, bake geometry, and
  `computeGosperSourceFootprint` all stay 1.0; the inflation exists only in
  clip-space-bound vertex positions. The inflated fringe samples the global
  world-registered pages ~14.5% of a cap circumradius past the ideal edge —
  but that region is the *neighbor's* territory, whose imagery exists. Only
  at the true survey edge does it sample nothing, and that is now black by
  policy (commit `2b05658`). Caveat: page *binding* must still enumerate
  pages the fringe can touch, so the `capOverscan` passed at `main.js:1963`
  should stay ≈1.145 (binding slack is metadata, not bake work). INFERRED
  from the page-binding architecture; verify no per-island UV clamp remains.
- **Cost:** ~4 shader ALU per cap vertex, one uniform per level. No new
  instances, buffers, draw calls, or bake work.
- **Skirt interaction:** skirts are the non-cap branch and untouched; the cap
  fringe overlaps like today's overscan fringe did (coplanar-ish, same
  imagery — the shipped aesthetic per GOSPER_DESIGN.md:87-94). Works
  identically moving and settled, 2D and 3D.
- **Risk / blast radius:** one shader edit in `main.js` + one uniform; the
  three (four) mirrored constants become *bake-side 1.0 permanently*; only
  the page-binding call keeps a derived slack constant. Main risk is the
  band test being conservative (inflates a one-pitch annulus even where the
  neighbor didn't actually refine) — harmless, that's still ≥7× less
  inflated area than global overscan, and only overlap, never gap.

### C2 — Depressed parent underlay ("horizontal skirt") at boundaries

Instead of inflating B, let refined parents near the ring *also* draw their
own cap, pushed down by their subtree `downExtent` so it sits strictly under
their children and shows only through the pockets. Shader-only: relax the
parent self-test to `instDist > uLodRadii.x − uPitch` and subtract
`downExtent·uHeightFactor` when in that inner band (relief data is already
per-instance, `tile_worker.js:648-652`).

- **Closes the crack?** Yes — pockets are inside H_A by construction, and
  H_A itself covers them. Zero inflation of anything; the only fix here with
  literally no footprint growth, not even screen-space.
- **Why ranked second:** the underlay is a *full* parent cap drawn beneath 7
  children (overdraw of a whole flower per boundary parent, vs a thin fringe
  in C1); in 2D (`uHeightFactor → 0`) the depression collapses and it
  becomes a coplanar double-draw (benign per D9, but relies on that
  argument); and "visible only through pockets" depends on the children
  actually being above `hMean − downExtent`, which is true by the extent
  contract (GSP3 bounds, `GOSPER_DESIGN.md:60-77`) but adds a correctness
  dependency C1 doesn't have. Slightly more shader surface, same blast
  radius otherwise. A good fallback if C1's fringe sampling proves ugly.

### C3 — Keep global overscan, but at the derived constant (status quo, justified)

The computation above shows 1.15 was not a fudge — it is the near-exact
minimum 1.143 + 0.6% margin. If simplicity wins, keep global overscan,
document the derivation, and set all four sites to a named
`GOSPER_MIN_RING_OVERSCAN = 1.145`. The bake-cost argument is already 90%
dead: the expensive smearing stage is deleted and overhang is black
(`2b05658`), and black overhang only occurs at the survey boundary.
Remaining real costs: survey-edge caps visibly overhang into black, and
far-field overlap/overdraw everywhere. Acceptable, but C1 strictly dominates
it for one shader edit.

### C4 — Transition ring of level-k hexes / boundary double-refine

Draw the near-edge *children of unrefined parents* as an extra exact-tiling
ring. Geometrically perfect (children tile exactly with the refined side),
no inflation. But: those children must be *built and resident* one pitch past
R(k) — a worker/planner/residency change (`gosper_geometry_selection`,
prebuild margins at `main.js:3424`), not a shader change; at the L4/L5 ring
that means building L4 buffers ~830 m past 60 km for tiles that may not have
geometry loaded at all. High blast radius across the worker/main split for
the same visual result as C1. Not worth it.

### C5 — Geometric stitching / shared boundary vertices / zippers

Cross-level neighbors have incommensurate vertex sets: √7 scale ratio, 19.1°
relative rotation, and a *fractal* true boundary — there is no finite shared
vertex set to weld (GOSPER_DESIGN.md:178-180 already records this: "no exact
solution"). Any zipper needs per-boundary dynamic geometry, destroying the
two-shared-BufferGeometry instancing architecture (`main.js:2315-2345`).
Reject.

### C6 — Snap LOD boundaries to Gosper flower boundaries

Already effectively the case: the cut is per-parent, so the boundary already
lies exactly on parent-hex/flower outlines. The crack *is* the
hex-vs-fractal-island approximation error, not misalignment; there is no
better place to put the boundary. No-op.

### C7 — Geomorphing (classic CDLOD)

Geomorphing reconciles *height* discontinuities by lerping elevations across
the band. This crack is a *plan-shape* mismatch (hexagon vs flower outline);
morphing heights cannot create horizontal coverage. Morphing child *positions
and radii* toward the parent hex shape would smear world-registered texture
sampling and reintroduce a footprint question. Reject.

### C8 — Conservative rasterization / depth tricks

No portable WebGL2 conservative raster; `gl_FragDepth` tricks don't create
coverage where no primitive exists. Reject.

## 4. Recommendation

**C1: distance-banded coarse-cap inflation in the vertex shader, factor
1.145, band width one pitch, with all bake/footprint constants permanently at
1.0** (page-binding slack kept at 1.145).

First implementation step: in the `main.js` vertex shader patch
(`main.js:2493` block), after the CDLOD cut and inside the `isCap` branch,
add the two-line band inflation using a new `uCapBoundaryPitch` uniform wired
next to `uLodRadii` (`main.js:2430-2435` and `main.js:4558-4561`); leave
`tile_worker.js:15`, `coordinate_utility.py:165`,
`gosper_visibility_adapter.js:12` at 1.0; restore `main.js:1963`'s
`capOverscan` argument to 1.145 for page binding only.

Visual verification, cheapest first:
1. The running 1.0 Stubai bake should *already* show the predicted cracks:
   pockets ≈7% of area along every ring boundary, max width ≈0.19 of a
   fine-cap width (≈3.2 m at the 2 km L0/L1 ring, ≈8.5 m at the 5 km L1/L2
   ring) — thin dark zigzag arcs at fixed camera distances. Confirming that
   validates the whole model.
2. With C1 applied: top-down 2D at each band edge (2/5/10/25/60 km) — no
   background pixels along ring arcs; oblique 3D settled and moving; survey
   edge — confirm no imagery overhang beyond boundary caps actually in a
   band.
3. A/B against global 1.15: screenshots should be pixel-identical *at* ring
   boundaries and strictly less overlapped elsewhere.

## 5. What I could not determine

- **Page-binding slack correctness** (INFERRED): whether
  `computeGosperSourceFootprint`'s AABB is used anywhere that would *reject*
  fringe samples (per-island UV clamp or page-grid intersection that assumes
  1.0). `GOSPER_DESIGN.md:146` says `uv = local_xz/980 + 0.5` per island —
  if any per-island 980 m canvas clamp survives in the current global-pages
  path, the L5 root cap's fringe (≈80 m past canvas) needs the binding slack.
  Settle by reading the `piston_hex_global_pages_v5` fragment patch and
  page-binding code end-to-end.
- **Monte-Carlo vs supremum**: 1.1425/1.1428 are sample maxima; an analytic
  bound on the flower-corner pockets would pin the exact supremum. 1.145
  carries the practical margin; a denser boundary-focused sampling (cheap)
  would tighten it if 1.15-vs-1.145 ever matters.
- **Horizon-mesh boundary** (INFERRED): whether the horizon L5 instances
  visibly abut resident tiles' finer cuts closely enough for the frontier
  crack to matter (haze/fog at 25-60 km may already hide it). Settle
  visually in the current 1.0 experiment.
- **Whether the 1.0 experiment's cracks are objectionable at all**: at ≥2 km,
  3 m pockets may be sub-pixel at many view scales. If the owner looks at the
  Stubai bake and cannot find them, C3-at-1.0 ("do nothing") becomes a real
  option — but the geometry says they exist, ~7% of every ring boundary's
  area, and they will be widest (and lowest-altitude-visible) at the L0/L1
  ring closest to the camera.
