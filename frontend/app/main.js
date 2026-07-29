// @atlas: PistonViewer orchestrator for GSP1/GSP2/current GSP3 Gosper islands. GSP2+ uses generic-frustum L3 range selection and deferred geometry; GSP3 supplies exact rendered subtree bounds while older versions remain safe migration paths.
import * as THREE from 'three';
import { MapControls } from 'three/addons/controls/MapControls.js';
import { HexSearch } from './search.js';
import { LoadingScreen } from './loading_screen.mjs';
import { setDisclosure, setPanelMinimized, setPressedButton, toggleDisclosure } from './ui_accessibility.js';
import { VRAMLedger } from './vram_ledger.js';
import { CacheManager } from './cache_manager.js';
import {
    detectCapabilityProfile,
    persistContextLoss,
    readPersistedContextLosses,
} from './capability_profile.js';
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
    TIER_STATE,
    TexturePageResidency,
    isTier,
    setTierState,
    desiredTextureTier,
    pruneTextureDispatchQueue,
    promoteVisibleConsumerPages,
    selectTextureDispatchTaskIndex,
    textureStateHasDemand,
    textureTierRequestPlan,
    highAdmissionRetryReady,
    BOOTSTRAP_GPU_BYTES_PER_PAGE,
    BOOTSTRAP_MAX_RESIDENT_BYTES,
    BOOTSTRAP_PAGE_SIZE_PX,
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
} from './touch_gesture.js';
import {
    commitIfChanged,
    normalizedWheelPixels,
    resolveNavigationKey,
    shouldHandleNormalizedPinch,
    supportsDesktopGestureEvents,
} from './desktop_navigation.js';
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
    MAX_TEXTURE_DECODERS,
    WORKER_LANE,
    cancelStaleViewTasks,
    workerLaneForJob,
    workerLaneSizes,
} from './worker_lanes.js';
import {
    applyRenderResolution,
    bindSharedLodInstanceAttributes,
    createGeometryWithSharedStaticBuffers,
    createSharedLodInstanceAttributes,
    disposeGeometryWithSharedStaticBuffers,
    rendererOptionsForLocation,
    renderDprCapForLocation,
    staticBufferSharingStats,
    watchDevicePixelRatio,
} from './render_policy.js';
import { IdleRenderScheduler } from './idle_render_scheduler.js';
import { createMaterialChurnStats, recordRenderCycle, snapshotMaterialChurnStats, writeUniformIfChanged } from './material_churn.mjs';
import { APP_LIFECYCLE, AppLifecycle } from './app_lifecycle.mjs';
import { ResourceLifecycleRegistry } from './resource_lifecycle.mjs';
import './gosper_core.js';
import { navigationOverlayState } from './navigation_overlay.mjs';
import {
    SIDECAR_VERTEX_DECLARATIONS,
    SIDECAR_VERTEX_FETCH,
    SIDECAR_FRAGMENT_DECLARATIONS,
    SIDECAR_FRAGMENT_TINT,
} from './sidecar_shader.mjs';
import { createSidecarAtlas, createSidecarLut } from './sidecar_atlas.mjs';
import {
    parseSidecarIndex,
    parseSidecarBody,
    buildPyramid,
    coverageHas,
    epochHourToUrl,
    crc32,
    manifestHashMatches,
} from './sidecar_format.mjs';
import {
    isTapGesture,
    pickGroundCell,
    resolveHexAddress,
    hexRingPositions,
} from './hex_pick.mjs';
import { PowfinderPopup, readAllLayers, buildPopupViewModel } from './powfinder_popup.mjs';

const G = window.GosperCore;
const TILE_WORKER_URL = typeof __TILE_WORKER_URL__ === 'string'
    ? __TILE_WORKER_URL__
    : './tile_worker.js';

// --- ENGINE STATE MACHINE & PERFORMANCE MONITORING ---
const APP_VERSION = 'v0.10.0-rc6';
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

// Three deterministic KTX2 imagery tiers. Green and blue are durable session
// fallbacks; pink is selected only by 3D camera distance.
const TEXTURE_TIER = PAGE_TEXTURE_TIER;
const TEXTURE_RANK = PAGE_TEXTURE_RANK;
const TEXTURE_CONFIG = Object.freeze({
    highEnterDistanceM: 2000,
    highExitDistanceM: 2500, // 25% outward downgrade hysteresis
    maxTextureJobs: 2,
    maxUploadsPerFrame: 1,
    // 64px RGBA pages are 16 KiB each. Keep a strict 1 MiB ceiling so a
    // larger production manifest cannot turn first-paint placeholders into a
    // stealth VRAM residency pool.
    bootstrapBudgetBytes: BOOTSTRAP_MAX_RESIDENT_BYTES,
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
        this.renderDprCap = renderDprCapForLocation(window.location.search, window.devicePixelRatio);
        this.renderPixelRatio = applyRenderResolution(this.renderer, {
            width: window.innerWidth,
            height: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio,
            maxDpr: this.renderDprCap,
        });
        this.container.appendChild(this.renderer.domElement);
        this.appLifecycle = new AppLifecycle();
        this.resourceLifecycles = new ResourceLifecycleRegistry();
        this.resourceLifecycles.ensure('manifest', 'tile_manifest.json');
        this.contextRecovery = {
            active: false,
            timer: null,
            wasLoaderHidden: false,
            resumeLifecycleState: null,
            startedAt: null,
            restoredAt: null,
            durationMs: null,
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
        this.defaultViewPose = null;
        this.initDesktopNavigation();

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
        this.manifestCrc32 = null; // set by _loadManifestWithRetry; see the PowFinder self-disable guard
        this.tileStates = new Map(); // key -> 'loading' | 'failed'
        this.loadQueue = [];
        this.geometryRebuildQueue = [];
        this.geometryPlanEpoch = 0;
        this.viewEpoch = 0;
        this.workerDispatchSequence = 0;
        this.textureDispatchSequence = 0;
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
        this.loadingScreen = new LoadingScreen({ heroHoldMs: 900 });
        // Boot-time plan accounting for the honest progress phase. Only fed
        // while the loader is visible; cleared on every init retry. Texture
        // classes stay separate so per-class byte weighting stays honest.
        this._bootPlannedTerrain = new Set();
        this._bootPlannedBootstrap = new Set();
        this._bootPlannedKtx2 = new Set();
        this.loadingScreen.setOffline(navigator.onLine === false);
        window.addEventListener('offline', () => {
            if (!this.loaderHidden) this.loadingScreen.setOffline(true);
        });
        window.addEventListener('online', () => {
            if (!this.loaderHidden) this.loadingScreen.setOffline(false);
        });
        this.materialsToUpdate = new Set(); // Changed to Set
        this.materialChurn = createMaterialChurnStats();
        // These values are frame-global. Every shader references the same
        // uniform objects, so a camera move is one Vector3 copy rather than a
        // traversal and copy for every material in every resident tile.
        this.sharedMaterialUniforms = {
            heightFactor: { value: 0.0 },
            floorOffset: { value: 0.0 },
            cameraPos: { value: new THREE.Vector3() },
            gradientMode: { value: 1.0 },
            movingLodRadii: { value: new THREE.Vector2(0.0, 1e12) },
            lodRadii: Array.from({ length: TILE_LEVEL + 1 }, () => ({
                value: new THREE.Vector2(0.0, 1e9),
            })),
            // PowFinder sidecar uniforms (design doc §2.1). Declared here so
            // P1.3 (the atlas) does not also touch this object — P1.2 owns
            // this one addition. sidecarGeom.x (atlas width) is a fixed
            // architectural constant (design doc §1.5); sidecarTexel.y
            // (1/atlasHeight) depends on tileCount and is a placeholder
            // until P1.3 builds the real atlas and overwrites it — harmless
            // in the meantime since uSidecarValid defaults to 0 per tile,
            // so the fetch this feeds is never reached. sidecarRamp.y (ramp
            // row count) mirrors sidecar_colormap.mjs's RAMP_COUNT as a
            // literal rather than an import, to keep this task's main.js
            // footprint to exactly this block; test/sidecar_shader.test.mjs
            // asserts the two stay in sync.
            sidecarAtlas: { value: null },
            sidecarLut: { value: null },
            sidecarTexel: { value: new THREE.Vector2(1 / 1024, 1) },
            sidecarGeom: { value: new THREE.Vector2(1024, 1 / 1024) },
            sidecarChannel: { value: new THREE.Vector4(1, 0, 0, 0) },
            sidecarOverlay: { value: new THREE.Vector4(0, 0, 0, 0) },
            sidecarRamp: { value: new THREE.Vector2(0, 8) },
            sidecarMode: { value: 0.0 },
            sidecarMix: { value: new THREE.Vector2(0, 0) },
            sidecarOpacity: { value: 0.72 },
        };
        this.bootstrapDiagnostics = { firstConsumer: null, matchingInstalls: [] };
        this.bootstrapPhaseActive = true;
        const faultParams = new URLSearchParams(window.location.search);
        this.faultGateEnabled = faultParams.get('bench') === '1' && faultParams.get('fault-gate') === '1';
        this.faultGateDiagnostics = {
            terrain: { attempts: new Map(), dropped: new Set(), successful: new Set() },
            texture: { attempts: new Map(), dropped: new Set(), successful: new Set() },
        };
        this.faultGateSequences = { terrain: 0, texture: 0 };

        this.gradientMode = 1.0;
        this.highTextureDistanceM = TEXTURE_CONFIG.highEnterDistanceM;
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
        this.distanceScaleBarEl = document.getElementById('distance-scale-bar');
        this.distanceScaleLabelEl = document.getElementById('distance-scale-label');
        this.compassNeedleEl = document.getElementById('compass-needle');
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
        this.capabilityProfile = detectCapabilityProfile();
        this.workerLanes = { geometry: [], texture: [] };
        this.nextWorkerIdx = { geometry: 0, texture: 0 };
        this.pendingJobs = new Map(); // ID -> {resolve, reject}
        this.jobIdCounter = 0;
        this.workerScriptUrl = TILE_WORKER_URL;
        this.workerWatchdog = new WorkerWatchdogBookkeeper();
        this.workerWatchdogTimer = null;
        this.workerLaneStats = {
            geometry: { workers: 0, dispatched: 0, completed: 0, cancelledQueued: 0 },
            texture: { workers: 0, dispatched: 0, completed: 0, cancelledQueued: 0, decoderCap: MAX_TEXTURE_DECODERS },
        };
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
            firstTextureHeapBytes: null,
        };
        this._textureMilestonesDone = false;
        this._updateTexBadge(); // seed the on-screen "TEX · loading..." badge immediately

        // --- INFRASTRUCTURE: Telemetry & Cache Authority ---
        this.vramLedger = new VRAMLedger();
        this.cacheManager = new CacheManager(this.capabilityProfile.textureBudgetBytes);

        this.initTouchMomentumTracking();

        // PowFinder (design doc §1.7/§6 P1.3). The colour-ramp LUT needs no
        // manifest, so it's built eagerly, right here. The pyramid atlas
        // needs manifest.tiles for slot assignment, and the manifest hasn't
        // loaded yet this early (initWorld() below is async) — so the atlas
        // is created lazily, on the first instantiateTile() call, once
        // this.manifest is guaranteed populated. `sqhPyramid`/
        // `fetchInFlight` let a fixture arriving before or after the first
        // resident tile both end up painted correctly — see instantiateTile
        // and _loadPowfinderFixture below. hasPendingWork feeds
        // _schedulerHasWork() so the idle scheduler doesn't sleep through a
        // fixture fetch still in flight.
        this.sharedMaterialUniforms.sidecarLut.value = createSidecarLut(THREE);
        this.powfinder = {
            atlas: null,
            sqhPyramid: null,
            fetchInFlight: true,
            // Set true, permanently for the session, by the manifest
            // self-disable guard in _loadPowfinderFixture (design doc §6
            // P2.5 amendment) on a sidecar/manifest CRC32 mismatch. Future
            // sidecar consumers (P2.1's store) should check this before
            // installing anything into the atlas.
            disabled: false,
            hasPendingWork: () => this.powfinder.fetchInFlight,
        };
        this._loadPowfinderFixture();

        // PowFinder tap-a-hex pick (design doc §3.4 / §6 P2.4). Same tap-vs-
        // drag threshold pattern as initTouchMomentumTracking above: a
        // pointerdown -> pointerup pair under 8px/300ms, with MapControls
        // not mid-gesture, is a tap; anything else is left to MapControls.
        // Attached to the canvas only (not window/document), so tapping any
        // other UI chrome never triggers a pick. The `controls` 'start' and
        // window `keydown` listeners below are *additional* listeners on
        // top of the ones already registered earlier in this constructor —
        // not edits to them — and exist only to dismiss an open popup on
        // map pan / Escape, per §3.4's "Sheet dismisses on ... map pan, or
        // Escape".
        this._powfinderPickDown = null;
        this.renderer.domElement.addEventListener('pointerdown', (event) => {
            if (event.pointerType === 'mouse' && event.button !== 0) return;
            this._powfinderPickDown = { x: event.clientX, y: event.clientY, t: performance.now() };
        }, { passive: true });
        this.renderer.domElement.addEventListener('pointerup', (event) => {
            const down = this._powfinderPickDown;
            this._powfinderPickDown = null;
            if (!down || this.isUserInteracting) return;
            const tapped = isTapGesture({
                dx: event.clientX - down.x,
                dy: event.clientY - down.y,
                durationMs: performance.now() - down.t,
            });
            if (tapped) this.pickPowFinderCell(event.clientX, event.clientY);
        }, { passive: true });
        this.controls.addEventListener('start', () => { this.powfinder?.popup?.hide(); });
        window.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') this.powfinder?.popup?.hide();
        });

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

    // PowFinder "first light" (design doc §6 P1.3): loads ONE hardcoded
    // fixture hour of the SQH layer -- no store, no UI, no scrubbing, that
    // is P2.1's job. Reads frontend/app/powfinder_fixtures/ (gitignored,
    // generated by `node scripts/make_sidecar_fixtures.mjs` -- the same
    // "bake it locally first" pattern this repo already uses for
    // tiles_bin/aerial_pages, so a 404 here on a fresh checkout is expected,
    // not a bug). Picks the first hour index.json actually reports present,
    // rather than a hardcoded epoch number, so this keeps working across a
    // regenerated fixture season with different coverage.
    async _loadPowfinderFixture() {
        try {
            // this.manifest loads asynchronously in initWorld(), which is
            // kicked off right after this method — wait for it rather than
            // fetching a second copy. Bounded: give up after ~10s so a
            // manifest load failure elsewhere doesn't spin forever.
            for (let waited = 0; !this.manifest && waited < 10000; waited += 50) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            if (!this.manifest) throw new Error('manifest never loaded');

            const indexRes = await fetch('powfinder_fixtures/index.json');
            if (!indexRes.ok) throw new Error(`index.json ${indexRes.status}`);
            const index = parseSidecarIndex(await indexRes.json(), this.manifest);
            if (!index.ok) throw new Error(`fixture index rejected: ${index.reason}`);

            let epochHour = null;
            for (let slot = 0; slot < index.coverage.count; slot++) {
                const candidate = index.coverage.startEpochHour + slot * index.coverage.stepHours;
                if (coverageHas(index, candidate)) { epochHour = candidate; break; }
            }
            if (epochHour === null) throw new Error('fixture index has no present hours');

            const url = `powfinder_fixtures/${epochHourToUrl(index.urlTemplate, 'sqh', epochHour)}`;
            const pflRes = await fetch(url);
            if (!pflRes.ok) throw new Error(`${url} ${pflRes.status}`);
            const raw = new Uint8Array(await pflRes.arrayBuffer());
            const tileCount = this.manifest.tiles.length;
            const body = parseSidecarBody(raw, tileCount);
            if (!body.ok) throw new Error(`fixture body: ${body.reason}`);

            // Manifest self-disable guard (design doc §6 P2.5 amendment).
            // parseSidecarIndex's profile/tile-count checks above cannot see
            // a rebake that reorders tiles while keeping the same profile
            // string and count; the sidecar's own PFL1 header manifestHash
            // (the CRC32 the backend baked against) closes that door. A
            // mismatch means this sidecar and the resident terrain disagree
            // about tile order -- painting it would silently misalign every
            // tile's data by one slot. Loud, permanent, and terminal for the
            // session: PowFinder stays off and the app renders plain terrain
            // (§5.6's graceful-degradation contract), exactly as for a
            // missing/rejected index.json.
            if (!manifestHashMatches(body.header, this.manifestCrc32)) {
                this.powfinder.disabled = true;
                console.error(
                    `[powfinder] sidecar/manifest hash mismatch (sidecar manifestHash=${body.header.manifestHash}, `
                    + `fetched manifest crc32=${this.manifestCrc32}) — a rebake likely reordered tiles behind an `
                    + 'unchanged profile/tile-count; self-disabling PowFinder for this session.',
                );
                return;
            }
            if (this.powfinder.disabled) return; // an earlier fixture already tripped the guard this session

            const pyramid = buildPyramid(body.body, tileCount, 'mean');

            if (this.powfinder.atlas) {
                this.powfinder.atlas.installLayer('sqh', pyramid);
                // The atlas already exists, meaning tiles are already
                // resident — retroactively light up their materials rather
                // than waiting for a geometry rebuild that may never come.
                for (const [key, tile] of this.tiles) {
                    const slot = this.powfinder.atlas.slotFor(key);
                    if (slot === null) continue;
                    const rowBase = slot * this.powfinder.atlas.rowsPerTile;
                    const valid = this.powfinder.atlas.hasData(slot) ? 1 : 0;
                    this._applySidecarBinding(tile.material, rowBase, valid);
                    for (const cloned of tile.clonedMaterials || []) {
                        this._applySidecarBinding(cloned, rowBase, valid);
                    }
                }
                this.needsRender = true;
            } else {
                // No tile has instantiated yet — instantiateTile() installs
                // this into the atlas itself, the first time it creates one.
                this.powfinder.sqhPyramid = pyramid;
            }
        } catch (err) {
            // Expected on a fresh checkout without baked fixtures (see the
            // comment above) — never fatal, the app just renders plain
            // terrain, exactly like a missing index.json per design doc §5.6.
            console.warn('[powfinder] fixture load skipped:', err.message);
        } finally {
            this.powfinder.fetchInFlight = false;
            // design doc §1.7: "An async sidecar arrival must call
            // frameScheduler.wake('sidecar') or it will never paint."
            this.frameScheduler?.wake('sidecar');
        }
    }

    // PowFinder tap-a-hex pick + info popup (design doc §3.4 / §6 P2.4).
    // Ground-plane solve, address resolution, and value decoding all live in
    // hex_pick.mjs / powfinder_popup.mjs (pure, node-tested); this method is
    // only the THREE/DOM wiring the pointer listeners above call: build a
    // ray from the tap point, delegate the iterated pick + address lookup,
    // read whatever sidecar bytes are resident, and show the popup + ring.
    // The popup DOM binding and the ring mesh are built lazily on first use
    // so the constructor tail stays a plain listener-registration block.
    pickPowFinderCell(clientX, clientY) {
        if (!this.manifest || !this.tiles || !this.unitIndexMap || !this.manifestGrid) return;

        const rect = this.renderer.domElement.getBoundingClientRect();
        if (!(rect.width > 0) || !(rect.height > 0)) return;
        const ndc = {
            x: ((clientX - rect.left) / rect.width) * 2 - 1,
            y: -((clientY - rect.top) / rect.height) * 2 + 1,
        };
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(ndc, this.camera);

        const sample = pickGroundCell({
            ray: { origin: raycaster.ray.origin, direction: raycaster.ray.direction },
            sampleElevation: (x, z) => this.sampleTerrainSourceElevation(x, z),
            floor: this.floorState.value,
            heightFactor: this.heightFactor,
        });
        if (!sample || !Number.isFinite(sample.sourceElevation)) return;

        const address = resolveHexAddress({
            axial: sample.axial,
            tq: sample.tq,
            tr: sample.tr,
            tiles: this.tiles,
            unitIndexMap: this.unitIndexMap,
            atlasSlotFor: (key) => (this.powfinder.atlas ? this.powfinder.atlas.slotFor(key) : null),
        });
        if (!address) return;

        // Slope: mean of the tapped unit's three decoded edge slopes, the
        // same degrees-already convention driving the existing steepness
        // gradient shader (main.js's gradientColor()). Aspect is a
        // deliberate scope trim (design doc §7 non-goal escape valve: "ship
        // the popup without slope[/aspect] ... elevation, the layer values,
        // and the disclaimer are the load-bearing content") — this task has
        // no ground-truth reference to verify a derived compass bearing
        // against, and a wrong compass direction is worse than none in a
        // safety-adjacent popup.
        let slopeDeg = null;
        const decodedUnit = this.visibilityAdapter?.getDecodedUnit?.(address.tileKey);
        if (decodedUnit?.s1 && address.unitIdx < decodedUnit.s1.length) {
            slopeDeg = (decodedUnit.s1[address.unitIdx] + decodedUnit.s2[address.unitIdx] + decodedUnit.s3[address.unitIdx]) / 3;
        }

        // readAllLayers implements the design doc's P2.1 store `readAll(slot,
        // address)` shape against whatever PowFinder pyramids are actually
        // resident right now — currently just `sqh` (P1.3's single-fixture
        // stopgap; P2.1's real store lands separately and slots in here with
        // no interface change, only more non-null entries in `pyramids`).
        const layers = readAllLayers({
            pyramids: { sqh: this.powfinder.sqhPyramid },
            slot: address.slot,
            address: address.address,
        });
        const viewModel = buildPopupViewModel({ elevationM: sample.sourceElevation, slopeDeg, layers });

        if (!this.powfinder.popup) {
            const mount = document.getElementById('powfinder-popup');
            if (!mount) return;
            this.powfinder.popup = new PowfinderPopup({ document, mount });
        }
        this.powfinder.popup.show(viewModel);

        // Highlight ring: L1 node centre (design doc §3.4), scaled to the L1
        // flat-to-flat size (16.93 m). Positioned with the exact same
        // offsets()/axialToWorld() primitives GosperVisibilityAdapter itself
        // uses for node centres, plus the tile's own scene origin
        // (manifestGrid.lx/lz, set once in initWorld) — no private adapter
        // state touched, no new main.js import beyond what's already here.
        const off = G.offsets(TILE_LEVEL);
        const repUnit = address.l1Index * 7;
        const repDq = off[repUnit * 2];
        const repDr = off[repUnit * 2 + 1];
        const [rwx, rwy] = G.axialToWorld(repDq, repDr);
        const manifestTile = this.manifestGrid.get(address.tileKey);
        if (manifestTile) {
            const tile = this.tiles.get(address.tileKey);
            const repUnitIdx = this.unitIndexMap.get(((repDq + 128) << 8) | (repDr + 128));
            const repElevation = (repUnitIdx !== undefined && tile?.unitHeights)
                ? tile.unitHeights[repUnitIdx]
                : sample.sourceElevation;
            const ringX = manifestTile.lx + rwx;
            const ringZ = manifestTile.lz - rwy;
            const radius = G.levelSize(1) / Math.sqrt(3); // L1 circumradius, ~9.78 m
            const positions = hexRingPositions({ centerX: ringX, centerZ: ringZ, radius });

            if (!this.powfinder.pickRing) {
                const geometry = new THREE.BufferGeometry();
                geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
                const material = new THREE.ShaderMaterial({
                    // uHeightFactor/uFloorOffset are the *same* shared
                    // uniform objects animate() already writes every frame
                    // (writeUniformIfChanged(this.sharedMaterialUniforms.
                    // heightFactor/.floorOffset, ...)) — reusing them by
                    // object identity is how this ring "follows the piston
                    // when tilting" with zero new per-frame update code
                    // (design doc §0.7's established shared-uniform pattern).
                    uniforms: {
                        uHeightFactor: this.sharedMaterialUniforms.heightFactor,
                        uFloorOffset: this.sharedMaterialUniforms.floorOffset,
                        uBaseElevation: { value: repElevation },
                        uColor: { value: new THREE.Color(0xff6b9d) },
                    },
                    vertexShader: `
                        uniform float uHeightFactor;
                        uniform float uFloorOffset;
                        uniform float uBaseElevation;
                        void main() {
                            vec3 pos = position;
                            pos.y = (uBaseElevation - uFloorOffset) * uHeightFactor;
                            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                        }
                    `,
                    fragmentShader: `
                        uniform vec3 uColor;
                        void main() { gl_FragColor = vec4(uColor, 1.0); }
                    `,
                    depthTest: false,
                    transparent: true,
                });
                this.powfinder.pickRing = new THREE.LineLoop(geometry, material);
                this.powfinder.pickRing.renderOrder = 999;
                // The vertex shader displaces Y by up to a piston's worth of
                // metres; the geometry's raw (undisplaced, y=0) bounding
                // sphere is not a safe proxy for on-screen visibility, the
                // same reasoning the shared LOD instances are frustumCulled
                // = false for (design doc §0.4 / §3.4's own picking section).
                this.powfinder.pickRing.frustumCulled = false;
                this.scene.add(this.powfinder.pickRing);
            } else {
                this.powfinder.pickRing.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
                this.powfinder.pickRing.material.uniforms.uBaseElevation.value = repElevation;
            }
            this.powfinder.pickRing.visible = true;
        }

        this.needsRender = true;
        this.frameScheduler?.wake('sidecar');
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

    initDesktopNavigation() {
        const canvas = this.renderer.domElement;
        const commitMotion = (changed) => commitIfChanged(changed, () => {
            this.camera.lookAt(this.controls.target);
            this.controls.update();
            this.needsRender = true;
            this.notifyCameraMotion(performance.now());
            this.viewState?.commitViewChange();
        });

        window.addEventListener('keydown', (event) => {
            const action = resolveNavigationKey(event);
            if (!action) return;
            event.preventDefault();
            commitMotion(this.applyDesktopNavigationAction(action));
        });

        // Chromium and Firefox expose trackpad pinch as ctrl+wheel. Normalize
        // deltaMode here because their pixel/line units otherwise feel wildly
        // different. This capture listener is scoped to the canvas and consumes
        // only pinch-shaped wheel events; ordinary wheel zoom stays MapControls.
        canvas.addEventListener('wheel', (event) => {
            if (!shouldHandleNormalizedPinch(event, navigator)) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            const pixels = normalizedWheelPixels(event, canvas.clientHeight || window.innerHeight);
            commitMotion(this.dollyDesktop(Math.exp(pixels * 0.002)));
        }, { capture: true, passive: false });

        // Safari's desktop GestureEvent is the only web API that exposes twist.
        // iOS/iPadOS is excluded by supportsDesktopGestureEvents, leaving the
        // existing PointerEvent two-finger implementation byte-for-byte intact.
        if (supportsDesktopGestureEvents(window, navigator)) {
            let previousScale = 1;
            let previousRotation = 0;
            canvas.addEventListener('gesturestart', (event) => {
                previousScale = event.scale || 1;
                previousRotation = event.rotation || 0;
                event.preventDefault();
            }, { passive: false });
            canvas.addEventListener('gesturechange', (event) => {
                event.preventDefault();
                const scale = event.scale || previousScale;
                const rotation = event.rotation || previousRotation;
                const zoomChanged = this.dollyDesktop(previousScale / scale);
                const yawChanged = this.yawDesktop((rotation - previousRotation) * Math.PI / 180);
                previousScale = scale;
                previousRotation = rotation;
                commitMotion(zoomChanged || yawChanged);
            }, { passive: false });
        }
    }

    applyDesktopNavigationAction(action) {
        if (action === 'reset') return this.resetDefaultView();
        if (action === 'zoom-in') return this.dollyDesktop(0.82);
        if (action === 'zoom-out') return this.dollyDesktop(1.22);

        const distance = this.camera.position.distanceTo(this.controls.target);
        const step = Math.max(25, distance * 0.08);
        const forward = new THREE.Vector3(
            this.controls.target.x - this.camera.position.x,
            0,
            this.controls.target.z - this.camera.position.z,
        );
        if (forward.lengthSq() < 1e-8) forward.set(0, 0, -1);
        forward.normalize();
        const right = new THREE.Vector3(-forward.z, 0, forward.x);
        const delta = action === 'pan-forward' ? forward
            : action === 'pan-back' ? forward.multiplyScalar(-1)
                : action === 'pan-right' ? right : right.multiplyScalar(-1);
        delta.multiplyScalar(step);
        this.camera.position.add(delta);
        this.controls.target.add(delta);
        return true;
    }

    dollyDesktop(factor) {
        if (!Number.isFinite(factor) || factor <= 0) return false;
        const offset = this.camera.position.clone().sub(this.controls.target);
        const distance = offset.length();
        const nextDistance = Math.max(this.controls.minDistance,
            Math.min(this.controls.maxDistance, distance * factor));
        if (!Number.isFinite(distance) || distance < 1e-8 || Math.abs(nextDistance - distance) < 1e-6) return false;
        this.camera.position.copy(this.controls.target).add(offset.multiplyScalar(nextDistance / distance));
        return true;
    }

    yawDesktop(radians) {
        if (!Number.isFinite(radians) || Math.abs(radians) < 1e-5) return false;
        const offset = this.camera.position.clone().sub(this.controls.target);
        offset.applyAxisAngle(this.controls.up || new THREE.Vector3(0, 1, 0), radians);
        this.camera.position.copy(this.controls.target).add(offset);
        return true;
    }

    captureDefaultView() {
        this.defaultViewPose = {
            camera: this.camera.position.clone(),
            target: this.controls.target.clone(),
        };
    }

    resetDefaultView() {
        if (!this.defaultViewPose) return false;
        this.camera.position.copy(this.defaultViewPose.camera);
        this.controls.target.copy(this.defaultViewPose.target);
        this.bootstrapVisibilityFloor?.(this.controls.target);
        return true;
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
        const sizes = workerLaneSizes(this.capabilityProfile.workerCount);
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

        for (const lane of [WORKER_LANE.GEOMETRY, WORKER_LANE.TEXTURE]) {
            for (let laneIndex = 0; laneIndex < sizes[lane]; laneIndex++) {
                const index = this.workers.length;
                this.workerLanes[lane].push(index);
                this.workers.push(this._createWorker(index, lane));
            }
            this.workerLaneStats[lane].workers = sizes[lane];
        }
    }

    _createWorker(index, lane = this._workerLaneForIndex(index)) {
        const worker = new Worker(this.workerScriptUrl);
        worker.onmessage = (e) => this.handleWorkerMessage(e);
        worker.onerror = (e) => {
            console.warn(`[WORKER_ERROR] ${index}: ${e.message || 'unknown worker error'}`);
        };
        // Worker does not reply to INIT — fire and forget.
        // NB: must use the same {type, data} envelope as every other worker
        // message — the worker destructures e.data.data.
        worker.postMessage({
            type: 'INIT',
            // Bootstrap WebP is the first-paint path. Compiling the ~1 MB
            // Basis module at worker startup contends with its decode and
            // defeats that purpose; the first KTX2 request initializes Basis
            // lazily after bootstrap work has been dispatched.
            data: {
                support: this.textureSupport,
                prewarmBasis: false,
                faultGateEnabled: this.faultGateEnabled,
            },
        });
        return worker;
    }

    _workerLaneForIndex(index) {
        return this.workerLanes.texture.includes(index) ? WORKER_LANE.TEXTURE : WORKER_LANE.GEOMETRY;
    }

    _restartWorker(index, reason) {
        this.workers[index]?.terminate();
        this.workers[index] = this._createWorker(index, this._workerLaneForIndex(index));
        this.failureStats.workerRespawns++;
        this.log(`Worker ${index} restarted: ${reason}`, 'error');
    }

    handleWorkerMessage(e) {
        const { id, type, event, status, result, error } = e.data;
        if (type === 'FAULT_GATE_EVENT') {
            this._recordFaultGateEvent(event);
            return;
        }
        const job = this.pendingJobs.get(id);
        if (!job) return;

        this.pendingJobs.delete(id);
        this.workerWatchdog.complete(id);
        this.workerLaneStats[job.lane].completed++;

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
                lane: workerLaneForJob(type),
            };
            this.pendingJobs.set(id, job);

            const laneWorkers = this.workerLanes[job.lane];
            const laneIndex = this.nextWorkerIdx[job.lane];
            const workerIndex = laneWorkers[laneIndex];
            this.nextWorkerIdx[job.lane] = (laneIndex + 1) % laneWorkers.length;

            this._postPendingWorkerJob(job, workerIndex);
        });
    }

    _recordFaultGateEvent(event) {
        if (!this.faultGateEnabled || !event?.url) return;
        const row = this.faultGateDiagnostics[event.kind];
        if (!row) return;
        if (event.action === 'attempt') {
            row.attempts.set(event.url, Math.max(row.attempts.get(event.url) || 0, event.attempt || 1));
        } else if (event.action === 'dropped') {
            row.dropped.add(event.url);
        } else if (event.action === 'success') {
            row.successful.add(event.url);
        }
    }

    getFaultGateDiagnostics() {
        const output = {};
        for (const kind of ['terrain', 'texture']) {
            const row = this.faultGateDiagnostics[kind];
            const attemptsByResource = Object.fromEntries(
                Array.from(row.attempts.entries()).sort(([a], [b]) => a.localeCompare(b)),
            );
            output[kind] = {
                uniqueResources: row.attempts.size,
                droppedFirstAttempts: row.dropped.size,
                requestAttempts: Array.from(row.attempts.values()).reduce((sum, count) => sum + count, 0),
                attemptsByResource,
                droppedResources: Array.from(row.dropped).sort(),
                successfulResources: Array.from(row.successful).sort(),
            };
        }
        return output;
    }

    _faultGateDrop(kind, attempt) {
        if (!this.faultGateEnabled || attempt !== 1) return false;
        this.faultGateSequences[kind]++;
        return this.faultGateSequences[kind] % 10 === 0;
    }

    _workerJobResourceKey(type, data) {
        if (type === 'LOAD_TILE' || type === 'BUILD_GEOMETRY') return `${data.yq}_${data.yr}`;
        if (type === 'LOAD_TEXTURE') return (data.urls || []).join(',');
        return type;
    }

    _postPendingWorkerJob(job, workerIndex, { scheduleWatchdog = true } = {}) {
        job.workerIndex = workerIndex;
        this.workerLaneStats[job.lane].dispatched++;
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
        this.contextRecovery.resumeLifecycleState = this.appLifecycle.state;
        this.contextRecovery.startedAt = performance.now();
        this.contextRecovery.restoredAt = null;
        this.contextRecovery.durationMs = null;
        this.appLifecycle.transition(APP_LIFECYCLE.CONTEXT_LOST, { cause: 'webglcontextlost' });
        this.resourceLifecycles.contextLost({ cause: 'webglcontextlost' });
        this.failureStats.contextLost++;
        persistContextLoss(localStorage, readPersistedContextLosses(localStorage));
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
        this.contextRecovery.restoredAt = performance.now();
        this.contextRecovery.durationMs = this.contextRecovery.startedAt === null
            ? null
            : this.contextRecovery.restoredAt - this.contextRecovery.startedAt;
        this.log('Graphics context restored; rebuilding GPU resources.', 'info');
        const resumeState = this.contextRecovery.resumeLifecycleState || APP_LIFECYCLE.BOOTING;
        this.appLifecycle.transition(APP_LIFECYCLE.RECOVERING, { cause: 'webglcontextrestored' });
        try {
            this._reuploadGpuResidentState();
            this.resourceLifecycles.recovered({ cause: 'webglcontextrestored' });
            this.contextRecovery.active = false;
            if (resumeState === APP_LIFECYCLE.BOOTING) {
                // A lifecycle transition cancelled startup before it could
                // commit. Reset any partial manifest/view setup and start a
                // fresh boot epoch instead of allowing stale async work to win.
                this._resetWorldForInitRetry();
                const bootScope = this.appLifecycle.transition(APP_LIFECYCLE.BOOTING, {
                    cause: 'context-restored-during-boot',
                });
                this._showLoadingState();
                this.initWorld(bootScope);
                return;
            }
            this.appLifecycle.transition(resumeState, { cause: 'context-restored' });
            if (this.contextRecovery.wasLoaderHidden) {
                this.loadingScreen.hide();
                this.loaderHidden = true;
            } else {
                this._showLoadingState();
                this.checkInitialLoad();
            }
            // AA-8's demand scheduler may be fully asleep when the browser
            // dispatches webglcontextrestored. Reuploading retained CPU-side
            // resources sets needsRender, but that flag alone cannot schedule
            // a frame. Wake explicitly so restored means visibly repainted.
            this.frameScheduler?.wake('webgl-context-restored');
        } catch (error) {
            this.failureStats.contextRecoveryFailures++;
            if (this.appLifecycle.canTransition(APP_LIFECYCLE.CONTEXT_LOST)) {
                this.appLifecycle.transition(APP_LIFECYCLE.CONTEXT_LOST, {
                    cause: 'context-rebuild-failed',
                });
            }
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
        this.materialChurn.traversalCalls++;
        this.scene.traverse(object => {
            this.materialChurn.traversedObjects++;
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
        this.materialChurn.compileCalls++;
        this.renderer.compile(this.scene, this.camera);
        this.needsRender = true;
    }

    _showLoadingState(main = 'Good code loads fast.', sub = 'Fetching high-res bestagons...') {
        this.loadingScreen.showLoading({ main, sub });
        this.loaderHidden = false;
    }

    _showFatalState(kind, error) {
        this.fatalState = { kind, message: error?.message || String(error) };
        if (kind !== 'context') {
            const failureState = (kind === 'manifest' || kind === 'terrain') && navigator.onLine === false
                ? APP_LIFECYCLE.OFFLINE
                : APP_LIFECYCLE.DEGRADED;
            if (this.appLifecycle.canTransition(failureState)) {
                this.appLifecycle.transition(failureState, { cause: `fatal-${kind}` });
            }
        }

        let title;
        let message;
        if (kind === 'unsupported-device') {
            title = "This device can't run the viewer.";
            message = 'The graphics hardware is missing a required capability.';
        } else if (kind === 'manifest') {
            title = 'Could not load the terrain manifest.';
            message = 'Check the asset build or network path, then retry.';
        } else if (kind === 'terrain') {
            title = 'The mountains refused to arrive.';
            message = 'Every terrain request failed. Check the connection, then retry.';
        } else if (kind === 'context') {
            title = 'Graphics context could not be restored.';
            message = 'Retry after the browser recovers WebGL.';
        } else {
            title = 'The viewer failed to initialize.';
            message = 'Retry after fixing the reported startup problem.';
        }
        this.loadingScreen.showFatal({
            title,
            message,
            detail: this.fatalState.message,
            onRetry: () => this.retryInitWorld(),
        });
    }

    _disposeObjectTree(root) {
        if (!root) return;
        root.parent?.remove(root);
        const disposedMaterials = new Set();
        this.materialChurn.traversalCalls++;
        root.traverse(object => {
            this.materialChurn.traversedObjects++;
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
            state.tierStates.clear();
            state._tierLoadingStartMs?.clear();
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
        this.manifestCrc32 = null;
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
        this.tileStates.clear();
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
        this.contextRecovery.resumeLifecycleState = null;
        this.contextRecovery.startedAt = null;
        this.contextRecovery.restoredAt = null;
        this.contextRecovery.durationMs = null;
        this.geometryPlanEpoch++;
        this.activeTextureJobs = 0;
        this.activeWorkerCount = 0;
        this.vramLedger = new VRAMLedger();
        this.cacheManager = new CacheManager(this.capabilityProfile.textureBudgetBytes);
        this.appStartTime = performance.now();
        this.fatalState = null;
        this._bootPlannedTerrain.clear();
        this._bootPlannedBootstrap.clear();
        this._bootPlannedKtx2.clear();
        this.bootstrapPhaseActive = true;
        this.bootstrapDiagnostics = { firstConsumer: null, matchingInstalls: [] };
        this._textureMilestonesDone = false;
        this.loadingScreen.reset();
        this.needsLODUpdate = true;
        this.needsRender = true;
    }

    retryInitWorld() {
        this.log('Retrying viewer initialization.', 'info');
        if (this.appLifecycle.canTransition(APP_LIFECYCLE.RETRYING)) {
            this.appLifecycle.transition(APP_LIFECYCLE.RETRYING, { cause: 'user-retry' });
        }
        this._resetWorldForInitRetry();
        const bootScope = this.appLifecycle.transition(APP_LIFECYCLE.BOOTING, {
            cause: 'retry-reset-complete',
        });
        this._showLoadingState();
        this.initWorld(bootScope);
    }

    initMinimizeButton() {
        const btn = document.getElementById('minimize-btn');
        const panel = document.getElementById('main-panel');
        const body = document.getElementById('main-panel-body');
        if (btn && panel && body) {
            setPanelMinimized(panel, btn, body, panel.classList.contains('minimized'));
            btn.addEventListener('click', () => {
                setPanelMinimized(panel, btn, body, !panel.classList.contains('minimized'));
            });
        }
    }

    initCollapsibleSections() {
        document.querySelectorAll('.collapsible-header').forEach(header => {
            const content = document.getElementById(header.getAttribute('aria-controls'));
            if (!content) return;
            setDisclosure(header, content, !header.parentElement.classList.contains('collapsed'));
            header.addEventListener('click', () => {
                const section = header.parentElement;
                const expanded = toggleDisclosure(header, content);
                section.classList.toggle('collapsed', !expanded);
                if (section === this.debugSectionEl && expanded) {
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

    _formatTextureDistance(distanceM) {
        if (!(distanceM > 0)) return 'OFF';
        return distanceM >= 1000
            ? `${(distanceM / 1000).toFixed(distanceM % 1000 === 0 ? 0 : 1)}km`
            : `${distanceM}m`;
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

        // Pink texture range. The runtime compares this only with full 3D
        // camera-to-page-center distance; screen footprint is not an input.
        const texSlider = document.getElementById('tex-upgrade-slider');
        const texVal = document.getElementById('tex-upgrade-val');
        if (texSlider) {
            texSlider.min = '0';
            texSlider.max = '5000';
            texSlider.step = '100';
            texSlider.value = this.highTextureDistanceM;
            if (texVal) texVal.textContent = this._formatTextureDistance(this.highTextureDistanceM);
            texSlider.addEventListener('input', () => {
                // Object.freeze protects defaults, so retain a deliberately
                // tiny per-view override for manual tuning.
                this.highTextureDistanceM = parseInt(texSlider.value, 10);
                if (texVal) texVal.textContent = this._formatTextureDistance(this.highTextureDistanceM);
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
                setPressedButton(terrainBtn, true);
                setPressedButton(gradientBtn, false);
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
                setPressedButton(gradientBtn, true);
                setPressedButton(terrainBtn, false);
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
        this.highTextureDistanceM = settings.highTextureDistanceM;
        this.gradientMode = settings.gradientMode;
        const hazeSlider = document.getElementById('haze-distance-slider');
        const hazeValue = document.getElementById('haze-distance-val');
        if (hazeSlider) hazeSlider.value = String(settings.hazeDistanceKm);
        if (hazeValue) hazeValue.textContent = `${settings.hazeDistanceKm}km`;
        const textureSlider = document.getElementById('tex-upgrade-slider');
        const textureValue = document.getElementById('tex-upgrade-val');
        if (textureSlider) textureSlider.value = String(settings.highTextureDistanceM);
        if (textureValue) textureValue.textContent = this._formatTextureDistance(settings.highTextureDistanceM);
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
                    if (child.material.userData.forceMovingMode !== forceCoarse) {
                        child.material.userData.forceMovingMode = forceCoarse;
                        this._syncMaterialLodUniforms(child.material);
                    }
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
        this.materialChurn.resizeEvents++;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        // CDP applies an emulated DPR after the document is created. Re-read
        // the benchmark-only native cap here so the comparison arm measures
        // the requested high-DPR backbuffer rather than startup DPR=1.
        this.renderDprCap = renderDprCapForLocation(window.location.search, window.devicePixelRatio);
        this.renderPixelRatio = applyRenderResolution(this.renderer, {
            width: window.innerWidth,
            height: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio,
            maxDpr: this.renderDprCap,
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
        if (!this.loaderHidden) {
            this.loadingScreen.retryScheduled({
                kind,
                attempt: event.attempt,
                maxAttempts: event.maxAttempts,
                delayMs: event.delayMs,
            });
        }
    }

    _resourceKind(kind) {
        if (kind === 'tile') return 'geometry';
        return kind;
    }

    _resourceRetrying(kind, key, event) {
        this.resourceLifecycles.retrying(this._resourceKind(kind), key, {
            attempt: event.attempt,
            maxAttempts: event.maxAttempts,
            delayMs: event.delayMs,
        });
        this._logRetry(kind, key, event);
    }

    _resourceFailed(kind, key, error) {
        this.resourceLifecycles.failed(this._resourceKind(kind), key, {
            offline: typeof navigator !== 'undefined' && navigator.onLine === false,
            detail: { message: error?.message || String(error) },
        });
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
        if (manifest.binary?.url_template &&
            (!manifest.binary.url_template.includes('{yq}') || !manifest.binary.url_template.includes('{yr}'))) {
            throw new Error('Manifest binary url_template must contain {yq}/{yr}');
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
        if (textureContract.bootstrap?.container !== 'webp' ||
            textureContract.bootstrap?.size_px !== BOOTSTRAP_PAGE_SIZE_PX ||
            textureContract.bootstrap?.gpu_bytes !== BOOTSTRAP_GPU_BYTES_PER_PAGE) {
            throw new Error(`Manifest needs the ${BOOTSTRAP_PAGE_SIZE_PX}px transient WebP bootstrap tier`);
        }
    }

    async _loadManifestWithRetry(scope) {
        return this.resourceRetries.run(MANIFEST_RETRY_KEY, async () => {
            this.resourceLifecycles.begin('manifest', 'tile_manifest.json', { cause: 'fetch-attempt' });
            // This small file is the cache-identity authority for every large
            // asset, so rebakes must revalidate it even when app code did not
            // change. Binaries and textures remain explicitly recipe-keyed.
            const res = await fetch(
                appendCacheKey('tile_manifest.json', APP_VERSION),
                { cache: 'no-store', signal: scope.signal },
            );
            if (!res.ok) throw new Error(`Manifest HTTP ${res.status}`);
            // Read raw bytes rather than res.text() so this.manifestCrc32 is
            // the CRC32 of the exact bytes the backend baked sidecars
            // against -- the PowFinder manifest self-disable guard (design
            // doc §6 P2.5 amendment) compares it against each sidecar's
            // PFL1 header manifestHash in _loadPowfinderFixture below.
            const bytes = await res.arrayBuffer();
            const text = new TextDecoder().decode(bytes);
            const manifest = JSON.parse(text);
            this.manifestCrc32 = crc32(new Uint8Array(bytes));
            this.loadingScreen.manifestLoaded(text.length);
            this._validateManifestContract(manifest);
            this.resourceLifecycles.ready('manifest', 'tile_manifest.json', { cause: 'validated' });
            return manifest;
        }, {
            onRetry: event => this._resourceRetrying('manifest', 'tile_manifest.json', event),
            onExhausted: ({ error }) => {
                this.failureStats.manifestFailures++;
                this._resourceFailed('manifest', 'tile_manifest.json', error);
            },
            signal: scope.signal,
        });
    }

    async initWorld(scope = this.appLifecycle.current()) {
        if (scope.state !== APP_LIFECYCLE.BOOTING || !this.appLifecycle.isCurrent(scope)) return;
        try {
            this.loadingScreen.manifestStarted();
            const manifest = await this._loadManifestWithRetry(scope);
            if (!this.appLifecycle.isCurrent(scope)) return;
            this.manifest = manifest;
            this.releaseMode = resolveReleaseMode(this.manifest.release, window.location.search);
            this.profiler = createProfilerForReleaseMode(this, this.releaseMode, PerfProfiler);
            this.profiler?.setMeta({
                releaseProfile: this.releaseMode.profile,
                releaseMode: this.releaseMode.mode,
                capabilityProfile: this.capabilityProfile.name,
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
                highEnterDistanceM: TEXTURE_CONFIG.highEnterDistanceM,
                highExitDistanceM: TEXTURE_CONFIG.highExitDistanceM,
            });
            this.textureStates = this.texturePageResidency.states;
            this.resourceLifecycles.settled('manifest', 'tile_manifest.json', { cause: 'world-contract-ready' });
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
            this.captureDefaultView();
            this.bootstrapVisibilityFloor(this.controls.target);
            this.notifyCameraMotion(performance.now());
            this.controls.update();
            this.syncHeightFactorFromControls();
            await this.viewState.restoreFromUrl();
            if (!this.appLifecycle.isCurrent(scope)) return;
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
            if (scope.signal.aborted || !this.appLifecycle.isCurrent(scope)) return;
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
            shader.uniforms.uHeightFactor = this.sharedMaterialUniforms.heightFactor;
            shader.uniforms.uFloorOffset = this.sharedMaterialUniforms.floorOffset;
            shader.uniforms.uCameraPos = this.sharedMaterialUniforms.cameraPos;
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
        this.materialChurn.materialShaderSetups++;
        // Force Three.js to treat this as a distinct program variant so we don't accidentally
        // reuse a cached MeshBasicMaterial program that didn't get our onBeforeCompile edits.
        // If you change shader code, bump this string.
        material.customProgramCacheKey = () => 'piston_hex_global_pages_v6_powfinder_sidecar';

        const pageSize = this.texturePageGrid.pageSize;
        const sourceOrigin = this.worldOrigin;
        const missingPageTexture = this.missingPageTexture;
        const sharedUniforms = this.sharedMaterialUniforms;
        const movingLevel = this.movingLevel;
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
                    ${SIDECAR_FRAGMENT_TINT}
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
            shader.uniforms.uHeightFactor = sharedUniforms.heightFactor;
            shader.uniforms.uGradientMode = sharedUniforms.gradientMode;
            shader.uniforms.uFloorOffset = sharedUniforms.floorOffset;
            shader.uniforms.uCameraPos = sharedUniforms.cameraPos;
            const lodIdx = this.userData.lodIdx ?? 0;
            const lodRadiiSource = this.userData.forceMovingMode && lodIdx === movingLevel
                ? sharedUniforms.movingLodRadii
                : sharedUniforms.lodRadii[lodIdx];
            // Keep Three's compiled uniform wrapper stable; only redirect its
            // Vector2 value when the material changes moving/settled mode.
            shader.uniforms.uLodRadii = { value: lodRadiiSource.value };
            shader.uniforms.uFinestBuilt = {
                value: this.userData.forceMovingMode && lodIdx === movingLevel
                    ? 1.0
                    : (this.userData.isFinest ? 1.0 : 0.0),
            };
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

            // PowFinder sidecar uniforms. Shared ones are assigned by object
            // identity (same pattern as uHeightFactor etc. above), so one
            // CPU write to sharedMaterialUniforms.sidecarX.value updates
            // every compiled material. The two per-tile ones follow the
            // uPageOrigin{slot} pattern: read from material.userData here
            // (set by _applySidecarBinding before setupMaterialShader runs,
            // per the design doc §1.7 lifecycle table), then kept live by
            // _applySidecarBinding's own uniform write post-compile.
            shader.uniforms.uSidecarAtlas = sharedUniforms.sidecarAtlas;
            shader.uniforms.uSidecarLut = sharedUniforms.sidecarLut;
            shader.uniforms.uSidecarTexel = sharedUniforms.sidecarTexel;
            shader.uniforms.uSidecarGeom = sharedUniforms.sidecarGeom;
            shader.uniforms.uSidecarChannel = sharedUniforms.sidecarChannel;
            shader.uniforms.uSidecarOverlayCh = sharedUniforms.sidecarOverlay;
            shader.uniforms.uSidecarRamp = sharedUniforms.sidecarRamp;
            shader.uniforms.uSidecarMode = sharedUniforms.sidecarMode;
            shader.uniforms.uSidecarMix = sharedUniforms.sidecarMix;
            shader.uniforms.uSidecarOpacity = sharedUniforms.sidecarOpacity;
            shader.uniforms.uSidecarRowBase = { value: this.userData.sidecarRowBase || 0 };
            shader.uniforms.uSidecarValid = { value: this.userData.sidecarValid || 0 };

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
                ${SIDECAR_VERTEX_DECLARATIONS}
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
                    ${SIDECAR_VERTEX_FETCH}
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
                         // dVal is signed (this cap height - neighbor height).
                         // Extend beyond the neighbor in the same direction as
                         // the encoded edge. Adding a positive margin to a
                         // negative/uphill delta shortens the wall and opens a
                         // hole through which farther terrain can pass depth.
                         float skirtExtension = clamp(
                             (vInstDist - 1200.0) / 3000.0,
                             0.0,
                             1.0
                         ) * 12.0;
                         float skirtDirection = dVal < 0.0 ? -1.0 : 1.0;
                         dVal += skirtDirection * skirtExtension;

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
                ${SIDECAR_FRAGMENT_DECLARATIONS}
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

        // STATIC means the camera and refinement state are settled even when a
        // one-off maintenance render was requested. Reporting that sparse
        // maintenance cadence as active FPS is misleading, so STATIC is
        // always truthfully idle.
        if (this.engineState === ENGINE_STATES.STATIC) {
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
        const contractTier = tier === TEXTURE_TIER.BOOTSTRAP
            ? 'bootstrap'
            : tier === TEXTURE_TIER.LOW
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
        if (this.tileStates.get(tileKey) !== 'failed') this.failureStats.tileFailures++;
        this.tileStates.set(tileKey, 'failed');
        this._resourceFailed('tile', tileKey, error);
        this.recoverableResweeps.schedule(RECOVERABLE_SWEEP_TILES);
        this.log(`Terrain tile failed: ${tileKey} (${error.message})`, 'error');
        this._maybeShowBootTerrainFailure();
    }

    // AA-2 closed the "failed manifest spins forever" hole; this closes the
    // boot-time terrain twin: every request exhausted its retries with zero
    // operational tiles and nothing left in flight — without a designed state
    // the loader would spin forever.
    _maybeShowBootTerrainFailure() {
        if (this.loaderHidden || this.contextRecovery.active) return;
        if (this.appLifecycle.state !== APP_LIFECYCLE.BOOTING) return;
        for (const t of this.tiles.values()) {
            if (t.mesh) return;
        }
        const pending = this.loadQueue.length + this.activeWorkerCount + this.instantiateQueue.length;
        if (pending > 0) return;
        const anyFailed = Array.from(this.tileStates.values()).some(state => state === 'failed');
        if (!anyFailed) return;
        this._showFatalState('terrain', new Error('All terrain requests failed after bounded retries.'));
    }

    _markTextureFailed(key, tier, error) {
        this._resourceFailed('texture', `${key}/${tier}`, error);
        const failureKey = this._textureFailureKey(key, tier);
        const state = this.textureStates.get(key);
        if (state) setTierState(state, tier, TIER_STATE.FAILED);
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
            for (const [key, state] of this.tileStates) {
                if (state === 'failed') {
                    this.resourceRetries.reset(`tile:${key}`);
                    this.resourceLifecycles.retrying('geometry', key, { cause: 'settled-resweep' });
                    tileCount++;
                }
            }
            for (const [key, state] of this.tileStates) {
                if (state === 'failed') this.tileStates.delete(key);
            }
        }
        if (kinds.includes(RECOVERABLE_SWEEP_TEXTURES)) {
            for (const failureKey of this.failedTextures) {
                const [key, tier] = failureKey.split('|');
                const state = this.textureStates.get(key);
                if (state) setTierState(state, tier, TIER_STATE.ABSENT);
                this.resourceRetries.reset(`texture:${failureKey}`);
                this.resourceLifecycles.retrying('texture', `${key}/${tier}`, { cause: 'settled-resweep' });
                textureCount++;
            }
            this.failedTextures.clear();
        }

        this.failureStats.recoverableSweepsRun++;
        this.needsLODUpdate = true;
        this.needsRender = true;
        this.log(`Retrying failed resources after camera settled (${tileCount} tiles, ${textureCount} textures).`, 'info');
    }

    _desiredTextureTier(state, distanceMeters, classification) {
        return desiredTextureTier(state, distanceMeters, classification, {
            highEnterDistanceM: this._effectiveHighTextureDistanceM(),
            highExitDistanceM: this._effectiveHighTextureExitDistanceM(),
        });
    }

    _effectiveHighTextureDistanceM() {
        return Math.min(
            Math.max(0, this.highTextureDistanceM ?? TEXTURE_CONFIG.highEnterDistanceM),
            Math.max(0, this.capabilityProfile.highTextureDistanceM),
        );
    }

    _effectiveHighTextureExitDistanceM() {
        return this._effectiveHighTextureDistanceM() * (
            TEXTURE_CONFIG.highExitDistanceM / TEXTURE_CONFIG.highEnterDistanceM
        );
    }

    _highTextureCachePriority(state) {
        return Number.isFinite(state?.distanceMeters) ? -state.distanceMeters : -Number.MAX_VALUE;
    }

    _queueTextureTier(textureResource, tier, priority = 0) {
        if (!textureResource) return;
        const state = this._textureState(textureResource);
        if (tier === TEXTURE_TIER.BOOTSTRAP && !this.bootstrapPhaseActive) return;
        if (state.assets.has(tier) || isTier(state, tier, TIER_STATE.LOADING)) return;
        if (isTier(state, tier, TIER_STATE.QUEUED)) {
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
        if (isTier(state, tier, TIER_STATE.FAILED)) return;
        setTierState(state, tier, TIER_STATE.QUEUED);
        const resourceKey = `${state.key}/${tier}`;
        this.resourceLifecycles.begin('texture', resourceKey, {
            cause: 'tier-queued', tier,
        });
        if (tier === TEXTURE_TIER.BOOTSTRAP) this.profiler?.milestone('firstBootstrapQueued');
        if (tier === TEXTURE_TIER.HIGH) this.profiler?.milestone('firstHighQueued');
        this.textureQueue.push({
            key: state.key,
            textureResource,
            tier,
            priority,
            urls: this._textureUrls(tier, state.key),
            epoch: this.viewEpoch,
            enqueuedSequence: this.textureDispatchSequence,
        });
        if (!this.loaderHidden) {
            const plannedSet = tier === TEXTURE_TIER.BOOTSTRAP
                ? this._bootPlannedBootstrap
                : this._bootPlannedKtx2;
            plannedSet.add(`${state.key}|${tier}`);
            this.loadingScreen.texturePlanned(plannedSet.size, tier);
        }
    }

    _scheduleTextureQuality(
        textureResource,
        classification,
        projectedDiameterPx,
        distanceMeters,
        priority = 0,
        demandPreplanned = false,
    ) {
        const state = this._textureState(textureResource);
        if (!demandPreplanned) {
            state.classification = classification;
            state.projectedDiameterPx = projectedDiameterPx;
            state.distanceMeters = Number.isFinite(distanceMeters) ? distanceMeters : Infinity;
            state.perceptibility = Number.isFinite(priority) ? priority : 0;
            state.desiredTier = this._desiredTextureTier(state, state.distanceMeters, classification);
        }
        const highPriority = this._highTextureCachePriority(state);
        this.cacheManager.updatePriority(state.key, highPriority);
        if (state.highAdmissionBlocked && highAdmissionRetryReady(
            state,
            this.cacheManager.revision,
            highPriority,
        )) {
            state.highAdmissionBlocked = false;
            state.highAdmissionBlockedRevision = -1;
            state.highAdmissionBlockedPriority = -Infinity;
        }

        // Yellow is a one-way first-display bridge. Green then establishes the
        // active coverage floor; blue remains a durable fallback underneath
        // distance-selected pink.
        const requestPlan = textureTierRequestPlan(state, {
            isMoving: this.isMovingView,
            allowBootstrap: this.bootstrapPhaseActive,
        });
        for (const requestedTier of requestPlan) {
            const tierPriority = requestedTier === TEXTURE_TIER.BOOTSTRAP
                ? priority + 1500
                : requestedTier === TEXTURE_TIER.LOW
                ? priority + 1000
                : (requestedTier === TEXTURE_TIER.MEDIUM ? priority + 500 : priority);
            this._queueTextureTier(textureResource, requestedTier, tierPriority);
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

    // Modelled directly on _applyTexturePageBindings above (design doc
    // §1.7's P1.2 task spec). `rowBase` is slot*3 (the atlas row this
    // tile's pyramid lives at, per §1.5); `valid` is falsy for a tile with
    // no atlas slot / no installed data yet, in which case the vertex fetch
    // is skipped entirely (see SIDECAR_VERTEX_FETCH) and the tile renders
    // plain terrain. Callers set userData before setupMaterialShader runs
    // (so a freshly compiled shader picks up the right values immediately)
    // and call this again after, to refresh an already-compiled shader's
    // live uniforms without a recompile.
    _applySidecarBinding(material, rowBase, valid) {
        if (!material) return;
        material.userData.sidecarRowBase = rowBase || 0;
        material.userData.sidecarValid = valid ? 1 : 0;

        const shader = material.userData.shader;
        if (shader) {
            shader.uniforms.uSidecarRowBase.value = material.userData.sidecarRowBase;
            shader.uniforms.uSidecarValid.value = material.userData.sidecarValid;
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
        if (state.classification === 'outside' && state.assets.has(TEXTURE_TIER.BOOTSTRAP)) {
            this._dropTextureTier(state.key, TEXTURE_TIER.BOOTSTRAP, false, true);
        }
        if (state.desiredTier !== TEXTURE_TIER.HIGH) {
            state.highAdmissionBlocked = false;
            state.highAdmissionBlockedRevision = -1;
            state.highAdmissionBlockedPriority = -Infinity;
        }
    }

    _dropTextureTier(key, tier, fromHighPool = false, allowEmpty = false) {
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
                allowEmpty,
            },
        );
        if (!dropped) return false;
        this.vramLedger.removeTexture(key, tier);
        if (tier === TEXTURE_TIER.HIGH && !fromHighPool) this.cacheManager.removeHigh(key);
        return true;
    }

    _enforceBootstrapBudget(protectedKey = null) {
        const bootstrapEntries = Array.from(this.vramLedger.textureEntries.values())
            .filter(entry => entry.tier === TEXTURE_TIER.BOOTSTRAP);
        let bytes = bootstrapEntries.reduce((sum, entry) => sum + entry.bytes, 0);
        if (bytes <= TEXTURE_CONFIG.bootstrapBudgetBytes) return true;
        // Never blank the current visible page to make room for another
        // placeholder. Yellow is never fetched again after first display.
        const victims = bootstrapEntries
            .map(entry => this.textureStates.get(entry.key))
            .filter(state => state && state.key !== protectedKey && state.classification !== 'visible')
            .sort((a, b) => (a.perceptibility || 0) - (b.perceptibility || 0));
        for (const victim of victims) {
            if (bytes <= TEXTURE_CONFIG.bootstrapBudgetBytes) break;
            const asset = victim.assets.get(TEXTURE_TIER.BOOTSTRAP);
            if (!asset) continue;
            if (this._dropTextureTier(victim.key, TEXTURE_TIER.BOOTSTRAP, false, true)) {
                bytes -= asset.bytes || 0;
            }
        }
        return bytes <= TEXTURE_CONFIG.bootstrapBudgetBytes;
    }

    _finishTextureBootstrapPhase() {
        if (!this.bootstrapPhaseActive) return;
        this.bootstrapPhaseActive = false;
        this.textureQueue = this.textureQueue.filter(task => {
            if (task.tier !== TEXTURE_TIER.BOOTSTRAP) return true;
            const state = this.textureStates.get(task.key);
            if (state) setTierState(state, TEXTURE_TIER.BOOTSTRAP, TIER_STATE.ABSENT);
            this.resourceLifecycles.delete('texture', `${task.key}/${task.tier}`);
            this.workerLaneStats.texture.cancelledQueued++;
            return false;
        });
        const retainedResults = [];
        for (const item of this.textureResultQueue) {
            if (item.task.tier !== TEXTURE_TIER.BOOTSTRAP) {
                retainedResults.push(item);
                continue;
            }
            item.result.imageBitmap?.close?.();
            const state = this.textureStates.get(item.task.key);
            if (state) setTierState(state, TEXTURE_TIER.BOOTSTRAP, TIER_STATE.ABSENT);
            this.resourceLifecycles.delete('texture', `${item.task.key}/${item.task.tier}`);
        }
        this.textureResultQueue = retainedResults;
        for (const state of this.textureStates.values()) {
            if (!isTier(state, TEXTURE_TIER.BOOTSTRAP, TIER_STATE.LOADING)) continue;
            // The worker fetch cannot be aborted, but it no longer owns page
            // scheduling state; green may proceed immediately and the late
            // ImageBitmap will be closed in processTextureResults().
            setTierState(state, TEXTURE_TIER.BOOTSTRAP, TIER_STATE.ABSENT);
            this.resourceLifecycles.delete('texture', `${state.key}/${TEXTURE_TIER.BOOTSTRAP}`);
        }
    }

    _installTextureResult(task, result) {
        const state = this._textureState(task.textureResource);
        if (task.tier === TEXTURE_TIER.BOOTSTRAP) this.profiler?.milestone('firstBootstrapInstalled');
        if (task.tier === TEXTURE_TIER.BOOTSTRAP &&
            this.bootstrapDiagnostics.firstConsumer?.pageKeys?.includes(state.key)) {
            this.bootstrapDiagnostics.matchingInstalls.push({ key: state.key, t: performance.now() - this.appStartTime });
        }
        setTierState(state, task.tier, TIER_STATE.ABSENT);
        this.failedTextures.delete(this._textureFailureKey(state.key, task.tier));

        const texture = result.bootstrap
            ? this.buildBootstrapTexture(result)
            : this.buildCompressedTexture(result);
        if (task.tier === TEXTURE_TIER.HIGH) {
            const admitted = this.cacheManager.admitHigh(
                state.key,
                result.gpuBytes || 0,
                victimKey => this._dropTextureTier(victimKey, TEXTURE_TIER.HIGH, true),
                new Set(state.classification === 'visible' ? [state.key] : []),
                this._highTextureCachePriority(state),
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
                state.highAdmissionBlocked = true;
                state.highAdmissionBlockedRevision = this.cacheManager.revision;
                state.highAdmissionBlockedPriority = this._highTextureCachePriority(state);
                this._reconcileTextureState(state);
                this._scheduleTextureQuality(
                    state.page,
                    state.classification,
                    state.projectedDiameterPx,
                    state.distanceMeters,
                    state.perceptibility,
                    true,
                );
                this.resourceLifecycles.settled('texture', `${state.key}/${task.tier}`, {
                    cause: 'budget-rejected', tier: task.tier,
                });
                return;
            }
            state.highAdmissionBlocked = false;
            state.highAdmissionBlockedRevision = -1;
            state.highAdmissionBlockedPriority = -Infinity;
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
        if (task.tier === TEXTURE_TIER.HIGH) this.profiler?.milestone('firstHighInstalled');
        this._reconcileTextureState(state);
        // Bootstrap is a first-paint placeholder, not a fourth resident copy.
        // Any real KTX2 replacement releases it immediately.
        if (task.tier !== TEXTURE_TIER.BOOTSTRAP && state.assets.has(TEXTURE_TIER.BOOTSTRAP)) {
            this._dropTextureTier(state.key, TEXTURE_TIER.BOOTSTRAP);
        }
        if (task.tier === TEXTURE_TIER.BOOTSTRAP) this._enforceBootstrapBudget(state.key);
        this.updateTexStats(result);
        if (!this.loaderHidden) {
            this.loadingScreen.textureDone(result.networkBytes || 0, task.tier);
        }
        this.resourceLifecycles.settled('texture', `${state.key}/${task.tier}`, {
            cause: 'gpu-resident', tier: task.tier,
        });

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
            if (task.tier === TEXTURE_TIER.BOOTSTRAP && !this.bootstrapPhaseActive) {
                result.imageBitmap?.close?.();
                setTierState(state, task.tier, TIER_STATE.ABSENT);
                this.resourceLifecycles.delete('texture', `${task.key}/${task.tier}`);
                continue;
            }
            if (task.tier === TEXTURE_TIER.HIGH && state.desiredTier !== TEXTURE_TIER.HIGH) {
                // Demand changed during transcode. These are still CPU-side
                // bytes, so avoid a pointless GPU upload and immediate drop.
                setTierState(state, task.tier, TIER_STATE.ABSENT);
                this.resourceLifecycles.delete('texture', `${task.key}/${task.tier}`);
                continue;
            }
            this.resourceLifecycles.refining('texture', `${task.key}/${task.tier}`, {
                cause: 'gpu-upload', tier: task.tier,
            });
            this._installTextureResult(task, result);
            installed++;
        }
    }

    _dispatchTextureJobs(maxConcurrent) {
        while (this.activeTextureJobs < Math.min(maxConcurrent, this.capabilityProfile.maxTextureJobs) &&
            this.textureQueue.length > 0) {
            const index = selectTextureDispatchTaskIndex(
                this.textureQueue,
                this.textureStates,
                {
                    isMoving: this.isMovingView,
                    // Active green coverage is the durable floor. Yellow may
                    // race it only during the one-way startup phase.
                    lowCoverageFirst: true,
                    lowCoverageIncludesOutside: false,
                    dispatchSequence: this.textureDispatchSequence,
                },
            );
            if (index < 0) break;
            const task = this.textureQueue.splice(index, 1)[0];
            this.textureDispatchSequence++;
            if (task.epoch !== this.viewEpoch) {
                const st = this.textureStates.get(task.key);
                if (st) setTierState(st, task.tier, TIER_STATE.ABSENT);
                this.resourceLifecycles.delete('texture', `${task.key}/${task.tier}`);
                this.workerLaneStats.texture.cancelledQueued++;
                continue;
            }
            const state = this._textureState(task.textureResource);
            setTierState(state, task.tier, TIER_STATE.ABSENT);
            if (TEXTURE_RANK[task.tier] > TEXTURE_RANK[state.desiredTier]) continue;
            if (state.assets.has(task.tier) || isTier(state, task.tier, TIER_STATE.LOADING)) continue;
            setTierState(state, task.tier, TIER_STATE.LOADING);
            this.resourceLifecycles.begin('texture', `${task.key}/${task.tier}`, {
                cause: 'worker-dispatch', tier: task.tier,
            });
            if (task.tier === TEXTURE_TIER.BOOTSTRAP) this.profiler?.milestone('firstBootstrapDispatched');
            if (task.tier === TEXTURE_TIER.HIGH) this.profiler?.milestone('firstHighDispatched');
            this.activeTextureJobs++;
            const retryKey = `texture:${this._textureFailureKey(task.key, task.tier)}`;
            this.resourceRetries.run(retryKey, ({ attempt }) => (
                this.postWorkerJob('LOAD_TEXTURE', {
                    urls: task.urls,
                    bootstrap: task.tier === TEXTURE_TIER.BOOTSTRAP,
                    faultAttempt: attempt,
                    faultDrop: this._faultGateDrop('texture', attempt),
                })
            ), {
                onRetry: event => this._resourceRetrying('texture', `${task.key}/${task.tier}`, event),
            }).then(result => {
                if (task.tier === TEXTURE_TIER.BOOTSTRAP) this.profiler?.milestone('firstBootstrapDecoded');
                if (result.networkBytes) {
                    this.vramLedger.addNetworkPayload(task.key, { bin: 0, tex: result.networkBytes });
                }
                if (task.tier === TEXTURE_TIER.BOOTSTRAP && !this.bootstrapPhaseActive) {
                    result.imageBitmap?.close?.();
                    return;
                }
                this.textureResultQueue.push({ task, result });
                this.resourceLifecycles.ready('texture', `${task.key}/${task.tier}`, {
                    cause: 'decoded', tier: task.tier,
                });
                this.needsRender = true;
            }).catch(error => {
                if (task.tier === TEXTURE_TIER.BOOTSTRAP && !this.bootstrapPhaseActive) return;
                setTierState(state, task.tier, TIER_STATE.FAILED);
                this._markTextureFailed(task.key, task.tier, error);
                this._texErrorCount++;
                this._updateTexBadge();
                if (this._texErrorCount <= 3) {
                    console.warn(`[TEX_FAIL] ${task.key}/${task.tier}: ${error.message}`);
                }
            }).finally(() => {
                this.activeTextureJobs--;
                this.processQueues();
            });
        }
    }

    _seedMiniTexturePins() {
        if (!this.isMiniBake || this.miniTexturePinsSeeded || !this.manifest) return;
        this.miniTexturePinsSeeded = true;
        // Demand planning now owns all tiers. Do not enqueue a beta-wide low /
        // medium corpus: that used to sit in front of visible high imagery.
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
                    distanceMeters,
                    perceptibility: priority,
                });
            }
        };
        consume(plan.outside, 'outside');
        consume(plan.guard, 'guard');
        consume(plan.visible, 'visible');
        residency.finishDemandPass({
            highEnterDistanceM: this._effectiveHighTextureDistanceM(),
            highExitDistanceM: this._effectiveHighTextureExitDistanceM(),
        });

        // A visible island's conservative texture-page AABB can cross a page
        // frustum boundary. Promote only those actually bound adjacent pages
        // to guard demand; distance remains the sole blue/pink selector.
        const visibleConsumerPages = new Set();
        for (const [consumerKey, visibility] of this.visibilityByKey) {
            if (visibility?.classification !== 'visible') continue;
            for (const pageKey of residency.pagesForConsumer(consumerKey)) {
                visibleConsumerPages.add(pageKey);
            }
        }
        promoteVisibleConsumerPages(residency.states, visibleConsumerPages);

        // Camera motion can leave old lows and refinements in the queue. On a
        // world-scale manifest those stale lows must never become a hidden
        // global prerequisite for the new view. Already-running worker jobs
        // are allowed to finish; result installation already reconciles them
        // against the latest desired tier.
        this.textureQueue = pruneTextureDispatchQueue(
            this.textureQueue,
            residency.states,
            // Beta is geographically smaller, not a license to eagerly load
            // every page. Demand is visible + guard in every release profile.
            { includeOutside: false },
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
            if (!textureStateHasDemand(state, { includeOutside: false })) {
                this.cacheManager.updatePriority(state.key, this._highTextureCachePriority(state));
                this._reconcileTextureState(state);
                continue;
            }
            this._scheduleTextureQuality(
                state.page,
                state.classification,
                state.projectedDiameterPx,
                state.distanceMeters,
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
        const guardMarginMeters = Math.max(
            300,
            Math.min(5000, Math.abs(this.camera.position.y) * this.capabilityProfile.guardMarginScale),
        );
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
                if (!this.tiles.has(key) && !this.tileStates.has(key)) {
                    this.tileStates.set(key, 'loading');
                    this.resourceLifecycles.begin('geometry', key, { cause: 'visibility-demand' });
                    this.loadQueue.push({
                        t: manifestTile,
                        priority,
                        epoch: this.viewEpoch,
                        enqueuedSequence: this.workerDispatchSequence++,
                    });
                    if (!this.loaderHidden) {
                        this._bootPlannedTerrain.add(key);
                        this.loadingScreen.terrainPlanned(this._bootPlannedTerrain.size);
                    }
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
            if (this.appLifecycle.state === APP_LIFECYCLE.BOOTING) {
                this.appLifecycle.transition(APP_LIFECYCLE.READY, {
                    cause: 'first-tile-operational',
                });
            }
            this.hideLoader();
        }
    }

    _syncAppLifecycleWithEngine() {
        const state = this.appLifecycle.state;
        if (state === APP_LIFECYCLE.READY) {
            if (this.engineState === ENGINE_STATES.SINTERING) {
                this.appLifecycle.transition(APP_LIFECYCLE.REFINING, { cause: 'background-work-active' });
            } else if (this.engineState === ENGINE_STATES.STATIC) {
                this.appLifecycle.transition(APP_LIFECYCLE.SETTLED, { cause: 'render-work-settled' });
            }
        } else if (state === APP_LIFECYCLE.REFINING && this.engineState === ENGINE_STATES.STATIC) {
            this.appLifecycle.transition(APP_LIFECYCLE.SETTLED, { cause: 'render-work-settled' });
        } else if (state === APP_LIFECYCLE.SETTLED && this.engineState === ENGINE_STATES.SINTERING) {
            this.appLifecycle.transition(APP_LIFECYCLE.REFINING, { cause: 'background-work-resumed' });
        }
    }

    _suppressHighTextureWorkForMotion() {
        this.textureQueue = this.textureQueue.filter(task => {
            if (task.tier !== TEXTURE_TIER.HIGH) return true;
            const st = this.textureStates.get(task.key);
            if (st) setTierState(st, TEXTURE_TIER.HIGH, TIER_STATE.ABSENT);
            return false;
        });
        for (const state of this.textureStates.values()) {
            setTierState(state, TEXTURE_TIER.HIGH, TIER_STATE.ABSENT);
        }
    }

    notifyCameraMotion(now = performance.now()) {
        const entered = this.cameraMotion.enterMotion(now, this.isMovingView);
        if (entered) this.materialChurn.motionEvents++;
        this.needsRender = true;
        this.needsLODUpdate = true;
        this.frameScheduler?.wake('camera-input');
        this.frameScheduler?.wakeAfter(310, 'motion-settle');
        // Each observed pose change starts a new demand generation, including
        // successive pan events inside one continuous moving-mode interval.
        this._advanceViewEpoch();
        if (!entered) return false;

        // This method runs inside the controls `change` event, before another
        // microtask or the next animation frame can observe stale settled mode.
        this.isMovingView = true;
        this._beginGeometryMode(true);
        this._suppressHighTextureWorkForMotion();
        return true;
    }

    _advanceViewEpoch() {
        this.viewEpoch++;
        this.loadQueue = cancelStaleViewTasks(this.loadQueue, this.viewEpoch, task => {
            if (task?.t) this.tileStates.delete(`${task.t.yq}_${task.t.yr}`);
            this.workerLaneStats.geometry.cancelledQueued++;
        });
        this.geometryRebuildQueue = this.geometryRebuildQueue.filter(task => {
            if (task.viewEpoch === this.viewEpoch) return true;
            if (task?.tile) task.tile.geometryRebuildQueued = null;
            this.workerLaneStats.geometry.cancelledQueued++;
            return false;
        });
        this.textureQueue = cancelStaleViewTasks(this.textureQueue, this.viewEpoch, task => {
            const st = this.textureStates.get(task?.key);
            if (st) setTierState(st, task?.tier, TIER_STATE.ABSENT);
            this.workerLaneStats.texture.cancelledQueued++;
        });
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
            viewEpoch: this.viewEpoch,
            enqueuedSequence: this.workerDispatchSequence++,
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
                const material = this._cloneTileMaterial(tile.material, level, tile.texturePageKeys);
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
            this.materialChurn.compileCalls++;
            this.materialChurn.materialReplacements++;
            this.renderer.compile(replacement, this.camera);
            this._applyTileLevelVisibility(stagedTile, this.heightFactor);

            const oldMesh = tile.mesh;
            tile.container.add(replacement);
            tile.container.remove(oldMesh);
            const disposedMaterials = new Set();
            this.materialChurn.traversalCalls++;
            oldMesh.traverse(object => {
                this.materialChurn.traversedObjects++;
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
            this.materialChurn.traversalCalls++;
            replacement.traverse(object => {
                this.materialChurn.traversedObjects++;
                if (object.isMesh) disposeGeometryWithSharedStaticBuffers(object.geometry);
            });
            for (const material of replacementMaterials) {
                this.materialsToUpdate.delete(material);
                material.dispose();
            }
            throw error;
        }
    }

    _cloneTileMaterial(source, lodIdx, pageKeys) {
        // THREE.Material.clone serializes userData. Texture page bindings hold
        // ImageBitmap-backed WebP textures, so they must never be present
        // during clone—even on a later geometry rebuild after high arrives.
        const priorBindings = source.userData.texturePageBindings;
        const { texturePageBindings, shader, ...cloneSafeUserData } = source.userData;
        delete source.userData.texturePageBindings;
        let material;
        try {
            material = source.clone();
        } finally {
            if (priorBindings !== undefined) source.userData.texturePageBindings = priorBindings;
        }
        material.userData = { ...cloneSafeUserData, lodIdx, shader: null };
        this.setupMaterialShader(material);
        this._applyTexturePageBindings(material, pageKeys);
        // sidecarRowBase/sidecarValid already survive the cloneSafeUserData
        // spread above (they aren't destructured out like texturePageBindings
        // is), but re-applying explicitly — same as _applyTexturePageBindings
        // right above — keeps this robust to that spread's exact shape ever
        // changing, and matches the design doc's "carried through" wording.
        this._applySidecarBinding(material, cloneSafeUserData.sidecarRowBase, cloneSafeUserData.sidecarValid);
        return material;
    }

    processQueues() {
        const maxConcurrent = this.workerLanes.geometry.length;
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
            if (task.epoch !== this.viewEpoch || this.tiles.has(key) || this.visibilityByKey.get(key)?.classification === 'outside') {
                this.tileStates.delete(key);
                this.resourceLifecycles.delete('geometry', key);
                continue;
            }

            this.activeWorkerCount++;
            this.fetchTileOnWorker(task).then(result => {
                this.activeWorkerCount--;
                if (result) this.instantiateQueue.push(result);
                // The last in-flight failure must re-evaluate the boot guard
                // after its own worker slot is released.
                this._maybeShowBootTerrainFailure();
                this.processQueues(); // Keep the pipe full
            });
        }
        // Texture decoders own an independent lane, so geometry backlog cannot
        // delay first paint or refinement dispatch.
        this._dispatchTextureJobs(this.workerLanes.texture.length);
    }

    async fetchTileOnWorker(task) {
        const tileKey = `${task.t.yq}_${task.t.yr}`;
        try {
            const { t } = task;
            this.resourceLifecycles.begin('geometry', tileKey, { cause: 'worker-fetch' });
            const expectedGspVersion = Number(t.gspVersion ?? this.binaryContract.default_version ?? 1);
            const binaryBaseKey = this.binaryContract.cache_key
                ?? `${this.binaryContract.default_format || 'GSP'}${this.binaryContract.default_version || expectedGspVersion}`;
            const binaryTemplate = this.binaryContract.url_template
                || 'tiles_bin/gosper_{yq}_{yr}.bin';
            const binUrl = appendCacheKey(
                binaryTemplate.replace('{yq}', String(t.yq)).replace('{yr}', String(t.yr)),
                `${binaryBaseKey}-gsp${expectedGspVersion}`,
            );

            const workerData = await this.resourceRetries.run(`tile:${tileKey}`, async ({ attempt }) => {
                const result = await this.postWorkerJob('LOAD_TILE', {
                    yq: t.yq, yr: t.yr,
                    binUrl,
                    expectedGspVersion,
                    faultAttempt: attempt,
                    faultDrop: this._faultGateDrop('terrain', attempt),
                });
                if (result.binaryVersion !== expectedGspVersion) {
                    throw new Error(
                        `Binary cache mismatch for ${tileKey}: manifest GSP${expectedGspVersion}, parsed GSP${result.binaryVersion}`,
                    );
                }
                return result;
            }, {
                onRetry: event => this._resourceRetrying('tile', tileKey, event),
            });

            this.resourceLifecycles.ready('geometry', tileKey, { cause: 'binary-decoded' });

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
                this.resourceLifecycles.refining('geometry', tileKey, { cause: 'detail-build' });
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
                this.resourceLifecycles.ready('geometry', tileKey, { cause: 'detail-built' });
            }

            // (silent — structured perf logging only)
            // Return data for instantiation frame
            return { task, workerData };

        } catch (e) {
            console.error("Tile Fetch Error", e);
            this.visibilityAdapter?.detachDecodedIsland(tileKey);
            this.tileStates.delete(`${task.t.yq}_${task.t.yr}`);
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

    buildBootstrapTexture(texResult) {
        const texture = new THREE.Texture(texResult.imageBitmap);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
        texture.flipY = false;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.onUpdate = () => {
            texResult.imageBitmap?.close?.();
            texture.onUpdate = null;
        };
        texture.needsUpdate = true;
        return texture;
    }

    // Dumb telemetry accumulator for the perf harness — no logging loop, just
    // running totals read externally via window.pistonViewer.texStats.
    updateTexStats(texResult) {
        if (this.texStats.count === 0 && Number.isFinite(performance.memory?.usedJSHeapSize)) {
            // Chromium-only diagnostic; null elsewhere is an explicit gate.
            this.texStats.firstTextureHeapBytes = performance.memory.usedJSHeapSize;
        }
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
        const hasDisplayedPage = Object.values(displayed).some(pages => pages.size > 0);
        if (hasDisplayedPage) this._finishTextureBootstrapPhase();
        if (!this._textureMilestonesDone && hasDisplayedPage) {
            this.profiler?.milestone('firstTexture');
            // Do not wait for guard/background geometry to drain: that is not
            // part of the visible-coverage claim and can stream indefinitely.
            // Instead require every currently visible island to be resident
            // plus every rendered visible material to have a real page bound.
            const visibleGeometryPending = Array.from(this.visibilityByKey.entries()).some(
                ([key, visibility]) => visibility?.classification === 'visible' && !this.tiles.has(key),
            );
            if (!visibleGeometryPending && countUnpaintedVisibleTiles(this.tiles, this.visibilityByKey) === 0) {
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

        // PowFinder atlas: created lazily here, the first time it's needed
        // (design doc §1.7's "manifest loaded" event) — this.manifest is
        // guaranteed populated by the time any tile instantiates, unlike at
        // construction time (see the constructor's comment). If a fixture
        // finished loading before any tile existed, install it now.
        if (!this.powfinder.atlas && this.manifest) {
            this.powfinder.atlas = createSidecarAtlas(THREE, { manifest: this.manifest });
            // Wire the atlas texture into the shared uniform every material
            // reads by object identity (same pattern as sidecarLut in the
            // constructor) — without this the vertex fetch samples the
            // uniform's null default and every tile reads NODATA forever.
            this.sharedMaterialUniforms.sidecarAtlas.value = this.powfinder.atlas.texture;
            if (this.powfinder.sqhPyramid) {
                this.powfinder.atlas.installLayer('sqh', this.powfinder.sqhPyramid);
            }
        }
        const sidecarAtlas = this.powfinder.atlas;
        const sidecarSlot = sidecarAtlas ? sidecarAtlas.slotFor(key) : null;
        const sidecarRowBase = sidecarSlot === null ? 0 : sidecarSlot * sidecarAtlas.rowsPerTile;
        const sidecarValid = sidecarAtlas && sidecarSlot !== null && sidecarAtlas.hasData(sidecarSlot) ? 1 : 0;

        // Final Hygiene Check (Camera might have moved while worker was working)
        if (this.tiles.has(key)) return;

        // --- LEDGER: Track network payload from worker response ---
        if (workerData.networkBytes) {
            this.vramLedger.addNetworkPayload(key, workerData.networkBytes);
        }

        if (this.visibilityByKey.get(key)?.classification === 'outside') {
            this.visibilityAdapter?.detachDecodedIsland(key);
            this.tileStates.delete(key);
            return;
        }

        try {
            if (!workerData.lods) {
                throw new Error(`tile ${key} reached instantiation before deferred geometry was built`);
            }
            if (workerData.visibilityData) {
                this.visibilityAdapter.attachDecodedIsland(key, workerData.visibilityData);
            }

            // Page-level demand owns the one-way startup bridge. Instantiating
            // geometry must never resurrect yellow or outrank queued KTX2.
            if (!this.bootstrapDiagnostics.firstConsumer) {
                this.bootstrapDiagnostics.firstConsumer = {
                    tileKey: key,
                    t: performance.now() - this.appStartTime,
                    pageKeys: [...t.texturePageKeys],
                    states: t.texturePageKeys.map(pageKey => {
                        const state = this.textureStates.get(pageKey);
                        return {
                            key: pageKey,
                            available: Boolean(state),
                            bootstrapResident: Boolean(state?.assets.has(TEXTURE_TIER.BOOTSTRAP)),
                            bootstrapQueued: isTier(state, TEXTURE_TIER.BOOTSTRAP, TIER_STATE.QUEUED),
                            bootstrapLoading: isTier(state, TEXTURE_TIER.BOOTSTRAP, TIER_STATE.LOADING),
                        };
                    }),
                };
            }

            // Create one shared base material for the tile. Texture ownership
            // remains with texture page residency, not this material or geometry.
            const sharedMaterial = this.createTileMaterial(0);
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
                // THREE.Material.clone() JSON-serializes userData. Bind page
                // textures only after cloning so ImageBitmap-backed bootstrap
                // textures never pass through Texture.toJSON().
                this._applyTexturePageBindings(layerMaterial, t.texturePageKeys);
                this._applySidecarBinding(layerMaterial, sidecarRowBase, sidecarValid);
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
            this._applyTexturePageBindings(sharedMaterial, t.texturePageKeys);
            this._applySidecarBinding(sharedMaterial, sidecarRowBase, sidecarValid);
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
            this.materialChurn.compileCalls++;
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
            this.materialChurn.traversalCalls++;
            containerGroup.traverse((child) => {
                this.materialChurn.traversedObjects++;
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
            this.resourceLifecycles.settled('geometry', key, { cause: 'gpu-instantiated' });
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
            // A bootstrap page can arrive before its first geometry consumer.
            // Re-evaluate paint milestones when that consumer is attached;
            // otherwise the profiler waits for an unrelated later texture
            // result and reports a falsely slow first textured frame.
            this._updateTexBadge();

            this.tileStates.delete(key);
            if (!this.loaderHidden) {
                this.loadingScreen.terrainDone(workerData.networkBytes?.bin || 0);
            }

        } catch (e) {
            console.error("Instantiation Error", key, e);
            this.tileStates.delete(key);
            this.visibilityAdapter?.detachDecodedIsland(key);
        }
    }

    // The finest BUILT level of a tile ignores its band's near edge (its
    // shader draws all the way to the camera) until finer levels exist.
    _markFinestBuilt(tile) {
        if (!tile.mesh) return;
        this.materialChurn.traversalCalls++;
        tile.mesh.traverse(obj => {
            this.materialChurn.traversedObjects++;
            if (obj.isMesh && obj.material?.userData) {
                const ud = obj.material.userData;
                ud.isFinest = (ud.lodIdx === tile.finestBuilt);
                this._syncMaterialLodUniforms(obj.material);
            }
        });
    }

    _syncMaterialLodUniforms(material) {
        const shader = material?.userData?.shader;
        const lodIdx = material?.userData?.lodIdx;
        if (!shader || lodIdx === undefined) return;
        const lodRadiiSource = material.userData.forceMovingMode && lodIdx === this.movingLevel
            ? this.sharedMaterialUniforms.movingLodRadii
            : this.sharedMaterialUniforms.lodRadii[lodIdx];
        shader.uniforms.uLodRadii.value = lodRadiiSource.value;
        writeUniformIfChanged(
            shader.uniforms.uFinestBuilt,
            material.userData.forceMovingMode && lodIdx === this.movingLevel
                ? 1.0
                : (material.userData.isFinest ? 1.0 : 0.0),
            this.materialChurn,
        );
    }

    // parseBinaryV3 removed (handled by worker)
    // swapGeometry removed — level selection is fully per-instance in the
    // shader (CDLOD cut), and the flattened-cap look IS the 2D mode.

    unloadTile(key) {
        const tile = this.tiles.get(key);
        if (!tile) return;

        // PowFinder: nothing to release here. The atlas row a tile owns is
        // keyed by its static manifest slot (design doc §1.5), not by tile
        // residency, so evicting geometry never frees it — only the pooled
        // LRU variant (not built for beta) would need an atlas.release(key)
        // call at this point.

        // --- INCINERATOR: Rigorous GPU Disposal Pipeline ---
        this._disposeTileGPU(tile);

        // --- LEDGER: Deregister VRAM tracking ---
        this.vramLedger.deregisterGeometry(key);

        this.tiles.delete(key);
        this.tileStates.delete(key);
        this.resourceLifecycles.delete('geometry', key);
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
            this.materialChurn.traversalCalls++;
            tile.mesh.traverse(obj => {
                this.materialChurn.traversedObjects++;
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
        this.loadingScreen.hide();

        // Init Search Bar now that we are live
        this.searchBar = new HexSearch();
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
    updateNavigationOverlay() {
        if (!this.distanceScaleBarEl || !this.distanceScaleLabelEl || !this.compassNeedleEl) return;
        const state = navigationOverlayState({ camera: this.camera, target: this.controls.target,
            viewportWidth: this.renderer.domElement.clientWidth, viewportHeight: this.renderer.domElement.clientHeight });
        this.distanceScaleBarEl.style.width = `${state.pixels.toFixed(1)}px`;
        this.distanceScaleLabelEl.textContent = state.label;
        this.compassNeedleEl.style.transform = `rotate(${state.compassRotation.toFixed(2)}deg)`;
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
        writeUniformIfChanged(
            this.sharedMaterialUniforms.floorOffset,
            this.floorState.value,
            this.materialChurn,
        );
    }

    getMaterialChurnStats() { return snapshotMaterialChurnStats(this.materialChurn); }

    getLodSelectionFingerprint() {
        const tiles = Array.from(this.tiles.entries()).map(([key, tile]) => ({
            key,
            finestBuilt: tile.finestBuilt,
            selection: tile.geometrySelection?.signature || null,
            visibleLevels: (tile.mesh?.children || [])
                .filter(child => child.visible)
                .map(child => child.userData?.gosperLevel)
                .filter(Number.isFinite)
                .sort((a, b) => a - b),
        })).sort((a, b) => a.key.localeCompare(b.key));
        return { movingLevel: this.movingLevel, isMoving: this.isMovingView, tiles };
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

        const residentTiers = { bootstrap64: 0, low128: 0, medium256: 0, high4096: 0 };
        const activeTiers = { bootstrap64: 0, low128: 0, medium256: 0, high4096: 0, none: 0 };
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
            appLifecycle: this.appLifecycle.snapshot(),
            resourceLifecycles: this.resourceLifecycles.snapshot(),
            capability: {
                profile: this.capabilityProfile.name,
                workers: this.capabilityProfile.workerCount,
                textureBudgetBytes: this.capabilityProfile.textureBudgetBytes,
                maxTextureJobs: this.capabilityProfile.maxTextureJobs,
                highTextureDistanceM: this._effectiveHighTextureDistanceM(),
                guardMarginScale: this.capabilityProfile.guardMarginScale,
            },
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
                bootstrapPolicy: {
                    active: this.bootstrapPhaseActive,
                    pageSizePx: BOOTSTRAP_PAGE_SIZE_PX,
                    decodedBytesPerPage: BOOTSTRAP_GPU_BYTES_PER_PAGE,
                    budgetBytes: TEXTURE_CONFIG.bootstrapBudgetBytes,
                    residentPages: residentTiers[TEXTURE_TIER.BOOTSTRAP],
                    residentBytes: Array.from(this.vramLedger.textureEntries.values())
                        .filter(entry => entry.tier === TEXTURE_TIER.BOOTSTRAP)
                        .reduce((sum, entry) => sum + entry.bytes, 0),
                    requestedPages: Array.from(this.textureStates.values()).filter(state => (
                        state.assets.has(TEXTURE_TIER.BOOTSTRAP)
                        || isTier(state, TEXTURE_TIER.BOOTSTRAP, TIER_STATE.LOADING)
                        || isTier(state, TEXTURE_TIER.BOOTSTRAP, TIER_STATE.QUEUED)
                    )).length,
                },
                resident: residentTiers,
                active: activeTiers,
                desired: desiredTiers,
                loading: Array.from(this.textureStates.values())
                    .reduce((sum, state) => sum + Array.from(state.tierStates.values()).filter(v => v === TIER_STATE.LOADING).length, 0),
                queued: this.textureQueue.length,
                resultQueue: this.textureResultQueue.length,
                thresholdsDistanceM: {
                    highEnter: this._effectiveHighTextureDistanceM(),
                    highExit: this._effectiveHighTextureExitDistanceM(),
                },
                maxTextureSize: this.texStats.maxTextureSize,
                highSourceSize: this.texStats.highSourceSize,
                highUploadSize: this.texStats.highUploadSize,
                highSkippedTopMips: this.texStats.highSkippedTopMips,
                workerLane: { ...this.workerLaneStats.texture },
            },
            workerLanes: {
                geometry: { ...this.workerLaneStats.geometry },
                texture: { ...this.workerLaneStats.texture },
                viewEpoch: this.viewEpoch,
            },
            failures: {
                manifest: {
                    finalFailures: this.failureStats.manifestFailures,
                    attemptsUsed: manifestRetry.attempts,
                    exhausted: manifestRetry.exhausted,
                },
                tiles: {
                    failed: Array.from(this.tileStates.values()).filter(v => v === 'failed').length,
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
                    recoveryDurationMs: this.contextRecovery.durationMs,
                    startedAt: this.contextRecovery.startedAt,
                    restoredAt: this.contextRecovery.restoredAt,
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
        this._syncAppLifecycleWithEngine();
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
        this.updateNavigationOverlay();
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
        this.materialChurn.uniformPasses++;
        writeUniformIfChanged(this.sharedMaterialUniforms.heightFactor, h, this.materialChurn);
        writeUniformIfChanged(this.sharedMaterialUniforms.floorOffset, this.floorState.value, this.materialChurn);
        writeUniformIfChanged(this.sharedMaterialUniforms.cameraPos, this.camera.position, this.materialChurn);
        writeUniformIfChanged(this.sharedMaterialUniforms.gradientMode, this.gradientMode, this.materialChurn);
        for (let k = 0; k <= TILE_LEVEL; k++) {
            writeUniformIfChanged(this.sharedMaterialUniforms.lodRadii[k], {
                x: k <= 0 ? 0.0 : this.lodRadii[k - 1],
                y: this.lodRadii[k],
            }, this.materialChurn);
        }
        // PowFinder 2D<->3D crossfade (design doc §2.4): caps carry full
        // tint at h=0 (flat map, skirts are zero-area so caps are the only
        // surface that exists), skirts carry it at h>=0.35 (house rule:
        // caps stay imagery-toned in the piston view). smoothstep, not
        // lerp, so the handoff eases in/out instead of a linear ramp.
        const sidecarT = Math.min(1, Math.max(0, (h - 0.05) / 0.30));
        const sidecarSmooth = sidecarT * sidecarT * (3 - 2 * sidecarT);
        writeUniformIfChanged(this.sharedMaterialUniforms.sidecarMix, {
            x: 1 - sidecarSmooth,
            y: sidecarSmooth,
        }, this.materialChurn);
        const needsUpdateCount = 0;

        // --- RENDER ---
        this.renderer.render(this.scene, this.camera);

        // ===== END TIMED RENDER CYCLE =====
        const cycleDuration = performance.now() - cycleStart;
        recordRenderCycle(this.materialChurn, cycleDuration);
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
            || this.textureResultQueue.length > 0
            || this.powfinder?.hasPendingWork();
    }
}

new PistonViewer();
initBenchmark(window.pistonViewer, APP_VERSION);
