// @atlas: PistonViewer orchestrator for GSP1/GSP2/current GSP3 Gosper islands. GSP2+ uses generic-frustum L3 range selection and deferred geometry; GSP3 supplies exact rendered subtree bounds while older versions remain safe migration paths.
import * as THREE from 'three';
import { MapControls } from 'three/addons/controls/MapControls.js';
import { HexSearch } from './search.js';
import { VRAMLedger } from './vram_ledger.js';
import { CacheManager } from './cache_manager.js';
import { PerfProfiler } from './perf_profiler.js';
import { createProfilerForReleaseMode, resolveReleaseMode } from './release_mode.js';
import { initBenchmark } from './benchmark.js';
import { ShareableViewState } from './view_state.js';
import {
    VisibilityClass,
    createProjectionContext,
    expandFrustumPlanes,
    extractFrustumPlanes,
    planHierarchicalVisibility,
} from './visibility_planner.js';
import {
    GOSPER_CAP_OVERSCAN,
    GosperVisibilityAdapter,
} from './gosper_visibility_adapter.js';
import {
    gosperGeometrySelectionNeedsRebuild,
    planGosperGeometrySelection,
} from './gosper_geometry_selection.js';
import {
    applyLodPauseTransition,
    CameraMotionLatch,
    cameraPoseChanged,
    geometryBuildCanCommit,
    geometryLevelsForMode,
    shouldForceCoarseGeometry,
    shouldRefreshMotionFromControlsChange,
    writeCameraPose,
} from './geometry_transition_state.js';
import {
    computeCameraClearance,
    computeTerrainAnchorRebase,
    selectManifestFloorBaseline,
} from './vertical_bootstrap.js';
import { TexturePageGrid } from './texture_page_grid.js';
import {
    PAGE_TEXTURE_RANK,
    PAGE_TEXTURE_TIER,
    TexturePageResidency,
    pruneTextureDispatchQueue,
    selectTextureDispatchTaskIndex,
    textureStateHasDemand,
} from './texture_page_residency.js';
import {
    TEXTURE_HUD_ROWS,
    collectDisplayedTexturePages,
    collectTextureTierResidency,
    countUnpaintedVisibleTiles,
} from './texture_hud_telemetry.js';
import { TexturePageVisibilityAdapter } from './texture_page_visibility_adapter.js';
import {
    applyTwoFingerGesture,
    createTouchGestureScratch,
} from './touch_gesture.js?v=touchalloc1';
import {
    buildTexturePageShaderSwitch,
    MAX_TEXTURE_PAGE_BINDINGS,
} from './texture_page_shader.js';
import {
    computeGosperSourceFootprint,
    gosperIslandSourceBounds,
    sourceFootprintFromGeometryContract,
} from './gosper_page_binding_adapter.js';
import {
    ResourceRetryScheduler,
    ResweepScheduler,
} from './fetch_retry.js';
import {
    WORKER_JOB_TIMEOUT_MS,
    WorkerWatchdogBookkeeper,
} from './worker_watchdog.js';
import {
    applyRenderResolution,
    bindSharedLodInstanceAttributes,
    createGeometryWithSharedStaticBuffers,
    createSharedLodInstanceAttributes,
    disposeGeometryWithSharedStaticBuffers,
    rendererOptionsForLocation,
    staticBufferSharingStats,
    watchDevicePixelRatio,
} from './render_policy.js';
import { IdleRenderScheduler } from './idle_render_scheduler.js';
import './gosper_core.js';

const G = window.GosperCore;
const TILE_WORKER_URL = typeof __TILE_WORKER_URL__ === 'string'
    ? __TILE_WORKER_URL__
    : './tile_worker.js';

// --- ENGINE STATE MACHINE & PERFORMANCE MONITORING ---
const APP_VERSION = 'v0.10.0-rc5';
const ENGINE_STATES = { MOVING_2D: 'MOVING_2D', MOVING_3D: 'MOVING_3D', SINTERING: 'SINTERING', STATIC: 'STATIC' };
const MANIFEST_RETRY_KEY = 'manifest:tile_manifest.json';
const RECOVERABLE_SWEEP_TILES = 'tiles';
const RECOVERABLE_SWEEP_TEXTURES = 'textures';
const CONTEXT_RESTORE_TIMEOUT_MS = 10000;

class UnsupportedDeviceError extends Error {
    constructor(message) {
        super(message);
        this.name = 'UnsupportedDeviceError';
    }
}
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
const CAMERA_TERRAIN_CLEARANCE_METERS = 50;

// Three deterministic imagery tiers. Quality is selected from projected screen
// footprint, never a radial distance or inferred device class.
const TEXTURE_TIER = PAGE_TEXTURE_TIER;
const TEXTURE_RANK = PAGE_TEXTURE_RANK;
const TEXTURE_CONFIG = Object.freeze({
    mediumEnterPx: 96,
    mediumExitPx: 72,  // 25% downgrade hysteresis
    highEnterPx: 512,
    highExitPx: 384,   // 25% downgrade hysteresis
    maxTextureJobs: 2,
    maxUploadsPerFrame: 1,
});

function appendCacheKey(url, cacheKey) {
    if (cacheKey === undefined || cacheKey === null || cacheKey === '') return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${encodeURIComponent(String(cacheKey))}`;
}

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
// Non-mini atmospheric transition only. Geometry and texture residency are
// governed by the frustum planner, never this visual haze control.
const DEFAULT_HAZE_DISTANCE = 4000;
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
// always profile-selected XUASTC LDR encoded with -no_alpha, so no RGBA/alpha variants
// (BC3, ETC2 RGBA, PVRTC RGBA) are ever produced.
const KTX2_FORMAT_MAP = {
    'astc-4x4': THREE.RGBA_ASTC_4x4_Format,
    'astc-6x6': THREE.RGBA_ASTC_6x6_Format,
    'astc-8x6': THREE.RGBA_ASTC_8x6_Format,
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

        this.renderer = new THREE.WebGLRenderer(rendererOptionsForLocation(window.location.search));
        this.renderPixelRatio = applyRenderResolution(this.renderer, {
            width: window.innerWidth,
            height: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio,
        });
        this.container.appendChild(this.renderer.domElement);
        this.contextRecovery = {
            active: false,
            timer: null,
            wasLoaderHidden: false,
        };

        this.controls = new MapControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 100;
        this.controls.maxDistance = 50000;
        this.controls.maxPolarAngle = Math.PI / 2.1;

        // INTERACTION STATE TRACKING
        this.isUserInteracting = false;
        // One whole-scene motion invariant for flat and pitched views alike.
        this.isMovingView = false;
        this.cameraMotion = new CameraMotionLatch(300);
        this.controls.addEventListener('start', () => {
            this.isUserInteracting = true;
            // Real controls input enters before wheel's synchronous end event
            // or any promise callback can observe stale settled mode.
            this.notifyCameraMotion(performance.now());
        });
        this.controls.addEventListener('end', () => {
            this.isUserInteracting = false;
            const now = performance.now();
            // MapControls wheel dispatches start/change/end in one browser
            // event. Keep that completed burst moving through a rendered frame.
            if (this.isMovingView) this.cameraMotion.note(now);
        });
        this.controls.addEventListener('change', () => {
            // MapControls can emit passive change events forever from update()
            // with an identical pose. Only an active gesture may refresh the
            // latch; programmatic callers use notifyCameraMotion explicitly.
            if (shouldRefreshMotionFromControlsChange(this.isUserInteracting)) {
                this.notifyCameraMotion(performance.now());
            }
        });
        // MapControls normally dispatches start/change/end for a wheel burst,
        // but browser/trackpad event ordering differs. Capture raw wheel input
        // as an idempotent moving assertion before MapControls mutates pose.
        this.renderer.domElement.addEventListener('wheel', () => {
            this.notifyCameraMotion(performance.now());
        }, { capture: true, passive: true });
        this.attachContextRecovery();
        this.lastObservedCameraPose = writeCameraPose(
            this.camera,
            this.controls.target,
        );
        this.observedCameraPose = new Float64Array(10);
        this.viewState = new ShareableViewState(this);

        this.needsRender = true;
        this.lastLODCamPos = new THREE.Vector3().copy(this.camera.position);

        // --- FIXED-DISTANCE GOSPER LOD ---
        // Preserve the primary branch's useful settled bands:
        //   unit 0..2 km, small 2..5 km, medium 5..10 km, large 10 km+
        // Gosper has two additional hierarchy levels, so the old open-ended
        // large band continues through 25 km and 60 km before the tile root.
        // The hierarchical shader cut still uses a single shared boundary for
        // every parent/child pair, so the bands partition without omissions.
        this.settledLodRadii = new Float32Array([2000, 5000, 10000, 25000, 60000, 1e9]);
        // During any camera motion we do NOT run the per-distance CDLOD selection:
        // the whole view is a single uniform gosper level — identically sized
        // large skirtless hexes at every distance (fastest, and the intended
        // look). movingLevel picks that size (2 ~45 m, 3 ~118 m, 4 ~314 m
        // flat-to-flat). Settled mode reverts to the multi-level CDLOD.
        this.movingLevel = 3;
        this.lodRadii = new Float32Array(TILE_LEVEL + 1); // R(0)..R(5)
        this.computeLodRadii();

        // Per-tile per-level submission gate. The CDLOD cut degenerates
        // out-of-band instances in the vertex shader, but they are still
        // fully vertex-shaded — a tile 3 km out was submitting its entire
        // 16,807-instance level-0 buffer every frame for zero visible caps.
        // updateLevelVisibility() hides a level's mesh group whenever the
        // tile's distance band cannot intersect that level's radius band, so
        // distant tiles stop submitting fine levels entirely. Margin covers
        // the ~415 m unit half-footprint plus overscan/rotation slack.
        this.lodTileMargin = 650;

        this.onResize = this.onResize.bind(this);
        window.addEventListener('resize', this.onResize);
        // Resize covers viewport changes; this query catches a macOS monitor
        // transition even when CSS dimensions happen to stay unchanged.
        this.stopDprWatcher = watchDevicePixelRatio(window, this.onResize);

        this.tiles = new Map(); // Key: "yq_yr" (island lattice) -> Tile Object
        this.manifest = null;
        this.loadingTiles = new Set();
        this.failedTiles = new Set();
        this.loadQueue = [];
        this.geometryRebuildQueue = [];
        this.geometryPlanEpoch = 0;
        this.textureQueue = [];
        this.textureResultQueue = [];
        this.textureStates = new Map();
        this.failedTextures = new Set();
        this.texturePageGrid = null;
        this.texturePageResidency = null;
        this.texturePageVisibilityAdapter = null;
        this.texturePagePlanStats = null;
        this.missingPageTexture = this.createMissingPageTexture();
        this.visibilityByKey = new Map();
        this.currentVisibilityContext = null;
        this.geometryFrontierStats = {
            plannedTiles: 0,
            activeL3: 0,
            excludedL3: 0,
            selectedDetailNodes: 0,
            rebuilds: 0,
        };
        this.activeTextureJobs = 0;
        this.instantiateQueue = []; // NEW: Results ready for main thread
        this.activeWorkerCount = 0; // NEW: Replaces isProcessingTile
        this.recentlyUpgradedTextures = []; // Track tiles that just got texture upgraded (for render spike correlation)
        // this.isProcessingTile = false; // REMOVED
        // this.isUpgradingTex = false; // REMOVED

        this.loaderHidden = false;
        this.fatalState = null;
        this.appStartTime = performance.now();
        this.materialsToUpdate = new Set(); // Changed to Set

        this.gradientMode = 1.0;
        this.highTextureEnterPx = TEXTURE_CONFIG.highEnterPx;
        this.heightFactor = 0.0;
        this.transSettings = { flatThresh: 5.0, riseStart: 6.0, riseEnd: 25.0, curve: 1.0 };
        this.worldOrigin = { x: 0, y: 0 };
        this.floorMode = FLOOR_MODE;
        this.floorState = { locked: false, provisional: false, value: 0.0 };
        this.visibilityBootstrapReady = false;
        this.globalStats = { min: Infinity, max: -Infinity, avgSum: 0.0, baseSum: 0.0, count: 0 };
        this.frustum = new THREE.Frustum();
        this.projScreenMatrix = new THREE.Matrix4();
        this.atmosphereSettings = { hazeDistance: DEFAULT_HAZE_DISTANCE };

        // Debug/Stats
        this.fpsState = { frames: 0, activeElapsed: 0, lastActiveFrame: null };
        this.fpsEl = document.getElementById('fps-counter');
        this.hexCountEl = document.getElementById('hex-count');
        this.triCountEl = document.getElementById('tri-count');
        this.drawStatsEl = document.getElementById('draw-stats');
        this.debugSectionEl = document.querySelector('[data-section="debug"]');
        this.tileHeightEl = document.getElementById('tile-height');
        this.cameraHeightEl = document.getElementById('camera-height');
        this.statsUpdateState = { lastUpdate: 0, interval: 500 };

        this.wasMovingView = false;

        // Engine state machine (for structured perf logging)
        this.engineState = ENGINE_STATES.STATIC;
        this._perfViolationCount = 0;
        this._perfStats = {};  // Per-state rolling stats: { STATE: { min, max, sum, count } }
        this._texErrorCount = 0; // Dedup repeated texture decode failures
        this._frameCounter = 0;
        this.failureStats = {
            manifestFailures: 0,
            tileFailures: 0,
            textureFailures: 0,
            recoverableSweepsScheduled: 0,
            recoverableSweepsRun: 0,
            globalErrors: 0,
            unhandledRejections: 0,
            workerTimeouts: 0,
            workerRespawns: 0,
            workerFailedJobs: 0,
            contextLost: 0,
            contextRestored: 0,
            contextRecoveryFailures: 0,
        };
        this.resourceRetries = new ResourceRetryScheduler();
        this.recoverableResweeps = new ResweepScheduler({
            onSchedule: () => { this.failureStats.recoverableSweepsScheduled++; },
        });
        this.failedWorkerJobs = new Set();

        // Frametime Graph
        this.frametimeCanvas = document.getElementById('frametime-graph');
        this.frametimeCtx = this.frametimeCanvas ? this.frametimeCanvas.getContext('2d') : null;
        this.frametimeBuffer = new Array(640).fill(16.67); // 60fps baseline
        this.frametimeLastTime = performance.now();

        // LOD Pause Toggle
        this.lodPaused = false;

        this.initDebugConsole();
        this.installGlobalBackstop();
        this.initMinimizeButton();
        this.initCollapsibleSections();
        this.initLODSliders();
        this.initLodTruthLabels();
        this.viewState.restorePublicSettings();
        this.updateFogAndClip();

        // WORKER SYSTEM
        this.workers = [];
        this.nextWorkerIdx = 0;
        this.pendingJobs = new Map(); // ID -> {resolve, reject}
        this.jobIdCounter = 0;
        this.workerScriptUrl = TILE_WORKER_URL;
        this.workerWatchdog = new WorkerWatchdogBookkeeper();
        this.workerWatchdogTimer = null;
        this.textureSupport = null; // set by initWorkers() from renderer.extensions
        this.initWorkers();

        // Dumb counters for the perf harness — updated on every texture arrival
        // (low-res on tile instantiation, full-res on upgrade). No logging loop.
        this.texStats = {
            count: 0,
            totalTranscodeMs: 0,
            maxTranscodeMs: 0,
            formatKey: null,
            totalGpuBytes: 0,
            maxTextureSize: this.renderer.capabilities.maxTextureSize,
            highUploadSize: null,
            highSourceSize: null,
            highSkippedTopMips: 0,
        };
        this._textureMilestonesDone = false;
        this._updateTexBadge(); // seed the on-screen "TEX · loading..." badge immediately

        // --- INFRASTRUCTURE: Telemetry & Cache Authority ---
        this.vramLedger = new VRAMLedger();
        this.cacheManager = new CacheManager();

        this.initTouchMomentumTracking();
        this.initWorld();
        this.frameScheduler = new IdleRenderScheduler({
            requestAnimationFrame: requestAnimationFrame.bind(window),
            cancelAnimationFrame: cancelAnimationFrame.bind(window),
            setTimeout: window.setTimeout.bind(window),
            clearTimeout: window.clearTimeout.bind(window),
            document,
            now: () => performance.now(),
            frame: now => this.animate(now),
        });
        this.frameScheduler.start();
        window.pistonViewer = this;
    }

    initTouchMomentumTracking() {
        const el = this.renderer?.domElement;
        if (!el) return;

        // Disabling standard two-finger controls in MapControls
        if (this.controls && this.controls.touches) {
            this.controls.touches.TWO = null;
        }

        this.activeTouches = new Map();
        this.activeTouchIds = [];
        this.touchGestureScratch = createTouchGestureScratch(THREE);
        this.lastTouchDistance = null;
        this.lastTouchAngle = null;
        this.lastTouchMidpointY = null;

        const noteTouch = (event) => {
            if (event.pointerType !== 'touch') return;
            let touch = this.activeTouches.get(event.pointerId);
            if (!touch) {
                // Pointer-down is outside the move hot path. The mutable point
                // is subsequently updated in place for allocation-free moves.
                touch = { x: event.clientX, y: event.clientY };
                this.activeTouches.set(event.pointerId, touch);
                this.activeTouchIds.push(event.pointerId);
            } else {
                touch.x = event.clientX;
                touch.y = event.clientY;
            }
            if (this.activeTouches.size === 2) {
                // Reset stored values for start of two-finger gesture
                this.lastTouchDistance = null;
                this.lastTouchAngle = null;
                this.lastTouchMidpointY = null;
            }
        };

        const handlePointerMove = (event) => {
            if (event.pointerType !== 'touch') return;
            const touch = this.activeTouches.get(event.pointerId);
            if (touch) {
                touch.x = event.clientX;
                touch.y = event.clientY;
                if (this.activeTouches.size === 2) {
                    if (event.cancelable) event.preventDefault();
                    this.handleTwoFingerGesture(event);
                }
            }
        };

        const clearTouch = (event) => {
            if (event.pointerType !== 'touch') return;
            this.activeTouches.delete(event.pointerId);
            const touchIndex = this.activeTouchIds.indexOf(event.pointerId);
            if (touchIndex !== -1) this.activeTouchIds.splice(touchIndex, 1);
            if (this.activeTouches.size < 2) {
                this.lastTouchDistance = null;
                this.lastTouchAngle = null;
                this.lastTouchMidpointY = null;
            }
        };

        el.addEventListener('pointerdown', noteTouch, { passive: true });
        el.addEventListener('pointermove', handlePointerMove, { passive: false });
        el.addEventListener('pointerup', clearTouch, { passive: true });
        el.addEventListener('pointercancel', clearTouch, { passive: true });
        el.addEventListener('lostpointercapture', clearTouch, { passive: true });
    }

    handleTwoFingerGesture(event) {
        if (this.activeTouchIds.length !== 2) return;

        const id1 = this.activeTouchIds[0];
        const id2 = this.activeTouchIds[1];
        const t1 = this.activeTouches.get(id1);
        const t2 = this.activeTouches.get(id2);

        const dist = Math.hypot(t2.x - t1.x, t2.y - t1.y);
        const angle = Math.atan2(t2.y - t1.y, t2.x - t1.x);
        const midpointX = (t1.x + t2.x) / 2;
        const midpointY = (t1.y + t2.y) / 2;

        if (this.lastTouchDistance === undefined || this.lastTouchDistance === null) {
            this.lastTouchDistance = dist;
            this.lastTouchAngle = angle;
            this.lastTouchMidpointY = midpointY;
            return;
        }

        const distRatio = dist / this.lastTouchDistance;
        let angleDelta = angle - this.lastTouchAngle;
        while (angleDelta < -Math.PI) angleDelta += Math.PI * 2;
        while (angleDelta > Math.PI) angleDelta -= Math.PI * 2;

        const midpointDeltaY = midpointY - this.lastTouchMidpointY;

        const camera = this.camera;
        const target = this.controls.target;
        
        const cameraMoved = applyTwoFingerGesture(
            this.touchGestureScratch,
            camera,
            target,
            this.controls,
            this.renderer,
            midpointX,
            midpointY,
            distRatio,
            angleDelta,
            midpointDeltaY,
        );

        if (cameraMoved) {
            camera.lookAt(target);
            this.controls.update();
            this.needsRender = true;
            this.notifyCameraMotion(performance.now());
            this.viewState?.commitViewChange();
        }

        this.lastTouchDistance = dist;
        this.lastTouchAngle = angle;
        this.lastTouchMidpointY = midpointY;
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
            maxTextureSize: this.renderer.capabilities.maxTextureSize,
        };

        for (let i = 0; i < count; i++) {
            this.workers.push(this._createWorker(i));
        }
    }

    _createWorker(index) {
        const worker = new Worker(this.workerScriptUrl);
        worker.onmessage = (e) => this.handleWorkerMessage(e);
        worker.onerror = (e) => {
            console.warn(`[WORKER_ERROR] ${index}: ${e.message || 'unknown worker error'}`);
        };
        // Worker does not reply to INIT — fire and forget.
        // NB: must use the same {type, data} envelope as every other worker
        // message — the worker destructures e.data.data.
        worker.postMessage({ type: 'INIT', data: { support: this.textureSupport } });
        return worker;
    }

    _restartWorker(index, reason) {
        this.workers[index]?.terminate();
        this.workers[index] = this._createWorker(index);
        this.failureStats.workerRespawns++;
        this.log(`Worker ${index} restarted: ${reason}`, 'error');
    }

    handleWorkerMessage(e) {
        const { id, status, result, error } = e.data;
        const job = this.pendingJobs.get(id);
        if (!job) return;

        this.pendingJobs.delete(id);
        this.workerWatchdog.complete(id);

        if (status === 'success') job.resolve(result);
        else job.reject(new Error(error));
        this._scheduleWorkerWatchdog();
        this.frameScheduler?.wake('worker-complete');
    }

    postWorkerJob(type, data, transferables = []) {
        return new Promise((resolve, reject) => {
            const id = this.jobIdCounter++;
            const job = {
                id,
                type,
                data,
                transferables,
                resolve,
                reject,
                resourceKey: this._workerJobResourceKey(type, data),
                workerIndex: null,
            };
            this.pendingJobs.set(id, job);

            const workerIndex = this.nextWorkerIdx;
            this.nextWorkerIdx = (this.nextWorkerIdx + 1) % this.workers.length;

            this._postPendingWorkerJob(job, workerIndex);
        });
    }

    _workerJobResourceKey(type, data) {
        if (type === 'LOAD_TILE' || type === 'BUILD_GEOMETRY') return `${data.yq}_${data.yr}`;
        if (type === 'LOAD_TEXTURE') return (data.urls || []).join(',');
        return type;
    }

    _postPendingWorkerJob(job, workerIndex, { scheduleWatchdog = true } = {}) {
        job.workerIndex = workerIndex;
        this.workerWatchdog.track(job.id, workerIndex, {
            type: job.type,
            resourceKey: job.resourceKey,
        });
        this.workers[workerIndex].postMessage(
            { id: job.id, type: job.type, data: job.data },
            job.transferables,
        );
        if (scheduleWatchdog) this._scheduleWorkerWatchdog();
    }

    _scheduleWorkerWatchdog() {
        if (this.workerWatchdogTimer) return;
        if (this.pendingJobs.size === 0) return;
        const delay = this.workerWatchdog.timeUntilNextDeadline() ?? WORKER_JOB_TIMEOUT_MS;
        this.workerWatchdogTimer = setTimeout(
            () => this._runWorkerWatchdog(),
            Math.max(0, delay),
        );
    }

    _failWorkerJob(job, error) {
        this.pendingJobs.delete(job.id);
        this.workerWatchdog.complete(job.id);
        this.failedWorkerJobs.add(`${job.type}:${job.resourceKey}`);
        this.failureStats.workerFailedJobs++;
        job.reject(error);
    }

    _runWorkerWatchdog() {
        this.workerWatchdogTimer = null;
        const expired = this.workerWatchdog.expired();
        if (expired.length === 0) {
            this._scheduleWorkerWatchdog();
            return;
        }

        const restartedWorkers = new Set();
        const failedJobs = new Map();
        for (const expiredJob of expired) {
            const job = this.pendingJobs.get(expiredJob.id);
            if (!job) continue;
            const timeout = this.workerWatchdog.recordTimeout(job.id);
            if (!timeout) continue;
            this.failureStats.workerTimeouts++;
            restartedWorkers.add(job.workerIndex);
            if (timeout.shouldFail) {
                failedJobs.set(job.id, new Error(
                    `${job.type} ${job.resourceKey} timed out twice after ${WORKER_JOB_TIMEOUT_MS}ms`,
                ));
            }
        }

        for (const workerIndex of restartedWorkers) {
            this._restartWorker(workerIndex, 'watchdog timeout');
        }

        for (const job of Array.from(this.pendingJobs.values())) {
            if (!restartedWorkers.has(job.workerIndex)) continue;
            const failure = failedJobs.get(job.id);
            if (failure) {
                this._failWorkerJob(job, failure);
            } else {
                this._postPendingWorkerJob(job, job.workerIndex, { scheduleWatchdog: false });
            }
        }

        this._scheduleWorkerWatchdog();
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
        this.initCopyLogButton();
    }

    initCopyLogButton() {
        const btn = document.getElementById('copy-log-btn');
        const output = document.getElementById('console-output');
        if (!btn || !output) return;

        const idleText = btn.textContent || 'COPY';
        let resetHandle = null;
        btn.addEventListener('click', async () => {
            const lines = Array.from(output.querySelectorAll('.log-line'))
                .map(line => line.textContent.trim())
                .filter(Boolean);
            const text = lines.length ? lines.join('\n') : output.textContent.trim();
            try {
                await this.writeClipboardText(text);
                btn.textContent = 'COPIED';
                btn.classList.add('copied');
            } catch (e) {
                btn.textContent = 'FAILED';
                btn.classList.remove('copied');
                console.warn('[HUD] Failed to copy status log:', e);
            }

            if (resetHandle) clearTimeout(resetHandle);
            resetHandle = setTimeout(() => {
                btn.textContent = idleText;
                btn.classList.remove('copied');
            }, 1200);
        });
    }

    async writeClipboardText(text) {
        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return;
        }
        this.execCommandCopyText(text);
    }

    execCommandCopyText(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            if (!document.execCommand('copy')) throw new Error('execCommand copy returned false');
        } finally {
            document.body.removeChild(textarea);
        }
    }

    installGlobalBackstop() {
        if (PistonViewer.globalBackstopInstalled) return;
        PistonViewer.globalBackstopInstalled = true;
        window.addEventListener('error', event => {
            const viewer = window.pistonViewer || this;
            viewer._recordGlobalBackstop('error', event.error || event.message);
        });
        window.addEventListener('unhandledrejection', event => {
            const viewer = window.pistonViewer || this;
            viewer._recordGlobalBackstop('unhandledrejection', event.reason);
        });
    }

    _recordGlobalBackstop(kind, payload) {
        const message = payload?.message || String(payload || 'unknown error');
        if (kind === 'unhandledrejection') this.failureStats.unhandledRejections++;
        else this.failureStats.globalErrors++;
        this.log(`Unhandled ${kind}: ${message}`, 'error');
        console.error(`[GLOBAL_${kind.toUpperCase()}]`, payload);
    }

    attachContextRecovery() {
        const canvas = this.renderer?.domElement;
        if (!canvas) return;
        canvas.addEventListener('webglcontextlost', event => this._onWebGLContextLost(event), false);
        canvas.addEventListener('webglcontextrestored', () => this._onWebGLContextRestored(), false);
    }

    _onWebGLContextLost(event) {
        event.preventDefault();
        if (this.contextRecovery.active) return;
        this.contextRecovery.active = true;
        this.contextRecovery.wasLoaderHidden = this.loaderHidden;
        this.failureStats.contextLost++;
        this.log('Graphics context lost; waiting for browser restore.', 'error');
        this._showLoadingState('Restoring graphics context.', 'Waiting for WebGL to recover...');
        this.contextRecovery.timer = setTimeout(() => {
            if (!this.contextRecovery.active) return;
            this.failureStats.contextRecoveryFailures++;
            this._showFatalState('context', new Error('WebGL context was not restored within 10 seconds.'));
        }, CONTEXT_RESTORE_TIMEOUT_MS);
    }

    _onWebGLContextRestored() {
        if (!this.contextRecovery.active) return;
        if (this.contextRecovery.timer) {
            clearTimeout(this.contextRecovery.timer);
            this.contextRecovery.timer = null;
        }
        this.failureStats.contextRestored++;
        this.log('Graphics context restored; rebuilding GPU resources.', 'info');
        try {
            this._reuploadGpuResidentState();
            this.contextRecovery.active = false;
            if (this.contextRecovery.wasLoaderHidden) {
                const loader = document.getElementById('loader');
                if (loader) {
                    loader.classList.add('hide');
                    setTimeout(() => { loader.style.display = 'none'; }, 600);
                }
                this.loaderHidden = true;
            } else {
                this._showLoadingState();
                this.checkInitialLoad();
            }
        } catch (error) {
            this.failureStats.contextRecoveryFailures++;
            this._showFatalState('context', error);
        }
    }

    _markGeometryForReupload(geometry) {
        if (!geometry) return;
        if (geometry.index) geometry.index.needsUpdate = true;
        for (const attribute of Object.values(geometry.attributes || {})) {
            attribute.needsUpdate = true;
        }
        if (geometry.instanceMatrix) geometry.instanceMatrix.needsUpdate = true;
        if (geometry.instanceColor) geometry.instanceColor.needsUpdate = true;
    }

    _markTextureForReupload(texture) {
        if (!texture) return;
        texture.needsUpdate = true;
    }

    _reuploadGpuResidentState() {
        // three.js r160 handles the raw WebGLRenderer restore by rebuilding
        // GL state, capabilities, and shader/program caches internally. The
        // app still owns CPU-side BufferGeometry attributes and
        // Texture/CompressedTexture mip arrays produced by its loaders. Mark
        // those retained objects dirty so r160's normal WebGLGeometries and
        // WebGLTextures upload paths recreate the GPU buffers/textures on the
        // next compile/render, without refetching asset files.
        this.renderer.resetState();
        this.scene.traverse(object => {
            this._markGeometryForReupload(object.geometry);
            const materials = object.material
                ? (Array.isArray(object.material) ? object.material : [object.material])
                : [];
            for (const material of materials) {
                if (!material) continue;
                material.needsUpdate = true;
                for (const value of Object.values(material)) {
                    if (value?.isTexture) this._markTextureForReupload(value);
                }
            }
        });
        this._markTextureForReupload(this.missingPageTexture);
        for (const state of this.textureStates.values()) {
            for (const asset of state.assets.values()) {
                this._markTextureForReupload(asset.texture);
            }
        }
        this.renderer.compile(this.scene, this.camera);
        this.needsRender = true;
    }

    _setLoaderText(main, sub, detail = '') {
        const loader = document.getElementById('loader');
        const mainEl = loader?.querySelector('.main-message');
        const subEl = loader?.querySelector('.fetching-message');
        const detailEl = document.getElementById('fatal-detail');
        if (mainEl) mainEl.textContent = main;
        if (subEl) subEl.textContent = sub;
        if (detailEl) {
            detailEl.textContent = detail;
            detailEl.hidden = !detail;
        }
    }

    _showLoader() {
        const loader = document.getElementById('loader');
        if (!loader) return;
        loader.style.display = 'flex';
        loader.classList.remove('hide');
        this.loaderHidden = false;
    }

    _showLoadingState(main = 'Good code loads fast.', sub = 'Fetching high-res bestagons...') {
        this._showLoader();
        const loader = document.getElementById('loader');
        const retry = document.getElementById('fatal-retry-btn');
        loader?.classList.remove('fatal');
        if (retry) retry.hidden = true;
        this._setLoaderText(main, sub);
    }

    _showFatalState(kind, error) {
        this.fatalState = { kind, message: error?.message || String(error) };
        this._showLoader();
        const loader = document.getElementById('loader');
        const retry = document.getElementById('fatal-retry-btn');
        loader?.classList.add('fatal');
        if (retry) {
            retry.hidden = false;
            retry.onclick = () => this.retryInitWorld();
        }

        if (kind === 'unsupported-device') {
            this._setLoaderText(
                "This device can't run the viewer.",
                'The graphics hardware is missing a required capability.',
                this.fatalState.message,
            );
        } else if (kind === 'manifest') {
            this._setLoaderText(
                'Could not load the terrain manifest.',
                'Check the asset build or network path, then retry.',
                this.fatalState.message,
            );
        } else if (kind === 'context') {
            this._setLoaderText(
                'Graphics context could not be restored.',
                'Retry after the browser recovers WebGL.',
                this.fatalState.message,
            );
        } else {
            this._setLoaderText(
                'The viewer failed to initialize.',
                'Retry after fixing the reported startup problem.',
                this.fatalState.message,
            );
        }
    }

    _disposeObjectTree(root) {
        if (!root) return;
        root.parent?.remove(root);
        const disposedMaterials = new Set();
        root.traverse(object => {
            if (object.isMesh) object.geometry?.dispose();
            const materials = object.material
                ? (Array.isArray(object.material) ? object.material : [object.material])
                : [];
            for (const material of materials) {
                if (!material || disposedMaterials.has(material)) continue;
                disposedMaterials.add(material);
                this.materialsToUpdate.delete(material);
                material.dispose();
            }
        });
    }

    _disposeHorizon() {
        this._disposeObjectTree(this.horizonMesh);
        this._disposeObjectTree(this.movingHorizonMesh);
        this.horizonMesh = null;
        this.movingHorizonMesh = null;
        this.horizonIndex = null;
        this.movingHorizonIndex = null;
        this.movingHorizonLocalXZ = null;
        this.movingHorizonChildrenPerTile = 0;
    }

    _disposeTextureAssets() {
        for (const state of this.textureStates.values()) {
            for (const asset of state.assets.values()) {
                asset.texture?.dispose();
            }
            state.assets.clear();
            state.loading.clear();
            state.queued.clear();
            state.failed.clear();
            state.activeTier = null;
        }
    }

    _resetWorldForInitRetry() {
        for (const key of Array.from(this.tiles.keys())) this.unloadTile(key);
        this._disposeHorizon();
        this._disposeTextureAssets();
        for (const geometry of [this.capGeometry, this.unitSkirtGeometry, this.aggregateSkirtGeometry]) {
            geometry?.dispose();
        }

        this.manifest = null;
        this.textureContract = null;
        this.binaryContract = {};
        this.manifestGrid = null;
        this.texturePageGrid = null;
        this.texturePageResidency = null;
        this.texturePageVisibilityAdapter = null;
        this.textureStates = new Map();
        this.visibilityByKey.clear();
        this.currentVisibilityContext = null;
        this.geometryPageFootprint = null;
        this.loadingTiles.clear();
        this.failedTiles.clear();
        this.failedTextures.clear();
        this.loadQueue.length = 0;
        this.geometryRebuildQueue.length = 0;
        this.textureQueue.length = 0;
        this.textureResultQueue.length = 0;
        this.instantiateQueue.length = 0;
        this.recoverableResweeps.consumeAll();
        this.resourceRetries.reset(MANIFEST_RETRY_KEY);
        if (this.contextRecovery.timer) {
            clearTimeout(this.contextRecovery.timer);
            this.contextRecovery.timer = null;
        }
        this.contextRecovery.active = false;
        this.geometryPlanEpoch++;
        this.activeTextureJobs = 0;
        this.activeWorkerCount = 0;
        this.vramLedger = new VRAMLedger();
        this.cacheManager = new CacheManager();
        this.appStartTime = performance.now();
        this.fatalState = null;
        this.needsLODUpdate = true;
        this.needsRender = true;
    }

    retryInitWorld() {
        this.log('Retrying viewer initialization.', 'info');
        this._resetWorldForInitRetry();
        this._showLoadingState();
        this.initWorld();
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
                if (section === this.debugSectionEl && !section.classList.contains('collapsed')) {
                    this.updateRendererDebugStats();
                }
            });
        });
    }

    initLodTruthLabels() {
        const km = value => `${value / 1000}`;
        const nearBands = Array.from(this.settledLodRadii.slice(0, 3), km);
        const farBands = Array.from(this.settledLodRadii.slice(3, 5), km);
        const movingWidth = G.levelSize(this.movingLevel);
        this._setHudText('near-lod-bands', `${nearBands.join(' / ')} km`);
        this._setHudText('far-lod-bands', `${farBands.join(' / ')} km`);
        this._setHudText(
            'moving-lod-summary',
            `moving: uniform skirtless L${this.movingLevel} (${movingWidth.toFixed(0)} m)`,
        );
        this._setHudText(
            'settled-lod-summary',
            `settled: fixed ${[...nearBands, ...farBands].join(' / ')} km bands`,
        );
    }

    initLODSliders() {
        // Non-mini fog/horizon transition; unrelated to residency.
        const rdSlider = document.getElementById('haze-distance-slider');
        const rdVal = document.getElementById('haze-distance-val');
        if (rdSlider) {
            rdSlider.value = this.atmosphereSettings.hazeDistance / 1000;
            if (rdVal) rdVal.textContent = (this.atmosphereSettings.hazeDistance / 1000) + "km";
            rdSlider.addEventListener('input', () => {
                this.atmosphereSettings.hazeDistance = parseInt(rdSlider.value) * 1000;
                if (rdVal) rdVal.textContent = rdSlider.value + "km";
                this.updateFogAndClip();
                this.viewState?.commitSettingsChange();
            });
        }

        // Projected high-texture threshold. This is intentionally one global
        // quality knob rather than a device profile.
        const texSlider = document.getElementById('tex-upgrade-slider');
        const texVal = document.getElementById('tex-upgrade-val');
        if (texSlider) {
            texSlider.min = '128';
            texSlider.max = '2048';
            texSlider.step = '64';
            texSlider.value = this.highTextureEnterPx;
            if (texVal) texVal.textContent = this.highTextureEnterPx + "px";
            texSlider.addEventListener('input', () => {
                // Object.freeze protects defaults, so retain a deliberately
                // tiny per-view override for manual tuning.
                this.highTextureEnterPx = parseInt(texSlider.value, 10);
                if (texVal) texVal.textContent = this.highTextureEnterPx + "px";
                this.needsLODUpdate = true;
                this.needsRender = true;
                this.viewState?.commitSettingsChange();
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
                this.needsRender = true;
                this.viewState?.commitSettingsChange();
            });
            gradientBtn.addEventListener('click', () => {
                this.gradientMode = 1.0;
                gradientBtn.classList.add('active');
                terrainBtn.classList.remove('active');
                gradientBtn.style.background = '#74b9ff';
                gradientBtn.style.color = '#fff';
                terrainBtn.style.background = 'transparent';
                terrainBtn.style.color = '#ccc';
                this.needsRender = true;
                this.viewState?.commitSettingsChange();
            });
        }

        // LOD Pause Toggle
        const lodPauseToggle = document.getElementById('lod-pause-toggle');
        if (lodPauseToggle) {
            lodPauseToggle.addEventListener('change', (e) => {
                applyLodPauseTransition(this, e.target.checked);
                this.log(this.lodPaused ? "LOD Updates PAUSED" : "LOD Updates RESUMED", "info");
            });
        }
    }

    applyPublicSettings(settings) {
        this.atmosphereSettings.hazeDistance = settings.hazeDistanceKm * 1000;
        this.highTextureEnterPx = settings.highTextureEnterPx;
        this.gradientMode = settings.gradientMode;
        const hazeSlider = document.getElementById('haze-distance-slider');
        const hazeValue = document.getElementById('haze-distance-val');
        if (hazeSlider) hazeSlider.value = String(settings.hazeDistanceKm);
        if (hazeValue) hazeValue.textContent = `${settings.hazeDistanceKm}km`;
        const textureSlider = document.getElementById('tex-upgrade-slider');
        const textureValue = document.getElementById('tex-upgrade-val');
        if (textureSlider) textureSlider.value = String(settings.highTextureEnterPx);
        if (textureValue) textureValue.textContent = `${settings.highTextureEnterPx}px`;
        const terrainBtn = document.getElementById('gradient-terrain');
        const gradientBtn = document.getElementById('gradient-slope');
        const terrain = settings.gradientMode === 0;
        terrainBtn?.classList.toggle('active', terrain);
        gradientBtn?.classList.toggle('active', !terrain);
        if (terrainBtn && gradientBtn) {
            terrainBtn.style.background = terrain ? '#74b9ff' : 'transparent';
            terrainBtn.style.color = terrain ? '#fff' : '#ccc';
            gradientBtn.style.background = terrain ? 'transparent' : '#74b9ff';
            gradientBtn.style.color = terrain ? '#ccc' : '#fff';
        }
        this.updateFogAndClip();
        this.needsLODUpdate = true;
    }

    // --- FIXED WORLD-DISTANCE LOD BAND RADII ---
    // lodRadii[k] = FAR edge of level k's band. A level-k
    // instance draws iff selfDist > lodRadii[k-1] (outside the finer band's
    // fixed range) AND parentDist <= lodRadii[k] (the parent must refine).
    // The two conditions evaluate the SAME parent distance the parent itself
    // uses for its own self-test, so the hierarchical cut partitions the
    // plane exactly — no holes, no double-draw at ring boundaries.
    computeLodRadii() {
        // Fixed settled bands. Moving mode ignores them and forces L3 open.
        this.lodRadii.set(this.settledLodRadii);
    }

    // Per-tile per-level submission gate (runs every frame after
    // computeLodRadii). A level-k mesh only needs submitting if the tile's
    // distance band [d-margin, d+margin] overlaps level k's radius band
    // (R(k-1), R(k)]. Far tiles thus stop submitting fine levels whose
    // instances would all degenerate-cull in the shader anyway; near tiles
    // keep them. Coverage is preserved: a level is hidden only when the whole
    // tile is beyond that band, in which case a coarser level (always the
    // root at minimum) covers the footprint. This is the biggest single
    // frametime lever — it restores the old per-band residency the CDLOD
    // shader cut alone does not provide.
    updateLevelVisibility(heightFactor) {
        for (const tile of this.tiles.values()) {
            this._applyTileLevelVisibility(tile, heightFactor);
        }
    }

    /** Apply the complete moving/settled submission cut to one tile mesh.
     * Rebuilt meshes use this before scene attachment, so they can never spend
     * a frame with every Three.js group left at its default `visible=true`. */
    _applyTileLevelVisibility(t, heightFactor) {
        const camX = this.camera.position.x;
        const camY = this.camera.position.y;
        const camZ = this.camera.position.z;
        const R = this.lodRadii;
        const mesh = t.mesh;
        if (!mesh) return;
        // Any camera motion is one uniform, skirtless L3 cut. On the first
        // settled frame a GSP2+ tile remains on that exact representation
        // until its final epoch/signature-matched frontier is ready, so an
        // old medium layer can never flash between moving and final detail.
        const forceCoarse = shouldForceCoarseGeometry(
            this.isMovingView,
            t.geometryAwaitingFinal,
        );
        for (const g of mesh.children) {
            const k = g.userData.gosperLevel;
            if (k === undefined) continue;
            for (const child of g.children) {
                if (child.material?.userData) {
                    child.material.userData.forceMovingMode = forceCoarse;
                }
            }
            if (k >= 1 && g.children[1]) g.children[1].visible = !forceCoarse;
            if (forceCoarse) {
                const visible = k === this.movingLevel;
                if (g.visible !== visible) g.visible = visible;
            }
        }
        if (forceCoarse) return;

        // Match the shader's VISIBLE representative height instead of the
        // old baked Y=0 proxy. Root hMean is the tile-center representative.
        // The dynamic margin is a triangle-inequality bound from that point
        // to any instance center: 505 m conservative XZ half-extent plus
        // the tile's maximum animated relief about hMean. The old fixed
        // 650 m margin already exceeded the ~490 m island extent, so tile-
        // center XZ gating was not the marked hole's cause; this extension
        // keeps the gate conservative after adding real cap heights.
        const centerY = ((t.stats?.avg ?? this.floorState.value) - this.floorState.value) * heightFactor;
        const relief = t.stats ? Math.max(
            Math.abs(t.stats.avg - t.stats.min),
            Math.abs(t.stats.max - t.stats.avg),
        ) * heightFactor : 0;
        const rootRadius = this.visibilityAdapter?.horizontalRadiusByLevel?.[TILE_LEVEL] || 551;
        const margin = Math.max(this.lodTileMargin, Math.hypot(rootRadius, relief) + 16);
        const dx = t.lx - camX;
        const dy = centerY - camY;
        const dz = t.lz - camZ;
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const near = d - margin;
        const far = d + margin;
        // Finest built level ignores its near edge so the closest tile is
        // always covered down to the camera (matches uFinestBuilt).
        const finest = t.finestBuilt ?? 0;
        for (const g of mesh.children) {
            const k = g.userData.gosperLevel;
            if (k === undefined) continue;
            let visible;
            if (k >= TILE_LEVEL) {
                visible = true; // root: 1 instance, always the coverage floor
            } else {
                const nearEdge = (k <= finest) ? 0 : (k <= 0 ? 0 : R[k - 1]);
                const farEdge = R[k];
                visible = (near < farEdge) && (far > nearEdge);
            }
            if (g.visible !== visible) g.visible = visible;
        }
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

        const makeSkirtGeometry = (sideCount) => {
            const vertices = [];
            const indices = [];
            const sideIDs = [];
            let vIdx = 0;
            for (let i = 0; i < sideCount; i++) {
                const th1 = i * Math.PI / 3;
                const th2 = (i + 1) * Math.PI / 3;

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

                // Unit skirts use directional side IDs 0..2. Aggregate
                // attributes are symmetric on all six sides, so cycling the
                // same IDs keeps the compact vec3 shader interface.
                for (let k = 0; k < 4; k++) sideIDs.push(i % 3);

                vIdx += 4;
            }

            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            geometry.setAttribute('aSideId', new THREE.Float32BufferAttribute(sideIDs, 1));
            geometry.setIndex(indices);
            geometry.computeVertexNormals();
            return geometry;
        };

        return {
            capGeo,
            unitSkirtGeo: makeSkirtGeometry(3),
            aggregateSkirtGeo: makeSkirtGeometry(6),
        };
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderPixelRatio = applyRenderResolution(this.renderer, {
            width: window.innerWidth,
            height: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio,
        });
        this.needsLODUpdate = true;
        this.needsRender = true;
        this.frameScheduler?.wake('resize');
    }

    updateFogAndClip() {
        const dist = this.atmosphereSettings.hazeDistance;
        const fogEnd = dist;
        const fogStart = dist * 0.6;
        if (this.isMiniBake) {
            // Mini-bakes cover a compact debugging area, so a kilometre-scale
            // fog wall only hides the geometry/LOD boundaries under inspection.
            this.scene.fog = null;
        } else {
            if (!this.scene.fog) this.scene.fog = new THREE.Fog(0x0a0a0a, fogStart, fogEnd); // Match Bg
            this.scene.fog.near = fogStart;
            this.scene.fog.far = fogEnd;
        }
        // Streamed tiles fade into the visual haze distance; the horizon mesh is
        // fog-exempt (manual haze) and needs the far plane out past Tirol.
        this.camera.far = Math.max(dist + 2000, HORIZON_DISTANCE + 5000);
        this.camera.updateProjectionMatrix();
        // Keep the horizon haze band tied to the fog wall so the transition
        // from textured tiles to silhouettes reads as one atmosphere.
        if (this.horizonMesh?.material?.userData?.shader) {
            this.horizonMesh.material.userData.shader.uniforms.uHazeRange.value.set(dist * 0.8, HORIZON_DISTANCE);
        }
        this.needsRender = true;
    }

    _logRetry(kind, key, event) {
        const seconds = (event.delayMs / 1000).toFixed(1);
        this.log(`${kind} retry ${event.attempt}/${event.maxAttempts} in ${seconds}s: ${key}`, 'error');
        console.warn(`[${kind.toUpperCase()}_RETRY] ${key}: ${event.error.message}`);
    }

    _validateManifestContract(manifest) {
        if (manifest.type !== 'gosper_l5') {
            throw new Error(`Manifest type '${manifest.type}' is not gosper_l5 — re-run the baker`);
        }
        const textureContract = manifest.texture_pages;
        const supportedTextureCodecs = new Set([
            'xuastc-ldr-4x4',
            'xuastc-ldr-6x6',
            'xuastc-ldr-8x6',
        ]);
        if (!textureContract || textureContract.container !== 'ktx2' ||
            !supportedTextureCodecs.has(textureContract.codec)) {
            throw new Error('Manifest needs the global XUASTC KTX2 texture-page contract');
        }
        const profileTiers = textureContract.encoding_profile?.tiers || {};
        if (textureContract.encoding_profile) {
            for (const tierName of ['low', 'medium', 'high']) {
                if (profileTiers[tierName]?.codec !== textureContract.codec) {
                    throw new Error(`Manifest texture encoding profile is missing ${tierName} settings`);
                }
            }
        } else if (textureContract.codec !== 'xuastc-ldr-6x6') {
            throw new Error('Only the migration-era 6x6 manifest may omit encoding-profile settings');
        } else {
            console.warn('[HEXAGONS] Legacy 6x6 texture manifest; rebake to record an encoding profile.');
        }
        const expectedTextureSizes = { low: 128, medium: 256, high: 4096 };
        const manifestTierSizes = Object.fromEntries(
            (textureContract.tiers || []).map(tier => [tier.name, tier.size_px]));
        for (const [name, size] of Object.entries(expectedTextureSizes)) {
            if (manifestTierSizes[name] !== size) {
                throw new Error(`Manifest texture tier ${name} must be ${size}px`);
            }
        }
    }

    async _loadManifestWithRetry() {
        return this.resourceRetries.run(MANIFEST_RETRY_KEY, async () => {
            // This small file is the cache-identity authority for every large
            // asset, so rebakes must revalidate it even when app code did not
            // change. Binaries and textures remain explicitly recipe-keyed.
            const res = await fetch(
                appendCacheKey('tile_manifest.json', APP_VERSION),
                { cache: 'no-store' },
            );
            if (!res.ok) throw new Error(`Manifest HTTP ${res.status}`);
            const manifest = await res.json();
            this._validateManifestContract(manifest);
            return manifest;
        }, {
            onRetry: event => this._logRetry('manifest', 'tile_manifest.json', event),
            onExhausted: () => { this.failureStats.manifestFailures++; },
        });
    }

    async initWorld() {
        try {
            this.manifest = await this._loadManifestWithRetry();
            this.releaseMode = resolveReleaseMode(this.manifest.release, window.location.search);
            this.profiler = createProfilerForReleaseMode(this, this.releaseMode, PerfProfiler);
            this.profiler?.setMeta({
                releaseProfile: this.releaseMode.profile,
                releaseMode: this.releaseMode.mode,
            });
            const textureContract = this.manifest.texture_pages;
            this.profiler?.milestone('manifestLoaded');
            this.textureContract = textureContract;
            this.binaryContract = this.manifest.binary || {};
            const supportedBinaryVersions = new Set(this.binaryContract.supported_versions || [1, 2]);
            // This is release configuration, not a geographic heuristic.
            this.isMiniBake = this.releaseMode.profile === 'beta-stubai';
            const hazeControl = document.getElementById('haze-distance-control');
            if (hazeControl) hazeControl.hidden = this.isMiniBake;
            this.updateFogAndClip();
            const { min_x, min_y } = this.manifest.bounds;
            this.worldOrigin = { x: min_x, y: min_y };

            this.texturePageGrid = new TexturePageGrid(
                textureContract,
                { expectedCrs: 'EPSG:31254' },
            );
            if (this.texturePageGrid.crs !== 'EPSG:31254' || this.texturePageGrid.pageSize !== 1024) {
                throw new Error('Texture pages must use the EPSG:31254 global 1024m grid');
            }
            if (this.renderer.capabilities.maxTextures < MAX_TEXTURE_PAGE_BINDINGS) {
                throw new UnsupportedDeviceError(
                    `Global texture pages need ${MAX_TEXTURE_PAGE_BINDINGS} fragment samplers; device exposes ${this.renderer.capabilities.maxTextures}`,
                );
            }
            this.texturePageResidency = new TexturePageResidency({
                pages: this.texturePageGrid.pages,
                mini: this.isMiniBake,
                mediumEnterPx: TEXTURE_CONFIG.mediumEnterPx,
                mediumExitPx: TEXTURE_CONFIG.mediumExitPx,
                highEnterPx: TEXTURE_CONFIG.highEnterPx,
            });
            this.textureStates = this.texturePageResidency.states;
            this.texturePageVisibilityAdapter = new TexturePageVisibilityAdapter({
                pages: this.texturePageGrid.pages,
                worldOrigin: this.worldOrigin,
            });
            this.geometryPageFootprint = sourceFootprintFromGeometryContract(
                this.manifest.geometry,
                computeGosperSourceFootprint(G, { capOverscan: GOSPER_CAP_OVERSCAN }),
            );

            // Canonical lattice-key lookup. Frustum hierarchy traversal owns
            // visibility; the obsolete radial spatial buckets are gone.
            this.manifestGrid = new Map();   // "yq_yr" -> manifest tile
            for (const t of this.manifest.tiles) {
                t.gspVersion = Number(t.gspVersion ?? this.binaryContract.default_version ?? 1);
                if (!supportedBinaryVersions.has(t.gspVersion)) {
                    throw new Error(`Manifest tile ${t.yq}_${t.yr} uses unsupported GSP${t.gspVersion}`);
                }
                t.lx = t.x - this.worldOrigin.x;
                t.lz = -(t.y - this.worldOrigin.y);
                const tileKey = `${t.yq}_${t.yr}`;
                this.manifestGrid.set(tileKey, t);
                const bindings = this.texturePageGrid.pagesForBounds(
                    gosperIslandSourceBounds(t.x, t.y, this.geometryPageFootprint),
                    { includeMissing: true, maxPages: MAX_TEXTURE_PAGE_BINDINGS },
                );
                t.texturePageKeys = bindings.map(page => page.key);
                this.texturePageResidency.attachConsumer(
                    tileKey,
                    bindings.filter(page => page.available).map(page => page.key),
                );
            }

            // Translation boundary: the generic planner receives only opaque
            // handles and AABBs. Every Gosper-specific address, bound, and
            // descendant rule lives behind this adapter.
            this.visibilityAdapter = new GosperVisibilityAdapter({
                manifest: this.manifest,
                worldOrigin: this.worldOrigin,
            });

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
            this.bootstrapVisibilityFloor(this.controls.target);
            this.notifyCameraMotion(performance.now());
            this.controls.update();
            this.syncHeightFactorFromControls();
            await this.viewState.restoreFromUrl();
            // restoreFromUrl may yield for projection initialization. Keep
            // visibility gated until its final target has a local manifest
            // floor and the matching pitch morph is available synchronously.
            this.bootstrapVisibilityFloor(this.controls.target);
            this.syncHeightFactorFromControls();
            this.visibilityBootstrapReady = true;
            this.lastVisibilityCameraPosition = this.camera.position.clone();

            // PRE-ALLOCATE GEOMETRIES
            const side = UNIT_HEX_WIDTH_METERS / Math.sqrt(3);
            const geos = this.createHexGeometry(side);
            this.capGeometry = geos.capGeo;
            this.unitSkirtGeometry = geos.unitSkirtGeo;
            this.aggregateSkirtGeometry = geos.aggregateSkirtGeo;

            this.essentialTilesTarget = 1;

            this.buildHorizon();
            this.updateLOD();
        } catch (e) {
            console.error("Init error: " + e.message);
            this.log("Init error: " + e.message, "error");
            const manifestRetry = this.resourceRetries.snapshot(MANIFEST_RETRY_KEY);
            if (e instanceof UnsupportedDeviceError) {
                this._showFatalState('unsupported-device', e);
            } else if (manifestRetry.exhausted || !this.manifest) {
                this._showFatalState('manifest', e);
            } else {
                this._showFatalState('init', e);
            }
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

    bootstrapVisibilityFloor(scenePoint = this.controls?.target) {
        // Provisional manifest data breaks the no-tile/no-floor deadlock only.
        // Once real geometry contributes a view floor (or locks it), this path
        // can never overwrite the live floor state.
        if (!this.manifest?.tiles || this.floorState.locked || this.tiles.size > 0) return false;
        const baseline = selectManifestFloorBaseline(this.manifest.tiles, scenePoint);
        if (!Number.isFinite(baseline)) return false;
        this.floorState.value = baseline;
        this.floorState.provisional = true;
        return true;
    }

    syncHeightFactorFromControls(angle = this.controls.getPolarAngle() * 180 / Math.PI) {
        this.heightFactor = Math.min(1, Math.max(0, (angle - 5.5) / (25.0 - 5.5)));
        return this.heightFactor;
    }

    // ------------------------------------------------------------------
    // HORIZON MESHES — settled mode renders every baked island's level-5
    // aggregate as one manifest-only InstancedMesh.  Moving mode swaps that
    // mesh for a uniform level-3 subdivision (49 caps per island), so a
    // nonresident/loading island can never leak an 830 m L5 cap into the
    // resident 118 m L3 moving cut.  The manifest only knows the island root
    // hMean/normal, so every fallback child repeats those values; this adds no
    // fictional elevation detail. Resident tiles zero-scale their fallback
    // instances because their decoded L3 data is authoritative.
    // ------------------------------------------------------------------
    buildHorizon() {
        const tiles = this.manifest.tiles;
        if (!tiles.length) return;
        const geo = createGeometryWithSharedStaticBuffers(THREE, this.capGeometry);

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
            shader.uniforms.uHazeRange = { value: new THREE.Vector2(DEFAULT_HAZE_DISTANCE * 0.8, HORIZON_DISTANCE) };
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
        mesh.userData.gosperLevel = TILE_LEVEL;
        mesh.userData.isSettledHorizon = true;
        this.horizonMesh = mesh;
        this.materialsToUpdate.add(material);
        material.userData.isHorizon = true;
        this.scene.add(mesh);

        // One island contains 7^(5-3) = 49 L3 nodes. Their centers are the
        // first unit of each depth-2 heap subtree (stride 7^3), exactly as in
        // tile_worker.js. Heights/normals remain the manifest root aggregate.
        const movingLevel = this.movingLevel;
        const childrenPerTile = Math.pow(7, TILE_LEVEL - movingLevel);
        const childStride = Math.pow(7, movingLevel);
        const offsets = G.offsets(TILE_LEVEL);
        const localXZ = [];
        for (let child = 0; child < childrenPerTile; child++) {
            const unit = child * childStride;
            const q = offsets[unit * 2], r = offsets[unit * 2 + 1];
            const [x, y] = G.axialToWorld(q, r);
            localXZ.push({ x, z: -y });
        }
        this.movingHorizonLocalXZ = localXZ;
        this.movingHorizonChildrenPerTile = childrenPerTile;
        this.movingHorizonIndex = new Map();

        const movingCount = count * childrenPerTile;
        const movingGeo = createGeometryWithSharedStaticBuffers(THREE, this.capGeometry);
        const movingHeights = new Float32Array(movingCount);
        const movingShades = new Float32Array(movingCount);
        const movingMesh = new THREE.InstancedMesh(movingGeo, material, movingCount);
        let movingInstance = 0;
        tiles.forEach((t) => {
            this.movingHorizonIndex.set(`${t.yq}_${t.yr}`, movingInstance);
            for (let child = 0; child < childrenPerTile; child++, movingInstance++) {
                this._writeMovingHorizonMatrix(movingMesh, movingInstance, t, child, false);
                movingHeights[movingInstance] = t.hMean;
                movingShades[movingInstance] = shades[this.horizonIndex.get(`${t.yq}_${t.yr}`)];
            }
        });
        movingGeo.setAttribute('instanceH', new THREE.InstancedBufferAttribute(movingHeights, 1));
        movingGeo.setAttribute('instanceShade', new THREE.InstancedBufferAttribute(movingShades, 1));
        movingMesh.frustumCulled = false;
        movingMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        movingMesh.instanceMatrix.needsUpdate = true;
        movingMesh.visible = false;
        movingMesh.userData.gosperLevel = movingLevel;
        movingMesh.userData.isMovingHorizon = true;
        this.movingHorizonMesh = movingMesh;
        this.scene.add(movingMesh);
    }

    _writeMovingHorizonMatrix(mesh, instance, tile, child, hidden) {
        const m = this._horizonMat4;
        if (hidden) {
            m.makeScale(0, 0, 0);
        } else {
            const xz = G.levelXZ(this.movingLevel);
            const local = this.movingHorizonLocalXZ[child];
            m.set(
                xz.a, 0, xz.b, tile.lx + local.x,
                0, 1, 0, 0,
                xz.c, 0, xz.d, tile.lz + local.z,
                0, 0, 0, 1
            );
        }
        mesh.setMatrixAt(instance, m);
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

        if (this.movingHorizonMesh && this.movingHorizonIndex?.has(key)) {
            const base = this.movingHorizonIndex.get(key);
            for (let child = 0; child < this.movingHorizonChildrenPerTile; child++) {
                this._writeMovingHorizonMatrix(
                    this.movingHorizonMesh, base + child, t, child, hidden);
            }
            this.movingHorizonMesh.instanceMatrix.needsUpdate = true;
        }
    }

    createMissingPageTexture() {
        // Geometry must remain visible when a page is absent or fails to
        // transcode. Bright magenta is deliberately impossible to mistake for
        // aerial imagery; this one shared sentinel is never page-cache owned.
        const pixels = new Uint8Array([255, 0, 255, 255]);
        const texture = new THREE.DataTexture(pixels, 1, 1, THREE.RGBAFormat);
        texture.minFilter = THREE.NearestFilter;
        texture.magFilter = THREE.NearestFilter;
        texture.generateMipmaps = false;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;
        texture.userData.isMissingTexturePage = true;
        return texture;
    }

    createTileMaterial(lodIdx) {
        // Keeping USE_MAP compiled from the first frame lets page arrivals
        // update sampler uniforms without recompiling every tile shader.
        const material = new THREE.MeshBasicMaterial({
            map: this.missingPageTexture,
            side: THREE.DoubleSide,
        });
        if (!material.userData) material.userData = {};
        material.userData.isClone = true; // Mark as a clone for cleanup
        material.userData.lodIdx = lodIdx; // Store LOD index for shader logic if needed
        this.setupMaterialShader(material);
        return material;
    }

    createMeshFromWorkerData(lodData, material, includeSkirts = true) {
        if (!lodData || lodData.matrix.length === 0) return null;

        const num = lodData.matrix.length / 16;

        // Per-mesh geometry containers carry instanced attributes, while the
        // immutable cap/skirt BufferAttributes stay shared. Scale + rotation
        // remain baked in worker matrices (sqrt(7)^k / k*19.1066deg).
        const capG = createGeometryWithSharedStaticBuffers(THREE, this.capGeometry);
        const skirtSource = lodData.level >= 1 ? this.aggregateSkirtGeometry : this.unitSkirtGeometry;
        const skirtG = includeSkirts ? createGeometryWithSharedStaticBuffers(THREE, skirtSource) : null;

        const capMesh = new THREE.InstancedMesh(capG, material, num);
        const skirtMesh = skirtG ? new THREE.InstancedMesh(skirtG, material, num) : null;

        // CRITICAL: three culls per-OBJECT against the unit cap geometry's
        // ~3.7 m bounding sphere at the tile origin — the group-level flag
        // does not propagate, so any tile whose origin leaves the frustum
        // would vanish wholesale. Instance visibility is the shader's job.
        capMesh.frustumCulled = false;
        if (skirtMesh) skirtMesh.frustumCulled = false;

        const meshes = [capMesh];
        if (skirtMesh) meshes.push(skirtMesh);
        bindSharedLodInstanceAttributes(meshes, createSharedLodInstanceAttributes(THREE, lodData));

        const group = new THREE.Group();
        group.add(capMesh);
        if (skirtMesh) group.add(skirtMesh);

        group.userData.activeSkirts = skirtMesh ? lodData.activeSkirts : 0;
        group.frustumCulled = false;
        return group;
    }

    // Bench-readable count of static BufferAttribute identities currently
    // submitted by the scene. Three caches GPU buffers by this identity, so
    // `avoidedStaticAttributeUploads` is the duplicate static upload work
    // removed compared with geometry.clone() per mesh.
    getStaticBufferInstrumentation() {
        const meshes = [];
        this.scene.traverse((object) => {
            if (object.isInstancedMesh) meshes.push(object);
        });
        return staticBufferSharingStats(meshes);
    }

    setupMaterialShader(material) {
        // Force Three.js to treat this as a distinct program variant so we don't accidentally
        // reuse a cached MeshBasicMaterial program that didn't get our onBeforeCompile edits.
        // If you change shader code, bump this string.
        material.customProgramCacheKey = () => 'piston_hex_global_pages_v4';

        const pageSize = this.texturePageGrid.pageSize;
        const sourceOrigin = this.worldOrigin;
        const missingPageTexture = this.missingPageTexture;
        const vertexMapUvPatch = `
                #ifdef USE_MAP
                    // The fragment shader computes absolute source-grid UVs.
                    // A stable placeholder keeps Three's USE_MAP variant live.
                    vMapUv = vec2(0.5);
                #endif
                #include <project_vertex>
            `;
        const pageShaderSwitch = buildTexturePageShaderSwitch(MAX_TEXTURE_PAGE_BINDINGS);
        const pageFragmentDeclarations = pageShaderSwitch.declarations;
        const pageSamplingBranches = pageShaderSwitch.samplingBranches;
        const fragmentMapPatch = `
                #ifdef USE_MAP
                    // Scene coordinates are rebased for float precision. Undo
                    // that rebase into absolute EPSG metres, then select one of
                    // up to nine explicitly bound pages. Half-open tests make exact
                    // east/north boundaries select only their next page.
                    vec2 sourceXY = vec2(
                        vWorldPos.x + uSourceOrigin.x,
                        uSourceOrigin.y - vWorldPos.z
                    );
                    vec4 texColor = vec4(1.0, 0.0, 1.0, 1.0);
                    bool sampledPage = false;
                    ${pageSamplingBranches}
                    if (!sampledPage) texColor = vec4(1.0, 0.0, 1.0, 1.0);

                    float ao = 1.0 - (vSkirtY * 0.4);
                    float jitter = 1.0;
                    if (vIsTop < 0.5) jitter = 0.92 + (vSideId * 0.04);
                    float lighting = ao * jitter;
                    vec3 baseColor = texColor.rgb;
                    if (vIsTop < 0.5) {
                         if (uGradientMode > 0.5 && vSlope >= 30.0) {
                             baseColor = gradientColor(vSlope);
                         } else {
                             baseColor *= mix(0.6, 0.95, clamp(vInstDist / 3000.0, 0.0, 1.0));
                         }
                    }
                    vec3 finalColor = baseColor * lighting;
                    if (vIsTop > 0.5 && !gl_FrontFacing) {
                        // Radioactive green is a deliberate invariant alarm:
                        // it can only appear when the camera sees a cap from
                        // below. Keep it distinct from magenta missing pages.
                        finalColor = vec3(0.0, 1.0, 0.0);
                    }
                    diffuseColor = vec4(finalColor, 1.0);
                #endif
            `;

        material.onBeforeCompile = function (shader) {
            this.userData.shader = shader;
            shader.uniforms.uHeightFactor = { value: 0.0 };
            shader.uniforms.uGradientMode = { value: 1.0 };
            shader.uniforms.uFloorOffset = { value: 0.0 }; // Initial fallback
            shader.uniforms.uCameraPos = { value: new THREE.Vector3() };
            shader.uniforms.uLodRadii = { value: new THREE.Vector2(0.0, 1e9) }; // (bandMin for self, bandMax for parent)
            shader.uniforms.uFinestBuilt = { value: 0.0 }; // 1 = finest level built so far: ignore bandMin
            const bindings = this.userData.texturePageBindings || [];
            shader.uniforms.uPageSize = { value: pageSize };
            shader.uniforms.uSourceOrigin = {
                value: new THREE.Vector2(sourceOrigin.x, sourceOrigin.y),
            };
            for (let slot = 0; slot < MAX_TEXTURE_PAGE_BINDINGS; slot++) {
                const binding = bindings[slot] || {};
                if (slot > 0) {
                    shader.uniforms[`uPageMap${slot}`] = {
                        value: binding.texture || missingPageTexture,
                    };
                }
                shader.uniforms[`uPageOrigin${slot}`] = {
                    value: new THREE.Vector2(
                        binding.page?.minX || 0,
                        binding.page?.minY || 0,
                    ),
                };
                shader.uniforms[`uPageValid${slot}`] = {
                    value: binding.valid ? 1 : 0,
                };
            }

            shader.vertexShader = shader.vertexShader.replace('#include <common>', `
                #include <common>
                uniform float uHeightFactor;
                uniform float uGradientMode; // Added for vertex shader access
                uniform float uFloorOffset;
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
                attribute float aParentHeight; // parent representative source elevation (m)

                attribute float aSideId;

                varying vec3 vLocalPos;
                varying vec3 vWorldPos;
                varying float vSlope;
                varying float vIsTop;
                varying float vSkirtY;
                varying float vSideId;
                varying float vInstDist;
                varying vec3 vMyNormal;
            `).replace('#include <begin_vertex>', `
                #include <begin_vertex>

                float myH = instanceNZ_2.z - uFloorOffset;
                float animH = myH * uHeightFactor;

                // HIERARCHICAL CDLOD CUT (per-instance, evaluated on centers)
                // Draw this level-k node iff:
                //   selfDist  >  uLodRadii.x  (R(k-1): outside the finer fixed-distance band)
                //   parentDist <= uLodRadii.y (R(k): the parent must refine here)
                // The parent evaluates the identical distance value for its own
                // self-test, so parent/child regions partition exactly — no
                // holes and no double-draw at ring boundaries. uFinestBuilt
                // relaxes the self test while finer levels aren't built yet.
                #ifdef USE_INSTANCING
                    vec3 instancePos = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
                    // Instance matrices intentionally keep Y=0 because cap
                    // elevation is animated in the shader. LOD must measure to
                    // that visible representative height, not absolute Y=0;
                    // the latter makes a high camera choose coarse hexes even
                    // directly above nearby elevated terrain.
                    vec3 worldInstancePos = (modelMatrix * vec4(instancePos.x, animH, instancePos.z, 1.0)).xyz;
                    float instDist = distance(worldInstancePos, uCameraPos);
                    float parentAnimH = (aParentHeight - uFloorOffset) * uHeightFactor;
                    vec3 worldParentPos = (modelMatrix * vec4(aParentPos.x, parentAnimH, aParentPos.y, 1.0)).xyz;
                    float parentDist = distance(worldParentPos, uCameraPos);

                    bool selfCoarseEnough = (instDist > uLodRadii.x) || (uFinestBuilt > 0.5);
                    bool parentRefines = (parentDist <= uLodRadii.y);
                    if (!(selfCoarseEnough && parentRefines)) {
                        gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
                        return;
                    }
                    vInstDist = instDist;
                #else
                    vInstDist = 0.0;
                #endif

                bool isCap = (normal.y > 0.9);
                vIsTop = isCap ? 1.0 : 0.0;

                if (isCap) {
                    // CAP — always pure aerial texture. Slope-class colors
                    // live on SKIRTS only (owner directive: tops are never
                    // colored).
                    transformed.y = 0.0 + animH;
                    vSlope = 0.0;
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

                         // Distance-scaled extra drop: at LOD ring contours a
                         // neighbor may render at its subtree MEAN height,
                         // below the DEM height this skirt was baked against.
                         // Up to 12 m of slack beyond 1.2 km seals those
                         // steps; near skirts stay exactly DEM-deep.
                         dVal += clamp((vInstDist - 1200.0) / 3000.0, 0.0, 1.0) * 12.0;

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
            `).replace('#include <project_vertex>', vertexMapUvPatch);

            shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `
                #include <common>
                uniform float uGradientMode;
                uniform vec3 uCameraPos;
                uniform vec2 uLodRadii;
                ${pageFragmentDeclarations}
                varying vec3 vLocalPos;
                varying vec3 vWorldPos;
                varying float vSlope;
                varying float vIsTop;
                varying float vSkirtY;
                varying float vSideId;
                varying float vInstDist;

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
            `).replace('#include <map_fragment>', fragmentMapPatch);
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

    formatHudNumber(value) {
        return Number.isFinite(value) ? Math.round(value).toLocaleString() : '--';
    }

    updateRendererDebugStats() {
        if (!this.debugSectionEl || this.debugSectionEl.classList.contains('collapsed')) return;

        const renderInfo = this.renderer?.info?.render || {};
        const memoryInfo = this.renderer?.info?.memory || {};
        if (this.triCountEl) {
            this.triCountEl.textContent = this.formatHudNumber(renderInfo.triangles);
        }
        if (this.drawStatsEl) {
            this.drawStatsEl.textContent = `Calls: ${this.formatHudNumber(renderInfo.calls)} | ` +
                `G:${this.formatHudNumber(memoryInfo.geometries)} | T:${this.formatHudNumber(memoryInfo.textures)}`;
        }
    }

    updateRenderStats(now) {
        if (now - this.statsUpdateState.lastUpdate < 500) return;
        this.statsUpdateState.lastUpdate = now;
        this.updateRendererDebugStats();

        let capCount = 0;
        let skirtCount = 0;

        for (const t of this.tiles.values()) {
            if (t.mesh && t.mesh.isGroup) {
                // Caps are always first child, skirts second
                // Iterate through all children, as each LOD is a group of cap/skirt
                t.mesh.children.forEach(lodGroup => {
                    if (lodGroup.isGroup && lodGroup.visible) {
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

    updateFps(now, willRender) {
        if (!this.fpsEl) return;
        const dist = this.camera.position.distanceTo(this.controls.target);

        if (!willRender && this.engineState === ENGINE_STATES.STATIC) {
            this.fpsEl.textContent = `FPS: IDLE | Zoom: ${dist.toFixed(0)}`;
            this.fpsState.frames = 0;
            this.fpsState.activeElapsed = 0;
            this.fpsState.lastActiveFrame = null;
            return;
        }

        if (!willRender) return;

        if (this.fpsState.lastActiveFrame !== null) {
            this.fpsState.activeElapsed += Math.max(0, now - this.fpsState.lastActiveFrame);
        }
        this.fpsState.lastActiveFrame = now;
        this.fpsState.frames += 1;
        if (this.fpsState.activeElapsed < 500 || this.fpsState.frames < 2) return;

        const fps = ((this.fpsState.frames - 1) * 1000) / this.fpsState.activeElapsed;
        this.fpsEl.textContent = `FPS: ${fps.toFixed(0)} | Zoom: ${dist.toFixed(0)}`;
        this.fpsState.frames = 1;
        this.fpsState.activeElapsed = 0;
        this.fpsState.lastActiveFrame = now;
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

    _textureResourceKey(resourceOrKey) {
        if (typeof resourceOrKey === 'string') return resourceOrKey;
        return resourceOrKey?.key;
    }

    _textureState(resourceOrKey) {
        const key = this._textureResourceKey(resourceOrKey);
        const state = this.texturePageResidency?.state(key);
        if (!state) throw new Error(`Unknown texture page ${key}`);
        return state;
    }

    _textureUrls(tier, key) {
        const contractTier = tier === TEXTURE_TIER.LOW
            ? 'low'
            : (tier === TEXTURE_TIER.MEDIUM ? 'medium' : 'high');
        const url = this.texturePageGrid.urlFor(key, contractTier);
        if (!url) throw new Error(`Texture page ${key} has no ${contractTier} asset`);
        return [appendCacheKey(url, this.textureContract.cache_key)];
    }

    _textureFailureKey(key, tier) {
        return `${key}|${tier}`;
    }

    _markTileFailed(tileKey, error) {
        if (!this.failedTiles.has(tileKey)) this.failureStats.tileFailures++;
        this.failedTiles.add(tileKey);
        this.recoverableResweeps.schedule(RECOVERABLE_SWEEP_TILES);
        this.log(`Terrain tile failed: ${tileKey} (${error.message})`, 'error');
    }

    _markTextureFailed(key, tier, error) {
        const failureKey = this._textureFailureKey(key, tier);
        if (!this.failedTextures.has(failureKey)) this.failureStats.textureFailures++;
        this.failedTextures.add(failureKey);
        this.recoverableResweeps.schedule(RECOVERABLE_SWEEP_TEXTURES);
        this.log(`Texture page failed: ${key}/${tier} (${error.message})`, 'error');
    }

    _runRecoverableResweep() {
        const kinds = this.recoverableResweeps.consumeAll();
        if (kinds.length === 0) return;

        let tileCount = 0;
        let textureCount = 0;
        if (kinds.includes(RECOVERABLE_SWEEP_TILES)) {
            for (const key of this.failedTiles) {
                this.resourceRetries.reset(`tile:${key}`);
                tileCount++;
            }
            this.failedTiles.clear();
        }
        if (kinds.includes(RECOVERABLE_SWEEP_TEXTURES)) {
            for (const failureKey of this.failedTextures) {
                const [key, tier] = failureKey.split('|');
                const state = this.textureStates.get(key);
                if (state) state.failed.delete(tier);
                this.resourceRetries.reset(`texture:${failureKey}`);
                textureCount++;
            }
            this.failedTextures.clear();
        }

        this.failureStats.recoverableSweepsRun++;
        this.needsLODUpdate = true;
        this.needsRender = true;
        this.log(`Retrying failed resources after camera settled (${tileCount} tiles, ${textureCount} textures).`, 'info');
    }

    _desiredTextureTier(state, projectedDiameterPx, classification) {
        if (classification === 'outside') return TEXTURE_TIER.LOW;

        const previous = state.desiredTier || TEXTURE_TIER.LOW;
        const highEnter = this.highTextureEnterPx || TEXTURE_CONFIG.highEnterPx;
        const highExit = highEnter * 0.75;

        // High is useful only for pixels that can actually reach the viewport.
        // Guard-only nodes still receive/preserve medium imagery for seamless
        // entry, but cannot start an expensive high upgrade.
        if (classification === 'visible') {
            if (previous === TEXTURE_TIER.HIGH && projectedDiameterPx >= highExit) {
                return TEXTURE_TIER.HIGH;
            }
            if (projectedDiameterPx >= highEnter) return TEXTURE_TIER.HIGH;
        }

        if (previous !== TEXTURE_TIER.LOW && projectedDiameterPx >= TEXTURE_CONFIG.mediumExitPx) {
            return TEXTURE_TIER.MEDIUM;
        }
        if (projectedDiameterPx >= TEXTURE_CONFIG.mediumEnterPx) return TEXTURE_TIER.MEDIUM;
        return TEXTURE_TIER.LOW;
    }

    _queueTextureTier(textureResource, tier, priority = 0) {
        if (!textureResource) return;
        const state = this._textureState(textureResource);
        if (state.assets.has(tier) || state.loading.has(tier)) return;
        if (state.queued.has(tier)) {
            // Mini mode seeds every medium at background priority. Promote
            // that existing task when its tile later enters the frustum.
            const queued = this.textureQueue.find(
                task => task.key === state.key && task.tier === tier,
            );
            if (queued) queued.priority = Math.max(queued.priority, priority);
            return;
        }
        // A failed required asset may become available after a new bake/server
        // restart. Do not spin on the same missing URL in this page session.
        if (state.failed.has(tier)) return;
        state.queued.add(tier);
        this.textureQueue.push({
            key: state.key,
            textureResource,
            tier,
            priority,
            urls: this._textureUrls(tier, state.key),
        });
    }

    _scheduleTextureQuality(
        textureResource,
        classification,
        projectedDiameterPx,
        priority = 0,
        demandPreplanned = false,
    ) {
        const state = this._textureState(textureResource);
        if (!demandPreplanned) {
            state.classification = classification;
            state.projectedDiameterPx = projectedDiameterPx;
            state.perceptibility = Number.isFinite(priority) ? priority : 0;
            state.desiredTier = this._desiredTextureTier(state, projectedDiameterPx, classification);
        }
        this.cacheManager.updatePriority(state.key, state.perceptibility);

        // The postage tier is the non-grey coverage invariant. Once decoded it
        // remains resident; no high/geometry decision is allowed to evict it.
        this._queueTextureTier(textureResource, TEXTURE_TIER.LOW, priority + 1000);

        if (TEXTURE_RANK[state.desiredTier] >= TEXTURE_RANK[TEXTURE_TIER.MEDIUM]) {
            this._queueTextureTier(textureResource, TEXTURE_TIER.MEDIUM, priority + 500);
        }
        if (state.desiredTier === TEXTURE_TIER.HIGH && !this.isMovingView) {
            this._queueTextureTier(textureResource, TEXTURE_TIER.HIGH, priority);
        }

        this._reconcileTextureState(state);
    }

    _bestTextureAsset(state, desiredTier = state.desiredTier, excludedTier = null) {
        return this.texturePageResidency.bestAsset(state, desiredTier, excludedTier);
    }

    _texturePageSlots(pageKeys) {
        if ((pageKeys || []).length > MAX_TEXTURE_PAGE_BINDINGS) {
            throw new RangeError(
                `geometry intersects ${pageKeys.length} pages; maximum is ${MAX_TEXTURE_PAGE_BINDINGS}`,
            );
        }
        return (pageKeys || []).map(key => {
            const available = this.texturePageGrid.pageByKey.get(key);
            if (available) return available;
            const [pageX, pageY] = String(key).split('_').map(Number);
            return this.texturePageGrid.cell(pageX, pageY);
        });
    }

    _textureLedgerLocation(textureResource) {
        const centerX = (textureResource.minX + textureResource.maxX) * 0.5;
        const centerY = (textureResource.minY + textureResource.maxY) * 0.5;
        const minSceneY = (textureResource.renderMin - this.floorState.value) * this.heightFactor;
        const maxSceneY = (textureResource.renderMax - this.floorState.value) * this.heightFactor;
        return {
            kind: 'texture-page',
            pageX: textureResource.pageX,
            pageY: textureResource.pageY,
            lx: centerX - this.worldOrigin.x,
            lz: -(centerY - this.worldOrigin.y),
            bounds: new THREE.Box3(
                new THREE.Vector3(
                    textureResource.minX - this.worldOrigin.x,
                    Math.min(minSceneY, maxSceneY),
                    -(textureResource.maxY - this.worldOrigin.y),
                ),
                new THREE.Vector3(
                    textureResource.maxX - this.worldOrigin.x,
                    Math.max(minSceneY, maxSceneY),
                    -(textureResource.minY - this.worldOrigin.y),
                ),
            ),
        };
    }

    _applyTexturePageBindings(material, pageKeys) {
        if (!material) return;
        const pages = this._texturePageSlots(pageKeys);
        const bindings = [];
        for (let slot = 0; slot < MAX_TEXTURE_PAGE_BINDINGS; slot++) {
            const page = pages[slot] || null;
            const state = page?.available ? this.texturePageResidency.state(page.key) : null;
            const best = state ? this._bestTextureAsset(state) : null;
            if (state) state.activeTier = best?.[0] || null;
            bindings.push({
                page,
                texture: best?.[1]?.texture || this.missingPageTexture,
                valid: Boolean(page?.available && best?.[1]?.texture),
                tier: best?.[0] || null,
            });
        }
        material.userData.texturePageBindings = bindings;
        material.map = bindings[0]?.texture || this.missingPageTexture;
        material.color.setHex(0xffffff);

        const shader = material.userData.shader;
        if (shader) {
            if (shader.uniforms.map) shader.uniforms.map.value = material.map;
            for (let slot = 0; slot < MAX_TEXTURE_PAGE_BINDINGS; slot++) {
                const binding = bindings[slot];
                if (slot > 0) shader.uniforms[`uPageMap${slot}`].value = binding.texture;
                shader.uniforms[`uPageOrigin${slot}`].value.set(
                    binding.page?.minX || 0,
                    binding.page?.minY || 0,
                );
                shader.uniforms[`uPageValid${slot}`].value = binding.valid ? 1 : 0;
            }
        }
    }

    _refreshTilePageTextures(tile) {
        if (!tile) return;
        const materials = new Set([tile.material, ...(tile.clonedMaterials || [])]);
        for (const material of materials) {
            this._applyTexturePageBindings(material, tile.texturePageKeys);
        }

        // The tile-to-page shim is a conservative AABB and may include a grid
        // cell that exact rotated-cap SAT proves no fragment can ever sample.
        // Such intentionally absent cells still occupy a deterministic shader
        // slot, but they are not failed residency and must not poison quality
        // telemetry for the pages that really intersect rendered geometry.
        const residentPageKeys = tile.texturePageKeys.filter(
            key => this.texturePageResidency.state(key),
        );
        const tiers = residentPageKeys.map(key => {
            const state = this.texturePageResidency.state(key);
            return this._bestTextureAsset(state)?.[0] || null;
        });
        tile.textureTier = tiers.length > 0 && tiers.every(Boolean)
            ? tiers.reduce((lowest, tier) => TEXTURE_RANK[tier] < TEXTURE_RANK[lowest] ? tier : lowest)
            : null;
        tile.isFullTex = tiers.length > 0 && tiers.every(tier => tier === TEXTURE_TIER.HIGH);
        for (let slot = 0; slot < residentPageKeys.length; slot++) {
            if (tiers[slot] === TEXTURE_TIER.HIGH) this.cacheManager.touch(residentPageKeys[slot]);
        }
        this.needsRender = true;
    }

    _refreshTexturePageConsumers(state) {
        for (const tileKey of state.consumers) {
            const tile = this.tiles.get(tileKey);
            if (tile) this._refreshTilePageTextures(tile);
        }
    }

    _reconcileTextureState(state) {
        const best = this._bestTextureAsset(state);
        if (best && state.activeTier !== best[0]) {
            state.activeTier = best[0];
            this._refreshTexturePageConsumers(state);
        }
        if (state.desiredTier !== TEXTURE_TIER.HIGH && state.assets.has(TEXTURE_TIER.HIGH)) {
            this._dropTextureTier(state.key, TEXTURE_TIER.HIGH);
        }
        if (!this.isMiniBake && state.classification === 'outside' &&
            state.assets.has(TEXTURE_TIER.MEDIUM) && state.assets.has(TEXTURE_TIER.LOW)) {
            this._dropTextureTier(state.key, TEXTURE_TIER.MEDIUM);
        }
    }

    _dropTextureTier(key, tier, fromHighPool = false) {
        const state = this.textureStates.get(key);
        const asset = state?.assets.get(tier);
        if (!state || !asset) return true;

        const replacement = state.activeTier === tier
            ? this._bestTextureAsset(state, state.desiredTier, tier)
            : null;
        const dropped = this.texturePageResidency.dropAsset(
            key,
            tier,
            replacement,
            {
                rebind: current => this._refreshTexturePageConsumers(current),
                dispose: retired => retired.texture.dispose(),
            },
        );
        if (!dropped) return false;
        this.vramLedger.removeTexture(key, tier);
        if (tier === TEXTURE_TIER.HIGH && !fromHighPool) this.cacheManager.removeHigh(key);
        return true;
    }

    _installTextureResult(task, result) {
        const state = this._textureState(task.textureResource);
        state.loading.delete(task.tier);
        state.queued.delete(task.tier);
        state.failed.delete(task.tier);
        this.failedTextures.delete(this._textureFailureKey(state.key, task.tier));

        const texture = this.buildCompressedTexture(result);
        if (task.tier === TEXTURE_TIER.HIGH) {
            const admitted = this.cacheManager.admitHigh(
                state.key,
                result.gpuBytes || 0,
                victimKey => this._dropTextureTier(victimKey, TEXTURE_TIER.HIGH, true),
                new Set(state.classification === 'visible' ? [state.key] : []),
                state.perceptibility,
                victimKey => {
                    const victim = this.textureStates.get(victimKey);
                    return !!victim && (
                        victim.activeTier !== TEXTURE_TIER.HIGH
                        || !!this._bestTextureAsset(victim, victim.desiredTier, TEXTURE_TIER.HIGH)
                    );
                },
            );
            if (!admitted) {
                texture.dispose();
                state.desiredTier = TEXTURE_TIER.MEDIUM;
                this._reconcileTextureState(state);
                return;
            }
            this.texStats.highUploadSize = result.width;
            this.texStats.highSourceSize = result.sourceWidth || result.width;
            this.texStats.highSkippedTopMips = result.skippedTopMips || 0;
        }

        const asset = { texture, bytes: result.gpuBytes || 0, result };
        this.texturePageResidency.replaceAsset(state.key, task.tier, asset, {
            rebind: current => this._refreshTexturePageConsumers(current),
            dispose: retired => retired.texture.dispose(),
        });
        this.vramLedger.setTexture(
            state.key,
            task.tier,
            result.gpuBytes || 0,
            this._textureLedgerLocation(task.textureResource),
        );
        this._reconcileTextureState(state);
        this.updateTexStats(result);

        if (task.tier === TEXTURE_TIER.HIGH) {
            this.recentlyUpgradedTextures.push({
                q: task.textureResource.pageX,
                r: task.textureResource.pageY,
                time: performance.now(),
            });
        }
    }

    processTextureResults() {
        let installed = 0;
        while (installed < TEXTURE_CONFIG.maxUploadsPerFrame) {
            const index = this.textureResultQueue.findIndex(
                item => !this.isMovingView || item.task.tier !== TEXTURE_TIER.HIGH);
            if (index < 0) break;
            const { task, result } = this.textureResultQueue.splice(index, 1)[0];
            const state = this._textureState(task.textureResource);
            if (task.tier === TEXTURE_TIER.HIGH && state.desiredTier !== TEXTURE_TIER.HIGH) {
                // Demand changed during transcode. These are still CPU-side
                // bytes, so avoid a pointless GPU upload and immediate drop.
                state.loading.delete(task.tier);
                state.queued.delete(task.tier);
                continue;
            }
            this._installTextureResult(task, result);
            installed++;
        }
    }

    _dispatchTextureJobs(maxConcurrent) {
        while (this.activeWorkerCount < maxConcurrent &&
            this.activeTextureJobs < TEXTURE_CONFIG.maxTextureJobs &&
            this.textureQueue.length > 0) {
            const index = selectTextureDispatchTaskIndex(
                this.textureQueue,
                this.textureStates,
                {
                    isMoving: this.isMovingView,
                    // The postage floor gates upgrades only inside the current
                    // visible+guard demand. Mini-bakes deliberately retain the
                    // historical whole-corpus floor because the complete
                    // fixture is itself the local safety region.
                    lowCoverageFirst: true,
                    lowCoverageIncludesOutside: this.isMiniBake,
                },
            );
            if (index < 0) break;
            const task = this.textureQueue.splice(index, 1)[0];
            const state = this._textureState(task.textureResource);
            state.queued.delete(task.tier);
            const pinnedMedium = this.isMiniBake && task.tier === TEXTURE_TIER.MEDIUM;
            if (!pinnedMedium && TEXTURE_RANK[task.tier] > TEXTURE_RANK[state.desiredTier]) continue;
            if (state.assets.has(task.tier) || state.loading.has(task.tier)) continue;
            state.loading.add(task.tier);
            this.activeWorkerCount++;
            this.activeTextureJobs++;
            const retryKey = `texture:${this._textureFailureKey(task.key, task.tier)}`;
            this.resourceRetries.run(retryKey, () => (
                this.postWorkerJob('LOAD_TEXTURE', { urls: task.urls })
            ), {
                onRetry: event => this._logRetry('texture', `${task.key}/${task.tier}`, event),
            }).then(result => {
                if (result.networkBytes) {
                    this.vramLedger.addNetworkPayload(task.key, { bin: 0, tex: result.networkBytes });
                }
                this.textureResultQueue.push({ task, result });
                this.needsRender = true;
            }).catch(error => {
                state.loading.delete(task.tier);
                state.failed.add(task.tier);
                this._markTextureFailed(task.key, task.tier, error);
                this._texErrorCount++;
                this._updateTexBadge();
                if (this._texErrorCount <= 3) {
                    console.warn(`[TEX_FAIL] ${task.key}/${task.tier}: ${error.message}`);
                }
            }).finally(() => {
                this.activeWorkerCount--;
                this.activeTextureJobs--;
                this.processQueues();
            });
        }
    }

    _seedMiniTexturePins() {
        if (!this.isMiniBake || this.miniTexturePinsSeeded || !this.manifest) return;
        this.miniTexturePinsSeeded = true;
        const resources = this.texturePageGrid.pages;
        // Seed the complete coverage floor before placing any upgrades in the
        // queue. The dispatch barrier below remains authoritative if later
        // demand promotion changes numeric priorities.
        for (const resource of resources) {
            this._queueTextureTier(resource, TEXTURE_TIER.LOW, -1000);
        }
        for (const resource of resources) {
            this._queueTextureTier(resource, TEXTURE_TIER.MEDIUM, -2000);
        }
    }

    _planTileGeometry(manifestTile, { coarseOnly = false } = {}) {
        const context = this.currentVisibilityContext;
        if (!context) throw new Error('geometry selection requires a current visibility context');
        const key = `${manifestTile.yq}_${manifestTile.yr}`;
        const rootHandle = this.visibilityAdapter.getRootHandle(key);
        if (rootHandle === null) throw new Error(`missing visibility root for ${key}`);

        // L3 horizontal spread plus the island's exact vertical relief gives a
        // conservative prebuild margin around the shader's fixed LOD bands.
        // A child needed at a ring edge is therefore selected before it can
        // become visible; there are no per-unit frustum tests.
        const relief = Math.max(0, manifestTile.hMax - manifestTile.hMin);
        const l3Radius = this.visibilityAdapter.horizontalRadiusByLevel[3];
        const detailMarginMeters = Math.max(
            this.lodTileMargin,
            Math.hypot(l3Radius, relief) + 24,
        );
        return planGosperGeometrySelection({
            adapter: this.visibilityAdapter,
            rootHandle,
            visibleFrustum: context.visibleFrustum,
            guardFrustum: context.guardFrustum,
            projection: context.projection,
            detailDistanceByDepth: [
                Infinity,
                Infinity,
                Infinity,
                coarseOnly ? -1e30 : this.settledLodRadii[2],
                coarseOnly ? -1e30 : this.settledLodRadii[1],
                coarseOnly ? -1e30 : this.settledLodRadii[0],
            ],
            detailMarginMeters,
        });
    }

    _updateTexturePageDemand({ visibleFrustum, guardFrustum, projection }) {
        const adapter = this.texturePageVisibilityAdapter;
        const residency = this.texturePageResidency;
        if (!adapter || !residency) return;

        adapter.setVerticalTransform({
            factor: this.heightFactor,
            floor: this.floorState.value,
        });
        const plan = planHierarchicalVisibility({
            hierarchy: adapter,
            visibleFrustum,
            guardFrustum,
            projection,
            maxDepth: 0,
        });
        this.texturePagePlanStats = plan.stats;
        residency.beginDemandPass();

        const consume = (bucket, classification) => {
            for (let index = 0; index < bucket.nodeIds.length; index++) {
                const page = adapter.getPage(bucket.nodeIds[index]);
                const projectedDiameterPx = bucket.projectedDiameterPx[index] || 0;
                const distanceMeters = bucket.distanceMeters[index];
                const viewDepthMeters = bucket.viewDepthMeters[index];
                const viewCosine = Number.isFinite(distanceMeters) && distanceMeters > 0
                    ? Math.max(0, Math.min(1, viewDepthMeters / distanceMeters))
                    : 1;
                const centerWeight = Math.pow(viewCosine, 8);
                const projectedPriority = Number.isFinite(projectedDiameterPx)
                    ? projectedDiameterPx * (0.1 + 0.9 * centerWeight) * 100
                    : 999999;
                const priority = (classification === 'visible'
                    ? 1e9
                    : (classification === 'guard' ? 1e6 : 0))
                    + Math.min(999999, projectedPriority)
                    - Math.min(99999, Number.isFinite(distanceMeters) ? distanceMeters : 99999);
                residency.contribute(page, {
                    classification,
                    projectedDiameterPx,
                    perceptibility: priority,
                });
            }
        };
        consume(plan.outside, 'outside');
        consume(plan.guard, 'guard');
        consume(plan.visible, 'visible');
        residency.finishDemandPass({
            highEnterPx: this.highTextureEnterPx || TEXTURE_CONFIG.highEnterPx,
        });

        // Camera motion can leave old lows and refinements in the queue. On a
        // world-scale manifest those stale lows must never become a hidden
        // global prerequisite for the new view. Already-running worker jobs
        // are allowed to finish; result installation already reconciles them
        // against the latest desired tier.
        this.textureQueue = pruneTextureDispatchQueue(
            this.textureQueue,
            residency.states,
            { includeOutside: this.isMiniBake },
        );

        for (const state of residency.states.values()) {
            if (state.assets.size > 0) {
                // Pitch/floor changes move the rendered page AABB. Keep spatial
                // accounting current without changing page allocation identity.
                this.vramLedger.updateTextureLocation(
                    state.key,
                    this._textureLedgerLocation(state.page),
                );
            }
            if (!textureStateHasDemand(state, { includeOutside: this.isMiniBake })) {
                this.cacheManager.updatePriority(state.key, 0);
                this._reconcileTextureState(state);
                continue;
            }
            this._scheduleTextureQuality(
                state.page,
                state.classification,
                state.projectedDiameterPx,
                state.perceptibility,
                true,
            );
        }
    }

    updateLOD() {
        if (!this.visibilityAdapter || !this.visibilityBootstrapReady || this.lodPaused) return;

        this.camera.updateMatrixWorld();
        this.projScreenMatrix.multiplyMatrices(
            this.camera.projectionMatrix,
            this.camera.matrixWorldInverse,
        );
        const visibleFrustum = extractFrustumPlanes(this.projScreenMatrix);

        // Guard expansion is expressed against the actual rectangular camera
        // frustum, so portrait naturally remains tall/narrow and landscape
        // wide/short. A small motion lead makes panning cross the prefetch band
        // before it reaches the screen; there is no radial/conical policy.
        const previous = this.lastVisibilityCameraPosition || this.camera.position;
        const motion = [
            (this.camera.position.x - previous.x) * 4,
            (this.camera.position.y - previous.y) * 4,
            (this.camera.position.z - previous.z) * 4,
        ];
        const guardMarginMeters = Math.max(300, Math.min(5000, Math.abs(this.camera.position.y) * 0.25));
        const guardFrustum = expandFrustumPlanes(visibleFrustum, {
            marginMeters: guardMarginMeters,
            predictedTranslation: motion,
        });

        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);
        const drawingBuffer = new THREE.Vector2();
        this.renderer.getDrawingBufferSize(drawingBuffer);
        const projection = createProjectionContext({
            position: [this.camera.position.x, this.camera.position.y, this.camera.position.z],
            forward: [forward.x, forward.y, forward.z],
            verticalFovRadians: THREE.MathUtils.degToRad(this.camera.fov),
            viewportHeightPx: drawingBuffer.y,
            near: this.camera.near,
        });

        this.visibilityAdapter.setVerticalTransform({
            factor: this.heightFactor,
            floor: this.floorState.value,
        });
        this.currentVisibilityContext = Object.freeze({
            visibleFrustum,
            guardFrustum,
            projection,
        });
        this._updateTexturePageDemand({ visibleFrustum, guardFrustum, projection });
        const plan = planHierarchicalVisibility({
            hierarchy: this.visibilityAdapter,
            visibleFrustum,
            guardFrustum,
            projection,
            maxDepth: 0,
        });
        const summary = this.visibilityAdapter.summarizePlanByIsland(plan);
        this.visibilityPlanStats = {
            ...plan.stats,
            guardMarginMeters,
            viewportWidthPx: drawingBuffer.x,
            viewportHeightPx: drawingBuffer.y,
        };
        // initWorld() yields while restoring a shareable URL. The animation
        // loop can legitimately run this first visibility pass during that
        // gap, before the post-restore snapshot has been assigned.
        if (this.lastVisibilityCameraPosition) {
            this.lastVisibilityCameraPosition.copy(this.camera.position);
        } else {
            this.lastVisibilityCameraPosition = this.camera.position.clone();
        }
        this.visibilityByKey.clear();
        const previousRebuilds = this.geometryFrontierStats?.rebuilds || 0;
        this.geometryFrontierStats = {
            plannedTiles: 0,
            activeL3: 0,
            excludedL3: 0,
            selectedDetailNodes: 0,
            rebuilds: previousRebuilds,
        };

        for (let island = 0; island < this.visibilityAdapter.islandCount; island++) {
            const key = this.visibilityAdapter.getIslandKey(island);
            const manifestTile = this.manifestGrid.get(key);
            if (!manifestTile) continue;
            const code = summary.classification[island];
            const classification = code === VisibilityClass.VISIBLE
                ? 'visible'
                : (code === VisibilityClass.GUARD ? 'guard' : 'outside');
            const projectedDiameterPx = summary.projectedDiameterPx[island] || 0;
            const distanceMeters = summary.distanceMeters[island];
            const viewDepthMeters = summary.viewDepthMeters[island];
            const viewCosine = Number.isFinite(distanceMeters) && distanceMeters > 0
                ? Math.max(0, Math.min(1, viewDepthMeters / distanceMeters))
                : 1;
            // Strongly prefer centered content for finite budgets. Tier choice
            // remains projected-size-only; this term affects scheduling and
            // eviction order, not image-quality thresholds.
            const centerWeight = Math.pow(viewCosine, 8);
            const projectedPriority = Number.isFinite(projectedDiameterPx)
                ? projectedDiameterPx * (0.1 + 0.9 * centerWeight) * 100
                : 999999;
            const priority = (classification === 'visible' ? 1e9 : (classification === 'guard' ? 1e6 : 0))
                + Math.min(999999, projectedPriority)
                - Math.min(99999, Number.isFinite(distanceMeters) ? distanceMeters : 99999);

            const visibility = {
                classification,
                projectedDiameterPx,
                distanceMeters,
                viewDepthMeters,
                centerWeight,
                priority,
            };
            this.visibilityByKey.set(key, visibility);

            // GSP2+ supports deferred geometry, so a settled resident tile
            // can refine the generic root plan to L3 and keep only descendant
            // ranges that can contribute. GSP3 supplies exact subtree bounds;
            // GSP2 safely refines with its deliberately loose migration bounds.
            // GSP1 remains on its full-build compatibility path.
            let resident = this.tiles.get(key);
            if (resident?.binaryVersion >= 2 && classification !== 'outside' && !this.isMovingView) {
                const desiredSelection = this._planTileGeometry(manifestTile);
                resident.geometryDesiredSelection = desiredSelection;
                resident.geometryDesiredSignature = desiredSelection.signature;
                this.geometryFrontierStats.plannedTiles++;
                this.geometryFrontierStats.activeL3 += desiredSelection.activeL3Count;
                this.geometryFrontierStats.excludedL3 += desiredSelection.excludedL3Count;
                this.geometryFrontierStats.selectedDetailNodes += desiredSelection.detailNodeCount;
                const needsRebuild = gosperGeometrySelectionNeedsRebuild(
                    resident.geometrySelection,
                    desiredSelection,
                );
                if (needsRebuild) {
                    // Keep this tile on the complete L3 cut until the exact
                    // final frontier is ready. Never reveal old-camera detail.
                    resident.geometryAwaitingFinal = true;
                    if (this._queueGeometryRebuild(
                        resident,
                        manifestTile,
                        desiredSelection,
                        priority,
                    )) {
                        this.geometryFrontierStats.rebuilds++;
                    }
                } else if (resident.geometryAwaitingFinal) {
                    resident.geometryAwaitingFinal = false;
                    this.needsRender = true;
                }
            }

            if (classification !== 'outside') {
                if (!this.tiles.has(key) && !this.loadingTiles.has(key) && !this.failedTiles.has(key)) {
                    this.loadingTiles.add(key);
                    this.loadQueue.push({ t: manifestTile, priority });
                }
            } else if (this.tiles.has(key)) {
                this.unloadTile(key);
            }
        }

        this._seedMiniTexturePins();
        this.processQueues();
        this.checkInitialLoad();
    }

    checkInitialLoad(sorted) {
        if (this.loaderHidden || this.contextRecovery.active) return;
        // If we have successfully instantiated at least 1 tile, hide the loader.
        // The rest will pop in.
        let operational = 0;
        for (const t of this.tiles.values()) {
            if (t.mesh) operational++;
        }

        if (operational >= 1) {
            this.profiler?.milestone('firstTileOperational');
            this.hideLoader();
        }
    }

    _suppressHighTextureWorkForMotion() {
        this.textureQueue = this.textureQueue.filter(task => {
            if (task.tier !== TEXTURE_TIER.HIGH) return true;
            this.textureStates.get(task.key)?.queued.delete(TEXTURE_TIER.HIGH);
            return false;
        });
        for (const state of this.textureStates.values()) {
            state.queued.delete(TEXTURE_TIER.HIGH);
        }
    }

    notifyCameraMotion(now = performance.now()) {
        const entered = this.cameraMotion.enterMotion(now, this.isMovingView);
        this.needsRender = true;
        this.needsLODUpdate = true;
        this.frameScheduler?.wake('camera-input');
        this.frameScheduler?.wakeAfter(310, 'motion-settle');
        if (!entered) return false;

        // This method runs inside the controls `change` event, before another
        // microtask or the next animation frame can observe stale settled mode.
        this.isMovingView = true;
        this._beginGeometryMode(true);
        this._suppressHighTextureWorkForMotion();
        return true;
    }

    _beginGeometryMode(isMovingView) {
        // Every camera-mode edge invalidates queued/pending work from the old
        // view. Worker jobs cannot be cancelled, but their epoch/signature is
        // checked before installation so stale meshes never flash on screen.
        this.geometryPlanEpoch++;
        this.geometryRebuildQueue.length = 0;
        for (const tile of this.tiles.values()) {
            tile.geometryRebuildQueued = null;
            tile.geometryRebuildNext = null;
            tile.geometryDesiredSelection = null;
            tile.geometryDesiredSignature = null;
            tile.geometryAwaitingFinal = !isMovingView && tile.binaryVersion >= 2;
        }
        if (isMovingView) this.needsRender = true;
    }

    _queueGeometryRebuild(tile, manifestTile, selection, priority) {
        const task = {
            tile,
            manifestTile,
            selection,
            priority,
            epoch: this.geometryPlanEpoch,
            mode: this.isMovingView ? 'moving' : 'settled',
            signature: selection.signature,
        };
        tile.geometryDesiredSelection = selection;
        tile.geometryDesiredSignature = selection.signature;

        if (tile.geometryRebuildPending) {
            const pending = tile.geometryRebuildPending;
            if (pending.epoch === task.epoch
                && pending.mode === task.mode
                && pending.signature === task.signature) return false;
            tile.geometryRebuildNext = task;
            return true;
        }
        if (tile.geometryRebuildQueued) {
            Object.assign(tile.geometryRebuildQueued, task, {
                priority: Math.max(tile.geometryRebuildQueued.priority, priority),
            });
            return false;
        }
        tile.geometryRebuildQueued = task;
        this.geometryRebuildQueue.push(task);
        return true;
    }

    _startGeometryRebuild(task) {
        const { tile, manifestTile, selection } = task;
        const key = `${manifestTile.yq}_${manifestTile.yr}`;
        tile.geometryRebuildQueued = null;
        if (this.tiles.get(key) !== tile || !(tile.geometrySource instanceof ArrayBuffer)) return false;
        if (tile.geometryRebuildPending || !geometryBuildCanCommit({
            taskEpoch: task.epoch,
            currentEpoch: this.geometryPlanEpoch,
            taskSignature: task.signature,
            desiredSignature: tile.geometryDesiredSignature,
            taskMode: task.mode,
            isMovingView: this.isMovingView,
        })) return false;

        tile.geometryRebuildPending = task;
        this.activeWorkerCount++;
        this.postWorkerJob('BUILD_GEOMETRY', {
            // Clone, do not transfer: this retained ~258 KB source makes
            // subsequent L3 expansions local and avoids network flashes.
            binBuffer: tile.geometrySource,
            yq: manifestTile.yq,
            yr: manifestTile.yr,
            expectedGspVersion: tile.binaryVersion,
            rangesByDepth: selection.rangesByDepth,
        }).then(result => {
            if (this.tiles.get(key) !== tile) return;
            if (result.binaryVersion !== tile.binaryVersion) {
                throw new Error(`geometry rebuild version mismatch for ${key}`);
            }
            if (!geometryBuildCanCommit({
                taskEpoch: task.epoch,
                currentEpoch: this.geometryPlanEpoch,
                taskSignature: task.signature,
                desiredSignature: tile.geometryDesiredSignature,
                taskMode: task.mode,
                isMovingView: this.isMovingView,
            })) return;
            this._replaceTileGeometry(tile, result.lods, result.geometryBytes, selection);
        }).catch(error => {
            console.error(`Geometry rebuild failed for ${key}`, error);
        }).finally(() => {
            this.activeWorkerCount--;
            if (tile.geometryRebuildPending === task) tile.geometryRebuildPending = null;
            const next = tile.geometryRebuildNext;
            tile.geometryRebuildNext = null;
            if (next && geometryBuildCanCommit({
                taskEpoch: next.epoch,
                currentEpoch: this.geometryPlanEpoch,
                taskSignature: next.signature,
                desiredSignature: tile.geometryDesiredSignature,
                taskMode: next.mode,
                isMovingView: this.isMovingView,
            })) {
                tile.geometryRebuildQueued = next;
                this.geometryRebuildQueue.push(next);
            }
            this.needsLODUpdate = true;
            this.needsRender = true;
            this.processQueues();
        });
        return true;
    }

    _replaceTileGeometry(tile, lods, geometryBytes, selection) {
        const replacement = new THREE.Group();
        const builtLevels = {};
        const replacementMaterials = [];
        const levels = geometryLevelsForMode(this.isMovingView, tile.binaryVersion);

        try {
            for (const level of levels) {
                const lodData = lods[level];
                if (!lodData) continue;
                const material = tile.material.clone();
                material.userData = { ...tile.material.userData, lodIdx: level, shader: null };
                this.setupMaterialShader(material);
                this.materialsToUpdate.add(material);
                replacementMaterials.push(material);
                const layer = this.createMeshFromWorkerData(lodData, material, true);
                if (!layer) continue;
                layer.userData.activeSkirts = lodData.activeSkirts;
                layer.userData.gosperLevel = level;
                if (level >= 1 && layer.children[1]) layer.children[1].visible = !this.isMovingView;
                replacement.add(layer);
                builtLevels[level] = true;
            }
            const built = Object.keys(builtLevels).map(Number);
            if (built.length === 0) throw new Error('filtered rebuild produced no coarse geometry');
            const nextFinestBuilt = Math.min(...built);
            replacement.position.copy(tile.mesh.position);

            // Compile while detached, then apply the exact current submission
            // cut before attachment. Three.js groups default to visible; if the
            // replacement enters the container first, a render triggered by
            // surrounding SINTERING work can briefly submit every built level.
            const stagedTile = {
                ...tile,
                mesh: replacement,
                builtLevels,
                finestBuilt: nextFinestBuilt,
                geometrySelection: selection,
                geometryAwaitingFinal: false,
            };
            this._markFinestBuilt(stagedTile);
            this.renderer.compile(replacement, this.camera);
            this._applyTileLevelVisibility(stagedTile, this.heightFactor);

            const oldMesh = tile.mesh;
            tile.container.add(replacement);
            tile.container.remove(oldMesh);
            const disposedMaterials = new Set();
            oldMesh.traverse(object => {
                if (!object.isMesh) return;
                disposeGeometryWithSharedStaticBuffers(object.geometry);
                const materials = Array.isArray(object.material) ? object.material : [object.material];
                for (const material of materials) {
                    if (!material || disposedMaterials.has(material)) continue;
                    disposedMaterials.add(material);
                    if (material.map) material.map = null;
                    this.materialsToUpdate.delete(material);
                    material.dispose();
                }
            });

            tile.mesh = replacement;
            tile.lods = lods;
            tile.builtLevels = builtLevels;
            tile.finestBuilt = nextFinestBuilt;
            tile.clonedMaterials = replacementMaterials;
            tile.geometrySelection = selection;
            tile.geometryAwaitingFinal = false;
            this.vramLedger.registerGeometry(`${tile.yq}_${tile.yr}`, {
                geometryBytes,
                q: tile.yq,
                r: tile.yr,
                lx: tile.lx,
                lz: tile.lz,
            });
            this.needsRender = true;
        } catch (error) {
            replacement.traverse(object => {
                if (object.isMesh) disposeGeometryWithSharedStaticBuffers(object.geometry);
            });
            for (const material of replacementMaterials) {
                this.materialsToUpdate.delete(material);
                material.dispose();
            }
            throw error;
        }
    }

    processQueues() {
        const maxConcurrent = this.workers.length;
        // New-root loads and resident range rebuilds share one priority lane.
        // A visible missing tile must outrank a guard-only refinement, while a
        // centered visible refinement can still beat speculative guard loads.
        this.geometryRebuildQueue.sort((a, b) => b.priority - a.priority);
        this.loadQueue.sort((a, b) => (b.priority || 0) - (a.priority || 0));

        while (this.activeWorkerCount < maxConcurrent &&
            (this.loadQueue.length > 0 || this.geometryRebuildQueue.length > 0)) {
            const rebuild = this.geometryRebuildQueue[0];
            const load = this.loadQueue[0];
            if (rebuild && (!load || rebuild.priority > (load.priority || 0))) {
                this.geometryRebuildQueue.shift();
                this._startGeometryRebuild(rebuild);
                continue;
            }

            const task = this.loadQueue.shift();
            const key = `${task.t.yq}_${task.t.yr}`;

            // Camera may have moved while the task waited. Outside-guard work
            // is stale and safe to discard; retained textures are independent.
            if (this.tiles.has(key) || this.visibilityByKey.get(key)?.classification === 'outside') {
                this.loadingTiles.delete(key);
                continue;
            }

            this.activeWorkerCount++;
            this.fetchTileOnWorker(task).then(result => {
                this.activeWorkerCount--;
                if (result) this.instantiateQueue.push(result);
                this.processQueues(); // Keep the pipe full
            });
        }
        if (this.loadQueue.length === 0 && this.geometryRebuildQueue.length === 0) {
            this._dispatchTextureJobs(maxConcurrent);
        }
    }

    async fetchTileOnWorker(task) {
        const tileKey = `${task.t.yq}_${task.t.yr}`;
        try {
            const { t } = task;
            const expectedGspVersion = Number(t.gspVersion ?? this.binaryContract.default_version ?? 1);
            const binaryBaseKey = this.binaryContract.cache_key
                ?? `${this.binaryContract.default_format || 'GSP'}${this.binaryContract.default_version || expectedGspVersion}`;
            const binUrl = appendCacheKey(
                `tiles_bin/gosper_${t.yq}_${t.yr}.bin`,
                `${binaryBaseKey}-gsp${expectedGspVersion}`,
            );

            const workerData = await this.resourceRetries.run(`tile:${tileKey}`, async () => {
                const result = await this.postWorkerJob('LOAD_TILE', {
                    yq: t.yq, yr: t.yr,
                    binUrl,
                    expectedGspVersion,
                });
                if (result.binaryVersion !== expectedGspVersion) {
                    throw new Error(
                        `Binary cache mismatch for ${tileKey}: manifest GSP${expectedGspVersion}, parsed GSP${result.binaryVersion}`,
                    );
                }
                return result;
            }, {
                onRetry: event => this._logRetry('tile', tileKey, event),
            });

            if (workerData.binaryVersion >= 2) {
                if (!(workerData.geometrySource instanceof ArrayBuffer) || !workerData.visibilityData) {
                    throw new Error(`GSP2+ tile ${tileKey} did not provide deferred geometry source/bounds`);
                }
                this.visibilityAdapter.attachDecodedIsland(tileKey, workerData.visibilityData);

                // Always produce the tiny complete coarse layers, even if the
                // root left the guard during phase one. If it re-enters before
                // instantiation there is valid L3 coverage; outside detail is
                // still empty and costs only 57 aggregate records.
                const geometrySelection = this._planTileGeometry(t, {
                    coarseOnly: this.isMovingView
                        || this.visibilityByKey.get(tileKey)?.classification === 'outside',
                });
                // Deliberately do not transfer geometrySource here. The
                // structured clone sent to the worker leaves one compact
                // source copy attached to the tile for future re-plans.
                const geometryResult = await this.postWorkerJob('BUILD_GEOMETRY', {
                    binBuffer: workerData.geometrySource,
                    yq: t.yq,
                    yr: t.yr,
                    expectedGspVersion,
                    rangesByDepth: geometrySelection.rangesByDepth,
                });
                if (geometryResult.binaryVersion !== expectedGspVersion) {
                    throw new Error(`deferred geometry version mismatch for ${tileKey}`);
                }
                workerData.lods = geometryResult.lods;
                workerData.geometryBytes = geometryResult.geometryBytes;
                workerData.geometrySelection = geometrySelection;
            }

            // (silent — structured perf logging only)
            // Return data for instantiation frame
            return { task, workerData };

        } catch (e) {
            console.error("Tile Fetch Error", e);
            this.visibilityAdapter?.detachDecodedIsland(tileKey);
            this.loadingTiles.delete(`${task.t.yq}_${task.t.yr}`);
            this._markTileFailed(tileKey, e);
            return null;
        }
    }

    // Build a THREE.CompressedTexture from a worker-transcoded KTX2 result
    // ({ mipmaps, width, height, formatKey, isSRGB, ... }). The worker never
    // imports THREE, so texture-page uploads are materialized here.
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

    // On-screen page telemetry (bottom-left, always visible without opening
    // devtools). "Displayed" is binding-driven and deduplicated across every
    // visible geometry consumer; fetched-only and manifest-only pages do not
    // inflate it.
    _updateTexBadge() {
        if (!this._texBadgeEl) {
            const el = document.createElement('div');
            el.id = 'tex-debug-badge';
            el.style.cssText = [
                'position:fixed',
                'bottom:max(8px,env(safe-area-inset-bottom))',
                'left:max(8px,env(safe-area-inset-left))',
                'max-width:calc(100vw - 16px)',
                'background:rgba(7,20,34,0.82)',
                "font:10px/1.35 'Courier New',monospace",
                'font-variant-numeric:tabular-nums',
                'padding:5px 7px', 'border-radius:6px',
                'border:1px solid rgba(151,193,224,0.24)',
                'box-shadow:0 2px 10px rgba(0,0,0,0.2)',
                'z-index:9999', 'pointer-events:none', 'white-space:nowrap',
                'display:grid', 'gap:2px',
            ].join(';');
            const rowElements = new Map();
            for (const rowSpec of TEXTURE_HUD_ROWS) {
                const row = document.createElement('div');
                row.className = 'tex-debug-row';
                row.dataset.tier = rowSpec.tier;
                row.dataset.sizePx = String(rowSpec.size);
                row.style.cssText = [
                    'display:grid', 'grid-template-columns:7px 68px auto',
                    'align-items:center', 'column-gap:5px',
                ].join(';');

                const swatch = document.createElement('span');
                swatch.dataset.role = 'tier-swatch';
                swatch.style.cssText = [
                    'display:block', 'width:6px', 'height:6px', 'border-radius:50%',
                    `background:${rowSpec.color}`, `box-shadow:0 0 5px ${rowSpec.color}`,
                ].join(';');

                const label = document.createElement('span');
                label.dataset.role = 'tier-label';
                label.style.cssText = `color:${rowSpec.color};font-weight:700`;
                label.textContent = `${rowSpec.label} ${rowSpec.size}px`;

                const metrics = document.createElement('span');
                metrics.dataset.role = 'tier-metrics';
                metrics.style.color = '#d7e6f2';

                row.append(swatch, label, metrics);
                el.appendChild(row);
                rowElements.set(rowSpec.tier, { row, metrics });
            }
            document.body.appendChild(el);
            this._texBadgeEl = el;
            this._texBadgeRows = rowElements;
        }

        const displayed = collectDisplayedTexturePages(this.tiles, this.visibilityByKey);
        const hasDisplayedPage = TEXTURE_HUD_ROWS.some(({ tier }) => displayed[tier].size > 0);
        if (!this._textureMilestonesDone && hasDisplayedPage) {
            this.profiler?.milestone('firstTexture');
            const bootGeometryDrained = (
                (this.loadQueue?.length ?? 0) === 0 &&
                (this.instantiateQueue?.length ?? 0) === 0
            );
            if (bootGeometryDrained && countUnpaintedVisibleTiles(this.tiles, this.visibilityByKey) === 0) {
                this.profiler?.milestone('visibleTexturedCoverage');
            }
            const milestones = this.profiler?.milestones || {};
            this._textureMilestonesDone = (
                milestones.firstTexture !== undefined &&
                milestones.visibleTexturedCoverage !== undefined
            );
        }
        const residency = collectTextureTierResidency(this.textureStates);
        const snapshot = TEXTURE_HUD_ROWS.map(({ tier }) => ({
            tier,
            displayed: displayed[tier].size,
            loaded: residency.loaded[tier],
            pending: residency.pending[tier],
            failed: residency.failed[tier],
        }));
        const signature = JSON.stringify([this.texStats.formatKey, snapshot]);
        if (signature === this._texBadgeSignature) return;
        this._texBadgeSignature = signature;

        for (const counts of snapshot) {
            const { row, metrics } = this._texBadgeRows.get(counts.tier);
            row.dataset.displayed = String(counts.displayed);
            row.dataset.loaded = String(counts.loaded);
            row.dataset.pending = String(counts.pending);
            row.dataset.failed = String(counts.failed);
            metrics.textContent = `displayed ${counts.displayed} · loaded ${counts.loaded} · q/inflight ${counts.pending} · fail ${counts.failed}`;
            metrics.style.color = counts.failed > 0 ? '#ff9c9c' : '#d7e6f2';
        }
        const format = this.texStats.formatKey || 'loading';
        this._texBadgeEl.dataset.format = format;
        this._texBadgeEl.title = `Texture pages · ${format}`;
        this._texBadgeEl.setAttribute(
            'aria-label',
            `Texture pages ${format}. ${snapshot.map(counts =>
                `${counts.tier}: ${counts.displayed} displayed, ${counts.loaded} loaded, ${counts.pending} queued or inflight, ${counts.failed} failed`
            ).join('. ')}`,
        );
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
        const { t } = task;
        const key = `${t.yq}_${t.yr}`;

        // Final Hygiene Check (Camera might have moved while worker was working)
        if (this.tiles.has(key)) return;

        // --- LEDGER: Track network payload from worker response ---
        if (workerData.networkBytes) {
            this.vramLedger.addNetworkPayload(key, workerData.networkBytes);
        }

        if (this.visibilityByKey.get(key)?.classification === 'outside') {
            this.visibilityAdapter?.detachDecodedIsland(key);
            this.loadingTiles.delete(key);
            return;
        }

        try {
            if (!workerData.lods) {
                throw new Error(`tile ${key} reached instantiation before deferred geometry was built`);
            }
            if (workerData.visibilityData) {
                this.visibilityAdapter.attachDecodedIsland(key, workerData.visibilityData);
            }

            // Create one shared base material for the tile. Texture ownership
            // remains with texture page residency, not this material or geometry.
            const sharedMaterial = this.createTileMaterial(0);
            this._applyTexturePageBindings(sharedMaterial, t.texturePageKeys);
            this.materialsToUpdate.add(sharedMaterial);

            const meshGroup = new THREE.Group();

            // GSP2+ moving mode instantiates only the complete 49-cap L3 cut.
            // GSP1 keeps its full compatibility geometry because it cannot be
            // range-rebuilt later; updateLevelVisibility still displays L3 only.
            const eagerLevels = geometryLevelsForMode(
                this.isMovingView,
                workerData.binaryVersion,
            );
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

                const finalMesh = this.createMeshFromWorkerData(lodData, layerMaterial, true);
                if (finalMesh) {
                    finalMesh.userData.activeSkirts = lodData.activeSkirts;
                    finalMesh.userData.gosperLevel = level;
                    // Aggregate skirts only render when settled — moving mode
                    // is large SKIRTLESS caps (fast) by owner contract.
                    if (level >= 1 && finalMesh.children[1]) {
                        finalMesh.children[1].visible = !this.isMovingView;
                    }
                    meshGroup.add(finalMesh);
                    builtLevels[level] = true;
                }
            }
            const builtLevelNumbers = Object.keys(builtLevels).map(Number);
            if (builtLevelNumbers.length === 0) throw new Error(`tile ${key} has no selected geometry`);
            const finestBuilt = Math.min(...builtLevelNumbers);
            const installedSelection = workerData.binaryVersion >= 2 && this.isMovingView
                ? this._planTileGeometry(t, { coarseOnly: true })
                : (workerData.geometrySelection || null);

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

            const half = this.visibilityAdapter?.horizontalRadiusByLevel?.[TILE_LEVEL] || 551;
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
                finestBuilt,
                unitHeights: workerData.unitHeights,
                stats: workerData.stats,
                center: workerData.center,
                binaryVersion: workerData.binaryVersion,
                geometrySelection: installedSelection,
                geometryDesiredSelection: null,
                geometryDesiredSignature: null,
                geometryRebuildPending: null,
                geometryRebuildQueued: null,
                geometryRebuildNext: null,
                geometryAwaitingFinal: false,
                geometrySource: workerData.geometrySource || null,
                texturePageKeys: [...t.texturePageKeys],
                textureTier: null,
                isFullTex: false,
                isTransitioning: false,
                clonedMaterials: gatheredMaterials
            };
            this._markFinestBuilt(tileObj);
            this.tiles.set(key, tileObj);
            if (tileObj.binaryVersion >= 2) {
                // Revalidate against the latest camera after both async worker
                // phases and any instantiation-queue delay.
                this.needsLODUpdate = true;
            }
            this.setHorizonTileHidden(key, true);
            this.updateGlobalStats(workerData.stats);

            // --- LEDGER: Register tile's GPU footprint ---
            // Geometry bytes pre-computed on worker thread (Graft 3)
            const geometryBytes = workerData.geometryBytes || 0;
            this.vramLedger.registerGeometry(key, {
                geometryBytes,
                q: t.yq, r: t.yr, lx: t.lx, lz: t.lz,
            });
            this._refreshTilePageTextures(tileObj);

            this.loadingTiles.delete(key);

        } catch (e) {
            console.error("Instantiation Error", key, e);
            this.loadingTiles.delete(key);
            this.visibilityAdapter?.detachDecodedIsland(key);
        }
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

    // parseBinaryV3 removed (handled by worker)
    // swapGeometry removed — level selection is fully per-instance in the
    // shader (CDLOD cut), and the flattened-cap look IS the 2D mode.

    unloadTile(key) {
        const tile = this.tiles.get(key);
        if (!tile) return;

        // --- INCINERATOR: Rigorous GPU Disposal Pipeline ---
        this._disposeTileGPU(tile);

        // --- LEDGER: Deregister VRAM tracking ---
        this.vramLedger.deregisterGeometry(key);

        this.tiles.delete(key);
        this.loadingTiles.delete(key);
        this.visibilityAdapter?.detachDecodedIsland(key);

        // The manifest-driven horizon cap takes over for this island again.
        this.setHorizonTileHidden(key, false);
    }

    /** Dispose geometry/material ownership only. Texture assets live in the
     * independent residency cache and survive geometry eviction. */
    _disposeTileGPU(tile) {
        // 1. Remove from scene FIRST (prevents any further draws)
        if (tile.container) this.scene.remove(tile.container);

        // 2. Deep-traverse all 3D meshes — dispose geometry and materials. Maps
        // are detached but never disposed here: textureStates owns them.
        if (tile.mesh) {
            tile.mesh.traverse(obj => {
                if (obj.isMesh) {
                    if (obj.geometry) {
                        disposeGeometryWithSharedStaticBuffers(obj.geometry);
                    }
                    // Array-safe material disposal (Graft 2)
                    const materials = obj.material
                        ? (Array.isArray(obj.material) ? obj.material : [obj.material])
                        : [];
                    for (const mat of materials) {
                        if (mat.map) mat.map = null;
                        this.materialsToUpdate.delete(mat);
                        mat.dispose();
                    }
                }
            });
        }

        // 4. Shared material (may have its own texture ref)
        if (tile.material) {
            if (tile.material.map) tile.material.map = null;
            this.materialsToUpdate.delete(tile.material);
            tile.material.dispose();
        }

        // 5. Cloned materials list (catch any stragglers not in traversal)
        if (tile.clonedMaterials) {
            tile.clonedMaterials.forEach(m => {
                this.materialsToUpdate.delete(m);
                if (m.map) m.map = null;
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
        tile.geometrySource = null;
        tile.geometrySelection = null;
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
        this.profiler?.milestone('loaderHidden');
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

    sampleTerrainSourceElevation(sceneX, sceneZ) {
        const wx = sceneX + this.worldOrigin.x;
        const wy = this.worldOrigin.y - sceneZ;
        const axial = worldToUnitAxial(wx, wy);
        const [tq, tr] = G.tileOfUnit(axial.q, axial.r);
        const key = `${tq}_${tr}`;
        const tile = this.tiles.get(key);

        let sourceElevation;
        if (tile && tile.center && tile.unitHeights) {
            const dq = axial.q - tile.center.q;
            const dr = axial.r - tile.center.r;
            const idx = this.unitIndexMap.get(((dq + 128) << 8) | (dr + 128));
            sourceElevation = (idx !== undefined) ? tile.unitHeights[idx] : undefined;
            if (sourceElevation === undefined) sourceElevation = tile.stats?.avg;
        } else {
            // The manifest horizon renders hMean until decoded unit geometry
            // arrives, so hMean is the correct eye-clearance surface here.
            sourceElevation = this.manifestGrid?.get(key)?.hMean;
        }

        return { sourceElevation, wx, wy, axial, tq, tr };
    }

    maintainCameraAltitudeDuringAnimation(h) {
        const target = this.controls.target;
        const targetSample = this.sampleTerrainSourceElevation(target.x, target.z);

        // Update Readouts
        this._setHudText('sector-val', `${targetSample.tq}, ${targetSample.tr}`);
        this._setHudText('world-val', `${targetSample.wx.toFixed(0)}, ${targetSample.wy.toFixed(0)}`);
        this._setHudText('hex-val', `${targetSample.axial.q}, ${targetSample.axial.r}`);

        const groundH = targetSample.sourceElevation;

        if (Number.isFinite(groundH)) {
            const anchored = computeTerrainAnchorRebase({
                cameraY: this.camera.position.y,
                targetY: target.y,
                sourceElevation: groundH,
                floor: this.floorState.value,
                factor: h,
            });

            // Floor selection and pitch morph both move rendered terrain. Move
            // the camera and its MapControls pivot by the identical amount so
            // pan/zoom/orbit preserve their bearing, polar angle, and range.
            // The target therefore remains the terrain point being inspected,
            // rather than a stale y=0 datum below a pitched mountain.
            target.y = anchored.targetY;
            this.camera.position.y = anchored.cameraY;

            // The target anchor alone cannot protect a camera crossing a
            // taller hex elsewhere. Sample the eye's own X/Z after rebasing
            // and clamp before visibility planning and rendering. This does
            // not touch the 2D -> raised-piston height morph.
            const eyeGroundH = this.sampleTerrainSourceElevation(
                this.camera.position.x,
                this.camera.position.z,
            ).sourceElevation;
            const clearanceGroundH = Number.isFinite(eyeGroundH)
                // Preserve the existing target-local clearance while adding
                // the missing eye-local constraint.
                ? Math.max(eyeGroundH, groundH)
                : groundH;
            const clearance = computeCameraClearance({
                cameraY: this.camera.position.y,
                sourceElevation: clearanceGroundH,
                floor: this.floorState.value,
                factor: h,
                clearance: CAMERA_TERRAIN_CLEARANCE_METERS,
            });
            this.camera.position.y = clearance.cameraY;

            this._setHudText('tile-height', `${anchored.terrainY.toFixed(1)}m`);
        }
        this._setHudText('camera-height', `${this.camera.position.y.toFixed(0)}m`);
    }

    updateFloorState(h) {
        const currentMin = this.pickFloorValue();
        // A pitched saved view can start rendering before its first tile has
        // instantiated. Zero is not a terrain sample: locking it here would
        // permanently place real ~2,500 m terrain above the camera model.
        if (!Number.isFinite(currentMin)) return;

        if (LOCK_FLOOR_ON_RISE && h > FLOOR_LOCK_THRESHOLD) {
            // Logic: Only update if we found a LOWER floor (prevent sinking), but don't raise it (prevent jitter).
            if (!this.floorState.locked || currentMin < this.floorState.value) {
                this.floorState.value = currentMin;
            }
            this.floorState.locked = true;
            this.floorState.provisional = false;
            this.updateFloorUniforms();
        } else if (!LOCK_FLOOR_ON_RISE) {
            this.floorState.value = currentMin;
            this.floorState.provisional = false;
            this.updateFloorUniforms();
        } else {
            // Not yet locked (flat mode), just track freely
            this.floorState.value = currentMin;
            this.floorState.provisional = false;
            this.updateFloorUniforms();
        }
    }

    pickFloorValue() {
        const inView = this.getTilesInView();
        const validTiles = inView.length ? inView : Array.from(this.tiles.values());
        let min = Infinity;
        for (const t of validTiles) if (t.stats && t.stats.min < min) min = t.stats.min;
        return Number.isFinite(min) ? min : NaN;
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

    // --- ENGINE STATE DERIVATION ---
    deriveEngineState(flat) {
        // Camera motion is latched, so a completed wheel burst still reports
        // moving even when controls.update() is already false this frame.
        if (this.isMovingView) return flat ? ENGINE_STATES.MOVING_2D : ENGINE_STATES.MOVING_3D;
        const recentUpgrade = this.recentlyUpgradedTextures.some(u => performance.now() - u.time < 100);
        if (this.textureQueue.length > 0 || this.textureResultQueue.length > 0 ||
            this.activeWorkerCount > 0 || recentUpgrade) return ENGINE_STATES.SINTERING;
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

        let visCount = 0, bufCount = 0, vesCount = 0;
        let visBytes = 0, bufBytes = 0, vesBytes = 0;
        let visFull = 0, visLow = 0, bufFull = 0, bufLow = 0, vesFull = 0, vesLow = 0;

        for (const [key, tile] of this.tiles) {
            const entry = this.vramLedger.entries.get(key);
            const bytes = (entry?.geometryBytes || 0) + this.vramLedger.textureBytesFor(key);
            const classification = this.visibilityByKey.get(key)?.classification || 'outside';
            const isFull = tile.textureTier === TEXTURE_TIER.HIGH;

            if (classification === 'visible') {
                visCount++; visBytes += bytes;
                if (isFull) visFull++; else visLow++;
            } else if (classification === 'guard') {
                bufCount++; bufBytes += bytes;
                if (isFull) bufFull++; else bufLow++;
            } else {
                vesCount++; vesBytes += bytes;
                if (isFull) vesFull++; else vesLow++;
            }
        }

        const residentTiers = { low128: 0, medium256: 0, high4096: 0 };
        const activeTiers = { low128: 0, medium256: 0, high4096: 0, none: 0 };
        const desiredTiers = { low128: 0, medium256: 0, high4096: 0 };
        for (const state of this.textureStates.values()) {
            for (const tier of state.assets.keys()) residentTiers[tier]++;
            if (state.activeTier) activeTiers[state.activeTier]++;
            else activeTiers.none++;
            desiredTiers[state.desiredTier]++;
        }
        const manifestRetry = this.resourceRetries.snapshot(MANIFEST_RETRY_KEY);

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
                highTextureBudgetBytes: this.cacheManager.budget,
                highTextureBytes: this.cacheManager.highBytes,
                highTextureBudgetUtilization: +(this.cacheManager.utilization).toFixed(4),
                // Human-readable
                geometry: fmt(this.vramLedger.totalGeometryBytes),
                textures: fmt(this.vramLedger.totalTextureBytes),
                total: fmt(this.vramLedger.totalVRAMBytes),
                highTextureBudget: fmt(this.cacheManager.budget),
                highTextureHeadroom: fmt(this.cacheManager.headroom),
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
                inFrustumTexturePages: spatial.texturePageBreakdown.inFrustum,
                outFrustumTexturePages: spatial.texturePageBreakdown.outFrustum,
                inFrustumTextureAllocations: spatial.texturePageBreakdown.inFrustumAllocations,
                outFrustumTextureAllocations: spatial.texturePageBreakdown.outFrustumAllocations,
                geometryBytes: spatial.geometryBytes,
                texturePageBytes: spatial.textureBytes,
                // Human-readable
                inFrustum: `${spatial.tileBreakdown.inFrustum} geometry tiles + ${spatial.texturePageBreakdown.inFrustum} texture pages (${fmt(spatial.inFrustumBytes)})`,
                outFrustum: `${spatial.tileBreakdown.outFrustum} geometry tiles + ${spatial.texturePageBreakdown.outFrustum} texture pages (${fmt(spatial.outFrustumBytes)})`,
                near: fmt(spatial.nearBytes),
                mid: fmt(spatial.midBytes),
                far: fmt(spatial.farBytes),
            },
            tiles: {
                loaded: this.tiles.size,
                loadQueue: this.loadQueue.length,
                textureQueue: this.textureQueue.length,
                textureResultQueue: this.textureResultQueue.length,
                geometryRebuildQueue: this.geometryRebuildQueue.length,
                activeWorkers: this.activeWorkerCount,
                materialsTracked: this.materialsToUpdate.size,
                evictedTotal: this.cacheManager.evictionCount,
                evictedBytes: fmt(this.cacheManager.evictedBytes),
                redownloads: this.cacheManager.redownloadCount,
            },
            textureResidency: {
                identity: 'global-page',
                resident: residentTiers,
                active: activeTiers,
                desired: desiredTiers,
                loading: Array.from(this.textureStates.values())
                    .reduce((sum, state) => sum + state.loading.size, 0),
                queued: this.textureQueue.length,
                resultQueue: this.textureResultQueue.length,
                thresholdsPx: {
                    mediumEnter: TEXTURE_CONFIG.mediumEnterPx,
                    mediumExit: TEXTURE_CONFIG.mediumExitPx,
                    highEnter: this.highTextureEnterPx || TEXTURE_CONFIG.highEnterPx,
                    highExit: (this.highTextureEnterPx || TEXTURE_CONFIG.highEnterPx) * 0.75,
                },
                maxTextureSize: this.texStats.maxTextureSize,
                highSourceSize: this.texStats.highSourceSize,
                highUploadSize: this.texStats.highUploadSize,
                highSkippedTopMips: this.texStats.highSkippedTopMips,
            },
            failures: {
                manifest: {
                    finalFailures: this.failureStats.manifestFailures,
                    attemptsUsed: manifestRetry.attempts,
                    exhausted: manifestRetry.exhausted,
                },
                tiles: {
                    failed: this.failedTiles.size,
                    finalFailures: this.failureStats.tileFailures,
                },
                textures: {
                    failed: this.failedTextures.size,
                    finalFailures: this.failureStats.textureFailures,
                    errorCount: this._texErrorCount,
                },
                recoverableSweeps: {
                    pending: Array.from(this.recoverableResweeps.pending),
                    scheduled: this.failureStats.recoverableSweepsScheduled,
                    run: this.failureStats.recoverableSweepsRun,
                },
                workers: {
                    pendingJobs: this.pendingJobs.size,
                    watchdogTimeouts: this.failureStats.workerTimeouts,
                    respawns: this.failureStats.workerRespawns,
                    failedJobs: this.failedWorkerJobs.size,
                    finalFailures: this.failureStats.workerFailedJobs,
                },
                context: {
                    lost: this.failureStats.contextLost,
                    restored: this.failureStats.contextRestored,
                    recoveryFailures: this.failureStats.contextRecoveryFailures,
                    recovering: this.contextRecovery.active,
                },
                globalErrors: this.failureStats.globalErrors,
                unhandledRejections: this.failureStats.unhandledRejections,
            },
            visibilityPlanner: this.visibilityPlanStats || null,
            texturePagePlanner: this.texturePagePlanStats || null,
            geometryFrontier: this.geometryFrontierStats || null,
            violations: this._perfViolationCount,
            allocationCount: this.vramLedger.entries.size + this.vramLedger.textureEntries.size,
            geometryAllocationCount: this.vramLedger.entries.size,
            texturePageAllocationCount: this.vramLedger.textureEntries.size,
            movingLod: this.getMovingLodDebugStats(),
        };
    }

    getMovingLodDebugStats() {
        let residentCaps = 0;
        for (const tile of this.tiles.values()) {
            const group = tile.mesh?.children?.find(
                g => g.userData.gosperLevel === this.movingLevel);
            if (group?.visible && group.children[0]?.visible) {
                residentCaps += group.children[0].count;
            }
        }
        const manifestTiles = this.manifest?.tiles?.length || 0;
        const fallbackTiles = Math.max(0, manifestTiles - this.tiles.size);
        return {
            active: this.isMovingView,
            level: this.movingLevel,
            flatToFlatMeters: +G.levelSize(this.movingLevel).toFixed(3),
            residentCaps,
            fallbackTiles,
            fallbackCaps: this.movingHorizonMesh?.visible
                ? fallbackTiles * (this.movingHorizonChildrenPerTile || 0) : 0,
            settledHorizonVisible: !!this.horizonMesh?.visible,
            movingHorizonVisible: !!this.movingHorizonMesh?.visible,
            visibleLevels: this.isMovingView ? [this.movingLevel] : 'settled-multi-lod',
        };
    }

    animate(nowFromScheduler = performance.now()) {
        this._frameCounter++;

        // --- BACKGROUND MAINTENANCE ---
        track('processInstantiationQueue', () => this.processInstantiationQueue());
        track('processTextureResults', () => this.processTextureResults());
        track('processQueues', () => this.processQueues());

        const now = nowFromScheduler;

        // Disable damping when not actively interacting to prevent momentum in
        // settled mode. Wheel start/change/end may all have completed already;
        // CameraMotionLatch carries that motion through this rendered frame.
        this.controls.enableDamping = this.isUserInteracting;
        const moved = this.controls.update();
        writeCameraPose(this.camera, this.controls.target, this.observedCameraPose);
        if (cameraPoseChanged(this.lastObservedCameraPose, this.observedCameraPose)) {
            // Event-independent safety net for wheel, pinch, pan, orbit, and
            // programmatic controls mutations. enterMotion is idempotent, so
            // an earlier start/wheel event does not advance the epoch twice.
            this.notifyCameraMotion(now);
        }

        // Camera pitch affects presentation and telemetry, not the moving LOD contract.
        const angle = this.controls.getPolarAngle() * 180 / Math.PI;
        const flat = angle < 5.5;
        const h = this.syncHeightFactorFromControls(angle);
        const movingAtFrameStart = this.isMovingView;
        const renderedMovingView = this.wasMovingView;
        const effectiveMotion = this.cameraMotion.sample({ now });
        if (!effectiveMotion && this.isMovingView) {
            // Only rAF owns the quiet-window moving -> settled edge.
            this.isMovingView = false;
        }
        // --- DERIVE ENGINE STATE ---
        this.engineState = this.deriveEngineState(flat);
        // The first no-motion frame is also the moving -> settled swap frame.
        // Keep it from taking the STATIC early-return before horizon, skirt,
        // and resident-level visibility have been restored.
        if (movingAtFrameStart && !this.isMovingView) {
            this.needsRender = true;
            this.needsLODUpdate = true;
            this._beginGeometryMode(false);
            this._runRecoverableResweep();
        }

        // Camera state, terrain floor, and clearance all affect the adapter's
        // world-space bounds/projection. Apply them before the frustum plan so
        // this frame cannot classify stale geometry.
        if (this.isMovingView) {
            this.needsLODUpdate = true;
        } else if (movingAtFrameStart) {
            // The exact settled frontier is planned immediately; individual
            // tiles remain uniform L3 until their matching build commits.
            this.needsLODUpdate = true;
        }

        const floorBeforeVisibility = this.floorState.value;
        const cameraYBeforeVisibility = this.camera.position.y;
        this.updateFloorState(h);
        this.maintainCameraAltitudeDuringAnimation(h);
        writeCameraPose(this.camera, this.controls.target, this.lastObservedCameraPose);
        if (this.floorState.value !== floorBeforeVisibility ||
            this.camera.position.y !== cameraYBeforeVisibility) {
            this.needsLODUpdate = true;
            this.needsRender = true;
        }

        // NOW update LOD (after all-camera moving state is set)
        const camDist = this.camera.position.distanceTo(this.lastLODCamPos);
        if (camDist > 50 || this.needsLODUpdate || !this.loaderHidden) {
            track('updateLOD', () => this.updateLOD());
            if (camDist > 50) this.lastLODCamPos.copy(this.camera.position);
            this.needsLODUpdate = false;
        }

        // Queue/loading state can change without a successful transcode. Keep
        // startup telemetry live even on an otherwise idle render tick; after
        // the loader closes, render frames and texture callbacks own updates.
        if (!this.loaderHidden) this._updateTexBadge();

        // --- RENDER CHECK ---
        // STATIC state: must NOT render. Early-out if nothing moved and no flags set.
        const willRender = moved || this.needsRender;
        this.profiler?.frame(now, this.engineState, willRender);
        this.updateFps(now, willRender);
        if (!willRender) return { active: this._schedulerHasWork() };

        // ===== BEGIN TIMED RENDER CYCLE =====
        const cycleStart = performance.now();

        this.updateRenderStats(now);
        this.updateFrametimeGraph();

        // --- VISIBILITY PASS ---
        // No flat-plane swap (top-down 2D is just the flattened caps via
        // uHeightFactor) and no per-band group toggling (the CDLOD cut is
        // per-instance in the vertex shader). The only toggle left: aggregate
        // skirts render when settled, hide while moving (large skirtless
        // caps = the fast panning mode).
        if (renderedMovingView !== this.isMovingView) {
            if (this.horizonMesh) this.horizonMesh.visible = !this.isMovingView;
            if (this.movingHorizonMesh) this.movingHorizonMesh.visible = this.isMovingView;
        }

        this.wasMovingView = this.isMovingView;

        // --- MATERIAL UNIFORM UPDATE ---
        this.computeLodRadii();
        this.updateLevelVisibility(h);
        this._updateTexBadge();
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
                    const k = m.userData.lodIdx;
                    if (m.userData.forceMovingMode && k === this.movingLevel) {
                        // Uniform panning level: force the cut fully open so
                        // every instance of this level draws at all distances.
                        m.userData.shader.uniforms.uLodRadii.value.set(0.0, 1e12);
                        m.userData.shader.uniforms.uFinestBuilt.value = 1.0;
                    } else {
                        // Gosper level k: band = (R(k-1), R(k)], parent checked
                        // against R(k). The finest BUILT level ignores the near
                        // edge so coverage holds while an exact frontier builds.
                        const minD = (k <= 0) ? 0.0 : this.lodRadii[k - 1];
                        const maxD = this.lodRadii[k];
                        m.userData.shader.uniforms.uLodRadii.value.set(minD, maxD);
                        m.userData.shader.uniforms.uFinestBuilt.value = m.userData.isFinest ? 1.0 : 0.0;
                    }
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
                if (needsUpdateCount > 0) culprits.push(`mat-recompile:${needsUpdateCount}`);
                const recentUpgrades = this.recentlyUpgradedTextures.filter(u => now - u.time < 50);
                if (recentUpgrades.length > 0) culprits.push(`tex-upgrade:${recentUpgrades.length}`);
                this.recentlyUpgradedTextures = recentUpgrades.slice(-3);
                if (this.geometryRebuildQueue.length > 0) {
                    culprits.push(`geometry-rebuild-queue:${this.geometryRebuildQueue.length}`);
                }
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

        this.needsRender = false;
        return { active: this._schedulerHasWork() };
    }

    _schedulerHasWork() {
        // Work is event-driven: worker messages, resize/input, and the one
        // motion-settle deadline wake us.  Never keep rAF alive merely to
        // inspect an already settled scene.
        return this.isMovingView || !this.loaderHidden || this.needsRender
            || this.needsLODUpdate || this.instantiateQueue.length > 0
            || this.textureResultQueue.length > 0;
    }
}

new PistonViewer();
initBenchmark(window.pistonViewer, APP_VERSION);
