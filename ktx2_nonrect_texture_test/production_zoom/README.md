# Production KTX2 Zoom Probe

This experiment uses a real adjacent `3 x 3` Tirol aerial TIF cluster at full `0.2 m/px` resolution.

The generator saves a lightweight `mosaic_3x3.vrt` representing the full `18,750 x 15,000` RGB rectangle, then cuts the current `16:9` zoom states into:

- global square patches aligned to a naive rectangular texture grid
- flat-top hex patches aligned to the app's axial LOD grid with debug pink outside the hex

The runtime viewer loads only `.ktx2` patch files. `xuastc_*` payloads use the
experiment's Basis v2 loader/transcoder path; UASTC controls use Three.js
`KTX2Loader`.
The generator targets `xuastc_6x6` first, then falls back to UASTC on older Basis Universal tooling.

## Generate

```bash
pixi run texture-zoom-assets
```

Check the local encoder/loader stack:

```bash
pixi run texture-build-basisu-v2
pixi run texture-stack
BASISU=/path/to/basisu-v2 pixi run texture-stack
```

## Run

Serve the repo root:

```bash
python3 -m http.server 8112
```

Open:

```text
http://localhost:8112/ktx2_nonrect_texture_test/production_zoom/
```

See `RESULTS.md` for the first measured run.
