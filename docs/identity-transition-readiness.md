# Identity transition and staged cutover readiness

This runbook defines the Supabase-to-Better-Auth identity transition. It is a readiness contract, not an execution authorization. Local work uses synthetic data and Docker PostgreSQL only.

## Identity rules

- Supabase password hashes are not assumed portable and MUST NOT be copied into Better Auth.
- Existing Supabase sessions MUST NOT be migrated. The cutover invalidates them and requires a new login.
- Existing users transition by invitation, re-authentication through an approved legacy/support path, creation of a new Better Auth password, and explicit linking to the intended Account after identity verification.
- Duplicate, ambiguous, unverified, or already-linked mappings stop the transition and enter manual recovery; no automatic merge is allowed.
- Invitation tokens are single-use, time-limited, and never logged. Password reset links are delivered through the configured provider only after hosted approval; local tests capture deterministic links without delivery.

## Runtime boundary and fallback

The frontend flag `VITE_BETTER_AUTH_ENABLED` defaults to `false` and is not enabled by a local or production build accidentally. While disabled, offline-first gameplay and existing local storage remain authoritative. A legacy Supabase read-only fallback may discover migration status but MUST NOT write passwords, sessions, or new ownership records.

## Staged gates

1. **Local synthetic:** run package validation, reconciliation, rollback, recovery, and cross-account isolation evidence.
2. **Hosted staging (approval required):** use an isolated database/provider account, verify invitation and re-authentication, session invalidation, rate limits, recovery, backups, and observability.
3. **Canary (approval required):** invite a bounded cohort, keep the legacy path read-only, compare ownership/progress reconciliation, and record rollback readiness.
4. **Cutover (separate written approval):** freeze legacy writes, invalidate active sessions, enable Better Auth for the approved cohort, publish the recovery point, and record owners/timestamps.
5. **Rollback/forward fix:** stop on reconciliation or identity ambiguity; preserve evidence, restore the approved recovery point or apply a tested forward fix, and keep local gameplay available.

## Required evidence and approval checklist

The cutover packet MUST include the package checksum and counts, account-linking decisions, invitation/re-authentication results, session invalidation evidence, backup/recovery identifier, rollback rehearsal, rate-limit and isolation results, monitoring owner, incident contact, start/stop timestamps, and explicit approvals from product, security, and operations. Hosted checks remain pending until those approvals and credentials exist.

No production credentials, provider accounts, DNS, traffic, or secrets are required or accessed by this repository check.
