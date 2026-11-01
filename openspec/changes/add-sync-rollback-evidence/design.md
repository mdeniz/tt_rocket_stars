# Design

`createSyncService` accepts an optional `afterSnapshotWrite` callback. The
transaction invokes it after inserting or updating the progress snapshot and
before inserting the durable operation result. The integration test throws from
this callback, asserts both writes are absent, then constructs the normal
service and retries the same operation ID successfully.
