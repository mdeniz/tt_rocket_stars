# Proposal

## Why

The browser-safe cloud contract is implemented, but its current compatibility
transport still constructs Supabase table and RPC calls in the browser. Issue
#184 cannot close until authenticated cloud operations run through a trusted
server-side transport that preserves RLS, local-first behavior, and rollback.

## What Changes

- Add a domain-specific Supabase Edge Function transport for authenticated pilot
  synchronization, discovery, conflict-aware snapshots, and cloud deletion.
- Keep the browser limited to a public function URL and the user's access token;
  service-role credentials remain Edge Function secrets and are never bundled.
- Define request/response validation, authentication, ownership, optimistic
  concurrency, bounded errors, and CORS behavior for the transport.
- Add a feature-gated browser adapter that can select the trusted transport while
  retaining the existing direct Supabase adapter as an explicit rollback path.
- Add local contract tests, generated-artifact checks, and browser/offline coverage
  before removing the compatibility adapter.
- Document deployment, secret ownership, migration ordering, rollback, and the
  required hosted RLS verification for Supabase.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `technical/browser-cloud-boundary`: require authenticated cloud operations to
  support a trusted domain-specific transport without administrative browser access.
- `technical/cloud-progress-sync`: define the trusted transport as an optional
  implementation of the existing account-owned synchronization contract.
- `technical/offline-web-app`: preserve local startup and gameplay when the Edge
  Function is unavailable or unconfigured.

## Impact

- Adds Supabase Edge Function source and transport contracts under `supabase/` and
  `src/lib/` without exposing secrets or changing local storage keys.
- Updates cloud provider selection, feature-flag defaults, tests, and operational
  documentation.
- Requires a maintainer to configure the Supabase project URL, Edge Function
  secret, redirect/CORS settings, and hosted RLS verification outside the repo.
- Does not promote `index_next.html`, remove the direct compatibility adapter, or
  alter stable `index.html` until the complete verification gate passes.
