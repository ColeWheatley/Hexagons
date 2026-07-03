# Texture Delivery Test Plan

_Created: 2026-07-03_

Goal: choose a texture delivery path for both the website and future app without optimizing only for the current MacBook.

## Devices To Test

- macOS Chrome on Apple Silicon
- macOS Safari on Apple Silicon
- Linux desktop Chrome/Chromium
- Android Chrome
- iPadOS Safari

## Target Payload

Target **XUASTC LDR KTX2** as the default payload for the next texture experiment.

Reasoning:

- Terrain aerial imagery has high-frequency detail where ETC1S can smear/color-shift.
- The project cares about visual fidelity across website and app targets, not only minimum bandwidth.
- XUASTC aims at the useful middle: much smaller delivery than UASTC 4x4 while staying cleaner than ETC1S.
- XUASTC's larger ASTC-aligned block sizes are a better fit for aerial imagery payload tests where bandwidth/storage matter.

Use **UASTC KTX2** as the compatibility/control payload while XUASTC is being tested across devices. ETC1S remains a fallback experiment only if bandwidth/storage becomes the dominant constraint for a specific low-quality tier.

## Current Stack

Basis Universal's newer XUASTC LDR family is the target, but it is not automatically covered by the current Three r160 loader stack.

Current repo state:

- local `basisu` is `v1.60.0`
- its CLI help exposes ETC1S and UASTC LDR 4x4, but not XUASTC LDR
- the bundled Three r160 `KTX2Loader`/Basis transcoder path does not mention XUASTC
- the latest npm `three@0.185.1` package was checked on 2026-07-03 and still did not mention XUASTC in `KTX2Loader` or its bundled Basis files
- `ktx2_nonrect_texture_test/BasisV2KTX2Loader.js` now routes `xuastc_*` payloads through vendored Basis Universal v2 web transcoder files
- stock Three `KTX2Loader` remains the runtime path for UASTC/ETC1S controls

So the stack update is **not** "just bump Three." It is:

1. Build/install Basis Universal v2.x so `basisu` can produce XUASTC 6x6 KTX2 files (`-ldr_6x6i`, also documented as `-xuastc_ldr_6x6`).
2. Use the experiment's XUASTC-aware Basis v2 web transcoder/loader path for browser tests.
3. Keep UASTC generation available as the compatibility/control payload.

Run:

```bash
pixi run texture-stack
```

to see whether the current machine can encode and load the target payload.
To test a locally built Basis Universal v2.x binary without replacing the system
install, pass `BASISU=/path/to/basisu` to the checker or asset-generation tasks.
The local helper is:

```bash
pixi run texture-build-basisu-v2
```

## Decisions Still Open

- Quality settings: XUASTC block size (`6x6`, `8x6`, `8x8`) and quality/effort
- Toolchain upgrade path: Basis Universal v2.x/XUASTC compatibility with Three.js or a custom transcoder bundle
- Tile size: `512`, `1024`, `2048`, and far-LOD `4096`
- Tile layout: rectangular world-meter pyramid vs specialized edge/atlas variants
- Runtime path: WebGL2 + Three `KTX2Loader` first, WebGPU only if it buys measurable wins
- App path: whether a future native app should use platform-native sparse/virtual texture features

## Required Measurements

For each device/browser and candidate payload:

- exposed compressed texture extensions
- format selected by `KTX2Loader`
- KTX2 bytes over the wire
- post-transcode GPU block bytes
- transcode time
- first visible texture time
- sustained resident texture count before eviction or frame drops
- visible quality at close, mid, and far LOD

## Current Recommendation

Use a rectangular world-meter **XUASTC KTX2** tile pyramid as the target, with UASTC KTX2 as the current runnable fallback/control. Let the loader pick the device GPU format, then tune XUASTC block size, quality, effort, and tile size per device class.

Hex-masked KTX2 is not the baseline. It may still be useful for a narrow edge/atlas experiment, but the measured invariant is that masked fill is cheap for download and full-price for VRAM.
