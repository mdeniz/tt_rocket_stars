# Complete invited authentication lifecycle

## Why

The optional cloud-access flow supports invited account setup, password sign-in,
recovery, and password changes, but the browser verification suite does not yet
prove the complete session lifecycle or safe rejected-credential feedback.

## What changes

- Classify rejected password credentials separately from expired invitation and
  recovery links.
- Verify password change and logout preserve local gameplay data.
- Add credential-free E2E coverage for the complete local authentication lifecycle.

## Non-goals

- This change does not enable public signup, change Supabase authorization, or
  verify external email delivery.

