-- Keep a blocked cloud snapshot from holding the trusted transport open.

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
  current_snapshot public.progress_snapshots;
  next_snapshot public.progress_snapshots;
begin
  if (select auth.uid()) is null then
    raise exception 'authenticated user required' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.pilots
    where id = p_pilot_id and user_id = (select auth.uid())
  ) then
    raise exception 'pilot not found' using errcode = '42501';
  end if;

  select * into current_snapshot
  from public.progress_snapshots
  where pilot_id = p_pilot_id and user_id = (select auth.uid())
  for update nowait;

  if current_snapshot.id is null then
    if coalesce(p_expected_version, 0) <> 0 then
      raise exception 'snapshot version conflict' using errcode = '40001';
    end if;
    insert into public.progress_snapshots (user_id, pilot_id, version, payload)
    values ((select auth.uid()), p_pilot_id, 1, coalesce(p_payload, '{}'::jsonb))
    returning * into next_snapshot;
  else
    if current_snapshot.version <> p_expected_version then
      raise exception 'snapshot version conflict' using errcode = '40001';
    end if;
    update public.progress_snapshots
    set version = current_snapshot.version + 1,
        payload = coalesce(p_payload, '{}'::jsonb)
    where id = current_snapshot.id
    returning * into next_snapshot;
  end if;

  return next_snapshot;
exception
  when lock_not_available then
    raise exception 'cloud snapshot is busy' using errcode = '55P03';
end;
$$;

revoke all on function public.upsert_my_progress_snapshot(uuid, bigint, jsonb) from public;
grant execute on function public.upsert_my_progress_snapshot(uuid, bigint, jsonb) to authenticated;
