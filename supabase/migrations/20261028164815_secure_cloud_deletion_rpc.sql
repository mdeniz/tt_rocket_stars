-- Keep direct table mutations revoked while allowing the authenticated deletion RPC
-- to remove only rows owned by the current JWT subject.
create or replace function public.delete_my_cloud_data()
returns void
language sql
security definer
set search_path = public, pg_catalog
as $$
  delete from public.progress_snapshots where user_id = (select auth.uid());
  delete from public.pilots where user_id = (select auth.uid());
$$;

revoke all on function public.delete_my_cloud_data() from public, anon;
grant execute on function public.delete_my_cloud_data() to authenticated;
