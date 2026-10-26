# Proposal

## Why

The development build currently hides the legacy animated launch scene as soon as the React shell mounts, then displays a full-screen placeholder splash. This makes the intended animation invisible and creates a misleading first-paint experience.

## What Changes

- Keep the legacy animated launch scene as the visible splash when it is available.
- Use the React splash only as a fallback when the legacy launch scene is unavailable.
- Preserve the existing one-gesture entry, fullscreen policy, offline behavior, and accessibility semantics.
- Add automated regression coverage for splash layering and fallback behavior.
- Record browser evidence against the development `index_next.html` path.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `react-application-shell`: preserve the animated legacy splash as the visible entry surface while retaining a React fallback.

## Impact

Affected areas are `src/shell.tsx`, splash styling, startup E2E coverage, and the development OpenSpec artifacts. The stable release entrypoint and persistence contracts are unchanged.
