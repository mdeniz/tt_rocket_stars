# Spec Delta

## ADDED Requirements

### Requirement: Flagged mission completion uses one fail-closed ownership boundary

When flagged React mission ownership is enabled, mission completion SHALL use one validated local transaction and SHALL retain the legacy completion path as a reversible fallback.

#### Scenario: React-owned completion succeeds

- **WHEN** a flagged React mission completes with valid facts, history, rewards, coins, and rocket state
- **THEN** the complete validated progress snapshot is committed to the active pilot
- **AND** no network access is required for the result or persistence

#### Scenario: React-owned completion cannot commit

- **WHEN** a flagged React mission completion fails validation or local storage writes
- **THEN** the last valid pilot progress remains readable
- **AND** the legacy-compatible path remains available without silently applying partial progress
