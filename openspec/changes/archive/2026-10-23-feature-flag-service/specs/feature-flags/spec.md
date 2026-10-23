# Spec Delta

## Purpose

Provide a provider-independent feature-flag capability that evaluates safe local
defaults first and remains reliable when remote configuration is absent, invalid,
expired, or unavailable.

## ADDED Requirements

### Requirement: Feature flags have explicit safe defaults

The service SHALL evaluate every known flag from an explicit default definition,
including whether the flag is enabled by default and whether it is experimental.

#### Scenario: Offline startup uses defaults
- **WHEN** the application starts without a configured provider or cached payload
- **THEN** evaluation SHALL return the declared default for every known flag

#### Scenario: Unknown flags fail closed
- **WHEN** a caller evaluates a flag that is not in the known definitions
- **THEN** evaluation SHALL return `false` without throwing

### Requirement: Flag payloads are validated before evaluation

The service SHALL accept only payload entries whose flag name is known and whose
value has the expected boolean type.

#### Scenario: Valid payload overrides a default
- **WHEN** a payload contains a known flag with a boolean value
- **THEN** evaluation SHALL use that value

#### Scenario: Malformed payload is ignored
- **WHEN** a payload contains an unknown flag, a non-boolean value, or an invalid container
- **THEN** the invalid entry SHALL be ignored and the applicable default SHALL remain active

### Requirement: Cached values are bounded and fail closed

The service SHALL use cached values only before their configured TTL expires and
SHALL disable experimental flags when no valid current value is available.

#### Scenario: Fresh cache is used offline
- **WHEN** a cached payload is valid and younger than its TTL
- **THEN** evaluation SHALL use the cached values without a network request

#### Scenario: Expired cache does not enable experiments
- **WHEN** a cached payload is older than its TTL and the flag is experimental
- **THEN** evaluation SHALL return `false`

### Requirement: Flag evaluation is side-effect free for gameplay

The feature-flag service SHALL not require network access, authentication, or
storage availability for callers to evaluate defaults.

#### Scenario: Restricted storage does not block evaluation
- **WHEN** cache storage is unavailable or throws during initialization
- **THEN** default evaluation SHALL still return a boolean result without throwing
