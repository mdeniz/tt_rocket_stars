# Proposal

## Why

Chrome DevTools reports a password-form accessibility warning in the optional
invited-account flow because the dynamically generated password forms do not
expose an explicit account-identity association. The warning is visible during
normal signed-out use of `index_next.html` and should be removed without
changing authentication behavior or local-first gameplay.

## What Changes

- Associate the sign-in, invitation setup, and password-change password fields
  with the invited account identity field or an equivalent accessible username
  control.
- Preserve appropriate `autocomplete` metadata for email, current password,
  and new password fields.
- Add contract and running-application verification for the resulting form
  semantics and absence of the browser warning.
- Preserve invitation-only access, localized labels, password lifecycle
  behavior, storage keys, and offline gameplay.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `technical/cloud-progress-sync`: password authentication forms expose an
  accessible account-identity association while preserving safe localized
  authentication behavior.

## Impact

- Affects dynamically generated authentication markup in
  `public/legacy/scripts/32.js` and its cloud E2E/unit contract coverage.
- Adds no dependencies, API changes, credentials, storage migrations, or
  provider changes.
- Requires Chrome DevTools verification against the signed-out development
  artifact and the existing browser/cloud test suites.
