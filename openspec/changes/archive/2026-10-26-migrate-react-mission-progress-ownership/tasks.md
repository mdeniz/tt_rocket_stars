# Tasks

## 1. Mission progress contract

- [x] 1.1 Define the validated mission-fact, mission-history, reward, and coin shapes at the typed pilot-persistence boundary; verify existing payloads and unknown fields remain readable with focused unit tests.
- [x] 1.2 Extend the mission persistence transaction to stage a complete active-pilot snapshot, preserve the existing storage keys, and restore the previous raw snapshot on failure; verify commit, rollback, malformed input, and unavailable-storage cases in unit tests.
- [x] 1.3 Preserve current progression and reward calculations while adapting their output to the typed mission-progress contract; verify multiplication, division, exam, speed, timed, and achievement bonus semantics against current behavior.

## 2. Flagged React ownership

- [x] 2.1 Route flag-enabled mission completion through the typed mission-progress boundary without exposing legacy mutable globals to React; verify the disabled flag still executes the legacy path in unit and E2E coverage.
- [x] 2.2 Commit facts, history, reward details, and Rocket Coins atomically for the active pilot and prevent duplicate completion writes; verify pilot isolation, profile switching, and repeated-result behavior in unit and browser tests.
- [x] 2.3 Keep the fail-closed fallback and recovery behavior explicit for missing adapters, invalid payloads, quota errors, and private-mode storage failures; verify no progress deletion and continued play in offline browser tests.
- [x] 2.4 Verify backup export/import and reset preserve the migrated mission payload and existing envelope fields; verify a malformed mission backup leaves the current state unchanged.

## 3. Product compatibility coverage

- [x] 3.1 Add Chromium E2E coverage for starting and completing each supported mission mode, visible reward results, persisted history, coin balance, and reload recovery; verify `npm run test:e2e -- tests/e2e/feature-flags.spec.cjs` passes.
- [x] 3.2 Add mobile WebKit compatibility coverage for the flagged mission path and legacy rollback path; verify the focused Playwright WebKit tests pass and document that this is not real iOS Safari validation.
- [x] 3.3 Add Chrome DevTools empirical verification for the enabled flag, a completed mission, local storage payloads, reload recovery, and the disabled-flag fallback; verify the observed UI and storage values are recorded in the test evidence.
- [x] 3.4 Add regression coverage for English and Spanish mission results and accessibility names; verify both locales expose unchanged user-facing strings and controls.

## 4. Integration and release safety

- [x] 4.1 Run `npm run check`, the focused unit and E2E suites, and the production build; verify no legacy-check, typecheck, unit, build, or self-contained-dist regressions.
- [x] 4.2 Inspect the generated bundle and feature-flag defaults; verify the published flag remains disabled and `public/legacy/scripts/03.js` remains available for rollback.
- [x] 4.3 Update the issue with implementation, test, and Chrome DevTools evidence; verify the acceptance criteria are traceable to passing checks before requesting review.

## Workflow follow-up

- Archive this OpenSpec change only after implementation review, CI, and the repository workflow's merge requirements are satisfied.
- Sync the accepted requirements into the canonical `react-core-screens` and `typed-pilot-persistence` specifications when archiving.
