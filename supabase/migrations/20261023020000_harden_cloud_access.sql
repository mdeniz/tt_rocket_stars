-- Restrict browser writes to ownership-aware RPCs while retaining RLS-scoped reads.
-- Pilot upserts remain table-backed because the client supplies only its own
-- authenticated user id and the existing INSERT/UPDATE policies enforce it.

revoke all on table public.pilots from anon;
revoke all on table public.progress_snapshots from anon;
revoke insert, update, delete on table public.progress_snapshots from authenticated;

revoke all on function public.delete_my_cloud_data() from anon;
revoke all on function public.upsert_my_progress_snapshot(uuid, bigint, jsonb) from anon;

grant select on table public.pilots to authenticated;
grant select on table public.progress_snapshots to authenticated;
grant execute on function public.delete_my_cloud_data() to authenticated;
grant execute on function public.upsert_my_progress_snapshot(uuid, bigint, jsonb) to authenticated;
