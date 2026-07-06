# XUASTC Upgrade Plan

_Created: 2026-07-04_

This note records only facts that were locally or upstream-source verified while
evaluating an XUASTC KTX2 texture path for this repo.

## Verified Upstream Facts

- Basis Universal release notes say XUASTC LDR support was added in the v2.0
  line on 2026-01-19.
- Basis Universal release notes say the v2.1 release on 2026-02-24 changed KTX2
  compatibility for UASTC HDR 4x4, UASTC HDR 6x6i, and XUASTC LDR files.
- Basis Universal docs describe XUASTC LDR as supporting ASTC-style block sizes
  from 4x4 through 12x12.
- Basis Universal docs describe `.ktx2` as one of its intermediate container
  formats, with rapid transcoding to GPU texture formats.
- Three's official `KTX2Loader` docs say the loader parses KTX2 containers,
  supports Basis Universal GPU textures, and uses the WASM transcoder/JS wrapper
  from `examples/jsm/libs/basis`.
- Three's official docs do not mention XUASTC in `KTX2Loader`.

Source links:

- Basis release notes: https://github.com/BinomialLLC/basis_universal/wiki/Release-Notes
- Basis docs: https://binomialllc.github.io/basis_universal/
- Three KTX2Loader docs: https://threejs.org/docs/pages/KTX2Loader.html

## Verified Local Repo Facts

- Repo Three package: `three@0.160.1`.
- Current npm latest checked on 2026-07-04: `three@0.185.1`.
- Local installed `basisu`: `v1.60.0`.
- Locally built experiment `basisu`: `v2.10.0`.
- `rg "XUASTC|xuastc|cXUASTC|isXUASTC|cTFASTC_LDR"` found no matches in:
  - local `node_modules/three/examples/jsm/loaders/KTX2Loader.js`
  - local `node_modules/three/examples/jsm/libs/basis`
  - unpacked npm `three@0.185.1` `KTX2Loader.js` and bundled Basis files
- `pixi run texture-stack` with system `basisu` reports XUASTC encoder support:
  `no`.
- `BASISU=ktx2_nonrect_texture_test/.basisu_v2/source/bin/basisu pixi run texture-stack`
  reports:
  - XUASTC encoder support: `yes`
  - stock Three `KTX2Loader` XUASTC support: `no`
  - experiment Basis v2 loader: `yes`
  - vendored Basis v2 transcoder: `yes`
- The committed experiment commit is `6e4f883 Add XUASTC KTX2 texture experiments`.

## Current Repo Implementation

- `ktx2_nonrect_texture_test/BasisV2KTX2Loader.js` is a local shim for
  `xuastc_*` payloads.
- The shim loads vendored Basis Universal v2 transcoder files from
  `ktx2_nonrect_texture_test/vendor/basisu_v2/`.
- The shim wraps transcoded mip data in `THREE.CompressedTexture`.
- The normal Three `KTX2Loader` remains the path for UASTC and ETC1S controls.
- No PNG/WebP/JPEG runtime fallback was added to the experiment viewers.

## Verified Browser Result

Verified with Chrome channel on Apple/ANGLE Metal:

```text
XUASTC LDR 6x6 KTX2
-> Basis Universal v2 WASM loader
-> RGBA ASTC 6x6 GPU texture
```

The same generic headless Chromium shell did not expose compressed texture
extensions, so it correctly failed the XUASTC path instead of silently falling
back to RGBA.

## Verified Toy Asset Measurements

Source: `ktx2_nonrect_texture_test/assets/asset_manifest.json` generated with
the local Basis v2 binary.

Both A and B contain the same colored source pixels: `1,048,576`.

| Payload | A rectangle KTX2 bytes | B lock/key KTX2 bytes | B/A network ratio |
|---|---:|---:|---:|
| XUASTC LDR 6x6 | 351,277 | 370,966 | 1.056x |
| UASTC LDR 4x4 | 788,059 | 825,709 | 1.048x |
| ETC1S | 222,836 | 234,121 | 1.051x |

ASTC 6x6 mip-chain block estimates for the XUASTC toy:

| Case | GPU block bytes |
|---|---:|
| A rectangle halves | 629,984 |
| B lock/key masks | 1,252,576 |

Factual conclusion from this measurement:

- XUASTC 6x6 was much smaller than UASTC 4x4 for this toy payload.
- Constant black masked fill was cheap over the wire.
- Constant black masked fill still cost full rectangular GPU block memory.

## What Is Supported Today

Supported in this repo's experiment stack:

```text
Basis v2 encoder
-> XUASTC LDR 6x6 .ktx2
-> local BasisV2KTX2Loader shim
-> Basis v2 WASM transcoder
-> Three CompressedTexture
```

Not supported by released stock Three alone, based on local package inspection
and npm `three@0.185.1` inspection:

```text
XUASTC LDR KTX2 -> stock Three KTX2Loader
```

## Deployment Facts To Preserve

- `.ktx2` assets are static binary files and can be uploaded to S3.
- `basis_transcoder.wasm` must be served as a static binary and should be served
  with `Content-Type: application/wasm`.
- Texture assets should be immutable/versioned because codec settings change the
  binary payload.
- The encoder should run before deployment; no request-time texture transcoding
  is part of this plan.

## Not Yet Verified

- macOS Safari runtime result.
- Linux Chrome/Chromium runtime result.
- Android Chrome runtime result.
- iPadOS Safari runtime result.
- Production zoom XUASTC measurements on real TIF-derived assets.
- Best XUASTC quality/block-size settings for production imagery.
- Whether a future Three release after `0.185.1` adds native XUASTC support.
- Native app texture-loader path.

## Next Concrete Checks

1. Run the toy viewer on each target browser/device and record:
   selected GPU format, loader path, transcode time, and visible result.
2. Generate production zoom assets with Basis v2 and record XUASTC vs UASTC
   file sizes and GPU block estimates.
3. Compare XUASTC block sizes on real aerial imagery:
   `4x4`, `6x6`, `8x6`, and `8x8`.
4. Recheck Three release notes/source before replacing or expanding the shim.
