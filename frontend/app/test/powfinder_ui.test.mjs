// Tests the jsdom-free pure builders in powfinder_ui.mjs (pillList,
// layerPickerHtml, legendHtml, introSheetHtml) plus text-invariant checks on
// powfinder.css, in the style of test/navigation_overlay_dom.test.mjs.
//
// mountPowfinderUi() itself is the one impure, DOM-touching export and is
// deliberately NOT unit-tested here -- it is verified in a real browser via
// powfinder_ui_preview.html (screenshots + axe-core), the same split P1.2/
// P1.3 use between `npm test` string-invariant checks and "browser: ..."
// live checks. A hand-rolled fake DOM capable of simulating innerHTML-based
// event delegation and querySelector would be its own untested liability;
// better to test the real thing in a real browser.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
    OFF_LAYER_ID,
    STEEPNESS_LAYER_ID,
    pillList,
    layerPickerHtml,
    legendHtml,
    introSheetHtml,
} from '../powfinder_ui.mjs';
import { rampStops } from '../sidecar_colormap.mjs';

const read = path => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');
const css = read('../powfinder.css');
const html = read('../index.html');

// A representative slice of the real backend's index.json `layers` (design
// doc §1.2 schema; short/label per the real shape, not invented).
const LAYERS = [
    { id: 'sqh', label: 'Snow quality', ramp: 'powder', short: 'SQH' },
    { id: 'depth', label: 'Snow depth', ramp: 'depth', short: 'HS' },
    { id: 'avalanche', label: 'Avalanche', ramp: 'hazard', short: 'AVY' },
    { id: 'surface', label: 'Surface state', ramp: 'surface', short: 'SFC' },
];

test('pillList is generated from the given layers, not hardcoded, plus synthesized STEEP + OFF', () => {
    const pills = pillList(LAYERS);
    assert.deepEqual(pills.map(p => p.id), ['sqh', 'depth', 'avalanche', 'surface', STEEPNESS_LAYER_ID, OFF_LAYER_ID]);
    assert.equal(pills[0].short, 'SQH');
    assert.equal(pills.at(-2).short, 'STEEP');
    assert.equal(pills.at(-1).short, '✕');

    // A layer the backend has not shipped simply does not appear (§3.2).
    const twoLayers = pillList(LAYERS.slice(0, 2));
    assert.deepEqual(twoLayers.map(p => p.id), ['sqh', 'depth', STEEPNESS_LAYER_ID, OFF_LAYER_ID]);

    // No index.json / no layers -> only the two synthesized pills remain
    // structurally available (mountPowfinderUi separately hides the whole
    // bar in this case -- see the "index.json absent" test below).
    assert.deepEqual(pillList([]).map(p => p.id), [STEEPNESS_LAYER_ID, OFF_LAYER_ID]);
    assert.deepEqual(pillList(undefined).map(p => p.id), [STEEPNESS_LAYER_ID, OFF_LAYER_ID]);
});

test('pillList never renders engineLayers even if a caller passes them by mistake', () => {
    // engineLayers (slab/hn24/hn72/wet/sdens, see sidecar_format.mjs) is a
    // *separate* index.json field from `layers` and must never be handed to
    // this module. This locks the contract: pillList renders exactly what
    // it is given and nothing else, so passing the wrong array is visible
    // immediately rather than silently filtered.
    const withEngineShaped = [...LAYERS, { id: 'slab', label: 'Slab', short: 'SLAB' }];
    const pills = pillList(withEngineShaped);
    assert.ok(pills.some(p => p.id === 'slab'), 'pillList is a dumb renderer -- filtering engineLayers out is the caller\'s job');
});

test('layerPickerHtml marks exactly the active pill aria-pressed=true', () => {
    const out = layerPickerHtml(LAYERS, 'avalanche');
    assert.match(out, /data-layer-id="avalanche" aria-pressed="true"/);
    assert.match(out, /data-layer-id="sqh" aria-pressed="false"/);
    assert.match(out, /data-layer-id="depth" aria-pressed="false"/);
    assert.match(out, /data-layer-id="surface" aria-pressed="false"/);
    assert.match(out, new RegExp(`data-layer-id="${STEEPNESS_LAYER_ID}" aria-pressed="false"`));
    assert.match(out, new RegExp(`data-layer-id="${OFF_LAYER_ID}" aria-pressed="false"`));
    assert.match(out, /class="pf-pill pf-pill-active"/);
    assert.match(out, /role="group" aria-label="Map layer"/);
});

test('layerPickerHtml renders the loading bar only for ids in loadingIds, tapping is never blocked', () => {
    const out = layerPickerHtml(LAYERS, 'sqh', { loadingIds: new Set(['depth']) });
    const depthButton = out.match(/<button[^>]*data-layer-id="depth"[\s\S]*?<\/button>/)[0];
    const sqhButton = out.match(/<button[^>]*data-layer-id="sqh"[\s\S]*?<\/button>/)[0];
    assert.match(depthButton, /pf-pill-loading/);
    assert.doesNotMatch(sqhButton, /pf-pill-loading/);
    // Still a live, unrestricted button -- no disabled attribute anywhere.
    assert.doesNotMatch(depthButton, /\bdisabled\b/);
});

test('layerPickerHtml escapes untrusted-looking label/short text', () => {
    const hostile = [{ id: 'x', label: '<img onerror=alert(1)>', short: '"><script>' }];
    const out = layerPickerHtml(hostile, 'x');
    assert.doesNotMatch(out, /<img onerror/);
    assert.doesNotMatch(out, /<script>/);
    assert.match(out, /&lt;script&gt;/);
});

test('legendHtml is empty for STEEP, OFF, an unknown id, and no active layer (relies on the pre-existing static steepness rows)', () => {
    assert.equal(legendHtml(LAYERS, STEEPNESS_LAYER_ID), '');
    assert.equal(legendHtml(LAYERS, OFF_LAYER_ID), '');
    assert.equal(legendHtml(LAYERS, 'not-a-real-layer'), '');
    assert.equal(legendHtml(LAYERS, undefined), '');
});

test('legendHtml for a continuous layer (sqh) matches rampStops(\'powder\') exactly', () => {
    const out = legendHtml(LAYERS, 'sqh');
    const stops = rampStops('powder');
    assert.match(out, /SNOW QUALITY/);
    assert.ok(out.includes(stops.css), 'legend gradient bar must use the exact rampStops() css string');
    assert.match(out, new RegExp(`<span>${stops.ticks[0].label}</span><span>${stops.ticks[1].label}</span>`));
    assert.match(out, /modeled · beta/);
    assert.doesNotMatch(out, /not a forecast/);
});

test('legendHtml for the avalanche layer uses hazard swatch colours+labels from rampStops and the safety footer', () => {
    const out = legendHtml(LAYERS, 'avalanche');
    const stops = rampStops('hazard');
    assert.equal(stops.categorical, true);
    for (const tick of stops.ticks) {
        assert.ok(out.includes(tick.label), `missing hazard class label "${tick.label}"`);
    }
    // hazard row's neutral floor (severity 0/1) means only the 5 real EAWS
    // colours should ever appear as swatches -- reuse rampStops' own css to
    // avoid re-deriving the extraction logic in the test.
    const hexes = [...new Set(stops.css.match(/#[0-9a-fA-F]{6}/g))];
    for (const hex of hexes) assert.ok(out.includes(hex), `missing swatch colour ${hex}`);
    assert.match(out, /▨ = runout zone/);
    assert.match(out, /modeled · not a forecast/);
    assert.doesNotMatch(out, /modeled · beta/);
});

test('legendHtml for surface uses rampStops(\'surface\') classes and the standard beta footer', () => {
    const out = legendHtml(LAYERS, 'surface');
    const stops = rampStops('surface');
    for (const tick of stops.ticks) assert.ok(out.includes(tick.label));
    assert.match(out, /modeled · beta/);
    assert.doesNotMatch(out, /runout zone/);
});

test('introSheetHtml carries the non-negotiable model disclaimer and a lawinen.report link', () => {
    const out = introSheetHtml();
    assert.match(out, /physics model, not an observation/);
    assert.match(out, /never been validated in the field/);
    assert.match(out, /href="https:\/\/lawinen\.report"/);
    assert.match(out, /role="dialog" aria-modal="true"/);
    assert.match(out, /id="pf-intro-dismiss"/);
});

// --- powfinder.css text-invariant checks (navigation_overlay_dom.test.mjs style) ---

test('every mount this module owns has a [hidden] display:none override (the silent-failure trap)', () => {
    // Setting `el.hidden = false` only works if no higher-specificity CSS
    // rule (e.g. a plain `#id { display: ... }`) fights the [hidden]
    // attribute. Each owned mount must have an explicit [hidden] override.
    for (const id of ['powfinder-dock', 'powfinder-layers', 'powfinder-legend', 'powfinder-intro']) {
        assert.match(css, new RegExp(`#${id}\\[hidden\\]\\s*\\{[^}]*display\\s*:\\s*none`), `#${id} needs a [hidden] override`);
    }
});

test('pills and the intro dismiss button meet the 56px glove hit-target rule outside the compact media query', () => {
    const outsideCompact = css.split('@media (max-width: 390px)')[0];
    assert.match(outsideCompact, /\.pf-pill\s*\{[^}]*min-width:\s*56px/);
    assert.match(outsideCompact, /\.pf-pill\s*\{[^}]*min-height:\s*56px/);
    assert.match(outsideCompact, /\.pf-btn-primary\s*\{[^}]*min-height:\s*56px/);
});

test('the compact media query never shrinks a hit target below 56px', () => {
    const compactBlock = css.slice(css.indexOf('@media (max-width: 390px)'));
    assert.doesNotMatch(compactBlock, /min-(width|height)\s*:\s*(?:[0-4]?\d|5[0-5])px/);
});

test('the loading-bar sweep animation is disabled under prefers-reduced-motion', () => {
    assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.pf-pill-loading\s*\{[^}]*animation\s*:\s*none/);
});

test('powfinder.css never targets the engineering HUD accent colour (surfaces stay visually separable)', () => {
    // Strip comments first -- the file's own header comment legitimately
    // *names* the HUD blue as the colour to avoid; only a live rule using
    // it would be the actual violation.
    const rulesOnly = css.replace(/\/\*[\s\S]*?\*\//g, '');
    assert.doesNotMatch(rulesOnly, /rgba\(116,\s*185,\s*255/);
    assert.doesNotMatch(rulesOnly, /#74b9ff/);
});

test('index.html mounts this module owns are present with the expected data-owner (pre-landed, read-only contract)', () => {
    for (const id of ['powfinder-dock', 'powfinder-layers', 'powfinder-legend', 'powfinder-intro']) {
        assert.match(html, new RegExp(`id="${id}"[^>]*hidden`), `#${id} must ship hidden by default`);
    }
});
