// @atlas: The core 'PistonViewer' Three.js orchestrator. Manages the 60fps render loop, MapControls interaction, and instanced mesh generation over Gosper-fractal island tiles ('GSP1'). LOD is screen-space driven: each Gosper level k renders as sqrt(7)^k-scaled, k*19.1066deg-rotated hex caps inside a geometric distance band, selected per-instance in the vertex shader by a hierarchical CDLOD cut (self >= R(k), parent < R(k+1)) that is gapless by construction. A manifest-driven horizon mesh renders every baked island's level-5 aggregate cap out to ~60 km for free. Uses a strict state machine (MOVING vs SINTERING) to preserve frame budgets while asynchronously dispatching Web Workers to decode tiles.
import * as THREE from 'three';
import { MapControls } from 'three/addons/controls/MapControls.js';
import { HexSearch } from './search.js';
import { VRAMLedger } from './vram_ledger.js';
import { CacheManager } from './cache_manager.js';
import { PerfProfiler } from './perf_profiler.js';
import { initBenchmark } from './benchmark.js';
import './gosper_core.js';

const G = window.GosperCore;

// --- ENGINE STATE MACHINE & PERFORMANCE MONITORING ---
const APP_VERSION = 'v0.8.0';
const ENGINE_STATES = { MOVING_2D: 'MOVING_2D', MOVING_3D: 'MOVING_3D', SINTERING: 'SINTERING', STATIC: 'STATIC' };
// Per-state frame budgets (ms). Violations logged only when exceeded.
// MOVING targets 60fps. STATIC must never render at all (budget=0).
const STATE_BUDGETS_MS = { MOVING_2D: 16, MOVING_3D: 16, SINTERING: 1200, STATIC: 0 };
const PERF_VERBOSE_MAX = 5;    // First N violations: full-fat JSON with culprits
const PERF_STATS_WINDOW = 200; // After verbose cap: accumulate, then flush stats every N violations

// Silent pass-through — subsystem timing now handled by the aggregate
// frame-level [PERF_VIOLATION] system inside animate().
function track(_name, fn) { return fn(); }

// --- HEX COORDINATE SYSTEM (Gosper island tiles) ---
const UNIT_HEX_PX = 32.0;
const METERS_PER_PIXEL = 0.2;
const UNIT_HEX_WIDTH_METERS = UNIT_HEX_PX * METERS_PER_PIXEL; // 6.4m
const TILE_LEVEL = 5;                       // streaming tile = level-5 gosper island
const TILE_CONTENT_HALF_M = 505.0;          // conservative half-extent of any rendered cap of a tile
const GRID_BUCKET_M = 1024.0;               // spatial hash bucket for manifest tiles

// Round world meters to the nearest unit axial cell (cube rounding).
function worldToUnitAxial(x, y) {
    const h = UNIT_HEX_WIDTH_METERS;
    const fq = x / ((Math.sqrt(3) / 2) * h);
    const fr = (y - (fq * 0.5 * h)) / h;
    const fx = fq, fz = fr, fy = -fq - fr;
    let rx = Math.round(fx), ry = Math.round(fy), rz = Math.round(fz);
    const dx = Math.abs(rx - fx), dy = Math.abs(ry - fy), dz = Math.abs(rz - fz);
    if (dx > dy && dx > dz) rx = -ry - rz;
    else if (dy > dz) ry = -rx - rz;
    else rz = -rx - ry;
    return { q: rx, r: rz };
}

// --- CONFIG ---
// Default full-detail radius: tiles stream within this range (configurable
// via UI slider); the manifest-driven horizon mesh covers everything beyond.
const DEFAULT_RENDER_DISTANCE = 4000;
const HORIZON_DISTANCE = 60000;
const FLOOR_MODE = 'view-min';
const LOCK_FLOOR_ON_RISE = true;
const FLOOR_LOCK_THRESHOLD = 0.02;
const TILE_BOUNDS_MIN_Y = -10000;
const TILE_BOUNDS_MAX_Y = 10000;

const LIGHTING_DEFAULTS = {
    aoFloor: 0.0,
    aoPower: 1.0,
    lambert: 0.0,
    rim: 0.0,
    rimPower: 2.2,
    spec: 0.0,
    specPower: 30.0,
    slopeLight: 0.0,
};

// Worker-reported formatKey -> THREE compressed-texture format constant.
// Only formats the tile_worker.js Basis v2 transcoder can actually emit are
// listed here (see selectTarget() in tile_worker.js) — source KTX2s are
// always XUASTC LDR 6x6 encoded with -no_alpha, so no RGBA/alpha variants
// (BC3, ETC2 RGBA, PVRTC RGBA) are ever produced.
const KTX2_FORMAT_MAP = {
    'astc-6x6': THREE.RGBA_ASTC_6x6_Format,
    'bc7': THREE.RGBA_BPTC_Format,
    'bc1': THREE.RGB_S3TC_DXT1_Format,
    'etc1': THREE.RGB_ETC1_Format,
    'pvrtc-rgb': THREE.RGB_PVRTC_4BPPV1_Format,
};

class PistonViewer {
    constructor() {
        console.log(`[HEXAGONS] ${APP_VERSION} — loading...`);
        this.container = document.getElementById('canvas-container');
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a); // Dark Grey

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 10, 50000);
        this.camera.position.set(0, 800, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        this.controls = new MapControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 100;
        this.controls.maxDistance = 50000;
        this.controls.maxPolarAngle = Math.PI / 2.1;

        // INTERACTION STATE TRACKING
        this.isUserInteracting = false;
        this.controls.addEventListener('start', () => {
            this.isUserInteracting = true;
            this.isMoving3D = true;
            this.resetLODs();
        });
        this.controls.addEventListener('end', () => {
            this.isUserInteracting = false;
            this.isMoving3D = false;
            this.lastInteractionTime = performance.now();
        });
        this.controls.addEventListener('change', () => {
            this.needsRender = true;
            // NOTE: We do NOT reset LODs here anymore to avoid oscillation loops
            // from our own camera altitude adjustments.
        });

        this.needsRender = true;
        this.lastLODCamPos = new THREE.Vector3().copy(this.camera.position);

        // Platform Detection
        this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        this.log(`Platform: ${this.isMobile ? 'Mobile' : 'Desktop'}`);

        // --- SCREEN-SPACE GOSPER LOD ---
        // A level-k cap (flat-to-flat 6.4*sqrt(7)^k m) is shown while its
        // apparent size >= hexTargetPx: band radius R(k) = size(k)*pxPerRad /
        // (hexTargetPx * qualityScale). qualityScale animates from
        // movingCoarseness (while the camera moves) down to 1 (settled) —
        // one scalar replaces the old four-band antisintering nudges.
        this.hexTargetPx = this.isMobile ? 20 : 16;
        this.movingCoarseness = this.isMobile ? 7.0 : Math.sqrt(7); // mobile: two full levels coarser
        this.qualityScale = this.movingCoarseness;
        this.lodRadii = new Float32Array(TILE_LEVEL + 2); // R(0)..R(6)

        // Antisintering State
        this.lastInteractionTime = performance.now();
        this.isRefining = false;
        this.refineRate = 0.80;  // qualityScale multiplier per refined frame (snappy: ~5 frames)
        this.maxFrameTime = 500; // Allow a 0.5s pause for the "Snap" reward

        // Texture High-Res Load Distance
        this.texThreshold = 2000;

        window.addEventListener('resize', this.onResize.bind(this));

        // Shared Geometry — ONE unit cap + skirt; every gosper level renders
        // the same cap with sqrt(7)^k scale + rotation baked into instance
        // matrices by the worker (no per-level geometry variants).
        const side = UNIT_HEX_WIDTH_METERS / Math.sqrt(3);
        this.hexGeometry = this.createHexGeometry(side);

        this.tiles = new Map(); // Key: "yq_yr" (island lattice) -> Tile Object
        this.manifest = null;
        this.loadingTiles = new Set();
        this.loadQueue = [];
        this.upgradeQueue = [];
        this.instantiateQueue = []; // NEW: Results ready for main thread
        this.activeWorkerCount = 0; // NEW: Replaces isProcessingTile
        this.recentlyUpgradedTextures = []; // Track tiles that just got texture upgraded (for render spike correlation)
        this.lodTransitionInProgress = false; // Flag to suppress spike warnings during expected LOD transitions
        this.lastLodPreset = 'MOVING'; // Track if we're in MOVING or TARGET preset
        // this.isProcessingTile = false; // REMOVED
        // this.isUpgradingTex = false; // REMOVED

        this.loaderHidden = false;
        this.appStartTime = performance.now();
        this.materialsToUpdate = new Set(); // Changed to Set

        this.gradientMode = 1.0;
        this.heightFactor = 0.0;
        this.transSettings = { flatThresh: 5.0, riseStart: 6.0, riseEnd: 25.0, curve: 1.0 };
        this.worldOrigin = { x: 0, y: 0 };
        this.floorMode = FLOOR_MODE;
        this.floorState = { locked: false, value: 0.0, lastFactor: 0.0 };
        this.globalStats = { min: Infinity, max: -Infinity, avgSum: 0.0, baseSum: 0.0, count: 0 };
        this.frustum = new THREE.Frustum();
        this.projScreenMatrix = new THREE.Matrix4();
        this.renderSettings = { renderDistance: DEFAULT_RENDER_DISTANCE };

        // Debug/Stats
        this.fpsState = { lastSample: performance.now(), frames: 0 };
        this.fpsEl = document.getElementById('fps-counter');
        this.hexCountEl = document.getElementById('hex-count');
        this.tileHeightEl = document.getElementById('tile-height');
        this.cameraHeightEl = document.getElementById('camera-height');
        this.statsUpdateState = { lastUpdate: 0, interval: 500 };

        // 3D movement vs sintered state
        // - 3D moving: only build/render LOD0 (large, skirtless) for responsiveness.
        // - 3D sintered: allow building finer LODs once camera is settled.
        this.isMoving3D = false;
        this.wasMoving3D = false;
        this.sinterQueue = [];

        // Engine state machine (for structured perf logging)
        this.engineState = ENGINE_STATES.STATIC;
        this._perfViolationCount = 0;
        this._perfStats = {};  // Per-state rolling stats: { STATE: { min, max, sum, count } }
        this._texErrorCount = 0; // Dedup repeated texture decode failures
        this._frameCounter = 0;

        // Frametime Graph
        this.frametimeCanvas = document.getElementById('frametime-graph');
        this.frametimeCtx = this.frametimeCanvas ? this.frametimeCanvas.getContext('2d') : null;
        this.frametimeBuffer = new Array(640).fill(16.67); // 60fps baseline
        this.frametimeLastTime = performance.now();

        // LOD Pause Toggle
        this.lodPaused = false;

        this.lodPaused = false;

        this.initDebugConsole();
        this.initMinimizeButton();
        this.initCollapsibleSections();
        this.initLODSliders();
        this.updateFogAndClip();

        // WORKER SYSTEM
        this.workers = [];
        this.nextWorkerIdx = 0;
        this.pendingJobs = new Map(); // ID -> {resolve, reject}
        this.jobIdCounter = 0;
        this.textureSupport = null; // set by initWorkers() from renderer.extensions
        this.initWorkers();

        // Full-res texture VRAM budget gate. Starts at the BC7 worst case (24 MB
        // for a 4096x4096 mip chain) and is overwritten with the real observed
        // gpuBytes after the first full-res upgrade completes (ASTC 6x6 ≈ 10MB).
        this.estimatedFullTexVRAM = 24 * 1024 * 1024;

        // Dumb counters for the perf harness — updated on every texture arrival
        // (low-res on tile instantiation, full-res on upgrade). No logging loop.
        this.texStats = { count: 0, totalTranscodeMs: 0, maxTranscodeMs: 0, formatKey: null, totalGpuBytes: 0 };
        this._updateTexBadge(); // seed the on-screen "TEX · loading..." badge immediately

        // --- INFRASTRUCTURE: Telemetry & Cache Authority ---
        this.vramLedger = new VRAMLedger();
        this.cacheManager = new CacheManager(this.vramLedger);
        this.profiler = new PerfProfiler(this);

        this.initWorld();
        this.animate();
        window.pistonViewer = this;
    }

    initWorkers() {
        // Create a pool based on concurrency (clamped to 4-6)
        const count = Math.min(6, Math.max(2, navigator.hardwareConcurrency || 4));
        // Workers initialized silently

        // Capability handshake: detect compressed-texture extension support once
        // (renderer already exists at this point) and hand it to every worker so
        // the worker-side Basis v2 transcoder can select a GPU target without
        // ever touching the renderer or DOM.
        const ext = this.renderer.extensions;
        this.textureSupport = {
            astc: ext.has('WEBGL_compressed_texture_astc'),
            bptc: ext.has('EXT_texture_compression_bptc'),
            s3tc: ext.has('WEBGL_compressed_texture_s3tc'),
            etc2: ext.has('WEBGL_compressed_texture_etc'),
            etc1: ext.has('WEBGL_compressed_texture_etc1'),
            pvrtc: ext.has('WEBGL_compressed_texture_pvrtc') || ext.has('WEBKIT_WEBGL_compressed_texture_pvrtc'),
        };

        for (let i = 0; i < count; i++) {
            const w = new Worker('./tile_worker.js');
            w.onmessage = (e) => this.handleWorkerMessage(e);
            // Worker does not reply to INIT — fire and forget.
            // NB: must use the same {type, data} envelope as every other worker
            // message — the worker destructures e.data.data.
            w.postMessage({ type: 'INIT', data: { support: this.textureSupport } });
            this.workers.push(w);
        }
    }

    handleWorkerMessage(e) {
        const { id, status, result, error } = e.data;
        const job = this.pendingJobs.get(id);
        if (!job) return;

        this.pendingJobs.delete(id);

        if (status === 'success') job.resolve(result);
        else job.reject(new Error(error));
    }

    postWorkerJob(type, data, transferables = []) {
        return new Promise((resolve, reject) => {
            const id = this.jobIdCounter++;
            this.pendingJobs.set(id, { resolve, reject });

            const w = this.workers[this.nextWorkerIdx];
            this.nextWorkerIdx = (this.nextWorkerIdx + 1) % this.workers.length;

            w.postMessage({ id, type, data }, transferables);
        });
    }

    log(msg, type = "info") {
        const el = document.getElementById('console-output');
        // In-app DOM console only — no browser console output

        if (!el) return;
        const line = document.createElement('div');
        line.className = `log-line ${type}`;
        line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
        el.appendChild(line);
        el.scrollTop = el.scrollHeight;
    }

    initDebugConsole() {
        this.log("PistonViewer Initialized.", "success");
    }

    initMinimizeButton() {
        const btn = document.getElementById('minimize-btn');
        const panel = document.getElementById('main-panel');
        if (btn && panel) {
            btn.addEventListener('click', () => {
                panel.classList.toggle('minimized');
                btn.textContent = panel.classList.contains('minimized') ? '+' : '−';
            });
        }
    }

    initCollapsibleSections() {
        document.querySelectorAll('.collapsible-header').forEach(header => {
            header.addEventListener('click', () => {
                const section = header.parentElement;
                section.classList.toggle('collapsed');
            });
        });
    }

    initLODSliders() {
        // TARGET HEX SIZE (settled screen-space density)
        const targetPx = document.getElementById('lod-target-px');
        if (targetPx) {
            targetPx.value = this.hexTargetPx;
            const val = document.getElementById('lod-target-px-val');
            if (val) val.textContent = `${this.hexTargetPx}px`;
            targetPx.addEventListener('input', () => {
                this.hexTargetPx = parseInt(targetPx.value);
                if (val) val.textContent = targetPx.value + 'px';
                this.needsRender = true;
                this.needsLODUpdate = true;
            });
        }

        // MOVING COARSENESS multiplier
        const movingMult = document.getElementById('lod-moving-mult');
        if (movingMult) {
            movingMult.value = this.movingCoarseness;
            const val = document.getElementById('lod-moving-mult-val');
            if (val) val.textContent = `×${this.movingCoarseness.toFixed(2)}`;
            movingMult.addEventListener('input', () => {
                this.movingCoarseness = parseFloat(movingMult.value);
                if (val) val.textContent = `×${this.movingCoarseness.toFixed(2)}`;
                this.needsRender = true;
            });
        }

        // Render Distance
        const rdSlider = document.getElementById('render-distance-slider');
        const rdVal = document.getElementById('render-distance-val');
        if (rdSlider) {
            rdSlider.value = this.renderSettings.renderDistance / 1000;
            if (rdVal) rdVal.textContent = (this.renderSettings.renderDistance / 1000) + "km";
            rdSlider.addEventListener('input', () => {
                this.renderSettings.renderDistance = parseInt(rdSlider.value) * 1000;
                if (rdVal) rdVal.textContent = rdSlider.value + "km";
                this.updateFogAndClip();
            });
        }

        // Texture Upgrade
        const texSlider = document.getElementById('tex-upgrade-slider');
        const texVal = document.getElementById('tex-upgrade-val');
        if (texSlider) {
            texSlider.value = this.texThreshold;
            if (texVal) texVal.textContent = this.texThreshold + "m";
            texSlider.addEventListener('input', () => {
                this.texThreshold = parseInt(texSlider.value);
                if (texVal) texVal.textContent = this.texThreshold + "m";
                this.needsLODUpdate = true;
            });
        }

        // Gradient Toggle
        const terrainBtn = document.getElementById('gradient-terrain');
        const gradientBtn = document.getElementById('gradient-slope');
        if (terrainBtn && gradientBtn) {
            terrainBtn.addEventListener('click', () => {
                this.gradientMode = 0.0;
                terrainBtn.classList.add('active');
                gradientBtn.classList.remove('active');
                // Standard color updates handled by CSS class now preferably, 
                // but let's maintain consistency with existing code
                terrainBtn.style.background = '#74b9ff';
                terrainBtn.style.color = '#fff';
                gradientBtn.style.background = 'transparent';
                gradientBtn.style.color = '#ccc';
            });
            gradientBtn.addEventListener('click', () => {
                this.gradientMode = 1.0;
                gradientBtn.classList.add('active');
                terrainBtn.classList.remove('active');
                gradientBtn.style.background = '#74b9ff';
                gradientBtn.style.color = '#fff';
                terrainBtn.style.background = 'transparent';
                terrainBtn.style.color = '#ccc';
            });
        }

        // LOD Pause Toggle
        const lodPauseToggle = document.getElementById('lod-pause-toggle');
        if (lodPauseToggle) {
            lodPauseToggle.addEventListener('change', (e) => {
                this.lodPaused = e.target.checked;
                this.log(this.lodPaused ? "LOD Updates PAUSED" : "LOD Updates RESUMED", "info");
            });
        }

        this.syncLODUI();
    }

    syncLODUI() {
        const el = document.getElementById('lod-quality-val');
        if (el) el.textContent = `q ×${this.qualityScale.toFixed(2)}`;
    }

    // --- SCREEN-SPACE LOD BAND RADII ---
    // lodRadii[k] = FAR edge of level k's band: the camera distance at which
    // a level-k cap drops below hexTargetPx * qualityScale pixels. A level-k
    // instance draws iff selfDist > lodRadii[k-1] (anything finer would be
    // sub-target) AND parentDist <= lodRadii[k] (the parent must refine).
    // The two conditions evaluate the SAME parent distance the parent itself
    // uses for its own self-test, so the hierarchical cut partitions the
    // plane exactly — no holes, no double-draw at ring boundaries.
    computeLodRadii() {
        const fovRad = this.camera.fov * Math.PI / 180;
        const pxPerRad = (this.renderer.domElement.clientHeight || window.innerHeight) / (2 * Math.tan(fovRad / 2));
        const px = Math.max(4, this.hexTargetPx * this.qualityScale);
        for (let k = 0; k < TILE_LEVEL; k++) {
            this.lodRadii[k] = G.levelSize(k) * pxPerRad / px;
        }
        // Root caps never expire while their tile is resident — the horizon
        // instance for a resident tile is hidden, so someone must draw it.
        this.lodRadii[TILE_LEVEL] = 1e9;
    }

    createHexGeometry(radius) {
        // 1. CAP GEOMETRY (Top Face Only)
        const capGeo = new THREE.CircleGeometry(radius, 6);
        capGeo.rotateX(-Math.PI / 2); // Lay flat

        // Add dummy aSideId to Cap (required for shared shader)
        const capLen = capGeo.attributes.position.count;
        capGeo.setAttribute('aSideId', new THREE.Float32BufferAttribute(new Float32Array(capLen).fill(0), 1));

        // 2. PARTIAL SKIRT GEOMETRY (SE, S, SW Only)
        // Manual construction to ensure clean Side IDs and no overhead
        // Flat Top: SE(2), S(3), SW(4).
        // Angles:
        // 0: E, 1: SE, 2: SW, 3: W, 4: NW, 5: NE (Standard CircleGeo order??)
        // Let's verify standard ThreeJS Circle/Cyl order:
        // Vert 0: (1, 0, 0) -> East
        // Vert 1: (0.5, 0, 0.866) -> SouthEast (Z+)
        // Vert 2: (-0.5, 0, 0.866) -> SouthWest
        // Vert 3: (-1, 0, 0) -> West
        // Vert 4: (-0.5, 0, -0.866) -> NorthWest
        // Vert 5: (0.5, 0, -0.866) -> NorthEast

        // Segments (Counter-Clockwise in Theta, but indices might be different):
        // Face 0: 0 -> 1 (East -> SE). This is SE Face? No, average is ESE.
        // Let's look at the edges required for SE, S, SW neighbors.
        // Neighbor SE (Index 2): Direction (1, -1) -> Angle ~ -30 deg? (North is +90? No).
        // Standard Map: N(0,-1) usually? No, here N is -Z.
        // SE is (+X, +Z).
        // Edge SE is the edge connecting East Vertex and SouthEast Vertex? No.
        // It's the edge perpendicular to the SE direction.
        // SE Direction: (+1, +1) approx.
        // The Edge "facing" SE is the one between E(0) and S(approx).

        // Let's rely on the visual check:
        // We want the "Bottom Right", "Bottom", "Bottom Left" faces on screen.
        // These are Verts 0->1, 1->2, 2->3.
        // 0->1: East to SouthEast. (SE Face)
        // 1->2: SouthEast to SouthWest. (South Face)
        // 2->3: SouthWest to West. (SW Face)

        // This matches our indices 2(SE), 3(S), 4(SW) perfectly if we treat 0 as start.
        // So we build 3 quads connecting:
        // Quad 0 (SE): Top(0,1) -> Bottom(0,1)
        // Quad 1 (S):  Top(1,2) -> Bottom(1,2)
        // Quad 2 (SW): Top(2,3) -> Bottom(2,3)

        const vertices = [];
        const indices = [];
        const sideIDs = [];

        const angles = [
            0,                  // 0: East
            Math.PI / 3,        // 1: SE
            2 * Math.PI / 3,    // 2: SW
            Math.PI             // 3: West
        ];

        let vIdx = 0;
        for (let i = 0; i < 3; i++) {
            const th1 = angles[i];
            const th2 = angles[i + 1];

            const x1 = Math.cos(th1) * radius; const z1 = Math.sin(th1) * radius;
            const x2 = Math.cos(th2) * radius; const z2 = Math.sin(th2) * radius;

            // Top (Y=0), Bottom (Y=-1)
            // 4 Verts per quad to allow distinct attributes if needed,
            // though we could share. Separate is safer for flat shading/normals.

            // BL, BR, TR, TL order for CCW face?
            // Top Edge: (x1,0,z1) -> (x2,0,z2)
            // Bottom Edge: (x1,-1,z1) -> (x2,-1,z2)

            // Push Vertices
            vertices.push(x1, 0, z1);   // 0: Top Left (Start)
            vertices.push(x2, 0, z2);   // 1: Top Right (End)
            vertices.push(x1, -1, z1);  // 2: Btm Left
            vertices.push(x2, -1, z2);  // 3: Btm Right

            // Faces (Standard Two-Triangle Quad)
            // 2, 1, 0
            // 2, 3, 1
            indices.push(vIdx + 2, vIdx + 1, vIdx + 0);
            indices.push(vIdx + 2, vIdx + 3, vIdx + 1);

            // Side ID (0, 1, 2)
            for (let k = 0; k < 4; k++) sideIDs.push(i);

            vIdx += 4;
        }

        const skirtGeo = new THREE.BufferGeometry();
        skirtGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        skirtGeo.setAttribute('aSideId', new THREE.Float32BufferAttribute(sideIDs, 1));
        skirtGeo.setIndex(indices);
        skirtGeo.computeVertexNormals(); // Nice to have for lighting

        return { capGeo, skirtGeo };
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    updateFogAndClip() {
        const dist = this.renderSettings.renderDistance;
        const fogEnd = dist;
        const fogStart = dist * 0.6;
        if (!this.scene.fog) this.scene.fog = new THREE.Fog(0x0a0a0a, fogStart, fogEnd); // Match Bg
        this.scene.fog.near = fogStart;
        this.scene.fog.far = fogEnd;
        // Streamed tiles fade into fog at renderDistance; the horizon mesh is
        // fog-exempt (manual haze) and needs the far plane out past Tirol.
        this.camera.far = Math.max(dist + 2000, HORIZON_DISTANCE + 5000);
        this.camera.updateProjectionMatrix();
        // Keep the horizon haze band tied to the fog wall so the transition
        // from textured tiles to silhouettes reads as one atmosphere.
        if (this.horizonMesh?.material?.userData?.shader) {
            this.horizonMesh.material.userData.shader.uniforms.uHazeRange.value.set(dist * 0.8, HORIZON_DISTANCE);
        }
    }

    async initWorld() {
        try {
            const res = await fetch('tile_manifest.json');
            this.manifest = await res.json();
            if (this.manifest.type !== 'gosper_l5') {
                throw new Error(`Manifest type '${this.manifest.type}' is not gosper_l5 — re-run the baker`);
            }
            this.texWorldSide = this.manifest.tex_world_side_m; // uniform square canvas, world meters
            const { min_x, min_y } = this.manifest.bounds;
            this.worldOrigin = { x: min_x, y: min_y };

            // --- Spatial Index: lattice-key map + coarse world-space buckets ---
            this.manifestGrid = new Map();   // "yq_yr" -> manifest tile
            this.tileBuckets = new Map();    // "bx_bz" -> [manifest tiles]
            for (const t of this.manifest.tiles) {
                t.lx = t.x - this.worldOrigin.x;
                t.lz = -(t.y - this.worldOrigin.y);
                this.manifestGrid.set(`${t.yq}_${t.yr}`, t);
                const bKey = `${Math.floor(t.lx / GRID_BUCKET_M)}_${Math.floor(t.lz / GRID_BUCKET_M)}`;
                if (!this.tileBuckets.has(bKey)) this.tileBuckets.set(bKey, []);
                this.tileBuckets.get(bKey).push(t);
            }

            // Static heap-order lookup: (dq,dr from island center) -> unit index.
            // Identical for every tile, so it's built exactly once; per-tile
            // height picking is then unitHeights[map.get(key)].
            const off = G.offsets(TILE_LEVEL);
            this.unitIndexMap = new Map();
            for (let i = 0; i < off.length / 2; i++) {
                this.unitIndexMap.set(((off[i * 2] + 128) << 8) | (off[i * 2 + 1] + 128), i);
            }

            // Preferred start: Stubai Ski Area buildings (STUBAI_LAT/LON in waffle_iron.py)
            const starts = [
                { x: 59817.9, y: 206666.2 },  // Stubai buildings
                { x: 95855.9, y: 222423.2 },  // Ski tour area near Kühtai
            ];
            let startX = null, startZ = null;
            for (const s of starts) {
                const tile = this.nearestManifestTile(s.x, s.y);
                if (tile && Math.hypot(tile.x - s.x, tile.y - s.y) < 2000) {
                    startX = s.x - this.worldOrigin.x;
                    startZ = -(s.y - this.worldOrigin.y);
                    break;
                }
            }
            if (startX === null) {
                const cenX = (this.manifest.bounds.min_x + this.manifest.bounds.max_x) * 0.5;
                const cenY = (this.manifest.bounds.min_y + this.manifest.bounds.max_y) * 0.5;
                startX = cenX - this.worldOrigin.x;
                startZ = -(cenY - this.worldOrigin.y);
            }

            this.camera.position.set(startX, 1200, startZ);
            this.controls.target.set(startX, 0, startZ);
            this.controls.update();

            // PRE-ALLOCATE GEOMETRIES
            const side = UNIT_HEX_WIDTH_METERS / Math.sqrt(3);
            const geos = this.createHexGeometry(side);
            this.capGeometry = geos.capGeo;
            this.skirtGeometry = geos.skirtGeo;

            this.essentialTilesTarget = 1;

            this.buildHorizon();
            this.updateLOD();
        } catch (e) {
            console.error("Manifest error: " + e.message);
            this.log("Manifest error: " + e.message, "error");
        }
    }

    nearestManifestTile(worldX, worldY) {
        let best = null, bestD = Infinity;
        for (const t of this.manifest.tiles) {
            const d = (t.x - worldX) ** 2 + (t.y - worldY) ** 2;
            if (d < bestD) { bestD = d; best = t; }
        }
        return best;
    }

    // ------------------------------------------------------------------
    // HORIZON MESH — every baked island's level-5 aggregate, rendered as one
    // InstancedMesh straight from the manifest (no tile fetches). This is the
    // "query all of Tirol's max-size hexes for free" payoff: distant terrain
    // stays mountain-shaped out to HORIZON_DISTANCE at ~6 triangles per
    // 830 m island. Resident tiles hide their horizon instance (zero-scale
    // matrix) because the tile's own root cap draws the same hex.
    // ------------------------------------------------------------------
    buildHorizon() {
        const tiles = this.manifest.tiles;
        if (!tiles.length) return;
        const geo = this.capGeometry.clone();

        const count = tiles.length;
        const heights = new Float32Array(count);
        const shades = new Float32Array(count);
        const xz = G.levelXZ(TILE_LEVEL);
        this.horizonIndex = new Map(); // tile key -> instance id
        this._horizonMat4 = new THREE.Matrix4();

        const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        material.fog = false;
        material.customProgramCacheKey = () => 'piston_horizon_v1';
        material.onBeforeCompile = (shader) => {
            material.userData.shader = shader;
            shader.uniforms.uHeightFactor = { value: 0.0 };
            shader.uniforms.uFloorOffset = { value: 0.0 };
            shader.uniforms.uCameraPos = { value: new THREE.Vector3() };
            shader.uniforms.uHazeColor = { value: new THREE.Color(0x0a0a0a) };
            shader.uniforms.uHazeRange = { value: new THREE.Vector2(DEFAULT_RENDER_DISTANCE * 0.8, HORIZON_DISTANCE) };
            shader.vertexShader = shader.vertexShader.replace('#include <common>', `
                #include <common>
                uniform float uHeightFactor;
                uniform float uFloorOffset;
                attribute float instanceH;
                attribute float instanceShade;
                varying float vH;
                varying float vShade;
                varying vec3 vWorldPosH;
            `).replace('#include <begin_vertex>', `
                #include <begin_vertex>
                transformed.y += (instanceH - uFloorOffset) * uHeightFactor;
                vH = instanceH;
                vShade = instanceShade;
                #ifdef USE_INSTANCING
                    vWorldPosH = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
                #else
                    vWorldPosH = (modelMatrix * vec4(transformed, 1.0)).xyz;
                #endif
            `);
            shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `
                #include <common>
                uniform vec3 uCameraPos;
                uniform vec3 uHazeColor;
                uniform vec2 uHazeRange;
                varying float vH;
                varying float vShade;
                varying vec3 vWorldPosH;
            `).replace('#include <color_fragment>', `
                #include <color_fragment>
                // Hypsometric tint x baked lambert, hazed toward the sky with
                // distance but never fully erased (mountains stay silhouetted).
                vec3 lowC = vec3(0.16, 0.22, 0.16);
                vec3 highC = vec3(0.42, 0.44, 0.47);
                vec3 terrain = mix(lowC, highC, clamp((vH - 800.0) / 2600.0, 0.0, 1.0)) * (0.55 + 0.45 * vShade);
                float haze = smoothstep(uHazeRange.x, uHazeRange.y, distance(vWorldPosH, uCameraPos)) * 0.85;
                diffuseColor.rgb = mix(terrain, uHazeColor, haze);
            `);
        };

        const mesh = new THREE.InstancedMesh(geo, material, count);
        const m = new THREE.Matrix4();
        tiles.forEach((t, i) => {
            m.set(
                xz.a, 0, xz.b, t.lx,
                0, 1, 0, 0,
                xz.c, 0, xz.d, t.lz,
                0, 0, 0, 1
            );
            mesh.setMatrixAt(i, m);
            heights[i] = t.hMean;
            // Fixed light from the NW-ish, matching the app's jitter aesthetic
            const nx = (t.nx - 128) / 127, nz = (t.nz - 128) / 127;
            const ny = Math.sqrt(Math.max(0, 1 - nx * nx - nz * nz));
            shades[i] = Math.max(0, nx * -0.35 + ny * 0.85 + nz * -0.40);
            this.horizonIndex.set(`${t.yq}_${t.yr}`, i);
        });
        geo.setAttribute('instanceH', new THREE.InstancedBufferAttribute(heights, 1));
        geo.setAttribute('instanceShade', new THREE.InstancedBufferAttribute(shades, 1));
        mesh.frustumCulled = false;
        mesh.instanceMatrix.needsUpdate = true;
        this.horizonMesh = mesh;
        this.materialsToUpdate.add(material);
        material.userData.isHorizon = true;
        this.scene.add(mesh);
    }

    setHorizonTileHidden(key, hidden) {
        if (!this.horizonMesh || !this.horizonIndex?.has(key)) return;
        const i = this.horizonIndex.get(key);
        const t = this.manifestGrid.get(key);
        const m = this._horizonMat4;
        if (hidden) {
            m.makeScale(0, 0, 0);
        } else {
            const xz = G.levelXZ(TILE_LEVEL);
            m.set(
                xz.a, 0, xz.b, t.lx,
                0, 1, 0, 0,
                xz.c, 0, xz.d, t.lz,
                0, 0, 0, 1
            );
        }
        this.horizonMesh.setMatrixAt(i, m);
        this.horizonMesh.instanceMatrix.needsUpdate = true;
    }

    createTileMaterial(lodIdx, hasTexture, texture) {
        let material;
        if (hasTexture) {
            material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
        } else {
            material = new THREE.MeshBasicMaterial({ color: 0xff00ff, side: THREE.DoubleSide });
        }
        if (!material.userData) material.userData = {};
        material.userData.isClone = true; // Mark as a clone for cleanup
        material.userData.lodIdx = lodIdx; // Store LOD index for shader logic if needed
        this.setupMaterialShader(material);
        return material;
    }

    createMeshFromWorkerData(lodData, material, includeSkirts = true) {
        if (!lodData || lodData.matrix.length === 0) return null;

        const num = lodData.matrix.length / 16;

        // Geometry clones are per-mesh because instanced attributes live on
        // the geometry. Scale + rotation come baked in the instance matrices
        // (sqrt(7)^k / k*19.1066deg from the worker) — the clones stay unit.
        const capG = this.capGeometry.clone();
        const skirtG = includeSkirts ? this.skirtGeometry.clone() : null;

        const capMesh = new THREE.InstancedMesh(capG, material, num);
        const skirtMesh = skirtG ? new THREE.InstancedMesh(skirtG, material, num) : null;

        // CRITICAL: three culls per-OBJECT against the unit cap geometry's
        // ~3.7 m bounding sphere at the tile origin — the group-level flag
        // does not propagate, so any tile whose origin leaves the frustum
        // would vanish wholesale. Instance visibility is the shader's job.
        capMesh.frustumCulled = false;
        if (skirtMesh) skirtMesh.frustumCulled = false;

        // Assign Attributes from Worker
        capMesh.instanceMatrix = new THREE.InstancedBufferAttribute(lodData.matrix, 16);
        if (skirtMesh) skirtMesh.instanceMatrix = new THREE.InstancedBufferAttribute(lodData.matrix, 16);

        const meshes = [capMesh];
        if (skirtMesh) meshes.push(skirtMesh);

        meshes.forEach(m => {
            m.geometry.setAttribute('instanceNZ_1', new THREE.InstancedBufferAttribute(lodData.nz1, 4));
            m.geometry.setAttribute('instanceNZ_2', new THREE.InstancedBufferAttribute(lodData.nz2, 4));
            m.geometry.setAttribute('instanceSlopes', new THREE.InstancedBufferAttribute(lodData.slopes, 3));
            m.geometry.setAttribute('instanceDeltas', new THREE.InstancedBufferAttribute(lodData.deltas, 3));
            m.geometry.setAttribute('instanceNormal', new THREE.InstancedBufferAttribute(lodData.norms, 2));
            m.geometry.setAttribute('aParentPos', new THREE.InstancedBufferAttribute(lodData.parentPos, 2));
        });

        const group = new THREE.Group();
        group.add(capMesh);
        if (skirtMesh) group.add(skirtMesh);

        group.userData.activeSkirts = skirtMesh ? lodData.activeSkirts : 0;
        group.frustumCulled = false;
        return group;
    }

    setupMaterialShader(material) {
        // Force Three.js to treat this as a distinct program variant so we don't accidentally
        // reuse a cached MeshBasicMaterial program that didn't get our onBeforeCompile edits.
        // If you change shader code, bump this string.
        material.customProgramCacheKey = () => 'piston_hex_gosper_v3';

        const texSide = this.texWorldSide || 980.0;

        material.onBeforeCompile = function (shader) {
            this.userData.shader = shader;
            shader.uniforms.uHeightFactor = { value: 0.0 };
            shader.uniforms.uGradientMode = { value: 1.0 };
            shader.uniforms.uFloorOffset = { value: 0.0 }; // Initial fallback
            shader.uniforms.uTileSize = { value: texSide };
            shader.uniforms.uCameraPos = { value: new THREE.Vector3() };
            shader.uniforms.uLodRadii = { value: new THREE.Vector2(0.0, 1e9) }; // (bandMin for self, bandMax for parent)
            shader.uniforms.uFinestBuilt = { value: 0.0 }; // 1 = finest level built so far: ignore bandMin
            shader.uniforms.uCapTint = { value: 0.0 };     // 1 = aggregate cap: slope-class tint in gradient mode

            // Gosper island textures are one uniform world-metric square
            // (tex_world_side_m, canvas-centered on the island) — no padding
            // split, so the planar mapping is uv = local_xz / side + 0.5.
            shader.uniforms.uUvScale = { value: 1.0 };
            shader.uniforms.uUvOffset = { value: 0.0 };

            shader.vertexShader = shader.vertexShader.replace('#include <common>', `
                #include <common>
                uniform float uHeightFactor;
                uniform float uGradientMode; // Added for vertex shader access
                uniform float uFloorOffset;
                uniform float uTileSize;
                uniform float uUvScale;
                uniform float uUvOffset;
                uniform vec3 uCameraPos;
                uniform vec2 uLodRadii;
                uniform float uFinestBuilt;

                attribute vec4 instanceNZ_1;
                attribute vec4 instanceNZ_2;

                // NEW: Vec3 for Slopes/Deltas, Vec2 for Normal
                attribute vec3 instanceSlopes;
                attribute vec3 instanceDeltas;
                attribute vec2 instanceNormal; // (Nx, Nz)
                attribute vec2 aParentPos;     // parent gosper node center, tile-local XZ

                attribute float aSideId;

                varying vec3 vLocalPos;
                varying vec3 vWorldPos;
                varying float vSlope;
                varying float vIsTop;
                varying float vSkirtY;
                varying float vSideId;
                varying vec3 vMyNormal;
            `).replace('#include <begin_vertex>', `
                #include <begin_vertex>

                // HIERARCHICAL CDLOD CUT (per-instance, evaluated on centers)
                // Draw this level-k node iff:
                //   selfDist  >  uLodRadii.x  (R(k-1): anything finer would be sub-target px)
                //   parentDist <= uLodRadii.y (R(k): the parent must refine here)
                // The parent evaluates the identical distance value for its own
                // self-test, so parent/child regions partition exactly — no
                // holes and no double-draw at ring boundaries. uFinestBuilt
                // relaxes the self test while finer levels aren't built yet.
                #ifdef USE_INSTANCING
                    vec3 instancePos = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
                    vec3 worldInstancePos = (modelMatrix * vec4(instancePos, 1.0)).xyz;
                    float instDist = distance(worldInstancePos, uCameraPos);
                    vec3 worldParentPos = (modelMatrix * vec4(aParentPos.x, 0.0, aParentPos.y, 1.0)).xyz;
                    float parentDist = distance(worldParentPos, uCameraPos);

                    bool selfCoarseEnough = (instDist > uLodRadii.x) || (uFinestBuilt > 0.5);
                    bool parentRefines = (parentDist <= uLodRadii.y);
                    if (!(selfCoarseEnough && parentRefines)) {
                        gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
                        return;
                    }
                #endif

                float myH = instanceNZ_2.z - uFloorOffset;
                float animH = myH * uHeightFactor;

                bool isCap = (normal.y > 0.9);
                vIsTop = isCap ? 1.0 : 0.0;

                if (isCap) {
                    // CAP
                    transformed.y = 0.0 + animH;
                    // Aggregate caps carry their subtree's mean slope in
                    // instanceSlopes.x; the fragment tints with it only when
                    // uCapTint is set (levels >= 1) and gradient mode is on.
                    vSlope = instanceSlopes.x;
                    vSkirtY = 0.0;
                    vSideId = -1.0;

                    // Decode Normal from [0, 1] -> [-1, 1]
                    float nx = instanceNormal.x * 2.0 - 1.0;
                    float nz = instanceNormal.y * 2.0 - 1.0;
                    float ny_sq = 1.0 - nx*nx - nz*nz;
                    float ny = sqrt(max(0.0, ny_sq));

                    vMyNormal = normalize(vec3(nx, ny, nz));

                } else {
                    // SKIRT
                    vSkirtY = -position.y; // 0 at top, 1 at bottom
                    vSideId = aSideId;

                    if (position.y > -0.1) {
                         transformed.y = animH;
                    } else {
                         // Select Delta based on Side ID (0=SE, 1=S, 2=SW)
                         float dVal = (aSideId < 0.5) ? instanceDeltas.x :
                                      (aSideId < 1.5) ? instanceDeltas.y : instanceDeltas.z;

                         // Fix: Convert Decimeters (Int16) to Meters (Float)
                         dVal *= 0.1;

                         transformed.y = animH - (dVal * uHeightFactor);
                    }

                    // Pick Slope for Gradient
                    float sVal = (aSideId < 0.5) ? instanceSlopes.x :
                                 (aSideId < 1.5) ? instanceSlopes.y : instanceSlopes.z;
                    vSlope = sVal;

                    vMyNormal = normal; // Skirt flat normal
                }

                #ifdef USE_INSTANCING
                    vLocalPos = (instanceMatrix * vec4(transformed, 1.0)).xyz;
                    vWorldPos = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
                #else
                    vLocalPos = transformed;
                    vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
                #endif
            `).replace('#include <project_vertex>', `
                #ifdef USE_MAP
                    // Brute Force Planar Mapping at END of vertex shader to ensure vMapUv is set
                    vec3 tempPosUv = vec3(position);
                    #ifdef USE_INSTANCING
                        tempPosUv = (instanceMatrix * vec4(tempPosUv, 1.0)).xyz;
                    #endif
                    vec2 rawUv = (tempPosUv.xz / uTileSize) + 0.5;
                    vMapUv = rawUv * uUvScale + uUvOffset;
                #endif
                #include <project_vertex>
            `);

            shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `
                #include <common>
                uniform float uTileSize;
                uniform float uUvScale;
                uniform float uUvOffset;
                uniform float uGradientMode;
                uniform float uCapTint;
                uniform vec3 uCameraPos;
                uniform vec2 uLodRadii;
                varying vec3 vLocalPos;
                varying vec3 vWorldPos;
                varying float vSlope;
                varying float vIsTop;
                varying float vSkirtY;
                varying float vSideId;

                vec3 gradientColor(float s) {
                    // Green: 30-35
                    // Yellow: 35-40
                    // Orange: 40-45
                    // Red: 45-55
                    // Violet: > 55
                    
                    if (s < 30.0) return vec3(0.0); // Transparent/Texture?
                    if (s < 35.0) return vec3(0.2, 0.8, 0.2); // Green
                    if (s < 40.0) return vec3(0.9, 0.9, 0.2); // Yellow
                    if (s < 45.0) return vec3(1.0, 0.6, 0.0); // Orange
                    if (s < 55.0) return vec3(0.9, 0.2, 0.2); // Red
                    return vec3(0.6, 0.2, 0.8); // Violet
                }
            `).replace('#include <map_fragment>', `
                #ifdef USE_MAP
                    // Recalculate planar UVs in Fragment to be 100% sure we bypass standard UVs
                    float u = (vLocalPos.x / uTileSize) + 0.5;
                    float v = (-vLocalPos.z / uTileSize) + 0.5; // Flip Z for North/South alignment 
                    vec2 planarUv = vec2(u, v) * uUvScale + uUvOffset;
                    
                    vec4 texColor = texture2D(map, planarUv);
                    
                    // LIGHTING
                    float ao = 1.0 - (vSkirtY * 0.4); 
                    float jitter = 1.0;
                    if (vIsTop < 0.5) jitter = 0.92 + (vSideId * 0.04); 
                    float lighting = ao * jitter;

                    // COLOR
                    vec3 baseColor = texColor.rgb;
                    if (vIsTop < 0.5) { // SKIRT
                         if (uGradientMode > 0.5 && vSlope >= 30.0) {
                             baseColor = gradientColor(vSlope);
                         } else {
                             baseColor *= 0.6; // Darken skirt
                         }
                    } else if (uCapTint > 0.5 && uGradientMode > 0.5 && vSlope >= 30.0) {
                         // Aggregate caps: blend the slope class over the aerial
                         // texture at half strength — the far-field "is this
                         // face steep" read the unit-hex skirts provide near.
                         baseColor = mix(baseColor, gradientColor(vSlope), 0.5);
                    }

                    diffuseColor = vec4(baseColor * lighting, 1.0);
                #endif
            `);
        };

        // Ensure recompilation picks up onBeforeCompile + customProgramCacheKey.
        material.needsUpdate = true;
    }

    updateGlobalStats(stats) {
        if (!stats) return;
        this.globalStats.min = Math.min(this.globalStats.min, stats.min);
        this.globalStats.max = Math.max(this.globalStats.max, stats.max);
        this.globalStats.avgSum += stats.avg;
        this.globalStats.baseSum += stats.base;
        this.globalStats.count++;
    }

    updateRenderStats(now) {
        if (now - this.statsUpdateState.lastUpdate < 500) return;
        this.statsUpdateState.lastUpdate = now;

        let capCount = 0;
        let skirtCount = 0;

        for (const t of this.tiles.values()) {
            if (t.mesh && t.mesh.isGroup) {
                // Caps are always first child, skirts second
                // Iterate through all children, as each LOD is a group of cap/skirt
                t.mesh.children.forEach(lodGroup => {
                    if (lodGroup.isGroup) {
                        const capMesh = lodGroup.children[0];
                        const skirtMesh = lodGroup.children[1];
                        if (capMesh && capMesh.visible) capCount += capMesh.count;
                        if (skirtMesh && skirtMesh.visible) skirtCount += (lodGroup.userData.activeSkirts || 0);
                    }
                });
            }
        }

        const countEl = document.getElementById('hex-count');
        if (countEl) {
            countEl.innerHTML = `
                <span style="color: #00d2ff">${capCount.toLocaleString()} TOPS</span> | 
                <span style="color: #ff7675">${skirtCount.toLocaleString()} SKIRTS</span>
            `;
        }
    }

    updateFps() {
        if (!this.fpsEl) return;
        const now = performance.now();
        this.fpsState.frames += 1;
        const elapsed = now - this.fpsState.lastSample;
        if (elapsed < 500) return;
        const fps = (this.fpsState.frames * 1000) / elapsed;
        const dist = this.camera.position.distanceTo(this.controls.target);
        this.fpsEl.textContent = `FPS: ${fps.toFixed(0)} | Zoom: ${dist.toFixed(0)}`;
        this.fpsState.frames = 0;
        this.fpsState.lastSample = now;
    }

    updateFrametimeGraph() {
        if (!this.frametimeCtx) return;

        const now = performance.now();
        const frametime = now - this.frametimeLastTime;
        this.frametimeLastTime = now;

        // Update buffer (shift left, add new value on right)
        this.frametimeBuffer.shift();
        this.frametimeBuffer.push(frametime);

        const ctx = this.frametimeCtx;
        const width = this.frametimeCanvas.width;
        const height = this.frametimeCanvas.height;

        // Clear canvas
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, width, height);

        // Draw grid lines
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        // 16.67ms line (60fps)
        const y60 = height - (16.67 / 50) * height;
        ctx.beginPath();
        ctx.moveTo(0, y60);
        ctx.lineTo(width, y60);
        ctx.stroke();
        // 33.33ms line (30fps)
        const y30 = height - (33.33 / 50) * height;
        ctx.beginPath();
        ctx.moveTo(0, y30);
        ctx.lineTo(width, y30);
        ctx.stroke();

        // Draw frametime graph
        ctx.strokeStyle = '#74b9ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < this.frametimeBuffer.length; i++) {
            const ft = Math.min(this.frametimeBuffer[i], 50); // Cap at 50ms for display
            const x = i;
            const y = height - (ft / 50) * height;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Draw labels
        ctx.fillStyle = '#666';
        ctx.font = '10px monospace';
        ctx.fillText('16.67ms (60fps)', 5, y60 - 3);
        ctx.fillText('33.33ms (30fps)', 5, y30 - 3);
    }

    // --- CORE LOOP ---

    updateLOD() {
        if (!this.manifestGrid || this.lodPaused) {

            return;
        }

        const camPos = this.camera.position;
        const distLimit = this.renderSettings.renderDistance; // e.g. 4000m

        // 1. Collect nearby candidates from the coarse spatial buckets
        const candidates = [];
        const reach = distLimit + 2000;
        const b0x = Math.floor((camPos.x - reach) / GRID_BUCKET_M);
        const b1x = Math.floor((camPos.x + reach) / GRID_BUCKET_M);
        const b0z = Math.floor((camPos.z - reach) / GRID_BUCKET_M);
        const b1z = Math.floor((camPos.z + reach) / GRID_BUCKET_M);
        for (let bx = b0x; bx <= b1x; bx++) {
            for (let bz = b0z; bz <= b1z; bz++) {
                const bucket = this.tileBuckets.get(`${bx}_${bz}`);
                if (!bucket) continue;
                for (const t of bucket) {
                    const dx = t.lx - camPos.x;
                    const dz = t.lz - camPos.z;
                    const dSq = dx * dx + dz * dz;
                    if (dSq > reach * reach) continue;
                    t.d = Math.sqrt(dSq);
                    candidates.push(t);
                }
            }
        }

        // 2. Sort ONLY the nearby candidates
        candidates.sort((a, b) => a.d - b.d);

        const camDir = new THREE.Vector3();
        this.camera.getWorldDirection(camDir);
        camDir.y = 0; camDir.normalize();

        const processedKeys = new Set();
        const loadLimit = distLimit + 1000;

        for (const t of candidates) {
            const key = `${t.yq}_${t.yr}`;
            processedKeys.add(key);

            const tile = this.tiles.get(key);

            // Direction Check (texture-priority only — geometry level selection
            // is fully per-instance in the shader now)
            const toTile = new THREE.Vector3(t.lx - camPos.x, 0, t.lz - camPos.z).normalize();
            const dot = camDir.dot(toTile);
            const isEffectivelyFrontTex = ((dot > -0.2) || (t.d < this.texThreshold)) && (t.d < loadLimit);

            if (!tile && !this.loadingTiles.has(key)) {
                if (t.d < loadLimit) {
                    this.loadingTiles.add(key);
                    this.loadQueue.push({ t, loadFullTexNow: isEffectivelyFrontTex });
                }
            } else if (tile) {
                // Skip texture upgrades during 3D movement.
                // Upgrades will resume once camera settles (not moving3D)
                if (!this.isMoving3D && isEffectivelyFrontTex && !tile.isFullTex && !tile.loadingTex && !tile.queuedForUpgrade) {
                    tile.queuedForUpgrade = true;
                    this.upgradeQueue.push(tile);
                }
            }
        }

        // 5. Cleanup: Unload tiles that are NO LONGER in our candidate list
        for (const key of this.tiles.keys()) {
            if (!processedKeys.has(key)) {
                this.unloadTile(key);
            }
        }

        this.processQueues();
        this.checkInitialLoad(candidates);
    }

    checkInitialLoad(sorted) {
        if (this.loaderHidden) return;
        // If we have successfully instantiated at least 1 tile, hide the loader.
        // The rest will pop in.
        let operational = 0;
        for (const t of this.tiles.values()) {
            if (t.mesh) operational++;
        }

        if (operational >= 1) this.hideLoader();
    }

    processQueues() {
        const maxConcurrent = this.workers.length;
        const ESTIMATED_TILE_VRAM = 3 * 1024 * 1024; // ~2.7 MB instance buffers + low-res texture

        this.cacheManager.beginTurn();

        // Sort closest-first so the LRU swap logic can break early:
        // if the closest new tile isn't worth swapping, nothing behind it is either.
        this.loadQueue.sort((a, b) => a.t.d - b.t.d);

        while (this.activeWorkerCount < maxConcurrent && this.loadQueue.length > 0) {
            const task = this.loadQueue.shift();
            const key = `${task.t.yq}_${task.t.yr}`;

            // Hygiene
            if (this.tiles.has(key) || task.t.d > this.renderSettings.renderDistance + 1000) {
                this.loadingTiles.delete(key);
                continue;
            }

            // --- LRU CACHE LOGIC ---
            if (!this.cacheManager.canAllocate(ESTIMATED_TILE_VRAM)) {
                // Budget is full. Only load if this tile is more valuable
                // than the worst loaded tile (distance + frustum check).
                this.projScreenMatrix.multiplyMatrices(
                    this.camera.projectionMatrix, this.camera.matrixWorldInverse);
                this.frustum.setFromProjectionMatrix(this.projScreenMatrix);

                const swapped = this.cacheManager.requestSwap(
                    task.t.d,
                    this.camera.position,
                    this.frustum,
                    this.tiles,
                    this.unloadTile.bind(this)
                );

                if (!swapped) {
                    // What we have is already optimal. Drain the rest of the
                    // queue — since it's sorted closest-first, nothing behind
                    // this tile can swap either.
                    this.loadingTiles.delete(key);
                    for (const remaining of this.loadQueue) {
                        this.loadingTiles.delete(`${remaining.t.yq}_${remaining.t.yr}`);
                    }
                    this.loadQueue.length = 0;
                    break;
                }
            }

            // Record download (flags re-downloads of previously evicted tiles)
            this.cacheManager.recordDownload(key);

            this.activeWorkerCount++;
            this.fetchTileOnWorker(task).then(result => {
                this.activeWorkerCount--;
                if (result) this.instantiateQueue.push(result);
                this.processQueues(); // Keep the pipe full
            });
        }

        // 2. Texture Upgrades (Lower Priority)
        // Compressed full-res texture VRAM — starts at the BC7 worst case and is
        // corrected to the real observed size after the first upgrade (see
        // this.estimatedFullTexVRAM, set in the constructor / upgradeTexture()).
        const ESTIMATED_FULL_TEX_VRAM = this.estimatedFullTexVRAM;

        if (!this.isMoving3D && this.activeWorkerCount < maxConcurrent && this.loadQueue.length === 0 && this.upgradeQueue.length > 0) {
            const tile = this.upgradeQueue.shift();
            tile.queuedForUpgrade = false;
            const tileKey = `${tile.yq}_${tile.yr}`;

            // Budget check for texture upgrade
            if (!this.cacheManager.canAllocate(ESTIMATED_FULL_TEX_VRAM)) {
                this.projScreenMatrix.multiplyMatrices(
                    this.camera.projectionMatrix, this.camera.matrixWorldInverse);
                this.frustum.setFromProjectionMatrix(this.projScreenMatrix);

                // Try up to 3 swaps to free enough for the full-res texture
                let attempts = 0;
                while (!this.cacheManager.canAllocate(ESTIMATED_FULL_TEX_VRAM) && attempts < 3) {
                    const swapped = this.cacheManager.requestSwap(
                        Infinity, // only evict out-of-frustum tiles for tex upgrades
                        this.camera.position,
                        this.frustum,
                        this.tiles,
                        this.unloadTile.bind(this),
                        tileKey // don't evict the tile we're upgrading
                    );
                    if (!swapped) break;
                    attempts++;
                }

                if (!this.cacheManager.canAllocate(ESTIMATED_FULL_TEX_VRAM)) {
                    this.cacheManager.endTurn();
                    return; // Will retry next frame
                }
            }

            this.activeWorkerCount++;
            this.upgradeTexture(tile).finally(() => {
                this.activeWorkerCount--;
                this.processQueues();
            });
        }

        this.cacheManager.endTurn();
    }

    async fetchTileOnWorker(task) {
        try {
            const { t } = task;
            const lowTexUrl = `aerial_tiles/low/gosper_${t.yq}_${t.yr}.ktx2`;
            const binUrl = `tiles_bin/gosper_${t.yq}_${t.yr}.bin?v=1`;

            const workerData = await this.postWorkerJob('LOAD_TILE', {
                yq: t.yq, yr: t.yr,
                texUrl: lowTexUrl,
                binUrl: binUrl
            });

            // (silent — structured perf logging only)
            // Return data for instantiation frame
            return { task, workerData };

        } catch (e) {
            console.error("Tile Fetch Error", e);
            this.loadingTiles.delete(`${task.t.yq}_${task.t.yr}`);
            return null;
        }
    }

    // Build a THREE.CompressedTexture from a worker-transcoded KTX2 result
    // ({ mipmaps, width, height, formatKey, isSRGB, ... }). Used for both the
    // low-res texture on tile instantiation and the full-res upgrade — the
    // worker never imports THREE, so this mapping only happens here.
    buildCompressedTexture(texResult) {
        const { mipmaps, width, height, formatKey, isSRGB } = texResult;
        const threeFormat = KTX2_FORMAT_MAP[formatKey];
        if (!threeFormat) {
            throw new Error(`Unknown compressed texture formatKey from worker: ${formatKey}`);
        }
        const texture = new THREE.CompressedTexture(mipmaps, width, height, threeFormat);
        texture.minFilter = mipmaps.length > 1 ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
        texture.flipY = false;
        texture.colorSpace = isSRGB ? THREE.SRGBColorSpace : THREE.LinearSRGBColorSpace;
        texture.needsUpdate = true;
        return texture;
    }

    // Dumb telemetry accumulator for the perf harness — no logging loop, just
    // running totals read externally via window.pistonViewer.texStats.
    updateTexStats(texResult) {
        this.texStats.count++;
        this.texStats.totalTranscodeMs += texResult.transcodeMs || 0;
        this.texStats.maxTranscodeMs = Math.max(this.texStats.maxTranscodeMs, texResult.transcodeMs || 0);
        this.texStats.formatKey = texResult.formatKey;
        this.texStats.totalGpuBytes += texResult.gpuBytes || 0;
        this._updateTexBadge();
    }

    // On-screen debug badge (bottom-left, always visible without opening the
    // HUD panel) confirming KTX2 transcode is actually succeeding on-device —
    // written for verifying real hardware (phones) where devtools aren't handy.
    _updateTexBadge() {
        if (!this._texBadgeEl) {
            const el = document.createElement('div');
            el.id = 'tex-debug-badge';
            el.style.cssText = [
                'position:fixed', 'bottom:10px', 'left:10px',
                'background:rgba(10,10,10,0.75)', 'color:#7ee787',
                "font:11px/1.4 'Courier New',monospace",
                'padding:6px 10px', 'border-radius:6px', 'border:1px solid rgba(255,255,255,0.15)',
                'z-index:9999', 'pointer-events:none', 'white-space:pre',
            ].join(';');
            document.body.appendChild(el);
            this._texBadgeEl = el;
        }
        const s = this.texStats;
        const fails = this._texErrorCount;
        const ok = s.count > 0 && fails === 0;
        this._texBadgeEl.style.color = fails > 0 ? '#ff7675' : (s.count > 0 ? '#7ee787' : '#aaa');
        this._texBadgeEl.textContent = s.count > 0
            ? `TEX ${s.formatKey || '?'} · ${s.count} ok / ${fails} fail`
            : (fails > 0 ? `TEX · 0 ok / ${fails} fail` : 'TEX · loading...');
    }

    processInstantiationQueue() {
        // BUDGET: Instantiate 1 tile per frame to maintain 60FPS
        // Or 2 if we are feeling brave. Start with 1.
        if (this.instantiateQueue.length === 0) return;

        // TIME SLICING: Do as many as fit in 2ms
        const start = performance.now();
        while (this.instantiateQueue.length > 0) {
            const job = this.instantiateQueue.shift();
            track('instantiateTile', () => this.instantiateTile(job.task, job.workerData));

            if (performance.now() - start > 2.0) break;
        }
    }

    // Moved Mesh Creation Logic Here
    instantiateTile(task, workerData) {
        const { t, loadFullTexNow } = task;
        const key = `${t.yq}_${t.yr}`;

        // Final Hygiene Check (Camera might have moved while worker was working)
        if (this.tiles.has(key)) return;

        // --- LEDGER: Track network payload from worker response ---
        if (workerData.networkBytes) {
            this.vramLedger.addNetworkPayload(key, workerData.networkBytes);
        }

        try {
            // 1. Texture Strategy (One texture per tile)
            const tex = workerData.texture;

            // 2. Create ONE material for this entire tile (shared across LODs)
            // This cuts shader compilation overhead
            let initialTex = null;
            if (tex) {
                initialTex = this.buildCompressedTexture(tex);
                this.updateTexStats(tex);
            } else {
                // Worker treats a low-res transcode failure as non-fatal (tile
                // still renders, magenta material) — count it in the debug
                // badge anyway so an on-device failure isn't invisible.
                this._texErrorCount++;
                this._updateTexBadge();
            }
            const sharedMaterial = this.createTileMaterial(0, !!tex, initialTex);
            this.materialsToUpdate.add(sharedMaterial);

            const meshGroup = new THREE.Group();

            // Coarse levels (5..2, 400 instances) build immediately; fine
            // levels (1: 2401, 0: 16807) defer to the sinter pass when the
            // camera is moving — same deferral pattern as before, driven by
            // the same needsSinteredBuild machinery.
            const eagerLevels = this.isMoving3D ? [5, 4, 3, 2] : [5, 4, 3, 2, 1, 0];
            const builtLevels = {};

            for (const level of eagerLevels) {
                const lodData = workerData.lods[level];
                if (!lodData) continue;

                const layerMaterial = sharedMaterial.clone();
                // Ensure unique userData for each clone so uniform updates don't conflict
                layerMaterial.userData = { ...sharedMaterial.userData };
                layerMaterial.userData.lodIdx = level; // gosper level (0=unit .. 5=island root)
                layerMaterial.userData.shader = null;
                // NOTE: Material.clone() does not reliably carry over onBeforeCompile/customProgramCacheKey
                // across Three.js versions/builds. We must re-attach our shader patch on every clone,
                // otherwise height + UV mapping + GPU LOD culling silently fall back to default shaders.
                this.setupMaterialShader(layerMaterial);
                this.materialsToUpdate.add(layerMaterial);

                const includeSkirts = (level === 0); // only unit hexes carry skirts
                const finalMesh = this.createMeshFromWorkerData(lodData, layerMaterial, includeSkirts);
                if (finalMesh) {
                    finalMesh.userData.activeSkirts = lodData.activeSkirts;
                    finalMesh.userData.gosperLevel = level;
                    meshGroup.add(finalMesh);
                    builtLevels[level] = true;
                }
            }

            meshGroup.position.set(t.lx, 0, t.lz);

            const containerGroup = new THREE.Group();
            t.mesh = meshGroup;
            containerGroup.add(meshGroup);

            this.scene.add(containerGroup);
            // Force GPU Upload/Compile of geometry and shaders
            // This prevents the "Stutter on 3D Switch" by paying the cost now, 1 tile per frame.
            this.renderer.compile(containerGroup, this.camera);

            containerGroup.visible = true;
            this.needsRender = true;

            const half = (this.texWorldSide || 980) / 2;
            const bounds = new THREE.Box3(
                new THREE.Vector3(t.lx - half, TILE_BOUNDS_MIN_Y, t.lz - half),
                new THREE.Vector3(t.lx + half, TILE_BOUNDS_MAX_Y, t.lz + half)
            );

            // GATHER MATERIALS for cleanup/tracking
            const gatheredMaterials = [];
            containerGroup.traverse((child) => {
                if (child.isMesh && child.material) gatheredMaterials.push(child.material);
            });

            const tileObj = {
                yq: t.yq, yr: t.yr, lx: t.lx, lz: t.lz,
                mesh: meshGroup,           // stacked per-level LOD content
                container: containerGroup, // Scene root for this tile
                material: sharedMaterial, bounds,
                lods: workerData.lods,
                builtLevels,
                finestBuilt: this.isMoving3D ? 2 : 0,
                needsSinteredBuild: this.isMoving3D,
                unitHeights: workerData.unitHeights,
                stats: workerData.stats,
                center: workerData.center,
                isFullTex: false,
                loadingTex: false,
                queuedForUpgrade: false,
                isTransitioning: false,
                clonedMaterials: gatheredMaterials
            };
            this._markFinestBuilt(tileObj);
            this.tiles.set(key, tileObj);
            this.setHorizonTileHidden(key, true);
            this.updateGlobalStats(workerData.stats);

            // --- LEDGER: Register tile's GPU footprint ---
            // Geometry bytes pre-computed on worker thread (Graft 3)
            const geometryBytes = workerData.geometryBytes || 0;
            // Texture: low-res KTX2, transcoded on the worker to a compressed
            // GPU format — use the worker-reported byte count directly instead
            // of estimating from raw RGBA dimensions.
            let textureBytes = 0;
            if (workerData.texture && workerData.texture.gpuBytes) {
                textureBytes = workerData.texture.gpuBytes;
            }
            this.vramLedger.register(key, {
                geometryBytes, textureBytes,
                q: t.yq, r: t.yr, lx: t.lx, lz: t.lz,
            });

            if (loadFullTexNow && !tileObj.isFullTex && !tileObj.loadingTex && !tileObj.queuedForUpgrade) {
                tileObj.queuedForUpgrade = true;
                this.upgradeQueue.push(tileObj);
            }

            this.loadingTiles.delete(key);

        } catch (e) {
            console.error("Instantiation Error", key, e);
            this.loadingTiles.delete(key);
        }
    }

    buildSinteredLods(tile) {
        if (!tile?.mesh || !tile.lods) return;
        if (!tile.needsSinteredBuild) return;

        for (const level of [1, 0]) {
            if (tile.builtLevels?.[level]) continue;
            const lodData = tile.lods[level];
            if (!lodData) continue;

            const layerMaterial = tile.material.clone();
            layerMaterial.userData = { ...tile.material.userData };
            layerMaterial.userData.lodIdx = level;
            layerMaterial.userData.shader = null;
            this.setupMaterialShader(layerMaterial);
            this.materialsToUpdate.add(layerMaterial);
            tile.clonedMaterials?.push(layerMaterial);
            // Late-built materials must inherit the tile's current texture,
            // not the sharedMaterial snapshot from instantiation time.
            if (tile.material.map) { layerMaterial.map = tile.material.map; layerMaterial.needsUpdate = true; }

            const includeSkirts = (level === 0);
            const finalMesh = this.createMeshFromWorkerData(lodData, layerMaterial, includeSkirts);
            if (finalMesh) {
                finalMesh.userData.activeSkirts = lodData.activeSkirts;
                finalMesh.userData.gosperLevel = level;
                tile.mesh.add(finalMesh);
                this.renderer.compile(finalMesh, this.camera);
                tile.builtLevels[level] = true;
                tile.finestBuilt = level;
            }
        }

        this._markFinestBuilt(tile);

        // (sintered-build timing captured by aggregate frame violation)

        tile.needsSinteredBuild = false;
        this.needsRender = true;
    }

    // The finest BUILT level of a tile ignores its band's near edge (its
    // shader draws all the way to the camera) until finer levels exist.
    _markFinestBuilt(tile) {
        if (!tile.mesh) return;
        tile.mesh.traverse(obj => {
            if (obj.isMesh && obj.material?.userData) {
                const ud = obj.material.userData;
                ud.isFinest = (ud.lodIdx === tile.finestBuilt);
            }
        });
    }

    async upgradeTexture(tile) {
        tile.loadingTex = true;
        const key = `${tile.yq}_${tile.yr}`;
        const url = `aerial_tiles/full/gosper_${tile.yq}_${tile.yr}.ktx2`;
        try {
            const texStart = performance.now();
            const result = await this.postWorkerJob('LOAD_TEXTURE', { url });
            const texLoadTime = performance.now() - texStart;

            // --- LEDGER: Track upgraded texture network payload ---
            if (result.networkBytes) {
                this.vramLedger.addNetworkPayload(key, { bin: 0, tex: result.networkBytes });
            }

            const fullTex = this.buildCompressedTexture(result);
            this.updateTexStats(result);

            const assignStart = performance.now();

            // --- INCINERATOR: Dispose old low-res texture before replacing ---
            if (tile.material.map && tile.material.map !== fullTex) {
                tile.material.map.dispose();
            }

            // ASSIGN TO MAIN MATERIAL
            tile.material.map = fullTex;
            tile.material.needsUpdate = true;

            // ASSIGN TO ALL CLONED MATERIALS (old map refs disposed via main material above)
            let clonedCount = 0;
            if (tile.clonedMaterials) {
                tile.clonedMaterials.forEach(m => {
                    // Clones share the same texture instance, no need to dispose each
                    m.map = fullTex;
                    m.needsUpdate = true;
                    clonedCount++;
                });
            }

            const assignTime = performance.now() - assignStart; // Measure ENTIRE assignment block in ms

            // --- LEDGER: Update texture VRAM (old low-res → new full-res) ---
            this.vramLedger.updateTexture(key, result.gpuBytes);
            // Correct the upgrade-gate estimate to the real observed size now
            // that we know it (ASTC 6x6 ≈ 10MB, BC7 ≈ 22MB — the 24MB default
            // was only ever a worst-case placeholder).
            this.estimatedFullTexVRAM = result.gpuBytes;

            tile.isFullTex = true;

            // Track for render spike correlation
            this.recentlyUpgradedTextures.push({ q: tile.yq, r: tile.yr, time: performance.now() });

            // (tex-upgrade timing captured by aggregate frame violation)

            this.needsRender = true;
        } catch (e) {
            this._texErrorCount++;
            this._updateTexBadge();
            if (this._texErrorCount <= 3) {
                console.warn(`[TEX_FAIL] ${tile.yq},${tile.yr}: ${e.message}`);
                if (this._texErrorCount === 3) console.warn('[TEX_FAIL] Further texture errors suppressed.');
            }
        }
        tile.loadingTex = false;
    }

    // parseBinaryV3 removed (handled by worker)
    // swapGeometry removed — level selection is fully per-instance in the
    // shader (CDLOD cut), and the flattened-cap look IS the 2D mode.

    unloadTile(key) {
        const tile = this.tiles.get(key);
        if (!tile) return;

        // --- INCINERATOR: Rigorous GPU Disposal Pipeline ---
        this._disposeTileGPU(tile);

        // --- LEDGER: Deregister VRAM tracking ---
        this.vramLedger.deregister(key);

        this.tiles.delete(key);
        this.loadingTiles.delete(key);

        // The manifest-driven horizon cap takes over for this island again.
        this.setHorizonTileHidden(key, false);
    }

    /**
     * THE INCINERATOR — Rigorous GPU resource teardown.
     * Explicitly disposes all WebGL resources (BufferGeometry, Material, Texture)
     * and nullifies references to force immediate GPU memory release.
     * @param {object} tile - Tile object from this.tiles
     */
    _disposeTileGPU(tile) {
        // 1. Remove from scene FIRST (prevents any further draws)
        if (tile.container) this.scene.remove(tile.container);

        // 2. Deep-traverse all 3D meshes — dispose geometry, materials, textures
        if (tile.mesh) {
            tile.mesh.traverse(obj => {
                if (obj.isMesh) {
                    if (obj.geometry) {
                        obj.geometry.dispose();
                    }
                    // Array-safe material disposal (Graft 2)
                    const materials = obj.material
                        ? (Array.isArray(obj.material) ? obj.material : [obj.material])
                        : [];
                    for (const mat of materials) {
                        if (mat.map) { mat.map.dispose(); mat.map = null; }
                        this.materialsToUpdate.delete(mat);
                        mat.dispose();
                    }
                }
            });
        }

        // 4. Shared material (may have its own texture ref)
        if (tile.material) {
            if (tile.material.map) {
                tile.material.map.dispose();
                tile.material.map = null;
            }
            this.materialsToUpdate.delete(tile.material);
            tile.material.dispose();
        }

        // 5. Cloned materials list (catch any stragglers not in traversal)
        if (tile.clonedMaterials) {
            tile.clonedMaterials.forEach(m => {
                this.materialsToUpdate.delete(m);
                if (m.map) { m.map.dispose(); m.map = null; }
                m.dispose();
            });
        }

        // 6. Nullify all references to assist GC
        tile.mesh = null;
        tile.material = null;
        tile.clonedMaterials = null;
        tile.container = null;
        tile.lods = null;
        tile.unitHeights = null;
    }

    hideLoader() {
        if (this.loaderHidden) return;

        // Force a minimum "hero" moment for the loader so it doesn't just flash
        const elapsed = performance.now() - this.appStartTime;
        if (elapsed < 900) {
            setTimeout(() => this.hideLoader(), 900 - elapsed);
            return;
        }

        this.loaderHidden = true;
        console.log(`[HEXAGONS] ${APP_VERSION} — ready in ${(elapsed / 1000).toFixed(1)}s (${this.tiles.size} tiles)`);
        const loader = document.getElementById('loader');
        if (loader) {
            loader.classList.add('hide');
            // Clean up DOM after fade
            setTimeout(() => { loader.style.display = 'none'; }, 600);

            // Init Search Bar now that we are live
            this.searchBar = new HexSearch();
        }
    }

    // HUD readouts: cache element refs once and only touch the DOM when the
    // string actually changed — this method runs every rendered frame.
    _setHudText(id, text) {
        if (!this._hudEls) { this._hudEls = {}; this._hudLast = {}; }
        if (this._hudLast[id] === text) return;
        let el = this._hudEls[id];
        if (el === undefined) el = this._hudEls[id] = document.getElementById(id);
        if (el) { el.textContent = text; this._hudLast[id] = text; }
    }

    maintainCameraAltitudeDuringAnimation(h) {
        const target = this.controls.target;
        const wx = target.x + this.worldOrigin.x;
        const wy = this.worldOrigin.y - target.z;

        // Which unit hex, and which gosper island owns it?
        const axial = worldToUnitAxial(wx, wy);
        const [tq, tr] = G.tileOfUnit(axial.q, axial.r);
        const key = `${tq}_${tr}`;
        const tile = this.tiles.get(key);

        // Update Readouts
        this._setHudText('sector-val', `${tq}, ${tr}`);
        this._setHudText('world-val', `${wx.toFixed(0)}, ${wy.toFixed(0)}`);
        this._setHudText('hex-val', `${axial.q}, ${axial.r}`);

        if (tile && tile.center && tile.unitHeights) {
            // O(1) picking: heap-order unit index from the static offset map
            // (identical for every island), then one Float32Array read.
            const dq = axial.q - tile.center.q;
            const dr = axial.r - tile.center.r;
            const idx = this.unitIndexMap.get(((dq + 128) << 8) | (dr + 128));
            let groundH = (idx !== undefined) ? tile.unitHeights[idx] : undefined;
            if (groundH === undefined) groundH = tile.stats.avg;

            const animatedH = (groundH - this.floorState.value) * h;
            const minCamY = animatedH + 50.0;

            // Soft constraint: only push if below
            if (this.camera.position.y < minCamY) this.camera.position.y = minCamY;

            this._setHudText('tile-height', `${animatedH.toFixed(1)}m`);
        }
        this._setHudText('camera-height', `${this.camera.position.y.toFixed(0)}m`);
    }

    updateFloorState(h) {
        const currentMin = this.pickFloorValue();

        if (LOCK_FLOOR_ON_RISE && h > FLOOR_LOCK_THRESHOLD) {
            // Logic: Only update if we found a LOWER floor (prevent sinking), but don't raise it (prevent jitter).
            if (!this.floorState.locked || currentMin < this.floorState.value) {
                this.floorState.value = currentMin;
            }
            this.floorState.locked = true;
            this.updateFloorUniforms();
        } else if (!LOCK_FLOOR_ON_RISE) {
            this.floorState.value = currentMin;
            this.updateFloorUniforms();
        } else {
            // Not yet locked (flat mode), just track freely
            this.floorState.value = currentMin;
            this.updateFloorUniforms();
        }
    }

    pickFloorValue() {
        const inView = this.getTilesInView();
        const validTiles = inView.length ? inView : Array.from(this.tiles.values());
        let min = Infinity;
        for (const t of validTiles) if (t.stats && t.stats.min < min) min = t.stats.min;
        return Number.isFinite(min) ? min : 0;
    }

    getTilesInView() {
        this.camera.updateMatrixWorld();
        this.projScreenMatrix.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
        this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
        return Array.from(this.tiles.values()).filter(t => this.frustum.intersectsBox(t.bounds));
    }

    updateFloorUniforms() {
        for (const m of this.materialsToUpdate) {
            if (m.userData.shader) m.userData.shader.uniforms.uFloorOffset.value = this.floorState.value;
        }
    }

    resetLODs() {
        // Snap back to the coarse moving-mode quality scalar.
        if (this.qualityScale !== this.movingCoarseness || this.isRefining) {
            this.qualityScale = this.movingCoarseness;
            this.isRefining = false;
            this.needsRender = true;
            this.syncLODUI();
        }
    }

    refineLODs() {
        // Antisintering, one scalar edition: walk qualityScale from
        // movingCoarseness down to 1 — every band sweeps outward in lockstep
        // (each step multiplies all radii by 1/refineRate). Frametime-capped
        // exactly like the old four-band version.
        const sampleCount = 5;
        const recentFrames = this.frametimeBuffer.slice(-sampleCount);
        const avgFrameTime = recentFrames.reduce((a, b) => a + b, 0) / recentFrames.length;

        if (avgFrameTime > this.maxFrameTime) {
            if (this.isRefining) {
                this.log(`Antisintering capped by performance (${avgFrameTime.toFixed(1)}ms avg)`, "warn");
                this.isRefining = false;
            }
            return false;
        }

        if (this.qualityScale > 1.0) {
            this.qualityScale = Math.max(1.0, this.qualityScale * this.refineRate);
            this.isRefining = true;
            this.needsRender = true;
            this.needsLODUpdate = true;
            this.syncLODUI();
            return this.qualityScale > 1.0;
        }

        if (this.isRefining) {
            this.log("Antisintering Complete: Maximum Resolution Reached.", "success");
            this.isRefining = false;
        }
        return false;
    }

    // --- ENGINE STATE DERIVATION ---
    deriveEngineState(moved, flat) {
        // Priority order: MOVING_3D > MOVING_2D > SINTERING > STATIC
        if (this.isMoving3D) return ENGINE_STATES.MOVING_3D;
        if (moved || this.isUserInteracting) return flat ? ENGINE_STATES.MOVING_2D : ENGINE_STATES.MOVING_3D;
        const recentUpgrade = this.recentlyUpgradedTextures.some(u => performance.now() - u.time < 100);
        if (this.sinterQueue.length > 0 || this.upgradeQueue.length > 0 ||
            this.activeWorkerCount > 0 || this.isRefining || recentUpgrade) return ENGINE_STATES.SINTERING;
        return ENGINE_STATES.STATIC;
    }

    // --- PORCELAIN OUTPUT: Machine-readable stats API for Playwright / automation ---
    getDetailedStats(phase = 'snapshot') {
        // Compute spatial breakdown (The Radar)
        this.projScreenMatrix.multiplyMatrices(
            this.camera.projectionMatrix, this.camera.matrixWorldInverse);
        this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
        const spatial = this.vramLedger.getSpatialBreakdown(
            this.frustum, this.camera.position, this.tiles);

        const fmt = (b) => {
            if (b < 1024) return `${b} B`;
            if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
            if (b < 1073741824) return `${(b / 1048576).toFixed(1)} MB`;
            return `${(b / 1073741824).toFixed(2)} GB`;
        };

        const _classVec = new THREE.Vector3();
        const renderDist = this.renderSettings.renderDistance;
        let visCount = 0, bufCount = 0, vesCount = 0;
        let visBytes = 0, bufBytes = 0, vesBytes = 0;
        let visFull = 0, visLow = 0, bufFull = 0, bufLow = 0, vesFull = 0, vesLow = 0;

        for (const [key, tile] of this.tiles) {
            const entry = this.vramLedger.entries.get(key);
            const bytes = entry ? (entry.geometryBytes + entry.textureBytes) : 0;
            const inFrustum = tile.bounds && this.frustum.intersectsBox(tile.bounds);
            const isFull = !!tile.isFullTex;

            if (inFrustum) {
                visCount++; visBytes += bytes;
                if (isFull) visFull++; else visLow++;
            } else {
                _classVec.set(entry?.lx || 0, 0, entry?.lz || 0);
                const dist = _classVec.distanceTo(this.camera.position);
                if (dist <= renderDist) {
                    bufCount++; bufBytes += bytes;
                    if (isFull) bufFull++; else bufLow++;
                } else {
                    vesCount++; vesBytes += bytes;
                    if (isFull) vesFull++; else vesLow++;
                }
            }
        }

        return {
            phase,
            timestamp: performance.now(),
            engineState: this.engineState,
            activeTileCount: this.tiles.size,
            tileClassification: {
                visible: { count: visCount, full: visFull, low: visLow, vram: fmt(visBytes), bytes: visBytes },
                buffer: { count: bufCount, full: bufFull, low: bufLow, vram: fmt(bufBytes), bytes: bufBytes },
                vestigial: { count: vesCount, full: vesFull, low: vesLow, vram: fmt(vesBytes), bytes: vesBytes },
            },
            vram: {
                geometryBytes: this.vramLedger.totalGeometryBytes,
                textureBytes: this.vramLedger.totalTextureBytes,
                totalBytes: this.vramLedger.totalVRAMBytes,
                budgetBytes: this.cacheManager.budget,
                budgetUtilization: +(this.cacheManager.utilization).toFixed(4),
                // Human-readable
                geometry: fmt(this.vramLedger.totalGeometryBytes),
                textures: fmt(this.vramLedger.totalTextureBytes),
                total: fmt(this.vramLedger.totalVRAMBytes),
                budget: fmt(this.cacheManager.budget),
                headroom: fmt(this.cacheManager.headroom),
            },
            network: {
                totalPayloadBytes: this.vramLedger.totalNetworkBytes,
                binBytes: this.vramLedger._networkBin,
                texBytes: this.vramLedger._networkTex,
                // Human-readable
                total: fmt(this.vramLedger.totalNetworkBytes),
                bin: fmt(this.vramLedger._networkBin),
                tex: fmt(this.vramLedger._networkTex),
            },
            spatial: {
                inFrustumBytes: spatial.inFrustumBytes,
                outFrustumBytes: spatial.outFrustumBytes,
                nearBytes: spatial.nearBytes,
                midBytes: spatial.midBytes,
                farBytes: spatial.farBytes,
                inFrustumTiles: spatial.tileBreakdown.inFrustum,
                outFrustumTiles: spatial.tileBreakdown.outFrustum,
                // Human-readable
                inFrustum: `${spatial.tileBreakdown.inFrustum} tiles (${fmt(spatial.inFrustumBytes)})`,
                outFrustum: `${spatial.tileBreakdown.outFrustum} tiles (${fmt(spatial.outFrustumBytes)})`,
                near: fmt(spatial.nearBytes),
                mid: fmt(spatial.midBytes),
                far: fmt(spatial.farBytes),
            },
            tiles: {
                loaded: this.tiles.size,
                loadQueue: this.loadQueue.length,
                upgradeQueue: this.upgradeQueue.length,
                sinterQueue: this.sinterQueue.length,
                activeWorkers: this.activeWorkerCount,
                materialsTracked: this.materialsToUpdate.size,
                evictedTotal: this.cacheManager.evictionCount,
                evictedBytes: fmt(this.cacheManager.evictedBytes),
                redownloads: this.cacheManager.redownloadCount,
            },
            violations: this._perfViolationCount,
            allocationCount: this.vramLedger.entries.size,
        };
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this._frameCounter++;

        // --- BACKGROUND MAINTENANCE ---
        track('processInstantiationQueue', () => this.processInstantiationQueue());
        track('processQueues', () => this.processQueues());

        const now = performance.now();
        const timeSinceInteraction = now - this.lastInteractionTime;

        // --- ANTISINTERING REFINEMENT ---
        if (!this.isUserInteracting && timeSinceInteraction > 200) {
            if (!this.isRefining && !this.isRefinementDone) {
                this.isRefining = true;
            }
            const stillRefining = track('refineLODs', () => this.refineLODs());
            if (!stillRefining) this.isRefinementDone = true;
        } else {
            if (this.isUserInteracting) {
                this.isRefinementDone = false;
            }
        }

        // Disable damping when not actively interacting to prevent momentum in sintered mode.
        this.controls.enableDamping = this.isUserInteracting;
        const moved = this.controls.update();

        // CALCULATE isMoving3D EARLY so updateLOD() can skip texture upgrades during movement
        const angle = this.controls.getPolarAngle() * 180 / Math.PI;
        const flat = angle < 5.5;
        const wasMoving3D = this.isMoving3D;
        this.isMoving3D = !flat && (moved || this.isUserInteracting);

        // --- DERIVE ENGINE STATE (must happen after moved/flat/isMoving3D are set) ---
        this.engineState = this.deriveEngineState(moved, flat);

        // If transitioning INTO movement, clear the upgrade queue
        if (!wasMoving3D && this.isMoving3D) {
            this.upgradeQueue.length = 0;
            for (const tile of this.tiles.values()) {
                tile.queuedForUpgrade = false;
            }
        }

        // NOW update LOD (after isMoving3D is set)
        const camDist = this.camera.position.distanceTo(this.lastLODCamPos);
        if (camDist > 50 || this.isRefining || this.needsLODUpdate || !this.loaderHidden) {
            track('updateLOD', () => this.updateLOD());
            if (camDist > 50) this.lastLODCamPos.copy(this.camera.position);
            this.needsLODUpdate = false;
        }

        // --- RENDER CHECK ---
        // STATIC state: must NOT render. Early-out if nothing moved and no flags set.
        this.profiler?.frame(now, this.engineState, moved || this.needsRender);
        if (!moved && !this.needsRender) return;

        // ===== BEGIN TIMED RENDER CYCLE =====
        const cycleStart = performance.now();

        this.updateRenderStats(now);
        this.updateFps();
        this.updateFrametimeGraph();

        const linear = Math.min(1, Math.max(0, (angle - 5.5) / (25.0 - 5.5)));
        const h = linear;

        if (this.isMoving3D) {
            this.lastInteractionTime = now;
            this.isRefining = false;
            this.resetLODs();
            this.needsLODUpdate = true;
            this.lodTransitionInProgress = false;
            this.lastLodPreset = 'MOVING';
        } else if (wasMoving3D && !flat) {
            // Settling: refineLODs() walks qualityScale down to 1 over the
            // next frames (frametime-capped) — no preset snap needed.
            this.needsLODUpdate = true;
            this.lodTransitionInProgress = true;
            this.lastLodPreset = 'TARGET';
        }

        this.updateFloorState(h);
        this.maintainCameraAltitudeDuringAnimation(h);

        // --- VISIBILITY PASS ---
        // Gone: no flat-plane swap (top-down 2D is just the flattened caps —
        // uHeightFactor already animates height to 0 below 5.5°) and no
        // per-band group toggling (the CDLOD cut is per-instance in the
        // vertex shader). Every built level stays visible.
        const visibilityChanges = 0;

        // --- SINTERING (settled 3D) ---
        if (!flat && !this.isMoving3D) {
            const inView = this.getTilesInView();
            for (const t of inView) {
                if (t.needsSinteredBuild && !this.sinterQueue.includes(t)) {
                    this.sinterQueue.push(t);
                }
            }
            if (this.sinterQueue.length > 0) {
                const tile = this.sinterQueue.shift();
                this.buildSinteredLods(tile);
            }
        }
        this.wasMoving3D = this.isMoving3D;

        // --- MATERIAL UNIFORM UPDATE ---
        this.computeLodRadii();
        let needsUpdateCount = 0;
        for (const m of this.materialsToUpdate) {
            if (m.needsUpdate) needsUpdateCount++;
            if (m.userData.shader) {
                m.userData.shader.uniforms.uHeightFactor.value = h;
                m.userData.shader.uniforms.uFloorOffset.value = this.floorState.value;
                const uCam = m.userData.shader.uniforms.uCameraPos;
                if (uCam?.value?.copy) uCam.value.copy(this.camera.position);

                if (m.userData.isHorizon) continue; // horizon has no LOD/gradient uniforms

                m.userData.shader.uniforms.uGradientMode.value = this.gradientMode;

                if (m.userData.lodIdx !== undefined) {
                    // Gosper level k: band = (R(k-1), R(k)], parent checked
                    // against R(k). The finest BUILT level ignores the near
                    // edge so coverage holds before sintering completes.
                    const k = m.userData.lodIdx;
                    const minD = (k <= 0) ? 0.0 : this.lodRadii[k - 1];
                    const maxD = this.lodRadii[k];
                    m.userData.shader.uniforms.uLodRadii.value.set(minD, maxD);
                    m.userData.shader.uniforms.uFinestBuilt.value = m.userData.isFinest ? 1.0 : 0.0;
                    m.userData.shader.uniforms.uCapTint.value = (k >= 1) ? 1.0 : 0.0;
                }
            }
        }

        // --- RENDER ---
        this.renderer.render(this.scene, this.camera);

        // ===== END TIMED RENDER CYCLE =====
        const cycleDuration = performance.now() - cycleStart;
        const budget = STATE_BUDGETS_MS[this.engineState];

        // --- STRUCTURED VIOLATION LOGGING ---
        if (cycleDuration > budget) {
            this._perfViolationCount++;

            if (this._perfViolationCount <= PERF_VERBOSE_MAX) {
                // VERBOSE: Full-fat output for first N violations
                const culprits = [];
                if (visibilityChanges > 50) culprits.push(`vis-thrash:${visibilityChanges}`);
                if (needsUpdateCount > 0) culprits.push(`mat-recompile:${needsUpdateCount}`);
                const recentUpgrades = this.recentlyUpgradedTextures.filter(u => now - u.time < 50);
                if (recentUpgrades.length > 0) culprits.push(`tex-upgrade:${recentUpgrades.length}`);
                this.recentlyUpgradedTextures = recentUpgrades.slice(-3);
                if (this.sinterQueue.length > 0) culprits.push(`sinter-queue:${this.sinterQueue.length}`);
                if (this.lodTransitionInProgress) culprits.push('lod-transition');
                if (culprits.length === 0) culprits.push('gpu-render');

                console.log('[PERF_VIOLATION] ' + JSON.stringify({
                    state: this.engineState,
                    duration: +cycleDuration.toFixed(1),
                    budget,
                    culprits,
                    frame: this._frameCounter
                }));
            } else {
                // STATISTICAL: Accumulate silently, flush every PERF_STATS_WINDOW violations
                const st = this.engineState;
                if (!this._perfStats[st]) this._perfStats[st] = { min: Infinity, max: -Infinity, sum: 0, count: 0 };
                const s = this._perfStats[st];
                s.min = Math.min(s.min, cycleDuration);
                s.max = Math.max(s.max, cycleDuration);
                s.sum += cycleDuration;
                s.count++;

                const accumulated = Object.values(this._perfStats).reduce((a, b) => a + b.count, 0);
                if (accumulated >= PERF_STATS_WINDOW) {
                    const summary = {};
                    for (const [state, data] of Object.entries(this._perfStats)) {
                        summary[state] = {
                            count: data.count,
                            avg: +(data.sum / data.count).toFixed(1),
                            min: +data.min.toFixed(1),
                            max: +data.max.toFixed(1)
                        };
                    }
                    console.log('[PERF_VIOLATION] ' + JSON.stringify({
                        type: 'stats',
                        totalViolations: this._perfViolationCount,
                        window: PERF_STATS_WINDOW,
                        summary,
                        frame: this._frameCounter
                    }));
                    // Reset accumulators for next window
                    this._perfStats = {};
                }
            }
        }

        // Consume transition flag (allow one frame grace)
        if (this.lodTransitionInProgress) this.lodTransitionInProgress = false;

        this.needsRender = false;
        this.floorState.lastFactor = h;
    }
}

new PistonViewer();
initBenchmark(window.pistonViewer, APP_VERSION);
