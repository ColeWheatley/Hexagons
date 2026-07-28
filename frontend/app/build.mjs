#!/usr/bin/env node
/**
 * Deploy build for the standalone app.
 *
 * Development stays unbundled: after `npm install`, serve `frontend/app/`
 * with the existing static host and open `index.html`. The source shell uses
 * a local `node_modules/three` import map, local Outfit font files, and the
 * classic `tile_worker.js`. Deployment serves only `frontend/app/dist/`.
 */
import * as esbuild from 'esbuild';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, constants as zlibConstants, gzipSync } from 'node:zlib';

const appDir = path.dirname(fileURLToPath(import.meta.url));
const distDir = process.env.HEXAGONS_DIST_DIR
    ? path.resolve(process.env.HEXAGONS_DIST_DIR)
    : path.join(appDir, 'dist');
const textExtensions = new Set(['.html', '.css', '.js', '.json', '.geojson']);
const hashLength = 12;

function hashBuffer(buffer) {
    return createHash('sha256').update(buffer).digest('hex').slice(0, hashLength);
}

function toPosix(value) {
    return value.split(path.sep).join('/');
}

function formatBytes(bytes) {
    return `${bytes.toLocaleString('en-US')} B`;
}

async function readBuffer(relativePath) {
    return fs.readFile(path.join(appDir, relativePath));
}

async function writeFile(relativePath, contents) {
    const target = path.join(distDir, relativePath);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, contents);
    return relativePath;
}

async function copyFile(sourceRelativePath, targetRelativePath = sourceRelativePath) {
    return writeFile(targetRelativePath, await readBuffer(sourceRelativePath));
}

async function writeHashedFile(directory, basename, extension, contents) {
    const buffer = Buffer.isBuffer(contents) ? contents : Buffer.from(contents);
    const filename = `${basename}.${hashBuffer(buffer)}${extension}`;
    const relativePath = directory ? `${directory}/${filename}` : filename;
    await writeFile(relativePath, buffer);
    return relativePath;
}

async function copyHashedFile(sourceRelativePath, directory, basename, extension = path.extname(sourceRelativePath)) {
    return writeHashedFile(directory, basename, extension, await readBuffer(sourceRelativePath));
}

function sanitizeBundledJavaScript(contents) {
    let source = Buffer.from(contents).toString('utf8');
    source = source.split('"http://www.w3.org/1999/xhtml"').join('("http:"+"//www.w3.org/1999/xhtml")');
    source = source.split('https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733')
        .join('Three.js r155 lighting migration guide');
    source = source.split('"https://example.invalid/"')
        .join('"https:"+"//example.invalid/"');
    return Buffer.from(source);
}

async function pathExists(target) {
    try {
        await fs.access(target);
        return true;
    } catch {
        return false;
    }
}

async function walkFiles(root) {
    const entries = await fs.readdir(root, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        const fullPath = path.join(root, entry.name);
        if (entry.isDirectory()) {
            files.push(...await walkFiles(fullPath));
        } else if (entry.isFile()) {
            files.push(fullPath);
        }
    }
    return files;
}

async function rewriteCssFonts(css) {
    const fontUrlPattern = /url\(['"]?(assets\/fonts\/[^'")]+\.woff2)['"]?\)/g;
    const replacements = new Map();
    for (const match of css.matchAll(fontUrlPattern)) {
        const sourceRelativePath = match[1];
        if (replacements.has(sourceRelativePath)) continue;

        const parsed = path.parse(sourceRelativePath);
        const fontPath = await copyHashedFile(
            sourceRelativePath,
            'assets/fonts',
            parsed.name,
            parsed.ext,
        );
        replacements.set(sourceRelativePath, fontPath);
    }

    for (const [sourceRelativePath, fontPath] of replacements) {
        css = css.split(sourceRelativePath).join(fontPath);
    }
    return css;
}

function extractAppVersion(mainSource) {
    const match = mainSource.match(/const\s+APP_VERSION\s*=\s*['"]([^'"]+)['"]/);
    if (!match) throw new Error('Could not find APP_VERSION in main.js for manifest preload.');
    return match[1];
}

async function buildJavaScript({ basisJsPath, basisWasmPath }) {
    const workerResult = await esbuild.build({
        stdin: {
            contents: "import './gosper_core.js';\nimport './tile_worker.js';\n",
            resolveDir: appDir,
            sourcefile: 'tile_worker_entry.js',
            loader: 'js',
        },
        bundle: true,
        write: false,
        platform: 'browser',
        format: 'iife',
        target: ['es2020'],
        minify: true,
        legalComments: 'none',
        define: {
            __BASIS_TRANSCODER_JS_URL__: JSON.stringify(`./${basisJsPath}`),
            __BASIS_TRANSCODER_WASM_URL__: JSON.stringify(`./${basisWasmPath}`),
        },
    });
    const workerPath = await writeHashedFile(
        '',
        'tile_worker',
        '.js',
        sanitizeBundledJavaScript(workerResult.outputFiles[0].contents),
    );

    const mainResult = await esbuild.build({
        entryPoints: [path.join(appDir, 'main.js')],
        bundle: true,
        write: false,
        platform: 'browser',
        format: 'iife',
        target: ['es2020'],
        minify: true,
        legalComments: 'none',
        define: {
            __TILE_WORKER_URL__: JSON.stringify(`./${workerPath}`),
        },
    });
    const mainPath = await writeHashedFile(
        '',
        'main',
        '.js',
        sanitizeBundledJavaScript(mainResult.outputFiles[0].contents),
    );

    return { mainPath, workerPath };
}

async function buildServiceWorker(appVersion) {
    const source = await fs.readFile(path.join(appDir, 'service_worker.js'), 'utf8');
    if (!source.includes('__HEXAGONS_BUILD_ID__')) {
        throw new Error('service_worker.js is missing its build-id placeholder.');
    }
    return writeHashedFile(
        '',
        'service-worker',
        '.js',
        source.replaceAll('__HEXAGONS_BUILD_ID__', appVersion),
    );
}

// Every app stylesheet, in cascade order. One file per Phase-2 UI task keeps
// those tasks from writing the same file; they are concatenated into a single
// hashed bundle here so production still serves one stylesheet request.
const APP_STYLESHEETS = [
    'style.css',
    'powfinder.css',
    'powfinder_scrubber.css',
    'powfinder_popup.css',
];

async function rewriteHtml({ appVersion, basisWasmPath, cssPath, mainPath, serviceWorkerPath }) {
    let html = await fs.readFile(path.join(appDir, 'index.html'), 'utf8');
    html = html.replace(/\s*<script type="importmap">[\s\S]*?<\/script>\s*/, '\n');

    const manifestHref = `tile_manifest.json?v=${encodeURIComponent(appVersion)}`;
    const headLinks = [
        `<link rel="preload" href="${manifestHref}" as="fetch" crossorigin="anonymous">`,
        `<link rel="preload" href="${basisWasmPath}" as="fetch" type="application/wasm" crossorigin="anonymous">`,
        `<link rel="modulepreload" href="${mainPath}">`,
        `<link rel="stylesheet" href="${cssPath}">`,
    ].join('\n    ');

    html = html.replace(
        '<link rel="stylesheet" href="style.css">',
        headLinks,
    );
    // The remaining source stylesheets are already inside the hashed bundle.
    // Drop their dev links (and the comment introducing them) so dist never
    // requests a file that was not emitted.
    html = html.replace(
        /\n\s*<!-- One stylesheet per Phase-2 UI task[\s\S]*?-->/,
        '',
    );
    for (const stylesheet of APP_STYLESHEETS.slice(1)) {
        html = html.replace(`\n    <link rel="stylesheet" href="${stylesheet}">`, '');
    }
    for (const stylesheet of APP_STYLESHEETS) {
        if (html.includes(`href="${stylesheet}"`)) {
            throw new Error(`dist index.html still links unbundled ${stylesheet}.`);
        }
    }
    html = html.replace(
        '<script type="module" src="main.js"></script>',
        `<script type="module" src="${mainPath}"></script>`,
    );
    html = html.replace(
        '</head>',
        `    <script>if ('serviceWorker' in navigator) navigator.serviceWorker.register('${serviceWorkerPath}', { updateViaCache: 'none' }).catch(error => console.warn('[HEXAGONS] service worker unavailable', error));</script>\n</head>`,
    );

    if (/<script type="importmap">/.test(html)) {
        throw new Error('dist index.html still contains an import map.');
    }

    await writeFile('index.html', html);
}

async function copyStaticAssets() {
    const manifestOverride = process.env.HEXAGONS_MANIFEST_PATH;
    if (manifestOverride) {
        await writeFile('tile_manifest.json', await fs.readFile(path.resolve(manifestOverride)));
    } else {
        await copyFile('tile_manifest.json');
    }
    await copyFile('assets/skigebiete.json');
    await copyFile('assets/search_index.json');
    await copyFile('assets/tirol_peaks.geojson');
}

async function precompressTextAssets() {
    const files = await walkFiles(distDir);
    const compressed = [];
    for (const file of files) {
        const extension = path.extname(file);
        if (!textExtensions.has(extension)) continue;
        if (file.endsWith('.br') || file.endsWith('.gz')) continue;

        const contents = await fs.readFile(file);
        const brotli = brotliCompressSync(contents, {
            params: {
                [zlibConstants.BROTLI_PARAM_QUALITY]: 11,
            },
        });
        const gzip = gzipSync(contents, { level: 9 });
        await fs.writeFile(`${file}.br`, brotli);
        await fs.writeFile(`${file}.gz`, gzip);
        compressed.push({ file, raw: contents.byteLength, br: brotli.byteLength, gz: gzip.byteLength });
    }
    return compressed;
}

async function assertNoExternalOrigins(files) {
    const urlPattern = /\bhttps?:\/\/[^\s"'<>`)]+/g;
    const failures = [];
    for (const relativePath of files) {
        const contents = await fs.readFile(path.join(distDir, relativePath), 'utf8');
        const matches = contents.match(urlPattern);
        if (matches) {
            failures.push(`${relativePath}: ${[...new Set(matches)].join(', ')}`);
        }
    }
    if (failures.length) {
        throw new Error(`External URL references found in dist shell/bundles:\n${failures.join('\n')}`);
    }
}

async function assertNoDeadWeight(files) {
    const patterns = [/hammer/i, /lod_controller/, /css-map-layer/, /css-world/, /css-tile/];
    const failures = [];
    for (const relativePath of files) {
        const contents = await fs.readFile(path.join(distDir, relativePath), 'utf8');
        for (const pattern of patterns) {
            if (pattern.test(contents)) failures.push(`${relativePath}: ${pattern}`);
        }
    }
    if (failures.length) {
        throw new Error(`Dead-weight marker still present in dist:\n${failures.join('\n')}`);
    }

    if (await pathExists(path.join(distDir, 'fuckups.md'))) {
        throw new Error('dist unexpectedly contains fuckups.md.');
    }
}

async function assertJavaScriptParses() {
    const jsFiles = (await walkFiles(distDir))
        .filter((file) => path.extname(file) === '.js')
        .filter((file) => !file.endsWith('.br') && !file.endsWith('.gz'));

    for (const jsFile of jsFiles) {
        const result = spawnSync(process.execPath, ['--check', jsFile], {
            cwd: appDir,
            encoding: 'utf8',
        });
        if (result.status !== 0) {
            throw new Error(`node --check failed for ${path.relative(distDir, jsFile)}:\n${result.stderr || result.stdout}`);
        }
    }
}

async function sourceAppJsBytes() {
    const entries = await fs.readdir(appDir, { withFileTypes: true });
    let total = 0;
    for (const entry of entries) {
        if (!entry.isFile() || path.extname(entry.name) !== '.js') continue;
        const stat = await fs.stat(path.join(appDir, entry.name));
        total += stat.size;
    }
    return total;
}

async function fileSize(relativePath) {
    const stat = await fs.stat(path.join(distDir, relativePath));
    return stat.size;
}

function compressedSizeFor(compressed, relativePath, field) {
    const fullPath = path.join(distDir, relativePath);
    const row = compressed.find((item) => item.file === fullPath);
    return row?.[field] ?? null;
}

async function main() {
    await fs.rm(distDir, { recursive: true, force: true });
    await fs.mkdir(distDir, { recursive: true });

    const mainSource = await fs.readFile(path.join(appDir, 'main.js'), 'utf8');
    const appVersion = extractAppVersion(mainSource);
    const originalJsBytes = await sourceAppJsBytes();

    await copyStaticAssets();

    const basisJsPath = await copyHashedFile(
        'vendor/basisu_v2/basis_transcoder.js',
        'assets',
        'basis_transcoder',
        '.js',
    );
    const basisWasmPath = await copyHashedFile(
        'vendor/basisu_v2/basis_transcoder.wasm',
        'assets',
        'basis_transcoder',
        '.wasm',
    );

    const cssParts = [];
    for (const stylesheet of APP_STYLESHEETS) {
        cssParts.push(await fs.readFile(path.join(appDir, stylesheet), 'utf8'));
    }
    const cssPath = await writeHashedFile(
        '',
        'style',
        '.css',
        await rewriteCssFonts(cssParts.join('\n')),
    );

    const { mainPath, workerPath } = await buildJavaScript({ basisJsPath, basisWasmPath });
    const serviceWorkerPath = await buildServiceWorker(appVersion);
    await rewriteHtml({ appVersion, basisWasmPath, cssPath, mainPath, serviceWorkerPath });

    const shellAndBundles = ['index.html', cssPath, mainPath, workerPath, basisJsPath, serviceWorkerPath];
    await assertNoExternalOrigins(shellAndBundles);
    await assertNoDeadWeight(shellAndBundles);
    await assertJavaScriptParses();

    const compressed = await precompressTextAssets();
    const manifestBrBytes = compressedSizeFor(compressed, 'tile_manifest.json', 'br');
    const manifestGzBytes = compressedSizeFor(compressed, 'tile_manifest.json', 'gz');
    const distAppJsBytes = await fileSize(mainPath) + await fileSize(workerPath);
    const distTotalJsBytes = distAppJsBytes + await fileSize(basisJsPath);
    const manifestBytes = await fileSize('tile_manifest.json');

    console.log('Build complete:');
    console.log(`  main bundle: ${mainPath} (${formatBytes(await fileSize(mainPath))})`);
    console.log(`  worker bundle: ${workerPath} (${formatBytes(await fileSize(workerPath))})`);
    console.log(`  service worker: ${serviceWorkerPath} (${formatBytes(await fileSize(serviceWorkerPath))})`);
    console.log(`  basis JS: ${basisJsPath} (${formatBytes(await fileSize(basisJsPath))})`);
    console.log(`  basis WASM: ${basisWasmPath} (${formatBytes(await fileSize(basisWasmPath))})`);
    console.log(`  source app JS modules: ${formatBytes(originalJsBytes)}`);
    console.log(`  dist app JS bundles: ${formatBytes(distAppJsBytes)}`);
    console.log(`  dist total JS incl. Basis: ${formatBytes(distTotalJsBytes)}`);
    console.log(`  tile_manifest.json: ${formatBytes(manifestBytes)} -> br ${formatBytes(manifestBrBytes)} / gz ${formatBytes(manifestGzBytes)}`);
    console.log(`  precompressed text assets: ${compressed.length}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
