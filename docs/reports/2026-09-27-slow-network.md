# Slow-network load performance — 2026-09-27

**Deployment update, 2026-10-03:** merged into `master`, including `perf/followups`, and promoted to <https://wheatley.cloud/hexagons/app/>. Compressed split terrain now lives under `/hexagons/app/releases/`, so the app has no dependency on `/next/`. The staging and old viewer routes have been removed at the owner's request. Measurements below are the original September 27 results; no new benchmarks were run. Fog and horizon haze are removed; the finite camera clip plane now spans the baked region. Screen-space streaming permits the existing 128 px mip for distant coverage and releases superseded 256 px coverage. After URL/saved-view restoration (Stubai remains the default), startup warms at most 24 nearby 128 px imagery prefixes within 6 km, or 8 on the low capability profile, two at a time below visible-loading priority. This uses existing baked imagery and the shared persistent byte store; `?prefetch=0` also disables startup preloading. Browser smoke checks covered the default, a shared location, pitched terrain, and a 50 km zoom-out; these are functional checks, not new performance measurements.

Branch: `perf/slow-network`. Staged (not live): <https://wheatley.cloud/hexagons/next/>.
The live app at `/hexagons/app/` is untouched.

## Why the live site was slow (measured, not guessed)

Measured against the live full-Tirol release (`20260730T071045Z-1548e536091d`,
8,372 GSP3 tiles, 5,290 texture pages) on the owner's wifi (~18 Mbit/s down,
90 ms idle, 400–600 ms under load) and in `scripts/netlab` replays.

| Cause | Evidence |
|---|---|
| High-res texture pages are 6.35 MB each, and visible pages jumped straight from a 64 px placeholder to the full 4096 px file | 7 such pages = 42 of the 51 MB a cold 90 s load transfers |
| Manifest is 4.6 MB JSON (477 KB on the wire), `no-store`, fetched every visit; the v1 service worker held it back until it had parsed and re-stringified it | netlab: manifest last byte ~0.8 s |
| Repeat visits re-download everything | v1 SW never cached what the workers fetched (they start before the SW controls the page); every app deploy also wiped the runtime cache (named per build). netlab warm run: 50 MB again |
| "Ejection": any tile leaving the view was disposed immediately; panning back re-fetched, re-parsed and re-meshed it | netlab pan: up to 35 MB re-downloaded, 12 s to look complete again on return |
| Terrain always fetched whole (280 KB/tile, uncompressed), even beyond 10 km where 952 bytes suffice | no distance cap on residency; tilted views pull hundreds of far tiles |
| Startup built 8,372 + 410,228 horizon instances before the first tile request; every tile load/unload re-uploaded the whole horizon buffer (25 MiB for the moving horizon) | `initWorld` ordering; `setHorizonTileHidden` |
| Chrome reports bufferbloated wifi as `effectiveType: 3g`, which silently dropped visits to the *low* profile (2 workers, 1 texture job, no high imagery) | observed in the in-app browser on this wifi |
| Smaller: the 408 KB transcoder wasm downloaded 3× per first visit; a per-frame O(islands) milestone walk that never stopped in production; magenta "missing page" debug colour shown to users while loading | netlab request logs; frame captures |

## What changed

### Texture streaming (no rebake)
KTX2 stores mips smallest-first with an explicit level index, so any byte
prefix of a published 4096 px page rebuilds into a valid smaller texture
(`ktx2_prefix.js`; tests prove byte-identical transcoder output):
28 KB → 256 px, 400 KB → 1024 px, 1.58 MB → 2048 px, 6.35 MB → 4096 px.
Pages stream progressively over HTTP Range from the *existing* release
objects, one level per step, coarse steps first, and only as far as the
**screen-space rule** needs (≥ 1 texel per device pixel at the page's nearest
point; owner-approved). low/medium tiers come from the same object's prefix.

### Network
`net_scheduler.mjs`: one priority queue for every large download, admitting by
bytes in flight sized from measured throughput and latency (so multi-MB
transfers cannot sit in front of an urgent request on a bufferbloated link),
prefetch only on an idle link. `texture_byte_store.mjs`: grows each object's
prefix with contiguous Range chunks, never refetches a byte, persists to Cache
Storage (so repeat visits and pan-backs don't touch the network).

### Terrain streaming (codex/geo)
GSP3 tiles are fetched only as deep as the planner's L3 frontier needs —
952 B beyond ~10 km, 6.4 KB at 5–10 km, 45 KB at 2–5 km, full near — in one
worker pass; resident tiles refine by appending the missing bytes. On modest
links the first request stops at 6.4 KB so the whole view gets real terrain
almost at once, then refines. Optional brotli split parts
(`scripts/publish_tile_split.py`) halve the bytes of near tiles.

### Startup & residency (codex/startup)
First tile/texture requests go out before any horizon work; the 410k-instance
moving horizon is built lazily; horizon show/hide uploads only the changed
instances; boot starts settled; `InstancedMesh.dispose()`; indexed VRAM ledger;
**outside tiles stay resident but hidden** within a per-profile geometry budget
and re-enter instantly.

### Manifest, service worker, shell
Compact manifest (`scripts/compact_manifest.py` ↔ `manifest_codec.mjs`,
round-trip verified): 4.6 MB → 381 KB → 113 KB brotli, content-addressed and
immutable; the published `index.html` declares and preloads it (no pointer
round trip). Service worker v2: scope-namespaced caches, runtime cache survives
app deploys and is pruned per release, Range requests bypass it. The
transcoder is compiled once and shared with workers. Idle pre-download of
nearby off-screen terrain/imagery (session-capped). Neutral loading tone
instead of magenta. `3g` no longer forces the low profile.

## Measurements

### netlab (offline replay, `cafe` link: 18 Mbit/s, 90 ms, +450 ms under load)

Live = production shell replayed from the mirror (`scripts/netlab/BASELINE.md`).
Staged = this branch served at `/hexagons/next/` against the same release files,
`?prefetch=0` (idle pre-download off so the quiet-network reference is reached).
Times are seconds; VC = block-SSIM visual completeness against the settled frame.

| Scenario | Build | Loader | VC50 | VC85 | VC95 | MB | Re-DL MB |
|---|---|---:|---:|---:|---:|---:|---:|
| Cold first visit | live | 1.7 | 3.5 | 5.0 | 14.5 | 51.0 | 0.8 |
| | staged (final) | 1.2 | 1.5 | 3.0 | 4.0 | 8.5 | 0.0 |
| Repeat visit (HTTP cache cleared) | live | 1.7 | 2.5 | 5.0 | 14.0 | 50.1 | 0.0 |
| | staged (final) | 1.0 | 1.0 | 1.5 | 1.5 | 0.8 | 0.0 |
| Jump 12 km west (phase after jump) | live | – | 1.0 | 4.0 | 9.0 | 104.2* | 0.8 |
| | staged (final) | – | 0.5 | 1.0 | 2.0 | 16.1* | 0.0 |
| Pan 3 km east and back (return phase) | live | – | 6.0 | 6.0 | 6.0–12.0 | 17.6–144.6* | 4.6–35.0 |
| | staged (final) | – | 6.0 | 6.0 | 6.5 | 14.8* | 0.0 |

\* whole scenario. Pan phases include the 6 s camera move, so 6.0 is the floor.
Live pan varied run to run (two runs shown as a range). Frames are sampled every
0.5 s. "final" = split brotli terrain tiles + everything below; the earlier
candidate without split tiles measured cold VC95 6.0 s / 11.6 MB.

Coarse-first terrain on vs off (`?coarse=0`) was a wash on this link (cold VC95
5.5 vs 5.0 s, loader 1.0 vs 1.5 s), so the adaptive default stays.

Slow profile (5 Mbit/s, 150 ms, +600 ms under load), staged before split tiles:
loader 2.4 s, VC95 11.5 s, 9.1 MB. The live replay could not complete offline on
that profile (no service worker, loader never hid), so there is no fair live number.

Harness note: until `f54158b` the server log was attributed by time window only;
a reused log tag mixed an older session into a run (a 9.1 MB run read as 60 MB).
All numbers above were recomputed per session; baselines were unaffected.

### Real wifi (this machine's link, through Cloudflare)

Final build, alternating cold loads with live, 27 Sep 19:47–19:51, fresh profile
each (`scripts/netlab/tools/realvc.py`, screenshots every 1 s):

| Build | Loader | SpeedIndex | VC50 | VC85 | VC95 |
|---|---:|---:|---:|---:|---:|
| live | 5.0 / 5.0 | 7.1 / 7.5 | 5.0 / 5.0 | 8.0 / 7.0 | 20.0 / 29.0 |
| staged | 2.0 / 2.0 | 2.1 / 2.6 | 2.0 / 2.0 | 4.0 / 7.0 | 5.0 / 8.0 |

VC is scored against each build's own frame at 65 s; live's is blurrier (edge energy
13.6 vs 17.9), so live's VC times flatter it. The old Stubai-only beta
(`/hexagons/old/app/`, v0.10.0-rc5) cleared its loader at 4 s, showed fallback
pattern/magenta for ~20 s and did not reach VC95 within 45 s (two runs).
An earlier pair before the tiny-request concurrency fix: staged VC95 10/22 s vs live 18/18 s.

### Retina (DPR 2) — what your Mac will actually fetch

The screen-space rule counts device pixels (render DPR is capped at 2), so a Retina
screen asks for one mip level finer: the default view wants 16 pages at 1024 px and
4 at 2048 px (vs 512/1024 px at DPR 1). Real link: ~11.5 MB of imagery, settled by
~15 s (DPR 1: ~3.1 MB, ~10 s). Live fetches 51 MB at any DPR. If you'd rather trade
a little Retina sharpness for speed, scaling `detailBias` by `1 / devicePixelRatio`
(or ~0.7 at DPR 2) in `_applyScreenSpaceTextureLevels` is a one-line change; the dev
"high texture distance" slider previews it (2000 m = 1×).

## Hardening (evening pass, after an independent review)

- `NetScheduler`: a request with no response/body progress for 20 s is aborted
  with a retryable `NetStallError` (timer restarts on every body chunk), so a dead
  connection cannot hold a slot and the byte budget forever. Slow prefetch
  windows (one small latency-bound request) may raise but not lower the
  throughput estimate (real wifi: 17 → 0.8 Mbit/s after settling, before the fix).
- `TextureByteStore`: priority = most urgent caller still waiting (in-flight
  request bumped when one joins), not a permanent max starting at BACKGROUND;
  callers resolve as soon as their bytes are present; the memory budget holds
  when Cache Storage is missing or rejects writes; never evicted mid-download.
- Prefetch and terrain-rebuild failures back off exponentially (no hot loops
  offline); texture/terrain prefix caches are scope-namespaced, pruned per
  release by the service worker, and capped on disk (`prefix_cache_budget.mjs`:
  2 GiB high / 768 MiB mid / 256 MiB low, least-recently-written first); hidden
  tiles are rebound so they no longer pin disposed textures; the high-admission
  block is cleared from the final screen-space tier only.
- Tiny urgent requests (≤ 64 KiB, ≥ VISIBLE: coverage imagery, coarse terrain) may use
  10 extra concurrency slots (2 on the low profile). Real network, three interleaved
  rounds against the same build without it: time until every visible page has
  imagery 12.9/14.0/8.6 s → 9.1/7.0/5.4 s, loader 4.3/2.9/2.0 s → 2.5/2.0/1.4 s.
  Neutral in netlab, whose mirror has no origin latency.
- Failed textures/tiles are now also retried on the window `online` event and on an
  idle backoff (15 s → 2 min) — before, only a camera settle after a move retried
  them. Real network, 25 s outage mid-load (`PROBE_OFFLINE=4,29 tools/probe.py`):
  before, 17 visible pages stayed at 256 px through 66 s; after, all 20 reached their
  screen-space level 12 s after reconnecting. No fatal state, no retry storm offline.
- Tried and reverted: fetching coverage bytes ahead for queued texture tasks (16 extra
  lookahead fetches) measured no better on the real link (median time to coverage
  7.0 s vs 5.5 s without, three interleaved rounds).
- Texture jobs wait at most 10 s for the shared Basis module and post only the
  mips they need; the stage script uploads hashed shell assets as q11 brotli
  (main.js 268 → 220 KB, transcoder wasm 408 → 326 KB on the wire).

### Follow-ups (independent review of the late commits, 20:40 — both low severity)

Both are fixed on branch `perf/followups` (`3d8405b`, unit test added; netlab cold run
identical to the staged build: loader 1.0 s, VC95 4.0 s, 8.5 MB). Not staged yet —
merge it into `perf/slow-network` and restage when convenient.

1. `main.js` `_idleResweep`: `_idleResweepRound` only resets on the `online` event, so
   after a burst of server errors later failures wait the 120 s cap instead of 15 s.
   Reset it on a successful texture install or on the settle-transition resweep.
2. `net_scheduler.mjs` `_pump`: when the most urgent queued item is a large request
   blocked on concurrency, tiny urgent items behind it cannot use the extra slots.
   When the head item is blocked, also try the best tiny urgent item. No deadlock;
   the speedup just doesn't apply in that case.

## How to promote `/hexagons/next` to `/hexagons/app`

Nothing about the live release changes: the new shell reads the same immutable
`releases/<id>/` terrain and imagery (and, if published, the brotli split
parts under `hexagons/next/releases/<id>/tiles_split/`).

```sh
node frontend/app/build.mjs                       # or HEXAGONS_DIST_DIR=... for a scratch build
SPLIT='/hexagons/next/releases/<release>/tiles_split/gosper_{yq}_{yr}.{part}.bin'
python3 scripts/stage_next.py --target app --promote-live --tile-split "$SPLIT" --dry-run
python3 scripts/stage_next.py --target app --promote-live --tile-split "$SPLIT"
```

The script uploads the compact manifest and hashed bundles first and
`index.html` last (the atomic switch), and leaves `app/tile_manifest.json`
untouched so any old shell still open in a browser keeps working. The v2
service worker replaces v1 on the next visit and deletes v1's orphaned caches
(only in the `/hexagons/app/` scope). Rollback = re-upload the previous
`index.html` (its hashed bundles are still there).

## S3 vs Cloudflare (measured 27 Sep 20:22, Vienna PoP)

Bucket: 72.8 GB / 84,706 objects; the live release the viewer reads is ~28.7 GB
(high pages 26.2 GB, tiles 2.35 GB, small tiers 0.16 GB) + 1.2 GB split tiles.
TTFB for a 32 KB range: S3 via Cloudflare (DYNAMIC) median 0.33 s (one cold 1.4 s),
Cloudflare edge HIT median 0.26 s → ~70–100 ms per request is all an edge cache
can save here (Zurich is close; the rest is the wifi). Expect ~0.3–0.5 s sooner
first views and no cold-S3 stalls; repeat visits unchanged (browser Cache Storage).
Recommendation: a Cache Rule (URI path contains `/releases/` → eligible, edge TTL
from Cache-Control) + Smart Tiered Cache; R2 is a cost/ops choice (server-side
copy via Super Slurper/Sippy), not a speed one; Pages is not needed for the shell.

## Recommendations outside the code

1. **Cloudflare cache rule for release assets.** `.ktx2` and `.json` are not in
   Cloudflare's default cacheable extensions, so every texture Range request and
   every manifest goes to S3 in Zurich (`cf-cache-status: DYNAMIC`). A Cache
   Rule "URI path contains `/releases/` → Eligible for cache, respect origin
   TTL" makes them edge-cached (they are content-addressed and `immutable`).
   Cloudflare serves byte ranges from a cached object.
2. **Publish tiles pre-split and brotli'd at bake time** (what
   `publish_tile_split.py` does after the fact): ~50% fewer terrain bytes for
   near views, no client cost.
3. **Content-address assets instead of release-scoping them.** Today every
   rebake moves every URL under `releases/<new id>/`, so returning users
   re-download tiles and pages that did not change. Hash-named objects
   (`tiles/<sha12>.bin`) would survive rebakes in every cache.
4. **Stop publishing low/medium KTX2 tiers** once `/next` is promoted: the
   viewer now takes 128/256 px from the 4096 file's prefix.
