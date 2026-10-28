# Cloud Operation Reliability Specification

## Purpose

Provide reliable, bounded continuation for optional authenticated cloud operations while preserving local progress when any provider operation fails.

## Requirements

### Requirement: Queued cloud operations continue after failure

The system SHALL settle a failed, aborted, or timed-out cloud operation and SHALL allow later queued operations to start without requiring a page reload.

#### Scenario: Deletion follows a failed upload

- **WHEN** an active pilot upload fails or times out and the user has already confirmed cloud deletion
- **THEN** the deletion operation SHALL still execute or return its own bounded deletion failure
- **AND** the local pilot and local progress SHALL remain available

### Requirement: Deletion reports an independent outcome

The system SHALL report cloud deletion as deleted, unavailable, cancelled, or failed independently of the outcome of an earlier queued operation.

#### Scenario: Deletion provider request succeeds after an earlier failure

- **WHEN** a confirmed deletion is queued behind a failed cloud operation
- **THEN** the provider deletion request SHALL receive the authenticated account context
- **AND** the UI SHALL report that cloud data was deleted without reporting the earlier upload failure as the deletion result

#### Scenario: Deletion provider request fails

- **WHEN** the confirmed deletion provider request fails or times out
- **THEN** the UI SHALL report a bounded deletion-specific error
- **AND** local progress and local backups SHALL remain unchanged
