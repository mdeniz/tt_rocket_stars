# Design

## Context

The existing `react-pilot-persistence` adapter already validates and switches pilot payloads, while `public/legacy/scripts/02.js` still owns profile creation, deletion, rename, active-profile synchronization, and UI refresh. Existing storage keys and payload envelopes are compatibility contracts shared by backups and cloud sync.

## Goals / Non-Goals

**Goals:**

- Complete the typed local profile lifecycle boundary for the flag-enabled React path.
- Preserve profile IDs, active-profile storage, language selection, payload fields, limits, and unknown compatible data.
- Keep legacy handlers as a reversible fallback until the broader retirement issue is complete.
- Make failure behavior fail closed and locally recoverable.

**Non-Goals:**

- Changing Supabase schema, authentication, cloud conflict policy, or network behavior.
- Enabling React ownership in the published default.
- Removing legacy profile code in this slice.

## Decisions

- Extend the existing `ReactPilotPersistenceAdapter` rather than introducing a second profile store, because it already owns validated profile collections and active-payload switching.
- Add typed rename/delete operations with explicit validation and recovery semantics; reject malformed IDs, duplicate names, missing profiles, and storage failures without mutation.
- Keep the legacy view notification behind the existing compatibility adapter so the migration can coexist with inline legacy handlers during rollout.
- Verify ownership through feature-flagged E2E instrumentation that proves legacy profile mutators are not called, while preserving a disabled-flag rollback test.

## Risks / Trade-offs

- [Risk] Deleting or renaming a profile could lose compatible payload fields. → Mitigation: mutate only the validated profile envelope and add round-trip tests for opaque fields and backups.
- [Risk] Active-profile synchronization could write stale data before a switch. → Mitigation: persist the current active snapshot before every lifecycle mutation and abort the operation if that write fails.
- [Risk] Legacy UI and React ownership could compete during migration. → Mitigation: retain stable hosts, use the feature flag, and assert legacy fallback behavior in browser tests.

## Migration Plan

1. Add failing unit tests for typed rename/delete and failure isolation.
2. Extend the adapter and React profile actions minimally, retaining legacy fallback.
3. Add Chromium and mobile WebKit coverage for creation, switching, rename, deletion, offline behavior, localization, accessibility, and rollback.
4. Run the full checks and Chrome DevTools empirical verification; keep the flag disabled by default.
5. Record evidence in #146 and update #54 only after CI and review pass.
