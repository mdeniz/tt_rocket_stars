# Tasks

## 1. Inventory and decision

- [x] 1.1 Inventory browser, typed adapter, legacy, migration, test, CI, and operational data-access paths.
- [x] 1.2 Compare Drizzle, Kysely, Prisma, and retaining SQL-only migrations against trusted-runtime, RLS, Edge, typing, migration, and portability criteria.
- [x] 1.3 Record the selected option or an explicit defer decision with security and rollback consequences.

## 2. Typed domain boundary

- [x] 2.1 Define typed contracts for pilots, crews, memberships, pilot access, and progress snapshots.
- [x] 2.2 Implement provider-isolated repositories in the trusted runtime without importing them into the Vite client.
- [x] 2.3 Preserve authenticated ownership, explicit grants, RLS, optimistic concurrency, deletion, and no-service-role guarantees.
- [x] 2.4 Add contract tests for owned reads, granted reads, cross-account denial, stale writes, malformed payloads, and provider failures.

## 3. Migration workflow

- [x] 3.1 Establish deterministic migration metadata and a clean-database application command.
- [x] 3.2 Add CI schema validation, drift detection, and migration ordering checks.
- [x] 3.3 Document local, CI, and Supabase application steps, transaction limits, forward fixes, backups, and recovery.
- [x] 3.4 Verify generated or edited migrations preserve RLS policies, grants, security-definer functions, and existing payload fields.

## 4. Compatibility and verification

- [x] 4.1 Verify local-first startup, offline gameplay, local storage keys, backups, pilot identifiers, and translations remain unchanged.
- [x] 4.2 Run Supabase/RLS unit tests, relevant cloud-sync tests, build checks, and browser/offline suites.
- [x] 4.3 Inspect generated artifacts for service-role credentials and provider-specific queries in the browser bundle.
- [x] 4.4 Record empirical verification evidence for the running development application and leave unavailable tools explicit.
- [x] 4.5 Review the issue acceptance criteria, OpenSpec requirements, CI results, security findings, and rollback readiness before marking done.
