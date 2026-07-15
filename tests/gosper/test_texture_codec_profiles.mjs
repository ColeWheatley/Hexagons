// Runtime-shaped contract test for profile-selected XUASTC ASTC targets.

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const workerPath = path.join(ROOT, 'frontend/app/tile_worker.js');
const corePath = path.join(ROOT, 'frontend/app/gosper_core.js');
const context = vm.createContext({ console, performance, URL });
context.self = context;
context.location = { href: 'http://localhost/tile_worker.js' };
context.importScripts = specifier => {
    if (specifier.split('?')[0] !== 'gosper_core.js') {
        throw new Error(`unexpected importScripts(${specifier})`);
    }
    vm.runInContext(fs.readFileSync(corePath, 'utf8'), context, { filename: corePath });
};
vm.runInContext(fs.readFileSync(workerPath, 'utf8'), context, { filename: workerPath });

const selectTarget = vm.runInContext('selectTarget', context);
const source = (width, height) => ({
    getBlockWidth: () => width,
    getBlockHeight: () => height,
});

for (const [width, height, basis, formatKey] of [
    [4, 4, 10, 'astc-4x4'],
    [6, 6, 31, 'astc-6x6'],
    [8, 6, 33, 'astc-8x6'],
]) {
    assert.deepEqual(
        { ...selectTarget({ astc: true }, source(width, height)) },
        { basis, formatKey },
    );
}

assert.throws(
    () => selectTarget({ astc: true }, source(8, 8)),
    /Unsupported production XUASTC ASTC block size: 8x8/,
);
assert.deepEqual(
    { ...selectTarget({ astc: false, bptc: true }, source(8, 6)) },
    { basis: 6, formatKey: 'bc7' },
);

console.log('texture codec profile targets: ok');
