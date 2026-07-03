# Texture Container Shape: Findings & Decision

_Last updated: 2026-07-03_

This note records what we learned from the non-rectangular texture experiments
(`ktx2_nonrect_texture_test/` and its `production_zoom/` sub-study) and the
architectural decision that falls out of them. It is the "why" behind how the
terrain engine should page texture data.

## The question

The terrain renders as hexagons on a shared world-metric grid
(EPSG:31254 meters, via `coordinate_utility`). Texture data has to reach those
hexes somehow. The tempting idea: deliver textures **shaped to the hexagons** —
a rectangular KTX2 with everything outside the owned hex masked to a constant
color ("lock/key" tiles) — and pin them to the hex coordinate system. The hope
was to minimize **network + RAM + VRAM all at once** while keeping a single
shared coordinate system, by never downloading a whole rectangle just because
one hex clips its corner.

The experiments were built to find out whether that hope survives contact with
real GPUs and real imagery. It does not.

## The hard invariants (the physics that won't move)

1. **GPU compressed textures (ASTC/BC7) are rectangular, fixed block size, fully
   resident.** The whole `W×H` rectangle plus its mip chain occupies VRAM
   regardless of content. There is no sparse skipping of constant-color blocks.
2. **WebGL2 does not expose sparse / virtual textures.** The one technique that
   _would_ make masked-out regions free in VRAM is unavailable in this stack.
   (Software-emulating it is just "a physical atlas + page table," i.e. the
   rectangular-tile answer below taken to its extreme.)
3. **KTX2 download cost ≈ content entropy.** Constant fill (black or debug pink)
   compresses to almost nothing on the wire.

Consequence, stated once: **masking can only ever buy bandwidth, never VRAM.**
Everything below is that sentence, measured.

## What the experiments found

### Toy (`ktx2_nonrect_texture_test/`)
Two half-coverage tiles sharing one 1024² coordinate system, masked to black.
- Black fill is **~free on the wire** — doubling container area added ~5% to KTX2
  bytes.
- Black fill is **full price in VRAM** — the masked pair cost ~2× the GPU bytes of
  two honest half-rectangles.
- A debug-pink probe compressed the same as black and cost identical VRAM,
  confirming it's the **rectangle dimensions**, not the color, that set both costs.

### Production zoom, real Tirol aerial imagery (`production_zoom/`)
Square-grid patches vs hex-aligned patches cut from a real 18,750×15,000 @ 0.2 m/px
mosaic, across LOD zoom states. For centered 16:9 views, **hex loses on every axis**:
- **VRAM ~1.3× worse, persistently** (e.g. 52.9 vs 40.5 MiB at LOD 24). That is the
  hexagon-fills-75%-of-its-bounding-box geometry: `1 / 0.75 = 1.333×`.
- **Download penalty shrinks with LOD but never inverts** — 21% worse at LOD 3,
  3% worse at LOD 24 (pink is cheap; the extra _file count_ is what hurts at low LOD).
- **More files / requests at every level.**

### Geometry crossover sweep (`production_zoom/edge_crossover.py`)
The production study only measured _centered_ views and left open whether
off-center / frustum-edge cases might rescue hex paging. A pure 2D Monte Carlo
(no `basisu`/TIFs) settles it by sweeping a view rectangle across **random offsets**
against both grids, at equal granularity (hex area == square tile area):

```
view(tiles) |  sq area  hex area  hex/sq  hex-wins
        1.0 |     4.00     5.68    1.42x      0%
        2.0 |     9.00    12.68    1.41x      0%
        4.0 |    24.96    34.92    1.40x      0%
        8.0 |    80.92   111.09    1.37x      0%
       12.0 |   168.89   229.79    1.36x      0%
```

- **Hex-coupled never wins on resident VRAM — any size, any offset.**
- The small-view regime we _hoped_ would rescue it is hex's **worst** case (1.42×),
  not its best. It converges toward the pure 1.333× fill tax as views grow.
- Both schemes over-fetch the same perimeter at the frustum edge (square 4.0× ideal
  vs hex 5.7× ideal at a 1×1 view); hex simply pays 1.33× on top of identical waste.
- **Granularity is a red herring:** to fit the frustum more tightly you use _smaller
  squares_ (tighter fit, zero tax), not hexes. The square model checks out exactly —
  a unit view on a unit grid touches `(1+1)² = 4.00` tiles.

## Decision: rectangular LOD tile pyramid in the shared world frame

**"Same coordinate system" never required "hex-shaped tiles."** The registration we
actually need is the shared **world-meter frame** that `coordinate_utility` already
maps both axial hexes and rectangular tiles into. UV-sampling a hex into a
rectangular tile preserves that registration at **zero** VRAM cost. The stronger
property — "every tile spans the identical full rectangle" — is exactly what costs
the 1.33–2×.

So the all-axis minimum is:

> A quadtree / clipmap pyramid of power-of-two KTX2 tiles in world-meter space;
> hexes reference into it by UV. This is what `waffle_iron`'s rectangular webp
> tiles already imply, formalized as a streaming pyramid and moved to KTX2.

The "a boundary hex needs two tiles" worry is a non-issue: both tiles are already
resident because both are in-frustum; you pay it only at the very frustum edge
(perimeter, ∝ √N, small).

If per-hex eviction granularity is ever wanted from the `cache_manager` LRU, the
right move is a **hex-bounding-box atlas** — pack neighbor hexes' tight boxes into
one rectangular KTX2 so each hex's empty corners are filled by the neighbor's
content (hexagon content tiles the plane perfectly; the 25% waste only exists when
you isolate a single hex). Address hexes by UV sub-rect. Note this is just a
rectangular tile with a hex-aware UV map — it collapses back into the recommendation
with extra bookkeeping.

## Side project bookmark: NVIDIA NTC

A bespoke implementation inspired by NVIDIA RTX Neural Texture Compression (NTC)
would be an excellent side project because it attacks the thing KTX2 masks cannot:
resident texture memory. It would be a custom shader/runtime path, not a minor
container swap, but it is exactly the kind of idea worth revisiting when the renderer
moves beyond WebGL2 constraints.

## The one surviving niche (probably not worth it)

Hex-coupled masking can only pay off for a **small, genuinely non-rectangular demand
set** — a thin diagonal/jagged ribbon of visible terrain where square paging's
over-fetch exceeds 1.33×. From the over-fetch floor, that bar is only cleared for
demand sets of ≲ 3–4 tiles. For any rectangular frustum it never clears. That is a
far smaller prize than "frustum edges," and almost certainly not worth the per-hex
file and VRAM overhead.

## Status of the test folders

- `ktx2_nonrect_texture_test/` — toy + `production_zoom/` real-imagery study. Source,
  generators, and result notes are lightweight enough to commit.
- Generated `.ktx2`, `.vrt`, and manifest assets are deliberately disposable; rerun the
  generators when a fresh browser/device matrix is needed.
- `texture_nonrect_test/` — empty earlier scaffold, superseded. Safe to delete.
- `production_zoom/edge_crossover.py` reproduces the sweep table above in well under a
  second with only numpy.
