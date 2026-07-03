# Production Zoom Result

Test date: 2026-06-25
Loader update: 2026-07-03

Source:

- Real Tirol aerial TIFs from `hex_backend/aerial_tifs`
- Adjacent `3 x 3` cluster saved as `assets/mosaic_3x3.vrt`
- Full mosaic dimensions: `18,750 x 15,000 px`
- Source resolution: `0.2 m/px`

Runtime format observed in Chrome on Apple M1 Pro:

- KTX2 payload: UASTC + RDO fallback, mipmapped, no alpha
- Selected GPU format: `RGBA ASTC 4x4`

The production zoom assets have not been remeasured after the XUASTC loader
update. The viewer now routes `xuastc_*` payloads through the Basis v2 loader
and still routes UASTC controls through Three's stock `KTX2Loader`.

## Zoom-State Totals

| State | Scale | View px | Square files | Square KTX2 | Square GPU block est. | Hex files | Hex KTX2 | Hex GPU block est. | Hex pink px |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Unit | 1 | 512 x 288 | 170 | 251 KiB | 231 KiB | 200 | 340 KiB | 344 KiB | 71,600 |
| LOD 3 | 3 | 1024 x 576 | 77 | 700 KiB | 928 KiB | 91 | 847 KiB | 1.25 MiB | 246,428 |
| LOD 6 | 6 | 2048 x 1152 | 84 | 2.55 MiB | 3.94 MiB | 91 | 2.71 MiB | 4.98 MiB | 998,543 |
| LOD 24 | 24 | 6144 x 3456 | 54 | 25.7 MiB | 40.5 MiB | 61 | 26.5 MiB | 52.9 MiB | 10,407,576 |

## Interpretation

For these centered 16:9 views, hex-coupled patches are not automatically smaller than a naive square grid. They carry 25%-ish debug fill plus somewhat more files at the sampled view boundaries.

The reason to keep testing hex-coupled textures is the edge case the square-grid totals do not fully represent: when the renderer needs a small terrain-aligned sliver that crosses rectangular tile boundaries, square paging can force extra full square patch downloads. This toy now gives us the machinery to test those off-center/frustum-edge cases against real imagery and real KTX2 files.

The current strongest production rule is:

```text
Use hex-coupled KTX2 only where it reduces total resident/downloaded container area enough to overcome its per-hex pink-fill overhead.
```

LOD helps that argument. As cells get larger, request/file overhead becomes less important and uniform debug fill remains cheap in KTX2 bytes. VRAM still follows full rectangular container area.
