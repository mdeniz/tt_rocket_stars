# Tasks

## 1. Domain queue

- [x] 1.1 Add a single FIFO cloud-operation gate that serializes upload, download, listing, restore, and deletion requests while preserving existing result statuses; verify the focused cloud-sync unit tests pass.
- [x] 1.2 Integrate session cancellation with the queue so pending work cannot start after sign-out or session replacement; verify cancellation and recovery tests pass without changing local storage keys.

## 2. Regression coverage and operational documentation

- [x] 2.1 Add unit tests for concurrent operations, coalesced saves, provider rejection, timeout recovery, and local-progress preservation; verify the complete unit suite passes.
- [x] 2.2 Document pool monitoring, stale-session diagnosis, and the targeted cleanup procedure without recording credentials or enabling automatic termination; verify the commands are read-only except for the explicitly targeted cleanup query.

## 3. Integration verification

- [ ] 3.0 Replace the `FOR UPDATE NOWAIT` snapshot procedure with a bounded,
  atomic version-qualified update; verify concurrent writes produce `40001`
  conflicts and only prolonged locks produce `55P03`.
- [ ] 3.0a Bound the ownership-scoped pilot upsert that precedes snapshot
  writes; verify concurrent uploads cannot wait past the edge-function timeout
  and prolonged pilot-row contention is classified as `55P03`.
- [ ] 3.0b Route trusted uploads through one atomic pilot-and-snapshot RPC;
  verify concurrent uploads use one database operation boundary and preserve
  the existing `40001`/`55P03` contracts.
- [ ] 3.0c Bound trusted upload acquisition to 2.5 seconds and classify the
  timeout as retryable busy; verify concurrent uploads do not wait for the
  general 8-second edge timeout.
- [x] 3.1 Run `npm run check`, strict OpenSpec validation, and the configured browser verification; record exact results and unavailable integrations.
- [ ] 3.2 Repeat hosted verification with two disposable invited accounts, confirm no overlapping trusted-cloud requests during normal UI actions, and inspect PostgREST activity for pool timeouts; keep the related issue in `status:verification` until all evidence is recorded.

## Workflow follow-up

- Archive the change only after implementation, review, CI, and hosted verification are complete.
