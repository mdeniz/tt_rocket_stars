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
snapshots; it does not delete local browser storage. The forward migration
`20261028164815_secure_cloud_deletion_rpc.sql` implements this function as a
narrow `SECURITY DEFINER` boundary with a fixed search path and explicit
`auth.uid()` ownership predicates because direct authenticated table deletes
are revoked.

The browser must never use a service-role key. This schema is intended to be
applied through Supabase migrations or the SQL editor by a project maintainer.

The client adapter in `src/lib/cloud-sync.js` consumes a serialized pilot
snapshot and writes synchronization metadata separately from the existing
local game keys. It returns `disabled`, `signed-out`, `not-found`, `uploaded`,
`downloaded`, `local-newer`, or `failed` results so offline gameplay does not
depend on network availability. Conflicts are resolved deterministically by
`updatedAt`, then snapshot version, then stable JSON ordering; the settings UI
is responsible for presenting status and retry controls.

## Private crew access contract

The crew model is additive to the cloud-progress model and does not change the
local pilot or snapshot payload shape.

- `pilots.management_mode` is `personal`, `school_only`, or `family_linked`.
  Existing and newly synchronized pilots default to `personal`.
- `crews.owner_user_id` identifies the account that owns a private crew.
- `crew_memberships` records account membership and its `owner`, `admin`, or
  `member` role. Membership is independently status-controlled and may expire.
- `pilot_access` grants one account an explicit `read` or `write` level for one
  pilot in one crew. Its `school` or `family` context is not inferred from
  crew membership.
- One pilot may be associated with multiple crews through multiple access rows;
  all rows still reference the same global pilot and progress snapshot.

The access matrix is intentionally narrow:

| Resource | Pilot owner | Active crew member | Explicit pilot grant | Anonymous |
| --- | --- | --- | --- | --- |
| Own pilot and snapshot | Read/write | No access by membership alone | Read/write according to existing owner contract | No access |
| Crew metadata | Owner | Read while active | Not sufficient alone | No access |
| Own membership | Read | Read | N/A | No access |
| Pilot access grant | Read for own pilot | No access by membership alone | Read for the granted account | No access |

The migration grants authenticated clients read access only. Crew creation,
membership changes, pilot grants, and revocation require trusted operations
defined by issue #56; no browser service-role key is permitted. RLS policies
still enforce the read boundary if a client changes identifiers. Removing a
membership or crew association does not delete the global pilot or snapshot.

Apply `20261023030000_crew_access_model.sql` after the existing cloud-progress
migrations. It is additive and can be rolled back before crew data exists; once
crew rows are in use, remove or alter them through a forward migration instead
of deleting the migration from deployment history.
