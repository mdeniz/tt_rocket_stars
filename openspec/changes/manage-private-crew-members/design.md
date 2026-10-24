# Design

## Context

Issue #55 provides `crews`, `crew_memberships`, and `pilot_access` with authenticated read policies and no browser mutation grants. The existing application is a static Vite client with optional Supabase access; it has no trusted server runtime in the repository.

## Goals / Non-Goals

**Goals:**

- Put crew mutations behind a Supabase Edge Function or equivalent trusted backend.
- Authenticate the caller with the invited Supabase session and authorize against owner/admin membership.
- Keep invitations bounded, revocable, auditable, and independent from pilot access.
- Preserve offline-first gameplay and avoid leaking account existence through responses.

**Non-Goals:**

- No service-role key in Vite environment variables or client bundles.
- No public sign-up, public crew search, child email accounts, family linking, school-device sessions, dashboards, or challenges.
- No direct browser writes to crew tables.

## Decisions

- Use one trusted operation boundary with narrowly scoped commands rather than exposing a generic table proxy. This gives each mutation an explicit authorization check and audit event.
- Store invitation tokens hashed, with expiry, redemption, and revocation timestamps. Send only the raw one-time token through the configured transactional email provider.
- Return a generic invitation acceptance response for unknown or ineligible accounts. This prevents email enumeration while preserving useful administrator feedback.
- Reuse the authenticated session subject as the caller identity and perform authorization server-side. The browser receives only the public Supabase key and short-lived operation results.
- Keep crew membership changes independent from `pilot_access`; a later issue creates explicit pilot grants.

## Risks / Trade-offs

- [Risk] Edge Function deployment adds operational configuration → document secrets, local emulation, and rollback before enabling the UI.
- [Risk] Email delivery can expose timing differences → use bounded generic responses and avoid account-existence messages.
- [Risk] Concurrent role changes can race → use transactional updates and status checks in one database operation.

## Migration Plan

1. Verify issue #55 schema and RLS in a disposable Supabase project.
2. Add invitation/audit columns or tables through an additive migration.
3. Deploy the trusted operation function with server-only secrets.
4. Run two-account authorization, expiry, revocation, and browser-bundle checks.
5. Enable any client entry point only behind the existing feature-flag boundary.
6. Roll back by disabling the feature flag and function route; retain membership data for forward migration.
