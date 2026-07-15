# XUASTC Aerial Codec Sweep

## Source Extraction

- Rebuilt 4096x4096 RGB canvases from production orthophoto TIFs.
- Central content crop is 3360x3360 with 368px padding per side.
- Texture meters per pixel: `0.243809524`.

| Sector | Class | Why |
|---|---|---|
| `sector_77_248` | glacier_snow | bright glacier and snowfields with exposed rock edges |
| `sector_78_250` | shadowed_rock | steep dark rock gullies against pale scree |
| `sector_79_249` | ice_shadow | glacier/ice with a hard deep-shadow boundary |
| `sector_80_251` | lake_rock | turquoise alpine lake surrounded by bare rock |
| `sector_77_255` | roads_valley | roads and ski infrastructure through mixed vegetation |
| `sector_78_254` | forest_shadow | dark conifer canopy and slope shadow |
| `sector_79_253` | mixed_valley | mixed meadow, forest, paths, and rocky cuts |
| `sector_80_255` | valley_floor | lower valley roads, forest, and open slopes |

## Aggregate XUASTC Effort 4

| Cell | ASTC B/px incl mips | ASTC MiB | Mean SSIM | Min SSIM | Mean wire MiB | Mean encode s |
|---|---:|---:|---:|---:|---:|---:|
| `xuastc_12x12_q50_e4` | 0.149 | 2.38 | 0.79466 | 0.74453 | 1.75 | n/a |
| `xuastc_12x12_q75_e4` | 0.149 | 2.38 | 0.83167 | 0.78251 | 1.87 | n/a |
| `xuastc_12x12_q90_e4` | 0.149 | 2.38 | 0.84467 | 0.79390 | 2.01 | n/a |
| `xuastc_10x10_q50_e4` | 0.214 | 3.42 | 0.81739 | 0.77225 | 2.40 | n/a |
| `xuastc_10x10_q75_e4` | 0.214 | 3.42 | 0.86085 | 0.82293 | 2.69 | n/a |
| `xuastc_10x10_q90_e4` | 0.214 | 3.42 | 0.88399 | 0.84605 | 2.87 | 358.92 |
| `xuastc_8x8_q50_e4` | 0.333 | 5.33 | 0.85063 | 0.81199 | 3.37 | n/a |
| `xuastc_8x8_q75_e4` | 0.333 | 5.33 | 0.89563 | 0.86892 | 4.06 | 298.97 |
| `xuastc_8x8_q90_e4` | 0.333 | 5.33 | 0.92910 | 0.90879 | 4.40 | 332.15 |
| `xuastc_8x6_q50_e4` | 0.445 | 7.12 | 0.86354 | 0.83136 | 4.06 | 304.59 |
| `xuastc_8x6_q75_e4` | 0.445 | 7.12 | 0.90818 | 0.88751 | 5.15 | n/a |
| `xuastc_8x6_q90_e4` | 0.445 | 7.12 | 0.94701 | 0.93657 | 5.77 | n/a |
| `xuastc_6x6_q50_e4` | 0.594 | 9.50 | 0.87579 | 0.84652 | 4.68 | 235.79 |
| `xuastc_6x6_q75_e4` | 0.594 | 9.50 | 0.91910 | 0.90074 | 6.25 | n/a |
| `xuastc_6x6_q90_e4` | 0.594 | 9.50 | 0.95851 | 0.94858 | 7.48 | 231.67 |
| `xuastc_4x4_q50_e4` | 1.333 | 21.33 | 0.91107 | 0.89242 | 8.73 | n/a |
| `xuastc_4x4_q75_e4` | 1.333 | 21.33 | 0.94795 | 0.93542 | 11.48 | n/a |
| `xuastc_4x4_q90_e4` | 1.333 | 21.33 | 0.97994 | 0.97322 | 15.00 | n/a |

## Pareto Front

| Cell | ASTC B/px incl mips | ASTC MiB | Mean SSIM | Min SSIM | Mean wire MiB | Mean encode s |
|---|---:|---:|---:|---:|---:|---:|
| `xuastc_12x12_q90_e4` | 0.149 | 2.38 | 0.84467 | 0.79390 | 2.01 | n/a |
| `xuastc_10x10_q90_e4` | 0.214 | 3.42 | 0.88399 | 0.84605 | 2.87 | 358.92 |
| `xuastc_8x8_q90_e4` | 0.333 | 5.33 | 0.92910 | 0.90879 | 4.40 | 332.15 |
| `xuastc_8x6_q90_e4` | 0.445 | 7.12 | 0.94701 | 0.93657 | 5.77 | n/a |
| `xuastc_6x6_q90_e4` | 0.594 | 9.50 | 0.95851 | 0.94858 | 7.48 | 231.67 |
| `xuastc_4x4_q90_e4` | 1.333 | 21.33 | 0.97994 | 0.97322 | 15.00 | n/a |

## Recommendation

Use `xuastc_6x6_q90_e4` as the balanced full-resolution default: 9.50 MiB GPU memory including mips, mean/min SSIM 0.95851/0.94858, and 7.48 MiB mean wire size.

Use `xuastc_8x6_q90_e4` when residency matters more: it cuts per-texture GPU memory to 7.12 MiB with mean/min SSIM 0.94701/0.93657.

Use `xuastc_4x4_q90_e4` for close-inspection imagery: mean/min SSIM 0.97994/0.97322, but 21.33 MiB GPU memory per texture.

The 6x6 point is the measured quality/memory knee: moving down to 8x6 saves 25% GPU memory but loses about 0.0115 mean SSIM; moving up to 4x4 costs 125% more GPU memory for about 0.0214 mean SSIM.

At a fixed block size, quality 90 dominates lower quality settings for GPU residency; the tradeoff is wire size, not GPU memory.

8x8 and larger are aggressive memory modes. Inspect the gallery for forest canopy, moraine, roads, and shadow-boundary failures before choosing them.

## Reference Codecs

| Cell | ASTC B/px incl mips | ASTC MiB | Mean SSIM | Min SSIM | Mean wire MiB | Mean encode s |
|---|---:|---:|---:|---:|---:|---:|
| `uastc_4x4_default` | 1.333 | 21.33 | 0.99800 | 0.99757 | 20.34 | 71.03 |
| `etc1s_q128` | n/a | n/a | 0.87595 | 0.83300 | 2.56 | 26.15 |
| `etc1s_q255` | n/a | n/a | 0.91456 | 0.88713 | 3.40 | 32.10 |

The default 4x4 UASTC reference remains the quality ceiling at roughly 0.998 mean SSIM and 20.34 MiB mean wire size. XUASTC 4x4 q90 reduces wire size while keeping the same ASTC residency footprint, but it does not match UASTC quality.

## Low-Resolution Tier

| Cell | ASTC B/px incl mips | ASTC MiB | Mean SSIM | Min SSIM | Mean wire MiB | Mean encode s |
|---|---:|---:|---:|---:|---:|---:|
| `xuastc_8x8_q75_e4_low` | 0.334 | 0.02 | 0.85524 | 0.81868 | 0.02 | 0.76 |
| `xuastc_8x8_q90_e4_low` | 0.334 | 0.02 | 0.90404 | 0.88419 | 0.02 | 0.81 |
| `xuastc_6x6_q75_e4_low` | 0.612 | 0.04 | 0.88466 | 0.85364 | 0.03 | 0.46 |
| `xuastc_6x6_q90_e4_low` | 0.612 | 0.04 | 0.94212 | 0.92904 | 0.03 | 0.47 |
| `xuastc_4x4_q75_e4_low` | 1.334 | 0.08 | 0.93034 | 0.91220 | 0.05 | 0.67 |
| `xuastc_4x4_q90_e4_low` | 1.334 | 0.08 | 0.97374 | 0.96732 | 0.07 | 0.39 |

For the 256x256 low tier, `xuastc_6x6_q90_e4_low` is the balanced point; 4x4 q90 is the quality option and 8x8 q90 is the smallest-residency option.

## Encode Time Notes

Recovered outputs from pre-commit restarts may have `encode_seconds: null`; subsequent entries were measured sequentially with one basisu process at a time.

Encode times from before and after removing `basisu -parallel` are not directly comparable, so they should not drive the codec choice.

## Metric Method

Metrics use the full 3360x3360 content crop, decoded from RGBA32 mip level 0 with the official Basis Universal transcoder. SSIM is computed in bounded 512px tiles with reflected 5px halos; a numerical regression check matched the previous whole-frame implementation within 1.3e-7.

## Anomalies

- No missing quality metrics.

## Gallery

Open `codec_sweep/gallery.html`.
