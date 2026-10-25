# Tasks

## 1. Establish the React-owned persistence boundary

- [ ] 1.1 Define typed pilot, inventory, achievement, and backup adapter contracts without renaming existing storage keys; verify contract tests preserve legacy payload fields and fail closed on invalid inputs.
- [ ] 1.2 Route React-owned pilot switching and backup controls through the persistence boundary; verify valid round trips, invalid restore protection, storage fallback, and per-pilot isolation with unit and browser tests.
- [ ] 1.3 Document the ownership boundary and rollback behavior in `docs/react-migration.md`; verify the documented flag and test commands exist.

## 2. Migrate gameplay orchestration

- [ ] 2.1 Move mission configuration and launch orchestration behind the typed React boundary while preserving the legacy fallback; verify supported tables, operations, modes, and durations with unit and E2E tests.
- [ ] 2.2 Verify timer, auto-next, answer progression, audio hooks, rewards, and local persistence from the React-owned flow; record Chrome DevTools console, network, and offline evidence.

## 3. Migrate inventory and achievements

- [ ] 3.1 Move rocket inventory, coin balance, purchase, preview, and equip state behind the React-owned boundary; verify pilot isolation, backup compatibility, and rollback with unit and E2E tests.
- [ ] 3.2 Move achievement calculation results and refresh state behind the React-owned boundary; verify English/Spanish labels, stable results, persistence, and rollback with unit and E2E tests.

## 4. Integration and release safety

- [ ] 4.1 Verify keyboard, touch, reduced-motion, and localized accessibility behavior for every React-owned control; record Chrome DevTools evidence and retain WebKit as a compatibility signal only.
- [ ] 4.2 Verify the disabled-flag legacy path, offline startup, local backups, and no-network gameplay after the ownership migration; run the complete unit, E2E, build, and self-contained artifact checks.
- [ ] 4.3 Update issue #53 with exact evidence and acceptance status; keep the flag disabled by default until real iOS Safari validation is complete.

## Workflow follow-up

- Archive this change only after all implementation tasks, CI, empirical checks,
  and issue #53 acceptance criteria are complete.
- Start issue #54 separately after no legacy source of truth remains for the
  migrated surfaces.
