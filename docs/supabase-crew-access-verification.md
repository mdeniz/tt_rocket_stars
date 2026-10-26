# Supabase crew access verification

This document verifies the issue #55 database contract before issue #56 adds
trusted crew administration operations. It uses two already-created invited
accounts in a non-production Supabase project. Do not put passwords, tokens,
service-role keys, or real learner data in this repository.

## Preconditions

1. Apply migrations `20261023000000_initial_cloud_progress.sql`,
   `20261023010000_optimistic_cloud_snapshots.sql`,
   `20261023020000_harden_cloud_access.sql`, and
   `20261023030000_crew_access_model.sql` in that order.
2. Record only the UUIDs of two test accounts (`ACCOUNT_A` and `ACCOUNT_B`) and
   two test pilots owned by those accounts. Keep credentials in the provider
   dashboard or a local secret manager.
3. Run the policy checks in the Supabase SQL editor as a project maintainer.

## Schema and privilege checks

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('crews', 'crew_memberships', 'pilot_access');

select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('crews', 'crew_memberships', 'pilot_access')
order by table_name, grantee, privilege_type;
```

Expected results: all three tables have `rowsecurity = true`; the `anon` role
has no table privileges; and the `authenticated` role has `SELECT` only until
issue #56 introduces trusted administration operations.

## Authenticated isolation checks

Use the SQL editor's request-claims support or an equivalent local Supabase
integration harness to run each query once as `ACCOUNT_A` and once as
`ACCOUNT_B`. Replace placeholders with UUID literals; never commit the values.

```sql
-- The active account must not see another account's pilot through crew tables.
select id from public.pilots where id = 'PILOT_OWNED_BY_OTHER_ACCOUNT';
select id from public.pilot_access where pilot_id = 'PILOT_OWNED_BY_OTHER_ACCOUNT';

-- Membership alone is not a pilot grant.
select id, access_level, access_context
from public.pilot_access
where crew_id = 'CREW_ID' and user_id = 'ACCOUNT_WITHOUT_PILOT_GRANT';

-- Revoked or expired membership must not enable crew visibility.
select public.is_active_crew_member('CREW_ID');
select public.is_active_crew_admin('CREW_ID');
```

Expected results: cross-account pilot rows are absent; an account without an
explicit grant receives no `pilot_access` row; and revoked or expired
membership helpers return `false`.

## Hosted empirical evidence

On 2026-10-26, the checks were run against the configured Supabase project
through the deployed `index_next.html` application using two authenticated
browser sessions. `railsgeek@gmail.com` could read the owner pilot, crew,
membership, and explicit grant. `moisesdenizaleman@gmail.com` could read its
own pilot, active crew membership, and explicit grant, but received zero rows
for the owner-only pilot and the owner's private progress snapshot. Anonymous
requests to `crews`, `pilot_access`, and `progress_snapshots` returned HTTP
401. The browser used only the publishable key, and no service-role credential
was present. Disposable fixture rows were removed after the check.

The repository contract check also passed with
`npm run test:unit -- tests/unit/supabase-schema.test.cjs` (126 tests passed).
This evidence is provider-backed and does not claim real iOS Safari coverage.

## Deletion boundary checks

In a disposable project, remove one membership or crew association through the
trusted SQL/admin path used by the next issue. Verify that the referenced
`pilots` and `progress_snapshots` rows remain. Account deletion must continue to
use `delete_my_cloud_data()` and must not touch local browser storage.
