# Spec Delta

## ADDED Requirements

### Requirement: Mission progress commits atomically across pilot-local domains

The typed pilot boundary SHALL commit validated mission facts, history, rewards, coins, and rocket state as one compatible local snapshot.

#### Scenario: Complete progress snapshot is committed

- **WHEN** a valid mission completion updates multiple pilot-local progress domains
- **THEN** all compatible domain keys are committed for the active pilot
- **AND** existing storage key names, backup fields, and unknown payload fields remain unchanged

#### Scenario: A progress write fails

- **WHEN** any domain write in a mission completion transaction is rejected
- **THEN** previously valid domain values are restored or retained
- **AND** no partial facts, history, rewards, coins, or rocket state are exposed as a successful completion
