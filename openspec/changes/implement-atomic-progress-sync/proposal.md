# Proposal: Implement atomic progress uploads

Implement the first runtime slice of the sync protocol defined by #253. The
service will accept a versioned upload envelope, derive tenant scope from the
authenticated server identity, and commit the progress snapshot and operation
result in one PostgreSQL transaction.

The change is local-first and does not enable frontend traffic or access hosted
providers. Existing browser storage and recovery behavior remain unchanged.
