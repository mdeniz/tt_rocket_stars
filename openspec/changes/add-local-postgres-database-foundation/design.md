# Design

## Context

The target hosted database is Neon PostgreSQL, while development must remain credential-free and deterministic. The schema must enforce account ownership at the database boundary because later services must never trust client-supplied ownership identifiers.

## Goals / Non-Goals

**Goals:**

- Make a clean local PostgreSQL database reproducible from committed files.
- Represent account, pilot, snapshot, idempotency, and future crew ownership boundaries.
- Ensure composite tenant relationships cannot attach a pilot or snapshot to another account.
- Provide real-database tests for migration, constraints, idempotency uniqueness, and rollback.

**Non-Goals:**

- Implement Better Auth tables, sessions, invitation flows, or password reset.
- Implement sync service transactions or API routes.
- Connect to Neon or execute any hosted migration.

## Decisions

- Use text account identifiers so the domain account can map to Better Auth's provider-neutral user identifier without assuming Supabase UUIDs.
- Use UUID pilot/snapshot/crew identifiers and preserve a per-account `local_id` for offline profile reconciliation.
- Store opaque gameplay state in JSONB while keeping ownership, version, and idempotency metadata relational and constrained.
- Use a composite `(pilot_id, account_id)` foreign key for snapshots and a composite unique constraint on pilots so the database enforces tenant consistency.
- Use `account_id + operation_id` as the durable idempotency scope. A later sync service will compare the stored request hash before replaying a result.
- Keep crew tables additive and minimal; crew behavior remains a later epic after identity and sync are stable.
- Use Docker Compose with an explicit non-production port, credentials, and named volume. Hosted credentials are injected only through `DATABASE_URL` and are never committed.

## Migration and Recovery

The first migration is applied by Drizzle Kit. `npm run test:integration` starts local PostgreSQL, applies migrations, and runs real constraint/rollback tests. `npm run db:local:reset` removes only the disposable local Docker volume. Local logical backup and restore commands are documented separately from production operations.
