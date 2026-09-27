# netlab

A local HTTPS HTTP/2 mirror with one shared downlink, plus a CDP browser bench. Run all commands from the repository root. It only issues HTTPS GETs under the configured Wheatley app path; it never writes to the upstream.

## Requirements

- Node (the server uses built-in modules only; tested with v19.7.0, compatible with v22) and `openssl` for a one-time self-signed `scripts/netlab/.cert/` certificate.
- `/opt/homebrew/bin/python3.14` with `websockets` for the CDP driver. `/usr/bin/python3` has NumPy 1.24.3 and Pillow 11.3.0 on this machine; the driver invokes it once to calculate VC and build the contact sheet. Neither interpreter alone has all three modules. No package was added.
- Google Chrome at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` and `curl` for manual checks.

The driver creates unique Chrome profiles under `scripts/netlab/tmp/`, checks that free + inactive + speculative memory is at least 3 GiB before each launch, and waits for Chrome to exit in a `finally` block. Run one driver at a time. The server can stay up across runs.

## Seed and run

Start the server online, unthrottled, from a shell that stays open:

```sh
node scripts/netlab/netlab_server.mjs \
  --proxy-mount /hexagons/app/=https://wheatley.cloud/hexagons/app/ \
  --profile none --log scripts/netlab/tmp/server.jsonl
```

The default mirror is `~/dev/hexagons-netlab-mirror/`. `--mirror-dir` overrides it. Each URL, including query, has its own SHA-256 key and sidecar headers. Misses fetch the complete, still-encoded upstream object once and atomically rename it into place. `--offline` turns any miss into HTTP 504. The default app start is deterministic for a fresh profile: it picks the fixed Stubai buildings coordinates if a manifest tile lies within 2 km. Every run starts with a fresh profile, so the same default view is used. Override `--url` with the same explicit `?view=1&at=...&eye=...` URL for every comparison if a particular camera is needed.

Seed the three visited areas at `none` (cold is included in pan and jump); output under `tmp/` is disposable:

```sh
/opt/homebrew/bin/python3.14 scripts/netlab/netlab_bench.py --scenario pan --profile none --out scripts/netlab/tmp/seed-pan
/opt/homebrew/bin/python3.14 scripts/netlab/netlab_bench.py --scenario jump --profile none --out scripts/netlab/tmp/seed-jump
```

Stop that server and start an **offline** server with the same log path and `--profile cafe`:

```sh
node scripts/netlab/netlab_server.mjs \
  --proxy-mount /hexagons/app/=https://wheatley.cloud/hexagons/app/ \
  --profile cafe --offline --log scripts/netlab/tmp/server.jsonl
```

Run a baseline twice for each scenario. `warm` first loads the page unmeasured for `--seed-seconds` (90 by default), waits for service-worker control, clears only Chrome's HTTP cache, then navigates again and measures. Cache Storage persists. A `warm` run creates a fresh Chrome profile; it never inherits another run's cache.

```sh
/opt/homebrew/bin/python3.14 scripts/netlab/netlab_bench.py --scenario cold --out scripts/netlab/tmp/baseline-cold-1
/opt/homebrew/bin/python3.14 scripts/netlab/netlab_bench.py --scenario warm --out scripts/netlab/tmp/baseline-warm-1
/opt/homebrew/bin/python3.14 scripts/netlab/netlab_bench.py --scenario pan --out scripts/netlab/tmp/baseline-pan-1
/opt/homebrew/bin/python3.14 scripts/netlab/netlab_bench.py --scenario jump --out scripts/netlab/tmp/baseline-jump-1
```

Repeat with `-2` output names. Output includes `result.json`, `summary.md`, and `contact.png`; pass `--frames` to keep the JPEGs. Compare same-scenario files with:

```sh
/opt/homebrew/bin/python3.14 scripts/netlab/netlab_compare.py scripts/netlab/tmp/baseline-cold-1/result.json scripts/netlab/tmp/candidate-cold-1/result.json
```

For a candidate build, add `--static-mount /hexagons/next/=/absolute/path/to/candidate` to the server, then run the same commands with `--url https://localhost:8443/hexagons/next/`. References to `/hexagons/app/releases/` still resolve from the proxy mount on the same origin. If the local build references other external origins, adapt the build before comparing; this harness only models bytes from these mounts.

## Link and measurements

| Profile | Downlink | RTT | Busy-link added TTFB |
|---|---:|---:|---:|
| `cafe` | 18 Mbit/s | 90 ms | up to 450 ms |
| `slow` | 5 Mbit/s | 150 ms | up to 600 ms |
| `fast` | 100 Mbit/s | 20 ms | up to 20 ms |
| `none` | unlimited | 0 ms | 0 ms |

`GET /__netlab/profile?name=cafe` changes the live profile. Every request waits one RTT plus `bloatMs * min(1, queuedBytes / (bandwidthBps * 0.5))` before its headers. One round-robin scheduler releases body chunks of at most 16 KiB across every stream/connection. The body rate is shared. Uplink and packet loss are not modeled.

The server logs JSONL per request with timestamps relative to its start. `GET /__netlab/mark?name=...` adds a marker. Bench network totals count body bytes for requests that start between the run markers, including any reference-settlement fetches. `measuredPhaseBytes` separately excludes the reference intervals, and `byProfileBytes` exposes how much was transferred at `none`. Categories include manifest, shell, service worker, geometry, texture tiers, and other. Re-download bytes count bytes of a `(path, query, Range)` identity served again after a prior complete response in that measured run. Range strings for tiles and textures are preserved in `result.json`. The server returns `206` for single unencoded byte ranges, `416` for invalid or unsatisfiable ranges, and serves a full `200` encoded body when Range is sent for a Brotli/gzip object (matching the chosen S3-like behavior). Static mounts prefer a sibling `.br` when accepted and no Range was requested.

The driver samples a 720×450 JPEG every 500 ms. `vc_frames.py` computes mean SSIM over nonoverlapping 8×8 grayscale blocks against a reference frame. After each measured phase the profile switches to `none`, waits until no new server request for 8 seconds and no queued bytes (90-second cap), then captures that phase's reference. It restores the selected profile before the next phase. `SpeedIndex` is the trapezoidal integral of `1−VC` in milliseconds; `tVC50/85/95` are first sampled crossings. A reference may be captured after the 90-second cap with outstanding work; `settle.<phase>.quiet` records that case. Identical reference frames score 1.0 by assertion. `pan` waits 45 seconds, moves east 3 km over 6 seconds, holds 25, pans back over 6, then holds 25. `jump` waits 45 seconds, teleports west 12 km, then holds 45. Both update the viewer through its existing camera motion calls.

`Performance.getMetrics` supplies JS heap size. RSS is the sum of the launched Chrome process tree from `ps`; `null` means process introspection was unavailable. The driver requires that the service worker controls the measured page, and Chrome's `--ignore-certificate-errors --allow-insecure-localhost` combination works for this local self-signed HTTPS origin.

## Limits

The server uses HTTP/2 rather than production HTTP/3 and does not model Cloudflare edge caches, uploads, packet loss, DNS, or radio contention. Offline replay is deterministic for the seeded URL set but dynamic page behavior can still vary. Fresh Chrome profiles remove cross-run Cache Storage; the `warm` scenario keeps it only between its seed and measured navigation. The 8-second quiet rule observes server requests, not hidden client work. Browser screenshots include UI overlays and animation, so VC has visual noise. The server stores full upstream compressed bytes without decoding them. HTTP cache and service-worker hits never cross the server and therefore do not count as network bytes.
