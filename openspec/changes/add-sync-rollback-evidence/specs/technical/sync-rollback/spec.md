# Sync rollback

## Requirement: Failed atomic uploads leave no partial server state

The service MUST roll back the progress snapshot and operation result when a
failure occurs between those writes.

### Scenario: Failure after snapshot mutation

- **WHEN** the service fails after the snapshot write and before the operation
  result write
- **THEN** neither row remains after the transaction aborts
- **AND** retrying the same operation ID can apply the upload once
