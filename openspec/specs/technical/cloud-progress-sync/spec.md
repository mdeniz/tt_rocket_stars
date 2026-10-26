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

### Requirement: Password forms expose an accessible account association

Invited-account password forms MUST expose an accessible association between
the account identity and each password control, while preserving the existing
localized authentication flow and invite-only access boundary.

#### Scenario: Signed-in password form semantics

- **WHEN** an invited user opens the password sign-in form
- **THEN** the email identity control and current-password control have
  programmatic labels and appropriate autocomplete semantics
- **AND** the form remains usable with keyboard, touch, and password managers

#### Scenario: Invitation setup password form semantics

- **WHEN** an invited user opens the invitation setup flow
- **THEN** the new-password control has an accessible account association and
  `autocomplete` semantics for creating a password
- **AND** no credential value is copied to local storage or exposed in the UI

#### Scenario: Password change form semantics

- **WHEN** an authenticated user opens the password-change flow
- **THEN** the new-password control has an accessible account association and
  `autocomplete` semantics for changing a password
- **AND** the existing local pilot, progress, and backup data remain unchanged

#### Scenario: Browser accessibility verification

- **WHEN** Chrome DevTools inspects the three password forms in the running
  development application
- **THEN** it reports no password-form username-association warning caused by
  the application markup
- **AND** rejected credentials continue to show the existing safe localized
  error without revealing account existence
