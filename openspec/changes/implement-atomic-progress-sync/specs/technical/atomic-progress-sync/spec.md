# Atomic progress sync

## Requirement: Upload mutation and idempotency are atomic

The service MUST persist an account-owned progress snapshot and its operation
result in one transaction.

### Scenario: Identical replay

- **WHEN** an account retries an operation with the same ID and canonical request
  content
- **THEN** the original result is returned with `replayed: true`
- **AND** the snapshot is not applied twice

### Scenario: Operation hash conflict

- **WHEN** an account reuses an operation ID with different content
- **THEN** the service returns a typed conflict
- **AND** the snapshot and operation result remain unchanged

## Requirement: Writes use server-derived account scope and expected versions

The service MUST ignore client-supplied account identifiers, require the
authenticated identity, and compare the expected snapshot version in the
transaction.

### Scenario: Stale writer

- **WHEN** the expected version differs from the stored version
- **THEN** the service returns a typed conflict
- **AND** it writes neither a snapshot nor an operation result

### Scenario: Cross-account probe

- **WHEN** an identity submits another account's pilot ID
- **THEN** the service returns not found without disclosing ownership
