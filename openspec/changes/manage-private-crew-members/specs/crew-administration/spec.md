# Spec Delta

## Purpose

Provide a trusted, private administration boundary for creating crews and managing membership without exposing administrative credentials or granting pilot access implicitly.

## ADDED Requirements

### Requirement: Crew creation is private and owner-scoped

The system MUST create a private crew with one authenticated owner and MUST NOT expose a public discovery or open-membership path.

#### Scenario: Owner creates a crew

- **WHEN** an authenticated invited account submits a valid crew name through the trusted operation
- **THEN** one private crew and its owner membership are created
- **AND** the caller can administer that crew

#### Scenario: Unauthenticated creation

- **WHEN** an unauthenticated or invalid caller requests crew creation
- **THEN** the operation is rejected
- **AND** no crew or membership row is created

### Requirement: Membership administration is role-scoped

The system MUST allow only the crew owner or an active crew administrator to manage membership roles and status.

#### Scenario: Member attempts administration

- **WHEN** an active member without an administrator role invites or changes another member
- **THEN** the operation is rejected
- **AND** existing membership state is unchanged

#### Scenario: Administrator revokes membership

- **WHEN** an owner or active administrator revokes a member
- **THEN** that member loses crew access immediately
- **AND** global pilot and snapshot data remain unchanged

### Requirement: Invitations are expiring and non-disclosing

The system MUST issue single-use invitations with an expiry and MUST return equivalent safe responses whether or not a target email belongs to an invited account.

#### Scenario: Valid invitation

- **WHEN** an administrator invites an eligible account
- **THEN** the invitation has a bounded expiry and one-time redemption state
- **AND** redemption creates or activates only the intended membership

#### Scenario: Expired or reused invitation

- **WHEN** an invitation is expired, revoked, or already redeemed
- **THEN** redemption is rejected safely
- **AND** no membership or pilot access is widened

### Requirement: Administrative secrets stay server-side

The system MUST keep service-role credentials and invitation mutation authority outside browser-delivered code.

#### Scenario: Browser bundle inspection

- **WHEN** a user loads the application or invokes a client operation
- **THEN** no service-role key or administrative credential is delivered to the browser
- **AND** unauthorized direct table mutations remain denied by RLS

### Requirement: Local-first gameplay survives administration failures

The system MUST treat crew administration as optional network functionality and MUST never block local gameplay when the trusted operation is unavailable.

#### Scenario: Provider failure

- **WHEN** an invite or membership operation fails because of network or provider errors
- **THEN** the client shows a retryable localized error
- **AND** local pilots, progress, backups, and gameplay remain usable
