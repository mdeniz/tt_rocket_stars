# Design

## Achievement evaluator

`src/lib/react-achievements.ts` exposes a pure evaluator that accepts the
pilot-local fact statistics and mission history. It returns stable achievement
records with localization keys supplied by the React caller. The evaluator
preserves the legacy achievement thresholds and fails closed for malformed
payloads.

## Ownership boundary

When `reactCoreScreens` is enabled, the React achievements panel reads the
existing pilot-local storage through the typed persistence boundary, evaluates
the records, and owns rendering and refresh. It must not query legacy DOM or
call legacy achievement refresh actions. When the flag is disabled, the
existing legacy renderer remains unchanged.

## Safety

No storage key migration, network request, or administrative credential is
introduced. Existing local progress remains authoritative and available
offline.
