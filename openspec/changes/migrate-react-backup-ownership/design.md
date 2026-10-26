# Design

## Context

The current backup implementation in `public/legacy/scripts/05.js` owns the `tt-rocket-backups-v1` list, version-1 envelope validation, recovery backups, restore, import, export, and reset. `src/lib/shell-adapters.ts` exposes only a thin delegation adapter, while the React flag is disabled by default. Existing pilot, inventory, cloud-sync, and product specs make the storage keys, per-pilot separation, and fail-safe behavior compatibility requirements.

## Goals / Non-Goals

**Goals:**

- Establish one typed backup boundary that can be used by React-owned settings controls.
- Preserve every existing key, envelope field, local-first behavior, confirmation, and translated result.
- Keep operations fail-closed and create recovery backups before replacement.
- Keep a deterministic legacy fallback while the ownership flag is disabled or unavailable.
- Verify behavior with pure tests, browser flows, and Chrome DevTools evidence.

**Non-Goals:**

- Changing the backup schema, retention limit, storage keys, cloud schema, or release defaults.
- Removing `05.js` in this change.
- Moving backup data to Supabase or requiring authentication.

## Decisions

### Reuse the existing envelope and storage contract

The typed implementation will read and write `tt-rocket-backups-v1` and the existing gameplay keys through the safe local-store abstraction. This avoids migrations and preserves backups created by older releases.

Alternative rejected: introducing a new envelope or storage key. That would split recovery history and make rollback unsafe.

### Separate pure validation from browser effects

Envelope validation, snapshot construction, and restore planning will be pure and unit-testable. Browser-only effects such as alerts, confirmations, file downloads, file reads, reload, and localized rendering will be adapters around the pure contract.

Alternative rejected: moving DOM event handlers directly into the persistence module. That would make storage correctness depend on the legacy page lifecycle.

### Gate ownership and retain legacy fallback

The existing React ownership flag will select the typed boundary; the default remains legacy. If a typed operation fails before committing a replacement, the adapter returns failure and leaves local state unchanged. The fallback remains available for rollback and inline handlers.

Alternative rejected: enabling the typed path by default after CI. Browser storage and file APIs need empirical verification in the running application.

### Verify destructive-looking operations with recovery evidence

Restore and reset tests must assert that a valid recovery backup exists before replacement and that a failed backup prevents replacement. Chrome DevTools verification will inspect local storage, console output, network activity, and offline behavior.

## Risks / Trade-offs

- [A mismatch with undocumented legacy backup fields could reject a valid user backup] → Preserve unknown compatible envelope fields and add fixtures from the current implementation before changing the reader.
- [File input/download behavior differs across browsers] → Keep file effects in a small adapter and verify Chromium plus mobile WebKit compatibility; do not claim real iOS Safari equivalence.
- [React and legacy controls could both mutate backups] → Expose one typed boundary to React, retain legacy only behind the disabled flag, and add browser assertions for the active path.
- [Reset or restore could lose progress] → Require a recovery backup before replacement and test failure injection at the storage boundary.

## Migration Plan

1. Add pure envelope and backup operation contracts with fixtures for valid and invalid data.
2. Implement the typed local backup adapter and route flagged backup controls through it.
3. Preserve the legacy path and confirm the flag-disabled rollback behavior.
4. Add unit, E2E, build, and Chrome DevTools evidence for offline create/restore/import/export/reset flows.
5. Update #54 and leave the ownership flag disabled until the complete migration is reviewed.
