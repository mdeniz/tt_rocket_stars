# Proposal

## Why

The backend migration needs a provider-neutral PostgreSQL foundation before authentication and sync can be implemented. The current persistence boundary is Supabase-specific and cannot provide a clean, reproducible local database for testing account isolation, versions, or idempotency.

## What Changes

- Add a Drizzle schema and committed PostgreSQL migration for domain accounts, pilots, progress snapshots, durable sync operations, and future crew access tables.
- Add explicit tenant foreign keys, uniqueness constraints, ownership indexes, and positive snapshot version checks.
- Add a Docker PostgreSQL 16 local service, migration commands, reset tooling, and real PostgreSQL integration tests.
- Document local backup/restore and the separation between local defaults and future Neon environments.

## Capabilities

### New Capabilities

- `technical/local-postgres-foundation`: Defines the reproducible PostgreSQL schema, migration, isolation, and local verification behavior.

### Modified Capabilities

- None.

## Impact

Adds Drizzle ORM, Drizzle Kit, and the `postgres` driver; creates backend database modules and migrations; adds a disposable Docker service and integration tests. It does not connect to Neon, modify Supabase, access production data, or change frontend transport behavior.
