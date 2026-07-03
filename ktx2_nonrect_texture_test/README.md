# KTX2 Non-Rect Texture Test

This is a contained Three.js experiment for testing two KTX2 delivery shapes:

- `A`: two half-size rectangular KTX2 files.
- `B`: two full-coordinate lock/key KTX2 files with pure black outside each owned region.

Runtime loading is intentionally KTX2-only. There is no PNG/WebP/JPEG fallback path in the viewer.
`xuastc_*` payloads use the local `BasisV2KTX2Loader.js` plus vendored Basis
Universal v2 transcoder files. UASTC and ETC1S controls still use Three's stock
`KTX2Loader`.

## Generate Assets

```bash
pixi run texture-toy-assets
```

The script uses `frontend/landing/strava_glacier.jpg` as the source image, writes temporary TGA files, encodes `.ktx2` with `basisu`, and deletes the temporary TGA files.
It prefers `xuastc_6x6` when the installed Basis Universal encoder exposes it, and otherwise falls back to UASTC/ETC1S while recording skipped payloads in the manifest.

Check the local encoder/loader stack:

```bash
pixi run texture-build-basisu-v2
pixi run texture-stack
BASISU=/path/to/basisu-v2 pixi run texture-stack
```

## Run

Serve the repository root so the import map can load local Three.js and its Basis transcoder:

```bash
python3 -m http.server 8112
```

Open:

```text
http://localhost:8112/ktx2_nonrect_texture_test/
```

The page reports browser texture-compression extensions, the generated payload
selected from the manifest, the loader path used, the selected GPU format, KTX2
network bytes, and post-transcode GPU block bytes.

See `RESULTS.md` for the current measured Chrome-on-Apple result.
