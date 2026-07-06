# XUASTC Implementation Plan

_Created: 2026-07-04. Supersedes the exploratory notes in `XUASTC_UPGRADE_PLAN.md`
(which remains a verified-facts log). Architecture rationale lives in
`TEXTURE_CONTAINER_FINDINGS.md`; device/test strategy in `TEXTURE_DELIVERY_TEST_PLAN.md`._

This is a step-by-step plan for replacing the webp texture pipeline with
**XUASTC LDR 6x6 KTX2**, end to end. It is written to be executed by an
implementing model without further architectural decisions.

## Locked Decisions (do not re-litigate)

| Decision | Value |
|---|---|
| Tile shape | Rectangular per-sector, world-meter aligned (hex-masked tiles rejected — measured 1.3–2x VRAM penalty) |
| Layout | Straight swap of the existing two-tier (`low`/`full`) per-sector scheme. **No quadtree pyramid.** |
| Codec | XUASTC LDR **6x6**, quality 75, effort 4 (from the verified experiment args). No sweep now. |
| Fallback | **None.** webp path is deleted. No UASTC control tier, no runtime image fallback. |
| Block-size math | Canvas is 4096px total (3360px content + 2·368px pad), low tier 256px — PoT, fits MAX_TEXTURE_SIZE=4096 devices. Not a multiple of 6/12: ASTC 6x6 edge blocks are partial, which the codec handles per spec (revised 2026-07-05, supersedes the 4992px note below). |
| Out of scope | Gosper packing for `.bin` files (next big upgrade, explicitly not now). Any `.bin`/geometry pipeline change. WebGPU. Three.js version bump (stay on 0.160 importmap). |

## Already Done (2026-07-04, revised 2026-07-05)

The **large-LOD texture bug is fixed** on master: `TEXTURE_PADDING_PX` was 64
(12.8m) but LOD hexes at scale 6/24 overhang sector bounds by up to 22m/88.7m
(hex circumradius = `6.4·scale/√3`), so border hexes sampled outside texture
content and smeared clamped edge texels.

**Revision (2026-07-05):** instead of growing the canvas to 4992px for 448px of
padding, the canvas is locked at **4096px total**: the 819.2m sector content is
rendered at **3360px** (0.2438 m/px; unit hex texture footprint 26.25px instead
of 32px) with **368px padding** per side (89.72m ≥ the 88.68m scale-24
circumradius). World geometry, sector IDs and `.bin` files are unchanged — only
texture density. Wins: −33% texture bytes vs 4992², PoT dims (clean mips), fits
`MAX_TEXTURE_SIZE=4096` GPUs, `uUvScale = 3360/4096` exact binary. The paste
math in `bake_sector_textures` now rounds canvas-space *edges* (not widths) so
source-TIF seams stay gapless at non-integer texel alignment.

- `hex_backend/waffle_iron.py`: `TEXTURE_CANVAS_PX = 4096`,
  `TEXTURE_CONTENT_PX = 3360`, `TEXTURE_PADDING_PX = 368` (derived)
- `frontend/app/main.js` (`setupMaterialShader`): `pad = 368.0, size = 3360.0`

Any on-disk `frontend/app/aerial_tiles/` output from before this revision
(64px-padding era or 4992px-era) is stale and must be deleted before baking.
Note there is currently **no `low/` directory** on disk — a fresh bake is
required regardless.

## Current-State Anchors (verified file:line)

Backend:
- Texture bake: `bake_sector_textures()` at `hex_backend/waffle_iron.py:290-338`.
  Builds a padded RGB canvas (now 4096² = 3360 content + 2·368 pad), pastes
  Lanczos-resampled TIF windows with edge-rounded seams, saves
  `aerial_tiles/full/sector_{SX}_{SY}.webp` + `//16` low tier (now 256px).
- S3 upload: `upload_to_s3()` `waffle_iron.py:88-120`; cache-control list keyed on
  extensions at `:113`; fire-and-forget `aws s3 cp`.
- Incremental skip: `waffle_iron.py:638-645` and `:765-770` — one `BAKER_VERSION`
  gates both `.bin` and texture; existence check looks at `full/` only (bug: never
  notices missing `low/`).
- `generate_manifest.py` contains **zero** texture info; frontend derives texture
  URLs from sector `q`/`r` alone. No manifest change needed.

Frontend:
- All texture fetch/decode happens in the worker pool (2–6 workers,
  `main.js:224-233`). `loadTile()` `tile_worker.js:54-87` fetches `.bin` + low
  texture, decodes via `createImageBitmap(blob, {imageOrientation:'flipY'})`;
  `loadTextureOnly()` `tile_worker.js:89-95` is the full-res upgrade fetch.
- Only two texture URL sites: `main.js:1234` (low), `main.js:1479` (full).
- Main thread wraps bitmaps in `THREE.CanvasTexture` at `main.js:1291` and
  `main.js:1490` (`colorSpace = SRGBColorSpace`, `flipY = false`).
- UV mapping is a planar world-space projection injected via `onBeforeCompile`
  (`setupMaterialShader`, `main.js:684-816`); `uUvScale`/`uUvOffset` derive from
  `pad`/4096 — already updated, **no further shader change needed**.
- Full-res upgrade trigger: `main.js:1075-1098` (distance/facing test, 2000m
  default), swap in `upgradeTexture()` `main.js:1476-1538`.
- VRAM accounting assumes RGBA8: `width*height*4` at `main.js:1417` (low) and
  `main.js:1519` (full); `ESTIMATED_FULL_TEX_VRAM` at `main.js:1187`.
  `vram_ledger.js`/`cache_manager.js` just consume these numbers.

Experiment stack (reference material — port from it, don't import it):
- Loader shim: `ktx2_nonrect_texture_test/BasisV2KTX2Loader.js` (192 lines).
  Target-format selection `:83-111`, THREE format maps `:28-42`, mip transcode
  loop `:146-160`, CompressedTexture assembly `:164-174`. **Main-thread only** —
  that is why we port its logic into the worker instead of using it as-is.
- Vendored transcoder: `ktx2_nonrect_texture_test/vendor/basisu_v2/`
  `basis_transcoder.js` (~49KB, classic Emscripten glue exposing global `BASIS`)
  + `basis_transcoder.wasm` (~940KB).
- Encoder args that produced the verified-working toy assets:
  `generate_assets.py:31-42` → `-ldr_6x6i -quality 75 -effort 4 -ktx2 -mipmap
  -mip_srgb -no_alpha -y_flip`; production_zoom adds `-parallel -max_threads 8`
  (`generate_production_zoom_assets.py:63-104`).
- basisu v2.10.0 binary: built by `pixi run texture-build-basisu-v2` (clones tag
  `v2_1_0r`, output `ktx2_nonrect_texture_test/.basisu_v2/source/bin/basisu`).
  Gitignored — must be built locally. System `basisu` (v1.60.0) has no XUASTC.
- Desktop fallback is **in-payload**: the Basis v2 transcoder converts XUASTC LDR
  4x4/6x6/8x6 directly to BC7 (fast path, `basisu_transcoder.h:282`), so non-ASTC
  desktop GPUs get BC7 at 8bpp from the same file. No second payload needed.

## Phase 0 — Preflight

1. `pixi run texture-build-basisu-v2` (if `.basisu_v2/source/bin/basisu` absent).
2. `BASISU=ktx2_nonrect_texture_test/.basisu_v2/source/bin/basisu pixi run texture-stack`
   must report XUASTC encoder support: yes.
3. Delete stale local texture output: `rm -rf frontend/app/aerial_tiles/`.

## Phase 1 — Backend (`hex_backend/waffle_iron.py`)

1. **Encoder resolution.** Add a module-level helper that resolves the basisu
   binary: `$BASISU` env var, else
   `ktx2_nonrect_texture_test/.basisu_v2/source/bin/basisu`, else hard error
   pointing at `pixi run texture-build-basisu-v2`. At bake start, verify
   `-ldr_6x6i` appears in `basisu -help` output (pattern:
   `check_texture_stack.py` / `codec_available` in `generate_assets.py:92-97`).
   Fail the bake loudly if not — there is no fallback codec.
2. **Replace webp save** in `bake_sector_textures()` (`:325-338`):
   - Save the canvas (and the `//16` resize) to temp PNGs (use `tempfile` dir).
   - Encode each: `basisu -ldr_6x6i -quality 75 -effort 4 -ktx2 -mipmap
     -mip_srgb -no_alpha -parallel -max_threads <os.cpu_count()> <in.png>
     -output_file <aerial_tiles/{full,low}/sector_{SX}_{SY}.ktx2>`
     (check `-output_file` vs `-output_path` syntax against `basisu -help`;
     the experiment scripts used `-output_path <dir>` batch form —
     `generate_production_zoom_assets.py:242-247`).
   - Use `subprocess.run(..., check=True)`; a failed encode must fail the sector,
     not silently skip.
   - Start **with** `-y_flip` (the toy pipeline used it). Orientation is verified
     empirically in Phase 4; if terrain is mirrored north-south, drop the flag and
     re-run the mini-bake (cheap).
   - Replace `WEB_P_QUALITY` with `XUASTC_QUALITY = 75`, `XUASTC_EFFORT = 4`
     constants. Delete the PIL webp code path entirely.
3. **Version split.** Add `TEXTURE_VERSION = "1.0.0"` alongside `BAKER_VERSION`,
   stored in `metadata.json`. Sector skip logic (`:638-645`, `:765-770`):
   `.bin` skip keyed on `BAKER_VERSION`; texture skip keyed on `TEXTURE_VERSION`
   **and existence of both** `full/*.ktx2` and `low/*.ktx2` (fixes the
   missing-low-tier blind spot). Texture-only re-bakes must not re-bake `.bin`.
4. **S3.** Extend the cache-control extension list (`:113`) with `.ktx2`; add
   `--content-type image/ktx2` for `.ktx2` uploads (aws-cli won't infer it).
5. **Sweep for stragglers.** `rg -l '\.webp' --glob '!node_modules' --glob '!.pixi'`
   and update every hit that refers to aerial tiles (expect: `waffle_iron.py`
   header comment, `run_big_bake.sh`/`run_lil_bake.sh` if they mention webp,
   `bundle.py` blacklists, `README.md`, `code_atlas.md` regen).

Encode-time note: measure s/sector on the first mini-bake. If texture encode
dominates unacceptably (baseline was ~4.7s/sector all-in), reduce `-effort`
before touching anything else; do not change quality or block size.

## Phase 2 — Frontend loader (worker-side transcode)

Design: transcoding happens **inside the existing tile workers** (never the main
thread — the shim's main-thread transcode would violate the MOVING/SINTERING
frame budget). Main thread only assembles `THREE.CompressedTexture` from
transferred mip buffers.

1. **Vendor the transcoder.** Copy `basis_transcoder.js` + `basis_transcoder.wasm`
   from `ktx2_nonrect_texture_test/vendor/basisu_v2/` to
   `frontend/app/vendor/basisu_v2/`. (~1MB wasm; loaded once per worker.)
2. **Capability handshake.** At worker creation (`main.js:224-233`), main thread
   detects compressed-texture support once via `renderer.extensions.get(...)` for:
   `WEBGL_compressed_texture_astc`, `EXT_texture_compression_bptc`,
   `WEBGL_compressed_texture_s3tc`, `WEBGL_compressed_texture_etc`,
   `WEBGL_compressed_texture_etc1`, `WEBGL_compressed_texture_pvrtc` — and posts
   an init message `{type:'init', support:{astc,bptc,s3tc,etc2,etc1,pvrtc}}` to
   each worker.
3. **Worker transcode path** (`tile_worker.js`):
   - On init message: `importScripts('vendor/basisu_v2/basis_transcoder.js')`,
     then `BASIS({locateFile})` + `initializeBasis()`, memoized (port the
     promise pattern from `BasisV2KTX2Loader.js:44-77`, adapted from
     script-tag to `importScripts`).
   - Replace the `createImageBitmap` texture path in `loadTile()`/`loadTextureOnly()`
     with: fetch `.ktx2` → ArrayBuffer → `KTX2File` → select target format name
     (port `selectTarget`, `BasisV2KTX2Loader.js:83-111`, driven by the init
     `support` flags instead of `renderer`) → transcode every mip level (port
     loop `:146-160`) → post back
     `{mipmaps:[{data,width,height}...], width, height, formatName, gpuBytes,
     transcodeMs, isSRGB}` with every mip buffer in the transferables list.
   - If no compressed format is supported: post an explicit error result. The
     tile keeps the existing magenta no-texture material (`main.js:634`) — that
     is the designed failure state; do not add an image fallback.
4. **Main-thread assembly.** Replace `CanvasTexture` construction at
   `main.js:1291` and `main.js:1490` with: map `formatName` → THREE constant
   (port the `ASTC_BY_BLOCK`/fallback tables, `BasisV2KTX2Loader.js:28-42` +
   `:83-111`), then `new THREE.CompressedTexture(mipmaps, width, height, format)`;
   set `minFilter = LinearMipmapLinearFilter`, `magFilter = LinearFilter`,
   `generateMipmaps = false`, `flipY = false`,
   `colorSpace = isSRGB ? SRGBColorSpace : LinearSRGBColorSpace`,
   `needsUpdate = true`. Preserve whatever anisotropy the current path sets.
5. **URL swap.** `.webp` → `.ktx2` at `main.js:1234` and `main.js:1479`. These are
   the only two sites (verified by sweep).
6. Do **not** import stock `KTX2Loader` — it cannot parse XUASTC and nothing
   else uses it.

## Phase 3 — VRAM accounting

1. Replace `width*height*4` with the worker-reported `gpuBytes` (true sum of
   transcoded mip byte lengths) at `main.js:1417` and `main.js:1519`.
2. Recompute `ESTIMATED_FULL_TEX_VRAM` (`main.js:1187`): with mips,
   ASTC 6x6 full tile ≈ 4096²·0.444·1.33 ≈ **10MB**; BC7 ≈ **22MB**. Simplest
   correct approach: keep a per-format constant chosen after the first transcode
   reports its `formatName`, or just use observed `gpuBytes`. The 5GB
   `cache_manager` budget is unchanged — it just becomes honest (≈9x more tiles
   resident on ASTC devices than the old math allowed).

## Phase 4 — Verification (mini-bake first, S3 only after)

1. `./hex_backend/run_lil_bake.sh` (S3 disabled) → confirm `full/` 4096px and
   `low/` 256px `.ktx2` per sector; record encode s/sector and file sizes
   (expect roughly ~4MB full-tile wire size; measure, don't trust the estimate).
2. Serve viewer (`npx http-server frontend/app -p 8099`), then check:
   - Textures aligned with terrain at close zoom (compare a known landmark, e.g.
     Stubai glacier — if mirrored N–S, toggle `-y_flip` and re-bake).
   - Zoomed out: **no smearing on sector-border large hexes** (the padding fix).
   - Console/HUD: selected GPU format is ASTC 6x6 on Apple hardware; transcode
     times reported from workers; no main-thread stalls during texture upgrades
     (use the existing frametime HUD).
   - VRAM ledger totals match `gpuBytes` sums, not RGBA math.
3. Device matrix (user-driven, after local pass): macOS Safari, iPadOS Safari,
   Android Chrome, Linux Chrome. Expected: ASTC on Apple/Android, BC7 on
   desktop Linux/NVIDIA. A device with neither shows magenta tiles — accepted.
4. Deploy: `run_big_bake.sh` (uploads `.ktx2` via Phase-1 S3 changes). If the
   viewer is served from S3/CDN, upload `frontend/app/vendor/basisu_v2/
   basis_transcoder.wasm` with `--content-type application/wasm` and the `.js`
   glue as `text/javascript`. Texture assets are immutable-cached; a future
   codec-settings change must bump `TEXTURE_VERSION` (new bake) — S3 keys stay
   the same, so also purge/version paths if CDN caching ever bites.

## Cleanup (optional, same PR)

- Delete `texture_nonrect_test/` (empty superseded scaffold, per
  `TEXTURE_CONTAINER_FINDINGS.md`).
- `frontend/app/lod_controller.js` is dead code (never imported) — flag for the
  user, don't delete unprompted.

## Later / Not Now

- Block-size sweep (4x4/6x6/8x6/8x8) on real bake output — reuse
  `generate_production_zoom_assets.py` machinery; only worth doing if 6x6
  quality disappoints on real imagery.
- Gosper packing for `.bin` sectors — next big upgrade, separate effort.
- Quadtree/clipmap texture pyramid — only if the two-tier scheme measurably
  fails a real use case (see `TEXTURE_CONTAINER_FINDINGS.md`).
