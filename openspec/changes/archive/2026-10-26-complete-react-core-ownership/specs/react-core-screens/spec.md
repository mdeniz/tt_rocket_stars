# Spec Delta

## MODIFIED Requirements

### Requirement: Core screen actions preserve gameplay contracts

The application SHALL preserve mission selection, timers, auto-next behavior,
audio feedback, rocket customization, coin balances, and achievement state
while React owns the corresponding core screen and state adapter.

#### Scenario: Mission setup delegates to gameplay

- **WHEN** a pilot selects tables and a mission mode and starts a mission from
  a React-owned screen
- **THEN** the existing gameplay flow starts with the selected configuration
- **AND** timer, audio, answer progression, and local progress remain unchanged

#### Scenario: Garage actions delegate to the existing rocket store

- **WHEN** a pilot equips or purchases a rocket part through a React-owned screen
- **THEN** the visible rocket and coin balance update
- **AND** the pilot-local garage storage remains compatible with existing backups

### Requirement: React migration has a legacy-compatible rollback path

The application SHALL retain stable screen identifiers and a reversible legacy
fallback until equivalent React ownership coverage has passed.

#### Scenario: Legacy fallback

- **WHEN** the React ownership flag is disabled or unavailable
- **THEN** the legacy screen remains navigable
- **AND** no pilot progress, inventory, achievement, or backup data is removed

## ADDED Requirements

### Requirement: React core ownership is opt-in and offline-first

React ownership MUST remain disabled by default and MUST not require
authentication or network access for local gameplay.

#### Scenario: Default release behavior

- **WHEN** a user opens the published release without an explicit rollout
- **THEN** the stable legacy path remains active
- **AND** local gameplay and pilot persistence remain available offline

#### Scenario: Opt-in offline behavior

- **WHEN** an internal environment enables React ownership and the network is
  unavailable
- **THEN** core navigation and supported gameplay remain usable
- **AND** no network failure replaces or deletes local state
