# Proposal: Migrate authentication and authorization

Issue #252 introduces a provider-neutral Better Auth boundary behind Hono while keeping the offline-first frontend unchanged. Local development must provide deterministic email/password users and sessions without email credentials or hosted services.

The slice adds invitation-only onboarding, password recovery callbacks, logout and session revocation, account-scoped authorization contracts, and PostgreSQL persistence compatible with the existing Drizzle foundation.

This change does not migrate Supabase password hashes or active sessions, enable the frontend, alter production infrastructure, or select an email provider.
