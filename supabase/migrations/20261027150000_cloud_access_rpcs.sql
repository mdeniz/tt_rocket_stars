-- Route trusted cloud reads and pilot writes through ownership-bound RPCs.
-- This avoids the project Data API table routes that can stall under load.

create or replace function public.upsert_my_pilot(
  p_local_id text,
  p_name text,
  p_avatar text,
  p_language text,
  p_payload jsonb,
  p_updated_at timestamptz
)
returns public.pilots
language plpgsql
security invoker
set search_path = public
as $$
declare
  result public.pilots;
begin
  if (select auth.uid()) is null then
    raise exception 'authenticated user required' using errcode = '42501';
  end if;

  insert into public.pilots (user_id, local_id, name, avatar, language, payload, updated_at)
  values ((select auth.uid()), p_local_id, p_name, p_avatar, p_language, coalesce(p_payload, '{}'::jsonb), p_updated_at)
  on conflict (user_id, local_id) do update set
    name = excluded.name,
    avatar = excluded.avatar,
    language = excluded.language,
    payload = excluded.payload,
    updated_at = excluded.updated_at
  returning * into result;

  return result;
end;
$$;

create or replace function public.list_my_pilots()
returns setof public.pilots
language sql
security invoker
set search_path = public
as $$
  select *
  from public.pilots
  where user_id = (select auth.uid())
  order by updated_at desc
  limit 50;
$$;

create or replace function public.read_my_pilot(p_local_id text)
returns public.pilots
language sql
security invoker
set search_path = public
as $$
  select *
  from public.pilots
  where user_id = (select auth.uid()) and local_id = p_local_id
  limit 1;
$$;

create or replace function public.read_my_progress_snapshot(p_pilot_id uuid)
returns public.progress_snapshots
language sql
security invoker
set search_path = public
as $$
  select *
  from public.progress_snapshots
  where user_id = (select auth.uid()) and pilot_id = p_pilot_id
  limit 1;
$$;

revoke all on function public.upsert_my_pilot(text, text, text, text, jsonb, timestamptz) from public, anon;
revoke all on function public.list_my_pilots() from public, anon;
revoke all on function public.read_my_pilot(text) from public, anon;
revoke all on function public.read_my_progress_snapshot(uuid) from public, anon;
grant execute on function public.upsert_my_pilot(text, text, text, text, jsonb, timestamptz) to authenticated;
grant execute on function public.list_my_pilots() to authenticated;
grant execute on function public.read_my_pilot(text) to authenticated;
grant execute on function public.read_my_progress_snapshot(uuid) to authenticated;
