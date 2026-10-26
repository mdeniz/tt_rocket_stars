# Proposal

## Why

The React core-screen path already consumes a typed persistence boundary, but
the ordered legacy profile runtime still owns profile selection, payload
capture, payload application, and active-pilot synchronization. This ownership
ambiguity blocks issue #54 and makes the React migration unable to retire the
legacy persistence source of truth safely.

## What Changes

- Add a typed React persistence coordinator for local pilots, active-pilot
  selection, payload capture/application, and safe local saves behind the
  existing opt-in flag.
- Preserve `tt-rocket-profiles-v1`, `tt-rocket-active-profile-v1`, and all
  existing domain payload keys and backup formats without introducing a
  network requirement.
- Keep legacy adapters available as an explicit rollback path while the flag
  is disabled or the React coordinator cannot handle an operation.
- Add pilot-isolation, malformed-storage, unavailable-storage, backup, offline,
  and rollback coverage, including Chrome DevTools evidence.
- Leave cloud synchronization, Supabase schema, and the published stable flag
  defaults unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `typed-pilot-persistence`: React may own local pilot persistence behind the
  flag while preserving validation, storage keys, backups, and offline-first
  behavior.
- `react-core-screens`: React core screens use the typed persistence
  coordinator without direct legacy profile/runtime access and retain a
  reversible fallback.

## Impact

- Affected code: `src/lib/shell-adapters.ts`, `src/lib/persistence-runtime.js`,
  `src/shell.tsx`, the ordered profile runtime, and related unit/E2E tests.
- Affected documentation: `docs/react-migration.md`, persistence contracts,
  and the unreleased changelog.
- No new dependency, storage-key migration, Supabase mutation, service-role
  credential, or production feature-flag enablement.
