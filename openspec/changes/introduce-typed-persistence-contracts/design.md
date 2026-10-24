# Design

## Context

The legacy profile runtime stores a profile collection under `tt-rocket-profiles-v1` and keeps the active pilot's payload in existing gameplay keys such as `cosmotablas-v2`, `cosmotablas-history-v1`, and `tt-rocket-garage-v1`. Cloud synchronization serializes the active profile and stores version metadata separately. The migration must preserve these keys and support the existing global runtime while preparing an adapter for React.

## Goals / Non-Goals

**Goals:**

- Define runtime-safe schemas for profiles, payloads, backups, and cloud snapshots.
- Centralize validation and migration without changing public storage keys.
- Keep local gameplay usable when storage or cloud operations fail.
- Cover valid, malformed, legacy, restricted-storage, and cloud-boundary cases.

**Non-Goals:**

- Rewriting the legacy UI in React.
- Renaming or removing existing storage keys.
- Changing Supabase tables, RLS, or conflict semantics.
- Adding a new persistence dependency.

## Decisions

- Use framework-independent TypeScript contracts with runtime validators exposed through a small compatibility adapter. This keeps domain logic testable and avoids coupling persistence to React.
- Preserve the existing storage keys and payload shapes; migration normalizes reads and writes at the boundary instead of copying data into a second source of truth.
- Treat invalid persisted data as recoverable input. Return typed failure results and retain the last valid in-memory/local state rather than clearing storage.
- Keep backups as explicit versioned envelopes. Restore validates the complete envelope before mutating any active-pilot keys.
- Make cloud serialization and application call the same validators as local persistence. A failed cloud validation must be non-destructive.

## Risks / Trade-offs

- [Risk] Existing payloads contain partially dynamic legacy fields. → Mitigate with additive optional fields and fixture-based compatibility tests before tightening validation.
- [Risk] A validator can reject data that the legacy runtime currently tolerates. → Mitigate by preserving unknown payload fields and only requiring stable identity and envelope fields.
- [Risk] Adapter integration can create duplicate writes. → Mitigate by keeping one storage adapter as the write boundary and adding event-based compatibility hooks incrementally.

## Migration Plan

1. Add contracts, validators, and fixtures without changing runtime behavior.
2. Route profile and backup reads/writes through the adapter while preserving existing keys.
3. Route cloud serialization/application through the same contract and run the existing sync suite.
4. Roll back by restoring the legacy adapter path; no storage migration or key deletion is required.
