-- Harden provider-managed and repository-managed function boundaries without
-- changing row data or removing the retained RLS event trigger.

do $$
declare
  trigger_enabled char;
  trigger_function regprocedure;
begin
  select evtenabled, evtfoid::regprocedure
    into trigger_enabled, trigger_function
  from pg_catalog.pg_event_trigger
  where evtname = 'ensure_rls';

  if not found or trigger_enabled <> 'O' or trigger_function <> 'public.rls_auto_enable()'::regprocedure then
    raise exception 'The retained ensure_rls event trigger is missing or disabled';
  end if;
end;
$$;

-- rls_auto_enable is an internal event-trigger callback, not a Data API RPC.
revoke all on function public.rls_auto_enable() from public, anon, authenticated;

-- set_updated_at is invoked only by table triggers. Fix object resolution and
-- prevent direct Data API execution while retaining trigger invocation.
alter function public.set_updated_at() set search_path = public, pg_catalog;
revoke all on function public.set_updated_at() from public, anon, authenticated;

-- The helpers are intentionally SECURITY DEFINER because their RLS call sites
-- inspect rows hidden from the invoking role. Keep execution authenticated-only.
revoke all on function public.is_active_crew_member(uuid) from public, anon;
revoke all on function public.is_active_crew_admin(uuid) from public, anon;
grant execute on function public.is_active_crew_member(uuid) to authenticated;
grant execute on function public.is_active_crew_admin(uuid) to authenticated;

-- Cover the foreign-key access paths reported by the performance advisor.
create index if not exists pilot_access_granted_by_user_id_idx
  on public.pilot_access (granted_by_user_id);
create index if not exists pilot_access_user_id_idx
  on public.pilot_access (user_id);
create index if not exists progress_snapshots_pilot_id_user_id_idx
  on public.progress_snapshots (pilot_id, user_id);

-- Existing low-usage indexes are intentionally retained until query evidence
-- supports removal; this migration must not turn an advisory into a regression.
