// @atlas: Upgraded frametime graph — same 0-50ms scale and 16.67/33.33ms
// gridlines as the old `updateFrametimeGraph`, plus: per-sample color by
// engine state, devicePixelRatio-aware canvas sizing, and a live p50/p95
// overlay. History is kept unbounded-ish (capped well above any plausible
// canvas width) and only the trailing `canvas CSS width`-worth of samples is
// drawn/measured each frame, so the visible window naturally tracks resizes.

export const ENGINE_STATE_COLORS = Object.freeze({
    MOVING_2D: '#74b9ff',
    MOVING_3D: '#a29bfe',
    SINTERING: '#ffeaa7',
    STATIC: '#808a93',
});

const SCALE_MS = 50;
const MAX_HISTORY = 4096;
const FALLBACK_WIDTH = 640;
const FALLBACK_HEIGHT = 80;

function percentile(sortedAsc, p) {
    const n = sortedAsc.length;
    if (!n) return 0;
    const idx = Math.min(n - 1, Math.max(0, Math.floor(p * n)));
    return sortedAsc[idx];
}

export class FrametimeGraph {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas ? canvas.getContext('2d') : null;
        this.history = [];
    }

    push(dt, state) {
        this.history.push({ dt: Number.isFinite(dt) ? dt : 0, state });
        if (this.history.length > MAX_HISTORY) this.history.shift();
    }

    draw() {
        const canvas = this.canvas;
        const ctx = this.ctx;
        if (!canvas || !ctx) return;

        const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
        const cssWidth = Math.max(1, Math.round(canvas.clientWidth || canvas.width || FALLBACK_WIDTH));
        const cssHeight = Math.max(1, Math.round(canvas.clientHeight || canvas.height || FALLBACK_HEIGHT));
        const pixelWidth = Math.round(cssWidth * dpr);
        const pixelHeight = Math.round(cssHeight * dpr);
        if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
            canvas.width = pixelWidth;
            canvas.height = pixelHeight;
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const width = cssWidth;
        const height = cssHeight;
        const samples = this.history.slice(-width);

        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        const y60 = height - (16.67 / SCALE_MS) * height;
        ctx.beginPath();
        ctx.moveTo(0, y60);
        ctx.lineTo(width, y60);
        ctx.stroke();
        const y30 = height - (33.33 / SCALE_MS) * height;
        ctx.beginPath();
        ctx.moveTo(0, y30);
        ctx.lineTo(width, y30);
        ctx.stroke();

        const offset = width - samples.length;
        for (let i = 0; i < samples.length; i++) {
            const { dt, state } = samples[i];
            const ft = Math.min(dt, SCALE_MS);
            const barHeight = (ft / SCALE_MS) * height;
            ctx.fillStyle = ENGINE_STATE_COLORS[state] || '#74b9ff';
            ctx.fillRect(offset + i, height - barHeight, 1, barHeight);
        }

        ctx.fillStyle = '#666';
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('16.67ms (60fps)', 5, Math.max(9, y60 - 3));
        ctx.fillText('33.33ms (30fps)', 5, Math.max(9, y30 - 3));

        const sortedDts = samples.map(s => s.dt).sort((a, b) => a - b);
        const p50 = percentile(sortedDts, 0.5);
        const p95 = percentile(sortedDts, 0.95);
        ctx.fillStyle = '#d7e6f2';
        ctx.font = '10px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`p50 ${p50.toFixed(1)} · p95 ${p95.toFixed(1)} ms`, width - 5, 12);
        ctx.textAlign = 'left';
    }
}
