// @atlas: The 'HexSearch' module. A UI component that lazy-loads GeoJSON data for Tirol peaks and ski resorts, providing an interactive search interface. It translates geographic coordinates to local PistonViewer space and safely rejects flights to destinations lying outside the currently baked map bounds.
import { initProjection, latLonToWorld, worldToGosperTile } from './coordinate_utility.js?v=pageonly1';

export class HexSearch {
    constructor() {
        this.peaks = [];
        this.skiAreas = [];
        this.loaded = false;
        this.loadPromise = null;
        this.activeIndex = 0;
        this.currentResults = []; // [{type, item}, ...]

        this.injectStyles();
        this.initUI();
    }

    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #hex-search-container {
                position: absolute;
                top: 20px;
                right: 20px;
                width: 300px;
                z-index: 1000;
                font-family: 'Outfit', sans-serif;
            }
            .search-box {
                background: rgba(15, 23, 42, 0.8);
                backdrop-filter: blur(12px);
                border: 1px solid rgba(116, 185, 255, 0.2);
                border-radius: 24px;
                display: flex;
                align-items: center;
                padding: 10px 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                transition: all 0.3s ease;
            }
            .search-box:focus-within {
                border-color: #ff6b9d;
                box-shadow: 0 10px 40px rgba(255, 107, 157, 0.2);
            }
            .search-box svg {
                color: #74b9ff;
                margin-right: 10px;
            }
            #hex-search-input {
                background: transparent;
                border: none;
                color: #fff;
                font-family: inherit;
                font-size: 1rem;
                width: 100%;
                outline: none;
            }
            #hex-search-results {
                margin-top: 10px;
                background: rgba(15, 23, 42, 0.9);
                backdrop-filter: blur(16px);
                border-radius: 12px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                max-height: 400px;
                overflow-y: auto;
                opacity: 0;
                transform: translateY(-10px);
                pointer-events: none;
                transition: all 0.2s ease;
            }
            #hex-search-results.visible {
                opacity: 1;
                transform: translateY(0);
                pointer-events: auto;
            }
            #hex-search-results[hidden] {
                display: none;
            }
            .result-section {
                padding: 8px 15px;
                font-size: 0.7rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #94a3b8;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            }
            .result-item {
                padding: 12px 15px;
                cursor: pointer;
                transition: background 0.1s;
                border-left: 2px solid transparent;
            }
            .result-item:hover, .result-item.active {
                background: rgba(116, 185, 255, 0.1);
                border-left-color: #74b9ff;
            }
            .result-item .name {
                display: block;
                color: #e2e8f0;
                font-weight: 600;
            }
            .result-item .meta {
                display: block;
                font-size: 0.8rem;
                color: #64748b;
                margin-top: 2px;
            }
            .result-item.unavailable {
                opacity: 0.46;
                cursor: not-allowed;
                filter: grayscale(0.85);
            }
            .result-item.unavailable:hover {
                background: transparent;
                border-left-color: transparent;
            }
            .result-item.unavailable .name {
                color: #94a3b8;
            }
            .result-item.unavailable .meta {
                color: #475569;
            }
            .result-item.empty,
            .result-item.loading {
                cursor: default;
            }
            .result-status {
                color: #f87171;
                font-size: 0.7rem;
                font-weight: 800;
                margin-left: 6px;
                text-transform: uppercase;
            }
            .result-item.ski {
                border-left-color: #ff6b9d; /* Pink for Ski */
            }
            .result-item[aria-selected="true"] {
                background: rgba(116, 185, 255, 0.1);
                border-left-color: #74b9ff;
            }
            
            @media (max-width: 768px) {
                #hex-search-container {
                    top: 10px;
                    right: 10px;
                    width: calc(100% - 20px);
                }
            }
        `;
        document.head.appendChild(style);
    }

    initUI() {
        const container = document.createElement('div');
        container.id = 'hex-search-container';
        container.innerHTML = `
            <div class="search-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input type="text" id="hex-search-input" placeholder="Search Peaks & Ski Areas..." autocomplete="off"
                    role="combobox" aria-label="Search peaks and ski areas" aria-autocomplete="list"
                    aria-controls="hex-search-results" aria-expanded="false">
            </div>
            <div id="hex-search-results" role="listbox" aria-label="Search results" hidden></div>
            <div id="hex-search-status" class="sr-only" aria-live="polite" aria-atomic="true"></div>
        `;
        document.body.appendChild(container);

        this.input = document.getElementById('hex-search-input');
        this.resultsBox = document.getElementById('hex-search-results');
        this.status = document.getElementById('hex-search-status');

        this.input.addEventListener('focus', () => {
            this.loadData()
                .then(() => this.handleInput({ target: this.input }))
                .catch(() => {});
        });
        this.input.addEventListener('input', (e) => this.handleInput(e));
        this.input.addEventListener('keydown', (e) => this.handleKey(e));

        // Hide on click outside
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                this.hideResults();
            }
        });
    }

    announce(message) {
        if (this.status) this.status.textContent = message;
    }

    showResults() {
        this.resultsBox.hidden = false;
        this.resultsBox.classList.add('visible');
        this.input.setAttribute('aria-expanded', 'true');
    }

    hideResults() {
        this.resultsBox.hidden = true;
        this.resultsBox.classList.remove('visible');
        this.input.setAttribute('aria-expanded', 'false');
        this.input.removeAttribute('aria-activedescendant');
    }

    setActiveDescendant() {
        if (this.activeIndex >= 0 && this.currentResults[this.activeIndex]?.availability?.available !== false) {
            this.input.setAttribute('aria-activedescendant', `hex-search-option-${this.activeIndex}`);
        } else {
            this.input.removeAttribute('aria-activedescendant');
        }
    }

    async loadData() {
        if (this.loaded) return;
        if (this.loadPromise) return this.loadPromise;

        this.loadPromise = (async () => {
            // Lazy load projection + data
            await initProjection();

            const [peaksRes, skiRes] = await Promise.all([
                fetch('assets/tirol_peaks.geojson'),
                fetch('assets/skigebiete.json')
            ]);

            if (!peaksRes.ok || !skiRes.ok) {
                throw new Error(`HTTP ${peaksRes.status}/${skiRes.status}`);
            }

            const peaksData = await peaksRes.json();
            const skiData = await skiRes.json();

            this.peaks = peaksData.features.map(f => ({
                name: f.properties.name,
                ele: f.properties.ele,
                lat: f.geometry.coordinates[1],
                lon: f.geometry.coordinates[0],
                type: 'peak'
            })).filter(p => p.name);

            this.skiAreas = skiData.ski_areas.map(a => ({
                name: a.name,
                lat: a.gps.lat,
                lon: a.gps.lon,
                x: a.epsg_31254?.x,
                y: a.epsg_31254?.y,
                type: 'ski'
            }));

            this.loaded = true;
            console.log(`Loaded ${this.peaks.length} peaks and ${this.skiAreas.length} ski areas.`);
        })();

        try {
            return await this.loadPromise;
        } catch (e) {
            console.error("Search Data Load Error:", e);
            this.renderMessage("Search data unavailable.", "empty");
        } finally {
            this.loadPromise = null;
        }
    }

    escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, c => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[c]));
    }

    renderMessage(message, className = 'empty') {
        this.resultsBox.innerHTML = `<div class="result-item ${className}" role="option" aria-disabled="true"><span class="meta">${this.escapeHtml(message)}</span></div>`;
        this.activeIndex = -1;
        this.showResults();
        this.setActiveDescendant();
        this.announce(message);
    }

    getWorldPosition(item) {
        if (Number.isFinite(item.x) && Number.isFinite(item.y)) {
            return { x: item.x, y: item.y };
        }
        return latLonToWorld(item.lat, item.lon);
    }

    getManifestTileKeys(manifest) {
        if (!manifest || !Array.isArray(manifest.tiles)) return null;
        if (this.manifestTileSource !== manifest) {
            this.manifestTileSource = manifest;
            this.manifestTileKeys = new Set(manifest.tiles.map(t => `${t.yq}_${t.yr}`));
        }
        return this.manifestTileKeys;
    }

    getAvailability(item) {
        const viewer = window.pistonViewer;
        const manifest = viewer?.manifest;
        if (!manifest) return { available: true, label: '', sectorKey: '' };

        const worldPos = this.getWorldPosition(item);
        const tile = worldToGosperTile(worldPos.x, worldPos.y);
        const sectorKey = `${tile.yq}_${tile.yr}`;
        const tileIndex = viewer.manifestGrid || this.getManifestTileKeys(manifest);
        const hasTile = tileIndex ? tileIndex.has(sectorKey) : false;

        if (hasTile) return { available: true, label: '', sectorKey };

        const b = manifest.bounds;
        const insideBounds = b
            ? worldPos.x >= b.min_x && worldPos.x <= b.max_x && worldPos.y >= b.min_y && worldPos.y <= b.max_y
            : false;

        return {
            available: false,
            label: insideBounds ? 'No baked imagery' : 'Outside bake',
            sectorKey
        };
    }

    async handleInput(e) {
        const query = e.target.value.toLowerCase().trim();
        if (query.length < 2) {
            this.hideResults();
            this.currentResults = [];
            this.activeIndex = -1;
            this.announce('Search cleared.');
            return;
        }

        if (!this.loaded) {
            this.renderMessage("Loading search index...", "loading");
            await this.loadData();

            const latestQuery = this.input.value.toLowerCase().trim();
            if (latestQuery !== query) {
                this.handleInput({ target: this.input });
                return;
            }

            if (!this.loaded) return;
        }

        const skiMatches = this.skiAreas
            .filter(i => i.name.toLowerCase().includes(query))
            .slice(0, 5)
            .map(i => ({ ...i, category: 'Ski Areas' }));

        const peakMatches = this.peaks
            .filter(i => i.name.toLowerCase().includes(query))
            .slice(0, 10)
            .map(i => ({ ...i, category: 'Peaks' }));

        this.currentResults = [...skiMatches, ...peakMatches]
            .map(i => ({ ...i, availability: this.getAvailability(i) }));

        const firstAvailable = this.currentResults.findIndex(i => i.availability.available);
        this.activeIndex = firstAvailable >= 0 ? firstAvailable : -1;
        this.renderResults();
    }

    renderResults() {
        if (this.currentResults.length === 0) {
            this.renderMessage("No matches found.", "empty");
            return;
        }

        let html = '';
        let lastCat = '';

        this.currentResults.forEach((res, idx) => {
            if (res.category !== lastCat) {
                html += `<div class="result-section">${res.category}</div>`;
                lastCat = res.category;
            }

            const availability = res.availability || this.getAvailability(res);
            const activeClass = (idx === this.activeIndex) ? 'active' : '';
            const unavailableClass = availability.available ? '' : 'unavailable';
            const statusLabel = availability.available
                ? ''
                : ` <span class="result-status">${this.escapeHtml(availability.label)}</span>`;
            const metaBase = res.type === 'peak' ? `${res.ele || '?'}m • Peak` : 'Ski Resort';
            const meta = availability.available ? metaBase : `${metaBase} • ${availability.sectorKey}`;

            html += `
                <div class="result-item ${res.type} ${activeClass} ${unavailableClass}" id="hex-search-option-${idx}"
                    data-idx="${idx}" role="option" aria-selected="${idx === this.activeIndex}"
                    aria-disabled="${!availability.available}">
                    <span class="name">${this.escapeHtml(res.name)}${statusLabel}</span>
                    <span class="meta">${this.escapeHtml(meta)}</span>
                </div>
            `;
        });

        this.resultsBox.innerHTML = html;
        this.showResults();
        this.setActiveDescendant();
        const available = this.currentResults.filter(result => result.availability?.available !== false).length;
        this.announce(`${available} available ${available === 1 ? 'result' : 'results'}. Use the up and down arrow keys to choose one.`);

        // Add click listeners
        this.resultsBox.querySelectorAll('.result-item[data-idx]').forEach(el => {
            el.addEventListener('click', () => {
                this.selectResult(parseInt(el.dataset.idx));
            });
        });
    }

    handleKey(e) {
        if (!this.resultsBox.classList.contains('visible')) return;
        if (this.currentResults.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.moveActive(1);
            this.renderResults();
            this.scrollToActive();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.moveActive(-1);
            this.renderResults();
            this.scrollToActive();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (this.activeIndex >= 0) this.selectResult(this.activeIndex);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            this.hideResults();
            this.announce('Search results closed.');
        }
    }

    moveActive(delta) {
        if (!this.currentResults.some(r => r.availability?.available !== false)) return;

        const len = this.currentResults.length;
        let next = this.activeIndex >= 0 ? this.activeIndex : (delta > 0 ? -1 : 0);
        for (let i = 0; i < len; i++) {
            next = (next + delta + len) % len;
            if (this.currentResults[next].availability?.available !== false) {
                this.activeIndex = next;
                return;
            }
        }
    }

    scrollToActive() {
        const el = this.resultsBox.querySelector('.result-item.active');
        if (el) el.scrollIntoView({ block: 'nearest' });
    }

    selectResult(idx) {
        if (!this.currentResults[idx]) return;

        const item = this.currentResults[idx];
        const availability = item.availability || this.getAvailability(item);

        if (!availability.available) {
            console.log(`Blocked navigation to ${item.name} - ${availability.label}.`);
            if (window.pistonViewer?.log) {
                window.pistonViewer.log(`"${item.name}" has no baked imagery in this map.`, "info");
            }
            this.announce(`${item.name} is unavailable: ${availability.label}.`);
            return;
        }

        const worldPos = this.getWorldPosition(item);

        console.log(`Zooming to ${item.name}:`, worldPos);

        if (window.pistonViewer) {
            // Adjust camera logic for PistonViewer
            // PistonViewer origin is 0,0,0 at init start.
            // We need to map worldPos to ONE PistonViewer local coord.
            // main.js: this.worldOrigin = { x: min_x, y: min_y };
            // localX = worldPos.x - worldOrigin.x
            // localZ = -(worldPos.y - worldOrigin.y)

            const v = window.pistonViewer;
            if (v.worldOrigin) {
                const tx = worldPos.x - v.worldOrigin.x;
                const tz = -(worldPos.y - v.worldOrigin.y);

                // Fly there
                v.controls.target.set(tx, 0, tz);
                v.camera.position.set(tx, 1500, tz + 1000); // Offset for view
                v.notifyCameraMotion(performance.now());
                v.controls.update();
                v.needsRender = true;
                v.needsLODUpdate = true;

                v.updateLOD();
            }
        }

        this.hideResults();
        this.input.value = item.name;
        this.announce(`${item.name} selected.`);
    }
}

// End of Search Module
