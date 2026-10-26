# Tasks

## 1. Contract and test-first coverage

- [x] 1.1 Add unit tests for typed profile rename, deletion, active-profile synchronization, duplicate-name rejection, and storage-failure isolation; verify the new tests fail before implementation.
- [x] 1.2 Add the `typed-pilot-persistence` spec delta and verify strict OpenSpec validation accepts the complete requirement block.

## 2. Typed profile lifecycle implementation

- [x] 2.1 Extend the typed pilot adapter with validated rename and delete operations, preserving IDs, payload fields, language, limits, and active-profile semantics; verify the focused unit suite passes.
- [x] 2.2 Route the flag-enabled React profile controls through the typed adapter while retaining legacy fallback and compatibility view notifications; verify no legacy profile mutator is called in focused browser coverage.
- [x] 2.3 Preserve recovery behavior when synchronization or storage writes fail, including active-pilot payload isolation and opaque compatible fields; verify failure-path unit and E2E coverage passes.

## 3. Browser and release verification

- [x] 3.1 Add Chromium E2E coverage for create, switch, rename, delete, localization, offline play, and profile isolation; verify the full profile flow passes.
- [x] 3.2 Verify disabled-flag rollback, keyboard/touch accessibility, reduced motion, backup compatibility, and malformed local profile behavior in Chromium and mobile WebKit.
- [x] 3.3 Run `npm run check`, focused and full E2E, production build, strict OpenSpec validation, and Chrome DevTools empirical verification with no console or external network errors.

## Workflow follow-up

- Update issue #146 with exact evidence and keep the React ownership flag disabled until CI and review pass.
- Update issue #54 and issue #53 after the slice is merged; do not close #54 until all remaining legacy ownership slices are complete.
- Archive this OpenSpec change only after implementation, CI, review, and empirical verification pass.
