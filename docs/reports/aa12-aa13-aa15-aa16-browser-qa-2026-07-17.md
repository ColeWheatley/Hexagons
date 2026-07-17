# AA-12 / AA-13 / AA-15 / AA-16 browser QA

Date: 2026-07-17  
Build: `main.95451fbb333c.js` from `codex/goal-completion`  
Harness: `scripts/run_ux_browser_gate.py` against the complete tattoo-3 asset corpus

The acceptance run used a fresh headless-Chrome profile and the built,
asset-backed viewer. It drove the UI through Chrome DevTools Protocol keyboard
events, real reloads, and real application recovery rather than calling the
acceptance policy with a synthetic success fixture.

## Results

| Gate | Live evidence | Result |
| --- | --- | --- |
| AA-12 first-search responsiveness | cold compact-index path returned two rows; zero long tasks; keyboard selection in 65.9 ms | pass |
| AA-13 controls | all 12 expected visible/exception-path controls changed observable state; no uncovered controls | pass |
| AA-13 HUD truth | 20/20 settled samples read `FPS: IDLE`; every live field was populated; no placeholders | pass |
| AA-13 fatal Retry | button became visible, cleared fatal state, hid immediately, and entered `booting` | pass |
| AA-15 local restore | stored envelope survived a URL-free reload; maximum six-component pose delta 0.0003865 | pass |
| AA-15 URL precedence | conflicting local pose was ignored for the explicit shared URL; maximum pose delta 0.0001471 | pass |
| AA-15 search URL update | keyboard-selected Habicht changed camera and URL in 65.9 ms | pass |
| AA-16 keyboard flow | Tab reached search; typed query, ArrowDown, and Enter selected Habicht; map keys were isolated while typing | pass |
| AA-16 reduced motion | media query matched; animation duration `0.00001 s`, one iteration | pass |
| AA-16 axe | zero serious/critical violations | pass |

The strict run exposed and fixed two real defects before passing:

- STATIC maintenance renders were shown as an active numeric FPS. STATIC now
  always reports `FPS: IDLE`, while moving/refining states retain measured FPS.
- persisted points store vertical coordinates as `sceneY_m`, while the shared
  GPS-to-scene converter previously read only URL-shaped `sceneY`. The converter
  now accepts both schema names, and the two live reload paths prove the fix.

COPY LINK now uses the viewer clipboard abstraction, matching the status-log
control and allowing the normal clipboard fallback to remain testable. The
search long-task observer stops when results become available, before the
separate terrain work caused by selecting a result.

The ignored raw browser artifact is
`artifacts/release-browser-20260717-r3/ux-browser-v3.json`; all eight named
acceptance checks and its aggregate `passed` field are true. Deterministic
contracts also pass for the 50-query/82-KB-gzip search index, persisted schema,
HUD source truth, UI semantics, desktop navigation, and touch allocation.
