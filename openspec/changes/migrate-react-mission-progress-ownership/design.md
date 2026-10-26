# Design

## Context

The legacy mission runtime in `public/legacy/scripts/03.js` currently owns mutable mission facts, the `cosmotablas-v2` fact payload, the `cosmotablas-history-v1` history, and the reward/coin path stored in `tt-rocket-garage-v1`. The React gameplay and persistence modules already provide validated domain and pilot-local contracts, but they do not yet own the complete mission write transaction. The migration must remain optional because the published flag-disabled path is the compatibility baseline.

## Goals / Non-Goals

**Goals:**

- Establish one typed, pilot-scoped transaction boundary for mission facts, history, reward details, and coins.
- Preserve legacy keys, unknown payload fields, backup envelopes, profile switching, offline play, and fail-closed behavior.
- Make flag-enabled and flag-disabled paths independently testable, including rollback from a failed write.
- Verify the enabled path in Chromium and through Chrome DevTools empirical checks, with mobile WebKit compatibility coverage.

**Non-Goals:**

- Removing or rewriting `public/legacy/scripts/03.js`.
- Enabling the feature in the published build.
- Changing mission mathematics, reward thresholds, translations, cloud synchronization, or authentication.
- Supporting real iOS Safari as an automated acceptance environment.

## Decisions

### Use the existing pilot payload as the ownership boundary

The React boundary will read the active pilot payload through the existing pilot persistence contract and commit a complete validated payload snapshot. It will retain the established storage keys (`cosmotablas-v2`, `cosmotablas-history-v1`, and `tt-rocket-garage-v1`) and preserve unknown fields. This keeps backups and profile switching compatible and avoids a second migration format.

Alternative considered: introduce a new mission-progress key. Rejected because it would duplicate ownership, complicate backup compatibility, and make legacy rollback ambiguous.

### Keep mission calculations separate from persistence

Question generation, answer checking, and reward calculation remain pure domain operations. The persistence adapter accepts validated mission facts, history entries, and inventory changes, then commits one pilot snapshot with rollback support. This preserves deterministic unit tests and prevents browser storage concerns from entering the rules layer.

Alternative considered: move the full legacy mission script into React in one step. Rejected because it would expand the migration surface and make parity failures harder to isolate.

### Route ownership through an explicit feature flag

The existing flag bridge will select the typed boundary only when enabled. The default remains disabled. Missing adapters, invalid inputs, and storage failures return a recoverable failure, leaving the legacy path available and never deleting the last valid snapshot.

Alternative considered: silently retry through both implementations. Rejected because double writes could duplicate rewards or history entries.

### Treat mission completion as one logical commit

Facts, history, reward details, and coins must be prepared from one completion result and committed as one validated pilot payload. If validation or storage fails, the adapter restores the previous raw snapshot when possible and reports failure to the caller. The legacy path is not invoked after a partial React write.

Alternative considered: persist each key independently. Rejected because a failure between keys could expose inconsistent facts, history, and rewards.

## Risks / Trade-offs

- [Legacy payloads have loosely shaped historical entries] → Preserve unknown fields, validate only required migrated fields, and keep malformed entries isolated rather than replacing the full payload.
- [Reward duplication during flag rollout] → Use an explicit ownership decision per mission completion and add idempotency coverage for the result transaction.
- [Storage quota or private-mode failures] → Fail closed, retain the previous raw snapshot, keep the session playable, and exercise the storage failure adapter in unit and browser tests.
- [React and legacy rendering can drift] → Keep the flag disabled by default, compare visible result and coin semantics in E2E tests, and verify both paths before enabling.

## Migration Plan

1. Add or extend typed mission-progress validation and transaction helpers without changing runtime defaults.
2. Adapt the flagged React completion path to use the helper and preserve the current result model.
3. Add unit tests for validation, pilot isolation, rollback, idempotency, and legacy payload compatibility.
4. Add Chromium, offline, mobile WebKit, rollback, and Chrome DevTools checks; retain a disabled-flag regression test.
5. Run the repository checks and review the generated production bundle for unchanged flag defaults and self-contained assets.
6. Enable the flag only in a later, explicitly reviewed change after parity evidence is accepted.

Rollback consists of disabling the ownership flag and serving the unchanged legacy mission path. Existing payload keys and backup envelopes remain readable throughout the migration.

## Open Questions

None.
