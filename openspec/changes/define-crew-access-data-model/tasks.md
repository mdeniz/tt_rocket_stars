# Tasks

## 1. Data contract and migration

- [ ] 1.1 Define the Account, Pilot, Crew, CrewMembership, PilotAccess, and managed-pilot state contract in `docs/supabase-schema.md`, including ownership and access matrix; verify every relationship maps to a documented issue #55 acceptance criterion.
- [ ] 1.2 Add an additive Supabase migration for private crews, memberships, explicit pilot access, expiry/status fields, constraints, indexes, and foreign keys; verify it follows the existing migration order and does not alter local-storage or snapshot payload contracts.
- [ ] 1.3 Add grants and RLS policies for every new table, denying anonymous access and preventing membership-only pilot reads/writes; verify policy text covers cross-account queries and explicit access levels.

## 2. Security and compatibility verification

- [ ] 2.1 Extend schema contract tests to assert new tables, ownership constraints, anonymous denial, and absence of service-role credentials; verify `npm run test:unit -- tests/unit/supabase-schema.test.cjs` passes.
- [ ] 2.2 Add an integration fixture or documented SQL verification for two authenticated accounts covering membership without pilot access, explicit access, revocation, and deletion boundaries; verify unauthorized rows are never returned.
- [ ] 2.3 Run `npm run check`, the cloud-sync unit suite, and the existing Playwright cloud/offline suites; verify offline gameplay and existing pilot/backups remain unchanged.

## 3. Delivery documentation

- [ ] 3.1 Document migration application order, rollback limits, and the boundary between issue #55 data contracts and issue #56 administration operations; verify all commands and table names match the migration.
- [ ] 3.2 Perform Chrome DevTools empirical verification against a configured local or hosted Supabase environment, confirming no browser service-role key, no anonymous crew data access, and unchanged offline startup; record the result in the PR and issue #55.

## Workflow follow-up

- Archive the OpenSpec change after implementation, review, CI, and empirical verification are complete.
- Close issue #55 only when all acceptance criteria and its integration evidence are complete.
