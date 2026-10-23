# telemetry Specification

## Purpose
Provides a privacy-preserving, opt-in boundary for aggregate product telemetry without making gameplay depend on a network or external provider.

## Requirements

### Requirement: Consent gates collection
The telemetry service SHALL remain disabled until the caller explicitly grants consent, and SHALL clear queued events when consent is withdrawn or data deletion is requested.

#### Scenario: Collection is disabled by default
- **WHEN** a service is created without explicit consent
- **THEN** recording an event produces no queued event and no external call

#### Scenario: Withdrawal clears data
- **WHEN** consent is withdrawn or deletion is requested
- **THEN** the queue is empty and subsequent events are ignored until consent is granted again

### Requirement: Events contain only allowlisted aggregate data
The service SHALL accept only known event names and bounded aggregate fields, and SHALL reject identifying fields, pilot names, emails, child identifiers, answers, free text, and replay data.

#### Scenario: Allowed event is recorded
- **WHEN** consent is granted and a known event contains valid aggregate fields
- **THEN** the sanitized event is queued with no unallowlisted fields

#### Scenario: Sensitive payload is rejected
- **WHEN** an event contains a sensitive or unknown field
- **THEN** the event is not queued and the service reports rejection without throwing into gameplay

### Requirement: Collection is bounded and offline-safe
The service SHALL cap queued events and SHALL not perform network requests unless a caller explicitly injects a sink; sink failures SHALL not affect gameplay.

#### Scenario: Queue reaches its limit
- **WHEN** more events are recorded than the configured maximum
- **THEN** the service retains at most the configured limit and remains usable

#### Scenario: No provider is configured
- **WHEN** gameplay uses the service without an injected sink or network
- **THEN** recording and reading local telemetry do not create a network request
