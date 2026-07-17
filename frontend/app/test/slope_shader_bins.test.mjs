import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const main = readFileSync(fileURLToPath(new URL('../main.js', import.meta.url)), 'utf8');
test('legend bins retain the established gradient shader thresholds and colors', () => {
    for (const invariant of [
        'if (s < 30.0) return vec3(0.0)',
        'if (s < 35.0) return vec3(0.2, 0.8, 0.2)',
        'if (s < 40.0) return vec3(0.9, 0.9, 0.2)',
        'if (s < 45.0) return vec3(1.0, 0.6, 0.0)',
        'if (s < 55.0) return vec3(0.9, 0.2, 0.2)',
        'return vec3(0.6, 0.2, 0.8)',
    ]) assert.ok(main.includes(invariant), invariant);
});
