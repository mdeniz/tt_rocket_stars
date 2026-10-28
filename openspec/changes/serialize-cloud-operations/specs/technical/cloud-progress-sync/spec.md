# Spec Delta

## ADDED Requirements

### Requirement: Cloud operations are serialized
The application MUST serialize authenticated cloud operations through one bounded queue so concurrent browser actions do not issue overlapping provider requests for the same session.

#### Scenario: Automatic sync and listing overlap
- **WHEN** an automatic upload is pending while the user requests a cloud pilot list
- **THEN** one operation runs at a time
- **AND** the second operation waits or is coalesced without issuing a concurrent provider request

#### Scenario: Restore and deletion overlap
- **WHEN** restore and deletion actions are requested close together
- **THEN** the operations execute in a deterministic order through the same queue
- **AND** a failed or cancelled operation does not corrupt local progress

#### Scenario: Session cancellation drains pending work
- **WHEN** the user signs out or replaces the authenticated session while cloud operations are queued
- **THEN** queued operations are cancelled
- **AND** no cancelled operation starts after the session changes

#### Scenario: Bounded queue failure
- **WHEN** a cloud operation times out or the provider rejects it
- **THEN** the queue reports a bounded failure
- **AND** local gameplay remains available
