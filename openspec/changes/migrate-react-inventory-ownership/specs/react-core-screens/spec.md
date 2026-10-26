# Spec Delta

## MODIFIED Requirements

### Requirement: Core screen actions preserve gameplay contracts

The application SHALL preserve mission selection, timers, auto-next behavior, audio feedback, rocket customization, coin balances, and achievement state while React owns a core screen.

#### Scenario: Mission setup delegates to gameplay

- **WHEN** a pilot selects tables and a mission mode and starts a mission
- **THEN** the existing gameplay flow starts with the selected configuration
- **AND** the timer, audio, answer progression, and local progress behavior remain unchanged

#### Scenario: Garage actions delegate to the existing rocket store

- **WHEN** a pilot previews, purchases, or equips a rocket part from the flag-enabled React garage
- **THEN** the visible rocket and coin balance update from the typed inventory boundary
- **AND** the pilot-local garage storage remains compatible with existing backups
- **AND** disabling the React core flag restores the legacy garage behavior

### Requirement: React actions delegate through a fail-closed legacy boundary

The application SHALL expose typed adapter actions for mission setup, rocket customization, and achievement refresh without allowing React components to access legacy globals directly.

#### Scenario: Legacy action is available

- **WHEN** a React screen invokes a supported mission or garage action
- **THEN** the adapter forwards the validated action to the active typed ownership boundary or its legacy fallback
- **AND** the existing gameplay and persistence runtime remains compatible

#### Scenario: Legacy action is unavailable

- **WHEN** a supported legacy action is missing or throws while the fallback path is active
- **THEN** the adapter returns `false`
- **AND** the React screen remains usable without a runtime exception or storage mutation
