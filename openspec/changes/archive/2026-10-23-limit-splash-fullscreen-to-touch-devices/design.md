# Design

## Context

Splash entry is implemented in `public/legacy/scripts/06.js` and currently invokes `document.documentElement.requestFullscreen` for every browser. The manual drawer control is implemented separately in the legacy mission script and must remain unchanged.

## Goals / Non-Goals

**Goals:**

- Classify automatic fullscreen eligibility from input/device capabilities.
- Keep entry synchronous and non-blocking when the browser rejects fullscreen.
- Verify desktop and touch paths with deterministic browser tests.

**Non-Goals:**

- Replacing the legacy script architecture.
- Changing manual fullscreen controls.
- Claiming Playwright emulation is equivalent to real iOS Safari validation.

## Decisions

- Use `navigator.maxTouchPoints > 0` or a coarse-pointer media query. This avoids viewport-width heuristics, which misclassify resized desktop windows.
- Keep the existing guarded request and promise rejection handling. Fullscreen is an enhancement and must not be a prerequisite for dashboard initialization.
- Stub fullscreen in E2E tests so assertions cover the routing decision without depending on browser permission or platform behavior. Real-device iOS validation remains a release acceptance check.

## Risks / Trade-offs

- [Risk] Some hybrid devices expose touch capability on a desktop-like browser. → Mitigation: treat capability exposure as the documented product heuristic and preserve manual control.
- [Risk] Browser emulation cannot reproduce all iOS Safari fullscreen restrictions. → Mitigation: document the limitation and keep the request failure path non-blocking.

## Migration Plan

Deploy the guarded splash behavior with the existing static bundle. Roll back by reverting the splash guard and its tests; no persisted data or migration is involved.
