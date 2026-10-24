# Tasks

## 1. Contracts and validation

- [x] 1.1 Define framework-independent TypeScript types for profiles, active references, payloads, backup envelopes, and cloud snapshots; verify `npm run typecheck` passes.
- [x] 1.2 Implement boundary validators that preserve unknown legacy payload fields and return non-throwing validation results; verify malformed and valid fixture unit tests pass.
- [x] 1.3 Add compatibility fixtures for existing profile, payload, and backup keys; verify legacy identifiers and payloads round-trip unchanged.

## 2. Local persistence adapter

- [x] 2.1 Add a local persistence adapter around the existing storage keys with safe read/write fallbacks; verify restricted-storage tests preserve gameplay and valid data.
- [x] 2.2 Route profile switching, creation, deletion, and active-pilot synchronization through the adapter without changing storage names; verify per-pilot isolation tests pass.
- [x] 2.3 Route backup export and restore through validated versioned envelopes; verify valid round-trips and invalid restore non-destructiveness in unit and E2E tests.

## 3. Cloud boundary and integration

- [x] 3.1 Reuse persistence validators for cloud serialization and remote application; verify malformed cloud snapshots do not replace local state.
- [x] 3.2 Verify cloud version metadata remains compatible with conflict handling from #33; run the cloud synchronization unit and E2E suites.
- [x] 3.3 Document the persistence contracts and migration guarantees in technical English; verify `npm run check` and the self-contained build pass.

## 4. Workflow verification

- [x] 4.1 Run the configured dev-workflow checks and review the changed files for storage-key, backup, and cloud compatibility regressions.
- [x] 4.2 Perform empirical browser verification with Chrome DevTools for local-only startup, pilot switching, backup restore, and authenticated cloud fallback.

## Workflow follow-up

- Archive the change after implementation, review, CI, and empirical verification are complete.
- Close #51 only after all acceptance criteria and workflow evidence are complete.
