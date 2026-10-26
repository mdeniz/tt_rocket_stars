# Proposal

## Why

Mission facts, mission history, and mission rewards are still persisted by the browser-bound legacy mission script. This leaves the flagged React gameplay path without an explicit typed ownership boundary and makes the next migration unsafe: a partial move could mix pilot data, alter reward semantics, or bypass the existing backup contract. The change is needed now to complete the next safe slice of the React core-screen migration while keeping the published legacy path unchanged.

## What Changes

- Add a typed mission-progress ownership boundary for the enabled React gameplay path.
- Validate and persist multiplication facts, mission history, reward outcomes, and Rocket Coins through the active pilot's existing local payload.
- Preserve the existing storage keys, payload fields, backup envelope, pilot isolation, offline behavior, and legacy rollback path.
- Reuse the existing gameplay, progression, inventory-persistence, and persistence-runtime contracts instead of introducing a second payload shape.
- Keep the ownership flag disabled by default; the legacy mission runtime remains authoritative when the flag is disabled or unavailable.
- Add unit, Chromium E2E, mobile WebKit compatibility, offline, rollback, and Chrome DevTools empirical coverage for the migrated boundary.
- Do not add cloud synchronization, public registration, new storage keys, or removal of `public/legacy/scripts/03.js`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `react-core-screens`: React-owned mission actions must persist mission progress through a validated typed boundary and retain a fail-closed legacy fallback.
- `typed-pilot-persistence`: The pilot-local persistence contract must include validated mission facts, history, and reward/coin state while preserving compatible legacy payloads and backups.

## Impact

- Affected runtime areas: `src/lib/react-gameplay.ts`, `src/lib/react-gameplay-persistence.ts`, `src/lib/react-inventory-persistence.ts`, `src/lib/persistence-runtime.js`, the feature-flag bridge, and the legacy mission adapter.
- Affected tests: mission gameplay and persistence unit tests, feature-flag E2E tests, offline/rollback coverage, and Chrome DevTools verification scripts.
- Affected documentation: the OpenSpec change and the issue workflow; no user-facing translation strings are changed.
- No dependency, database, cloud, or published `index.html` behavior changes are required.
