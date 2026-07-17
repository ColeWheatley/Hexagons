// Browser-free DOM contract coverage for AA-16. Run with:
// node --experimental-vm-modules tests/gosper/test_ui_accessibility.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const context = vm.createContext({ console, window: {} });

async function loadModule(filename, { stubCoordinateUtility = false } = {}) {
    const source = await fs.readFile(filename, 'utf8');
    const module = new vm.SourceTextModule(source, { context, identifier: filename });
    await module.link(async (specifier) => {
        if (specifier === './search_index.js') {
            const dependency = path.join(path.dirname(filename), specifier);
            const dependencySource = await fs.readFile(dependency, 'utf8');
            const dependencyModule = new vm.SourceTextModule(dependencySource, {
                context,
                identifier: dependency,
            });
            await dependencyModule.link(() => {
                throw new Error('search_index.js unexpectedly imported another module');
            });
            return dependencyModule;
        }
        if (stubCoordinateUtility && specifier.startsWith('./coordinate_utility.js')) {
            const stub = new vm.SyntheticModule(
                ['initProjection', 'latLonToWorld', 'worldToGosperTile'],
                function evaluate() {
                    this.setExport('initProjection', async () => {});
                    this.setExport('latLonToWorld', () => ({ x: 0, y: 0 }));
                    this.setExport('worldToGosperTile', () => ({ yq: 0, yr: 0 }));
                },
                { context },
            );
            return stub;
        }
        throw new Error(`Unexpected import: ${specifier}`);
    });
    await module.evaluate();
    return module.namespace;
}

class ClassList {
    constructor(initial = []) { this.values = new Set(initial); }
    add(...names) { names.forEach(name => this.values.add(name)); }
    remove(...names) { names.forEach(name => this.values.delete(name)); }
    contains(name) { return this.values.has(name); }
    toggle(name, force) {
        const enabled = force === undefined ? !this.values.has(name) : Boolean(force);
        if (enabled) this.values.add(name); else this.values.delete(name);
        return enabled;
    }
}

class Element {
    constructor(classes = []) {
        this.classList = new ClassList(classes);
        this.attributes = new Map();
        this.hidden = false;
        this.textContent = '';
        this.title = '';
        this.innerHTML = '';
        this.listeners = new Map();
    }
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
    getAttribute(name) { return this.attributes.get(name) ?? null; }
    removeAttribute(name) { this.attributes.delete(name); }
    addEventListener(type, listener) { this.listeners.set(type, listener); }
    querySelectorAll() { return []; }
    querySelector() { return { scrollIntoView() {} }; }
}

const accessibility = await loadModule(path.join(ROOT, 'frontend/app/ui_accessibility.js'));
const { HexSearch } = await loadModule(path.join(ROOT, 'frontend/app/search.js'), { stubCoordinateUtility: true });

// Collapsed content must become non-rendered/non-focusable, not merely transparent.
const panel = new Element(['glass-panel', 'minimized']);
const panelButton = new Element();
const panelBody = new Element();
accessibility.setPanelMinimized(panel, panelButton, panelBody, true);
assert.equal(panelBody.hidden, true);
assert.equal(panelBody.getAttribute('aria-hidden'), 'true');
assert.equal(panelButton.getAttribute('aria-expanded'), 'false');
assert.equal(panelButton.getAttribute('aria-label'), 'Expand controls panel');
accessibility.setPanelMinimized(panel, panelButton, panelBody, false);
assert.equal(panelBody.hidden, false);
assert.equal(panelButton.getAttribute('aria-expanded'), 'true');

const disclosureButton = new Element();
const disclosureContent = new Element();
accessibility.setDisclosure(disclosureButton, disclosureContent, false);
assert.equal(disclosureContent.hidden, true);
assert.equal(accessibility.toggleDisclosure(disclosureButton, disclosureContent), true);
assert.equal(disclosureContent.hidden, false);
assert.equal(disclosureButton.getAttribute('aria-expanded'), 'true');

// Exercise the real search keyboard state machine against a small DOM double.
const search = Object.create(HexSearch.prototype);
search.input = new Element();
search.resultsBox = new Element();
search.status = new Element();
search.currentResults = [
    { name: 'Blocked', type: 'peak', category: 'Peaks', availability: { available: false, label: 'Outside bake', sectorKey: '0_0' } },
    { name: 'Available one', type: 'peak', category: 'Peaks', availability: { available: true, label: '', sectorKey: '0_1' } },
    { name: 'Available two', type: 'ski', category: 'Ski Areas', availability: { available: true, label: '', sectorKey: '0_2' } },
];
search.activeIndex = 1;
search.renderResults();
assert.equal(search.resultsBox.hidden, false);
assert.equal(search.input.getAttribute('aria-expanded'), 'true');
assert.equal(search.input.getAttribute('aria-activedescendant'), 'hex-search-option-1');
assert.match(search.resultsBox.innerHTML, /role="option"/);
assert.match(search.resultsBox.innerHTML, /aria-disabled="true"/);
assert.match(search.status.textContent, /2 available results/);

let prevented = false;
search.handleKey({ key: 'ArrowDown', preventDefault() { prevented = true; } });
assert.equal(prevented, true);
assert.equal(search.activeIndex, 2, 'ArrowDown skips unavailable results');
assert.equal(search.input.getAttribute('aria-activedescendant'), 'hex-search-option-2');
search.handleKey({ key: 'Enter', preventDefault() {} });
assert.equal(search.input.value, 'Available two');
assert.equal(search.resultsBox.hidden, true);
assert.equal(search.status.textContent, 'Available two selected.');
search.renderResults();
search.handleKey({ key: 'Escape', preventDefault() {} });
assert.equal(search.resultsBox.hidden, true);
assert.equal(search.input.getAttribute('aria-expanded'), 'false');
assert.equal(search.input.getAttribute('aria-activedescendant'), null);
assert.equal(search.status.textContent, 'Search results closed.');

// Keep the shell semantics and motion override independently inspectable.
const [html, css] = await Promise.all([
    fs.readFile(path.join(ROOT, 'frontend/app/index.html'), 'utf8'),
    fs.readFile(path.join(ROOT, 'frontend/app/style.css'), 'utf8'),
]);
assert.match(html, /<button class="collapsible-header" type="button" aria-expanded="false" aria-controls="debug-content">/);
assert.match(html, /id="main-panel-body" hidden aria-hidden="true"/);
assert.match(html, /for="lod-pause-toggle"/);
assert.match(html, /aria-pressed="true"/);
assert.match(css, /:focus-visible/);
assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);

console.log('UI accessibility DOM contract tests passed');
