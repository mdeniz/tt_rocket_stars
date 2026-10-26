# Spec Delta

## Purpose

Provides a validated, pilot-local inventory boundary for the React garage so rocket customization remains offline-first, backup-compatible, and isolated per pilot while the legacy runtime is retired incrementally.

## ADDED Requirements

### Requirement: Inventory state remains pilot-local and compatible

The application SHALL read and write rocket inventory through the existing pilot-local garage payload without renaming storage keys or dropping unknown compatible fields.

#### Scenario: Active pilot inventory is loaded

- **WHEN** the React garage opens for a pilot with a valid stored garage payload
- **THEN** the visible coins, owned parts, equipped parts, family, fleet, and designs match that pilot's payload
- **AND** another pilot's inventory is not displayed or changed

#### Scenario: Offline inventory access

- **WHEN** the application has no network connection or cloud configuration
- **THEN** inventory reads and supported mutations remain available locally
- **AND** no network request is required

### Requirement: Inventory actions validate and fail closed

The application SHALL validate category, part, purchase, and equip operations before changing the active pilot's inventory.

#### Scenario: Valid inventory action

- **WHEN** a pilot previews, purchases, or equips a valid part using sufficient local coins
- **THEN** the inventory state and visible garage update consistently
- **AND** the updated state is persisted for the active pilot

#### Scenario: Invalid inventory action

- **WHEN** a part, category, payload, or purchase operation is unknown, malformed, or unauthorized by the local inventory state
- **THEN** the action reports failure
- **AND** coins, ownership, equipment, and unrelated local data remain unchanged

### Requirement: Inventory rollback preserves legacy compatibility

The application SHALL keep the legacy inventory path available while the React inventory boundary is opt-in.

#### Scenario: React inventory flag is disabled

- **WHEN** `reactCoreScreens` is disabled or unavailable
- **THEN** the legacy garage remains authoritative
- **AND** existing backups and storage payloads remain readable without migration

#### Scenario: Inventory persistence fails

- **WHEN** a local inventory write fails or a compatible payload cannot be validated
- **THEN** the operation reports failure without deleting the prior valid inventory
- **AND** the legacy fallback remains available
