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

The application SHALL read and write active-pilot data locally without requiring network access, SHALL keep each pilot's facts, mission history, rewards, coins, and progress independent, and SHALL preserve the existing local storage keys.

#### Scenario: Switch between valid pilots

- **WHEN** the user selects another stored pilot
- **THEN** the active storage view changes to that pilot's payload without mixing facts, mission history, rewards, coins, or progress between pilots

#### Scenario: Storage is unavailable

- **WHEN** the browser rejects a local storage read or write
- **THEN** the application remains playable, reports the limitation when appropriate, and does not intentionally remove other data

#### Scenario: Mission payload is persisted locally

- **WHEN** a completed mission updates facts, history, or rewards for the active pilot
- **THEN** the update is validated before commit and remains available offline through the existing pilot payload and backup contract

#### Scenario: Invalid mission payload is encountered

- **WHEN** persisted mission facts, history, reward details, or coin state are malformed
- **THEN** the application ignores the invalid portion safely or uses the last valid snapshot
- **AND** it does not delete unrelated valid pilot data

### Requirement: Backup envelopes are compatible and fail safe

The application SHALL export and restore a versioned backup envelope containing compatible pilot data, and SHALL leave the current state unchanged when validation fails. All local backup creation, listing, validation, restoration, import, export, and reset operations SHALL be available through the typed persistence boundary without changing existing storage keys or envelope fields.

#### Scenario: Compatible backup round-trip

- **WHEN** the user exports a valid backup and restores it later
- **THEN** the restored pilots and payloads match the exported data while retaining per-pilot separation
- **AND** the operation is performed through the typed persistence boundary

#### Scenario: Invalid backup is rejected

- **WHEN** the user selects a corrupt, unsupported, or structurally invalid backup
- **THEN** the application reports an error and preserves the current pilots and progress
- **AND** no replacement or reset mutation is performed

#### Scenario: Recovery backup precedes replacement

- **WHEN** the user restores an accepted backup or resets progress
- **THEN** the current compatible state is saved as a recovery backup before replacement
- **AND** a failed recovery backup prevents the replacement

#### Scenario: Backup storage is unavailable

- **WHEN** the browser rejects a backup read or write
- **THEN** the application reports the limitation without deleting unrelated progress
- **AND** the legacy-compatible rollback path remains available when the React ownership flag is disabled

### Requirement: Cloud snapshots use the persistence contract

The cloud synchronization boundary SHALL serialize and apply only validated pilot snapshots, preserving local data when cloud data is missing, malformed, or unavailable.

#### Scenario: Valid cloud snapshot is applied

- **WHEN** an authenticated cloud snapshot matches the pilot contract
- **THEN** the application can apply it to the selected pilot and retain the snapshot version metadata

#### Scenario: Invalid cloud snapshot is received

- **WHEN** a cloud response cannot be validated
- **THEN** the application reports synchronization failure and leaves the local pilot unchanged

### Requirement: Mission progress preserves compatible backup envelopes

The application SHALL include compatible mission facts, mission history, reward details, and coin state in existing pilot backups without changing the backup format or storage key names.

#### Scenario: Compatible mission backup round-trip

- **WHEN** the user exports and restores a backup containing mission progress
- **THEN** the restored pilot retains the same validated facts, history, rewards, coins, and existing unknown payload fields
- **AND** each restored value remains associated with its original pilot

#### Scenario: Invalid mission backup is rejected

- **WHEN** a backup contains malformed mission progress or reward data
- **THEN** the application rejects the replacement before mutating current pilots or progress
- **AND** the current local state remains recoverable through the legacy-compatible path
