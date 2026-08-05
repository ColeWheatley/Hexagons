// Guard against resurrecting the removed scalar/sinter transition alongside
// the fixed-band, GSP-blind frustum contract.

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const scopedFiles = [
    'frontend/app/main.js',
    'frontend/app/view_state.js',
    'frontend/app/search.js',
    'frontend/app/index.html',
    'frontend/app/dev/benchmark.js',
    // The LOD HUD and its writers moved out of index.html/main.js in the
    // dev/consumer split; the obsolete-state sweep must follow them.
    'frontend/app/dev/dev_panel.js',
    'frontend/app/dev/dev_tools.js',
    'tests/gosper/visual_probe.py',
    'GOSPER_DESIGN.md',
];
const contents = new Map(await Promise.all(scopedFiles.map(async relative => [
    relative,
    await fs.readFile(path.join(ROOT, relative), 'utf8'),
])));

const obsoleteNames = [
    'moving' + 'Coarseness',
    'quality' + 'Scale',
    'reset' + 'LODs',
    'settle' + 'LODs',
    'sync' + 'LODUI',
    'lod-quality-' + 'val',
    'lastInteraction' + 'Time',
    'lastLod' + 'Preset',
    'lodTransitionIn' + 'Progress',
    'isMoving' + '3D',
    'hexTarget' + 'Px',
    'renderSettings\\.' + 'renderDistance',
];
const obsolete = new RegExp(obsoleteNames.join('|'), 'g');
for (const [relative, source] of contents) {
    assert.deepEqual(
        [...source.matchAll(obsolete)].map(match => match[0]),
        [],
        `${relative} contains obsolete scalar/sinter LOD state`,
    );
}

const main = contents.get('frontend/app/main.js');
assert.match(main, /new Float32Array\(\[2000, 5000, 10000, 25000, 60000, 1e9\]\)/);
assert.match(main, /this\.lodRadii\.set\(this\.settledLodRadii\)/);
assert.match(
    main,
    /this\.manifestGrid\?\.get\(key\)\?\.hMean/,
    'terrain anchoring must tolerate animation frames before the manifest resolves',
);

// A rebuilt settled frontier is assembled asynchronously. All Three.js
// groups begin visible, so the exact current cut must be applied while the
// replacement is still detached; otherwise SINTERING can render one frame
// with every Gosper level submitted at once.
const replacementStart = main.indexOf('    _replaceTileGeometry(');
const replacementEnd = main.indexOf('\n    processQueues()', replacementStart);
assert.ok(replacementStart >= 0 && replacementEnd > replacementStart,
    'main.js must retain the geometry replacement boundary');
const replacementBody = main.slice(replacementStart, replacementEnd);
const compileIndex = replacementBody.indexOf('this.renderer.compile(replacement, this.camera)');
const applyVisibilityIndex = replacementBody.indexOf(
    'this._applyTileLevelVisibility(stagedTile, this.heightFactor)',
);
const attachIndex = replacementBody.indexOf('tile.container.add(replacement)');
assert.ok(compileIndex >= 0, 'replacement geometry must still compile while detached');
assert.ok(applyVisibilityIndex > compileIndex,
    'replacement visibility must be initialized after detached compilation');
assert.ok(attachIndex > applyVisibilityIndex,
    'replacement visibility must be initialized before scene attachment');
assert.match(replacementBody, /geometryAwaitingFinal:\s*false/);
assert.match(
    main,
    /updateLevelVisibility\(heightFactor\)\s*\{[\s\S]*?this\._applyTileLevelVisibility\(tile, heightFactor\);[\s\S]*?\n\s*\}/,
    'frame updates and atomic replacements must share one visibility implementation',
);

const benchmark = contents.get('frontend/app/dev/benchmark.js');
assert.match(
    benchmark,
    /viewer\.camera\.position\.set\([\s\S]+?viewer\.controls\.target\.set\([\s\S]+?viewer\.notifyCameraMotion\([\s\S]+?viewer\.controls\.update\(\)/,
);

const hud = contents.get('frontend/app/dev/dev_panel.js');
assert.match(hud, /id="moving-lod-summary"[^>]*><\/div>/);
assert.match(hud, /id="settled-lod-summary"[^>]*><\/div>/);
assert.doesNotMatch(hud, /(?:moving|settled): --/);
assert.match(main, /G\.levelSize\(this\.movingLevel\)/);
assert.match(main, /Array\.from\(this\.settledLodRadii\.slice\(0, 3\), km\)/);
assert.match(main, /Array\.from\(this\.settledLodRadii\.slice\(3, 5\), km\)/);

const design = contents.get('GOSPER_DESIGN.md');
assert.match(design, /actual rectangular perspective frustum/);
assert.match(design, /GosperVisibilityAdapter/);
assert.match(design, /There are no per-unit frustum plane tests/);
assert.match(design, /2\/5\/10\/25\/60 km/);

console.log('fixed-band LOD residue guard: ok');
