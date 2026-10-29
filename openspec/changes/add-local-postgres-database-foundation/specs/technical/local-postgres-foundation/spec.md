# Local PostgreSQL Foundation Specification

## ADDED Requirements

### Requirement: Account-scoped domain records

The database MUST provide account records and require every pilot, progress snapshot, and sync operation to reference an existing account.

#### Scenario: Orphan domain record is rejected

- **WHEN** a pilot, snapshot, or sync operation references an unknown account
- **THEN** PostgreSQL rejects the write with a foreign-key violation

### Requirement: Tenant-consistent pilot snapshots

The database MUST enforce that a progress snapshot's account matches the account that owns its pilot.

#### Scenario: Cross-account snapshot is rejected

- **GIVEN** a pilot owned by account A
- **WHEN** a snapshot for that pilot is written with account B
- **THEN** PostgreSQL rejects the write without changing either account's data

### Requirement: Positive optimistic versions

Progress snapshots MUST have a positive version value and MUST be unique per pilot so a later sync service can perform atomic version checks.

#### Scenario: Invalid snapshot version is rejected

- **WHEN** a snapshot is written with version zero or a negative version
- **THEN** PostgreSQL rejects the write with a check violation

### Requirement: Durable idempotency scope

Sync operation records MUST enforce uniqueness of `(account_id, operation_id)` and retain a request hash and result metadata.

#### Scenario: Duplicate operation key is rejected

- **GIVEN** an operation key already stored for an account
- **WHEN** the same account submits that operation key again
- **THEN** PostgreSQL rejects the duplicate key without creating a second operation record

### Requirement: Reproducible local verification

The repository MUST provide a Docker PostgreSQL service, committed Drizzle migration, one-command integration test runner, and documented disposable reset/backup commands.

#### Scenario: Clean-room database is bootstrapped

- **WHEN** the local database volume is reset and `npm run test:integration` is executed
- **THEN** migrations create all required tables and the real PostgreSQL integration suite passes

#### Scenario: Transaction rollback preserves consistency

- **WHEN** a transaction writes an account and then fails before commit
- **THEN** the account write is absent after rollback
