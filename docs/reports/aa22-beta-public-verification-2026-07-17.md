# AA-22 tattoo-3 beta publication verification

Date: 2026-07-17  
Public root: `https://wheatley.cloud/hexagons/beta/`  
Atomic asset release: `f8602483bdb475fc3ff7`

## Atomic publication

`scripts/release_publish.py` enumerated 793 manifest-referenced assets, uploaded
each below the immutable release prefix, checked its length, content type,
cache policy, SHA-256 metadata and downloaded SHA-256, and decoded one sample
of each GSP/KTX2/WebP type before writing the immutable versioned manifest and
then the single mutable manifest pointer. It exited successfully with:

```text
published release f8602483bdb475fc3ff7
```

The release prefix contains 794 objects (793 assets plus the versioned
manifest), totalling 940,077,392 bytes.

## Public manifest

The public mutable manifest returned HTTP 200 and:

- `release.mode`: `beta`
- `release.profile`: `beta-stubai`
- `release.coverage_profile`: `stubai-small-square`
- `release.asset_release`: `f8602483bdb475fc3ff7`
- 197 terrain tiles and 149 texture pages
- recipe `4.1.0+codec-production+effort-1+tattoo-3`
- `diagnostic_tattoos: true`
- 32 px, 4,096-decoded-byte transient WebP bootstrap contract
- versioned binary, bootstrap and KTX2 URL templates
- `Cache-Control: no-cache, no-store, must-revalidate`

The public HTML references the clean release shell
`main.108c608a4c9f.js`, `style.8b21157a9f1a.css`, and
`service-worker.151601024bf1.js`.

## Public object samples

All samples returned HTTP 200. Their payload signatures and headers were
verified after downloading through the public Cloudflare/S3 URL.

| Object | Bytes | Content-Type | Cache-Control | Signature |
| --- | ---: | --- | --- | --- |
| `tiles_bin/gosper_271_-229.bin` | 280,166 | `application/octet-stream` | one year, immutable | GSP3 pass |
| `bootstrap/texture_52_196.webp` | 534 | `image/webp` | one year, immutable | RIFF/WEBP pass |
| `low/texture_52_196.ktx2` | 6,857 | `image/ktx2` | one year, immutable | KTX2 pass |
| `medium/texture_52_196.ktx2` | 26,262 | `image/ktx2` | one year, immutable | KTX2 pass |
| `high/texture_52_196.ktx2` | 6,234,686 | `image/ktx2` | one year, immutable | KTX2 pass |

Verdict: **PASS**. The tattoo-3 corpus and clean application shell are public,
the live pointer names the fully verified release, and sampled geometry plus
all four texture tiers are publicly retrievable with correct payloads and
cache/content metadata.
