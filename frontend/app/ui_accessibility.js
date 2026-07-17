/**
 * DOM state helpers for the HUD's disclosure controls.  Keeping semantic
 * state and visual state together prevents a collapsed panel from retaining
 * focusable descendants.
 */
export function setDisclosure(button, content, expanded) {
    const isExpanded = Boolean(expanded);
    button.setAttribute('aria-expanded', String(isExpanded));
    content.hidden = !isExpanded;
    content.setAttribute('aria-hidden', String(!isExpanded));
}

export function toggleDisclosure(button, content) {
    const expanded = button.getAttribute('aria-expanded') !== 'true';
    setDisclosure(button, content, expanded);
    return expanded;
}

export function setPanelMinimized(panel, button, body, minimized) {
    const isMinimized = Boolean(minimized);
    panel.classList.toggle('minimized', isMinimized);
    body.hidden = isMinimized;
    body.setAttribute('aria-hidden', String(isMinimized));
    button.setAttribute('aria-expanded', String(!isMinimized));
    button.setAttribute('aria-label', isMinimized ? 'Expand controls panel' : 'Minimize controls panel');
    button.title = isMinimized ? 'Expand controls panel' : 'Minimize controls panel';
    button.textContent = isMinimized ? '+' : '−';
}

export function setPressedButton(button, pressed) {
    button.setAttribute('aria-pressed', String(Boolean(pressed)));
}
