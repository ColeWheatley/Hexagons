import * as THREE from 'three';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { BasisV2KTX2Loader } from '../BasisV2KTX2Loader.js';

const FORMAT_NAMES = new Map([
    [THREE.RGBA_ASTC_4x4_Format, 'RGBA ASTC 4x4'],
    [THREE.RGBA_ASTC_5x4_Format, 'RGBA ASTC 5x4'],
    [THREE.RGBA_ASTC_5x5_Format, 'RGBA ASTC 5x5'],
    [THREE.RGBA_ASTC_6x5_Format, 'RGBA ASTC 6x5'],
    [THREE.RGBA_ASTC_6x6_Format, 'RGBA ASTC 6x6'],
    [THREE.RGBA_ASTC_8x5_Format, 'RGBA ASTC 8x5'],
    [THREE.RGBA_ASTC_8x6_Format, 'RGBA ASTC 8x6'],
    [THREE.RGBA_ASTC_8x8_Format, 'RGBA ASTC 8x8'],
    [THREE.RGBA_ASTC_10x5_Format, 'RGBA ASTC 10x5'],
    [THREE.RGBA_ASTC_10x6_Format, 'RGBA ASTC 10x6'],
    [THREE.RGBA_ASTC_10x8_Format, 'RGBA ASTC 10x8'],
    [THREE.RGBA_ASTC_10x10_Format, 'RGBA ASTC 10x10'],
    [THREE.RGBA_ASTC_12x10_Format, 'RGBA ASTC 12x10'],
    [THREE.RGBA_ASTC_12x12_Format, 'RGBA ASTC 12x12'],
    [THREE.RGBA_BPTC_Format, 'RGBA BPTC / BC7'],
    [THREE.RGBA_ETC2_EAC_Format, 'RGBA ETC2 EAC'],
    [THREE.RGBA_PVRTC_4BPPV1_Format, 'RGBA PVRTC 4bpp'],
    [THREE.RGBA_S3TC_DXT5_Format, 'RGBA S3TC DXT5 / BC3'],
    [THREE.RGB_ETC1_Format, 'RGB ETC1'],
    [THREE.RGB_ETC2_Format, 'RGB ETC2'],
    [THREE.RGB_PVRTC_4BPPV1_Format, 'RGB PVRTC 4bpp'],
    [THREE.RGB_S3TC_DXT1_Format, 'RGB S3TC DXT1 / BC1'],
    [THREE.RGBAFormat, 'RGBA32 fallback'],
]);

const canvas = document.querySelector('#stage');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
renderer.setClearColor(0x111418, 1);

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
camera.position.z = 4;

const root = new THREE.Group();
scene.add(root);

const loader = new KTX2Loader()
    .setTranscoderPath('/node_modules/three/examples/jsm/libs/basis/')
    .setWorkerLimit(4)
    .detectSupport(renderer);
const basisV2Loader = new BasisV2KTX2Loader(renderer, { transcoderPath: '../vendor/basisu_v2/' });

let manifest;
let stateIndex = 0;
let activeGroup;
let activeTextures = [];
let playing = false;
let timer = null;

const els = {
    play: document.querySelector('#play'),
    prev: document.querySelector('#prev'),
    next: document.querySelector('#next'),
    zoom: document.querySelector('#zoom'),
    raw: document.querySelector('#raw-containers'),
    state: document.querySelector('#state-report'),
    format: document.querySelector('#format-report'),
    totals: document.querySelector('#totals'),
    source: document.querySelector('#source-report'),
};

function fmtBytes(bytes) {
    const units = ['B', 'KiB', 'MiB', 'GiB'];
    let value = bytes;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
        value /= 1024;
        unit++;
    }
    return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function disposeActive() {
    if (activeGroup) {
        root.remove(activeGroup);
        activeGroup.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
        activeGroup = null;
    }
    activeTextures.forEach((texture) => texture.dispose());
    activeTextures = [];
}

function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height, false);
    const aspect = rect.width / Math.max(1, rect.height);
    camera.left = -aspect;
    camera.right = aspect;
    camera.top = 1;
    camera.bottom = -1;
    camera.updateProjectionMatrix();
    render();
}

function render() {
    renderer.render(scene, camera);
}

function mipBytes(texture) {
    if (!texture?.mipmaps) return 0;
    return texture.mipmaps.reduce((sum, mip) => sum + (mip.data?.byteLength || 0), 0);
}

async function loadTexture(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`${path} failed: ${response.status}`);
    const bytes = await response.arrayBuffer();
    const startTranscode = performance.now();
    const isXUASTC = manifest.basis.codec.startsWith('xuastc');
    const loaded = isXUASTC
        ? await basisV2Loader.parse(bytes)
        : { texture: await loader._createTexture(bytes) };
    const texture = loaded.texture;
    texture.userData = {
        networkBytes: bytes.byteLength,
        gpuBytes: loaded.gpuBytes ?? mipBytes(texture),
        transcodeMs: loaded.transcodeMs ?? performance.now() - startTranscode,
        loaderName: loaded.loaderName ?? 'Three KTX2Loader',
        sourceKind: loaded.sourceKind ?? manifest.basis.payload,
        formatName: loaded.formatName ?? FORMAT_NAMES.get(texture.format) ?? `Three format ${texture.format}`,
    };
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    activeTextures.push(texture);
    return texture;
}

async function mapLimit(items, limit, fn) {
    const results = new Array(items.length);
    let next = 0;
    async function worker() {
        while (next < items.length) {
            const index = next++;
            results[index] = await fn(items[index], index);
        }
    }
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
    return results;
}

function setUvFromLocalBounds(geometry, width, height) {
    const pos = geometry.attributes.position;
    const uv = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
        uv[i * 2] = pos.getX(i) / width + 0.5;
        uv[i * 2 + 1] = pos.getY(i) / height + 0.5;
    }
    geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

function makeHexGeometry(width, height) {
    const radius = width / 2;
    const points = [];
    for (const deg of [0, 60, 120, 180, 240, 300]) {
        const rad = THREE.MathUtils.degToRad(deg);
        points.push(new THREE.Vector2(radius * Math.cos(rad), (height / 2) * Math.sin(rad) / Math.sin(Math.PI / 3)));
    }
    const geometry = new THREE.ShapeGeometry(new THREE.Shape(points));
    setUvFromLocalBounds(geometry, width, height);
    return geometry;
}

function panelTransform(patch, state, panelX) {
    const [viewW, viewH] = state.viewPixels;
    const scale = 0.9 / viewH;
    return {
        x: panelX + (patch.x + patch.width / 2 - viewW / 2) * scale,
        y: -(patch.y + patch.height / 2 - viewH / 2) * scale,
        sx: patch.width * scale,
        sy: patch.height * scale,
    };
}

async function buildPatches(state, kind, panelX) {
    const group = new THREE.Group();
    const patches = state[kind].patches;
    const meshes = await mapLimit(patches, 16, async (patch) => {
        const texture = await loadTexture(`./${patch.path}`);
        const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
        let geometry;
        if (kind === 'hex' && !els.raw.checked) {
            geometry = makeHexGeometry(patch.width, patch.height);
        } else {
            geometry = new THREE.PlaneGeometry(patch.width, patch.height);
        }
        const mesh = new THREE.Mesh(geometry, material);
        const t = panelTransform(patch, state, panelX);
        mesh.position.set(t.x, t.y, 0);
        mesh.scale.set(0.9 / state.viewPixels[1], 0.9 / state.viewPixels[1], 1);
        return mesh;
    });
    meshes.forEach((mesh) => group.add(mesh));
    return group;
}

async function loadState(index) {
    stateIndex = Math.max(0, Math.min(manifest.states.length - 1, index));
    els.zoom.value = String(stateIndex);
    disposeActive();

    const state = manifest.states[stateIndex];
    els.state.innerHTML = [
        ['LOD', `${state.label} (scale ${state.scale})`],
        ['View pixels', `${state.viewPixels[0]} x ${state.viewPixels[1]}`],
        ['Square side', `${state.squareSidePixels}px / ${state.squareSideMeters.toFixed(1)}m`],
        ['Note', state.note],
    ].map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');

    activeGroup = new THREE.Group();
    root.add(activeGroup);
    const [rectGroup, hexGroup] = await Promise.all([
        buildPatches(state, 'rect', -0.62),
        buildPatches(state, 'hex', 0.62),
    ]);
    activeGroup.add(rectGroup, hexGroup);

    const firstTexture = activeTextures[0];
    els.format.innerHTML = [
        ['WebGL', renderer.capabilities.isWebGL2 ? 'WebGL 2' : 'WebGL 1'],
        ['Payload', `${manifest.basis.codec}: ${manifest.basis.payload}`],
        ['Loader', firstTexture.userData.loaderName],
        ['Source kind', firstTexture.userData.sourceKind],
        ['Selected format', firstTexture.userData.formatName],
        ['First texture GPU blocks', fmtBytes(firstTexture.userData.gpuBytes)],
        ['First transcode', `${firstTexture.userData.transcodeMs.toFixed(1)} ms`],
        ['ASTC support', String(renderer.extensions.has('WEBGL_compressed_texture_astc'))],
        ['BPTC support', String(renderer.extensions.has('EXT_texture_compression_bptc'))],
    ].map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');

    updateTotals(state);
    render();
}

function updateTotals(state) {
    const rows = ['rect', 'hex'].map((kind) => {
        const s = state[kind].summary;
        const gpuBytes = s.gpuBlockBytesEstimate ?? s.gpuAstc4BytesEstimate;
        const pink = s.pinkPixels ? `${s.pinkPixels.toLocaleString()} px` : '0 px';
        return `
            <tr>
                <td>${kind}</td>
                <td>${s.patchCount}</td>
                <td>${fmtBytes(s.ktx2Bytes)}</td>
                <td>${fmtBytes(gpuBytes)}</td>
                <td>${s.containerPixels.toLocaleString()}</td>
                <td>${pink}</td>
            </tr>`;
    }).join('');
    els.totals.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>tiling</th>
                    <th>files</th>
                    <th>KTX2</th>
                    <th>GPU block est.</th>
                    <th>container px</th>
                    <th>debug pink</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>`;
}

function step(delta) {
    loadState((stateIndex + delta + manifest.states.length) % manifest.states.length).catch(showError);
}

function togglePlay() {
    playing = !playing;
    els.play.textContent = playing ? 'Pause zoom' : 'Play zoom';
    if (timer) window.clearInterval(timer);
    if (playing) timer = window.setInterval(() => step(1), 3500);
}

function showError(error) {
    console.error(error);
    els.totals.innerHTML = `<p class="error">${error.message}</p>`;
}

async function boot() {
    const response = await fetch('./assets/production_manifest.json');
    if (!response.ok) throw new Error(`manifest failed: ${response.status}`);
    manifest = await response.json();
    els.zoom.max = String(manifest.states.length - 1);
    els.source.textContent = JSON.stringify({
        mosaicPixels: manifest.source.mosaicPixels,
        boundsMeters: manifest.source.boundsMeters,
        tifCount: manifest.source.tifs.length,
        basis: manifest.basis,
        unit: manifest.unit,
    }, null, 2);
    resize();
    await loadState(0);
}

els.play.addEventListener('click', togglePlay);
els.prev.addEventListener('click', () => step(-1));
els.next.addEventListener('click', () => step(1));
els.zoom.addEventListener('input', () => loadState(Number(els.zoom.value)).catch(showError));
els.raw.addEventListener('change', () => loadState(stateIndex).catch(showError));
window.addEventListener('resize', resize);

boot().catch(showError);
