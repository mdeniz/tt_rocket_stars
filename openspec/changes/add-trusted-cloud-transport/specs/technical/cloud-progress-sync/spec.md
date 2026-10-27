# Spec Delta

## ADDED Requirements

### Requirement: Cloud synchronization can use a Supabase Edge Function

Authenticated synchronization MUST support a Supabase Edge Function transport
that preserves account ownership, optimistic concurrency, and local-first behavior.

#### Scenario: Authenticated synchronization
- **WHEN** an authenticated user synchronizes a pilot through the Edge Function
- **THEN** the function returns only data owned by the authenticated account
- **AND** stale writes are rejected without silently overwriting the remote snapshot

#### Scenario: Cloud deletion
- **WHEN** an authenticated user confirms cloud-data deletion through the Edge Function
- **THEN** only that account's cloud pilots and snapshots are deleted
- **AND** local pilots, progress, and backups remain unchanged

### Requirement: Edge Function failures preserve local gameplay

Failure, timeout, invalid configuration, or temporary unavailability of the Edge
Function MUST not block local gameplay or delete local progress.

#### Scenario: Function unavailable during gameplay
- **WHEN** an optional cloud operation cannot reach the Edge Function
- **THEN** the application reports a retryable or unavailable cloud state
- **AND** the user can continue playing and using local backups

#### Scenario: Invalid authenticated response
- **WHEN** the Edge Function returns a malformed or unauthorized synchronization response
- **THEN** the application rejects it without replacing local progress
- **AND** the failure remains recoverable through a later synchronization attempt

#### Scenario: Bounded provider operation
- **WHEN** an authenticated Edge Function data operation does not complete within
  the configured provider timeout
- **THEN** the function returns a retryable `cloud_timeout` response with HTTP
  `504`
- **AND** the browser preserves local progress and can retry the operation later

### Requirement: Cloud operations follow the authenticated session lifecycle

The browser cloud boundary MUST cancel pending requests, queued uploads, and
retry attempts when the authenticated session is signed out or replaced by a
different session. A cancelled operation MUST NOT publish a stale failure or
write synchronization metadata for the previous session.

#### Scenario: Sign-out cancels pending synchronization
- **WHEN** a user signs out while an upload or queued retry is pending
- **THEN** the browser aborts the pending trusted request and clears the queued work
- **AND** local pilot and backup data remain unchanged
- **AND** the cancelled operation does not change the UI to a stale error state

#### Scenario: Account switch isolates synchronization
- **WHEN** a second invited account signs in after a first account has an active cloud request
- **THEN** the first account's request cannot publish results or retry under the second account
- **AND** a later synchronization uses only the second account's access token and local pilot

### Requirement: Automatic synchronization failures are bounded

Automatic synchronization MUST stop retrying after a bounded provider failure until
the user manually requests synchronization or creates new local work.

#### Scenario: Automatic retries stop after a bounded failure
- **WHEN** an automatic synchronization attempt exhausts its bounded retries
- **THEN** the application reports the failure and stops periodic automatic attempts
- **AND** a manual synchronization request or new local save resumes synchronization
