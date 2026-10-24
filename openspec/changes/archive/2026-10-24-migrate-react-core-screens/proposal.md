# Proposal

## Why

The React shell now owns entry, pilot selection, and settings navigation, but the core gameplay-facing screens still depend on large legacy globals and untyped DOM handlers. This makes the next migration step difficult to test and increases the risk of breaking offline progress, gameplay timing, audio, rocket customization, or achievements.

## What Changes

- Add a React-owned compatibility boundary for dashboard, progress history, mission setup, garage, and achievements.
- Preserve the existing legacy DOM identifiers and global handlers while each surface is migrated incrementally.
- Delegate gameplay, persistence, audio, rocket purchases, and achievement calculations through explicit adapters.
- Add localized screen copy and focused unit and E2E coverage for touch, keyboard, offline, and pilot-local behavior.
- Keep the migration reversible through the existing feature-flag and legacy fallback paths.

## Capabilities

### New Capabilities

- `react-core-screens`: Provides accessible, offline-compatible React ownership for the core game screens while preserving the existing gameplay and persistence contracts.

### Modified Capabilities

- None.

## Impact

Affected areas include the React shell and adapter layer, localized strings and legacy screen integration, browser styles, unit/E2E tests, and the new OpenSpec capability. No backend, storage key, dependency, or network contract changes are required.

