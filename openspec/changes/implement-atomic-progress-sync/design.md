# Design

The API exposes `POST /api/v1/sync/uploads` behind the existing session
boundary. The request's optional account identifier is ignored. The service
locks the account-owned pilot and snapshot, checks the operation ledger and
expected version, writes the next snapshot version, and records a bounded
result under the same transaction.

Identical operation IDs with the same canonical request hash return the stored
result. Reuse with different content and stale versions fail with a typed
conflict before any mutation. Missing or foreign pilots return a bounded
not-found response. The implementation uses the existing PostgreSQL adapter;
the route remains configuration-erroring when no database is provided.
