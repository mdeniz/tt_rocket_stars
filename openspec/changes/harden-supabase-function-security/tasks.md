# Tasks

## 1. Database security contract

- [x] 1.1 Add a forward migration that records the retained `rls_auto_enable` event-trigger boundary, revokes its Data API execution from `anon` and `authenticated`, and verifies the event trigger remains enabled through a read-only catalog assertion.
- [x] 1.2 Harden `set_updated_at` with an explicit safe search path and document the intended trigger-only execution boundary; verify the function definition and grants through migration contract tests.
- [x] 1.3 Review `is_active_crew_member` and `is_active_crew_admin` grants against their RLS policy call sites, retain only required authenticated execution, and add anonymous/cross-account denial assertions to the schema security tests.
- [x] 1.4 Assess the advisor-reported foreign-key indexes using the current schema and query paths; add only justified indexes in the forward migration and verify the migration manifest and advisor result.

## 2. Authentication and operational configuration

- [ ] 2.1 Enable Supabase Auth leaked-password protection in the configured project without changing invited-account access rules, and verify the setting through the provider configuration or an approved read-only check.
- [x] 2.2 Update the Supabase operational documentation with the function-grant, event-trigger, search-path, Auth password-protection, and advisor verification procedures; verify every command is reproducible without secrets.

## 3. Verification and rollout

- [ ] 3.1 Run migration, schema-security, type, unit, build, and relevant local E2E checks; verify no service-role marker or existing local-storage contract changes appear in generated artifacts.
- [ ] 3.2 Apply the reviewed migration only in the approved Supabase environment, run security and performance advisors, and record the resulting findings without exposing credentials or user payloads.
- [ ] 3.3 Verify authenticated and anonymous function behavior, RLS ownership isolation, invited password setup/recovery, local offline continuation, and trusted cloud rollback in connected browser evidence; link the evidence from issue #226.

## Workflow follow-up

- Archive the change only after all acceptance criteria, CI, review, advisor, and hosted verification evidence are complete.
- Keep #184 and #170 in verification until their dependencies and compatibility exception are explicitly resolved.
