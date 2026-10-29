# backend-sync-integrity Specification

## Requirements

### Requirement: Uploads are atomic and idempotent per account

The server MUST persist a validated pilot/progress upload and its durable
operation result in one account-scoped transaction.

#### Scenario: Operation is replayed after an ambiguous timeout

- **WHEN** the client retries the same operation ID and request hash
- **THEN** the service returns the original bounded result
- **AND** it MUST NOT apply the progress mutation twice

#### Scenario: Operation key is reused with different content

- **WHEN** an account submits an existing operation ID with a different request
  hash
- **THEN** the service rejects the request
- **AND** the pilot and snapshot remain unchanged

### Requirement: Concurrency and ownership fail closed

The service MUST derive account ownership from the authenticated server
identity, compare expected versions inside the transaction, and never use a
client-supplied account ID for authorization.

#### Scenario: Stale writer submits an upload

- **WHEN** the expected snapshot version is older than the stored version
- **THEN** the service returns a conflict
- **AND** no pilot, snapshot, or idempotency result is committed as a write

#### Scenario: Account probes another account

- **WHEN** an authenticated account submits another account's pilot or
  operation identifier
- **THEN** the service returns a bounded forbidden/not-found result
- **AND** no other account data is disclosed

### Requirement: Failures preserve local-first recovery

Cloud failure, timeout, deletion failure, or unavailable hosted validation MUST
NOT delete or overwrite local pilot progress or JSON backups.

#### Scenario: Transaction fails after an intermediate write

- **WHEN** the database transaction aborts at any upload boundary
- **THEN** all server-side mutations roll back
- **AND** the client retains local progress and a recoverable retry path
