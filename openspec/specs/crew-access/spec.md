# crew-access Specification

## Purpose
Define a private, account-scoped access model for learning crews that preserves pilot identity across contexts and prevents membership from granting unintended pilot access.

## Requirements

### Requirement: Account-owned pilot identity is stable across crews

The system MUST represent each pilot as one account-owned identity that can be associated with zero or more private crews without duplicating global progress.

#### Scenario: Pilot joins multiple crews

- **WHEN** an authorized account associates one pilot with multiple crews
- **THEN** all associations reference the same pilot identity
- **AND** global pilot progress remains one shared record

#### Scenario: Pilot leaves a crew

- **WHEN** a pilot is removed from one crew
- **THEN** the pilot and its global progress remain available to the owning account
- **AND** no other crew association is deleted implicitly

### Requirement: Crew membership is separate from pilot access

The system MUST evaluate crew membership and pilot access as separate authorization relationships.

#### Scenario: Crew member without pilot grant

- **WHEN** an authenticated account belongs to a crew but has no grant for a pilot
- **THEN** the account MUST NOT read or modify that pilot's private snapshot

#### Scenario: Explicit pilot grant

- **WHEN** an account has an active, authorized pilot access grant
- **THEN** the account receives only the grant's declared access level
- **AND** the grant does not expand access to unrelated pilots in the same crew

### Requirement: School-only and family-linked states are explicit

The system MUST represent whether a managed pilot is school-only or authorized for family access without requiring an individual child email account.

#### Scenario: School-only pilot

- **WHEN** a teacher creates a managed pilot without a family authorization
- **THEN** the pilot remains usable through the scoped school context
- **AND** no child email or personal account is required

#### Scenario: Family authorization is absent

- **WHEN** a managed pilot has no active family authorization
- **THEN** family accounts MUST NOT receive pilot access

### Requirement: Private crew data is isolated server-side

The system MUST enforce account and crew access boundaries in the database so browser clients cannot bypass them by changing identifiers.

#### Scenario: Cross-account pilot query

- **WHEN** an authenticated account queries another account's pilot or snapshot identifier
- **THEN** the database returns no unauthorized row

#### Scenario: Anonymous query

- **WHEN** an unauthenticated client queries crew, membership, access, pilot, or snapshot data
- **THEN** the database denies the operation

### Requirement: Deletion preserves unrelated ownership boundaries

Deleting a membership or crew association MUST NOT delete global pilot data, another account's data, or an unrelated crew.

#### Scenario: Membership removal

- **WHEN** an authorized administrator removes a member from a crew
- **THEN** only the membership and its directly scoped access grants are removed or revoked
- **AND** global pilot progress remains intact

#### Scenario: Account deletion

- **WHEN** an account deletes its cloud data
- **THEN** only data owned by that account is deleted according to the existing cloud deletion contract
- **AND** local browser data remains unchanged
