# Tasks

## 1. Schema and migrations

- [x] 1.1 Add Drizzle schema for accounts, pilots, snapshots, idempotency operations, and future crew access tables.
- [x] 1.2 Generate and commit a clean-room PostgreSQL migration with tenant constraints, indexes, and positive version checks.

## 2. Local operations

- [x] 2.1 Add Docker PostgreSQL 16 Compose configuration with non-production defaults.
- [x] 2.2 Add migration, reset, and one-command integration test scripts; document backup/restore and Neon injection boundaries.

## 3. Verification

- [x] 3.1 Add real PostgreSQL tests for clean-room migration, cross-account isolation, idempotency uniqueness, invalid versions, and rollback.
- [ ] 3.2 Verify the complete #251 acceptance criteria, including hosted Neon backup/restore procedures, before marking the epic complete.
