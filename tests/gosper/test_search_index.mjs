import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const source = fs.readFileSync(path.join(ROOT, 'frontend/app/search_index.js'), 'utf8');
const componentSource = fs.readFileSync(path.join(ROOT, 'frontend/app/search.js'), 'utf8');
const { normalizeSearchText, rankSearchItems } = await import(
    `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
);
const rawIndex = fs.readFileSync(path.join(ROOT, 'frontend/app/assets/search_index.json'));
const rawGeoJson = fs.readFileSync(path.join(ROOT, 'frontend/app/assets/tirol_peaks.geojson'));
const index = JSON.parse(rawIndex);
const fixture = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests/fixtures/search_queries.json')));

assert.equal(index.version, 1);
assert.deepEqual(index.fields, ['name', 'terms', 'elevation', 'lat', 'lon', 'type', 'available', 'x', 'y']);
assert.equal(fixture.length, 50, 'the regression fixture should stay broad enough to catch ranking drift');
assert.ok(rawIndex.length < rawGeoJson.length * 0.2, 'compact index must be less than 20% of raw GeoJSON');
assert.ok(zlib.gzipSync(rawIndex, { level: 9 }).length < 100_000, 'compressed search payload must stay under 100 KB');
assert.ok(componentSource.includes("fetch('assets/search_index.json')"));
assert.ok(!componentSource.includes("fetch('assets/tirol_peaks.geojson')"), 'browser must not fetch/parse raw peaks GeoJSON');
assert.equal(normalizeSearchText('  Äußere  Weiß-Spitze '), 'aussere weiss spitze');

const items = index.items.map(row => ({
    name: row[0],
    terms: row[1],
    elevation: row[2],
    lat: row[3],
    lon: row[4],
    type: row[5],
    available: row[6] === 1,
}));

for (const test of fixture) {
    const candidates = items.filter(item => item.type === test.type);
    const results = rankSearchItems(candidates, test.query, 50);
    assert.equal(results[0]?.name, test.expected, `unexpected top result for ${JSON.stringify(test.query)}`);
    if (test.availabilityOrder) {
        assert.ok(results.some(item => item.available), `${test.query} should include an available result`);
        assert.ok(results.some(item => !item.available), `${test.query} should include an unavailable result`);
        const firstUnavailable = results.findIndex(item => !item.available);
        assert.ok(
            results.slice(firstUnavailable).every(item => !item.available),
            `${test.query} must rank all available results before unavailable results`,
        );
    }
}

const synthetic = [
    { name: 'Unavailable exact', terms: 'needle summit', available: false },
    { name: 'Available exact', terms: 'needle peak', available: true },
];
assert.equal(rankSearchItems(synthetic, 'needle', 1)[0].name, 'Available exact');

console.log(
    `search index tests passed: ${fixture.length} queries, ${rawIndex.length} B raw, `
    + `${zlib.gzipSync(rawIndex, { level: 9 }).length} B gzip-9`,
);
