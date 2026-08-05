// @atlas: Always-statically-imported dev-mode gate. Resolves the toggle once
// at module load, registers the Backquote hotkey, and lazily dynamic-imports
// the (much larger) dev tooling only when dev mode is actually on. Kept
// deliberately tiny so consumer sessions pay near-zero cost for importing it.

import {
    DEV_MODE_STORAGE_KEY,
    resolveDevMode,
    isDevToggleKey,
    shouldIgnoreToggleTarget,
} from './dev_mode_policy.mjs';

function readStoredDevMode() {
    try {
        return localStorage.getItem(DEV_MODE_STORAGE_KEY);
    } catch (e) {
        return null;
    }
}

function persistDevMode(persist) {
    if (persist === null) return;
    try {
        localStorage.setItem(DEV_MODE_STORAGE_KEY, persist);
    } catch (e) {
        // Private mode / quota — best effort only, never throw from here.
    }
}

const initialPolicy = resolveDevMode(
    typeof location !== 'undefined' ? location.search : '',
    readStoredDevMode(),
);
persistDevMode(initialPolicy.persist);

let devModeEnabled = initialPolicy.enabled;
let attachPromise = null;
let boundViewer = null;
let boundAppVersion = null;
const changeListeners = new Set();

export function isDevModeEnabled() {
    return devModeEnabled;
}

/**
 * Subscribe to dev-mode changes. The listener is called immediately with the
 * current state so UI can seed itself, then on every subsequent change from
 * any source (hotkey, pill toggle, programmatic).
 *
 * @returns {() => void} unsubscribe
 */
export function onDevModeChange(listener) {
    changeListeners.add(listener);
    listener(devModeEnabled);
    return () => changeListeners.delete(listener);
}

/** Single mutation path shared by the hotkey and any UI control. */
function applyDevMode(enabled) {
    if (enabled === devModeEnabled || !boundViewer) return;
    devModeEnabled = enabled;
    persistDevMode(enabled ? '1' : '0');
    if (enabled) {
        lazyAttach(boundViewer, boundAppVersion);
    } else {
        boundViewer.devTools?.dispose();
        boundViewer.devTools = null;
    }
    changeListeners.forEach(listener => listener(enabled));
}

/** Set dev mode from UI. No-op before initDevMode() has bound the viewer. */
export function setDevMode(enabled) {
    applyDevMode(Boolean(enabled));
}

async function lazyAttach(viewer, appVersion) {
    if (viewer.devTools) return;
    if (attachPromise) {
        await attachPromise;
        return;
    }
    attachPromise = import('./dev_tools.js')
        .then(({ DevTools }) => {
            // A dispose() may have raced this import; only attach if still wanted
            // and nothing else has already attached in the meantime.
            if (viewer.devTools || !devModeEnabled) return;
            viewer.devTools = new DevTools(viewer, { appVersion });
            viewer.devTools.attach();
        })
        .finally(() => {
            attachPromise = null;
        });
    await attachPromise;
}

/**
 * Wire the runtime dev-mode hotkey and perform the initial attach if dev mode
 * is already on. Call once, after `viewer` exists.
 */
export function initDevMode(viewer, appVersion) {
    boundViewer = viewer;
    boundAppVersion = appVersion;

    window.addEventListener('keydown', (event) => {
        if (!isDevToggleKey(event) || shouldIgnoreToggleTarget(event.target)) return;
        applyDevMode(!devModeEnabled);
    });

    if (devModeEnabled) {
        lazyAttach(viewer, appVersion);
    }
}
