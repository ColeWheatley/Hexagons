const TYPING_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

export function isTypingTarget(target) {
    if (!target) return false;
    if (target.isContentEditable) return true;
    return TYPING_TAGS.has(String(target.tagName || '').toUpperCase());
}

export function resolveNavigationKey(event) {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) {
        return null;
    }
    const key = String(event.key || '').toLowerCase();
    if (key === 'w' || key === 'arrowup') return 'pan-forward';
    if (key === 's' || key === 'arrowdown') return 'pan-back';
    if (key === 'a' || key === 'arrowleft') return 'pan-left';
    if (key === 'd' || key === 'arrowright') return 'pan-right';
    if (key === '+' || key === '=' || key === 'add') return 'zoom-in';
    if (key === '-' || key === '_' || key === 'subtract') return 'zoom-out';
    if (key === 'home' || key === '0') return 'reset';
    return null;
}

export function normalizedWheelPixels(event, pageHeight = 800) {
    const multiplier = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? pageHeight : 1;
    return event.deltaY * multiplier;
}

export function isMacDesktopNavigator(navigatorLike) {
    return /mac/i.test(navigatorLike?.platform || '') && (navigatorLike?.maxTouchPoints || 0) < 2;
}

export function supportsDesktopGestureEvents(windowLike, navigatorLike) {
    return isMacDesktopNavigator(navigatorLike) && typeof windowLike?.GestureEvent === 'function';
}

export function shouldHandleNormalizedPinch(event, navigatorLike) {
    return isMacDesktopNavigator(navigatorLike) && event.ctrlKey === true;
}

export function commitIfChanged(changed, commit) {
    if (!changed) return false;
    commit();
    return true;
}
