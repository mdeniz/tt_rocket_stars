# Proposal: Add sync rollback evidence

Add a test-only failure seam to the local atomic progress service and verify
that PostgreSQL rolls back a snapshot mutation when the operation ledger write
cannot complete. Retry the same operation ID afterward to document the safe
recovery contract for ambiguous transport failures.

The seam is supplied only to the service factory in tests. It is not exposed by
the Hono route and does not alter frontend, hosted, or production behavior.
