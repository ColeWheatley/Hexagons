// @atlas: CSS for widgets that did not exist before the dev/consumer split —
// the PERF section internals, the state chip, the VRAM bar, and the
// benchmark launcher. Everything that already existed (hud-item,
// collapsible-*, console-*, frametime-item, .value, ...) stays in style.css
// untouched; this string is injected as <style id="dev-styles"> on attach()
// and removed wholesale on dispose().

export const DEV_STYLES = `
.dev-chip {
    display: inline-block;
    padding: 2px 9px;
    border-radius: 10px;
    font-size: 0.65rem;
    font-weight: 700;
    font-family: monospace;
    letter-spacing: 0.03em;
    color: #111;
    background: #808a93;
}

.dev-bar-track {
    width: 100%;
    height: 4px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 2px;
    margin-top: 4px;
    overflow: hidden;
}

.dev-bar-fill {
    height: 100%;
    width: 0%;
    background: #74b9ff;
    transition: width 0.3s ease-out, background 0.3s ease-out;
}

.dev-bench-btn-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 5px;
}

.bench-btn,
.bench-action-btn {
    background: rgba(116, 185, 255, 0.12);
    border: 1px solid rgba(116, 185, 255, 0.4);
    color: #74b9ff;
    font: 700 10px/1 'Outfit', monospace;
    padding: 6px 10px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

.bench-btn:hover,
.bench-action-btn:hover {
    background: rgba(116, 185, 255, 0.28);
    color: #fff;
}

.bench-btn:active,
.bench-action-btn:active {
    transform: translateY(1px);
}

.bench-action-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.dev-bench-duration-row {
    margin-top: 10px;
    align-items: center;
}

.dev-bench-duration {
    width: 90px;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 4px;
    color: #fff;
    font: 11px monospace;
    padding: 3px 6px;
}

.dev-bench-note {
    font-size: 10px;
    line-height: 1.4;
    color: #aaa;
    margin-top: 8px;
}

.dev-bench-actions-row {
    display: flex;
    gap: 6px;
    margin-top: 10px;
}

.dev-bench-summary {
    font-size: 10px;
    font-family: monospace;
    color: #ccc;
    margin-top: 8px;
}

.dev-bench-crash-notice {
    margin-top: 8px;
    padding: 6px 8px;
    border-radius: 6px;
    background: rgba(243, 156, 18, 0.15);
    border: 1px solid rgba(243, 156, 18, 0.4);
    color: #f39c12;
    font-size: 10px;
    line-height: 1.4;
}
`;
