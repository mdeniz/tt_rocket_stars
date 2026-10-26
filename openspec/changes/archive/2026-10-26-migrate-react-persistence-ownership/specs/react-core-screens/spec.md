# Spec Delta

## MODIFIED Requirements

### Requirement: React actions delegate through a fail-closed legacy boundary

The application SHALL expose typed adapter actions for mission setup, rocket customization, achievement refresh, and local pilot persistence without allowing React components to access legacy globals directly.

#### Scenario: Legacy action is available
- **WHEN** a React screen invokes a supported mission or garage action
- **THEN** the adapter forwards the validated action and arguments to the corresponding legacy function
- **AND** the existing gameplay and persistence runtime remains authoritative

#### Scenario: React persistence action is available
- **WHEN** a flag-enabled React screen selects, creates, or switches a pilot
- **THEN** the typed persistence boundary validates and applies the local operation
- **AND** the existing pilot identifiers, active-pilot key, payload keys, and backup format remain compatible

#### Scenario: Legacy action is unavailable
- **WHEN** a supported legacy action is missing or throws
- **THEN** the adapter returns `false`
- **AND** the React screen remains usable without a runtime exception or storage mutation

#### Scenario: React persistence action is unavailable
- **WHEN** a flag-enabled persistence operation cannot be validated or applied
- **THEN** the boundary returns a failure result
- **AND** the current pilot state remains unchanged while the legacy-compatible path remains available

### Requirement: React migration has a legacy-compatible rollback path

The application SHALL retain stable screen identifiers, persistence keys, backup formats, and legacy behavior until equivalent React persistence coverage has passed.

#### Scenario: Legacy fallback
- **WHEN** the React core-screen bridge or persistence coordinator is disabled or unavailable
- **THEN** the legacy screen remains navigable
- **AND** no pilot progress or backup data is removed

#### Scenario: React persistence rollback
- **WHEN** a React-owned persistence action fails before committing a change
- **THEN** the application leaves the current local state unchanged
- **AND** the pilot can continue through the legacy-compatible path
