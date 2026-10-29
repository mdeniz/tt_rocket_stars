# Backend synchronization integrity audit

This is the local audit/decomposition step for issue #253. Existing sync
runtime behavior remains authoritative; follow-up implementation must be split
into small changes and must not introduce production dual writes.

## Current contract and evidence

- `technical/cloud-progress-sync` defines the provider-neutral browser boundary,
  ownership/version checks, conflict recovery, bounded retry, deletion safety,
  and local progress preservation.
- `cloud-operation-reliability` defines queue settlement and independent cloud
  deletion outcomes after failed, aborted, or timed-out operations.
- `src/lib/cloud-sync.js` serializes uploads, validates snapshots, persists
  local sync metadata, handles optimistic conflicts, creates recovery backups,
  and keeps signed-out/offline gameplay local.
- Trusted browser transport and typed data-access tests ensure that the browser
  does not construct provider table/RPC queries and that account identity is
  bound at the repository boundary.
- The local Drizzle schema has account-scoped `progress_snapshots` and durable
  `sync_operations` with a unique `(account_id, operation_id)` key. This is a
  foundation, not evidence that the atomic server upload service exists.

## Required server contract

One upload operation MUST run in one database transaction:

1. Resolve the authenticated account on the server; never trust a client
   account/user identifier.
2. Validate the versioned pilot and snapshot payload before mutation.
3. Acquire the account/pilot concurrency boundary, compare the expected
   version, and reject stale writes without changing the snapshot.
4. Insert or replay the account-scoped idempotency key. A replay returns the
   original bounded result and never applies the mutation twice.
5. Persist pilot metadata and progress together, then commit the operation
   result. An ambiguous timeout is retried with the same operation key.

Typed outcomes should distinguish `unauthenticated`, `forbidden`, `invalid`,
`conflict`, `busy`, `retryable`, `replayed`, and `failed` without exposing
provider SQL or account existence. Correlation/request IDs may be logged only
after credential and payload redaction.

## Isolation and recovery matrix

| Case | Expected result | Local state |
| --- | --- | --- |
| Anonymous upload/read | Denied | Unchanged |
| Other account pilot/operation key | Not found or forbidden, non-disclosing | Unchanged |
| Stale expected version | Conflict, no write | Preserved; recovery backup available |
| Same operation key and same request hash | Replay original result | Preserved |
| Same key with different request hash | Invalid/idempotency conflict | No mutation |
| Transaction failure or timeout | Bounded retry/retryable result | Never deleted or overwritten |
| Cloud deletion failure | Deletion-specific failure | Pilot, progress, and backups remain |

## Dependency-ordered follow-up slices

Existing issues #5, #11, #13, #27, #30, #32, #33, and #35 are prior sync
work, not duplicates. Remaining implementation should follow this order:

1. Local PostgreSQL atomic sync service: transaction, typed errors, account
   predicates, version checks, and idempotent replay.
2. Fault-injection and concurrency integration tests: rollback at each write
   boundary, ambiguous timeout replay, stale writers, lock contention, and
   cross-account probes using Docker PostgreSQL.
3. Provider-neutral client adapter/recovery UX: map typed outcomes to existing
   backup/conflict/retry states without changing local storage contracts.
4. Migration/hosted validation: staged mapping of existing Supabase data,
   provider/RLS checks, operational rate limits, and explicit no-dual-write
   rollout evidence.

Every slice must preserve JSON backup compatibility, local gameplay without a
network, and account/pilot isolation. Hosted provider checks remain separate
approval-gated evidence and are not inferred from local tests.

## Verification status

This audit is locally verifiable through source/spec inspection and the
existing unit/E2E/build suite. Real PostgreSQL fault injection for the future
atomic service, hosted RLS/provider validation, and production migration checks
are not claimed here. No production Supabase, Neon, DNS, secrets, or traffic
were changed.
