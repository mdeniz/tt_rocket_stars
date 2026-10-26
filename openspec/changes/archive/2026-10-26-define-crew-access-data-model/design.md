# Design

## Context

The current Supabase schema has account-owned `pilots` and versioned `progress_snapshots`, protected by authenticated ownership policies. Issue #27 establishes the invited-account identity and cloud synchronization boundary. This change adds the minimum private-crew model needed by issue #56 while preserving the existing tables and offline-first client behavior.

## Goals / Non-Goals

**Goals:**

- Add explicit entities for crews, memberships, pilot access grants, and managed-pilot state.
- Make ownership and access checks database-enforced and testable with cross-account cases.
- Keep one global pilot record and preserve existing deletion semantics.
- Make future family linking and teacher metrics possible without granting access implicitly.

**Non-Goals:**

- No crew creation UI, invitation UI, family-link workflow, teacher dashboard, peer achievements, or challenge assignment.
- No service-role usage in the browser and no change to local storage or cloud snapshot payloads.

## Decisions

- Use relational tables with UUID primary keys and foreign keys to `auth.users`, `pilots`, and `crews`. This keeps authorization joins explicit and lets PostgreSQL enforce referential integrity.
- Model `crew_memberships` separately from `pilot_access` so being a member never implies pilot read/write access. A pilot access row carries an explicit access level and optional school/family context.
- Preserve `pilots.user_id` as the global owner. Managed pilots still have an owning account or controlled administrative owner; school-only access is represented by the access context, not by weakening ownership.
- Enable RLS on every new table. Policies use `auth.uid()` and ownership/access subqueries; anonymous roles receive no privileges. Any administrative mutation is deferred to trusted server-side operations in issue #56.
- Use status and expiry columns for memberships and access grants rather than hard deletion as the only lifecycle operation. This supports revocation and auditability while allowing later retention policies.
- Add unit assertions over migration text and, when local Supabase infrastructure is available, integration checks that exercise two authenticated identities. Existing cloud-sync tests remain unchanged.

## Risks / Trade-offs

- [Risk] Authorization joins can become complex and regress during later feature work → keep policies small, document the access matrix, and require cross-account tests for each new mutation.
- [Risk] Managed-pilot ownership semantics may need adjustment for a real school tenant model → keep school context scoped to explicit access rows and avoid introducing tenant-wide authority in this issue.
- [Risk] Existing deployed projects may not have the new migration applied → make the migration additive and document the required deployment order.

## Migration Plan

1. Apply the additive migration after the existing cloud-progress migrations.
2. Verify table privileges, RLS enablement, and cross-account denial in the SQL editor or local Supabase test environment.
3. Deploy no client behavior until issue #56 defines trusted crew administration operations.
4. Roll back by reverting the additive migration only before any crew rows are created; after adoption, use a forward migration to retire data safely.

