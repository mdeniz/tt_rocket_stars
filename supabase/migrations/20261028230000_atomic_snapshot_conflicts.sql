-- Resolve ordinary concurrent snapshot writes as optimistic conflicts.

create or replace function public.upsert_my_progress_snapshot(
  p_pilot_id uuid,
  p_expected_version bigint,
  p_payload jsonb
)
returns public.progress_snapshots
language plpgsql
security invoker
set search_path = public
as $$
declare
  next_snapshot public.progress_snapshots;
begin
  perform set_config('lock_timeout', '2s', true);

  if (select auth.uid()) is null then
    raise exception 'authenticated user required' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.pilots
    where id = p_pilot_id and user_id = (select auth.uid())
  ) then
    raise exception 'pilot not found' using errcode = '42501';
  end if;

  update public.progress_snapshots
  set version = version + 1,
      payload = coalesce(p_payload, '{}'::jsonb)
  where pilot_id = p_pilot_id
    and user_id = (select auth.uid())
    and version = coalesce(p_expected_version, 0)
  returning * into next_snapshot;

  if next_snapshot.id is not null then
    return next_snapshot;
  end if;

  if exists (
    select 1 from public.progress_snapshots
    where pilot_id = p_pilot_id and user_id = (select auth.uid())
  ) then
    raise exception 'snapshot version conflict' using errcode = '40001';
  end if;

  if coalesce(p_expected_version, 0) <> 0 then
    raise exception 'snapshot version conflict' using errcode = '40001';
  end if;

  begin
    insert into public.progress_snapshots (user_id, pilot_id, version, payload)
    values ((select auth.uid()), p_pilot_id, 1, coalesce(p_payload, '{}'::jsonb))
    returning * into next_snapshot;
  exception
    when unique_violation then
      raise exception 'snapshot version conflict' using errcode = '40001';
  end;

  return next_snapshot;
exception
  when lock_not_available then
    raise exception 'cloud snapshot is busy' using errcode = '55P03';
end;
$$;

revoke all on function public.upsert_my_progress_snapshot(uuid, bigint, jsonb) from public;
grant execute on function public.upsert_my_progress_snapshot(uuid, bigint, jsonb) to authenticated;
