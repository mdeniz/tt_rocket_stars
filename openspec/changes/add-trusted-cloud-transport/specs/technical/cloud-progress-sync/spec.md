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
