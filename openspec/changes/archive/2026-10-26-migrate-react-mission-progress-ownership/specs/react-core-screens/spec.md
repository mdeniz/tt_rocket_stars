# Spec Delta

## MODIFIED Requirements

### Requirement: Core screen actions preserve gameplay contracts

The application SHALL preserve mission selection, timers, auto-next behavior, audio feedback, rocket customization, coin balances, achievement state, and mission-progress persistence while React owns a core screen.

#### Scenario: Mission setup delegates to gameplay

- **WHEN** a pilot selects tables and a mission mode and starts a mission
- **THEN** the existing gameplay flow starts with the selected configuration
- **AND** the timer, audio, answer progression, and local progress behavior remain unchanged

#### Scenario: Flagged React mission completion persists progress

- **WHEN** the React mission ownership flag is enabled and a pilot completes a mission
- **THEN** validated fact updates, mission history, reward details, and coin changes are committed to that pilot's local payload
- **AND** the visible result reflects the committed reward without requiring network access

#### Scenario: Invalid mission persistence does not replace progress

- **WHEN** a flagged React mission payload cannot be validated or written
- **THEN** the migration reports a recoverable failure and leaves the last valid local payload unchanged
- **AND** the pilot can continue playing or use the legacy rollback path

#### Scenario: Garage actions delegate to the existing rocket store

- **WHEN** a pilot equips or purchases a rocket part
- **THEN** the visible rocket and coin balance update
- **AND** the pilot-local garage storage remains compatible with existing backups

## ADDED Requirements

### Requirement: Flagged mission ownership retains a legacy-compatible rollback path

The application SHALL keep the legacy mission runtime authoritative whenever the React mission ownership flag is disabled, unavailable, or unable to complete a validated operation.

#### Scenario: Legacy mission fallback

- **WHEN** the mission ownership flag is disabled or the typed mission boundary is unavailable
- **THEN** `public/legacy/scripts/03.js` handles mission facts, history, rewards, and coin updates as before
- **AND** no storage keys or existing progress are removed

#### Scenario: Mission rollback after a failed write

- **WHEN** a flagged mission write fails after a prior valid snapshot exists
- **THEN** the prior snapshot remains readable
- **AND** the application does not silently merge partial facts, history, or rewards into it
