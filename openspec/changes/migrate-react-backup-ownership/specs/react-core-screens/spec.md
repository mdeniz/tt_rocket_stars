# Spec Delta

## MODIFIED Requirements

### Requirement: React actions delegate through a fail-closed legacy boundary

The application SHALL expose typed adapter actions for mission setup, rocket customization, achievement refresh, and backup controls without allowing React components to access legacy globals directly. Backup actions SHALL validate their inputs and preserve local state when storage or legacy compatibility services are unavailable.

#### Scenario: Legacy action is available

- **WHEN** a React screen invokes a supported mission, garage, achievement, or backup action
- **THEN** the adapter forwards the validated action and arguments to the corresponding implementation
- **AND** the existing gameplay and persistence runtime remains authoritative until the migrated ownership flag is enabled

#### Scenario: Legacy action is unavailable

- **WHEN** a supported legacy action is missing or throws
- **THEN** the adapter returns `false`
- **AND** the React screen remains usable without a runtime exception or storage mutation

#### Scenario: React backup ownership is enabled

- **WHEN** the backup ownership flag is enabled and a user creates, restores, imports, exports, or resets a backup
- **THEN** the typed backup boundary performs the operation
- **AND** the operation preserves the existing backup envelope and recovery guarantees

### Requirement: React migration has a legacy-compatible rollback path

The application SHALL retain stable screen identifiers and legacy behavior until equivalent React coverage has passed.

#### Scenario: Legacy fallback

- **WHEN** the React core-screen bridge or backup ownership flag is disabled or unavailable
- **THEN** the legacy screen remains navigable
- **AND** no pilot progress or backup data is removed

#### Scenario: Backup rollback

- **WHEN** the typed backup boundary is disabled or reports an operation failure
- **THEN** the existing legacy backup controls remain available
- **AND** the current local state remains unchanged unless the legacy operation has created a validated recovery backup
