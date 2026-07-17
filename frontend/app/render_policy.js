// Rendering policy and static-geometry helpers kept dependency-free so their
// behavior can be verified without a browser/WebGL context.

export const MAX_RENDER_DPR = 2;

export function cappedRenderDpr(devicePixelRatio, maxDpr = MAX_RENDER_DPR) {
    const nativeDpr = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0
        ? devicePixelRatio
        : 1;
    return Math.min(nativeDpr, maxDpr);
}

export function isBenchmarkLocation(search = '') {
    return new URLSearchParams(search).has('bench');
}

// The production policy is always capped.  A benchmark can explicitly opt
// into the old native behavior so that a DPR>2 run compares identical code,
// scene, browser, and device scale factor.  Do not make this a general URL
// setting: it exists solely to produce an auditable capped-vs-native report.
export function renderDprCapForLocation(search = '', devicePixelRatio = 1) {
    const params = new URLSearchParams(search);
    if (!params.has('bench') || params.get('benchRenderDprCap') !== 'native') {
        return MAX_RENDER_DPR;
    }
    return Number.isFinite(devicePixelRatio) && devicePixelRatio > 0
        ? devicePixelRatio
        : MAX_RENDER_DPR;
}

export function rendererOptionsForLocation(search = '') {
    // Keeping the back buffer is only required for the CDP benchmark runner's
    // final screenshot. Normal interactive rendering can discard it promptly.
    return Object.freeze({
        antialias: true,
        preserveDrawingBuffer: isBenchmarkLocation(search),
    });
}

export function applyRenderResolution(renderer, {
    width,
    height,
    devicePixelRatio,
    maxDpr = MAX_RENDER_DPR,
} = {}) {
    const pixelRatio = cappedRenderDpr(devicePixelRatio, maxDpr);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height);
    return pixelRatio;
}

// A display can change DPR when a window crosses monitors without changing its
// CSS dimensions. Re-arm the resolution media query after every transition,
// because the old query only fires for the DPR it was created with.
export function watchDevicePixelRatio(win, onChange) {
    if (!win?.matchMedia) return () => {};

    let mediaQuery = null;
    const onMediaChange = () => {
        arm();
        onChange(cappedRenderDpr(win.devicePixelRatio));
    };
    const arm = () => {
        if (mediaQuery) {
            if (mediaQuery.removeEventListener) mediaQuery.removeEventListener('change', onMediaChange);
            else mediaQuery.removeListener?.(onMediaChange);
        }
        mediaQuery = win.matchMedia(`(resolution: ${win.devicePixelRatio}dppx)`);
        if (mediaQuery.addEventListener) mediaQuery.addEventListener('change', onMediaChange);
        else mediaQuery.addListener?.(onMediaChange);
    };

    arm();
    return () => {
        if (mediaQuery?.removeEventListener) mediaQuery.removeEventListener('change', onMediaChange);
        else mediaQuery?.removeListener?.(onMediaChange);
    };
}

// A BufferGeometry may own per-mesh instanced attributes, but its immutable
// vertex/index attributes can be referenced directly. Three.js caches GPU
// buffers by BufferAttribute identity, so this prevents an identical cap or
// skirt from being uploaded once for every LOD mesh.
export function createGeometryWithSharedStaticBuffers(THREE, source) {
    const geometry = new THREE.BufferGeometry();
    if (source.index) geometry.setIndex(source.index);
    for (const [name, attribute] of Object.entries(source.attributes)) {
        geometry.setAttribute(name, attribute);
    }
    geometry.groups = source.groups.map(group => ({ ...group }));
    geometry.drawRange.start = source.drawRange.start;
    geometry.drawRange.count = source.drawRange.count;
    geometry.boundingBox = source.boundingBox;
    geometry.boundingSphere = source.boundingSphere;
    geometry.userData.sharedStaticBufferNames = Object.keys(source.attributes);
    geometry.userData.hasSharedStaticIndex = Boolean(source.index);
    return geometry;
}

// WebGLGeometries removes every attribute currently attached to a geometry on
// dispose(). Detach the shared immutable buffers first so retiring one tile
// cannot evict them from Three's attribute-identity cache while sibling tile
// meshes still use them. The geometry itself and all per-mesh instance buffers
// are still released normally.
export function disposeGeometryWithSharedStaticBuffers(geometry) {
    const names = geometry?.userData?.sharedStaticBufferNames;
    if (!names) {
        geometry?.dispose?.();
        return;
    }
    for (const name of names) geometry.deleteAttribute(name);
    if (geometry.userData.hasSharedStaticIndex) geometry.setIndex(null);
    geometry.dispose();
}

const LOD_INSTANCE_ATTRIBUTE_LAYOUT = Object.freeze([
    ['instanceNZ_1', 'nz1', 4],
    ['instanceNZ_2', 'nz2', 4],
    ['instanceSlopes', 'slopes', 3],
    ['instanceDeltas', 'deltas', 3],
    ['instanceNormal', 'norms', 2],
    ['aParentPos', 'parentPos', 2],
    ['aParentHeight', 'parentHeight', 1],
]);

export function createSharedLodInstanceAttributes(THREE, lodData) {
    const attributes = {
        instanceMatrix: new THREE.InstancedBufferAttribute(lodData.matrix, 16),
    };
    for (const [name, source, itemSize] of LOD_INSTANCE_ATTRIBUTE_LAYOUT) {
        attributes[name] = new THREE.InstancedBufferAttribute(lodData[source], itemSize);
    }
    return attributes;
}

export function bindSharedLodInstanceAttributes(meshes, attributes) {
    for (const mesh of meshes) {
        mesh.instanceMatrix = attributes.instanceMatrix;
        for (const [name] of LOD_INSTANCE_ATTRIBUTE_LAYOUT) {
            mesh.geometry.setAttribute(name, attributes[name]);
        }
    }
}

export function staticBufferSharingStats(meshes) {
    const staticAttributes = new Set();
    let references = 0;
    for (const mesh of meshes) {
        const { geometry } = mesh;
        if (geometry.index) {
            staticAttributes.add(geometry.index);
            references++;
        }
        for (const attribute of Object.values(geometry.attributes)) {
            if (attribute.isInstancedBufferAttribute) continue;
            staticAttributes.add(attribute);
            references++;
        }
    }
    return Object.freeze({
        staticAttributeReferences: references,
        uniqueStaticAttributes: staticAttributes.size,
        avoidedStaticAttributeUploads: references - staticAttributes.size,
    });
}
