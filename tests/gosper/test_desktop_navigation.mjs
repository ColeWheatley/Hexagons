import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../../frontend/app/desktop_navigation.js', import.meta.url), 'utf8');
const main = await readFile(new URL('../../frontend/app/main.js', import.meta.url), 'utf8');
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const {
    commitIfChanged,
    isMacDesktopNavigator,
    isTypingTarget,
    normalizedWheelPixels,
    resolveNavigationKey,
    shouldHandleNormalizedPinch,
    supportsDesktopGestureEvents,
} = await import(moduleUrl);

const key = (value, target = null, extra = {}) => ({
    key: value, target, defaultPrevented: false, metaKey: false, ctrlKey: false, altKey: false, ...extra,
});

assert.equal(resolveNavigationKey(key('w')), 'pan-forward');
assert.equal(resolveNavigationKey(key('ArrowLeft')), 'pan-left');
assert.equal(resolveNavigationKey(key('+')), 'zoom-in');
assert.equal(resolveNavigationKey(key('-')), 'zoom-out');
assert.equal(resolveNavigationKey(key('Home')), 'reset');
assert.equal(resolveNavigationKey(key('0')), 'reset');
assert.equal(resolveNavigationKey(key('x')), null);

assert.equal(isTypingTarget({ tagName: 'input' }), true);
assert.equal(isTypingTarget({ tagName: 'DIV', isContentEditable: true }), true);
assert.equal(resolveNavigationKey(key('w', { tagName: 'TEXTAREA' })), null);
assert.equal(resolveNavigationKey(key('w', null, { metaKey: true })), null);

assert.equal(normalizedWheelPixels({ deltaY: 2, deltaMode: 0 }), 2);
assert.equal(normalizedWheelPixels({ deltaY: 2, deltaMode: 1 }), 32);
assert.equal(normalizedWheelPixels({ deltaY: 2, deltaMode: 2 }, 700), 1400);

const mac = { platform: 'MacIntel', maxTouchPoints: 0 };
const ipad = { platform: 'MacIntel', maxTouchPoints: 5 };
assert.equal(isMacDesktopNavigator(mac), true);
assert.equal(isMacDesktopNavigator(ipad), false);
assert.equal(shouldHandleNormalizedPinch({ ctrlKey: true }, mac), true);
assert.equal(shouldHandleNormalizedPinch({ ctrlKey: false }, mac), false);
assert.equal(supportsDesktopGestureEvents({ GestureEvent: function GestureEvent() {} }, mac), true);
assert.equal(supportsDesktopGestureEvents({}, mac), false); // Chrome/Firefox wheel fallback
assert.equal(supportsDesktopGestureEvents({ GestureEvent: function GestureEvent() {} }, ipad), false);

let commits = 0;
assert.equal(commitIfChanged(false, () => { commits++; }), false);
assert.equal(commitIfChanged(true, () => { commits++; }), true);
assert.equal(commits, 1, 'only a changed camera pose commits URL/persistence state');

assert.match(main, /initDesktopNavigation\(\)[\s\S]*?window\.addEventListener\('keydown'/,
    'real viewer installs deterministic keyboard navigation');
assert.match(main, /resolveNavigationKey\(event\)[\s\S]*?event\.preventDefault\(\)/,
    'handled navigation keys prevent browser scrolling');
assert.match(main, /viewState\?\.commitViewChange\(\)/,
    'changed keyboard/gesture poses persist and update the share URL');
assert.match(main, /shouldHandleNormalizedPinch\(event, navigator\)/,
    'macOS ctrl-wheel pinch is canvas-scoped');
assert.match(main, /supportsDesktopGestureEvents\(window, navigator\)[\s\S]*?gesturechange/,
    'twist is feature-detected and only registered where GestureEvent exists');

console.log('desktop navigation tests passed');
