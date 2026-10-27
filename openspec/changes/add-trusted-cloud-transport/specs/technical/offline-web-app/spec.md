# Spec Delta

## ADDED Requirements

### Requirement: The Edge Function is optional for local play

The application MUST remain fully playable when the Supabase Edge Function is
unconfigured, unreachable, disabled, or unavailable.

#### Scenario: Unconfigured trusted transport
- **WHEN** the application has no Edge Function configuration
- **THEN** startup, navigation, missions, pilots, progress, and backups remain usable
- **AND** no cloud request is attempted while the user is signed out

#### Scenario: Offline trusted transport
- **WHEN** the device loses network access during local gameplay
- **THEN** local saves continue using the existing storage contracts
- **AND** pending cloud work fails safely without replacing or deleting local data

### Requirement: Trusted transport rollout is reversible

The application MUST allow maintainers to disable the Edge Function transport and
restore the reviewed compatibility path without changing local storage or backups.

#### Scenario: Transport rollback
- **WHEN** the trusted transport feature is disabled after a deployment problem
- **THEN** cloud access uses the configured compatibility behavior or remains unavailable
- **AND** local pilots, progress, and backup envelopes remain unchanged
