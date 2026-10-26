# Spec Delta

## ADDED Requirements

### Requirement: React cutover preserves local persistence contracts

The ownership cutover SHALL preserve existing local storage keys, pilot
isolation, backup envelopes, cloud-compatible snapshots, and offline recovery.

#### Scenario: Cutover preserves an existing pilot

- **WHEN** the development entrypoint is loaded with an existing pilot payload
- **THEN** facts, history, rewards, coins, inventory, settings, and compatible
  unknown fields remain associated with the same pilot
- **AND** no network request is required to continue playing

#### Scenario: Cutover write failure is recoverable

- **WHEN** a typed ownership write fails because validation or storage is unavailable
- **THEN** the last valid local snapshot remains readable
- **AND** the user can continue through the documented fallback path
