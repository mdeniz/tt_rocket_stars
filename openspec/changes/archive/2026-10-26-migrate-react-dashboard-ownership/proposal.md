# Proposal

## Why

The flag-enabled React shell currently adds navigation and small composition
labels, but the dashboard and progress screens still depend on legacy DOM
rendering. React cannot own or verify these views independently while the
legacy renderer remains their source of truth.

## What Changes

- Add a deterministic React dashboard/progress evaluator for pilot-local facts and mission history.
- Render the flag-enabled dashboard and progress metrics from the evaluator without reading legacy dashboard DOM.
- Preserve existing storage keys, translations, offline behavior, and the disabled-flag legacy path.
- Add unit, Chromium, mobile WebKit, and Chrome DevTools verification for the migrated surfaces.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `react-core-screens`: The flag-enabled dashboard and progress screens render their observable metrics from pilot-local data through the React boundary.

## Impact

Affected areas are `src/shell.tsx`, a new pure dashboard evaluator under
`src/lib/`, local translations, feature-flag E2E tests, migration
documentation, and the existing React core-screen OpenSpec capability. No
dependency, storage-key, network, or published-default changes are required.
