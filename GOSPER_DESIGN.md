# Gosper Fractal Packing — Design & Justification

_Written 2026-07-07, branch `worktree-gosper`. This documents every decision
made during the full gosper integration, with the visual and performance
reasoning behind each, plus what was deliberately NOT done._

## What changed, in one paragraph

The terrain pipeline no longer thinks in 819.2 m rectangular sectors with four
uniform-scale hex layers. The streaming/storage/LOD unit is now a **level-5
Gosper island**: 7⁵ = 16,807 unit hexes (6.4 m), recursively grouped 7-at-a-
time into a 6-level aggregate tree. One `.bin` (`GSP3`) stores the tree as a
root height plus per-node decimeter offsets from the parent's reconstructed
value; three square KTX2 tiers (980 m, 128/256/4096 px) texture the island.
Every resident island retains a complete L3 coverage cut; settled views add
only the contiguous deeper ranges selected by the frustum frontier. The
vertex shader partitions those selected levels with fixed world-distance
bands at 2/5/10/25/60 km. A manifest-driven horizon mesh renders every baked
island's level-5 aggregate out to 60 km without fetching terrain geometry.

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
terrain silhouettes honest. (c) *bounds*: extrema are not lost — each GSP3
aggregate carries independent terrain and rendered-subtree uint16 decimetre
ranges around its reconstructed mean, and the header carries exact root
hMin/hMax.

### D3 — GSP3 format: offset-coded heights and split conservative bounds
`recon(node) = recon(parent) + dH·0.1 m`, and the baker computes each dH
against the parent's **already-quantized** value, so error never
accumulates: every node lands within ±5 cm of the DEM sample regardless of
depth (validator asserts ≤0.35 m including aggregation slack; DEM
cross-check on 200 random units per tile). Records: 16 B aggregates
(dH, slopeMean, slopeMax, nx, nz, terrain down/up, rendered down/up, flags,
reserved), 14 B units (dH, 3 skirt
deltas, 3 edge slopes, normal, flags). No per-hex coordinates at all —
heap order IS the address. Terrain extents are conservatively ceil-quantized
around the reconstructed mean and remain terrain-only because their sum sizes
aggregate skirts. Separate rendered extents recursively enclose every child
LOD, signed unit-skirt endpoint, the aggregate's own skirt, and shader skirt
slack. Keeping those meanings separate prevents culling safety from inflating
geometry. GSP3 is 280,166 bytes/tile fixed; header magic/version identifies
legacy GSP1/GSP2 during a rolling local rebake. Legacy formats use a loose,
safe root interval for aggregate culling because neither encoded the exact
rendered-subtree contract.

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

### D5 — Fixed world-distance bands and hierarchical frustum residency
Settled level k occupies `(R(k−1), R(k)]` with fixed far edges
`R = [2, 5, 10, 25, 60, ∞] km`: units through 2 km, L1 through 5 km, L2
through 10 km, L3 through 25 km, L4 through 60 km, and the resident L5 root
as the final coverage floor. Distance is three-dimensional and includes
camera altitude. There is no quality scalar or LOD-resolution slider.

Residency is a separate hierarchical query. The planner uses the camera's
actual rectangular perspective frustum—wide in landscape and tall in
portrait—plus a conservatively expanded guard frustum with motion lead. It
knows only opaque node handles and AABBs. `GosperVisibilityAdapter` is the
translation shim that supplies Gosper children, bounds, projection spheres,
and contiguous descendant ranges, so the planner itself is entirely blind to
Gosper packing.

The geometry query descends only to depth 2 / L3. Rejecting one L3 node drops
its complete 7 L2, 49 L1, and 343 unit descendant ranges without inspecting
them. There are no per-unit frustum plane tests. The complete 49-node L3 cut
stays available for every resident GSP2+ island; only visible/guard L3
subtrees can contribute finer worker ranges.

### D6 — Hierarchical CDLOD cut in the vertex shader (no holes, no stacking)
Per instance: `draw ⟺ selfDist > R(k−1) AND parentDist ≤ R(k)`, with the
parent's center shipped as a per-instance attribute (`aParentPos`). The
parent evaluates the *same* distance value for its own self-test, so the cut
partitions terrain exactly — no cracks and no double-draw at ring
boundaries, per-instance, with zero CPU LOD work. (The old system drew
whole distance bands per layer with hand-tuned overlaps.) While fine levels
aren't built yet, the finest *built* level gets `uFinestBuilt=1` and ignores
its near edge, so coverage holds mid-stream.

### D7 — Two states, one exact frontier
Every camera motion—pan, orbit, wheel zoom, or dolly—shows the same complete,
skirtless L3 cut. A short motion latch covers MapControls wheel events whose
start/change/end callbacks complete before the next animation frame. On settle,
GSP2+ tiles keep showing L3 until the exact epoch/signature-matched final
frontier is ready, then swap the complete mesh atomically into the fixed
settled bands. There is no intermediate level sweep or late append path. GSP1
retains complete compatibility buffers but applies the same visible L3-only
moving cut. STATIC still never renders.

### D8 — Textures: square per-island KTX2, planar world UVs
`TEXTURE_CONTAINER_FINDINGS.md` stands: rectangular containers, hexes
address by UV. Only the container center/size changed: a 980 m square
centered on the island (covers every rendered cap at every level, computed
exactly from the offset tables + cap circumradii). The explicit tiers are
`low` postage 128 px, `medium` 256 px, and `high` 4096 px. Every tier is
XUASTC LDR 6x6 KTX2 with a complete mip chain; high fits the WebGL2 4096
minimum maximum texture size without a parallel fallback asset. The content/padding split and
its uUvScale/uUvOffset machinery are gone — `uv = local_xz/980 + 0.5`.
There is no WebP/image fallback path. Mini-bakes default to sparse,
world-registered green/blue/pink motifs for low/medium/high; production and
`--no-texture-tattoos` outputs stay clean.

### D9 — 2D mode is the 3D mode
The flat per-sector textured quads are deleted. Top-down already animates
`uHeightFactor → 0`; camera altitude remains part of the fixed three-dimensional
distance bands, so zooming out in 2D coarsens levels automatically. One
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
(`hexDataLayers`). GSP3 tiles ship heights as one `Float32Array(16807)` and
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
- **Rotation UX and settled FPS readout** (KNOWN_BUGS.md items) — out of
  scope; behavior is otherwise preserved.

## Post-review changes (owner feedback, 2026-07-07 night)

Watching an early build, Cole set three contract points that overruled or
sharpened first-pass decisions:

1. **"The top of hexagons should NEVER be colored."** The experimental 50 %
   slope-class tint on aggregate caps is deleted (uniform and all). Slope
   colors live exclusively on skirts.
2. **"When static there are small skirted hexes."** Settled mode uses fixed
   2/5/10/25/60 km boundaries, and every aggregate level hangs relief-depth
   skirts (subtree hMax−hMin) so the settled field is sealed at all rings:
   level 1 keeps the slope-class gradient at half relief; levels 2+ seal at
   full relief but stay
   texture-toned — full-relief colored banners visually drowned the far
   field when tried.
3. **"When panning there are large skirtless hexes."** Aggregate skirt
   meshes toggle hidden while MOVING, and every camera motion displays the
   same complete L3 mosaic at every distance.

Plus two fixes the review flushed out:
- Ring-contour steps: a neighbor across an LOD contour renders at subtree
  MEAN height, below the DEM height a unit skirt was baked against — skirts
  get up to 12 m of distance-scaled slack beyond 1.2 km, and skirt
  darkening fades out with distance (sub-8 px dark skirts striped the far
  field into exactly the "blur" the old renderer had).
- `InstancedMesh.frustumCulled = false` is load-bearing: three culls whole
  objects against the unit cap's ~3.7 m bounding sphere at the tile origin,
  so tiles vanished wholesale when their origin left the frustum.

Known follow-ups (non-blocking):
- ~50 worker KTX2 transcode failures appear only under artificial mass
  churn (150-tile unload/reload storms); every encoded file validates with
  `basisu -info`, ordinary sessions show 0, and a failed full-res upgrade
  gracefully keeps the low-res. Suspected WASM heap pressure across the
  worker pool.
- Initial terrain work is prioritized by visible/guard classification and
  projected importance. Outside-frustum roots are not admitted by a radial
  render-distance sweep; instantiation remains time-sliced.

## Numbers

- Binary payload: 280,166 B/tile fixed for GSP3 vs 268,966 B for GSP2 and
  257,766 B for GSP1. GSP3's additional 11.2 KB buys exact rendered-subtree
  bounds without corrupting the terrain-relief/skirt-sizing contract.
- Texture bake cost remains dominated by the 4096px high composite and encode;
  the new 128px postage tier adds negligible work beside high and medium.
- Baked geometry integrity: `tests/gosper/validate_gsp1.py` — structure,
  dH-chain reconstruction, re-aggregation, asymmetric bounds, flags, plus 200-sample
  direct DEM cross-check per tile: all green over the full bake.
- Settled band far edges are exactly 2/5/10/25/60 km for unit/L1/L2/L3/L4;
  resident L5 roots remain the coverage floor beyond them. Frustum/guard L3
  pruning, rather than a radial render-distance or pixel formula, bounds
  deeper geometry work.
- Bench A/B vs master: _see PERF section appended after the headless runs._
