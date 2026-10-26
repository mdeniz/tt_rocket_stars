# Spec Delta

## ADDED Requirements

### Requirement: React development ownership has an explicit dependency boundary

The development entrypoint SHALL use one authoritative React owner for each
migrated gameplay, pilot, inventory, achievement, backup, and cloud operation.

#### Scenario: Development ownership starts without an unowned legacy dependency

- **WHEN** the development entrypoint enables the React ownership flag
- **THEN** each migrated operation resolves through its typed React boundary
- **AND** an unsupported legacy dependency fails closed with a documented rollback

#### Scenario: Stable fallback remains available

- **WHEN** the React ownership flag is disabled or a required boundary is absent
- **THEN** the stable legacy runtime remains navigable and playable
- **AND** no local progress or backup data is removed
