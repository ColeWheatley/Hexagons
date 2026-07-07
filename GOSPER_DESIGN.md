# Gosper Fractal Packing — Design & Justification

_Written 2026-07-07, branch `worktree-gosper`. This documents every decision
made during the full gosper integration, with the visual and performance
reasoning behind each, plus what was deliberately NOT done._

## What changed, in one paragraph

The terrain pipeline no longer thinks in 819.2 m rectangular sectors with four
uniform-scale hex layers. The streaming/storage/LOD unit is now a **level-5
Gosper island**: 7⁵ = 16,807 unit hexes (6.4 m), recursively grouped 7-at-a-
time into a 6-level aggregate tree. One `.bin` (`GSP1`) stores the tree as a
root height plus per-node decimeter offsets from the parent's reconstructed
value; one square KTX2 (980 m, 4096 px) textures the island. The renderer
draws every level of every resident island as instanced hex caps — scale
√7ᵏ, rotation k·19.1066° — and picks the level **per instance in the vertex
shader** with a hierarchical CDLOD cut driven by a single screen-space rule:
*a hex cap is refined when it grows past `hexTargetPx` on screen*. A
manifest-driven horizon mesh renders every baked island's level-5 aggregate
out to 60 km without fetching anything.

## The canonical math (and a chirality landmine)

- Matrix: **M(q,r) = (2q − r, q + 3r)** — multiplication by the Eisenstein
  integer (2+ω). Under this repo's axial→world convention it is an exact
  similarity: scale √7, rotation +19.1066°/level.
- The old diagnostic scripts (`test_gosper.py` / `test_gosper_js.mjs`) used
  `(2q + r, −q + 3r)`, which is conformal only for a *mirrored* axial
  convention — under ours it maps the two basis vectors to lengths √3·h and
  √13·h, i.e. **sheared islands**. Both scripts were rewritten against the
  canonical core. Byte-exact JS↔Python parity is enforced by
  `tests/gosper/run_parity.sh` (offsets, parents, tiling disjointness, int8
  ranges, conformality, heap-index geometry).
- Child order everywhere: `[C, N, NE, SE, S, SW, NW]`; heap order — node
  (depth d, index i) has children 7i..7i+6, child 0 concentric. Positions are
  **never stored**: index ⇄ offset is derived from one shared table
  (`gosper_core.js` = `coordinate_utility.py`, parity-tested).

## Decisions and why

### D1 — Tile = level-5 island (~830 m across, ~0.60 km²)
Matches the old sector's payload and fetch granularity almost exactly
(16,807 vs 16,384 unit hexes), so worker decode cost, LRU behavior and
network cadence carry over unchanged. L6 (4.2 km²) makes eviction too
coarse for phones; L4 (0.09 km²) explodes request count. The old
`lod_controller.js` fossil (`UNIT_HEX = 1000/7^2.5`) shows this exact sizing
was the original intent.

### D2 — Parent aggregate = **valid-weighted mean**, not max or median
Cole's "take a max as an average" was considered and rejected on three
grounds: (a) *prediction*: children offset from their parent's mean are
zero-mean and small → dH compresses (gzipped bins are 32 % smaller than
HEX4); offsets from a max are all-negative and as large as the relief.
(b) *rendering*: a max-height cap makes every distant face read as a cliff
(Cole's own observation); the mean is the only aggregate that keeps distant
terrain silhouettes honest. (c) *bounds*: the max isn't lost — each
aggregate record carries `relief` (subtree hMax−hMin, 4 m units) and the
header carries exact hMin/hMax, so LOD/collision logic still gets bounds.

### D3 — GSP1 format: offset-coded heights, quantization-aware
`recon(node) = recon(parent) + dH·0.1 m`, and the baker computes each dH
against the parent's **already-quantized** value, so error never
accumulates: every node lands within ±5 cm of the DEM sample regardless of
depth (validator asserts ≤0.35 m including aggregation slack; DEM
cross-check on 200 random units per tile). Records: 8 B aggregates
(dH, slopeMean, slopeMax, nx, nz, relief, flags), 14 B units (dH, 3 skirt
deltas, 3 edge slopes, normal, flags). No per-hex coordinates at all —
heap order IS the address. 257,766 bytes/tile fixed; 192 KB gzipped
(vs 282 KB for the HEX4 sector covering ~the same area).

### D4 — Render aggregates as rotated, scaled hex caps (embrace the 19.1°)
A level-k island is a fractal region, not a hexagon; any hex rendering of it
is an approximation. Options considered: render children instead (defeats
LOD), snap rotation to 0 (misrepresents the packing and gains nothing — the
boundary error is what it is), triangle-mesh far field (new pipeline, new
seams). Chosen: same-level caps tile the plane *exactly on average* (Gosper
islands are rep-tiles), so each ring is mutually consistent; the ±fractal
boundary error appears only at ring boundaries and is closed by
**1.15× overscan on aggregate caps** — overlap instead of gap. Overlap is
invisible top-down (coplanar caps sampling the same world-registered
texture) and benign in 3D (nearer/higher cap wins — the exact skirtless
mosaic aesthetic the scale-24 layer already shipped). Units (level 0) stay
exact so skirts keep meeting neighbors. The per-level rotation is embraced,
not hidden: it costs zero (baked into instance matrices), it's visually
coherent within each ring, and it makes the map literally *be* the data
structure — requirement (A), "it's fucking cool," is a spec.

### D5 — One LOD rule instead of four sliders: screen-space hex size
`R(k) = size(k) · pxPerRad / (hexTargetPx · qualityScale)`; level k lives in
the distance band (R(k−1), R(k)]. This directly implements "hexes should
appear a similar ~5 mm–1 cm on screen": every visible hex is ≥ hexTargetPx
(default 16 px) across, at every distance. It fixes the two standing visual
complaints at once — no more 2.5 px unit-hex *blur* at 2 km, and no more
'flat wall of undifferentiated color' at distance — and it bounds work:
hex density per steradian is constant, so instance count scales with screen
area, not render distance. Bands are geometric (ratio √7), which is exactly
the gosper tree — the data structure and the LOD policy are the same object.

### D6 — Hierarchical CDLOD cut in the vertex shader (no holes, no stacking)
Per instance: `draw ⟺ selfDist > R(k−1) AND parentDist ≤ R(k)`, with the
parent's center shipped as a per-instance attribute (`aParentPos`). The
parent evaluates the *same* distance value for its own self-test, so the cut
partitions terrain exactly — no cracks and no double-draw at ring
boundaries, per-instance, with zero CPU LOD work. (The old system drew
whole distance bands per layer with hand-tuned overlaps.) While fine levels
aren't built yet, the finest *built* level gets `uFinestBuilt=1` and ignores
its near edge, so coverage holds mid-stream.

### D7 — Two states, one scalar
MOVING vs SETTLED is now `qualityScale`: `movingCoarseness` (default √7 —
exactly one gosper level coarser; 7 on mobile = two levels) animating to 1
on settle, frametime-capped like the old antisintering. Levels 5..2 build
eagerly (400 instances/tile); levels 1..0 (19,208 instances) build in the
existing sinter pass. Freeze-frame-at-full-detail behavior is preserved;
STATIC still never renders.

### D8 — Textures: square per-island KTX2, planar world UVs
`TEXTURE_CONTAINER_FINDINGS.md` stands: rectangular containers, hexes
address by UV. Only the container center/size changed: a 980 m square
centered on the island (covers every rendered cap at every level, computed
exactly from the offset tables + cap circumradii), 4096 px → 0.239 m/px
(marginally denser than the sector's 0.244). The content/padding split and
its uUvScale/uUvOffset machinery are gone — `uv = local_xz/980 + 0.5`.
Same two-tier low/full XUASTC 6x6 pipeline, byte-for-byte the same encoder
settings.

### D9 — 2D mode is the 3D mode
The flat per-sector textured quads are deleted. Top-down already animates
`uHeightFactor → 0`; with screen-space banding, camera *altitude* is part of
instance distance, so zooming out in 2D coarsens levels automatically. One
pipeline, one material family, no plane/hex crossfade, and the 2D map keeps
the bestagon look. Overlapping coplanar caps can't z-fight visibly because
they sample the same world-registered aerial imagery.

### D10 — Horizon mesh: the "1 → 7 → 49" payoff made visible
The manifest carries every island's L5 aggregate (hMean, hMin/hMax, slope,
normal). At startup all of them render as ONE InstancedMesh (hypsometric
tint × baked lambert, manual haze, fog-exempt, ~6 tris per 830 m island) out
to 60 km. Distant mountains are mountain-shaped for free — no fetches, no
per-frame work; resident tiles zero-scale their horizon instance. This is
Cole's "query all of Tirol's max-size hexes simultaneously for essentially
free," rendered. (It is also his "single-digit-vertices distant mountains"
idea — the L5 cap IS that mesh, without inventing a second geometry
pipeline.)

### D11 — JS heap fix rides along
Known issue: ~1 GB heap at 100+ resident tiles from per-hex JS objects
(`hexDataLayers`). GSP1 tiles ship heights as one `Float32Array(16807)` and
picking uses a single static heap-index map shared by all tiles
(offsets are identical per island by construction). Per-tile JS overhead
drops from ~16 k objects to one typed array (~67 KB).

### Deliberately NOT done
- **No cross-level edge stitching / seam-perfect meshes.** There is no exact
  solution (Cole is right); overscan + distance + the mosaic aesthetic buy
  more than a constrained-triangulation scheme would, at zero runtime cost.
- **No sub-decimeter or entropy-coded dH.** i16 decimeters everywhere; the
  gzip layer already exploits the small offsets. Revisit only if Tirol-wide
  totals demand it.
- **No gosper-shaped textures.** Settled by TEXTURE_CONTAINER_FINDINGS.md —
  masking buys bandwidth only, never VRAM; containers stay rectangular.
- **No L6+ streaming tiers.** Two use cases (couloir vs range) → one tile
  size + one horizon tier. The manifest tree can aggregate upward later
  without touching the wire format.
- **Rotation UX, sinter FPS readout** (KNOWN_BUGS.md items) — out of scope,
  behavior preserved. The sinter texture-blur bug is fixed structurally
  (late-built materials register in `clonedMaterials` and inherit the
  current map).

## Numbers

- Payload: 257,766 B/tile fixed (192 KB gzipped) vs HEX4 346,112 B
  (282 KB gzipped) for ~equal area — **−26 % raw, −32 % gzipped**.
- Bake: ~12 s/island on the M1 (30-island Codex validation run: avg 12.0 s,
  max 17.0 s), same regime as the ~11 s/sector HEX4 bake.
- Baked geometry integrity: `tests/gosper/validate_gsp1.py` — structure,
  dH-chain reconstruction, re-aggregation, relief, flags, plus 200-sample
  direct DEM cross-check per tile: all green over the full bake.
- Instance budget (settled, 16 px, 900 px viewport): R = [157, 417, 1102,
  2916, 7715] m — units to ~160 m, whole-tile caps beyond 7.7 km. Instances
  per band are ~constant by construction; total visible work is bounded by
  screen area regardless of render distance.
- Bench A/B vs master: _see PERF section appended after the headless runs._
