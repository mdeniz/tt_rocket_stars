# Proposal

## Why

The development build can enable Cloud access and render its authentication
panel, but the React-owned Settings navigation does not expose a tab for that
panel. Users therefore cannot reach the optional cloud account flow through the
normal interface even though the feature flag is enabled.

## What Changes

- Add a conditional Cloud access entry to the React Settings navigation.
- Keep the Cloud access panel and tab hidden when the cloud feature flag is disabled.
- Preserve local-first gameplay, authentication, storage keys, and signed-out no-request behavior.
- Add browser coverage that reaches Cloud access through its navigation tab.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `react-application-shell`: Cloud access is an accessible conditional Settings category when explicitly enabled.

## Impact

The change affects `src/shell.tsx`, Settings navigation E2E fixtures, and the
React application shell OpenSpec delta. It does not change Supabase operations,
authentication semantics, stable release output, or local persistence contracts.
