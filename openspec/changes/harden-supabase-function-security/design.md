# Design

## Context

The repository owns ordered PostgreSQL migrations for cloud progress and crew
access, while Supabase also contains provider-managed objects. The current
project uses RLS, authenticated RPCs, and `SECURITY DEFINER` crew helpers. A
read-only advisor audit found an enabled public RLS event trigger with default
public execution, a mutable timestamp-trigger search path, and disabled Auth
leaked-password protection. The browser must remain limited to publishable
configuration and user-scoped trusted operations.

## Goals / Non-Goals

**Goals:**

- Make every security-sensitive function and event-trigger boundary explicit and
  reproducible.
- Preserve RLS ownership checks, crew-policy behavior, optimistic concurrency,
  offline gameplay, and the existing migration history.
- Provide a safe operational procedure for Auth password-protection settings and
  advisor verification.

**Non-Goals:**

- Do not redesign crew features or introduce a new ORM.
- Do not move service-role credentials into the browser or commit them.
- Do not reset production data, recreate the project, or weaken RLS for debugging.

## Decisions

1. **Use additive forward migrations for database security changes.** Existing
   migration files remain immutable; a new migration records grants, function
   attributes, search paths, and indexes after the final intended state is
   confirmed in a non-destructive environment.
2. **Treat provider-managed event-trigger objects as explicit dependencies.** If
   `rls_auto_enable` is retained, its function ownership, event-trigger binding,
   and revoked Data API execution are documented and tested. If it is not
   required, removal requires a separate reviewed migration and advisor check.
3. **Keep `SECURITY DEFINER` only where RLS policy evaluation requires it.** Crew
   helpers retain narrowly scoped authenticated execution if policy evaluation
   depends on bypassing row visibility, with fixed search paths and tests for
   anonymous and cross-account denial.
4. **Configure leaked-password protection through Supabase Auth operations.** The
   dashboard/provider setting is documented and verified separately from SQL
   migration application because it is not represented by PostgreSQL DDL.
5. **Treat advisor output as acceptance evidence, not automatic remediation.**
   Foreign-key indexes are added only after query/index review; unused indexes
   are not removed solely because they have low current usage.

## Risks / Trade-offs

- [Risk] Revoking a helper grant can break RLS policy evaluation. → Verify policy
  behavior with authenticated and anonymous test identities before and after the
  migration.
- [Risk] Provider-managed event-trigger objects may not be reproducible from the
  repository alone. → Record the provider-managed exception and exact inspection
  query if ownership or deployment prevents migration control.
- [Risk] Auth password-policy changes can reject existing test credentials. → Use
  dedicated non-production test credentials and verify recovery/local-play
  behavior without logging passwords.
- [Risk] New indexes increase write and storage cost. → Add only indexes backed by
  advisor/query evidence and record the rationale in the schema documentation.

## Migration Plan

1. Inspect the current hosted function definitions, event triggers, ACLs, Auth
   setting, migration history, and advisors without mutation.
2. Add or update a reviewed migration and security tests in a branch; validate
   migration manifest and local schema contracts.
3. Apply the migration to a disposable or approved Supabase environment, run
   advisors, and execute account-isolation checks.
4. Configure leaked-password protection in Auth and verify invited password setup,
   recovery, and local offline continuation.
5. Deploy only after CI and connected Chrome evidence pass; retain the existing
   trusted-transport rollback flag and stable release artifact.

Rollback is a forward fix for schema changes: restore the prior grant or function
definition in a new migration after preserving evidence. Auth configuration can be
reverted through the provider settings only if the security owner approves it.

The current scope retains `rls_auto_enable` as a provider-managed event trigger and
hardens its Data API exposure rather than removing the trigger. Crew helpers retain
authenticated execution because the current RLS policies invoke them; their grants
are narrowed only where verification proves the policy path remains functional.
