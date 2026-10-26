# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
