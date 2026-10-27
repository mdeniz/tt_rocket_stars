-- The optimistic snapshot RPC is SECURITY INVOKER and enforces ownership with
-- auth.uid(). Restore only the table privileges it needs to insert or update
-- rows while keeping anonymous access revoked and RLS as the enforcement layer.

grant insert, update on table public.progress_snapshots to authenticated;
