# Proposal

## Why

The splash screen currently requests fullscreen for every browser when the player enters the game. This disrupts desktop users and does not reflect the product's intended mobile-first behavior.

## What Changes

- Restrict automatic fullscreen on splash entry to touch-oriented devices.
- Preserve manual fullscreen controls and non-blocking fallback behavior.
- Add E2E coverage for desktop, narrow desktop, and touch-capability entry.
- Document that browser emulation does not replace real iOS Safari validation.

## Capabilities

### New Capabilities
- `splash-fullscreen`: Controls automatic fullscreen behavior during splash entry.

### Modified Capabilities
- None.

## Impact

The splash entry script and smoke E2E tests change. No APIs, storage keys, dependencies, or external services are affected.
