# Proposal

## Why

The hosted Supabase free-tier pool previously accumulated stale PostgREST transactions and returned `PGRST003` connection-pool timeouts. The browser currently coalesces uploads, but independent list, restore, deletion, and automatic synchronization paths can still overlap, so the cloud boundary needs one bounded operation queue.

## What Changes

- Serialize all browser cloud operations through one provider boundary queue.
- Preserve local-first behavior and keep cloud failures non-blocking for gameplay.
- Keep the existing upload coalescing, retry limits, cancellation, timeout, and conflict behavior.
- Add diagnostics and tests proving that concurrent operations do not issue overlapping trusted-cloud requests.
- Document operational monitoring for stale PostgREST transactions and pool timeouts.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `technical/cloud-progress-sync`: Cloud operations are serialized and bounded so concurrent browser actions cannot exhaust the hosted connection pool.

## Impact

- Affects `src/lib/cloud-sync.js`, the trusted cloud transport tests, hosted verification evidence, and Supabase operational documentation.
- No database schema, credentials, local-storage keys, or public release entrypoint changes are required.
- The change does not automatically terminate database sessions or change Supabase plan settings.
