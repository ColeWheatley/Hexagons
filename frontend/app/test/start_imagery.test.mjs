import test from 'node:test';
import assert from 'node:assert/strict';
import { startImageryPages, preloadStartImagery } from '../start_imagery.mjs';
import { NET_PRIORITY } from '../net_scheduler.mjs';

const page = (key, x) => ({ key, minX: x, maxX: x + 1024, minY: 0, maxY: 1024 });

test('initial coverage follows the restored location and has a hard page limit', () => {
    const pages = [page('default', 0), ...Array.from({ length: 30 }, (_, i) => page(`shared-${i}`, 50000 + i * 100))];
    const selected = startImageryPages(pages, { x: 50500, y: 500 }, { maxPages: 8 });
    assert.equal(selected.length, 8);
    assert.ok(selected.every(p => p.key.startsWith('shared-')));
    assert.deepEqual(startImageryPages(pages, { x: 500, y: 500 }).map(p => p.key), ['default']);
    assert.deepEqual(startImageryPages(pages, { x: NaN, y: 0 }), []);
});

test('startup requests only coarse prefixes with bounded concurrency; errors are optional', async () => {
    let active = 0, peak = 0, loaded = 0;
    const requests = [];
    await preloadStartImagery({
        pages: Array.from({ length: 12 }, (_, i) => page(String(i), i * 100)),
        target: { x: 500, y: 500 }, maxPages: 8,
        urlForPage: p => p.key,
        store: { async ensureLevel(url, level, options) {
            requests.push({ url, level, options });
            peak = Math.max(peak, ++active);
            await new Promise(resolve => setTimeout(resolve, 1));
            active--;
            if (url === '0') throw new Error('offline');
            return { networkBytes: 8000 };
        } },
        onLoaded: () => loaded++,
    });
    assert.equal(requests.length, 8);
    assert.equal(peak, 2);
    assert.ok(requests.every(r => r.level === 5 && r.options.priority < NET_PRIORITY.VISIBLE));
    assert.equal(loaded, 7);
});

test('aborted or replaced world does not start preload work', async () => {
    for (const options of [{ signal: AbortSignal.abort() }, { isCurrent: () => false }]) {
        await preloadStartImagery({ pages: [page('a', 0)], target: { x: 0, y: 0 },
            urlForPage: p => p.key, store: { ensureLevel() { assert.fail('stale preload'); } }, ...options });
    }
});
