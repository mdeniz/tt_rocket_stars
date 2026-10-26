# Tasks

## 1. Ownership inventory and retirement guards

- [ ] 1.1 Build a machine-readable inventory of legacy globals, inline handlers, ordered script consumers, typed adapters, and fallback owners; verify every row has one owner and a removal decision in `docs/react-ownership-matrix.md`.
- [ ] 1.2 Add a static retirement guard that fails when a removed script/global is still referenced by HTML, legacy scripts, React adapters, tests, or release configuration; verify it fails on an intentionally invalid fixture.
- [ ] 1.3 Add disabled-flag browser coverage for startup, navigation, profiles, missions, settings, backups, garage, and achievements; verify the legacy path remains usable without storage mutation.

## 2. Mission and screen ownership parity

- [ ] 2.1 Complete typed parity for mission setup, multiplication/division gameplay, timers, auto-next, audio, rewards, facts, history, coins, and achievements; verify unit contracts and enabled-flag E2E flows for each mode.
- [ ] 2.2 Verify malformed mission payloads and failed writes preserve the last valid local snapshot; verify rollback tests cover every protected storage key.
- [ ] 2.3 Remove only proven-unused duplicate screen renderers or mission globals; verify the ownership guard, full desktop E2E, mobile WebKit E2E, and disabled-flag fallback.
- [ ] 2.4 Update the ownership matrix and migration documentation for the retired responsibility; verify all technical documentation is in English and links to the passing evidence.

## 3. Profile, backup, and cloud bridge parity

- [ ] 3.1 Complete the profile lifecycle audit across create, select, rename, delete, language, backup, settings, and cloud restore; verify pilot isolation and all protected storage keys remain unchanged.
- [ ] 3.2 Complete the cloud bridge audit across invited password login, redirect recovery, upload/download, conflict handling, deletion, RLS isolation, unavailable provider, and no privileged browser credential; verify unit and browser evidence.
- [ ] 3.3 Remove only proven-unused profile or cloud compatibility globals; verify local-only startup, offline gameplay, malformed storage, authenticated sync, and disabled-flag rollback.
- [ ] 3.4 Update persistence contracts and ownership documentation for each retired bridge; verify backup envelopes and unknown payload fields round-trip unchanged.

## 4. Stable release promotion gate

- [ ] 4.1 Add release assertions for the zero-consumer retirement result, stable artifact preservation, explicit promotion, and rollback; verify invalid release fixtures fail.
- [ ] 4.2 Run `npm run check`, full desktop browser E2E, mobile WebKit E2E, strict OpenSpec validation, and `git diff --check`; record exact results in the change evidence.
- [ ] 4.3 Run Chrome DevTools MCP against `index_next.html` when available and record URL, actions, visible results, storage evidence, console output, and network output for every migrated scenario; record the integration as unavailable if it cannot connect.
- [ ] 4.4 Verify the Pages workflow publishes the latest released self-contained HTML as `index.html`, keeps the current build as `index_next.html`, and can restore the previous release; verify both artifacts contain no external runtime dependencies.

## 5. Integration and issue audit

- [ ] 5.1 Review all issue acceptance criteria, OpenSpec requirements, CI jobs, review findings, and security findings; verify no unresolved dependency remains before changing issue status.
- [ ] 5.2 Update #54 and #158 with the ownership matrix, exact evidence, unavailable checks, promotion decision, and rollback instructions; verify both issues use `status:verification` until every criterion is complete.

## Workflow follow-up

- Archive this change only after implementation, review, CI, and empirical verification pass.
- Promote React ownership to stable only through the explicit release workflow after the retirement gate is complete.
