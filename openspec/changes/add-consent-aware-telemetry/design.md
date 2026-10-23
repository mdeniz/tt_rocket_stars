# Design

## Context

The application is an offline-first Vite site with no telemetry module or provider dependency. Existing gameplay and local storage must remain independent from optional account and future analytics work.

## Goals / Non-Goals

**Goals:**

- Make privacy and consent behavior explicit before instrumentation.
- Keep the default implementation deterministic, browser-compatible, and network-free.
- Give a future provider adapter a narrow, sanitized sink contract.

**Non-Goals:**

- Adding event calls to gameplay in this change.
- Persisting telemetry in local storage or sending it to a provider.
- Collecting account identifiers, pilot identity, answers, or replay traces.

## Decisions

- Use a factory returning a small service with `setConsent`, `record`, `flush`, `clear`, and `getQueuedEvents` operations. The API returns safe status values rather than throwing for rejected event input.
- Define event names and fields in the module. Unknown names and fields fail closed; numeric aggregates are finite and bounded.
- Keep the queue in memory and cap it. Accept an optional sink only through dependency injection; the default has no sink and never calls `fetch`.
- Use explicit deletion and opt-out semantics so a future UI can remove pending data without touching game progress.

## Risks / Trade-offs

- [In-memory events are lost on reload] → Accept this for the provider-independent boundary; persistence and delivery need a separate privacy review.
- [An overly narrow allowlist limits early learning] → Expand it only through a new reviewed specification and tests.
- [A sink can fail or be slow] → Catch sink failures and keep flush behavior isolated from gameplay.

## Migration Plan

No migration is required. Future instrumentation can inject the service without changing existing storage keys. Rollback removes the module and its tests/docs; no user data is affected.
