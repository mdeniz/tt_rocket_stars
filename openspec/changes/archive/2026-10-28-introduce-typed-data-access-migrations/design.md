# Design

## Current state

The browser currently uses the publishable Supabase client and a compatibility cloud
adapter. The repository has ordered SQL migrations for pilots, progress snapshots,
optimistic concurrency, hardening, and crew access. RLS and security-definer functions
are part of the security boundary and must remain explicit SQL rather than being hidden
behind an ORM default.

## Proposed boundary

Add a trusted data-access package outside the Vite client. It will expose domain
operations such as `listOwnedPilots`, `readGrantedPilot`, `upsertProgressSnapshot`,
`listCrewMemberships`, and `revokePilotAccess`. The browser-facing adapter will call
only this boundary or the existing compatible path during migration; it will not import
an ORM or issue arbitrary table queries.

The first option to evaluate is Drizzle ORM with PostgreSQL support and its migration
tooling because it provides TypeScript-inferred rows, a small runtime footprint, and an
explicit SQL escape hatch for RLS policies and security-definer functions. Prisma and
Kysely remain comparison candidates: Prisma has a heavier client and Edge/runtime
constraints, while Kysely is a strong query-builder alternative but requires more
application-level conventions for schema typing and migration ownership.

The decision record must confirm whether Drizzle is viable for the selected trusted
runtime. If it is not, the repository must document an explicit defer decision and keep
the existing SQL migrations as the sole source of truth rather than introducing two
competing schemas.

## Migration source of truth

The checked-in migration history remains the authoritative ordered source. If a typed
tool is adopted, generated migration SQL must be reviewed, committed into the existing
migration directory, and validated for RLS, grants, functions, and policies. ORM metadata
must not silently replace security-sensitive SQL. A clean-database check, drift check,
and Supabase dry-run/application procedure will guard the boundary.

## Rollout

1. Inventory current access paths and freeze the domain contracts.
2. Produce the option decision and validate the selected runtime in an isolated module.
3. Add typed repositories and contract tests without changing browser behavior.
4. Add migration validation, drift detection, and recovery documentation.
5. Run local-first, RLS, cloud-sync, and build/browser evidence before any runtime cutover.
6. Promote the adapter incrementally behind the existing compatibility boundary.

No service-role key is exposed to the browser, and no production data migration is
included in this change without a separate approved rollout.
