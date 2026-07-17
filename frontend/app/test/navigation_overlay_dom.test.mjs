import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const read = path => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');
const html = read('../index.html');
const css = read('../style.css');
test('legend, scale, and compass remain rendered in compact 320/390 layouts', () => {
    assert.match(html, /class="navigation-overlay"/);
    assert.match(html, /id="distance-scale-bar"/);
    assert.match(html, /id="compass-needle"/);
    assert.match(html, /class="legend glass-panel"/);
    assert.doesNotMatch(css, /@media \(max-width:390px\)[\s\S]{0,200}\.legend\s*\{[^}]*display\s*:\s*none/);
    assert.match(css, /@media \(max-width:390px\)[\s\S]*?\.legend-item\s*\{[^}]*font-size/);
    assert.match(css, /@media \(max-width:390px\)[\s\S]*?env\(safe-area-inset-bottom\)/);
});
