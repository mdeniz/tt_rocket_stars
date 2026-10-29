# Design

## Evidence layers

1. **Repository and local inventory:** inspect committed Supabase SQL, Drizzle schema/migrations, Better Auth tables, role bootstrap, local integration tests, backup/restore drills, and browser persistence contracts.
2. **Synthetic migration:** generate data with no production identifiers, export approved fields, map IDs deterministically, and compare row counts/checksums plus ownership and uniqueness constraints.
3. **Staging readiness:** only after local evidence, validate an isolated hosted branch and provider recovery point with explicit credentials and approval.
4. **Cutover:** keep the frontend flag disabled and Supabase read-only fallback available until auth linking, reconciliation, rollback, and operational owners are signed off.

## Identity transition

Supabase password hashes are not transparently migrated. Active sessions are not migrated. Existing users receive an invitation, authenticate through an approved legacy/support path, set a Better Auth password, and explicitly confirm linking to the intended account. Ambiguous or duplicate mappings stop the import.

## Failure and rollback

Imports are idempotent and produce an evidence bundle containing source/target fingerprints, mapping counts, rejected rows, and checksums. A failed dry-run leaves the source untouched. A hosted failure uses a provider recovery point or tested forward fix; no destructive rollback command is run automatically.
