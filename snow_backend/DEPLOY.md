# Deploying powfinder/beta to wheatley.cloud

Recon done 2026-07-29 (task #14). Read-only against production throughout —
no writes to S3, no cache purges, no code deploys were made while gathering
this. Findings below, then the exact command sequence.

## 1. Serving chain

`wheatley.cloud` is fronted by Cloudflare, origin is `s3://wheatley-cloud-eu`
(region **eu-central-1** — not eu-central-2, see the recon note from task #1).
Response headers confirm S3 as the origin directly (`x-amz-request-id` /
`x-amz-id-2` present on every response, `server: cloudflare` in front).

**Path mapping is 1:1 for `/powfinder/*`**, verified at depth:
`https://wheatley.cloud/powfinder/app/main.js` returns content-length 38639
and last-modified matching the S3 object `powfinder/app/main.js` exactly.
So `s3://wheatley-cloud-eu/powfinder/beta/...` **will** appear at
`https://wheatley.cloud/powfinder/beta/...` with no extra routing config
needed — confirmed empty right now (`aws s3 ls .../powfinder/beta/` → no
keys).

**Caveat — the mapping is not 1:1 everywhere in the zone.** `/hexagons/beta/`
(top-level, not under `/powfinder/`) serves real content that does **not**
exist anywhere in this bucket (no top-level `hexagons/` prefix, and it
doesn't match `powfinder/hexes_beta/` either — different last-modified,
different content entirely). Cloudflare is clearly routing some top-level
paths to a different origin/mechanism. Weirder: a real, existing object
`powfinder/hexagons/aerial_tiles/full/sector_70_249.webp` (confirmed via
direct `s3api head-object`, ContentLength 1132916, no ambiguity) 404s
through `wheatley.cloud` even though the bare prefix `/powfinder/hexagons/`
200s. Cache-busted retries still 404 (not a stale-cache artifact). I did not
fully root-cause this — flagging it because it proves the routing layer has
non-obvious special-casing somewhere. **Does not block our deploy** (nothing
under `powfinder/beta/` is named `hexagons`), but don't assume arbitrary
nested paths are safe without a spot-check if that ever changes.

**Compression**: Cloudflare applies Brotli on the fly for compressible
content-types (`text/html`, JS, CSS, JSON) regardless of what the origin
sends — confirmed via `Accept-Encoding` test, `content-encoding: br` came
back even though S3 objects carry no `Content-Encoding` metadata. **We do
not need to serve pre-compressed HTML/JS/CSS** for Cloudflare's sake — see
§5 on why we're skipping the build's own `.br`/`.gz` output for that reason.
This does **not** extend to binary/octet-stream content (see sidecars,
below) — Cloudflare's auto-compress only fires for recognized text-ish
mime types.

**Cache-Control is 100% origin-controlled, nothing Cloudflare-side to know
about.** Whatever `Cache-Control` an object is uploaded with is what
Cloudflare honors:
- Objects with no `Cache-Control` (or `no-cache`/`no-store`) → `cf-cache-status: DYNAMIC`, always round-trips to origin. This is what `powfinder/index.html` and JSON data files currently get (no explicit header set at upload time).
- Objects with a real `max-age` → cached at the edge with revalidation (`HIT`/`REVALIDATED`/`MISS` as expected). Existing `app/main.js` carries `max-age=14400` (4h); the big aerial webp tiles carry `max-age=604800` (7d), set directly on the S3 object metadata.

Since `aws s3 sync` sets **no** Cache-Control by default, an unadorned sync
of `powfinder/beta/` will be DYNAMIC (safe from staleness, but every asset
round-trips to eu-central-1 on every load — no free edge caching). See §6
for what I'm recommending.

## 2. `powfinder/beta/` — confirmed empty; `powfinder/` inventory (do not touch)

`aws s3 ls s3://wheatley-cloud-eu/powfinder/beta/ --region eu-central-1` →
zero keys, confirmed at recon time and again right before writing this file.

Existing `powfinder/` tree (**the live old app — our sync must never touch
this**): 1,742 objects, 2.05 GB total. Top-level: `app/`, `hexagons/`,
`hexes_beta/`, `loading_screen_mockup/`, `piston_viewer/`, plus loose
`clientside.mov/mp4`, `hillshade series.png`, `index.html` at the
`powfinder/` root. **Never run `--delete` anywhere near `powfinder/` root —
scope every sync explicitly to `powfinder/beta/`.**

## 3. Directory-index behavior

Confirmed: `https://wheatley.cloud/powfinder/app/` (trailing slash, no
filename) returns the same content as `.../powfinder/app/index.html`
byte-for-byte (identical last-modified, identical content-type). **So
`/powfinder/beta/` will automatically serve `powfinder/beta/index.html`
once we upload it** — no extra config, and frontend links can point at the
directory rather than the literal file.

## 4. Range requests — confirmed, but there's a real tradeoff for sidecars

`curl -r 0-100` against a real S3-served asset returned `HTTP 206` with a
correct `Content-Range: bytes 0-100/38639`. Range GETs work end-to-end
(Cloudflare + S3 origin both honor them).

**Open question I could not resolve — flag for whoever runs the sidecar
sync**: the sidecar `.pfl` files (`snow_backend/data/sidecars/{layer}/...`)
are one file per hour already (not one giant file needing internal
byte-range slicing), and I could not find frontend fetch code or a design
doc that confirms sub-file Range-GET slicing is actually used (searched
`main.js`, `snowpack/README.md`, `docs/*.md` — no hits; frontend fetch logic
may not be written yet, task #10 is still in progress). This matters
because it's a **real fork in the road**:
- If the frontend only ever fetches whole `.pfl` files per hour → safe to gzip-compress them before upload (`Content-Encoding: gzip`), shrinking the payload roughly 15-60x (see §5).
- If the frontend does byte-range slicing *within* a single hour's file (e.g. to fetch only visible tiles) → **do not** set `Content-Encoding: gzip`, since a Range GET against a gzip stream returns compressed bytes at the wrong offsets relative to the decompressed content. Must serve raw.

**Confirm with the frontend (#10) owner before choosing.** I'm defaulting
the command sequence below to raw/uncompressed (safe under both scenarios)
and documenting the gzip alternative as an explicit opt-in.

## 5. Payload estimate — measured against real output, not guessed

The winter backfill (#8) has actually finished a full run as of this recon
(15 GB total across all 8 layer subdirs in `snow_backend/data/sidecars/`,
each layer at exactly 4,344 files = full winter coverage). Real numbers,
not estimates:

| Component | Files | Raw size | Notes |
|---|---|---|---|
| `frontend/app/dist/` (build output, no `.br`/`.gz`) | 14 | 3.95 MB | esbuild output, all JS/CSS/font/wasm content-hashed |
| `frontend/landing/` | 22 | 75 MB | mostly jpg/png/webp |
| Sidecars — **display layers only** (`sqh/`, `depth/`, `surface/`) | 13,032 | **5.7 GB** | 3 × 4,344 hourly `.pfl` files |
| Sidecars — **engine-only layers** (`slab/`, `hn24/`, `hn72/`, `sdens/`, `wet/`) | 21,720 | 9.5 GB | **NOT meant for the frontend** — `sidecar.py`'s own docstring calls the display layers "the frontend contract"; the other 5 are internal (e.g. `slab` feeds the avalanche computation). **Exclude these from the deploy entirely.** |
| Avalanche daily layer (`avalanche_work/out/`) | 171 | 39 MB | task #9 output |
| **Total to actually deploy** | **~13,239** | **~5.82 GB raw** | matches the "~13k objects" estimate on count; the *byte* total is ~2.2x the original 2.6 GB guess because that guess assumed gzip at upload |

**Real gzip ratio, tested on live sample files** (not assumed): far better
than the "~200 KB/file" guess —
- `sqh`: 473,029 B → 7,594 B gzip'd (**62x**)
- `depth`: 473,029 B → 28,717 B gzip'd (**16x**)
- `surface`: 473,029 B → 43,838 B gzip'd (**11x**)

If the Range-GET question in §4 resolves in favor of gzip, the sidecar
payload drops from 5.7 GB to **~330 MB**, total deploy ~450 MB instead of
~5.82 GB. Worth resolving before the real deploy — it's an 8x difference in
transfer volume.

**S3 PUT cost / count sanity check**: ~13,239 PUT requests × ~$0.0054/1,000
≈ **$0.07**. Storage: 5.82 GB × ~$0.023/GB-month ≈ **$0.13/month** (or
~$0.01/month if gzip'd). Negligible either way — not a real constraint on
the deploy design.

Note `.pfl` has no registered MIME type — `aws s3 sync`'s default
content-type guesser will fall back to `application/octet-stream` unless
told otherwise. That's fine for correctness (browsers reading via
`ArrayBuffer`/`fetch` don't care), but worth setting explicitly and
consistently rather than leaving it to guesswork (see command below).

## 6. Exact deploy command sequence

Run from the `Hexagons-powfinder-beta` worktree root. **Never add `--delete`
to any command whose destination prefix is broader than `powfinder/beta/`.**

```bash
# --- 1. Frontend app build (dist/) ---
# Skip the .br/.gz siblings — Cloudflare compresses text/html/js/css/json on
# the fly (§1), so uploading precompressed variants just doubles object
# count/storage for content Cloudflare would negotiate itself. If that ever
# changes (e.g. moving off Cloudflare), revisit.
aws s3 sync frontend/app/dist/ \
  s3://wheatley-cloud-eu/powfinder/beta/ \
  --region eu-central-1 \
  --exclude "*.br" --exclude "*.gz" \
  --cache-control "no-cache, no-store, must-revalidate" \
  --exclude "assets/*" \
  --no-progress

# Hashed assets subdir gets a long cache TTL — filenames are content-hashed
# (12-char sha256), so a redeploy never collides with a stale cached copy at
# the same URL. Safe to cache aggressively.
aws s3 sync frontend/app/dist/assets/ \
  s3://wheatley-cloud-eu/powfinder/beta/assets/ \
  --region eu-central-1 \
  --exclude "*.br" --exclude "*.gz" \
  --cache-control "public, max-age=31536000, immutable" \
  --no-progress

# index.html and tile_manifest.json specifically must stay no-cache (they're
# the mutable entry points the hashed bundle names get read from) — the
# first sync above already covers index.html; tile_manifest.json needs the
# same treatment explicitly since it's excluded from the assets/ subtree:
aws s3 cp frontend/app/dist/tile_manifest.json \
  s3://wheatley-cloud-eu/powfinder/beta/tile_manifest.json \
  --region eu-central-1 \
  --cache-control "no-cache, no-store, must-revalidate" \
  --content-type "application/json"

# --- 2. Landing page ---
aws s3 sync frontend/landing/ \
  s3://wheatley-cloud-eu/powfinder/beta/landing/ \
  --region eu-central-1 \
  --cache-control "public, max-age=3600" \
  --no-progress

# --- 3. Sidecars — DISPLAY LAYERS ONLY (sqh, depth, surface) ---
# Confirm the Range-GET question in §4 before adding --content-encoding gzip.
# Default here is raw/uncompressed (safe under both scenarios).
for layer in sqh depth surface; do
  aws s3 sync "snow_backend/data/sidecars/${layer}/" \
    "s3://wheatley-cloud-eu/powfinder/beta/${layer}/" \
    --region eu-central-1 \
    --content-type "application/octet-stream" \
    --cache-control "public, max-age=31536000, immutable" \
    --no-progress
done
# Do NOT sync slab/, hn24/, hn72/, sdens/, wet/ — engine-internal, not part
# of the frontend contract (§5).

# index.json / latest.json — mutable pointer files, no long cache:
aws s3 cp snow_backend/data/sidecars/index.json \
  s3://wheatley-cloud-eu/powfinder/beta/index.json \
  --region eu-central-1 --content-type "application/json" \
  --cache-control "no-cache, no-store, must-revalidate"
aws s3 cp snow_backend/data/sidecars/latest.json \
  s3://wheatley-cloud-eu/powfinder/beta/latest.json \
  --region eu-central-1 --content-type "application/json" \
  --cache-control "no-cache, no-store, must-revalidate"

# --- 4. Avalanche daily layer ---
aws s3 sync snow_backend/avalanche_work/out/ \
  s3://wheatley-cloud-eu/powfinder/beta/avalanche/ \
  --region eu-central-1 \
  --content-type "application/octet-stream" \
  --cache-control "public, max-age=86400" \
  --no-progress

# --- 5. Verify ---
curl -sI https://wheatley.cloud/powfinder/beta/ | head -5
curl -sI https://wheatley.cloud/powfinder/beta/index.json | head -5
aws s3 ls s3://wheatley-cloud-eu/powfinder/beta/ --region eu-central-1 --recursive --summarize | tail -3
```

No cache purge is needed for a first deploy (target is empty). For a
**re**-deploy over existing beta content: index/manifest/JSON paths are
already `no-cache` so they update instantly; the hashed `assets/` bundle
never collides by construction; the sidecar `.pfl` files are `immutable`
with a 1-year TTL under the assumption that a given hour's data, once
written, never changes — if that assumption ever breaks (e.g. a backfill
correction), that path needs either a version-bumped URL or a manual
Cloudflare purge for the affected keys.
