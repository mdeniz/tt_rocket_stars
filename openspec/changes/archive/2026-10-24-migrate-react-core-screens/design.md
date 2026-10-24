# Design

## Context

See proposal.md and the react-core-screens specification. The legacy runtime currently owns the visible dashboard, mission setup, gameplay, progress, garage, and achievements DOM through ordered scripts. React already owns the splash, pilot selector, and settings navigation through explicit adapters.

## Goals / Non-Goals

**Goals:**

- Establish one typed adapter boundary for core-screen navigation and legacy actions.
- Let React own screen-level composition incrementally without duplicating gameplay or persistence state.
- Preserve stable IDs, local storage keys, backups, translations, touch behavior, keyboard behavior, and offline operation.
- Make each screen slice independently testable and reversible.

**Non-Goals:**

- Rewriting the mission engine, timers, audio engine, rocket catalog, or achievement calculations.
- Changing localStorage/sessionStorage schemas, cloud sync, authentication, or network behavior.
- Removing legacy markup before dependent scripts and E2E coverage are retired.

## Decisions

1. Use the existing React root and a single screen bridge. This avoids competing React trees and keeps ownership transitions explicit.
2. Delegate stateful actions to narrow adapters that call existing legacy functions or refresh existing DOM. React will not maintain a second copy of mission, coin, rocket, or achievement state.
3. Preserve legacy screen IDs and mount React-owned controls around stable legacy content until a slice has equivalent E2E coverage.
4. Keep feature-flagged ownership opt-in during development. The legacy screen remains the default fallback when the flag is disabled or an adapter is unavailable.
5. Add focused tests at the adapter boundary, then browser tests for navigation and user-visible actions. Full cross-browser and build checks remain required before delivery.

## Risks / Trade-offs

- [Risk] Two navigation handlers respond to one gesture. → React intercepts only its owned controls and delegates one normalized action.
- [Risk] Legacy scripts retain references to moved nodes. → Use portals and stable hosts before removing or relocating legacy nodes.
- [Risk] A partial migration hides a behavior regression. → Keep the legacy fallback and require screen-specific E2E coverage before changing ownership.
- [Risk] Large legacy markup makes visual parity expensive. → Migrate ownership in slices and reuse existing assets/styles until each slice is stable.

## Migration Plan

1. Add the OpenSpec contract and typed screen adapter interfaces.
2. Add React screen bridge and dashboard/progress navigation coverage.
3. Add mission setup boundary coverage without replacing gameplay runtime.
4. Add garage and achievements adapters with persistence and action coverage.
5. Enable the feature flag for verified surfaces, run full checks, and retain the legacy fallback.
6. Remove superseded legacy markup only in a later change after all consumers are migrated.

## Rollback

Disable the core-screen feature flag or stop mounting the React bridge. Existing legacy navigation and screens remain available, with no data migration or rollback operation required.

