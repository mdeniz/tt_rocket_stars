# Sync recovery outcomes

## Requirement: typed failure outcomes

The client-facing sync boundary MUST classify conflicts, retryable busy/timeout failures, and permanent failures without exposing provider-specific implementation details to callers.

### Scenario: retryable failure preserves local state

- GIVEN an authenticated local pilot and a provider that returns a busy or timeout error
- WHEN bounded upload retries are exhausted
- THEN the result reports a retryable outcome
- AND local pilot data and sync metadata remain unchanged
- AND the user can retry explicitly with the existing sync control

### Scenario: conflict remains distinct

- GIVEN an optimistic version conflict
- WHEN upload handling receives the conflict
- THEN the result reports a conflict outcome
- AND the existing remote/local recovery flow remains available
