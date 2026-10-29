# Design

## Context

The API runs behind Hono and Better Auth, with local PostgreSQL and a browser
that must remain offline-first. Existing logging and authorization boundaries
are useful foundations, but hosted operational concerns cannot be safely
validated from this repository without provider credentials and an approved
environment.

## Decisions

1. Use provider-neutral interfaces for request IDs, structured events, error
   monitoring, rate limiting, and deployment configuration. Adapters may be
   selected per environment but credentials remain server-side.
2. Treat local Docker PostgreSQL, synthetic identities, and deterministic tests
   as the default evidence source. Do not use production data or real email.
3. Fail closed for authorization and rate limits while failing open for local
   gameplay: backend unavailability must not remove local progress or backups.
4. Keep operational events aggregate and privacy-safe. Never record passwords,
   tokens, cookies, email bodies, child identifiers, pilot payloads, or answers.
5. Do not call an epic complete while hosted recovery, monitoring, quotas,
   deployment, or traffic evidence remains unavailable.

## Rollback

Documentation and OpenSpec changes are reversible without runtime impact. Each
follow-up implementation must use additive configuration, retain the current
frontend flag default, and document a local rollback command before enabling a
new backend boundary.
