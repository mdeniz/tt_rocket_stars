# Tasks

## 1. Telemetry boundary

- [x] 1.1 Implement the consent-gated, allowlisted, sanitized, bounded in-memory telemetry service and verify rejected payloads never enter the queue.
- [x] 1.2 Add unit coverage for defaults, consent transitions, sanitization, queue bounds, deletion, sink isolation, and sink failures with `node --test tests/unit/telemetry.test.cjs`.
- [x] 1.3 Document the provider-independent privacy contract and integration boundary in `docs/telemetry.md`.

## 2. Browser compatibility

- [x] 2.1 Add browser-level coverage for consent, offline-safe recording, and absence of default network requests in `tests/e2e/telemetry.spec.cjs`.
- [x] 2.2 Run the full configured test and build checks and validate the OpenSpec change strictly.

## Workflow follow-up

- Archive the completed OpenSpec change after the implementation is reviewed and merged.
