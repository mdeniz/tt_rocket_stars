# Spec Delta

## ADDED Requirements

### Requirement: Cloud synchronization is provider-neutral in the browser

Cloud synchronization MUST expose authenticated pilot and progress operations to the
browser through the domain cloud contract while preserving the existing local-first
authentication and synchronization behavior.

#### Scenario: Upload local progress

- **WHEN** an authenticated user uploads a local pilot
- **THEN** the domain contract receives the pilot and progress snapshot
- **AND** ownership and optimistic version checks remain enforced
- **AND** the browser does not issue a provider-specific table or RPC query

#### Scenario: Download remote progress

- **WHEN** an authenticated user requests a remote pilot
- **THEN** the domain contract returns only data visible to that account
- **AND** the existing local-versus-remote selection and recovery-backup rules remain enforced

#### Scenario: Conflict, retry, and deletion

- **WHEN** a cloud write conflicts, temporarily fails, or the user deletes the cloud copy
- **THEN** the existing conflict and bounded-retry behavior remains available
- **AND** deleting cloud data does not delete the local pilot or its local progress
