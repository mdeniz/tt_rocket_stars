# Proposal

## Why

The React ownership slices are now implemented behind a development flag, while the
ordered legacy runtime still supplies the published stable behavior and several
compatibility mirrors. A final cutover contract is needed to remove duplicate
sources of truth safely without changing the stable `index.html` artifact or
breaking offline data.

This is timely because the prerequisite ownership slices are merged and issue #54
is no longer blocked by their implementation. The remaining work is release
retirement and evidence, not another isolated feature slice.

## What Changes

- Define the ownership and dependency boundary for every legacy global still loaded
  by the React-enabled development entrypoint.
- Make `index_next.html` the verification target for the React cutover while keeping
  `index.html` as the stable release copy until an explicit promotion.
- Remove or isolate legacy scripts only after their consumers, storage contracts,
  and rollback paths are covered by automated and empirical checks.
- Add build and release assertions for entrypoint separation, self-contained output,
  stable storage keys, and the absence of privileged credentials.
- Document the rollback and promotion procedure.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `react-core-screens`: React ownership becomes the verified development runtime
  only after all legacy consumers and rollback behavior are accounted for.
- `typed-pilot-persistence`: The cutover preserves local keys, backups, and cloud
  snapshot compatibility while retiring duplicate write ownership.
- `stable-index-next`: The development entrypoint becomes the cutover verification
  artifact while the stable root entry remains unchanged until promotion.
- `stable-release-channel`: Release checks enforce the ownership boundary and
  explicit stable promotion procedure.

## Impact

Affected areas include `src/shell.tsx`, typed persistence and cloud adapters,
ordered legacy scripts under `public/legacy/scripts/`, `vite.config.mjs`, release
validation scripts, Playwright tests, OpenSpec documentation, and the deployment
workflow. No storage-key rename, backup-format change, service-role credential, or
mandatory network dependency is allowed.
