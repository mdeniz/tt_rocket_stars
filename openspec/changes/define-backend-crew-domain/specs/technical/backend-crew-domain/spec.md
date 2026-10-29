# backend-crew-domain Specification

## Requirements

### Requirement: Crew implementation slices preserve domain boundaries

Follow-up crew services MUST use the authenticated server identity, preserve
one account-owned pilot identity, and evaluate crew membership separately from
pilot access.

#### Scenario: Client changes an account identifier

- **WHEN** a client submits another account identifier with a crew or pilot
  request
- **THEN** the service MUST ignore it for authorization
- **AND** the repository MUST scope the operation to the authenticated account

#### Scenario: Membership is revoked

- **WHEN** an administrator revokes a membership or pilot grant
- **THEN** subsequent requests MUST be denied
- **AND** the pilot and global progress MUST remain intact

### Requirement: School-only and family-linked pilots remain explicit

Managed pilots MUST support a school-only state without a child email and a
separate explicit family authorization without duplicating progress.

#### Scenario: School-only pilot has no guardian

- **WHEN** a teacher creates a managed pilot without family authorization
- **THEN** scoped school access MAY operate
- **AND** family accounts MUST be denied

#### Scenario: Family link is removed

- **WHEN** a family authorization is safely unlinked
- **THEN** family access MUST stop
- **AND** school-scoped access and the original pilot progress MUST remain

### Requirement: Offline-first and hosted gates are explicit

Crew backend work MUST not make local gameplay or backups require a network,
and hosted RLS, provider delivery, safeguarding, and durable rate limiting MUST
be verified separately before deployment.

#### Scenario: Backend is unavailable

- **WHEN** a player is offline
- **THEN** existing local gameplay, profiles, and backups remain available
- **AND** no crew API failure deletes or resets local progress
