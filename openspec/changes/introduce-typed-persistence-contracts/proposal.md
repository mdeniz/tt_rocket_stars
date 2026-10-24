# Proposal

## Why

Pilot persistence currently depends on ordered legacy scripts, stringly-typed storage keys, and ad hoc JSON parsing. The cloud adapter and future React UI need one validated contract that preserves existing pilots and backups while making malformed or restricted storage safe.

## What Changes

- Introduce typed persistence contracts for pilots, payloads, backups, and cloud snapshots.
- Validate persisted and imported data at the boundary and reject invalid values without deleting the current state.
- Preserve all existing localStorage/sessionStorage keys, legacy profile formats, and backup compatibility.
- Provide an adapter boundary that can be consumed by legacy globals and future React components.
- Add unit and browser coverage for migration, restricted storage, backup round-trips, and cloud contract compatibility.

## Capabilities

### New Capabilities

- `typed-pilot-persistence`: Validated, per-pilot local persistence and backup contracts compatible with the existing application data.

### Modified Capabilities

- `technical/offline-web-app`: Local progress retention and restricted-storage behavior gain explicit validation and migration guarantees.
- `product/gameplay-and-progress`: Pilot separation and backup/restore behavior gain validated persistence boundaries.

## Impact

Affected areas include `public/legacy/scripts/02.js`, local storage helpers, backup/restore flows, `src/lib/cloud-sync.js`, typed domain contracts, unit tests, Playwright tests, and the relevant OpenSpec specifications. No external dependency or storage-key rename is required.
