# Spec Delta

## MODIFIED Requirements

### Requirement: Rejected password credentials are safe and localized

The application MUST show a generic localized credential error when password
authentication is rejected, without revealing whether an email address exists.
The error MUST be rendered only in the authentication status region and MUST be
cleared when a valid session is restored or authentication succeeds.

#### Scenario: Rejected password credentials

- **WHEN** an invited-account login request is rejected because the credentials
  are invalid
- **THEN** the application shows a generic localized credential error in the
  authentication status region
- **AND** the login form remains available

#### Scenario: Rate-limited password recovery

- **WHEN** the authentication provider rate-limits a password recovery request
- **THEN** the application shows a localized retry message
- **AND** local gameplay and progress remain available

#### Scenario: Expired invitation

- **WHEN** an invitation token is expired or invalid
- **THEN** the application shows a localized safe recovery message
- **AND** it does not create an authenticated session

#### Scenario: Session restoration clears stale feedback

- **WHEN** the application restores a valid invited-user session after a prior
  rejected login attempt
- **THEN** the authentication status reflects the signed-in state
- **AND** no credential error remains visible elsewhere in the rendered page

#### Scenario: Successful sign-in clears stale feedback

- **WHEN** a subsequent password login succeeds after a rejected attempt
- **THEN** the authentication status shows the localized signed-in message
- **AND** the previous credential error is not visible in the application

#### Scenario: Translation lookup has no visible anchor

- **WHEN** the authentication runtime resolves the localized credential error
- **THEN** the translation source is available without a rendered visible
  translation anchor or layout-affecting product text
- **AND** Spanish and English credential feedback remain available
