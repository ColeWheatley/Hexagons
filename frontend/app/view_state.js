// Shareable, human-readable camera URLs. Horizontal scene coordinates are
// serialized as GPS using coordinate_utility's Tirol calibration. Vertical
// coordinates remain explicitly renderer-scene meters: the terrain renderer
// dynamically subtracts a view-dependent floor and morphs height with pitch,
// so camera.position.y is not an absolute elevation above sea level.
import { initProjection, latLonToWorld, worldToLatLon } from './coordinate_utility.js?v=frustum9';

const SCHEMA_VERSION = '1';
const SETTLE_DEBOUNCE_MS = 450;

function parsePoint(value) {
    if (!value) return null;
    const parts = value.split(',');
    if (parts.length !== 3) return null;
    const [lat, lon, sceneY] = parts.map(Number);
    if (![lat, lon, sceneY].every(Number.isFinite)) return null;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180 || Math.abs(sceneY) > 100000) return null;
    return { lat, lon, sceneY };
}

function formatPoint(point) {
    return `${point.lat.toFixed(8)},${point.lon.toFixed(8)},${point.sceneY.toFixed(3)}`;
}

function round(value, digits = 3) {
    const scale = 10 ** digits;
    return Math.round(value * scale) / scale;
}

export class ShareableViewState {
    constructor(viewer) {
        this.viewer = viewer;
        this.writeTimer = null;
        this.userGestureChanged = false;

        viewer.controls.addEventListener('start', () => {
            this.userGestureChanged = false;
            clearTimeout(this.writeTimer);
        });
        viewer.controls.addEventListener('change', () => {
            // Ignore programmatic camera/floor/render changes. Only a controls
            // gesture earns a URL update when its matching `end` arrives.
            if (viewer.isUserInteracting) this.userGestureChanged = true;
        });
        viewer.controls.addEventListener('end', () => {
            if (!this.userGestureChanged) return;
            clearTimeout(this.writeTimer);
            this.writeTimer = setTimeout(() => {
                if (!viewer.isUserInteracting) this.replaceUrl();
            }, SETTLE_DEBOUNCE_MS);
        });

        const copyButton = document.getElementById('copy-view-link');
        copyButton?.addEventListener('click', async () => {
            const url = this.replaceUrl();
            let copied = false;
            try {
                await navigator.clipboard.writeText(url);
                copied = true;
            } catch (_) {
                // Clipboard permission can be unavailable in embedded browsers;
                // the URL bar is still updated and selectable.
            }
            copyButton.textContent = copied ? 'COPIED' : 'URL UPDATED';
            setTimeout(() => { copyButton.textContent = 'COPY LINK'; }, 1400);
        });

        // Stable troubleshooting surface for humans, the browser console, and
        // automation. applyUrl() accepts either a full URL or a query string.
        window.hexView = {
            getState: () => this.getState(),
            getUrl: () => this.buildUrl().href,
            copyLink: () => this.copyLink(),
            applyUrl: (url) => this.applyUrl(url),
        };
    }

    sceneToGps(vector) {
        const worldX = vector.x + this.viewer.worldOrigin.x;
        const worldY = this.viewer.worldOrigin.y - vector.z;
        const gps = worldToLatLon(worldX, worldY);
        return gps ? { ...gps, sceneY: vector.y } : null;
    }

    gpsToScene(point) {
        const world = latLonToWorld(point.lat, point.lon);
        return {
            x: world.x - this.viewer.worldOrigin.x,
            y: point.sceneY,
            z: -(world.y - this.viewer.worldOrigin.y),
        };
    }

    getState() {
        const camera = this.sceneToGps(this.viewer.camera.position);
        const target = this.sceneToGps(this.viewer.controls.target);
        if (!camera || !target) return null;

        const dx = this.viewer.camera.position.x - this.viewer.controls.target.x;
        const dy = this.viewer.camera.position.y - this.viewer.controls.target.y;
        const dz = this.viewer.camera.position.z - this.viewer.controls.target.z;
        const horizontal = Math.hypot(dx, dz);
        const morph = Math.min(1, Math.max(0,
            (this.viewer.controls.getPolarAngle() * 180 / Math.PI - 5.5) / (25.0 - 5.5)));
        const floor = this.viewer.floorState?.value;
        const cameraMslEstimate = morph > 0.001 && Number.isFinite(floor)
            ? floor + this.viewer.camera.position.y / morph
            : null;

        return {
            schema: 1,
            target: { lat: round(target.lat, 8), lon: round(target.lon, 8), sceneY_m: round(target.sceneY) },
            camera: { lat: round(camera.lat, 8), lon: round(camera.lon, 8), sceneY_m: round(camera.sceneY) },
            orientation: {
                bearing_deg: round((Math.atan2(dx, -dz) * 180 / Math.PI + 360) % 360, 2),
                pitch_deg: round(Math.atan2(dy, horizontal) * 180 / Math.PI, 2),
                range_m: round(Math.hypot(horizontal, dy), 2),
            },
            vertical: {
                datum: 'dynamic-view-floor',
                floor_source_elevation_m: Number.isFinite(floor) ? round(floor, 1) : null,
                terrain_height_morph: round(morph, 4),
                camera_source_elevation_estimate_m: cameraMslEstimate === null ? null : round(cameraMslEstimate, 1),
                note: 'URL sceneY values are renderer-scene meters, not absolute MSL elevations.',
            },
        };
    }

    buildUrl() {
        const state = this.getState();
        const url = new URL(window.location.href);
        if (!state) return url;
        url.searchParams.set('view', SCHEMA_VERSION);
        url.searchParams.set('at', formatPoint({
            lat: state.target.lat, lon: state.target.lon, sceneY: state.target.sceneY_m,
        }));
        url.searchParams.set('eye', formatPoint({
            lat: state.camera.lat, lon: state.camera.lon, sceneY: state.camera.sceneY_m,
        }));
        return url;
    }

    replaceUrl() {
        const url = this.buildUrl();
        if (url.href !== window.location.href) history.replaceState(history.state, '', url);
        return url.href;
    }

    async copyLink() {
        const url = this.replaceUrl();
        await navigator.clipboard.writeText(url);
        return url;
    }

    async applyUrl(input = window.location.href) {
        let url;
        try {
            url = input.startsWith?.('?')
                ? new URL(input, window.location.href)
                : new URL(input, window.location.href);
        } catch (_) {
            return false;
        }
        if (url.searchParams.get('view') !== SCHEMA_VERSION) return false;
        const target = parsePoint(url.searchParams.get('at'));
        const camera = parsePoint(url.searchParams.get('eye'));
        if (!target || !camera || !(await initProjection())) return false;

        const targetScene = this.gpsToScene(target);
        const cameraScene = this.gpsToScene(camera);
        const separation = Math.hypot(
            cameraScene.x - targetScene.x,
            cameraScene.y - targetScene.y,
            cameraScene.z - targetScene.z,
        );
        if (!Number.isFinite(separation) || separation < 1 || separation > 100000) return false;

        this.viewer.bootstrapVisibilityFloor?.(targetScene);
        this.viewer.controls.target.set(targetScene.x, targetScene.y, targetScene.z);
        this.viewer.camera.position.set(cameraScene.x, cameraScene.y, cameraScene.z);
        const now = performance.now();
        this.viewer.notifyCameraMotion(now);
        this.viewer.controls.update();
        this.viewer.syncHeightFactorFromControls?.();
        this.viewer.lastLODCamPos.copy(this.viewer.camera.position);
        this.viewer.needsLODUpdate = true;
        this.viewer.needsRender = true;
        return true;
    }

    async restoreFromUrl() {
        const params = new URLSearchParams(window.location.search);
        if (!params.has('view') && !params.has('at') && !params.has('eye')) {
            await initProjection(); // prepare GPS output for the first user move
            return false;
        }
        const restored = await this.applyUrl(window.location.href);
        if (!restored) this.viewer.log('Invalid shareable view URL; using the default start.', 'warn');
        return restored;
    }
}
