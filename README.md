# Hexagons — 3D Hexagonal Terrain Viewer

A browser-based 3D terrain viewer that renders the Austrian Tirol using a hexagonal grid system. The backend "bakes" elevation and aerial imagery into compact per-sector binary files, and the frontend streams them into a Three.js scene with LOD management.

## Project Structure

```
├── hex_backend/            # Python baking pipeline
│   ├── waffle_iron.py      # Main baker — see header for full data specs
│   ├── coordinate_utility.py  # EPSG:31254 ↔ hex/sector coordinate math
│   ├── generate_manifest.py   # Builds tile_manifest.json from baked output
│   ├── run_lil_bake.sh     # Quick mini-bake script (default: 12×12 Stubai)
│   ├── run_big_bake.sh     # Durable Rechner full-Tirol control surface
│   └── aerial_tifs/        # Source orthophotos (git-ignored, ~25 GB)
│
├── frontend/
│   ├── app/                # The viewer (vanilla JS + Three.js)
│   │   ├── index.html      # Entry point
│   │   ├── main.js         # PistonViewer — scene, camera, tile loading
│   │   ├── tile_worker.js  # Web Worker for hex mesh generation
│   │   ├── lod_controller.js  # LOD distance & budget management
│   │   ├── search.js       # Search overlay (peaks + ski areas)
│   │   ├── coordinate_utility.js
│   │   ├── style.css
│   │   ├── tiles_bin/      # Baked .bin sectors (git-ignored)
│   │   ├── aerial_pages/   # Global 1024m XUASTC KTX2 pages (git-ignored)
│   │   └── assets/         # Static data + generated compact peak/resort search index
│   └── landing/            # Marketing landing page
│
└── hive_assets/            # Dev tooling & test harnesses
    ├── init_worktree.sh    # Creates sandboxed git worktrees with symlinks
    └── gemini_test.sh      # Automated test runner
```

## Large Files (Not in Git)

These files are required for baking but are too large for the repository:

| File | Size | Description |
|---|---|---|
| `hex_backend/DGM_Tirol_5m_epsg31254_2006_2020.tif` | 1.1 GB | 5m DEM of Tirol (EPSG:31254) |
| `local_data/cache/gradients/...` | ~14–25 GB | Transactional reusable 2× full-region gradient cache |
| `hex_backend/aerial_tifs/*.tif` | 24.6 GB | 3,486 RGB orthophotos (~7 MB avg) |

The mini-bake generates its own **regional gradient** on-the-fly (~25–158 MB) so it does **not** need the 14 GB gradient cache.

## Baking

The baker (`waffle_iron.py`) converts raw DEM + aerial TIFs into the binary format the viewer consumes.

```bash
# Default: 12×12 grid around Stubai Glacier
./hex_backend/run_lil_bake.sh

# Configurable grid size (1–16)
python3 hex_backend/waffle_iron.py --grid 4

# Custom center sector
python3 hex_backend/waffle_iron.py --grid 6 --center 73,252

# Force re-bake (ignore version skip)
python3 hex_backend/waffle_iron.py --force

# Rechner production flow (preflight/start/status/stop/resume/publish)
./hex_backend/run_big_bake.sh preflight
./hex_backend/run_big_bake.sh start
./hex_backend/run_big_bake.sh status
```

### Aerial texture encoding profiles

Every low/medium/high KTX2 tier uses an explicit, cache-keyed profile. The
production default favors GPU residency; select a different sweep result with
`--texture-profile`:

| CLI profile | Low / medium / high encoding | Intended use |
|---|---|---|
| `production` (default) | XUASTC 8x6, quality 90, effort 4 | Best production residency/quality tradeoff |
| `balanced` | XUASTC 6x6, quality 90, effort 4 | Higher fidelity with moderate residency |
| `close-inspection` | XUASTC 4x4, quality 90, effort 4 | Maximum fidelity when memory is secondary |

These settings come from the [July 2026 aerial codec sweep](docs/reports/aerial-codec-sweep-2026-07-15.md).
The local `run_lil_bake.sh` and `pixi run bake-mini` paths explicitly add
`--fast-texture-encode`, which keeps the selected block size and quality but
uses effort 1 in a separate cache. The reference M1 measurement was about 8s
instead of 45s for one 4096px encode; the earlier q75 effort comparison changed
size by less than 2%. Full/production bakes retain the sweep-verified effort 4.

**Performance** (MacBook M1, 16 GB shared RAM): ~4.7s/sector. A 12×12 bake (144 sectors) takes ~11 minutes.

The Mac development path is explicitly `mac-small`; the Rechner production
path is `rechner-big`. The latter derives coverage from the validated
orthophoto/DEM intersection, writes a run-specific inventory/output root, uses
bounded persistent workers, and is resumable. It does not accept a manual
production rectangle. See [Rechner Big Bake Operations](docs/RECHNER_BIG_BAKE.md).

## Running the Viewer

```bash
# From the project root. Disabling the development cache is important: the
# HTML file is the bootstrap for the versioned module graph.
npx http-server frontend/app -p 8099 -c-1
# OR (if node is unavailable, use a fresh query string after each restart)
python3 -m http.server 8099 --directory frontend/app
```

Then open `http://localhost:8099/`.

## Coordinate System

- **Projection**: EPSG:31254 (MGI / Austria GK West)
- **Hex orientation**: Flat-top
- **Unit hex width**: 6.4 meters
- **Sector size**: 128×128 hexes = 819.2 meters
- **Hex coordinate encoding**: Axial (q, r)

## Sandbox Worktrees

For isolated development (e.g., frontend changes without affecting baked data), use the worktree script:

```bash
./hive_assets/init_worktree.sh <worktree-path> <branch-name>
```

This creates a git worktree with symlinks to large files (DEM, TIFs, baked tiles) so multiple agents can work in parallel without duplicating ~40 GB of data.
