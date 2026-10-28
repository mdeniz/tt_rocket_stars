-- Bound pilot-row contention before a snapshot write can reach the database.

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
  perform set_config('lock_timeout', '2s', true);

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
exception
  when lock_not_available then
    raise exception 'cloud snapshot is busy' using errcode = '55P03';
end;
$$;

revoke all on function public.upsert_my_pilot(text, text, text, text, jsonb, timestamptz) from public, anon;
grant execute on function public.upsert_my_pilot(text, text, text, text, jsonb, timestamptz) to authenticated;
