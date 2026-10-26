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

#### Scenario: Flagged React speed missions expire at the supported limit

- **WHEN** the React mission ownership flag is enabled and a pilot starts a speed mission
- **THEN** the visible 60-second countdown advances while the mission is active
- **AND** the mission completes at zero through the same compatible result and persistence path as other timed missions
