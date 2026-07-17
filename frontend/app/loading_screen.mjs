// @atlas: Two-phase honest loading screen. Phase one is the 900ms skier hero
// moment; phase two (only reached when the network is slower than the drama)
// swaps in real progress: a byte-weighted monotonic bar, terrain/texture
// counters, truthful phase lines, retry countdowns, and rotating quips.
// LoadingProgressModel is pure and DOM-free for node:test; LoadingScreen is
// the thin DOM binding. No THREE imports, no rAF — one 250ms interval that
// dies with the loader (AA-8 idle discipline).
export const LOADER_PHASE = Object.freeze({
    HERO: 'hero',
    PROGRESS: 'progress',
    FATAL: 'fatal',
    HIDDEN: 'hidden',
});

// Planned bytes are not in the manifest, so each class starts from a seed and
// self-corrects to the running measured average as completions land. The MB
// readout always shows real measured bytes; only the bar's denominator
// estimates, and the displayed fraction never decreases.
const CLASS_SEED_BYTES = Object.freeze({
    manifest: 95_000,
    terrain: 280_000,
    bootstrap: 3_000,
    ktx2: 400_000,
});

export const LOADER_QUIPS = Object.freeze([
    'Fetching high-res bestagons…',
    'Waxing the skis for 16,807 hexes…',
    'Borrowing the satellite’s good camera…',
    'Teaching bestagons to tessellate…',
    'Polishing the Stubai skyline…',
    'Asking the GPU very nicely…',
    'Folding the Alps down to bytes…',
    'Warming up the chairlift…',
    'Herding pixels into place…',
]);

// Tier names come from PAGE_TEXTURE_TIER ('bootstrap32' vs the KTX2 tiers);
// matched by prefix so this module stays dependency-free and node-testable.
function textureClassForTier(tier) {
    return String(tier).startsWith('bootstrap') ? 'bootstrap' : 'ktx2';
}

function formatMegabytes(bytes) {
    return (bytes / (1024 * 1024)).toFixed(1);
}

export class LoadingProgressModel {
    constructor({
        heroHoldMs = 900,
        quipIntervalMs = 3600,
        quips = LOADER_QUIPS,
        random = Math.random,
    } = {}) {
        this.heroHoldMs = heroHoldMs;
        this.quipIntervalMs = quipIntervalMs;
        this.quips = quips.length > 0 ? [...quips] : ['Loading…'];
        this.random = random;
        this.start(0);
    }

    // (Re)starts a boot attempt. The hero clock restarts with it, so a retry
    // gets the full drama again before the honest screen may appear.
    start(now) {
        this.startTime = now;
        this.hidden = false;
        this.fatalInfo = null;
        this.offline = false;
        this.retryInfo = null;
        this.manifestDone = false;
        this.manifestBytes = 0;
        this.classes = {
            terrain: { planned: 0, done: 0, bytes: 0 },
            bootstrap: { planned: 0, done: 0, bytes: 0 },
            ktx2: { planned: 0, done: 0, bytes: 0 },
        };
        this.maxFraction = 0;
        this.quipOffset = Math.floor(this.random() * this.quips.length);
    }

    hide() {
        this.hidden = true;
        this.retryInfo = null;
    }

    manifestStarted() {
        this.manifestDone = false;
    }

    manifestLoaded(bytes) {
        this.manifestDone = true;
        this.manifestBytes = Math.max(0, bytes | 0);
    }

    planned(className, count) {
        const entry = this.classes[className];
        if (!entry) return;
        entry.planned = Math.max(entry.planned, count | 0);
    }

    terrainPlanned(count) { this.planned('terrain', count); }

    texturePlanned(count, tier) {
        this.planned(textureClassForTier(tier), count);
    }

    completed(className, bytes) {
        const entry = this.classes[className];
        if (!entry) return;
        entry.done += 1;
        entry.bytes += Math.max(0, bytes | 0);
        this.retryInfo = null;
    }

    terrainDone(bytes) { this.completed('terrain', bytes); }

    textureDone(bytes, tier) {
        this.completed(textureClassForTier(tier), bytes);
    }

    retryScheduled({ kind, attempt, maxAttempts, delayMs }, now) {
        this.retryInfo = {
            kind,
            attempt,
            maxAttempts,
            until: now + delayMs,
        };
    }

    setOffline(flag) {
        this.offline = !!flag;
    }

    fatal({ title, message, detail = '' }) {
        this.fatalInfo = { title, message, detail };
        this.retryInfo = null;
    }

    _classAverage(className) {
        const entry = this.classes[className];
        return entry.done > 0 ? entry.bytes / entry.done : CLASS_SEED_BYTES[className];
    }

    totalBytesDone() {
        let total = this.manifestBytes;
        for (const entry of Object.values(this.classes)) total += entry.bytes;
        return total;
    }

    textureCounts() {
        const boot = this.classes.bootstrap;
        const ktx2 = this.classes.ktx2;
        return {
            planned: boot.planned + ktx2.planned,
            done: boot.done + ktx2.done,
        };
    }

    // Byte-weighted, monotonic. Done work contributes measured bytes; pending
    // work contributes the class's current measured average (seed before the
    // first completion). Averages drift as measurements arrive, so the raw
    // fraction can move both ways — the displayed value is clamped to the
    // high-water mark and only ever advances. The clamp is gated on
    // determinacy: between manifest-loaded and first-plan the ratio is 1.0
    // by construction (manifest is the only known work) and must not pin
    // the high-water mark.
    fraction() {
        let plannedBytes = this.manifestDone ? 0 : CLASS_SEED_BYTES.manifest;
        plannedBytes = Math.max(plannedBytes, this.manifestBytes);
        let doneBytes = this.manifestBytes;
        for (const className of Object.keys(this.classes)) {
            const entry = this.classes[className];
            const average = this._classAverage(className);
            plannedBytes += Math.max(entry.planned, entry.done) * average;
            doneBytes += entry.bytes;
        }
        const raw = plannedBytes > 0 ? doneBytes / plannedBytes : 0;
        if (!this.determinate()) return Math.min(1, raw);
        this.maxFraction = Math.max(this.maxFraction, Math.min(1, raw));
        return this.maxFraction;
    }

    phase(now) {
        if (this.hidden) return LOADER_PHASE.HIDDEN;
        if (this.fatalInfo) return LOADER_PHASE.FATAL;
        return now - this.startTime >= this.heroHoldMs
            ? LOADER_PHASE.PROGRESS
            : LOADER_PHASE.HERO;
    }

    phaseLine(now) {
        if (this.offline) return 'Waiting for a connection…';
        if (this.retryInfo && now < this.retryInfo.until) {
            const seconds = Math.max(1, Math.ceil((this.retryInfo.until - now) / 1000));
            return `Signal hiccup — trying again in ${seconds}s…`;
        }
        if (!this.manifestDone) return 'Reading the map index…';
        const terrain = this.classes.terrain;
        if (terrain.done < Math.max(terrain.planned, 1)) return 'Carving terrain islands…';
        const textures = this.textureCounts();
        if (textures.done < textures.planned) return 'Painting aerial photos…';
        return 'First ridge almost up…';
    }

    counterLine() {
        const parts = [];
        const terrain = this.classes.terrain;
        if (terrain.planned > 0) parts.push(`terrain ${terrain.done}/${terrain.planned}`);
        const textures = this.textureCounts();
        if (textures.planned > 0) parts.push(`textures ${textures.done}/${textures.planned}`);
        parts.push(`${formatMegabytes(this.totalBytesDone())} MB`);
        return parts.join(' · ');
    }

    quip(now) {
        const index = (this.quipOffset + Math.floor(now / this.quipIntervalMs)) % this.quips.length;
        return this.quips[index];
    }

    // The bar is determinate once the manifest has landed and at least one
    // unit of real work is planned; before that only the manifest itself is
    // known, which would pin the bar at 0.
    determinate() {
        if (!this.manifestDone) return false;
        return Object.values(this.classes).some(entry => entry.planned > 0);
    }

    tick(now) {
        const phase = this.phase(now);
        const view = {
            phase,
            determinate: this.determinate(),
            pct: Math.round(this.fraction() * 100),
            phaseLine: this.phaseLine(now),
            counterLine: this.counterLine(),
            quip: this.quip(now),
        };
        if (phase === LOADER_PHASE.FATAL) {
            view.fatalTitle = this.fatalInfo.title;
            view.fatalMessage = this.fatalInfo.message;
            view.fatalDetail = this.fatalInfo.detail;
        }
        return view;
    }
}

// DOM binding. All writes are diffed against the last applied view so the
// 250ms tick costs nothing when nothing changed (same discipline as the HUD).
export class LoadingScreen {
    constructor({
        root = typeof document !== 'undefined' ? document.getElementById('loader') : null,
        now = () => performance.now(),
        tickMs = 250,
        model = new LoadingProgressModel(),
    } = {}) {
        this.root = root;
        this.now = now;
        this.tickMs = tickMs;
        this.model = model;
        this.timer = null;
        this.lastApplied = {};
        this.els = root ? {
            main: root.querySelector('.main-message'),
            fetching: root.querySelector('.fetching-message'),
            progress: root.querySelector('.load-progress'),
            phase: root.querySelector('#load-phase'),
            bar: root.querySelector('#load-bar'),
            fill: root.querySelector('#load-bar-fill'),
            counters: root.querySelector('#load-counters'),
            quip: root.querySelector('#load-quip'),
            fatalDetail: root.querySelector('#fatal-detail'),
            retry: root.querySelector('#fatal-retry-btn'),
        } : {};
        if (this.model.startTime === 0) this.model.start(this.now());
        this._ensureTimer();
    }

    _ensureTimer() {
        if (this.timer || !this.root) return;
        this.timer = setInterval(() => this.render(), this.tickMs);
    }

    _stopTimer() {
        if (!this.timer) return;
        clearInterval(this.timer);
        this.timer = null;
    }

    _setText(key, el, text) {
        if (!el || this.lastApplied[key] === text) return;
        el.textContent = text;
        this.lastApplied[key] = text;
    }

    render() {
        if (!this.root) return;
        const view = this.model.tick(this.now());
        const phase = view.phase;

        if (phase === LOADER_PHASE.HIDDEN) return;

        if (phase === LOADER_PHASE.FATAL) {
            this.root.classList.add('fatal');
            this.root.classList.remove('phase-progress');
            if (this.els.progress && !this.els.progress.hidden) this.els.progress.hidden = true;
            this._setText('main', this.els.main, view.fatalTitle);
            this._setText('fetching', this.els.fetching, view.fatalMessage);
            if (this.els.fatalDetail) {
                this.els.fatalDetail.textContent = view.fatalDetail || '';
                this.els.fatalDetail.hidden = !view.fatalDetail;
            }
            this._stopTimer(); // terminal until Retry/reset
            return;
        }

        this.root.classList.remove('fatal');

        if (phase === LOADER_PHASE.PROGRESS) {
            if (this.lastApplied.phase !== LOADER_PHASE.PROGRESS) {
                this.root.classList.add('phase-progress');
                if (this.els.progress) {
                    this.els.progress.hidden = false;
                    // Force a style flush so the .open transition runs.
                    void this.els.progress.offsetWidth;
                    this.els.progress.classList.add('open');
                }
            }
            this._setText('phase', this.els.phase, view.phaseLine);
            this._setText('counters', this.els.counters, view.counterLine);
            if (this.lastApplied.quip !== view.quip && this.els.quip) {
                this.els.quip.classList.remove('quip-in');
                void this.els.quip.offsetWidth; // restart the fade-rise
                this.els.quip.classList.add('quip-in');
            }
            this._setText('quip', this.els.quip, view.quip);
            const pctKey = `pct:${view.determinate ? view.pct : 'ind'}`;
            if (this.lastApplied.pct !== pctKey && this.els.bar) {
                this.lastApplied.pct = pctKey;
                this.els.bar.classList.toggle('indeterminate', !view.determinate);
                this.els.bar.setAttribute('aria-valuenow', String(view.pct));
                // Indeterminate mode is class-driven; a stale inline width
                // would pin the sliding thumb.
                if (this.els.fill) this.els.fill.style.width = view.determinate ? `${view.pct}%` : '';
            }
        }
        this.lastApplied.phase = phase;
    }

    // Hero reset with optional custom copy (used by GPU context recovery).
    showLoading({ main = 'Good code loads fast.', sub = 'Fetching high-res bestagons…' } = {}) {
        if (!this.root) return;
        this.root.style.display = 'flex';
        this.root.classList.remove('hide', 'fatal');
        if (this.els.retry) this.els.retry.hidden = true;
        this._setText('main', this.els.main, main);
        this._setText('fetching', this.els.fetching, sub);
        this._ensureTimer();
        this.render();
    }

    showFatal({ title, message, detail = '', onRetry = null }) {
        this.model.fatal({ title, message, detail });
        if (!this.root) return;
        this.root.style.display = 'flex';
        this.root.classList.remove('hide');
        if (this.els.retry) {
            this.els.retry.hidden = false;
            this.els.retry.onclick = onRetry;
        }
        this.render();
    }

    hide() {
        this.model.hide();
        this._stopTimer();
        if (!this.root) return;
        this.root.classList.add('hide');
        setTimeout(() => { this.root.style.display = 'none'; }, 600);
    }

    // Full reset for a user retry: fresh hero clock, fresh counters.
    reset() {
        this._stopTimer();
        this.model.start(this.now());
        this.lastApplied = {};
        if (this.root) {
            this.root.classList.remove('phase-progress', 'fatal');
            if (this.els.progress) {
                this.els.progress.classList.remove('open');
                this.els.progress.hidden = true;
            }
            if (this.els.fill) this.els.fill.style.width = '0%';
        }
        this._ensureTimer();
    }

    // --- Event proxies (model + render) -------------------------------------
    manifestStarted() { this.model.manifestStarted(); this.render(); }
    manifestLoaded(bytes) { this.model.manifestLoaded(bytes); this.render(); }
    terrainPlanned(count) { this.model.terrainPlanned(count); this.render(); }
    terrainDone(bytes) { this.model.terrainDone(bytes); this.render(); }
    texturePlanned(count, tier) { this.model.texturePlanned(count, tier); this.render(); }
    textureDone(bytes, tier) { this.model.textureDone(bytes, tier); this.render(); }
    retryScheduled(info) { this.model.retryScheduled(info, this.now()); this.render(); }
    setOffline(flag) { this.model.setOffline(flag); this.render(); }
}
