// @atlas: Floating texture-tier badge — ported verbatim from the old
// `_updateTexBadge` rendering half (element creation, dataset/aria updates,
// signature dedup). The milestone/bootstrap logic that used to live in the
// same method (`_finishTextureBootstrapPhase`, the `firstTexture` /
// `visibleTexturedCoverage` profiler milestones) stays in the engine as
// `_updateTextureMilestones()` — it must keep running in consumer mode too,
// so it is intentionally NOT duplicated here.

import {
    TEXTURE_HUD_ROWS,
    collectDisplayedTexturePages,
    collectTextureTierResidency,
} from '../texture_hud_telemetry.js';

export class TexBadge {
    constructor(viewer) {
        this.viewer = viewer;
        this._el = null;
        this._rows = null;
        this._signature = null;
    }

    refresh() {
        const viewer = this.viewer;

        if (!this._el) {
            const el = document.createElement('div');
            el.id = 'tex-debug-badge';
            el.style.cssText = [
                'position:fixed',
                'bottom:max(8px,env(safe-area-inset-bottom))',
                'left:max(8px,env(safe-area-inset-left))',
                'max-width:calc(100vw - 16px)',
                'background:rgba(7,20,34,0.82)',
                "font:10px/1.35 'Courier New',monospace",
                'font-variant-numeric:tabular-nums',
                'padding:5px 7px', 'border-radius:6px',
                'border:1px solid rgba(151,193,224,0.24)',
                'box-shadow:0 2px 10px rgba(0,0,0,0.2)',
                'z-index:9999', 'pointer-events:none', 'white-space:nowrap',
                'display:grid', 'gap:2px',
            ].join(';');
            const rowElements = new Map();
            for (const rowSpec of TEXTURE_HUD_ROWS) {
                const row = document.createElement('div');
                row.className = 'tex-debug-row';
                row.dataset.tier = rowSpec.tier;
                row.dataset.sizePx = String(rowSpec.size);
                row.style.cssText = [
                    'display:grid', 'grid-template-columns:7px 68px auto',
                    'align-items:center', 'column-gap:5px',
                ].join(';');

                const swatch = document.createElement('span');
                swatch.dataset.role = 'tier-swatch';
                swatch.style.cssText = [
                    'display:block', 'width:6px', 'height:6px', 'border-radius:50%',
                    `background:${rowSpec.color}`, `box-shadow:0 0 5px ${rowSpec.color}`,
                ].join(';');

                const label = document.createElement('span');
                label.dataset.role = 'tier-label';
                label.style.cssText = `color:${rowSpec.color};font-weight:700`;
                label.textContent = `${rowSpec.label} ${rowSpec.size}px`;

                const metrics = document.createElement('span');
                metrics.dataset.role = 'tier-metrics';
                metrics.style.color = '#d7e6f2';

                row.append(swatch, label, metrics);
                el.appendChild(row);
                rowElements.set(rowSpec.tier, { row, metrics });
            }
            document.body.appendChild(el);
            this._el = el;
            this._rows = rowElements;
        }

        const displayed = collectDisplayedTexturePages(viewer.tiles, viewer.visibilityByKey);
        const residency = collectTextureTierResidency(viewer.textureStates);
        const snapshot = TEXTURE_HUD_ROWS.map(({ tier }) => ({
            tier,
            displayed: displayed[tier].size,
            loaded: residency.loaded[tier],
            pending: residency.pending[tier],
            failed: residency.failed[tier],
        }));
        const signature = JSON.stringify([viewer.texStats?.formatKey, snapshot]);
        if (signature === this._signature) return;
        this._signature = signature;

        for (const counts of snapshot) {
            const { row, metrics } = this._rows.get(counts.tier);
            row.dataset.displayed = String(counts.displayed);
            row.dataset.loaded = String(counts.loaded);
            row.dataset.pending = String(counts.pending);
            row.dataset.failed = String(counts.failed);
            metrics.textContent =
                `displayed ${counts.displayed} · loaded ${counts.loaded} · q/inflight ${counts.pending} · fail ${counts.failed}`;
            metrics.style.color = counts.failed > 0 ? '#ff9c9c' : '#d7e6f2';
        }
        const format = viewer.texStats?.formatKey || 'loading';
        this._el.dataset.format = format;
        this._el.title = `Texture pages · ${format}`;
        this._el.setAttribute(
            'aria-label',
            `Texture pages ${format}. ${snapshot.map(counts =>
                `${counts.tier}: ${counts.displayed} displayed, ${counts.loaded} loaded, ${counts.pending} queued or inflight, ${counts.failed} failed`
            ).join('. ')}`,
        );
    }

    dispose() {
        this._el?.remove();
        this._el = null;
        this._rows = null;
        this._signature = null;
    }
}
