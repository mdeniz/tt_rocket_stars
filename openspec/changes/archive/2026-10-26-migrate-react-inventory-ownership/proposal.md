# Proposal

## Why

The flag-enabled React garage still delegates all inventory reads and mutations to legacy globals. This leaves the migrated screen with a second source of truth and prevents the React ownership migration from being completed safely. The next incremental slice should make the typed inventory boundary authoritative while preserving the existing garage storage, backups, offline behavior, and disabled-flag rollback.

## What Changes

- Add a typed React inventory coordinator for pilot-local rocket state, including category reads, preview, purchase, equip, and refresh operations.
- Preserve the existing `tt-rocket-garage-v1` payload and coin/equipment compatibility without renaming or deleting storage keys.
- Route flag-enabled React garage actions through the coordinator and keep the legacy adapter as the disabled-flag fallback.
- Reject malformed or unsupported inventory operations without changing local state.
- Add unit, E2E, and Chrome DevTools verification for pilot isolation, offline behavior, backup compatibility, rollback, and no unexpected network access.
- Keep the `reactCoreScreens` feature flag disabled by default and do not remove legacy inventory globals.

## Capabilities

### New Capabilities

- `typed-inventory-ownership`: Validated, pilot-local React inventory state and actions for the migrated garage.

### Modified Capabilities

- `react-core-screens`: Flag-enabled garage actions become React-owned through the typed inventory boundary while preserving the legacy fallback and visible gameplay contracts.

## Impact

- Affected code: `src/lib/shell-adapters.ts`, `src/shell.tsx`, new typed inventory modules, legacy compatibility adapters, and related tests.
- Affected documentation: `docs/react-migration.md`, `docs/persistence-contracts.md`, and `CHANGELOG.md`.
- No dependency, Supabase, cloud schema, release flag, or public storage-key changes are required.
