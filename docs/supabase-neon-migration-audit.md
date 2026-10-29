# Supabase to Neon Migration Audit

This document is the local, non-destructive starting point for issue #254. It records what is known from the repository and local Docker PostgreSQL evidence. It does not inspect production Supabase, Neon, DNS, secrets, or real accounts.

## Current-state inventory

| Area | Current evidence | Migration implication |
| --- | --- | --- |
| Supabase schema | `supabase/migrations/`, `docs/supabase-schema.md`, RLS/security-hardening docs | Export the reviewed schema and privileges before any hosted cutover; treat SQL history as authoritative until reconciliation passes. |
| Neon-compatible schema | Drizzle schema under `apps/api/src/db/schema.ts` and migrations under `apps/api/drizzle/` | Apply to disposable PostgreSQL first; compare table, column, constraint, index, trigger, and privilege inventories. |
| Auth identity | Better Auth user/account/session tables; Supabase auth remains the existing frontend boundary | Do not copy password hashes or active sessions. Require invitation, re-authentication, and explicit account linking. |
| Ownership | Account owns pilots; crew membership and pilot access are explicit relationships | Every import and repository operation must preserve account ownership and reject ambiguous mappings. |
| Progress | Browser local storage remains offline-first; cloud snapshots use bounded/versioned writes | Export local and hosted snapshots separately, preserve pilot-local identity, and reconcile versions before enabling a remote adapter. |
| Roles | Local `tt_app`, `tt_migrator`, and admin roles are documented and tested | Hosted runtime, migration, and break-glass roles must remain separate and least-privileged. |
| Recovery | Synthetic local backup/restore and temporary-database drills exist | A hosted cutover requires a provider recovery point and a rehearsed rollback decision before traffic changes. |

## Required migration evidence

1. Export only approved, synthetic or explicitly authorized data into a controlled artifact; never log credentials, tokens, password hashes, or child PII.
2. Map identifiers deterministically. Record source-to-target IDs, row counts, null/duplicate counts, SHA-256 checksums, and schema/privilege fingerprints.
3. Run imports idempotently in a disposable Neon branch or local equivalent, then reconcile accounts, pilots, snapshots, crews, memberships, and ownership predicates.
4. Rehearse rollback using a provider recovery point or disposable database. Rollback must restore service state without deleting the source system.
5. Keep Supabase read-only fallback and the frontend migration flag disabled until identity linking, sync reconciliation, backups, and authorization evidence pass.

## Explicitly unavailable in this local phase

Production schema inventory, real-account export, Neon branch validation, provider recovery rehearsal, DNS/traffic cutover, and hosted email/session checks require separately approved staging access. They are not prerequisites for this audit PR and must not be simulated as passed.
