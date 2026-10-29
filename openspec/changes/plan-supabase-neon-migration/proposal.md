# Proposal: Plan the Supabase to Neon Migration

## Why

The repository now has local PostgreSQL/Drizzle and provider-neutral authentication foundations, but a production migration requires evidence-driven inventory, deterministic synthetic dry-runs, identity transition rules, reconciliation, rollback, and staged cutover gates.

## Scope

- Record a local, non-destructive audit of schema, identities, ownership, roles, backups, and frontend constraints.
- Define the migration runbook and evidence contract without accessing production systems.
- Split implementation into reviewable sub-issues with explicit dependencies.

## Safety boundary

This change does not export production data, contact real accounts, create hosted branches, change secrets, modify DNS, or switch traffic. Supabase password hashes and active sessions are not assumed portable to Better Auth.

## Proposed sub-issues

1. **Synthetic export/import tooling** — depends on #251 and #252; implement deterministic mapping, privacy filtering, checksums, counts, idempotency, and disposable-database dry-runs.
2. **Reconciliation and rollback rehearsal** — depends on the tooling issue and #253; verify ownership, progress versions, conflicts, recovery artifacts, and forward-fix/restore decisions.
3. **Identity transition and staged cutover readiness** — depends on #252 and the prior reconciliation evidence; define invitation/re-authentication/linking, feature-flag rollout, read-only fallback, staging gates, and the separately approved production checklist.
