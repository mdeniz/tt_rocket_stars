# Proposal

## Why

An authenticated cloud deletion can be preceded by an automatic upload of the active pilot. If that upload times out, the confirmed deletion may not reach the provider, leaving the user with only a generic synchronization error. The local-first safety guarantee is preserved, but the explicit destructive action is ambiguous and cannot be retried reliably.

## What Changes

- Keep queued cloud operations progressing after a rejected, aborted, or timed-out operation.
- Give confirmed deletion its own bounded result and user-facing status instead of inheriting an upload failure.
- Add regression tests for an upload failure followed by deletion.
- Record the failure-safe and successful deletion evidence in the cloud verification documentation.

## Capabilities

### New Capabilities

- `cloud-operation-reliability`: Defines bounded, observable continuation of authenticated cloud operations, including deletion after an earlier operation fails.

### Modified Capabilities

- None.

## Impact

- Affects `src/lib/cloud-sync.js`, the trusted cloud adapter boundary, unit/E2E tests, and cloud verification documentation.
- No database schema, storage key, credential, or stable release artifact changes are required.
