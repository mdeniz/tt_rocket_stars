# Spec Delta

## Purpose

This capability defines optional authenticated cloud synchronization for pilot
profiles and progress while preserving offline-first gameplay and local data
compatibility.

## ADDED Requirements

### Requirement: Cloud synchronization is optional

The application SHALL allow users to play, manage pilots, and access local
progress without creating an account or reaching the synchronization service.

#### Scenario: Unauthenticated gameplay
- **WHEN** a user has no authenticated session
- **THEN** the user can start the game, switch pilots, complete missions, and use local backups

#### Scenario: Authentication unavailable
- **WHEN** authentication configuration or the authentication service is unavailable
- **THEN** the application remains playable locally and does not discard local progress

### Requirement: Authentication sessions are explicit and recoverable

The application SHALL provide invite-only account access through a
user-controlled email address and password. An invitation link SHALL be limited
to initial account activation and password setup; subsequent sign-in SHALL use
email and password. The application SHALL make session state and sign-out
behavior explicit.

#### Scenario: Accept an invitation
- **WHEN** an invited account holder opens a valid invitation link
- **THEN** the application allows the user to establish a password and complete the account activation flow

#### Scenario: Sign in with a password
- **WHEN** an activated invited account submits the correct email and password
- **THEN** the application establishes an authenticated session

#### Scenario: Reject public registration
- **WHEN** a visitor attempts to create an account without an invitation
- **THEN** the application does not create an account or authenticated session and communicates the access restriction without exposing account-enumeration details

#### Scenario: Recover a password
- **WHEN** an activated account holder requests password recovery
- **THEN** the application sends a one-time recovery email and allows a new password to be established without exposing administrative credentials

#### Scenario: Restore a session
- **WHEN** an authenticated user reopens the application on the same origin
- **THEN** the application restores the session without requiring a new link until the session expires or the user signs out

#### Scenario: Sign out
- **WHEN** the user signs out
- **THEN** the application removes the authenticated session while preserving local pilots and local progress

#### Scenario: Issue an invitation
- **WHEN** an administrator or trusted server issues an invitation to an email address
- **THEN** Supabase creates or enables the account through a privileged server-side operation and sends the configured transactional email without exposing privileged credentials to the browser

### Requirement: Cloud data is owned and isolated by account

The synchronization service SHALL associate each cloud pilot and progress snapshot
with exactly one authenticated account and SHALL reject access by other accounts.

#### Scenario: Read owned progress
- **WHEN** an authenticated user requests cloud progress
- **THEN** the service returns only pilots and snapshots owned by that account

#### Scenario: Access another account's progress
- **WHEN** a user requests a pilot or snapshot owned by another account
- **THEN** the service denies the request without revealing the resource contents

#### Scenario: Pilot identity data
- **WHEN** a pilot is synchronized
- **THEN** the cloud record contains only the pilot pseudonym and game data required to restore the experience, not a child's real-world identity

### Requirement: Synchronization is local-first and loss-averse

The application SHALL treat the existing local progress and backup contracts as
the immediate playable state and SHALL synchronize them without deleting local
data when a remote operation fails.

#### Scenario: Upload local progress
- **WHEN** a signed-in user has local progress that is newer than the remote snapshot
- **THEN** the application uploads the compatible per-pilot snapshot and records successful synchronization metadata

#### Scenario: Download remote progress
- **WHEN** a signed-in user has no local copy of a pilot and a remote snapshot exists
- **THEN** the application downloads and restores the compatible pilot state

#### Scenario: Failed synchronization
- **WHEN** a remote read or write fails
- **THEN** the application keeps the local state available, reports that synchronization is pending or failed, and retries only through a safe repeatable operation

### Requirement: Multi-device conflicts are deterministic

The synchronization protocol SHALL detect concurrent updates and SHALL resolve
them using versioned snapshots without silently overwriting a newer state.

#### Scenario: Stale upload
- **WHEN** a device uploads a snapshot based on an older remote version
- **THEN** the service rejects the stale write and returns the current remote version for conflict handling

#### Scenario: Conflict resolution
- **WHEN** local and remote snapshots have diverged
- **THEN** the application creates a recoverable merged or selected result using the documented conflict policy and preserves the superseded snapshot in a backup or recovery path

#### Scenario: Same pilot on another device
- **WHEN** a user signs in on a second device
- **THEN** the user can list and restore the same pilot without creating a duplicate account or mixing it with another pilot

### Requirement: Cloud data can be deleted independently

The application SHALL allow an authenticated account holder to delete cloud
pilots and progress without requiring deletion of local backups first.

#### Scenario: Delete cloud progress
- **WHEN** the account holder confirms cloud-data deletion
- **THEN** the service deletes the account-owned cloud pilots and snapshots and the local copy remains available until the user removes it separately

#### Scenario: Delete account data after failure
- **WHEN** cloud deletion cannot be completed
- **THEN** the application communicates that the deletion is incomplete and does not falsely claim that remote data was removed
