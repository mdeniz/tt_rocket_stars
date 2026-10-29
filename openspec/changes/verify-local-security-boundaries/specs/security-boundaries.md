# Security boundaries

## Requirement: Enforce deterministic local limits

The API MUST apply a local rate limit without hosted credentials and MUST return a retry interval when the limit is exceeded.

### Scenario: Synthetic client exceeds local limit

- **WHEN** a synthetic client exceeds its configured local request budget
- **THEN** the API rejects the request with 429 and a `Retry-After` value.

## Requirement: Isolate account resources

Repositories MUST derive ownership from authenticated identity and MUST NOT trust client-supplied account identifiers.

### Scenario: Cross-account resource lookup

- **WHEN** account B requests account A's pilot
- **THEN** the repository returns no resource and does not disclose account A data.
