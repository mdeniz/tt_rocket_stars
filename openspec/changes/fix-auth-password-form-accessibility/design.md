# Design

## Context

See `proposal.md` and the cloud-progress-sync spec delta. The authentication
panel starts with a static email input, while `public/legacy/scripts/32.js`
dynamically inserts the sign-in, invitation setup, and password-change password
controls. The development artifact currently produces a Chrome accessibility
warning for the generated password forms.

## Goals / Non-Goals

**Goals:**

- Give every password form an explicit, accessible account-identity control.
- Preserve the current visible labels, localized messages, authentication
  endpoints, invite-only behavior, and local-first fallback.
- Verify the result with source contracts, cloud E2E coverage, and Chrome
  DevTools against `index_next.html`.

**Non-Goals:**

- No authentication provider, redirect, password policy, or storage change.
- No new dependency or password manager integration beyond standard HTML
  semantics.
- No change to the stable release promotion boundary or legacy runtime order.

## Decisions

### Use explicit username controls and standard autocomplete tokens

The sign-in form will keep its visible email input and associate it with the
current password control using a stable form-level relationship. The invitation
setup and password-change forms will receive a non-disruptive account identity
control associated with their new-password control, using `autocomplete="username"`
for identity and `current-password` or `new-password` for password purpose.

This uses native HTML semantics rather than JavaScript-only labels or a custom
password-manager API. It is compatible with keyboard, touch, screen readers,
and browser password managers and does not alter submitted authentication data.

### Keep the identity value derived from the existing invited account context

The forms must not invent or persist a second account identifier. The existing
email input/session context remains authoritative; any hidden association must
be populated from that value only for form semantics and must not be logged,
copied into progress payloads, or stored as a new local key.

### Verify both static contracts and the running artifact

Unit/source tests will assert the IDs, labels, autocomplete values, and form
associations. Existing cloud E2E tests will continue to exercise login, setup,
password change, recovery, and logout. Chrome DevTools will inspect the running
signed-out development artifact and confirm that the warning disappears while
local-only navigation remains free of cloud requests.

## Risks / Trade-offs

- [Risk] A hidden identity control could diverge from the visible email →
  [Mitigation] derive it from the existing email control at form setup and
  cover both values in a contract test.
- [Risk] Browser autofill could alter a dynamically inserted field →
  [Mitigation] use stable IDs, explicit labels, and standard autocomplete tokens;
  do not rely on visual ordering.
- [Risk] The accessibility warning may originate from a provider or browser
  heuristic outside the app → [Mitigation] record the exact DevTools result and
  keep the existing safe authentication behavior if the warning persists.

## Migration Plan

1. Add the form association and accessibility contract tests.
2. Update the dynamic authentication controls without changing request payloads
   or storage keys.
3. Run `npm run check`, the focused cloud E2E suite, and the configured browser
   checks.
4. Verify the signed-out `index_next.html` flow with Chrome DevTools and record
   console/network results.
5. Roll back by reverting the markup-only change if authentication, autofill,
   translations, or offline behavior regresses.
