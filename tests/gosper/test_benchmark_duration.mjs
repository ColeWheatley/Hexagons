import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(path.join(here, '../../frontend/app/benchmark.js'), 'utf8');
const benchmark = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

assert.equal(benchmark.resolveBenchmarkDuration(null, 120), 120);
assert.equal(benchmark.resolveBenchmarkDuration('', 120), 120);
assert.equal(benchmark.resolveBenchmarkDuration('20', 120), 20);
assert.equal(benchmark.resolveBenchmarkDuration('5', 120), 10);
assert.equal(benchmark.resolveBenchmarkDuration('500', 120), 120);
assert.equal(benchmark.resolveBenchmarkDuration('not-a-number', 120), 120);

console.log('benchmark duration override is bounded and opt-in: ok');
