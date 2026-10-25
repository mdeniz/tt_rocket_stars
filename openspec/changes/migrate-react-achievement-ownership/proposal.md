# Proposal

## Why

The flag-enabled React achievements panel currently mirrors DOM output produced
by the legacy runtime. That keeps the legacy renderer as the source of truth
and prevents the React surface from being tested independently.

## What Changes

- Add a typed, deterministic achievement evaluator for pilot-local mission
  statistics and history.
- Render the flag-enabled React achievements panel from the evaluator instead
  of reading `#awardGrid` or invoking legacy refresh actions.
- Preserve existing local-storage keys, achievement thresholds, translations,
  and the disabled-flag legacy path.

## Impact

This is an incremental ownership slice for issue #53. It does not remove the
legacy scripts or change the published default. The existing legacy storage
payloads remain the input contract until the broader persistence migration is
complete.
