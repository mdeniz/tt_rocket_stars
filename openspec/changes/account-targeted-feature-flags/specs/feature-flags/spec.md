# Feature flags

## ADDED Requirements

### Requirement: Account targeting

The evaluator MUST support an optional UUID allowlist and deterministic percentage rollout for a known flag. It MUST use an authenticated account UUID supplied by the caller and MUST NOT use pilot display names.

#### Scenario: Allowlisted account

- **WHEN** a valid account UUID is present in the flag allowlist
- **THEN** the flag evaluates as enabled

#### Scenario: Missing account identity

- **WHEN** a targeted flag is evaluated without a valid account UUID
- **THEN** the evaluator returns the declared safe default without making a request

#### Scenario: Deterministic rollout

- **WHEN** the same flag and account UUID are evaluated repeatedly
- **THEN** the percentage decision remains stable across evaluator instances

### Requirement: Safe isolation

The evaluator MUST remain provider-independent and MUST NOT provide backend authorization. Invalid targeting configuration MUST be rejected during service creation, and unknown flags MUST fail closed.

#### Scenario: Invalid targeting configuration

- **WHEN** a flag definition contains malformed account IDs or a rollout outside 0-100
- **THEN** service creation rejects the definition

#### Scenario: Unknown flag

- **WHEN** an unknown flag name is evaluated
- **THEN** the evaluator returns false
