# Current Result

Initial test date: 2026-06-25
XUASTC loader update: 2026-07-03

Browser probe: Google Chrome on Apple M1 Pro via ANGLE Metal.

Reported support:

- WebGL 2: yes
- ASTC: yes
- ETC / ETC2: yes
- ETC1: yes
- S3TC / BC1-3: yes
- BPTC / BC7: yes
- PVRTC: yes

Observed KTX2Loader choices:

- XUASTC LDR 6x6 payload -> Basis Universal v2 WASM loader -> RGBA ASTC 6x6
- UASTC payload -> RGBA ASTC 4x4
- ETC1S payload -> RGBA BPTC / BC7 in this Chrome + Three.js path

## A/B Byte Totals

Both cases contain the same number of colored source pixels: 1,048,576.

| Codec | Case | Files | Black fill pixels | KTX2 bytes | GPU block bytes | RGBA equivalent |
|---|---:|---:|---:|---:|---:|---:|
| XUASTC LDR 6x6 | A rectangle halves | 2 | 0 | 343 KiB | 0.60 MiB | 4.0 MiB |
| XUASTC LDR 6x6 | B lock/key full-coordinate masks | 2 | 1,048,576 | 362 KiB | 1.19 MiB | 8.0 MiB |
| UASTC | A rectangle halves | 2 | 0 | 773 KiB | 1.3 MiB | 4.0 MiB |
| UASTC | B lock/key full-coordinate masks | 2 | 1,048,576 | 811 KiB | 2.7 MiB | 8.0 MiB |
| ETC1S | A rectangle halves | 2 | 0 | 218 KiB | 1.3 MiB | 4.0 MiB |
| ETC1S | B lock/key full-coordinate masks | 2 | 1,048,576 | 229 KiB | 2.7 MiB | 8.0 MiB |

## Interpretation

Pure black fill is cheap in the KTX2 object. In this toy, doubling the rectangular container area only increased downloaded KTX2 bytes by about 5%.

Pure black fill is not cheap in GPU block memory. The GPU allocation follows the full rectangular texture dimensions and mip chain. In this toy, doubling the rectangular container area doubled GPU block bytes.

That means black borders can make overlapping coordinate-aligned KTX2 files bandwidth-friendly, but they do not make them VRAM-friendly.

XUASTC 6x6 changed the absolute numbers in the useful direction: much smaller
than the prior UASTC 4x4 control while still selecting an ASTC GPU format on
Apple/Chrome. It did not change the structural result: B is only about 5.6%
larger than A over the wire, but still about 2x in GPU block memory.

## Debug Pink Probe

The same lock/key assets were regenerated with pure debug pink (`#ff00ff`) instead of pure black in the non-owned region.

| Codec | Case | KTX2 bytes |
|---|---:|---:|
| UASTC | A rectangle halves | 773 KiB |
| UASTC | B black fill | 811 KiB |
| UASTC | B debug pink fill | 810 KiB |
| ETC1S | A rectangle halves | 218 KiB |
| ETC1S | B black fill | 229 KiB |
| ETC1S | B debug pink fill | 228 KiB |

Debug pink compresses effectively the same as black for downloaded KTX2 bytes. GPU block bytes remain the same as black because the texture dimensions, mip chain, and selected compressed GPU format are unchanged.
