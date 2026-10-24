# Proposal

## Why

The crew data model now exists, but there is no safe operation for an authorized owner or administrator to create a private crew or manage its membership. A trusted administration boundary is needed before school pilots, family links, or teacher metrics can rely on crew membership.

## What Changes

- Add trusted operations for creating private crews and assigning the initial owner.
- Allow only crew owners and active administrators to invite, promote, demote, revoke, and reinstate members.
- Make invitations single-use, expiring, and non-disclosing for unknown email addresses.
- Keep membership separate from pilot access and preserve global pilot data when membership changes.
- Expose only safe, localized client feedback; keep administrative credentials and service-role keys server-side.
- Add authorization, expiry, revocation, offline-fallback, and bilingual UI/API tests.

## Capabilities

### New Capabilities

- `crew-administration`: Trusted creation and lifecycle management of private crew membership.

### Modified Capabilities

- None.

## Impact

- Adds a trusted backend/Edge Function boundary over the issue #55 Supabase tables.
- Adds invitation state and audit metadata without changing local pilot storage or cloud snapshot payloads.
- Requires the issue #55 migration to be applied and its RLS isolation verified before production enablement.
- Does not add public crew discovery, school-device sessions, family linking, dashboards, or challenges.
