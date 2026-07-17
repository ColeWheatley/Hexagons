import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(here, '../../frontend/app/index.html'), 'utf8');

const start = html.indexOf('<div class="legend glass-panel">');
const end = html.indexOf('<div id="canvas-container">', start);
assert.notEqual(start, -1, 'legend block must exist');
assert.notEqual(end, -1, 'canvas container must follow legend block');

const legend = html.slice(start, end);
const divTokens = legend.match(/<\/?div\b[^>]*>/g) || [];
let depth = 0;
for (const token of divTokens) {
    depth += token.startsWith('</') ? -1 : 1;
    assert.ok(depth >= 0, `legend block closes too many divs near ${token}`);
}

assert.equal(depth, 0, 'legend block must have balanced div tags');
assert.equal((legend.match(/class="legend-item"/g) || []).length, 4);
assert.ok(!legend.includes('< 10'), 'plain-text less-than sign must be escaped');

console.log('index legend markup test passed');
