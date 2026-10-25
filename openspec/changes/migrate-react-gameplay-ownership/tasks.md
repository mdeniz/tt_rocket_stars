# Tasks

## 1. React gameplay contracts

- [x] 1.1 Define typed mission state, question, timer, feedback, and result contracts in the React boundary; verify invalid transitions are rejected by unit tests.
- [x] 1.2 Connect the existing bounded game-rule and reward contracts to the React mission state machine; verify multiplication, division, mixed operations, and tables 1–12 with deterministic fixtures.
- [x] 1.3 Add typed persistence commit and rollback adapters for mission progress; verify localStorage keys, per-pilot separation, backup compatibility, and fail-closed invalid payload handling.

## 2. Mission behavior

- [x] 2.1 Route React mission setup and launch through the React-owned state machine when the feature flag is enabled; verify selected tables, operation, mode, and timed duration are preserved.
- [x] 2.2 Implement answer progression, feedback, timer, auto-next, audio hook, rewards, and completion state; verify practice, exam, speed, and timed scenarios with fake-clock unit tests and focused Chromium E2E.
- [x] 2.3 Preserve offline and no-account operation with the React flag enabled; verify a mission can start, answer, and save locally without network requests or Supabase configuration.
- [x] 2.4 Preserve the disabled-flag legacy path and adapter failure rollback; verify legacy startup, mission launch, progress, and backup flows remain unchanged.

## 3. Accessibility and compatibility

- [x] 3.1 Verify keyboard and touch activation, Spanish and English labels, reduced motion, focus behavior, and answer control semantics for every React-owned mission control with browser tests.
- [x] 3.2 Verify audio remains user-gesture compatible and timer behavior remains visible across responsive layouts; record Chrome DevTools console and network evidence for the running app.
- [x] 3.3 Update `docs/react-migration.md` and `CHANGELOG.md` with ownership, rollback, and verification evidence; verify documented commands and flag names match the implementation.

## 4. Integration gate

- [x] 4.1 Run `npm run check`, full desktop E2E, and mobile WebKit signal checks; verify all required suites pass or document exact isolated reruns.
- [ ] 4.2 Run the final OpenSpec scenario audit and issue #53 acceptance review; verify the React flag remains disabled by default until every unresolved dependency and device check is accounted for.

## Workflow follow-up

- Archive the change only after implementation, review, CI, Chrome DevTools verification, and issue #53 acceptance are complete.
- Do not start issue #54 until no legacy gameplay source of truth remains for the migrated surfaces.
