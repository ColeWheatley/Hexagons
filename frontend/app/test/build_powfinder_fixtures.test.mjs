// Guards build.mjs's dev-only powfinder_fixtures/ copy (design doc §6 P2.5:
// "add powfinder_fixtures to copyStaticAssets under a dev flag ONLY").
// Text-invariant rather than a real build execution: `node build.mjs`
// esbuild-bundles the whole app (~5s, see manual verification note below),
// which would roughly quadruple this suite's runtime and duplicates what
// `scripts/ci_contracts.sh`'s separate "production build" stage already
// exercises for real. This is the same tradeoff test/slope_shader_bins.test.mjs
// and test/sidecar_powfinder_wiring.test.mjs make elsewhere in this suite.
//
// Manually verified once (not by this test, which can't run the bundler):
// `HEXAGONS_DIST_DIR=<tmp> node build.mjs` with the flag unset copies zero
// powfinder_fixtures files into dist; with
// HEXAGONS_INCLUDE_POWFINDER_FIXTURES=1 (and a locally generated fixture
// season present) it copies every fixture file into dist/powfinder_fixtures/
// with its subdirectory structure intact.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const build = readFileSync(fileURLToPath(new URL('../build.mjs', import.meta.url)), 'utf8');

test('copyStaticAssets copies powfinder_fixtures only behind the opt-in env flag', () => {
    const start = build.indexOf('async function copyStaticAssets()');
    assert.ok(start > -1, 'copyStaticAssets must exist');
    const body = build.slice(start, build.indexOf('\n}', start));
    assert.match(body, /process\.env\.HEXAGONS_INCLUDE_POWFINDER_FIXTURES === '1'/,
        'the fixture copy must be gated behind an explicit opt-in flag, not run unconditionally');
    assert.match(body, /copyDirectoryRecursive\('powfinder_fixtures'\)/,
        'the flag branch must copy the whole powfinder_fixtures/ subtree');
    // The gate must wrap the copy call, not just appear anywhere in the
    // function (e.g. only in a comment) -- assert the flag check occurs
    // before the copy call it guards.
    assert.ok(
        body.indexOf("HEXAGONS_INCLUDE_POWFINDER_FIXTURES === '1'") <
        body.indexOf("copyDirectoryRecursive('powfinder_fixtures')"),
        'the env flag check must precede the fixture copy it gates',
    );
});

test('APP_STYLESHEETS is untouched by this change (P2.5 was told not to touch it)', () => {
    assert.match(build, /const APP_STYLESHEETS = \[/);
});
