# Supabase security hardening

This document records the security boundary for the hosted Supabase project.
It contains only reproducible inspection and verification procedures; it never
contains credentials or user payloads.

## Function boundaries

Migration `20261027220642_harden_function_grants_and_indexes.sql`:

- verifies that the provider-managed `ensure_rls` event trigger remains enabled
  and still calls `public.rls_auto_enable()`;
- revokes Data API execution of `rls_auto_enable()` from `public`, `anon`, and
  `authenticated` while retaining the event-trigger callback;
- fixes `set_updated_at()` to `search_path = public, pg_catalog` and removes
  direct Data API execution;
- retains the `SECURITY DEFINER` crew helpers only for authenticated RLS policy
  evaluation, with fixed search paths and explicit grants.

Migration `20261028164815_secure_cloud_deletion_rpc.sql` keeps direct table
deletes revoked and changes `delete_my_cloud_data()` to a narrowly scoped
`SECURITY DEFINER` function. Its fixed `search_path`, authenticated-only
execution grant, and explicit `auth.uid()` predicates are required because the
authenticated role intentionally has no direct `DELETE` privilege on cloud
tables. Apply this migration before hosted deletion verification.

The event-trigger function is a provider-managed exception in the connected project. Its
definition and binding are therefore verified through the PostgreSQL catalog;
the migration does not recreate or remove the provider-managed trigger.

## Advisor-backed indexes

The migration adds indexes for the three reported foreign-key paths:

- `pilot_access.granted_by_user_id`;
- `pilot_access.user_id`;
- `progress_snapshots(pilot_id, user_id)`.

The existing `progress_snapshots_user_id_idx` and
`crew_memberships_user_id_idx` indexes are retained despite low current usage.
Removal requires query evidence and a separate forward migration.

## Auth leaked-password protection

Leaked-password protection is an Auth provider setting, not PostgreSQL DDL. A
project maintainer must enable it in Supabase Dashboard under Auth password
security settings, then verify it with the project security advisor. The setting
must be enabled for invited-account password creation, recovery, and change
flows. Do not test it with a production password or record passwords in issue
comments.

The setting is available only on Supabase Pro and higher plans. The approved TT
Rocket Stars organization is currently on the free plan, so this control remains
an explicit deployment blocker until a maintainer approves a plan change. Do not
start a paid plan or incur a charge as part of migration verification.

Expected advisor state after the reviewed migration and Auth configuration:

- no `anon_security_definer_function_executable` finding for `rls_auto_enable`;
- no `function_search_path_mutable` finding for `set_updated_at`;
- the two crew helper warnings may remain because authenticated execution is
  required by their RLS policy call sites; record that intentional exception;
- `delete_my_cloud_data()` may also appear as an authenticated
  `SECURITY DEFINER` warning after the pending deletion migration is applied.
  This is an intentional, narrowly scoped privilege boundary: direct table
  deletes remain revoked, the function is executable only by `authenticated`,
  and every delete is restricted to `auth.uid()`. Review this finding after
  deployment rather than suppressing it silently;
- `auth_leaked_password_protection` is absent after the Auth setting is enabled;
- the three unindexed foreign-key findings are absent;
- unused-index notices remain documented until query evidence justifies removal.

## Read-only verification

Run these checks with an authenticated Supabase SQL editor or MCP connection.
Never paste service-role keys into the repository, browser, issue tracker, or
logs.

```sql
select evtname, evtenabled, evtfoid::regprocedure
from pg_catalog.pg_event_trigger
where evtname = 'ensure_rls';

select n.nspname, p.proname, p.prosecdef,
       pg_get_functiondef(p.oid),
       has_function_privilege('anon', p.oid, 'EXECUTE') as anon_execute,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_execute
from pg_catalog.pg_proc p
join pg_catalog.pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('rls_auto_enable', 'set_updated_at',
                    'is_active_crew_member', 'is_active_crew_admin');
```

Then run both Supabase security and performance advisors. Record only finding
names, counts, and remediation decisions. Do not include account identifiers or
row contents.
