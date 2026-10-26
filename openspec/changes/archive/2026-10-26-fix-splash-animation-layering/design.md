# Design

## Context

`ReactShell` currently derives visibility from `#launchSplash`, hides that element during mount, and renders `#reactLaunchSplash` as a full-screen overlay. The legacy splash contains the animated launch scene and already owns the click-to-enter adapter. See `proposal.md` and the `react-application-shell` delta for the required behavior.

## Goals / Non-Goals

**Goals:**

- Preserve the existing legacy animation as the first visible splash.
- Keep the React splash available when the legacy scene is not present.
- Avoid changing entry gestures, fullscreen handling, storage, or stable release output.
- Cover the layering contract with an automated browser test.

**Non-Goals:**

- Rewriting the legacy animation in React.
- Changing the splash artwork, timing, or audio behavior.
- Changing production release selection or cloud access.

## Decisions

- **Legacy-first visibility:** Do not hide `#launchSplash` from the React mount effect when it exists. This is the smallest fix because the legacy scene already has the tested entry adapter and animation lifecycle.
- **Conditional React fallback:** Render the React splash only when the legacy splash is absent. This avoids two competing full-screen entry controls and keeps a usable React path for host pages that omit the legacy DOM.
- **Regression at the DOM boundary:** Assert that a normal development page has a visible legacy splash and no visible React overlay before entry. Verify computed visibility, stacking order, and screenshots in the running development build.

## Risks / Trade-offs

- [Risk] Legacy and React entry code may both react to the same pointer event → Keep the React fallback unmounted in the normal legacy path and retain the existing legacy adapter as the only entry listener.
- [Risk] A future shell migration may remove the legacy DOM → Keep the fallback branch explicit and covered by a unit-level render condition.
- [Risk] The animation may still be visually hidden by unrelated styles → Verify computed visibility, stacking order, and screenshots in the running development build.

## Migration Plan

1. Add the regression test and update the shell visibility decision.
2. Run unit, build, and splash-focused browser checks.
3. Verify the running `index_next.html` experience and record URL, action, visible splash, and console/network evidence.
4. Roll back by reverting the shell visibility change if entry behavior regresses; no data migration is required.
