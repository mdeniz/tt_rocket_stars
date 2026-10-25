# Spec Delta

## MODIFIED Requirements

### Requirement: Pilot persistence remains isolated and offline-first

The application SHALL read and write active-pilot data through the React-owned
persistence boundary when enabled, without requiring network access, and SHALL
keep each pilot's progress independent.

#### Scenario: Switch between valid pilots

- **WHEN** the user selects another stored pilot from a React-owned screen
- **THEN** the active storage view changes to that pilot's payload
- **AND** the previous pilot's progress, inventory, and achievements remain
  isolated

#### Scenario: Storage is unavailable

- **WHEN** the browser rejects a local storage read or write while React owns a
  core screen
- **THEN** the application remains playable using the existing fallback
- **AND** it does not intentionally remove other data

### Requirement: Backup envelopes are compatible and fail safe

The application SHALL export and restore the existing versioned backup envelope
from React-owned controls, and SHALL leave the current state unchanged when
validation fails.

#### Scenario: Compatible backup round-trip

- **WHEN** the user exports a valid backup and restores it later through a
  React-owned control
- **THEN** the restored pilots and payloads match the exported data
- **AND** per-pilot separation remains intact

#### Scenario: Invalid backup is rejected

- **WHEN** the user selects a corrupt, unsupported, or structurally invalid
  backup through a React-owned control
- **THEN** the application reports an error
- **AND** current pilots and progress remain unchanged
