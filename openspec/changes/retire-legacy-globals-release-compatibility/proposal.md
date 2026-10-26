# Proposal

## Why

The React ownership slices are now available, but the application still loads duplicate legacy sources of truth for mission writes, pilot switching, cloud compatibility, and fallback rendering. This keeps release ownership ambiguous and prevents a safe promotion of the development build into the stable channel.

## What Changes

- Establish a release-gated retirement process for legacy globals and duplicate renderers.
- Complete parity and rollback evidence for mission persistence, pilot lifecycle, cloud synchronization, settings, backup compatibility, and migrated screen navigation.
- Remove only legacy scripts, globals, and duplicate DOM ownership that have no remaining enabled-path consumers.
- Keep the ordered legacy runtime and stable `index.html` fallback until the retirement gate passes.
- Add dependency checks that fail when a proposed legacy removal still has inline-handler, adapter, backup, cloud, or rollback consumers.
- Record promotion and rollback evidence for `index_next.html`, including stable artifact preservation and offline startup.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `react-core-screens`: require an evidence-backed ownership cutover before removing legacy screen and action fallbacks.
- `typed-pilot-persistence`: require legacy-compatible payload, backup, and cloud contract coverage before removing legacy persistence bridges.
- `stable-release-channel`: require an explicit release gate and rollback decision before promoting the React development runtime to the stable entrypoint.

## Impact

- Affected source: `public/legacy/scripts/02.js`, `03.js`, `04.js`, `05.js`, `26.js`, and `32.js`; React adapters under `src/lib/` and `src/`; `index.html`/`index_next.html` build and Pages workflows.
- Affected contracts: local storage keys, backup envelopes, pilot isolation, cloud snapshot versioning, inline handlers, feature-flag rollback, and self-contained release output.
- Affected verification: unit tests, full desktop and mobile browser suites, static dependency checks, and empirical browser evidence when the Chrome DevTools MCP is available.
- No data migration, storage-key rename, mandatory network request, or stable release promotion is in scope until all retirement gates pass.
