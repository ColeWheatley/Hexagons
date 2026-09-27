// Cross-language round trip: Python compacts, JS expands, result must match the
// full manifest the viewer has always consumed.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expandManifest, isCompactManifest } from '../manifest_codec.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..', '..', '..');
const source = join(repo, 'frontend', 'app', 'tile_manifest.json');

function assertClose(actual, expected, path = '') {
    if (typeof expected === 'number' && typeof actual === 'number') {
        assert.ok(Math.abs(actual - expected) <= 0.0051, `${path}: ${actual} != ${expected}`);
        return;
    }
    if (Array.isArray(expected)) {
        assert.equal(actual.length, expected.length, `${path}: length`);
        expected.forEach((item, i) => assertClose(actual[i], item, `${path}[${i}]`));
        return;
    }
    if (expected && typeof expected === 'object') {
        assert.deepEqual(Object.keys(actual).sort(), Object.keys(expected).sort(), `${path}: keys`);
        for (const key of Object.keys(expected)) assertClose(actual[key], expected[key], `${path}.${key}`);
        return;
    }
    assert.equal(actual, expected, path);
}

test('compact manifest expands to the full manifest', () => {
    const dir = mkdtempSync(join(tmpdir(), 'hexagons-manifest-'));
    try {
        const out = join(dir, 'compact.json');
        execFileSync('python3', [join(repo, 'scripts', 'compact_manifest.py'), source, out], { stdio: 'pipe' });
        const compact = JSON.parse(readFileSync(out, 'utf8'));
        assert.ok(isCompactManifest(compact));
        const full = JSON.parse(readFileSync(source, 'utf8'));
        assertClose(expandManifest(compact), full);
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
});

test('full-format manifests pass through unchanged', () => {
    const full = { tiles: [], texture_pages: { pages: [] } };
    assert.equal(expandManifest(full), full);
});

test('const object columns are not shared between records', () => {
    const compact = {
        format: 'hexagons-compact-manifest', format_version: 1, unit_hex_m: 6.4,
        tiles_compact: { count: 0, keys: [], derived: [], columns: {} },
        texture_pages: { grid: { page_size_m: 1024 }, tiers: [], url_template: '' },
        pages_compact: {
            count: 2, keys: ['page_x', 'page_y', 'boundary_padding'], derived: [],
            columns: {
                page_x: { enc: 'delta', data: [1, 1] }, page_y: { enc: 'delta', data: [5, 0] },
                boundary_padding: { enc: 'const', value: { padded_pixels: 0 } },
            },
        },
    };
    const pages = expandManifest(compact).texture_pages.pages;
    assert.deepEqual(pages.map(p => [p.page_x, p.page_y]), [[1, 5], [2, 5]]);
    assert.notEqual(pages[0].boundary_padding, pages[1].boundary_padding);
});
