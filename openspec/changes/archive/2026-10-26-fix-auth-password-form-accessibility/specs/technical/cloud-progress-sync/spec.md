# Spec Delta

## ADDED Requirements

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
