# Slow-network load performance — 2026-09-27

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

_(filled in from netlab A/B and real-wifi runs below)_

## How to promote `/hexagons/next` to `/hexagons/app`

Nothing about the live release changes: the new shell reads the same immutable
`releases/<id>/` terrain and imagery (and, if published, the brotli split
parts under `hexagons/next/releases/<id>/tiles_split/`).

```sh
node frontend/app/build.mjs                       # or HEXAGONS_DIST_DIR=... for a scratch build
python3 scripts/stage_next.py --target app --promote-live [--tile-split '<template>'] --dry-run
python3 scripts/stage_next.py --target app --promote-live [--tile-split '<template>']
```

The script uploads the compact manifest and hashed bundles first and
`index.html` last (the atomic switch), and leaves `app/tile_manifest.json`
untouched so any old shell still open in a browser keeps working. The v2
service worker replaces v1 on the next visit and deletes v1's orphaned caches
(only in the `/hexagons/app/` scope). Rollback = re-upload the previous
`index.html` (its hashed bundles are still there).

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
