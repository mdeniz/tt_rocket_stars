# Backend operations and security

## Requirements

### Requirement: Local operational controls are auditable

The repository MUST document the existing local CI, API, database, logging,
authorization, backup, migration, privacy, and verification controls and MUST
identify gaps without claiming hosted evidence.

#### Scenario: Audit separates local and hosted evidence

- **WHEN** the operations audit is reviewed
- **THEN** each control is mapped to a local command or repository artifact
- **AND** provider dashboards, production traffic, credentials, and recovery are
  marked unavailable until separately approved.

### Requirement: Operational boundaries preserve privacy and offline play

The backend operational design MUST keep secrets, credentials, tokens, email
bodies, child identifiers, pilot payloads, and gameplay answers out of frontend
bundles and operational events, while backend failure MUST NOT remove local
gameplay, profiles, or backups.

#### Scenario: Backend is unavailable

- **WHEN** an API or provider request fails
- **THEN** local gameplay and backup behavior remain available
- **AND** no secret or gameplay payload is emitted to logs or monitoring.

### Requirement: Follow-up work is independently reviewable

The epic MUST decompose missing operational capabilities into small issues with
explicit dependencies, local verification, rollback expectations, and hosted
limitations.

#### Scenario: A follow-up slice is implemented

- **WHEN** a subissue is delivered
- **THEN** it can be tested with local or synthetic data without production
  credentials
- **AND** the frontend feature flag remains safe until the required evidence is
  complete.
