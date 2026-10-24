# technical/cloud-progress-sync Specification

## Purpose
The optional cloud account flow provides safe invited-user authentication and preserves local gameplay and progress.

## Requirements

### Requirement: Rejected password credentials are safe and localized

The application MUST show a generic localized credential error when password
authentication is rejected, without revealing whether an email address exists.

#### Scenario: Rejected password credentials

- **WHEN** an invited-account login request is rejected because the credentials
  are invalid
- **THEN** the application shows a generic localized credential error without
  revealing whether the email address exists
- **AND** the login form remains available

#### Scenario: Rate-limited password recovery

- **WHEN** the authentication provider rate-limits a password recovery request
- **THEN** the application shows a localized retry message
- **AND** local gameplay and progress remain available

#### Scenario: Expired invitation

- **WHEN** an invitation token is expired or invalid
- **THEN** the application shows a localized safe recovery message
- **AND** it does not create an authenticated session

### Requirement: Password lifecycle preserves local data

Authenticated password changes and sign-out MUST preserve local pilots, progress,
and backups.

#### Scenario: Password change and logout preserve local data

- **WHEN** an authenticated user changes the password and signs out
- **THEN** the application revokes or clears the local session
- **AND** local pilots, progress, and backups remain available
