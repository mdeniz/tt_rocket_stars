# Supabase cloud progress schema

The migration in `supabase/migrations/` is the source of truth for the optional
cloud synchronization data model. It is additive to the offline-first client:
local pilots, progress, backups, and gameplay remain usable when Supabase is
not configured or unavailable.

## Ownership contract

- `pilots.user_id` references `auth.users.id` and identifies the owning account.
- `pilots.local_id` preserves the client-side pilot identity and is unique per account.
- `progress_snapshots` stores one replaceable, versioned JSON snapshot per pilot.
- The composite foreign key prevents a snapshot from being attached to another account's pilot.
- `created_at` and `updated_at` are UTC timestamps maintained by the database.
- `payload` is the compatibility boundary for the existing local pilot/progress model; it is not interpreted by the database.

Both tables have RLS enabled. The anonymous role has no policies, and the
authenticated policies compare `user_id` with `auth.uid()`. Snapshot writes
also require ownership of the referenced pilot. Account deletion uses the
authenticated `delete_my_cloud_data()` function and cascades from pilots to
snapshots; it does not delete local browser storage.

The browser must never use a service-role key. This schema is intended to be
applied through Supabase migrations or the SQL editor by a project maintainer.
