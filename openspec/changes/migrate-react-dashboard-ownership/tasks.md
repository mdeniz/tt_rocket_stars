# Tasks

## 1. Evaluator contract

- [x] 1.1 Add a pure typed dashboard/progress evaluator for existing pilot-local facts and history, with unit coverage for totals, accuracy, levels, table progress, and malformed payloads.
- [x] 1.2 Add English and Spanish keys for all new dashboard/progress labels and verify translation completeness.

## 2. React ownership

- [x] 2.1 Render flag-enabled dashboard and progress panels from the evaluator and local persistence boundary; verify the legacy DOM is not required.
- [x] 2.2 Preserve disabled-flag rollback, active-pilot isolation, offline operation, and locale updates with focused Chromium E2E coverage.

## 3. Verification and handoff

- [x] 3.1 Record Chrome DevTools evidence for visible metrics, local storage, console, and network behavior; update migration documentation and changelog.
- [x] 3.2 Run OpenSpec strict validation, `npm run check`, full Chromium, mobile WebKit signal, and `git diff --check`.

## Workflow follow-up

- Merge the ready PR after CI passes with the authorized bypass.
- Keep issue #53 open until the remaining legacy-owned surfaces are migrated and reviewed.
