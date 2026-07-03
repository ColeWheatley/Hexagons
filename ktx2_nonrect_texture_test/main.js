import * as THREE from 'three';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { BasisV2KTX2Loader } from './BasisV2KTX2Loader.js';

const FORMAT_NAMES = new Map([
    [THREE.RGBAFormat, 'RGBA32 fallback'],
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
]);

const CASE_DEFS = {
    rect: {
        label: 'A rectangle halves',
        pieces: [
            { name: 'rect_left', kind: 'rect-left' },
            { name: 'rect_right', kind: 'rect-right' },
        ],
    },
    lock: {
        label: 'B lock/key shared coordinates',
        pieces: [
            { name: 'lock_left', kind: 'lock-left' },
            { name: 'lock_right', kind: 'lock-right' },
        ],
    },
};

const state = {
    manifest: null,
    activeCodec: null,
    loaded: new Map(),
    groups: new Map(),
};

const canvas = document.querySelector('#viewport');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x121417, 1);

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1.9, 1.9, 1.15, -1.15, 0.1, 10);
camera.position.z = 4;

const root = new THREE.Group();
scene.add(root);

const loader = new KTX2Loader()
    .setTranscoderPath('/node_modules/three/examples/jsm/libs/basis/')
    .setWorkerLimit(2)
    .detectSupport(renderer);
const basisV2Loader = new BasisV2KTX2Loader(renderer, { transcoderPath: './vendor/basisu_v2/' });

const els = {
    codec: document.querySelector('#codec'),
    probe: document.querySelector('#probe'),
    loadRect: document.querySelector('#load-rect'),
    loadLock: document.querySelector('#load-lock'),
    loadBoth: document.querySelector('#load-both'),
    clear: document.querySelector('#clear'),
    browserReport: document.querySelector('#browser-report'),
    formatReport: document.querySelector('#format-report'),
    summaryReport: document.querySelector('#summary-report'),
    manifestReport: document.querySelector('#manifest-report'),
};

function fmtBytes(bytes) {
    if (!Number.isFinite(bytes)) return 'n/a';
    const units = ['B', 'KiB', 'MiB', 'GiB'];
    let value = bytes;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
        value /= 1024;
        unit++;
    }
    return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function formatName(format) {
    return FORMAT_NAMES.get(format) || `Three format ${format}`;
}

function mipBytes(texture) {
    if (!texture?.mipmaps) return 0;
    return texture.mipmaps.reduce((sum, mip) => sum + (mip.data?.byteLength || 0), 0);
}

function setStatus(message) {
    els.formatReport.innerHTML = `<p class="status">${message}</p>`;
}

function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height, false);
    const aspect = rect.width / Math.max(rect.height, 1);
    const baseHeight = 2.3;
    camera.left = -baseHeight * aspect * 0.5;
    camera.right = baseHeight * aspect * 0.5;
    camera.top = baseHeight * 0.5;
    camera.bottom = -baseHeight * 0.5;
    camera.updateProjectionMatrix();
    render();
}

function render() {
    renderer.render(scene, camera);
}

function supportReport() {
    const gl = renderer.getContext();
    const debug = gl.getExtension('WEBGL_debug_renderer_info');
    const rows = {
        'WebGL API': renderer.capabilities.isWebGL2 ? 'WebGL 2' : 'WebGL 1',
        'Vendor': debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
        'Renderer': debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
        'ASTC': Boolean(gl.getExtension('WEBGL_compressed_texture_astc')),
        'ETC / ETC2': Boolean(gl.getExtension('WEBGL_compressed_texture_etc')),
        'ETC1': Boolean(gl.getExtension('WEBGL_compressed_texture_etc1')),
        'S3TC / BC1-3': Boolean(gl.getExtension('WEBGL_compressed_texture_s3tc')),
        'BPTC / BC7': Boolean(gl.getExtension('EXT_texture_compression_bptc')),
        'PVRTC': Boolean(
            gl.getExtension('WEBGL_compressed_texture_pvrtc')
            || gl.getExtension('WEBKIT_WEBGL_compressed_texture_pvrtc')
        ),
        'Stock KTX2Loader': JSON.stringify(loader.workerConfig),
        'Basis v2 loader': 'enabled for xuastc_* payloads',
        'Active payload': state.activeCodec || 'manifest not loaded',
    };

    els.browserReport.innerHTML = Object.entries(rows)
        .map(([key, value]) => `<dt>${key}</dt><dd>${value}</dd>`)
        .join('');
}

async function loadManifest() {
    const response = await fetch('./assets/asset_manifest.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Manifest fetch failed: ${response.status}`);
    state.manifest = await response.json();
    const codecs = (state.manifest.preferredCodecOrder || Object.keys(state.manifest.codecs))
        .filter((codec) => state.manifest.codecs[codec]);
    if (codecs.length === 0) {
        throw new Error('Manifest contains no generated KTX2 codecs.');
    }
    els.codec.innerHTML = codecs.map((codec) => {
        const data = state.manifest.codecs[codec];
        return `<option value="${codec}">${data.label}</option>`;
    }).join('');
    state.activeCodec = codecs[0];
    els.codec.value = state.activeCodec;
    els.manifestReport.textContent = JSON.stringify({
        source: state.manifest.source,
        baseSize: state.manifest.baseSize,
        boundary: state.manifest.boundary,
        preferredCodecOrder: state.manifest.preferredCodecOrder,
        skippedCodecs: state.manifest.skippedCodecs,
        codecs: Object.fromEntries(
            Object.entries(state.manifest.codecs).map(([codec, data]) => [codec, data.label])
        ),
    }, null, 2);
    supportReport();
}

async function fetchTexture(caseName, pieceName) {
    const codec = state.activeCodec;
    if (!codec) throw new Error('No active KTX2 payload selected.');
    const manifestPiece = state.manifest.codecs[codec].files[pieceName];
    const url = `./${manifestPiece.path}`;
    const startFetch = performance.now();
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`${url} failed: ${response.status}`);
    const buffer = await response.arrayBuffer();
    const networkBytes = buffer.byteLength;
    const fetchMs = performance.now() - startFetch;

    const startTranscode = performance.now();
    const isXUASTC = codec.startsWith('xuastc');
    const loaded = isXUASTC
        ? await basisV2Loader.parse(buffer)
        : { texture: await loader._createTexture(buffer) };
    const texture = loaded.texture;
    const transcodeMs = loaded.transcodeMs ?? performance.now() - startTranscode;
    texture.name = `${codec}/${pieceName}`;
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    texture.needsUpdate = true;

    return {
        caseName,
        pieceName,
        codec,
        texture,
        url,
        networkBytes,
        fetchMs,
        transcodeMs,
        gpuBytes: loaded.gpuBytes ?? mipBytes(texture),
        format: texture.format,
        formatName: loaded.formatName ?? formatName(texture.format),
        loaderName: loaded.loaderName ?? 'Three KTX2Loader',
        sourceKind: loaded.sourceKind ?? state.manifest.codecs[codec].label,
        width: texture.image?.width || texture.mipmaps?.[0]?.width || manifestPiece.width,
        height: texture.image?.height || texture.mipmaps?.[0]?.height || manifestPiece.height,
        mipCount: texture.mipmaps?.length || 0,
        manifest: manifestPiece,
    };
}

function disposeLoaded() {
    for (const entry of state.loaded.values()) {
        entry.texture.dispose();
    }
    state.loaded.clear();
    for (const group of state.groups.values()) {
        root.remove(group);
        group.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
    }
    state.groups.clear();
    updateReports();
    render();
}

function makeMaterial(entry) {
    return new THREE.MeshBasicMaterial({
        map: entry.texture,
        side: THREE.DoubleSide,
    });
}

function boundary(v) {
    return 0.5 + 0.22 * Math.sin(2 * Math.PI * v);
}

function setUvFromPosition(geometry) {
    const pos = geometry.attributes.position;
    const uv = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
        uv[i * 2] = pos.getX(i) + 0.5;
        uv[i * 2 + 1] = pos.getY(i) + 0.5;
    }
    geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

function makeLockGeometry(side) {
    const steps = 96;
    const points = [];

    if (side === 'left') {
        points.push(new THREE.Vector2(-0.5, -0.5));
        for (let i = 0; i <= steps; i++) {
            const v = i / steps;
            points.push(new THREE.Vector2(boundary(v) - 0.5, v - 0.5));
        }
        points.push(new THREE.Vector2(-0.5, 0.5));
    } else {
        points.push(new THREE.Vector2(0.5, -0.5));
        points.push(new THREE.Vector2(0.5, 0.5));
        for (let i = steps; i >= 0; i--) {
            const v = i / steps;
            points.push(new THREE.Vector2(boundary(v) - 0.5, v - 0.5));
        }
    }

    const geometry = new THREE.ShapeGeometry(new THREE.Shape(points));
    setUvFromPosition(geometry);
    return geometry;
}

function makeRectMesh(entry, kind, scale = 1) {
    const width = kind === 'rect-container' ? 0.5 : 0.5;
    const geometry = new THREE.PlaneGeometry(width * scale, 1 * scale);
    const mesh = new THREE.Mesh(geometry, makeMaterial(entry));
    return mesh;
}

function addFrame(group, x, y, width, height, color) {
    const hw = width / 2;
    const hh = height / 2;
    const points = [
        new THREE.Vector3(x - hw, y - hh, 0.01),
        new THREE.Vector3(x + hw, y - hh, 0.01),
        new THREE.Vector3(x + hw, y + hh, 0.01),
        new THREE.Vector3(x - hw, y + hh, 0.01),
        new THREE.Vector3(x - hw, y - hh, 0.01),
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color });
    group.add(new THREE.Line(geometry, material));
}

function buildRectGroup(entries) {
    const group = new THREE.Group();
    const left = makeRectMesh(entries.rect_left, 'rect');
    left.position.x = -0.25;
    const right = makeRectMesh(entries.rect_right, 'rect');
    right.position.x = 0.25;
    group.add(left, right);
    addFrame(group, 0, 0, 1, 1, 0x56d6c9);

    const raw = new THREE.Group();
    raw.position.set(0, -0.84, 0);
    raw.scale.setScalar(0.34);
    const rawLeft = makeRectMesh(entries.rect_left, 'rect-container');
    rawLeft.position.x = -0.25;
    const rawRight = makeRectMesh(entries.rect_right, 'rect-container');
    rawRight.position.x = 0.25;
    raw.add(rawLeft, rawRight);
    addFrame(raw, 0, 0, 1, 1, 0xffc857);
    group.add(raw);
    return group;
}

function buildLockGroup(entries) {
    const group = new THREE.Group();
    const left = new THREE.Mesh(makeLockGeometry('left'), makeMaterial(entries.lock_left));
    const right = new THREE.Mesh(makeLockGeometry('right'), makeMaterial(entries.lock_right));
    group.add(left, right);
    addFrame(group, 0, 0, 1, 1, 0xf06449);

    const raw = new THREE.Group();
    raw.position.set(0, -0.84, 0);
    raw.scale.setScalar(0.23);
    const rawLeft = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), makeMaterial(entries.lock_left));
    const rawRight = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), makeMaterial(entries.lock_right));
    rawLeft.position.x = -0.58;
    rawRight.position.x = 0.58;
    raw.add(rawLeft, rawRight);
    addFrame(raw, -0.58, 0, 1, 1, 0xffc857);
    addFrame(raw, 0.58, 0, 1, 1, 0xffc857);
    group.add(raw);
    return group;
}

async function loadCase(caseName) {
    const codec = state.activeCodec;
    const key = `${codec}:${caseName}`;
    if (state.groups.has(key)) return;

    setStatus(`Loading ${CASE_DEFS[caseName].label} as ${codec} KTX2...`);
    const entries = {};
    await Promise.all(CASE_DEFS[caseName].pieces.map(async (piece) => {
        const entry = await fetchTexture(caseName, piece.name);
        state.loaded.set(`${codec}:${piece.name}`, entry);
        entries[piece.name] = entry;
    }));

    const group = caseName === 'rect' ? buildRectGroup(entries) : buildLockGroup(entries);
    group.position.x = caseName === 'rect' ? -0.72 : 0.72;
    group.position.y = 0.24;
    group.scale.setScalar(0.78);
    root.add(group);
    state.groups.set(key, group);
    updateReports();
    render();
}

function updateReports() {
    const rows = Array.from(state.loaded.values())
        .sort((a, b) => `${a.caseName}:${a.pieceName}`.localeCompare(`${b.caseName}:${b.pieceName}`));

    if (rows.length === 0) {
        els.formatReport.innerHTML = '<p class="status">No KTX2 textures loaded.</p>';
        els.summaryReport.innerHTML = '<p class="status">Load A, B, or both to compare totals.</p>';
        return;
    }

    els.formatReport.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Piece</th>
                    <th>Loader</th>
                    <th>Source</th>
                    <th>Selected GPU format</th>
                    <th>KTX2</th>
                    <th>GPU blocks</th>
                    <th>Dims</th>
                    <th>Mips</th>
                </tr>
            </thead>
            <tbody>
                ${rows.map((entry) => `
                    <tr>
                        <td>${entry.codec}/${entry.pieceName}</td>
                        <td>${entry.loaderName}</td>
                        <td>${entry.sourceKind}</td>
                        <td>${entry.formatName}</td>
                        <td>${fmtBytes(entry.networkBytes)}</td>
                        <td>${fmtBytes(entry.gpuBytes)}</td>
                        <td>${entry.width}x${entry.height}</td>
                        <td>${entry.mipCount}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    const totals = new Map();
    for (const entry of rows) {
        const key = `${entry.codec}:${entry.caseName}`;
        const current = totals.get(key) || {
            codec: entry.codec,
            caseName: entry.caseName,
            networkBytes: 0,
            gpuBytes: 0,
            rawRGBABytes: 0,
            coloredPixels: 0,
            blackFillPixels: 0,
            files: 0,
        };
        current.networkBytes += entry.networkBytes;
        current.gpuBytes += entry.gpuBytes;
        current.rawRGBABytes += entry.manifest.rawRGBABytes;
        current.coloredPixels += entry.manifest.coloredPixels;
        current.blackFillPixels += entry.manifest.blackFillPixels;
        current.files += 1;
        totals.set(key, current);
    }

    els.summaryReport.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Case</th>
                    <th>Files</th>
                    <th>Colored px</th>
                    <th>Black fill px</th>
                    <th>KTX2 total</th>
                    <th>GPU block total</th>
                    <th>RGBA equivalent</th>
                </tr>
            </thead>
            <tbody>
                ${Array.from(totals.values()).map((total) => `
                    <tr>
                        <td>${total.codec}/${total.caseName}</td>
                        <td>${total.files}</td>
                        <td>${total.coloredPixels.toLocaleString()}</td>
                        <td>${total.blackFillPixels.toLocaleString()}</td>
                        <td>${fmtBytes(total.networkBytes)}</td>
                        <td>${fmtBytes(total.gpuBytes)}</td>
                        <td>${fmtBytes(total.rawRGBABytes)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function resetForCodec() {
    disposeLoaded();
    state.activeCodec = els.codec.value;
    supportReport();
    setStatus(`Ready for ${state.activeCodec} KTX2.`);
}

els.codec.addEventListener('change', resetForCodec);
els.probe.addEventListener('click', supportReport);
els.loadRect.addEventListener('click', () => loadCase('rect').catch(showError));
els.loadLock.addEventListener('click', () => loadCase('lock').catch(showError));
els.loadBoth.addEventListener('click', () => {
    Promise.all([loadCase('rect'), loadCase('lock')]).catch(showError);
});
els.clear.addEventListener('click', disposeLoaded);
window.addEventListener('resize', resize);

function showError(error) {
    console.error(error);
    els.formatReport.innerHTML = `<p class="error">${error.message}</p>`;
}

async function boot() {
    supportReport();
    await loadManifest();
    resize();
    updateReports();
    await Promise.all([loadCase('rect'), loadCase('lock')]);
}

boot().catch(showError);
