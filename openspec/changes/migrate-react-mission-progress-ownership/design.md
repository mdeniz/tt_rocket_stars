# Design

## Context

The typed gameplay and inventory adapters already validate pilot-local progress, while `public/legacy/scripts/03.js` still coordinates mission completion and invokes the legacy profile synchronizer. The migration must preserve the existing storage keys, backup envelope, reward formulas, duplicate-completion guard, offline behavior, and disabled-flag fallback.

## Goals / Non-Goals

**Goals:**

- Make the flagged React mission completion path the single typed transaction boundary for local progress.
- Capture and restore every affected domain when a write or validation step fails.
- Keep legacy globals as a reversible compatibility path until release verification is complete.
- Prove behavior through unit, browser, mobile WebKit, accessibility, offline, and DevTools checks.

**Non-Goals:**

- Removing `public/legacy/scripts/03.js` in this slice.
- Changing reward formulas, question generation, localStorage/sessionStorage key names, backup formats, or cloud schemas.
- Enabling the React mission ownership flag in the published release.

## Decisions

- **Use the existing typed mission persistence adapter.** Extend its progress commit contract instead of adding a second store, so facts, history, inventory, and profile synchronization share validation and rollback.
- **Snapshot all affected keys before writing.** Restore each prior raw value when a later write fails; if restoration is itself unavailable, preserve the best available state and return a failure rather than reporting success.
- **Keep ownership flag-gated.** The flag-enabled path uses the typed boundary; the disabled or unavailable path continues through the legacy mission runtime and compatibility adapters.
- **Keep duplicate-completion protection at the transaction boundary.** A completion identifier or equivalent existing guard must be checked before committing and retained after the migration.
- **Verify real browser behavior through existing Chrome DevTools and Playwright projects.** Use Chromium for interactive evidence and mobile WebKit for compatibility checks; neither is treated as real iOS Safari.

## Risks / Trade-offs

- [Risk] Legacy and typed code may both observe a completion during the transition. → Keep the flag disabled by default, assert legacy mutators are not called in flagged tests, and retain the fallback path.
- [Risk] A storage failure can occur during rollback. → Return failure, preserve raw snapshots where possible, and verify malformed and failing storage paths in unit tests.
- [Risk] Existing opaque payload fields may be lost by a narrow rewrite. → Merge typed domain updates into the captured payload and cover unknown fields in tests and backups.

## Migration Plan

1. Add failing unit contracts for atomic mission progress ownership and rollback.
2. Implement the typed transaction and flagged React delegation without changing default behavior.
3. Add browser coverage, run CI and Chrome DevTools verification, then review the flag-disabled fallback.
4. Keep the change behind the existing flag until the subsequent legacy retirement issue is complete.

## Open Questions

None.
