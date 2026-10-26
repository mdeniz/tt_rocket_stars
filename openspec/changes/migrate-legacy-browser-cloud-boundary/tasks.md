# Tasks

## 1. Boundary inventory and contract

- [x] 1.1 Inventory every remaining browser cloud consumer, direct table/RPC call, public configuration path, and legacy fallback; verify the inventory names source files, consumers, operation families, and removal gates.
- [x] 1.2 Resolve the trusted transport available in the deployment environment without introducing a new dependency or service; verify the decision is recorded with credential, authentication, and rollback constraints.
- [x] 1.3 Define domain request, response, error, and capability contracts for upload, download, discovery, conflict resolution, retry status, and cloud deletion; verify TypeScript typecheck and contract fixtures compile without provider imports.
- [x] 1.4 Add a reversible adapter seam and feature flag with local-first defaults; verify the disabled path performs no cloud request and preserves existing local storage keys.

## 2. Upload, download, and conflict migration

- [x] 2.1 Implement the domain-backed upload and download adapter for pilot and progress snapshots; verify owned reads/writes and authenticated context through in-memory provider contract tests.
- [x] 2.2 Migrate optimistic concurrency, stale-write conflicts, recovery backups, and local-versus-remote selection through the boundary; verify conflict unit tests preserve the remote snapshot and local recovery path.
- [x] 2.3 Preserve bounded retries, malformed remote payload handling, and provider failure status reporting; verify cloud-sync unit tests and offline browser scenarios pass without replacing local state.
- [x] 2.4 Document the operation contract, fallback flag, and failure semantics; verify each documented command and flag matches the implementation.

## 3. Discovery and deletion migration

- [x] 3.1 Move cloud pilot discovery and restore behind the domain contract; verify account isolation and cloud-only pilot restore in Chromium and WebKit tests.
- [x] 3.2 Move cloud deletion and sign-out cleanup behind the domain contract; verify cloud deletion leaves local pilots, progress, and backups intact.
- [x] 3.3 Preserve invited password authentication and public configuration validation; verify rejected credentials, recovery, invitation, logout, and missing-configuration tests remain green.
- [x] 3.4 Remove provider-specific query construction from the active migrated browser path while retaining only the explicitly gated fallback; verify provider references remain isolated to the compatibility adapter and guarded fallback.

## 4. Integration and release compatibility

- [x] 4.1 Verify the final bundle contains no service-role or administrative credential and no provider-management operation; verify the artifact inspection fails closed on privileged fixtures.
- [x] 4.2 Run `npm run check`, full Chromium, Firefox, desktop WebKit, and mobile WebKit suites; verify all configured checks pass with no unexpected network requests in offline scenarios.
- [x] 4.3 Verify stable `index.html`, development `index_next.html`, local storage keys, backup envelopes, pilot identifiers, translations, and rollback flag behavior; verify release and retirement guards pass.
- [x] 4.4 Exercise the migrated behavior in the running application and record URL, action, observed result, and console/network evidence; explicitly record Chrome DevTools MCP or real Safari as unavailable when not connected.
- [ ] 4.5 Update #170 and this issue with acceptance evidence, security findings, CI links, rollback readiness, and the decision to remove or retain the fallback; verify the issues remain open until every criterion is satisfied.

## Workflow follow-up

- Archive this OpenSpec change only after implementation PRs are integrated and the final audit is complete.
- Update or archive the #170 OpenSpec change after this follow-up resolves task 4.3.
