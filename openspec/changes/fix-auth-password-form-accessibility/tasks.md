# Tasks

## 1. Form semantics and source contracts

- [x] 1.1 Add explicit accessible identity/password associations to the sign-in,
  invitation setup, and password-change forms; verify the visible labels,
  request payloads, storage keys, and autocomplete purposes remain unchanged.
- [x] 1.2 Add unit/source contract coverage for stable field IDs, labels,
  `autocomplete` values, and form associations; verify the contract fails for a
  password form without an account identity control.

## 2. Authentication and browser verification

- [x] 2.1 Run the focused cloud E2E suite and verify invitation setup, rejected
  credentials, password change, recovery, logout, local-first behavior, and
  offline startup remain green.
- [ ] 2.2 Verify `npm run check`, the applicable browser CI matrix, and
  `openspec validate fix-auth-password-form-accessibility --strict` pass.
- [x] 2.3 Inspect the running `index_next.html` form with Chrome DevTools MCP;
  verify the password-form association warning is absent, localized labels are
  visible, and no credential or unexpected cloud request is introduced.
- [ ] 2.4 Update issue #193 with exact implementation, CI, and DevTools evidence;
  keep the issue in verification until all acceptance criteria pass.

## Workflow follow-up

- Archive this change only after implementation, review, CI, and empirical
  verification are complete.
