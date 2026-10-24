# typed-pilot-persistence Specification

## Purpose
This capability defines a validated persistence boundary for pilot profiles, progress payloads, backups, and cloud-compatible snapshots while preserving the existing offline-first storage contract.

## Requirements

### Requirement: Persisted pilot data is validated at the boundary

The application SHALL validate profile collections, active-pilot references, payloads, and backup envelopes before using them, while preserving compatible legacy data.

#### Scenario: Valid legacy profiles are loaded

- **WHEN** the browser contains a compatible existing profile collection and legacy payload keys
- **THEN** the application loads the profiles without changing their identifiers, ownership, or progress

#### Scenario: Malformed profile data is encountered

- **WHEN** a persisted profile value is invalid or cannot be parsed
- **THEN** the application ignores the invalid value safely and does not delete unrelated valid progress

### Requirement: Pilot persistence remains isolated and offline-first

The application SHALL read and write active-pilot data locally without requiring network access, and SHALL keep each pilot's progress independent.

#### Scenario: Switch between valid pilots

- **WHEN** the user selects another stored pilot
- **THEN** the active storage view changes to that pilot's payload without mixing progress between pilots

#### Scenario: Storage is unavailable

- **WHEN** the browser rejects a local storage read or write
- **THEN** the application remains playable, reports the limitation when appropriate, and does not intentionally remove other data

### Requirement: Backup envelopes are compatible and fail safe

The application SHALL export and restore a versioned backup envelope containing compatible pilot data, and SHALL leave the current state unchanged when validation fails.

#### Scenario: Compatible backup round-trip

- **WHEN** the user exports a valid backup and restores it later
- **THEN** the restored pilots and payloads match the exported data while retaining per-pilot separation

#### Scenario: Invalid backup is rejected

- **WHEN** the user selects a corrupt, unsupported, or structurally invalid backup
- **THEN** the application reports an error and preserves the current pilots and progress

### Requirement: Cloud snapshots use the persistence contract

The cloud synchronization boundary SHALL serialize and apply only validated pilot snapshots, preserving local data when cloud data is missing, malformed, or unavailable.

#### Scenario: Valid cloud snapshot is applied

- **WHEN** an authenticated cloud snapshot matches the pilot contract
- **THEN** the application can apply it to the selected pilot and retain the snapshot version metadata

#### Scenario: Invalid cloud snapshot is received

- **WHEN** a cloud response cannot be validated
- **THEN** the application reports synchronization failure and leaves the local pilot unchanged
