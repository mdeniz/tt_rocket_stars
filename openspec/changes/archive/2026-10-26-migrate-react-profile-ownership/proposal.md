# Proposal

## Why

The repository already exposes a typed React pilot persistence adapter, but the legacy profile runtime in `public/legacy/scripts/02.js` still owns profile switching, creation, deletion, and active-payload synchronization. This prevents the legacy-retirement initiative from having a complete, independently verifiable ownership boundary and leaves React behavior coupled to legacy profile mutators.

## What Changes

- Move the remaining local profile lifecycle operations behind the typed React persistence boundary.
- Preserve existing profile and active-pilot storage keys, payload fields, language behavior, limits, and backup compatibility.
- Add typed delete, rename, and profile restoration operations where the current adapter is incomplete.
- Keep legacy profile handlers as a disabled-flag fallback and compatibility adapter.
- Add unit, browser, offline, accessibility, and Chrome DevTools evidence for the migrated profile lifecycle.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `typed-pilot-persistence`: React-owned profile lifecycle operations must preserve the existing local pilot contract and legacy-compatible rollback behavior.

## Impact

- Affected code: `src/lib/react-pilot-persistence.ts`, `src/shell.tsx`, profile adapters, and the legacy compatibility boundary.
- Affected tests: pilot persistence unit tests, profile E2E coverage, feature-flag rollback and accessibility checks.
- No dependency, storage-key, Supabase schema, public release-default, or network requirement changes.
