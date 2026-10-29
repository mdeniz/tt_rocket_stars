# Backend security operations

## Local PostgreSQL

Local migrations run as `tt_migrator` and application traffic runs as `tt_app`. The application role receives DML only on the application tables (`accounts`, `pilots`, `progress_snapshots`, `sync_operations`, `crews`, `crew_memberships`, and `pilot_access`) and the four Better Auth tables (`user`, `account`, `session`, and `verification`) plus explicitly required sequence usage. It does not own migrations or receive grants on unrelated tables. `scripts/check-local-database-privileges.cjs` is the contract used by tests; the local integration harness applies the grants through the admin role.

## Rate limiting

The API applies a bounded in-memory limiter keyed by Cloudflare's trusted client-address header and route; local requests use one deterministic fallback bucket. Local tests inject the clock and verify deterministic 429 behavior and `Retry-After`. Better Auth retains its own auth limiter. A hosted deployment MUST put this behind a trusted proxy and shared durable limiter (for example, a platform rate-limit service or coordinated store); those hosted checks are not available or required locally.

## Authorization evidence

Repository methods accept authenticated identity objects and derive ownership from the identity, never from a client-supplied account ID. The security tests cover missing identity, valid identity, forbidden ownership, revoked sessions, and cross-account resource access through synthetic identities. Production rollout remains approval-gated.
