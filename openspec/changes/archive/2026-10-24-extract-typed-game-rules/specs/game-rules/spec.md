# Game rules

## ADDED Requirements

### Requirement: Bounded question contracts
The domain layer MUST generate multiplication and division questions only for integer tables and multipliers from 1 through 12, and MUST expose exact answer checking without browser dependencies.

#### Scenario: Generate mixed questions
- **WHEN** a caller requests mixed questions for valid tables
- **THEN** the result contains one multiplication and one division question for each multiplier from 1 through 12
- **AND** invalid table values are rejected.

### Requirement: Deterministic progression contracts
The domain layer MUST calculate fact mastery and mission rewards using the current legacy thresholds without reading or writing persisted data.

#### Scenario: Calculate a completed exam reward
- **WHEN** a completed exam has at least five attempts and at least 50 percent accuracy
- **THEN** the reward includes the correct-answer base and the exam mission bonus.

### Requirement: Incremental compatibility
The extraction MUST not replace the ordered legacy runtime or alter localStorage keys until a later parity adapter is reviewed.

#### Scenario: Existing gameplay remains authoritative
- **WHEN** the application starts after this change
- **THEN** the legacy mission script remains responsible for gameplay behavior and persistence.
