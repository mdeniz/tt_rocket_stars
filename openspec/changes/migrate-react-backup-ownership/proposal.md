# Proposal

## Why

The application still delegates backup creation, restore, import, export, and reset mutations to `public/legacy/scripts/05.js`. This legacy ownership blocks issue #54 even though the typed persistence boundary already protects pilot and inventory migrations. A dedicated backup slice is needed now to preserve the existing offline backup contract while making the React path independently testable and reversible.

## What Changes

- Add a typed backup persistence contract for create, list, validate, restore, import, export, and reset operations.
- Move backup mutations and recovery-before-replacement behavior behind the React-compatible persistence boundary.
- Preserve `tt-rocket-backups-v1`, the version-1 envelope, existing gameplay keys, per-pilot separation, confirmations, and localized messages.
- Keep the legacy backup implementation as a feature-flagged rollback path until browser and empirical verification pass.
- Add unit, Chromium E2E, mobile WebKit compatibility, and Chrome DevTools evidence for valid, invalid, offline, and rollback flows.

## Capabilities

### New Capabilities

<!-- No new capability; this change refines existing persistence and React ownership contracts. -->

### Modified Capabilities

- `typed-pilot-persistence`: Make the typed boundary authoritative for local backup operations while preserving the existing envelope and fail-safe restore behavior.
- `react-core-screens`: Require backup controls to use the typed boundary and retain the disabled-flag legacy rollback path.

## Impact

- Affects `src/lib/shell-adapters.ts`, a new typed backup persistence module, the settings backup integration, and the legacy backup compatibility bridge.
- Adds unit and Playwright coverage plus Chrome DevTools verification evidence.
- Changes no storage keys, backup envelope fields, dependencies, Supabase schema, or stable release defaults.
