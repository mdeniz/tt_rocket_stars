# Proposal

## Why

TT Rocket Stars currently keeps progress in browser storage, which preserves
offline play but prevents a user from continuing the same pilot on another
device. The project needs an explicit cloud-sync contract before introducing
Supabase Auth, Supabase Postgres, or transactional email, while retaining
local-first gameplay and the existing backup format.

## What Changes

- Define optional invite-only passwordless authentication and session lifecycle
  for cloud synchronization.
- Define a user-owned data model for pilots, progress snapshots, and sync
  metadata.
- Define local-to-cloud synchronization boundaries and deterministic conflict
  handling.
- Preserve the existing local storage keys, formats, backups, and offline
  gameplay when authentication or the network is unavailable.
- Define data minimization, cloud deletion, sign-out, and failure behavior.
- Document the Supabase and transactional email boundaries without adding
  provider credentials or implementation dependencies in this change.

## Capabilities

### New Capabilities

- `technical/cloud-progress-sync`: optional authentication, user-owned cloud
  progress, local-first synchronization, conflict handling, and data lifecycle.

### Modified Capabilities

- `technical/offline-web-app`: clarify that cloud synchronization is optional
  and that offline local progress remains available when authentication,
  network access, or the remote service is unavailable.

## Impact

- Affects future frontend authentication and synchronization adapters around
  the existing `TTLocalStore`, `TTProfiles`, backup, and progress contracts.
- Defines future Supabase Auth, Postgres, Row Level Security, and transactional
  email integration boundaries.
- Adds no runtime dependencies, database migrations, provider configuration, or
  personal data collection by itself.
- Requires future implementation work to preserve local progress and avoid
  exposing service-role credentials in the browser; account creation remains
  restricted to invitations issued from a trusted environment.
