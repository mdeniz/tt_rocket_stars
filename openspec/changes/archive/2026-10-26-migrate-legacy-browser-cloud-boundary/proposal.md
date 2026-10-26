# Proposal

## Why

The browser bundle still contains direct Supabase table and RPC calls through the
legacy cloud adapter. This preserves the current runtime during the React cutover,
but it leaves provider-specific data access in the client and prevents the typed
boundary introduced by #170 from becoming the single cloud contract.

This change is needed now because #170 cannot complete its artifact audit while the
legacy browser path remains provider-specific. The migration must preserve optional
cloud access, offline gameplay, existing local data, RLS, and the current invited-user
authentication contract.

## What Changes

- Introduce a browser-safe cloud transport contract that exposes domain operations
  instead of Supabase table or RPC query construction.
- Move the existing cloud synchronization, pilot discovery, conflict, retry, and
  deletion flows behind that contract while keeping local-first behavior unchanged.
- Keep public Supabase configuration and authenticated sessions limited to the
  publishable client boundary; administrative credentials remain server-side only.
- Retain a reversible compatibility adapter during migration and remove it only after
  its consumers and browser scenarios are proven unused.
- Add artifact checks that distinguish allowed public configuration from provider-
  specific query code and privileged credentials.
- Add unit and cross-browser coverage for signed-out, offline, authenticated,
  conflict, retry, deletion, and unavailable-provider behavior.

## Capabilities

### New Capabilities

- `technical/browser-cloud-boundary`: A provider-neutral, browser-safe contract for
  optional authenticated cloud operations and its compatibility transition.

### Modified Capabilities

- `technical/cloud-progress-sync`: Cloud synchronization must use the browser-safe
  domain contract while preserving authentication, conflicts, retries, deletion, and
  local-first fallback.
- `technical/offline-web-app`: Provider-boundary migration must not add mandatory
  network requests or change local storage and backup compatibility.

## Impact

- Affected runtime: `src/lib/cloud-sync.js`, `src/lib/supabase.js`, the legacy cloud
  adapter in `public/legacy/scripts/32.js`, and the React/legacy bridge that consumes it.
- Affected trusted runtime: the typed repository and its eventual transport/provider
  adapter from #170.
- Affected verification: unit tests, cloud-sync fixtures, browser/offline suites,
  generated-artifact inspection, CI checks, and the #170 acceptance audit.
- No production data migration, authentication-provider replacement, public signup
  flow, or stable release promotion is included.
