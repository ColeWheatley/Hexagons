// @atlas: Search UI backed by a generated compact peak/resort index. It translates geographic coordinates to local PistonViewer space and safely rejects flights to destinations lying outside the currently baked map bounds.
import { initProjection, latLonToWorld, worldToGosperTile } from './coordinate_utility.js?v=pageonly1';
import { normalizeSearchText, rankSearchItems } from './search_index.js?v=aa12';

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
                <input type="text" id="hex-search-input" placeholder="Search Peaks & Ski Areas..." autocomplete="off">
            </div>
            <div id="hex-search-results" class="hidden"></div>
        `;
        document.body.appendChild(container);

        this.input = document.getElementById('hex-search-input');
        this.resultsBox = document.getElementById('hex-search-results');

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
                this.resultsBox.classList.remove('visible');
            }
        });
    }

    async loadData() {
        if (this.loaded) return;
        if (this.loadPromise) return this.loadPromise;

        this.loadPromise = (async () => {
            // Lazy load projection + data
            await initProjection();

            const indexRes = await fetch('assets/search_index.json');
            if (!indexRes.ok) throw new Error(`HTTP ${indexRes.status}`);
            const index = await indexRes.json();
            if (index.version !== 1 || !Array.isArray(index.items)) {
                throw new Error('Unsupported search index format');
            }

            const items = index.items.map(row => ({
                name: row[0],
                terms: row[1],
                ele: row[2],
                lat: row[3],
                lon: row[4],
                type: row[5] === 's' ? 'ski' : 'peak',
                available: row[6] === 1,
                x: row[7],
                y: row[8],
            }));
            this.peaks = items.filter(item => item.type === 'peak');
            this.skiAreas = items.filter(item => item.type === 'ski');

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
        this.resultsBox.innerHTML = `<div class="result-item ${className}"><span class="meta">${this.escapeHtml(message)}</span></div>`;
        this.resultsBox.classList.add('visible');
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
        if (!manifest) {
            return item.available === false
                ? { available: false, label: 'Outside bake', sectorKey: '' }
                : { available: true, label: '', sectorKey: '' };
        }

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
        const query = normalizeSearchText(e.target.value);
        if (query.length < 2) {
            this.resultsBox.classList.remove('visible');
            this.currentResults = [];
            this.activeIndex = -1;
            return;
        }

        if (!this.loaded) {
            this.renderMessage("Loading search index...", "loading");
            await this.loadData();

            const latestQuery = normalizeSearchText(this.input.value);
            if (latestQuery !== query) {
                this.handleInput({ target: this.input });
                return;
            }

            if (!this.loaded) return;
        }

        const isAvailable = item => this.getAvailability(item).available;
        const skiMatches = rankSearchItems(this.skiAreas, query, 5, isAvailable)
            .map(i => ({ ...i, category: 'Ski Areas' }));

        const peakMatches = rankSearchItems(this.peaks, query, 10, isAvailable)
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
                <div class="result-item ${res.type} ${activeClass} ${unavailableClass}" data-idx="${idx}">
                    <span class="name">${this.escapeHtml(res.name)}${statusLabel}</span>
                    <span class="meta">${this.escapeHtml(meta)}</span>
                </div>
            `;
        });

        this.resultsBox.innerHTML = html;
        this.resultsBox.classList.add('visible');

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
            this.resultsBox.classList.remove('visible');
            this.input.blur();
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

        this.resultsBox.classList.remove('visible');
        this.input.value = item.name;
    }
}

// End of Search Module
