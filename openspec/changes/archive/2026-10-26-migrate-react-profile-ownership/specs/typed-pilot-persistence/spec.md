# Spec Delta

## MODIFIED Requirements

### Requirement: Pilot persistence remains isolated and offline-first

The application SHALL read and write active-pilot data locally without requiring network access, SHALL keep each pilot's facts, mission history, rewards, coins, and progress independent, SHALL preserve the existing local storage keys, and SHALL expose profile lifecycle operations through the typed ownership boundary when the React ownership flag is enabled.

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
