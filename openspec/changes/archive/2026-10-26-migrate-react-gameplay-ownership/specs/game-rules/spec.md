# Spec Delta

## MODIFIED Requirements

### Requirement: Incremental compatibility

The extraction MUST preserve the ordered legacy runtime as a rollback path while the React gameplay flow consumes the same framework-agnostic question, answer, progression, and reward contracts. React ownership MUST NOT introduce a second mathematical source of truth or alter localStorage keys.

#### Scenario: React gameplay uses bounded rules

- **WHEN** a React-owned mission creates a question or evaluates an answer
- **THEN** it applies the bounded domain contracts for tables 1 through 12
- **AND** multiplication, division, mixed operations, and reward outcomes remain mathematically compatible with the legacy flow

#### Scenario: Legacy compatibility remains available

- **WHEN** the React gameplay path is disabled or unavailable
- **THEN** the ordered legacy runtime remains responsible for gameplay behavior
- **AND** existing persisted progress and backup payloads remain readable without migration

#### Scenario: Existing gameplay remains authoritative

- **WHEN** the application starts after this change
- **THEN** the legacy mission script remains responsible for gameplay behavior and persistence when the React gameplay path is disabled
- **AND** the React path does not alter persisted data outside the typed boundary
