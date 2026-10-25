# Spec Delta

## MODIFIED Requirements

### Requirement: Core screen actions preserve gameplay contracts

The application SHALL preserve mission selection, timers, auto-next behavior, audio feedback, rocket customization, coin balances, and achievement state while React owns a core screen. When the React gameplay flag is enabled, React-owned mission orchestration SHALL be authoritative for the migrated mission flow.

#### Scenario: React-owned mission setup starts gameplay

- **WHEN** a pilot selects tables, an operation, and a mission mode while the React gameplay flag is enabled
- **THEN** the React gameplay flow starts with the selected configuration
- **AND** timer, audio, answer progression, rewards, and local progress remain available offline

#### Scenario: Legacy fallback remains available

- **WHEN** the React gameplay flag is disabled or the React gameplay boundary cannot handle a supported action
- **THEN** the existing legacy gameplay flow starts with the selected configuration
- **AND** no pilot progress or backup data is removed

#### Scenario: Mission setup delegates to gameplay

- **WHEN** a pilot selects tables and a mission mode and starts a mission
- **THEN** the existing gameplay flow starts with the selected configuration when the React gameplay flag is disabled
- **AND** the timer, audio, answer progression, and local progress behavior remain unchanged

#### Scenario: Garage actions delegate to the existing rocket store

- **WHEN** a pilot equips or purchases a rocket part
- **THEN** the visible rocket and coin balance update
- **AND** the pilot-local garage storage remains compatible with existing backups

### Requirement: React actions delegate through a fail-closed legacy boundary

The application SHALL expose typed adapter actions for migrated mission setup and unsupported legacy integration without allowing React components to access legacy globals directly. The boundary SHALL fail closed when an action is invalid or unavailable.

#### Scenario: React-owned action is available

- **WHEN** a React screen invokes a supported mission action
- **THEN** the typed boundary validates the action and applies it through the React gameplay state
- **AND** any required legacy compatibility hook is invoked only through the boundary

#### Scenario: Legacy action is available

- **WHEN** a React screen invokes a supported mission or garage action while the React-owned path is unavailable
- **THEN** the adapter forwards the validated action and arguments to the corresponding legacy function
- **AND** the existing gameplay and persistence runtime remains authoritative

#### Scenario: Legacy action is unavailable

- **WHEN** a supported compatibility action is missing or throws
- **THEN** the boundary returns a failure result
- **AND** the React screen remains usable without a runtime exception or storage mutation

### Requirement: React migration has a legacy-compatible rollback path

The application SHALL retain stable screen identifiers, persistence keys, backup formats, and a legacy gameplay fallback until equivalent React coverage has passed.

#### Scenario: Legacy fallback

- **WHEN** the React core-screen or gameplay bridge is disabled or unavailable
- **THEN** the legacy screen remains navigable and playable
- **AND** no pilot progress or backup data is removed

#### Scenario: React rollback after a failed action

- **WHEN** a React-owned gameplay action fails before committing progress
- **THEN** the application leaves the current local state unchanged
- **AND** the pilot can continue through the legacy-compatible path
