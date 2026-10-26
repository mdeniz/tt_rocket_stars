# Spec Delta

## MODIFIED Requirements

### Requirement: Backup envelopes are compatible and fail safe

The application SHALL export and restore a versioned backup envelope containing compatible pilot data, and SHALL leave the current state unchanged when validation fails. All local backup creation, listing, validation, restoration, import, export, and reset operations SHALL be available through the typed persistence boundary without changing existing storage keys or envelope fields.

#### Scenario: Compatible backup round-trip

- **WHEN** the user exports a valid backup and restores it later
- **THEN** the restored pilots and payloads match the exported data while retaining per-pilot separation
- **AND** the operation is performed through the typed persistence boundary

#### Scenario: Invalid backup is rejected

- **WHEN** the user selects a corrupt, unsupported, or structurally invalid backup
- **THEN** the application reports an error and preserves the current pilots and progress
- **AND** no replacement or reset mutation is performed

#### Scenario: Recovery backup precedes replacement

- **WHEN** the user restores an accepted backup or resets progress
- **THEN** the current compatible state is saved as a recovery backup before replacement
- **AND** a failed recovery backup prevents the replacement

#### Scenario: Backup storage is unavailable

- **WHEN** the browser rejects a backup read or write
- **THEN** the application reports the limitation without deleting unrelated progress
- **AND** the legacy-compatible rollback path remains available when the React ownership flag is disabled
