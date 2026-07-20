import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const main = readFileSync(fileURLToPath(new URL('../main.js', import.meta.url)), 'utf8');

test('distance skirt slack extends both downhill and uphill signed edges', () => {
    assert.match(main, /float skirtDirection = dVal < 0\.0 \? -1\.0 : 1\.0;/);
    assert.match(main, /dVal \+= skirtDirection \* skirtExtension;/);
    assert.doesNotMatch(
        main,
        /dVal \+= clamp\(\(vInstDist - 1200\.0\)[^;]+\* 12\.0;/,
        'an unsigned positive extension reopens uphill skirt gaps',
    );
});
