# Migration reconciliation

## Requirements

### Requirement: Reconcile local migration contents
The migration tooling MUST compare imported local rows against the package counts and checksums without exposing row payloads in the report.

#### Scenario: A complete synthetic package reconciles
- **WHEN** a package containing accounts, pilots, progress snapshots, crews, memberships, and access grants is imported into local PostgreSQL
- **THEN** reconciliation reports `passed: true`, validates ownership, and reports no mismatches.

### Requirement: Prove rollback and recovery
The local rehearsal MUST prove that a failed import leaves no partial data or replay ledger and that a subsequent retry can import and replay the package.

#### Scenario: Import fails atomically and recovers
- **WHEN** an import is forced to fail after a table write
- **THEN** all rows and the package ledger are absent, a retry imports successfully, and an identical replay is reported as `replayed`.
