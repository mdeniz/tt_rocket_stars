-- Persist the pilot and its progress snapshot through one authenticated RPC.

create or replace function public.upsert_my_pilot_and_progress_snapshot(
  p_local_id text,
  p_name text,
  p_avatar text,
  p_language text,
  p_pilot_payload jsonb,
  p_updated_at timestamptz,
  p_expected_version bigint,
  p_snapshot_payload jsonb
)
returns public.progress_snapshots
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_pilot_id uuid;
  next_snapshot public.progress_snapshots;
begin
  perform set_config('lock_timeout', '2s', true);

  if v_user_id is null then
    raise exception 'authenticated user required' using errcode = '42501';
  end if;

  insert into public.pilots (user_id, local_id, name, avatar, language, payload, updated_at)
  values (v_user_id, p_local_id, p_name, p_avatar, p_language, coalesce(p_pilot_payload, '{}'::jsonb), p_updated_at)
  on conflict (user_id, local_id) do update set
    name = excluded.name,
    avatar = excluded.avatar,
    language = excluded.language,
    payload = excluded.payload,
    updated_at = excluded.updated_at
  returning id into v_pilot_id;

  update public.progress_snapshots
  set version = version + 1,
      payload = coalesce(p_snapshot_payload, '{}'::jsonb)
  where progress_snapshots.pilot_id = v_pilot_id
    and progress_snapshots.user_id = v_user_id
    and version = coalesce(p_expected_version, 0)
  returning * into next_snapshot;

  if next_snapshot.id is not null then
    return next_snapshot;
  end if;

  if exists (
    select 1 from public.progress_snapshots
    where progress_snapshots.pilot_id = v_pilot_id
      and progress_snapshots.user_id = v_user_id
  ) or coalesce(p_expected_version, 0) <> 0 then
    raise exception 'snapshot version conflict' using errcode = '40001';
  end if;

  begin
    insert into public.progress_snapshots (user_id, pilot_id, version, payload)
    values (v_user_id, v_pilot_id, 1, coalesce(p_snapshot_payload, '{}'::jsonb))
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

revoke all on function public.upsert_my_pilot_and_progress_snapshot(text, text, text, text, jsonb, timestamptz, bigint, jsonb) from public, anon;
grant execute on function public.upsert_my_pilot_and_progress_snapshot(text, text, text, text, jsonb, timestamptz, bigint, jsonb) to authenticated;
