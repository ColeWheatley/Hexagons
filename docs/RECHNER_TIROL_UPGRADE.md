# Tirol display coverage upgrade — Claude handoff for Rechner

Prepared by Codex, 2026-10-29. Investigation baseline: Hexagons `e543a1f0ca5d560c5a2fd0d9214d4820b8c292fd`. The remote default branch is **master**, verified with `git remote show origin`. This document supersedes the source-union coverage rule in [RECHNER_BIG_BAKE.md](RECHNER_BIG_BAKE.md) for this upgrade; that document remains useful for the existing transaction machinery.

## Execution brief and limits

Cole will launch Claude on Rechner personally. This handoff authorizes that later Claude session to implement the missing pipeline work, fetch missing official Tirol sources, crop and bake on Rechner, validate the staged app and deploy it normally. Preparation of this document did **not** start downloads, bakes, training, services or automation.

Use Opus medium for orchestration, Fable high for creative/scientific decisions, Sonnet medium for investigations and Haiku high for mechanical implementation. Check availability in that session; do not silently substitute a different routing policy. Preserve unrelated changes, all existing imagery, current production and rollback releases. No cleanup campaign, data deletion, R2 purge, or changes to Nunatak's archived snow demo. The new Nunatak forecast frontend is separate. Student snow prediction remains approximately 30 m; **5 m is the detailed display DEM resolution**, not neural input resolution.

## First answer: source imagery and disk inventory

Evidence collected on this Mac on **2026-10-29, approximately 19:04–19:13 UTC (20:04–20:13 Vienna)**. Values are bytes; allocated bytes are `stat.st_blocks * 512`, not guaranteed unique physical APFS extents. Counts exclude symlinks and distinguish copies from unique SHA-256 contents.

| Host / path | Kind | Files | Logical bytes | Allocated bytes | Evidence |
|---|---|---:|---:|---:|---|
| Mac `/Users/cole/dev/Hexagons/freiger/orthos/source` | Original DOP TIFFs | 28 | 281,920,971 | 281,980,928 | All 28 full SHA-256 values match audited source TSV |
| Mac `/Users/cole/Documents/Codex/2026-07-30/okay-here-is-the-goal-today/work/orthos` | Original DOP TIFFs | 6 | 66,228,543 | 66,240,512 | All 6 full SHA-256 values match audited source TSV |
| Mac `/Users/cole/Downloads` (`dop_3421-37_2022.tif`, `dop_2721-35_2022.tif`) | Other Tirol DOP TIFFs; relevance to cutline not established | 2 | 18,801,258 | 18,804,736 | Not in historical TSV; do not count as approved upgrade sources without spatial/header validation |
| Mac total found | Source TIFF **copies** | **36** | **366,950,772** | **367,026,176** | **35 unique contents / 357,859,885 unique logical bytes**; one duplicate `dop_2221-28_2023.tif` across first two directories |
| Mac `/Users/cole/dev/Hexagons/hex_backend/aerial_tifs` | Configured source directory | 0 present | 0 | 0 | Path absent; no source symlink there |
| Mac `/Users/cole/dev/PowFinder/backend/terrains/DGM_Tirol_5m_epsg31254_2006_2020.tif` | Reusable original 5 m DGM | 1 | 1,162,943,426 | 1,162,944,512 | Raster header and tiny valid pixel read verified |
| Mac `/Users/cole/dev/Hexagons/hex_backend/DGM_Tirol_5m_epsg31254_2006_2020.tif` | Configured 5 m DEM | 0 present | 0 | 0 | Path absent, despite reusable copy above |
| Mac saved checkout `frontend/app/aerial_pages`, `frontend/app/tiles_bin` | Derived texture pages / baked GSP tiles | 0 present | 0 | 0 | Paths absent; `dist/aerial_pages -> ../aerial_pages` is dangling |
| Mac `/Users/cole/dev/hexagons-netlab-mirror` | Derived HTTP cache, **not source imagery** | 409 KTX2; 209 BIN; 82 WebP | 1,327,162,362; 58,554,694; 51,990 | 1,327,951,872; 59,068,416; 335,872 | File extension totals; cached objects may include prefixes/variants, not unique production pages/tiles |
| Mac searched Hexagons source/cache paths | Derived imagery COGs | None found | — | — | TIFFs above are original DOPs, not a discovered COG corpus |
| Rechner `/home/cole/data/Hexagons/aerial_tifs` | Historical original source corpus | **3,486 historical** | **26,417,719,175 historical** | Unknown now | July-20 runbook + tracked filename/size/SHA-256 inventory; **not live verified** |
| Rechner `/home/cole/dev/Hexagons/hex_backend/aerial_tifs` | Expected symlink to stable data directory | Unknown now | Unknown | Unknown | Must resolve on Rechner before execution |
| Rechner configured DEM, `local_data/cache`, `local_data/bakes`, source/COG/page/tile storage | Original DEM / derived products | Unknown now | Unknown | Unknown | SSH unavailable during this audit |

Thus only about **367 MB of source copies were found on the Mac** in the searched locations. The documented bulk corpus is on Rechner (26.42 GB), but **we cannot confirm that most are still there today**: two read-only `ssh -o BatchMode=yes -o ConnectTimeout=… rechner` attempts timed out on port 22. No new access setup was attempted. Rechner free disk is unknown; July's 204 GiB figure is stale. The Mac had **33,257,656,320 bytes available** (`df -k`, 32,478,180 KiB), too little to treat as a safe large-bake host.

Search scope: recursive raster/source-name inspection of `/Users/cole/dev`, Documents, Desktop, Downloads, `.codex/worktrees`, Trash and mounted `/Volumes`; inspected configured paths and data symlinks. This is a confirmed discovered inventory, not a forensic census of all hidden folders, unmounted disks or cloud-only files. Test KTX2s, QGIS sample rasters, satellite imagery and unrelated weather/terrain products are not original Hexagons orthophotos. No bucket census was performed.

Reproducible historical identities: [`hex_backend/aerial_source_inventory.tsv`](../hex_backend/aerial_source_inventory.tsv), 3,486 filename/byte/full-SHA-256 rows. Raw URL rule in [`restore_corpus.py`](../hex_backend/aerial_downloader/restore_corpus.py): `https://gis.tirol.gv.at/geo/dop/m28/<filename>`. A representative HEAD on `dop_2221-28_2023.tif` returned 200, 9,090,887 bytes. The historical restorer checks every completed file's full digest; names alone are insufficient.

### First actions when Claude is launched on Rechner

Inspect checkout instructions and changes before updating. Do not reset, clean or delete anything. Confirm the actual data host before choosing output storage. Run these **read-only** checks locally on Rechner (or through the existing SSH alias):

```bash
hostname
date -u
git -C /home/cole/dev/Hexagons status --short --branch
git -C /home/cole/dev/Hexagons remote -v
ls -ld /home/cole/data/Hexagons /home/cole/data/Hexagons/aerial_tifs \
  /home/cole/dev/Hexagons/hex_backend/aerial_tifs
readlink -f /home/cole/dev/Hexagons/hex_backend/aerial_tifs
df -B1 /home/cole/data/Hexagons /home/cole/dev/Hexagons /tmp
```

Inventory actual source and derived directories separately; `Path.stat()` follows a resolved root and reports logical/allocated bytes. Extend this small read-only inventory to any alternative roots found in local configuration or symlinks:

```bash
python3 - <<'PY'
from pathlib import Path
from collections import defaultdict
roots = [Path('/home/cole/data/Hexagons'),
         Path('/home/cole/dev/Hexagons/hex_backend'),
         Path('/home/cole/dev/Hexagons/local_data'),
         Path('/home/cole/dev/Hexagons/frontend/app')]
seen = set()
for root in roots:
    if not root.exists():
        print('ABSENT', root); continue
    groups = defaultdict(lambda: [0, 0, 0])
    for p in root.resolve().rglob('*'):
        if not p.is_file(): continue
        resolved = p.resolve()
        if resolved in seen: continue
        seen.add(resolved)
        st = resolved.stat()
        group = (str(resolved.parent), resolved.suffix.lower())
        v = groups[group]
        v[0] += 1; v[1] += st.st_size; v[2] += st.st_blocks * 512
    for group, totals in sorted(groups.items()): print(group, totals)
PY
```

Explicitly inspect symlinks to directories because `rglob` does not recursively follow directory symlinks. Resolve and inventory each external target once. Record source TIFFs, derived COGs, gradients, KTX2/WebP pages, GSP/BIN tiles, partial downloads and release output separately, with UTC timestamp and filesystem free bytes. Record full hashes for selected approved source identities, metadata/pixel reads for all selected rasters. Reconcile existing restore reports and bake inventories without assuming they prove present files. Preserve all valid old source even if outside the new selection.

## Canonical coverage contract

**Tirol administrative state territory excluding district Lienz (East Tyrol), clipped west of the north–south meridian through Wörgl town centre.** West, north and south follow the real state boundary. Only the east edge is an artificial straight longitude cutoff. Preserve real North Tirol, Außerfern and disconnected administrative pieces present in the source. Do not acquire an expanded rectangle across Switzerland, Germany or Italy. Border source sheets may straddle borders; download whole official sheets only when they intersect the target, then mask output to the cutline.

The source-controlled executable cutline is [`config/coverage/hexagons_tirol.geojson`](../config/coverage/hexagons_tirol.geojson), **2,431,982 bytes**, SHA-256 **`6ac6395ae5fc8f76fc639e13f59cff453047eac161b832710a56fdcb186e342a`**. It is an exact byte copy of Nunatak `frontend/viz/hexagons_tirol.geojson`, validated and provided by the coordinated map task on 2026-10-29 from `/Users/cole/.codex/worktrees/04ac/nunatak`. Rechner can use this repository copy without access to the Mac worktree. The geometry embeds full source ZIP digest, transformation pipeline and landmark validation metadata.

Source: [BEV VGD Tirol, 2026-04-01 snapshot](https://data.bev.gv.at/download/Verwaltungsgrenzen/shp/20260401/VGD_Tirol_20260402.zip), layer VGD_Tirol, EPSG:31287. Dissolve all 288 non-Lienz cadastral records out of 350; transform with Austria-wide MGI to WGS84 (3), `always_xy=True`, reported transformation accuracy 1.5 m; clip in WGS84 at **longitude <= 12.0636°E**. No simplification or coordinate rounding. **© BEV 2026, CC BY 4.0**; [official metadata](https://data.bev.gv.at/geonetwork/srv/api/records/d39a9211-af60-445d-a0a7-1e89e4617b78). The [Wörgl municipal website](https://www.woergl.at/rathaus/woergl) city-office point is 47.4873°N, 12.0636°E; this is the explicitly adopted civic town-centre reference, not a surveyed unique town centroid.

The file has **two polygon components (mainland North Tirol and Jungholz), zero holes, ~8,993.855 km²**. Revalidate included Innsbruck, Hintertux, Karwendel, Vent/Ötztal, Reutte and Jungholz; excluded Lienz, Kitzbühel, Germany, Italy, Switzerland and Vorarlberg. The coordinated source builder is Nunatak `frontend/viz/tools/build_hexagons_tirol.py`; its provenance note is `frontend/viz/hexagons_tirol.md`. Reuse the committed GeoJSON directly; rebuilding must reproduce this contract and be reviewed if its digest changes.

```bash
sha256sum config/coverage/hexagons_tirol.geojson
# expected 6ac6395ae5fc8f76fc639e13f59cff453047eac161b832710a56fdcb186e342a
```

Never use `hexagons_tirol_proposal.md`, the rejected Gemini rectangle, a convex hull, a bounding box or a synthetic ring joining separate components. A bounding box may accelerate candidate lookup only; exact component-aware intersection/masking decides inclusion. Keep holes and MultiPolygon topology. Share the identical canonical file and hash with Nunatak's forecast frontend; do not independently redraw it.

## Sources, reuse and data preparation

1. **Orthophotos:** [Land Tirol official download page](https://www.tirol.gv.at/sicherheit/geoinformationen-karten/freie-laserscandaten-und-orthofotos/) links the [official sheet viewer](https://tiris.maps.arcgis.com/apps/webappviewer/index.html?id=5849fe1df5994dc8a3c1e4675682d2fd). It documents 20 cm original GeoTIFFs on 1:2000 sheets. Enumerate official available sheets/years and their true footprints; transform canonical geometry for intersection. Reuse validated old TIFFs first, select a deterministic single source per footprint, and fetch only missing target-intersecting sheets. Preserve year/acquisition provenance and record overlap preference; do not blindly replace valid older imagery merely because a newer release exists. Do not guess a 2023 URL for every missing sheet.
2. **5 m terrain:** Prefer a validated existing Rechner DGM. If missing, the Mac PowFinder file above is a reusable seed (explicit transfer by later executor), but test target coverage and nodata, not just its bounding box. It is EPSG:31254, 45,538 × 26,612 Float32, 5 × 5 m, bounds `[-22687.5,161942.5,205002.5,295002.5]`, nodata `-9999`; tiny pixel read gave 1516.876953125 m. Preserve original and crop to a new file. Official [Tirol DGM catalogue](https://www.data.gv.at/datasets/0454f5f3-1d8c-464e-847d-541901eb021a) offers DGM 5 m EPSG:31254, not DOM. [Current official ZIP](https://gis.tirol.gv.at/ogd/geografie_planung/DGM/DGM_Tirol_5m_epsg31254.zip) HEAD returned 200, `application/zip`, 1,174,874,173 bytes, Last-Modified 2026-06-09 06:16:47 GMT. This is metadata verification only; payload/extent/datum and archive members must be validated by later Claude before reuse. A statewide Tirol 5 m package is acceptable as reusable source; final detailed output is the cutline. **Do not invoke `download_dem_50cm.py`** for this task: it fetches the much larger 0.5 m DGM/DOM product, not the requested 5 m display DEM.
3. Use stable Rechner roots outside throwaway checkouts: existing `/home/cole/data/Hexagons/aerial_tifs` for original imagery; proposed new `/home/cole/data/Hexagons/tirol-west-woergl/` for selection manifest, canonical cutline copy, prepared DEM/COGs and reports. These new paths are **proposals to create during later execution**, not audited existing directories. Keep each crop/bake generation separate. If bulk data is found elsewhere, use that actual host/root and record the correction; Rechner remains the intended compute host.
4. Store original URL, source product/CRS, acquisition year, retrieval time, HTTP validators, exact filename/size/SHA-256, raster bounds/resolution/nodata/bands, validity result and selection reason in a versioned source manifest. Preserve the original historical TSV as an immutable baseline; add a separate target manifest. Keep `.part` files stable for HTTP range resume, validate before atomic rename, and make repeated invocation idempotent. Existing restorer is a reference for transaction behavior, **not a general selected-source downloader**: `load_inventory()` insists on the old exact count/bytes.
5. Baking uses absolute EPSG:31254 metre coordinates and the existing global texture grid. Transform the canonical WGS84 cutline with explicit x/y axis order and densify curved transformed boundary segments sufficiently for metre-scale correctness; a straight WGS84 meridian is not necessarily a straight line in the projected CRS. Keep 5 m DEM cell alignment anchored to the source grid (the existing origin has half-metre coordinates); do not silently snap to an incompatible zero-origin grid. Use Float32 elevations, valid-data mask and explicit nodata throughout. Keep 20 cm imagery, bounded resampling and masks; black RGB is not automatically nodata. Derived COGs, if useful, are new cache products and never replace the original inventory.
6. Prepare a tiled, compressed 5 m DEM crop/VRT with appropriate neighbour halo for gradients/interpolation. Preserve nodata holes, keep resampling nodata-aware and document vertical units/datum from metadata; no invented height offsets. Do not compute gradients independently against tile-edge zeros. Compute/reuse gradient cache by DEM+cutline+recipe identity. Composite imagery in bounded windows with sufficient sampling halo so adjacent global pages agree. Mask outside the target after sampling; nearest-edge padding is bounded aggregate overdraw only and must not bridge internal holes, country borders or disconnected components.

## Required implementation before a target bake

These are verified gaps in baseline code, not already-supported CLI flags:

- [`bake_preflight.py`](../hex_backend/bake_preflight.py) `build_preflight()` and `compare_known_source_inventory()` require exactly **3,486 / 26,417,719,175** for `rechner-big`; [`big_bake.py`](../hex_backend/big_bake.py) `validate_runtime_inventory()` repeats that requirement for `production-tirol`. Implement a named target coverage profile with a validated **dynamic** selection manifest and retained production quality checks in both places. Do not merely disable validation or relabel a beta release.
- `select_geometry()` currently intersects TIFF union with DEM **bounds**, sampling DEM validity, without an admin cutline. `big_bake.source_coverage_for_bounds()` rebuilds a union of source rectangles. Pass the canonical geometry and its digest through preflight, inventory and worker initialization. Final leaf validity must use target polygon ∩ valid imagery ∩ valid DEM, including raster masks. Inspect both preflight and runtime paths; changing selection alone does not clip emitted geometry.
- Existing recipe 6.1.1 erodes source coverage by unit-cap circumradius plus 0.5 m to keep full L0 hex caps inside imagery. Preserve that guarantee and deliberately apply the target boundary policy: retain a boundary island's valid leaves, reject leaves whose full rendered cap crosses the permitted cutline, and quantify the narrow resulting edge inset. If exact clipped half-caps are desired, that requires separate geometry support; do not fake it with centre-only inclusion. Test aggregate/skirt overdraw at borders too.
- Keep the absolute global page grid, GSP3 coordinate/layout contract and release descriptors compatible with the current app. Preserve WebP64 + independent low128 / medium256 / high4096 KTX2 tiers, production clean XUASTC 8×6 quality90 effort4, no diagnostic tattoos. Implement the target descriptor consistently in `release_profiles.py`, manifest generation and runtime/publication validation; inspect consumers before selecting the name.
- Include cutline digest, selected-source manifest digest, DEM identity, clipping/gradient/texture recipes and code commit in resume identity. Bump applicable recipes when behavior changes. A newly selected source or changed boundary invalidates affected geometry and pages; old same-named outputs cannot be trusted solely by existence. Never resume an old full-corpus run as this target.
- The shell wrapper defaults to progressive upload **and automatic final production publication**. Add a reviewed explicit staging control or use the existing direct preflight CLI with both `--no-upload --no-publish`. `start` and `resume` are not harmless local-only commands. Also `run_big_bake.sh publish` copies the site before `release_publish`; confirm that strict manifest validation, backup and staged asset readiness gates have already passed before invoking it.

Implement focused tests for disconnected components, narrow exclaves, holes, real nodata, partial border islands, Wörgl cutoff and projection axis order. Test no caps outside permitted coverage, no fabricated horizontal connections/stripes, mask continuity and page seams; test interrupted downloads/page transactions and a second idempotent resume. Existing `tests/test_big_bake_pipeline.py`, `tests/test_rebake_texture_bootstrap.py` and transaction tests are references, not proof that the new cutline is supported.

## Verified entry points and a staged execution sequence

Inspect and safely update Rechner's checkout: fetch origin, review local changes/divergence, then fast-forward only when safe. Do not overwrite local work. Commit/push implemented pipeline revisions before production runtime validation. Baseline source dependencies live in `pixi.toml`/`pixi.lock`; resolve installed Pixi/BasisU/Node and verify versions locally.

The following are **later-executor commands**, not commands executed while preparing this handoff. First implement the gaps above. Do a small representative sample including interior terrain, Wörgl's cut, a state boundary, Außerfern/disconnected pieces, an imagery seam and a DEM nodata edge. Use a small selected-source manifest/profile supported by the implementation; no nonexistent `--cutline` or `--bbox` option is claimed here.

For an inventory-isolated offline stage, these baseline flags actually exist:

```bash
cd /home/cole/dev/Hexagons
export HEXAGONS_AERIAL_DIR=/home/cole/data/Hexagons/aerial_tifs
# Set to the later validated/prepared 5 m crop, not an assumed existing file:
export HEXAGONS_DEM_PATH=/home/cole/data/Hexagons/tirol-west-woergl/dem-5m.tif
# Set UPGRADE_RUN to a unique safe ID, e.g. UTC date plus pushed commit.
export UPGRADE_RUN="tirol-west-woergl-$(date -u +%Y%m%dT%H%M%SZ)"
export UPGRADE_ROOT="/home/cole/data/Hexagons/tirol-west-woergl/runs/$UPGRADE_RUN"
mkdir -p "$UPGRADE_ROOT"
# Add the implemented target release profile/source selection arguments only
# after checking its actual --help and tests; baseline defaults are old corpus.
pixi run python -u hex_backend/bake_preflight.py \
  --repo "$PWD" --execution-profile rechner-big \
  --run-id "$UPGRADE_RUN" --aerial-dir "$HEXAGONS_AERIAL_DIR" \
  --dem "$HEXAGONS_DEM_PATH" --output-root "$UPGRADE_ROOT/output" \
  --report "$UPGRADE_ROOT/preflight.json" \
  --inventory "$UPGRADE_ROOT/inventory.json" --no-upload --no-publish
# Inspect report.passed and the canonical selection identities BEFORE compute.
pixi run python -u hex_backend/big_bake.py --inventory "$UPGRADE_ROOT/inventory.json"
```

This template deliberately requires the implemented target-profile/selection arguments to be inserted; **running the baseline unchanged is not a coverage upgrade**. For sample and full runs, verify `inventory.publication.progressive_upload` and `final_publication` are both false. For a durable offline full run, extend/review the wrapper to preserve these flags, or launch a user systemd unit for the reviewed direct worker command; do not use the unmodified auto-publish wrapper. Record unit name/log/commit/inventory; only the human-launched Claude executes it.

Capacity gate: measure current source count/bytes and missing official-sheet sizes, download partials, ZIP+extraction overlap, original DEM retention, prepared crops/COGs, full gradient cache, sample/full output coexistence, worker temporaries, old releases and staging copies on **each** source/output/temp filesystem. Existing `estimate_output()` budgets ~300,000 B/GSP + 6,500,000 B/page, gradient `width*height*4*4*2*0.625`, texture worker temporaries and 50% margin, but **does not include all new acquisitions/crops**. Add those costs and calibrate with the representative sample. Legacy 95.67 GB requirement / 219.01 GB free is historical, not a target estimate. No deletion to make room: reduce scope only by an explicit documented decision or report the storage blocker. Keep 12 GiB OS reserve / 48 GiB bake limit / 12 geometry / 3 texture / 4 upload workers as measured starting defaults, not a new performance promise.

After sample correctness, bake the full selected extent in an isolated new run. Strictly regenerate manifest only from committed inventory transactions. Resume once to prove completed work is verified/skipped. Produce a report with selected/missing source counts, true covered area vs target, excluded edge area/holes/components, tile/page counts, all failures/retries and byte totals; do not hide uncovered required terrain as successful completion.

## Staged app validation, screenshots and deployment

The Mac's saved manifest contains 197 terrain tiles from a mini bake. The task supplied a production snapshot of 8,372 terrain tiles / 5,290 pages; a fresh Python HTTP request to the public manifest returned **403** during this audit, so those production counts are supplied historical context, not newly measured. Neither manifest counts originals.

Build the staged app using real supported build overrides:

```bash
HEXAGONS_MANIFEST_PATH="$UPGRADE_ROOT/output/app/tile_manifest.json" \
HEXAGONS_DIST_DIR="$UPGRADE_ROOT/site_dist" \
  npm --prefix frontend/app run build
```

Install dependencies with `npm --prefix frontend/app ci` first if needed. Serve staged build plus inventory output assets using an isolated preview root or explicit routing; the build override does not copy all ignored terrain/page assets. Check every URL root locally, then load it in a browser. Preserve current GSP3/WebP/KTX2 decoding, independent texture tier upgrades, terrain selection, attribution, camera behavior, release metadata and cache/version behavior. Run the existing relevant pipeline/app checks and [`scripts/verify_public_release.py`](../scripts/verify_public_release.py) after actual deployment; a successful build alone proves no visual coverage.

Save actual map/browser screenshots and the precise camera coordinates/build/manifest identity: overview of target versus old coverage, Wörgl meridian, western and southern state border, north/Außerfern and every disconnected component, a tile seam and steep terrain. Overlay the canonical outline for comparison. Check no imagery outside the target, connected horizontal stripes, zero-height/nodata cliffs, black edge bands, repeated edge texture across holes or stale terrain pages. Include side-by-side old/new coverage evidence and quantify intentional small full-cap boundary inset. The Nunatak map preview at `http://127.0.0.1:8765/frontend/viz/alpine_cells_and_stations_map.html` is a preparation-machine preview, **not a Rechner production endpoint**.

Only after staged visual/manifest checks and storage/source reports pass, publish via the existing normal release machinery: [`scripts/publish_site.py`](../scripts/publish_site.py), [`scripts/release_publish.py`](../scripts/release_publish.py), [`scripts/verify_public_release.py`](../scripts/verify_public_release.py). The existing control surface is `./hex_backend/run_big_bake.sh {preflight,start,status,stop,resume,publish}`; `publish` is appropriate only when its current run state points to the reviewed target output. Direct preflight above does **not** set that wrapper state: do not accidentally publish its previous run. Either implement tested staging/publish integration or invoke the same scripts with the explicit validated output paths and run ID; inspect their actual help first.

Destination is **Cloudflare R2 `wheatley-cloud`, prefix `hexagons/app`**, configured centrally in [`scripts/r2_target.py`](../scripts/r2_target.py), profile `r2`, region `auto`. Do not deploy to frozen legacy AWS bucket `wheatley.cloud`. The old runbook's STS example is obsolete for R2; current preflight checks a one-key bucket request. Never print credentials or put them in Git.

Keep immutable `releases/<run-id>/...`; validate uploaded assets/hash/MIME/cache metadata, then replace the mutable manifest pointer last. Record prior manifest bytes/release identity and app build before changes for rollback; retain old release objects. No `sync --delete`. Verify public landing/app refresh, manifest identity, JS/CSS/service worker and representative interior/border/disconnected GSP/WebP/all KTX2 tiers after publication, including cache refresh behavior. If public checks are blocked by 403/access, record that blocker and do not call deployment verified. Finish with pushed code commit(s), canonical/source manifests, disk/source reports, screenshots, public release evidence and any remaining missing coverage.

## Definition of done for later Claude

The documented canonical cutline and identical Nunatak geometry digest select every retained output; valid old imagery is reused; only necessary official missing source is fetched; 5 m display terrain is valid and seamless; selection and transactions resume safely; staged screenshots and tests pass; normal immutable release deployment is verified publicly. All original sources and old production rollback material survive. Anything still blocked by host access, disk, source availability or validation is reported explicitly.
