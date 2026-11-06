# Goal: build "netlab" — a realistic slow-network A/B bench for the Hexagons viewer

You are working in a standalone git clone of the Hexagons repo on branch `codex/netlab`.
The live app is https://wheatley.cloud/hexagons/app/ (a Three.js hex-terrain viewer of Tirol).
The owner's complaint: it loads slowly on real (slow, bufferbloated) wifi. Other agents are
about to change how the app downloads terrain tiles and textures. Your job is the
**measurement instrument** they (and the orchestrator) will use to prove each change helps.
Build it carefully: every later decision depends on its numbers being honest.

Before writing code, read: `CLAUDE.md` (esp. process-hygiene rules for headless Chrome),
`scripts/run_bench.py` (a working CDP-driven headless Chrome runner — reuse its plumbing and
teardown discipline), `frontend/app/dev/benchmark.js` (how scenarios drive the camera),
`frontend/app/view_state.js` (shareable `?view=1&at=...&eye=...` URLs), and
`frontend/app/service_worker.js`.

## Hard rules

- NEVER write to S3/AWS or any remote service. NEVER `git push`. Only read from
  `https://wheatley.cloud/hexagons/app/...` (plain HTTPS GETs).
- Only ONE headless Chrome at a time. Launch with `subprocess.Popen(..., start_new_session=True)`,
  never start a new one until the previous one has been waited on, tear down with
  terminate → kill(process group) → wait in `finally`, unique `--user-data-dir` per launch (its path MUST contain the string `Hexagons`, e.g. under this clone — an external memory tripwire keys on it)
  under this clone's `tmp/`, removed in `finally`. Before each launch, check free memory with
  `vm_stat`; if (free + inactive + speculative pages × 16 KiB) < 3 GiB, wait 30 s and re-check
  (max 10 min) instead of launching. This machine is a 16 GB M1 Pro; it has hard-crashed from
  runaway Chrome before.
- Commit after every discrete step with messages formatted
  `[netlab] did X | next: Y | status: ok|blocked:<reason>`. Uncommitted work is lost if you die.
- Do not modify app code under `frontend/app/` except (optionally) adding a tiny, clearly
  bench-only hook if absolutely required — prefer driving everything from CDP
  `Runtime.evaluate` against existing globals (`window.pistonViewer`, `window.hexView`).
- Keep all new files under `scripts/netlab/`. Python: use `/opt/homebrew/bin/python3.14`
  (has `websockets`, numpy and Pillow are available under `python3`; check which interpreter
  has what and document it). Node v22 is available. No new third-party dependencies unless
  unavoidable; if you add one, document why.

## Component 1 — `scripts/netlab/netlab_server.mjs` (Node, no deps)

An HTTPS HTTP/2 server (`http2.createSecureServer({allowHTTP1: true})`, self-signed cert
generated once via the `openssl` CLI into `scripts/netlab/.cert/`, gitignored) that
reproduces production serving AND a realistic bottleneck link.

Mounts (CLI flags, repeatable):
- `--proxy-mount /hexagons/app/=https://wheatley.cloud/hexagons/app/` — every request under
  the mount path is served from a local **mirror** directory (`--mirror-dir`, default
  `~/dev/hexagons-netlab-mirror/`), keyed by upstream path **including** the query string
  (hash it into the filename if needed); on a miss, fetch the FULL object from upstream once
  (dedupe concurrent misses), store atomically (temp file + rename) with its response headers
  (content-type, cache-control, content-encoding, etag) in a sidecar JSON, then serve. This
  makes the exact live site (index.html, hashed JS, service worker, 4.6 MB manifest, tiles,
  KTX2 textures) replayable offline. A `--offline` flag must make misses return 504 instead of
  touching the network (so benches are deterministic once seeded).
  NOTE: upstream objects that were stored with `Content-Encoding: br` must be stored and
  re-served *encoded* with the same header (don't let fetch() transparently decode them — use
  `node:https` with no decompression, or request with `accept-encoding: identity` only when
  the object has no stored encoding; verify byte-exactness).
- `--static-mount /hexagons/next/=<dir>` — serve a local directory (a candidate build) with
  production-like headers: `*.html` and `tile_manifest.json` → `no-cache, no-store,
  must-revalidate`; files whose name contains a 12-hex-char hash `\.[0-9a-f]{12}\.` →
  `public, max-age=31536000, immutable`; everything else `public, max-age=300`. If a sibling
  `<file>.br` exists and the client accepts br and the request has no Range header, serve the
  `.br` bytes with `Content-Encoding: br`. Symlinks inside the dir must be followed.
- A static mount may reference upstream release assets: requests under
  `/hexagons/app/releases/` from a `/hexagons/next/` page must work (same origin, served by
  the proxy mount) — this is how candidates will reuse the live release's tiles/textures.

Range support everywhere: single `bytes=a-b`, `bytes=a-`, `bytes=-n` → `206` with correct
`Content-Range`/`Content-Length`, `Accept-Ranges: bytes` on all 200s, `416` when unsatisfiable.
Ranges on a mirrored object are served from the stored full object. (Ranges + stored
content-encoding: serve 200 full encoded body, as S3 would not apply ranges to...; simply
document the behaviour you choose.)

**The link model** (the heart of it). All response bodies (from all connections/streams) pass
through ONE shared downlink scheduler:
- `bandwidthBps`: body bytes are released in chunks (≤16 KiB) such that the aggregate rate
  across all active responses never exceeds the configured rate; active responses share it
  round-robin (like parallel TCP flows sharing a bottleneck).
- `rttMs`: every request's first byte (headers) is delayed by one RTT after the request arrives.
- `bloatMs`: extra queueing delay added to the TTFB of a new request, scaled linearly by how
  busy the link is: `extra = bloatMs * min(1, queuedBytes / (bandwidthBps * 0.5 s))`, where
  `queuedBytes` = body bytes currently waiting to be sent across all responses. This models
  the owner's measured bufferbloat (idle 90 ms, 400–600 ms under load).
- Profiles (select with `--profile`, switch at runtime with `GET /__netlab/profile?name=`):
  `cafe` = 18 Mbit/s, rtt 90, bloat 450 (the owner's measured wifi);
  `slow` = 5 Mbit/s, rtt 150, bloat 600; `fast` = 100 Mbit/s, rtt 20, bloat 20;
  `none` = unlimited (still logs).
- Uplink is not modelled (requests are tiny).
Unit-test the scheduler (Node `node:test`): e.g. one 1 MB response at 8 Mbit/s takes ≈1 s ±5%;
two concurrent 1 MB responses both finish at ≈2 s; a small request issued while a big one is
streaming gets TTFB ≈ rtt + bloat.

Logging: JSONL at `--log <file>`: one line per request with `{t0, ttfbMs, durMs, method, path,
query, range, status, bytes (body bytes actually sent), encoding, mirror: hit|miss|static,
stream|conn id, profile}`, times relative to server start in ms with 0.1 ms resolution. Also
`GET /__netlab/mark?name=...` (writes a marker line so the bench can delimit phases),
`GET /__netlab/stats` (JSON counters), `GET /__netlab/health`.

## Component 2 — `scripts/netlab/netlab_bench.py` (CDP driver)

Launch Chrome (`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`) headless=new
with a fresh profile, `--ignore-certificate-errors`, window 1440×900, `--force-device-scale-factor`
from `--dpr` (default 1). Verify the page's service worker registers over the self-signed cert;
if Chrome refuses, find the flag combination that works (e.g. also
`--unsafely-treat-insecure-origin-as-secure` / `--allow-insecure-localhost` with the host
`localhost`) and document it. The whole point is that SW + Cache Storage behave like production.

Scenarios (`--scenario`), each producing one JSON result:
- `cold`: fresh profile, open `<url>` (e.g. `https://localhost:8443/hexagons/app/?view=1&at=...&eye=...`),
  observe `--observe` seconds (default 90).
- `warm`: run `cold` first (unmeasured seed, same profile), then navigate again and measure.
- `pan`: after cold load has run 45 s, pan the camera east by 3 km over 6 s (smoothly, by
  moving `controls.target` and `camera.position` together each animation frame via
  `Runtime.evaluate` + the same notify/update calls `view_state.js` `applyPoints` uses), hold
  25 s, pan back over 6 s, hold 25 s. Mark phases in the server log.
- `jump`: after 45 s, teleport 12 km west (same mechanism), hold 45 s.
Pick one fixed default view in the Stubai area that shows mountains filling the frame (use the
app's default start view if it is deterministic for a fresh profile — check how it is chosen —
otherwise define one explicit `?view=1&at=&eye=` URL and use it for every run). All scenarios
must be deterministic for a given build.

Metrics (all in the result JSON):
1. **Visual completeness**: capture a screenshot every 500 ms (`Page.captureScreenshot`,
   JPEG q70, scaled to 720×450). After the observe window: switch the server profile to `none`,
   wait until the server has seen no new request for 8 s (cap 90 s), then capture a reference
   frame. VC(t) = similarity of frame(t) to the reference: use mean SSIM over 8×8 grayscale
   blocks (implement with numpy; no scipy/skimage needed) — verify it gives ~1.0 for identical
   frames and is monotone-ish on a real load. Report SpeedIndex-style
   `∫(1−VC)dt` (ms), `tVC50`, `tVC85`, `tVC95`, and the full curve. For `pan`/`jump`, compute
   the same per phase (reference = settled frame at the end of each hold, captured the same way
   — you may need to repeat the "switch to none and settle" step per phase; document).
   Save frames as a contact sheet PNG per run (small thumbnails every 2 s) for humans.
2. **App milestones** via polling `Runtime.evaluate` every 250 ms: time the `#loader` becomes
   hidden (computed display none / `pistonViewer.loaderHidden`), `pistonViewer._frameCounter`
   progress, plus any profiler milestones exposed.
3. **Network** from the server log (between the run's marks): total body bytes, bytes and
   request counts by category — manifest, html/js/css/wasm/fonts, service-worker,
   `tiles_bin` (geometry), `aerial_pages/bootstrap|low|medium|high` (textures; for ranged
   requests also record which byte ranges), other — plus **re-download bytes**: body bytes
   for (path, range) pairs already fully served earlier in the same run. Also time-to-last-byte
   of the manifest, and the time the first `tiles_bin` response completes.
4. **Memory**: `Performance.getMetrics` JSHeapUsedSize at the end, plus Chrome's total RSS
   for the headless process tree (sum `ps -axo pid,ppid,rss,command` over the tree).

Output: `--out <dir>` containing `result.json`, `contact.png`, `frames/` (optional, off by
default to save disk), and a one-screen `summary.md`.

## Component 3 — `scripts/netlab/netlab_compare.py` and `scripts/netlab/README.md`

`netlab_compare.py A/result.json B/result.json [...]` → markdown table of the key metrics with
deltas (%). README: how to seed the mirror, start the server, run baseline vs candidate, the
profiles, the metric definitions, and known limitations (e.g. HTTP/2 vs production HTTP/3,
Cloudflare edge cache not modelled).

## Definition of done

1. Mirror seeded for the default view + pan + jump areas at profile `none` against upstream
   (this downloads maybe 0.5–1 GB — fine; the owner's link is ~18 Mbit/s, so budget time).
2. Baseline numbers for the LIVE site replayed from the mirror (`--offline`), profile `cafe`,
   scenarios `cold`, `warm`, `pan`, `jump`, each run 2× (report both; note variance). Put them
   in `scripts/netlab/BASELINE.md` with the exact commands.
3. A self-check demonstrating the link model: e.g. `curl` a 6 MB texture through `cafe` and
   show ~2.7 s transfer; show two parallel downloads share bandwidth; show TTFB inflation
   under load.
4. Everything committed. Final commit message starts with `[netlab] DONE`.

If you get blocked, commit what you have with `status: blocked:<reason>` and a note in
`scripts/netlab/README.md` explaining exactly what is missing. Prefer finishing a smaller,
correct harness over a larger, dubious one — but the VC metric, the link model, Range support,
SW-over-HTTPS, and byte accounting are all required.
