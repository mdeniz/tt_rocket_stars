# Spec Delta

## ADDED Requirements

### Requirement: Cloud boundary migration preserves offline-first behavior

Migrating browser cloud access MUST NOT make network access, authentication, or
provider configuration a prerequisite for startup, navigation, gameplay, local
progress, or backups.

#### Scenario: Unconfigured offline startup

- **WHEN** the application starts without cloud configuration or network access
- **THEN** the user can start and complete local gameplay
- **AND** no cloud data operation is attempted

#### Scenario: Cloud failure during local play

- **WHEN** an optional cloud operation fails while local gameplay is active
- **THEN** the user can continue playing locally
- **AND** the current local pilot, progress, and backup data remain unchanged

#### Scenario: Compatibility inspection

- **WHEN** the migrated build is inspected for local compatibility
- **THEN** existing localStorage/sessionStorage keys, backup envelopes, pilot identifiers,
  and progress payload fields remain supported
