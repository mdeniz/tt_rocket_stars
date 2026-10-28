# Tasks

## 1. Queue and outcome handling

- [x] 1.1 Update the provider-neutral operation queue so a rejected, aborted, or timed-out operation settles its tail and allows later operations to run; verify with a unit test that deletion runs after an upload rejection.
- [x] 1.2 Preserve operation-specific deletion outcomes and translated UI status handling; verify that local progress and backups are unchanged on deletion failure.

## 2. Evidence and integration

- [x] 2.1 Add or update cloud operation documentation with the queue failure-safe contract and verification commands; verify all technical documentation is in English.
- [x] 2.2 Run `npm run check`, the focused cloud E2E suite, strict OpenSpec validation, and connected Chrome DevTools failure/success scenarios; record results before marking the issue complete.

## Workflow follow-up

- Open a small PR linked to #240 and mark it ready after CI and technical review pass.
- Merge through the configured repository ruleset bypass when authorized, then verify the development Pages artifact while leaving stable `index.html` unchanged.
- Archive this OpenSpec change only after all acceptance evidence is complete.
