# Spec Delta

## MODIFIED Requirements

### Requirement: Pilot persistence remains isolated and offline-first

The application SHALL read and write active-pilot data locally without requiring network access, SHALL keep each pilot's facts, mission history, rewards, coins, and progress independent, SHALL preserve the existing local storage keys, and SHALL expose profile lifecycle operations through the typed ownership boundary when the React ownership flag is enabled. Legacy persistence bridges SHALL remain available until equivalent typed operations and rollback evidence are complete.

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

#### Scenario: Profile lifecycle is owned by the typed boundary

- **WHEN** the React ownership flag is enabled and the user creates, selects, renames, or deletes a local pilot
- **THEN** the operation validates and commits through the typed persistence boundary
- **AND** the active pilot, language, payload, and compatible unknown fields remain isolated
- **AND** the operation remains available offline without invoking a legacy profile mutator

#### Scenario: Profile lifecycle falls back safely

- **WHEN** the React ownership flag is disabled or a typed profile operation cannot commit
- **THEN** the legacy-compatible profile path remains available
- **AND** the current valid pilot payload is not intentionally deleted or replaced

#### Scenario: Persistence bridge retirement

- **WHEN** the release audit evaluates a legacy profile or progress bridge for removal
- **THEN** it verifies typed parity, backup round-trip compatibility, cloud snapshot compatibility, disabled-flag rollback, and browser evidence
- **AND** it retains the bridge if any check is incomplete

### Requirement: Cloud snapshots use the persistence contract

The cloud synchronization boundary SHALL serialize and apply only validated pilot snapshots, preserving local data when cloud data is missing, malformed, or unavailable. The legacy cloud bridge SHALL remain available until authenticated synchronization, deletion, conflict, redirect, and rollback evidence is complete.

#### Scenario: Valid cloud snapshot is applied

- **WHEN** an authenticated cloud snapshot matches the pilot contract
- **THEN** the application can apply it to the selected pilot and retain the snapshot version metadata

#### Scenario: Invalid cloud snapshot is received

- **WHEN** a cloud response cannot be validated
- **THEN** the application reports synchronization failure and leaves the local pilot unchanged

#### Scenario: Cloud bridge retirement

- **WHEN** the release audit evaluates the legacy cloud compatibility bridge for removal
- **THEN** it verifies authenticated access, RLS isolation, conflict handling, account deletion, redirect recovery, no privileged browser credential, and local-first offline behavior
- **AND** it retains the bridge when provider or browser evidence is unavailable
