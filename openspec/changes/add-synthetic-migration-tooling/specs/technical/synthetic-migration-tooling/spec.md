# Synthetic migration tooling

## Requirements

### Requirement: Allowlisted deterministic export
The tooling MUST accept only the documented synthetic source fields, reject unknown or credential-shaped fields, preserve account ownership references, and produce stable IDs, row counts, and SHA-256 checksums.

#### Scenario: Export synthetic fixture
- **WHEN** a valid `supabase-synthetic-v1` fixture is exported
- **THEN** the package contains only local schema rows with deterministic mappings and a verifiable manifest.

#### Scenario: Reject secret-shaped input
- **WHEN** a source record contains an unallowlisted password, token, or unknown field
- **THEN** export fails before any package is written.

### Requirement: Transactional local import
The importer MUST support dry-run validation, import all tables in one local PostgreSQL transaction, and record a package checksum for replay detection.

#### Scenario: Replay the same package
- **WHEN** an identical package is imported twice
- **THEN** the second import is reported as `replayed` and creates no duplicate rows.

#### Scenario: Import failure
- **WHEN** a table write fails during import
- **THEN** all writes from that package are rolled back.
