# Proposal

## Why

Cloud access is still visible in the published settings UI while its account flow is under development. At the same time, replacing the root self-contained filename makes it difficult to keep the current stable entry point available while publishing a new build for review.

## What Changes

- Hide Cloud access and its settings category when the local build flag is not explicitly enabled.
- Keep the cloud runtime available for controlled development and E2E coverage through an explicit local flag.
- Generate the self-contained application as `dist/index_next.html`.
- Keep a minimal `dist/index.html` compatibility redirect to `index_next.html` for GitHub Pages root navigation.
- Update release validation, release publishing, Pages deployment documentation, and changelog references.

## Capabilities

### New Capabilities
- `stable-release-channel`: Provides a stable root entry point while publishing the next self-contained application artifact under an explicit filename.

### Modified Capabilities
- `technical/offline-web-app`: Updates the production distribution contract to distinguish the self-contained `index_next.html` artifact from the root compatibility entry point.

## Impact

Affected areas include the Settings navigation and optional cloud runtime, Vite build output, distribution validation, GitHub Pages and GitHub Release workflows, E2E fixtures, README, and CHANGELOG. No storage keys, cloud data contracts, or legacy gameplay behavior change.
