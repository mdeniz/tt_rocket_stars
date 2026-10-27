# Proposal

## Why

The development artifact can render the hidden translation anchor used for
credential-error localization as visible text. It can also retain a previous
credential error after session restoration or successful authentication, which
contradicts the authenticated state shown by the cloud access panel. This is a
user-visible authentication regression and should be fixed before the next
development build is used for hosted verification.

## What Changes

- Keep the credential-translation lookup available to the authentication
  runtime without placing a visible or layout-affecting anchor in the page.
- Clear stale credential errors when a valid session is restored or sign-in
  succeeds.
- Preserve localized rejected-credential feedback while signed out.
- Add source, browser, and running-application coverage for the regression.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `technical/cloud-progress-sync`: authentication status feedback must reflect
  the current session and translation lookup must remain non-visible.

## Impact

- Affects `index.html`, `public/legacy/scripts/32.js`, and authentication
  contract/E2E coverage.
- Adds no dependencies, APIs, credentials, storage migrations, or provider
  changes.
- Requires Chrome DevTools verification against the hosted development artifact
  and the existing cross-browser CI matrix.
