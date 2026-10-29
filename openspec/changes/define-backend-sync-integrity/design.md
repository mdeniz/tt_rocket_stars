# Design

The sync service is account-scoped and provider-neutral. It accepts a server
resolved identity, validated versioned payload, expected version, and durable
operation ID. One PostgreSQL transaction owns idempotency lookup, concurrency
check, pilot/progress mutation, and operation-result persistence.

The operation key is unique per account. A matching request hash replays the
original result; a mismatched hash is rejected. Stale versions fail before
mutation. Client retries use the same operation key after ambiguous transport
outcomes. The client continues to own local progress and recovery backups.

Hosted RLS, provider quotas, and migration correctness are separate gates. No
Supabase session, production row, or traffic path is changed by this audit.
