# Technical Specification: Supabase to Neon Migration Planning

## Requirements

### Requirement: Local migration audit is non-destructive

The migration planning change MUST inventory committed schema, migrations, identity boundaries, ownership, roles, backups, and frontend constraints without accessing production systems, real accounts, hosted secrets, DNS, or traffic.

#### Scenario: Audit runs without hosted credentials

- **WHEN** the audit and documentation checks run in local development
- **THEN** they use repository evidence and synthetic/local database evidence only
- **AND** they do not require Supabase, Neon, Cloudflare, email-provider, or production credentials

### Requirement: Synthetic migration evidence is deterministic

The migration plan MUST require deterministic identifier mapping, privacy filtering, row counts, null/duplicate counts, checksums, schema/privilege fingerprints, and idempotent dry-runs before hosted migration.

#### Scenario: Synthetic import is repeated

- **WHEN** the same synthetic export is imported twice into a disposable target
- **THEN** the second import produces no duplicate ownership records
- **AND** the evidence bundle reports stable counts and checksums

### Requirement: Identity transition is explicit

The migration plan MUST NOT assume Supabase password hashes or active sessions can be migrated to Better Auth. It MUST require invitation, re-authentication, and explicit account linking for existing users.

#### Scenario: Existing identity has no portable password or session

- **WHEN** an existing Supabase identity is mapped to the target account
- **THEN** the process creates no copied password hash or active session
- **AND** the user completes an approved invitation and re-authentication flow

### Requirement: Hosted cutover is gated by reconciliation and recovery

The plan MUST retain a read-only Supabase fallback and a disabled frontend migration flag until ownership reconciliation, progress conflict handling, backup/recovery rehearsal, and staged provider checks are approved.

#### Scenario: A staged cutover gate is incomplete

- **WHEN** reconciliation, recovery, or provider validation lacks evidence
- **THEN** traffic remains on the existing path
- **AND** the migration is recorded as verification-pending rather than complete
