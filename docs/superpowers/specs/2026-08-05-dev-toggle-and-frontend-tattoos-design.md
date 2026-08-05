# Dev-mode pill toggle + frontend texture tattoos — design

Date: 2026-08-05. Follows `2026-07-26-dev-mode-split-design.md`, which
established the dev/consumer split and its governing rule: **release mode says
what the app is; dev mode says what the operator sees.**

## Problem

Two leftovers from before the split:

1. Dev mode has no visible affordance. It is reachable only via `?dev=1`, a
   persisted localStorage value, or an undiscoverable Backquote hotkey.
2. The green/blue/pink/yellow texture tier markers ("tattoos") are **painted
   into the texture pixels at bake time**. `waffle_iron.py:188` states they
   "default on only for mini-bakes and cannot enter a full bake", and the flag
   feeds `texture_page_cache_version()`. So the markers are part of the
   artifact: Stubai-with-tattoos and Tirol-without are physically different
   bakes, and flipping the flag invalidates the whole texture cache.

Item 2 is a direct violation of the split's rule. Tier markers are purely
"what the operator sees", yet they are welded into "what the app is".

## Phase 1 — dev-mode pill toggle

A pill toggle in the consumer shell (`index.html`), under the existing Gradient
toggle and reusing its `.pill-toggle` markup idiom.

It lives in the shell, not the dev panel, because it must be visible while dev
mode is **off** — it is the one non-consumer affordance in the product UI.

Dev mode has one state and now three entry points (`?dev=1`, Backquote,
the pill). The pill therefore *subscribes* rather than tracking its own
boolean: a hotkey press must move the pill. `dev_entry.js` grows
`setDevMode()` and `onDevModeChange()` over a single `applyDevMode()` mutation
path; `onDevModeChange` fires immediately on subscribe so the UI can seed
itself.

The pill carries `data-ux-gate-exempt`. The UX gate runs with `?dev=1` and
asserts against dev-panel controls such as `#copy-log-btn`; exercising the
pill mid-run would dispose the very DOM the gate is checking. This is the
documented purpose of the attribute.

## Phase 2 — frontend tattoos

Delete the bake-time tattoo path **entirely** and redraw the markers in JS,
dev-mode only, with a labelled legend.

Colors carry over unchanged from `waffle_iron.py:119`:

| color | tier | format |
|---|---|---|
| yellow `255,220,0` | bootstrap | 64px WebP, transient first paint |
| green `0,255,48` | low | postage, xuastc |
| blue `0,96,255` | medium | xuastc |
| pink `255,0,170` | high | xuastc |

These are the same four states the residency planner already tracks by name
(see `tests/gosper/test_texture_residency.mjs`), so the frontend already knows
what each marker should say.

What this buys:

- One bake. Stubai stops being a distinct texture recipe and becomes purely a
  coverage/extent choice.
- Markers reflect **live** residency, not bake-time state — an evicted and
  refetched page shows its true current tier, which a baked tattoo cannot.
- Dev mode works over production Tirol data, impossible today.
- Toggling markers no longer invalidates the texture cache.

### Known wrinkle

Already-baked Stubai pages have tattoos physically in their pixels. Deleting
the backend code does not un-bake them, so until those pages are rebaked a JS
overlay draws *on top of* baked marks. This affects verification of Phase 2
only; Phase 1 is unaffected.

## Sequencing

Ship separately. Phase 1 is self-contained UI wiring. Phase 2 touches the tile
material, the bake pipeline, the texture recipe version, and their tests — a
different order of magnitude.
