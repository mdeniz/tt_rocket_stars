# Spec Delta

## ADDED Requirements

### Requirement: Authenticated cloud operations support a trusted transport

The browser cloud boundary MUST support an optional authenticated transport that
executes domain operations without exposing provider administration to the client.

#### Scenario: Trusted upload
- **WHEN** an authenticated user uploads a local pilot through the enabled trusted transport
- **THEN** the request carries only the user's authenticated context and domain payload
- **AND** ownership and optimistic version checks are enforced by the trusted service

#### Scenario: Trusted transport unavailable
- **WHEN** the trusted transport is unconfigured, unavailable, or returns an invalid response
- **THEN** cloud access reports a bounded failure or uses the explicit compatibility fallback
- **AND** local gameplay, progress, and backups remain available

### Requirement: Trusted transport responses are domain-scoped

The browser MUST accept only validated domain responses for cloud synchronization,
pilot discovery, conflict handling, and cloud deletion.

#### Scenario: Invalid transport response
- **WHEN** a trusted transport response is malformed, unauthorized, or contains an unknown operation result
- **THEN** the browser rejects the response without replacing local state
- **AND** the user receives a safe synchronization failure state

### Requirement: Administrative credentials remain server-side

The trusted transport MUST keep service-role keys, database passwords, migration
credentials, and provider-management operations outside generated browser artifacts.

#### Scenario: Artifact inspection
- **WHEN** the production and development artifacts are inspected after enabling the transport
- **THEN** no administrative credential or provider-management operation is present
- **AND** only publishable configuration and user-authenticated requests are observable in the browser
