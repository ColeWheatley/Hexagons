// @atlas: Pure dev-mode toggle policy — no DOM/window references, so this is
// directly node --test importable. `dev_entry.js` is the only caller; it
// supplies location.search / localStorage and applies the `persist` result.

export const DEV_MODE_STORAGE_KEY = 'hexagons:devMode';

const ON_VALUES = new Set(['1', 'true', 'on']);
const OFF_VALUES = new Set(['0', 'false', 'off']);

/**
 * Resolve whether dev mode is enabled from the URL and any previously
 * persisted choice.
 *
 * Precedence:
 *   1. `?dev=1|true|on`  -> enabled, persist '1'
 *   2. `?dev=0|false|off` -> disabled, persist '0'
 *   3. any other/absent `dev` param -> enabled iff stored === '1', no persist
 *
 * @param {string} search - location.search-style query string (with or
 *   without the leading '?').
 * @param {string|null} stored - the raw localStorage value, or null.
 * @returns {{ enabled: boolean, persist: '1'|'0'|null }}
 */
export function resolveDevMode(search, stored) {
    const params = new URLSearchParams(search || '');
    const raw = params.get('dev');
    if (raw !== null) {
        const normalized = raw.toLowerCase();
        if (ON_VALUES.has(normalized)) return { enabled: true, persist: '1' };
        if (OFF_VALUES.has(normalized)) return { enabled: false, persist: '0' };
    }
    return { enabled: stored === '1', persist: null };
}

/** Backquote, no modifiers — the runtime dev-mode toggle hotkey. */
export function isDevToggleKey(event) {
    if (!event) return false;
    return event.code === 'Backquote'
        && !event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey;
}

/** True when the hotkey should be swallowed by focused editable UI (e.g. the search box). */
export function shouldIgnoreToggleTarget(target) {
    if (!target) return false;
    if (target.isContentEditable) return true;
    const tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}
