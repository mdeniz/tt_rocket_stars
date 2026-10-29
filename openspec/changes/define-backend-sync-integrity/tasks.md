# Tasks

- [x] Audit cloud sync specifications, client/provider boundaries, schema, and
  prior sync issues.
- [x] Document atomicity, idempotency, concurrency, errors, recovery, and
  isolation requirements.
- [x] Define dependency-ordered implementation and hosted validation slices.
- [x] Record offline-first and no-production-dual-write constraints.
- [ ] Implement the local PostgreSQL atomic sync service.
- [ ] Add rollback, replay, lock-contention, timeout, and cross-account tests.
- [ ] Map typed server outcomes into the client recovery UX.
- [ ] Perform approval-gated hosted migration/provider verification.
