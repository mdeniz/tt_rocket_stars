# Proposal

## Why

The React mission player exposes the speed mode and its 60-second countdown contract, but the UI timer loop currently updates only timed missions. As a result, flagged React speed missions cannot advance to timeout completion, leaving the migrated flow behaviorally incomplete.

## What Changes

- Run the React mission timer for both timed and speed modes.
- Preserve the existing 60-second speed timeout and timed-duration semantics.
- Persist the timeout completion through the existing typed mission-progress boundary.
- Add unit, browser, build, and Chrome DevTools evidence for speed countdown and completion.
- Keep the disabled React flag on the legacy mission path.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `react-core-screens`: Complete the observable timer and timeout behavior for flagged React speed missions.

## Impact

The change affects `src/shell.tsx`, React mission E2E coverage, and the existing `react-core-screens` OpenSpec delta. It does not change local-storage keys, public APIs, the legacy runtime, dependencies, or the published feature-flag default.
