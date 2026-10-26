# Proposal

## Why

Mission completion still writes through the legacy runtime even though React already owns typed gameplay and inventory boundaries. Moving the completion transaction behind the typed boundary is the next safe slice toward retiring legacy globals while preserving offline play, pilot isolation, and recovery behavior.

## What Changes

- Route flagged React mission completion through one validated local progress transaction.
- Preserve facts, mission history, rewards, coins, rocket state, backups, and existing storage keys.
- Keep duplicate-completion protection and rollback when any progress write fails.
- Retain the legacy mission writer as the disabled-flag and failure fallback.
- Add unit, Chromium, mobile WebKit, accessibility, offline, and Chrome DevTools verification.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `react-core-screens`: Change the flagged mission ownership and rollback contract so React can own validated mission completion without removing the legacy fallback.
- `typed-pilot-persistence`: Extend the local pilot boundary contract to commit the complete mission progress transaction while preserving compatible payload fields.

## Impact

The change affects `src/lib/react-gameplay-persistence.ts`, the React mission shell and adapters, the legacy mission compatibility bridge, pilot-local storage and backup integration, unit/E2E tests, and OpenSpec acceptance evidence. No new dependency, storage key, network requirement, or production migration is expected.
