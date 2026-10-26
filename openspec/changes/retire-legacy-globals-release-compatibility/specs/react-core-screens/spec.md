# Spec Delta

## MODIFIED Requirements

### Requirement: React migration has a legacy-compatible rollback path

The application SHALL retain stable screen identifiers and a complete legacy fallback until every migrated screen and action has equivalent validated behavior, no enabled-path dependency on the retired source, and a documented rollback decision.

#### Scenario: Legacy fallback

- **WHEN** the React core-screen bridge or backup ownership flag is disabled or unavailable
- **THEN** the legacy screen remains navigable
- **AND** no pilot progress or backup data is removed

#### Scenario: Backup rollback

- **WHEN** the typed backup boundary is disabled or reports an operation failure
- **THEN** the existing legacy backup controls remain available
- **AND** the current local state remains unchanged unless the legacy operation has created a validated recovery backup

#### Scenario: Legacy source retirement gate

- **WHEN** a legacy script, global, or duplicate screen renderer is proposed for removal
- **THEN** the release audit verifies that no inline handler, typed adapter, backup path, cloud bridge, or rollback path still consumes it
- **AND** the removal is rejected while any required consumer or browser evidence is missing
