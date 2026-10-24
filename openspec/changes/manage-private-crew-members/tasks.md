# Tasks

## 1. Trusted operation contract

- [ ] 1.1 Define the crew administration command and response contract, including owner/admin authorization, generic invitation responses, and localized client-safe errors; verify each response maps to an issue #56 acceptance criterion.
- [ ] 1.2 Add an additive invitation and audit schema with hashed single-use tokens, bounded expiry, revocation, redemption, and actor references; verify the migration preserves issue #55 ownership and pilot-access boundaries.
- [ ] 1.3 Implement the trusted backend/Edge Function operations for create, invite, role change, revoke, and reinstate; verify service-role credentials are available only server-side and direct browser mutations remain denied.

## 2. Authorization and reliability tests

- [ ] 2.1 Add two-account authorization tests for owner/admin/member behavior and cross-crew isolation; verify unauthorized operations leave membership and pilot data unchanged.
- [ ] 2.2 Add invitation tests for expiry, revocation, reuse, generic unknown-account responses, and bounded redemption; verify no email enumeration or duplicate membership occurs.
- [ ] 2.3 Add client tests for localized success/errors and provider failure; verify offline gameplay, local progress, backups, and cloud sync remain available.

## 3. Empirical verification and delivery

- [ ] 3.1 Verify the operation against a configured Supabase project using Chrome DevTools and two test accounts; confirm no service-role key appears in bundles or requests and record the result in the PR and issue #56.
- [ ] 3.2 Update operational documentation with secrets, email provider, deployment order, rollback, and feature-flag enablement; verify all commands are reproducible without committing secrets.

## Workflow follow-up

- Archive the OpenSpec change after implementation, review, CI, and empirical verification are complete.
- Close issue #56 only after issue #55 RLS verification and all acceptance criteria pass.
