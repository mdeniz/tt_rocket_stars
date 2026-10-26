# Tasks

## 1. Inventory and decision

- [ ] 1.1 Inventory browser, typed adapter, legacy, migration, test, CI, and operational data-access paths.
- [ ] 1.2 Compare Drizzle, Kysely, Prisma, and retaining SQL-only migrations against trusted-runtime, RLS, Edge, typing, migration, and portability criteria.
- [ ] 1.3 Record the selected option or an explicit defer decision with security and rollback consequences.

## 2. Typed domain boundary

- [ ] 2.1 Define typed contracts for pilots, crews, memberships, pilot access, and progress snapshots.
- [ ] 2.2 Implement provider-isolated repositories in the trusted runtime without importing them into the Vite client.
- [ ] 2.3 Preserve authenticated ownership, explicit grants, RLS, optimistic concurrency, deletion, and no-service-role guarantees.
- [ ] 2.4 Add contract tests for owned reads, granted reads, cross-account denial, stale writes, malformed payloads, and provider failures.

## 3. Migration workflow

- [ ] 3.1 Establish deterministic migration metadata and a clean-database application command.
- [ ] 3.2 Add CI schema validation, drift detection, and migration ordering checks.
- [ ] 3.3 Document local, CI, and Supabase application steps, transaction limits, forward fixes, backups, and recovery.
- [ ] 3.4 Verify generated or edited migrations preserve RLS policies, grants, security-definer functions, and existing payload fields.

## 4. Compatibility and verification

- [ ] 4.1 Verify local-first startup, offline gameplay, local storage keys, backups, pilot identifiers, and translations remain unchanged.
- [ ] 4.2 Run Supabase/RLS unit tests, relevant cloud-sync tests, build checks, and browser/offline suites.
- [ ] 4.3 Inspect generated artifacts for service-role credentials and provider-specific queries in the browser bundle.
- [ ] 4.4 Record empirical verification evidence for the running development application and leave unavailable tools explicit.
- [ ] 4.5 Review the issue acceptance criteria, OpenSpec requirements, CI results, security findings, and rollback readiness before marking done.
