# Tasks

## 1. Contract and test-first coverage

- [ ] 1.1 Add unit tests for a complete mission progress transaction, duplicate completion protection, opaque payload preservation, and rollback after each domain write fails; verify the new tests fail before implementation.
- [ ] 1.2 Add the React core and typed pilot OpenSpec deltas, then verify strict OpenSpec validation accepts the complete requirement blocks.

## 2. Typed transaction ownership

- [ ] 2.1 Extend the typed mission persistence boundary to validate and commit facts, history, rewards, coins, and rocket state together; verify all existing storage keys and payload fields remain compatible.
- [ ] 2.2 Route flagged React mission completion through the typed transaction without invoking legacy mission writers; verify the disabled flag retains legacy fallback behavior.
- [ ] 2.3 Preserve duplicate-completion, pilot isolation, backup, and offline recovery semantics; verify failure paths leave the last valid snapshot readable.

## 3. Browser and release verification

- [ ] 3.1 Add Chromium coverage for successful completion, duplicate completion, offline play, pilot isolation, and legacy-mutator exclusion; verify the focused suite passes.
- [ ] 3.2 Verify localization, keyboard/touch access, reduced motion, malformed progress, backup compatibility, and mobile WebKit behavior; verify no console errors or external requests are introduced.
- [ ] 3.3 Run `npm run check`, full E2E, mobile WebKit E2E, strict OpenSpec validation, and Chrome DevTools empirical verification; record exact evidence in issue #147.

## Workflow follow-up

- Keep the React mission ownership flag disabled by default until CI and review pass.
- Update #53 and #54 with exact evidence; do not close #54 until #148 and remaining legacy slices are complete.
- Archive this OpenSpec change only after implementation, CI, review, and empirical verification pass.
