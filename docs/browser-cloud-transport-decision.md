# Browser Cloud Transport Decision

## Decision

For this migration, the existing publishable Supabase REST/Auth transport is the
only deployment transport available without adding a hosted backend, an Edge
Function, or a runtime dependency. It is retained behind the browser domain
contract as a temporary compatibility adapter.

This is not an administrative transport: the browser receives only the public
Supabase URL and anonymous key, sends the authenticated user's access token, and
relies on the checked-in RLS policies and security-definer functions. No
service-role key, database password, migration credential, or provider-management
operation is allowed in the bundle.

## Constraints

- The domain contract must not expose table names, RPC names, or query builders.
- Missing configuration, signed-out sessions, provider failures, and malformed
  responses must fail closed for cloud access while local play remains available.
- `legacyCloudDirectFallback` is disabled by default and exists only as a
  rollback switch during the migration.
- The adapter can be removed once a trusted server or Edge transport is available
  and the browser scenarios have been repeated against it.

## Rollback

The fallback flag can restore the old direct browser path for diagnosis without
changing local storage or cloud data. Enabling it requires an explicit build or
runtime decision; it is never enabled by default in the stable or development
entrypoints.
