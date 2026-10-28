# Design

## Context

The existing cloud sync domain serializes uploads but allows listing, restore,
download, and deletion to call the provider independently. The trusted Edge
Function already has request timeouts and the client already cancels uploads;
this change adds one operation boundary around all provider calls.

## Goals / Non-Goals

**Goals:**

- Allow at most one provider request per authenticated cloud boundary at a time.
- Preserve upload coalescing, bounded retries, cancellation, conflict handling,
  local-first behavior, and existing result statuses.
- Make queue behavior deterministic and testable without Supabase credentials.

**Non-Goals:**

- Changing Supabase schema, RLS, Edge Function secrets, or connection limits.
- Terminating database sessions automatically from the browser.
- Serializing independent users across browser instances or devices.

## Decisions

- Use a small FIFO operation gate in the domain cloud-sync layer. This keeps
  provider implementations unchanged and prevents browser callers from
  bypassing serialization.
- Keep upload coalescing inside the gate. A queued local save replaces an older
  queued save, while an already running operation is allowed to finish or be
  cancelled by the session lifecycle.
- Treat cancellation as a terminal result rather than a retryable provider
  failure. This prevents stale sessions from re-entering the queue.
- Keep the existing Edge Function timeout as a second safety boundary. A queue
  prevents concurrency spikes but cannot repair a provider that is already
  unhealthy.

## Risks / Trade-offs

- [Risk] A slow cloud request delays a manual action → [Mitigation] retain the
  existing request timeout and expose the existing pending/error status.
- [Risk] A queue bug could starve later operations → [Mitigation] add tests for
  success, rejection, timeout, cancellation, and recovery of the next item.
- [Risk] Other browser instances can still consume the hosted pool →
  [Mitigation] document server-side monitoring and keep pool cleanup targeted
  to stale PostgREST sessions only.

## Migration Plan

No database migration is required. Roll out the browser change behind the
existing development entrypoint, run unit/E2E/build checks, then repeat hosted
sync, restore, deletion, and pool-observation checks before any stable release
promotion.
