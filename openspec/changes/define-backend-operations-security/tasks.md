# Tasks

## Local audit and decomposition

- [x] Record existing local CI, API, database, authorization, privacy, backup,
  migration, and logging controls.
- [x] Document provider-neutral boundaries and explicit hosted limitations.
- [x] Create independent follow-up issues with dependencies and acceptance
  criteria.

## Follow-up implementation

- [ ] Implement request correlation, privacy-safe error monitoring, and incident
  runbooks.
- [ ] Add dependency/security gates and secret scanning to CI.
- [ ] Verify least-privilege roles, local rate limiting, and cross-account
  security behavior.
- [ ] Add reproducible bootstrap, local load/quotas tests, and deployment
  environment contracts.
- [ ] Perform separately approved hosted monitoring, recovery, quota, and traffic
  checks.

## Workflow follow-up

Keep issue #255 in `status:verification` until all follow-up slices and hosted
evidence are complete. Archive this change only after the epic acceptance
criteria, security review, CI, and operational evidence are complete.
