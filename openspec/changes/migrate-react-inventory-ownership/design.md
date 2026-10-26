# Design

## Context

The React garage currently renders migrated controls but routes inventory operations through `createInventoryAdapter`, which delegates to legacy globals. The legacy garage payload and its `tt-rocket-garage-v1` storage key remain the compatibility contract. The React feature flag is disabled by default, and cloud synchronization must remain outside this local-first slice.

## Goals / Non-Goals

**Goals:**

- Make the flag-enabled React garage consume a typed inventory coordinator.
- Preserve the existing garage payload, pilot isolation, backup envelopes, offline behavior, and fail-closed semantics.
- Keep the legacy adapter and runtime available for rollback.
- Verify behavior with unit tests, browser tests, and Chrome DevTools evidence.

**Non-Goals:**

- Removing legacy garage globals or enabling the feature flag in the published release.
- Changing the garage data model, storage keys, cloud schema, authentication, or dependency set.
- Claiming equivalence with real iOS Safari.

## Decisions

### Use the existing garage payload as the source contract

The coordinator will validate and update the existing garage state associated with the active pilot. This preserves backup compatibility and unknown future fields. Introducing a second React-only storage key was rejected because it would create divergence and complicate rollback.

### Select the coordinator at the persistence boundary

`installPersistenceBoundary()` will choose the typed coordinator only when `reactCoreScreens` is explicitly enabled; otherwise it will retain the current legacy adapter. Selecting at the boundary keeps React components independent from feature-flag and legacy-global details.

### Preserve validated legacy delegation for fallback

The disabled-flag path will continue using the existing fail-closed adapter. Directly deleting or wrapping legacy globals was rejected because the ordered scripts and inline handlers still depend on them during migration.

### Test mutations through public adapter contracts

Unit tests will cover validation and atomic failure, while Chromium and mobile WebKit tests will cover visible garage behavior, pilot isolation, offline operation, and rollback. Chrome DevTools will verify console and network behavior on the running Vite app.

## Risks / Trade-offs

- [Risk] Legacy payloads may contain fields not understood by the coordinator → Preserve unknown fields and write only validated owned fields.
- [Risk] A failed local write could leave the UI ahead of storage → Capture the prior payload and restore the in-memory view when persistence fails.
- [Risk] The legacy runtime may refresh the garage after a React mutation → Keep the existing compatibility refresh hook and assert the final visible state in E2E.
- [Risk] Feature-flag regressions could affect the published app → Keep the flag disabled by default and retain explicit disabled-flag rollback coverage.

## Migration Plan

1. Add the typed inventory contract and coordinator using the existing garage storage and pilot boundaries.
2. Route flag-enabled persistence through the coordinator while preserving the legacy fallback.
3. Add unit, E2E, WebKit compatibility, and Chrome DevTools verification.
4. Merge the incremental slice with the release flag disabled.
5. Retire legacy inventory ownership only after later parity and release review work is complete.
