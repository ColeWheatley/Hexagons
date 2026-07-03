import * as THREE from 'three';

const BASIS_FORMAT = {
    cTFETC1: 0,
    cTFETC2: 1,
    cTFBC1: 2,
    cTFBC3: 3,
    cTFBC7: 6,
    cTFPVRTC1_4_RGB: 8,
    cTFPVRTC1_4_RGBA: 9,
    cTFASTC_4x4: 10,
    cTFASTC_LDR_5x4_RGBA: 28,
    cTFASTC_LDR_5x5_RGBA: 29,
    cTFASTC_LDR_6x5_RGBA: 30,
    cTFASTC_LDR_6x6_RGBA: 31,
    cTFASTC_LDR_8x5_RGBA: 32,
    cTFASTC_LDR_8x6_RGBA: 33,
    cTFASTC_LDR_10x5_RGBA: 34,
    cTFASTC_LDR_10x6_RGBA: 35,
    cTFASTC_LDR_8x8_RGBA: 36,
    cTFASTC_LDR_10x8_RGBA: 37,
    cTFASTC_LDR_10x10_RGBA: 38,
    cTFASTC_LDR_12x10_RGBA: 39,
    cTFASTC_LDR_12x12_RGBA: 40,
};

const ASTC_BY_BLOCK = {
    '4x4': { basis: BASIS_FORMAT.cTFASTC_4x4, three: THREE.RGBA_ASTC_4x4_Format, label: 'RGBA ASTC 4x4' },
    '5x4': { basis: BASIS_FORMAT.cTFASTC_LDR_5x4_RGBA, three: THREE.RGBA_ASTC_5x4_Format, label: 'RGBA ASTC 5x4' },
    '5x5': { basis: BASIS_FORMAT.cTFASTC_LDR_5x5_RGBA, three: THREE.RGBA_ASTC_5x5_Format, label: 'RGBA ASTC 5x5' },
    '6x5': { basis: BASIS_FORMAT.cTFASTC_LDR_6x5_RGBA, three: THREE.RGBA_ASTC_6x5_Format, label: 'RGBA ASTC 6x5' },
    '6x6': { basis: BASIS_FORMAT.cTFASTC_LDR_6x6_RGBA, three: THREE.RGBA_ASTC_6x6_Format, label: 'RGBA ASTC 6x6' },
    '8x5': { basis: BASIS_FORMAT.cTFASTC_LDR_8x5_RGBA, three: THREE.RGBA_ASTC_8x5_Format, label: 'RGBA ASTC 8x5' },
    '8x6': { basis: BASIS_FORMAT.cTFASTC_LDR_8x6_RGBA, three: THREE.RGBA_ASTC_8x6_Format, label: 'RGBA ASTC 8x6' },
    '8x8': { basis: BASIS_FORMAT.cTFASTC_LDR_8x8_RGBA, three: THREE.RGBA_ASTC_8x8_Format, label: 'RGBA ASTC 8x8' },
    '10x5': { basis: BASIS_FORMAT.cTFASTC_LDR_10x5_RGBA, three: THREE.RGBA_ASTC_10x5_Format, label: 'RGBA ASTC 10x5' },
    '10x6': { basis: BASIS_FORMAT.cTFASTC_LDR_10x6_RGBA, three: THREE.RGBA_ASTC_10x6_Format, label: 'RGBA ASTC 10x6' },
    '10x8': { basis: BASIS_FORMAT.cTFASTC_LDR_10x8_RGBA, three: THREE.RGBA_ASTC_10x8_Format, label: 'RGBA ASTC 10x8' },
    '10x10': { basis: BASIS_FORMAT.cTFASTC_LDR_10x10_RGBA, three: THREE.RGBA_ASTC_10x10_Format, label: 'RGBA ASTC 10x10' },
    '12x10': { basis: BASIS_FORMAT.cTFASTC_LDR_12x10_RGBA, three: THREE.RGBA_ASTC_12x10_Format, label: 'RGBA ASTC 12x10' },
    '12x12': { basis: BASIS_FORMAT.cTFASTC_LDR_12x12_RGBA, three: THREE.RGBA_ASTC_12x12_Format, label: 'RGBA ASTC 12x12' },
};

let basisPromise = null;

function loadScriptOnce(src) {
    if (globalThis.BASIS) return Promise.resolve();
    return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
            existing.addEventListener('load', resolve, { once: true });
            existing.addEventListener('error', reject, { once: true });
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.addEventListener('load', resolve, { once: true });
        script.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
        document.head.append(script);
    });
}

async function loadBasisModule(transcoderPath) {
    if (!basisPromise) {
        const base = new URL(transcoderPath, window.location.href);
        const scriptUrl = new URL('basis_transcoder.js', base).href;
        await loadScriptOnce(scriptUrl);
        basisPromise = globalThis.BASIS({
            locateFile: (file) => new URL(file, base).href,
        }).then((module) => {
            module.initializeBasis();
            return module;
        });
    }
    return basisPromise;
}

function blockKey(width, height) {
    return `${width}x${height}`;
}

function selectTarget(renderer, ktx2File, hasAlpha) {
    const srcBlockWidth = ktx2File.getBlockWidth();
    const srcBlockHeight = ktx2File.getBlockHeight();
    const astc = ASTC_BY_BLOCK[blockKey(srcBlockWidth, srcBlockHeight)] || ASTC_BY_BLOCK['4x4'];

    if (renderer.extensions.has('WEBGL_compressed_texture_astc')) {
        return { ...astc, blockWidth: srcBlockWidth, blockHeight: srcBlockHeight };
    }
    if (renderer.extensions.has('EXT_texture_compression_bptc')) {
        return { basis: BASIS_FORMAT.cTFBC7, three: THREE.RGBA_BPTC_Format, label: 'RGBA BPTC / BC7', blockWidth: 4, blockHeight: 4 };
    }
    if (renderer.extensions.has('WEBGL_compressed_texture_s3tc')) {
        return hasAlpha
            ? { basis: BASIS_FORMAT.cTFBC3, three: THREE.RGBA_S3TC_DXT5_Format, label: 'RGBA S3TC DXT5 / BC3', blockWidth: 4, blockHeight: 4 }
            : { basis: BASIS_FORMAT.cTFBC1, three: THREE.RGB_S3TC_DXT1_Format, label: 'RGB S3TC DXT1 / BC1', blockWidth: 4, blockHeight: 4, bytesPerBlock: 8 };
    }
    if (hasAlpha && renderer.extensions.has('WEBGL_compressed_texture_etc')) {
        return { basis: BASIS_FORMAT.cTFETC2, three: THREE.RGBA_ETC2_EAC_Format, label: 'RGBA ETC2 EAC' };
    }
    if (!hasAlpha && (renderer.extensions.has('WEBGL_compressed_texture_etc') || renderer.extensions.has('WEBGL_compressed_texture_etc1'))) {
        return { basis: BASIS_FORMAT.cTFETC1, three: THREE.RGB_ETC1_Format, label: 'RGB ETC1', blockWidth: 4, blockHeight: 4, bytesPerBlock: 8 };
    }
    if (renderer.extensions.has('WEBGL_compressed_texture_pvrtc') || renderer.extensions.has('WEBKIT_WEBGL_compressed_texture_pvrtc')) {
        return hasAlpha
            ? { basis: BASIS_FORMAT.cTFPVRTC1_4_RGBA, three: THREE.RGBA_PVRTC_4BPPV1_Format, label: 'RGBA PVRTC 4bpp', blockWidth: 4, blockHeight: 4, bytesPerBlock: 8 }
            : { basis: BASIS_FORMAT.cTFPVRTC1_4_RGB, three: THREE.RGB_PVRTC_4BPPV1_Format, label: 'RGB PVRTC 4bpp', blockWidth: 4, blockHeight: 4, bytesPerBlock: 8 };
    }
    throw new Error('No GPU compressed texture extension is available for the Basis v2/XUASTC loader.');
}

function sourceKind(ktx2File) {
    if (ktx2File.isXUASTC_LDR()) return `XUASTC LDR ${ktx2File.getBlockWidth()}x${ktx2File.getBlockHeight()}`;
    if (ktx2File.isASTC_LDR()) return `ASTC LDR ${ktx2File.getBlockWidth()}x${ktx2File.getBlockHeight()}`;
    if (ktx2File.isUASTC()) return 'UASTC LDR 4x4';
    if (ktx2File.isETC1S()) return 'ETC1S';
    return `Basis format ${ktx2File.getBasisTexFormat()}`;
}

export class BasisV2KTX2Loader {
    constructor(renderer, options = {}) {
        this.renderer = renderer;
        this.transcoderPath = options.transcoderPath || './vendor/basisu_v2/';
    }

    async parse(buffer) {
        const module = await loadBasisModule(this.transcoderPath);
        const ktx2File = new module.KTX2File(new Uint8Array(buffer));
        const startTotal = performance.now();

        try {
            if (!ktx2File.isValid()) {
                throw new Error('Invalid or unsupported KTX2 file for Basis v2 transcoder.');
            }
            if (!ktx2File.startTranscoding()) {
                throw new Error('Basis v2 startTranscoding failed.');
            }

            const hasAlpha = ktx2File.getHasAlpha();
            const target = selectTarget(this.renderer, ktx2File, hasAlpha);
            const mipmaps = [];
            let gpuBytes = 0;
            let transcodeMs = 0;

            for (let level = 0; level < ktx2File.getLevels(); level++) {
                const info = ktx2File.getImageLevelInfo(level, 0, 0);
                const dstSize = ktx2File.getImageTranscodedSizeInBytes(level, 0, 0, target.basis);
                const dst = new Uint8Array(dstSize);
                const startLevel = performance.now();
                if (!ktx2File.transcodeImageWithFlags(dst, level, 0, 0, target.basis, 0, -1, -1)) {
                    throw new Error(`Basis v2 transcodeImage failed at mip ${level}.`);
                }
                transcodeMs += performance.now() - startLevel;

                const width = info.origWidth;
                const height = info.origHeight;
                mipmaps.push({ data: dst, width, height });
                gpuBytes += dst.byteLength;
            }

            const width = ktx2File.getWidth();
            const height = ktx2File.getHeight();
            const texture = new THREE.CompressedTexture(
                mipmaps,
                width,
                height,
                target.three,
                THREE.UnsignedByteType,
            );
            texture.minFilter = mipmaps.length === 1 ? THREE.LinearFilter : THREE.LinearMipmapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.colorSpace = ktx2File.isSRGB() ? THREE.SRGBColorSpace : THREE.LinearSRGBColorSpace;
            texture.needsUpdate = true;

            return {
                texture,
                gpuBytes,
                transcodeMs,
                formatName: target.label,
                sourceKind: sourceKind(ktx2File),
                loaderName: 'Basis Universal v2 WASM',
                block: `${ktx2File.getBlockWidth()}x${ktx2File.getBlockHeight()}`,
                totalMs: performance.now() - startTotal,
            };
        } finally {
            ktx2File.close();
            ktx2File.delete();
        }
    }
}
