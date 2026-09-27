import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../texture_page_grid.js', import.meta.url), 'utf8');
const { TexturePageGrid } = await import(
    `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
);

test('URL fallbacks use the correct tier template and fill every placeholder', () => {
    const grid = new TexturePageGrid({
        url_template: '/{tier}/{page_x}/{page_y}/{tier}-{page_x}-{page_y}.ktx2',
        bootstrap: {
            url_template: '/boot/{page_x}/{page_y}/{page_x}-{page_y}.webp',
        },
        grid: {
            crs: 'EPSG:31254', origin_x: 0, origin_y: 0,
            page_size_m: 1024, index_rule: 'floor',
        },
        pages: [{
            key: '2_3', page_x: 2, page_y: 3,
            hMin: 1, hMax: 2, renderMin: 0, renderMax: 3,
        }],
    });
    assert.equal(grid.urlFor('2_3', 'high'), '/high/2/3/high-2-3.ktx2');
    assert.equal(grid.urlFor('2_3', 'bootstrap'), '/boot/2/3/2-3.webp');
    assert.equal(grid.urlFor('missing', 'high'), null);
});
