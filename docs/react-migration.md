# React migration boundary

The application currently starts through ordered classic scripts. The hidden `#react-root` element and `src/main.tsx` provide a typed React mount contract for incremental migration, but the bootstrap is intentionally not imported by `index.html` yet.

Legacy navigation, inline handlers, storage keys, translations, and the self-contained release remain authoritative by default. When `reactCoreScreens` is explicitly enabled, the React mission player owns mission configuration, question progression, timing, feedback, rewards, and local mission statistics through the typed boundary. Future React migrations must mount only into the isolated root or an explicitly migrated surface; they must not reorder or duplicate legacy scripts.

## Persistence ownership boundary

React-owned surfaces use `window.TTPersistenceBoundary` as their single typed
entry point for pilot selection, mission persistence, and local backup controls. The boundary keeps
`window.TTPilotAdapter` as a compatibility alias for the existing legacy
integration while the migration is staged. Inventory remains legacy-owned.
When the React core flag is enabled, achievements are evaluated from the
existing pilot-local storage by a pure React-owned evaluator; the legacy
renderer remains available for rollback. All typed adapters must fail closed
rather than reaching into legacy globals directly.

The boundary preserves the existing `tt-rocket-profiles-v1`,
`tt-rocket-active-profile-v1`, `cosmotablas-v2`, `cosmotablas-history-v1`,
`tt-rocket-garage-v1`, and `tt-rocket-backups-v1` storage keys. Domain payloads
remain opaque so legacy and future fields survive round trips. Invalid domain
payloads are rejected before writes, and unavailable legacy controls return a
failure value without throwing or deleting local state.

The React mission adapter records compatible fact statistics through the existing
`cosmotablas-v2` key and keeps a raw pre-write snapshot for rollback. It does not
introduce a new pilot key or overwrite malformed payloads. Mission answers remain
local-first when Supabase is unavailable or the user is signed out.

## Rollback and verification

The `reactCoreScreens` feature flag remains disabled by default. Disabling it
restores the legacy screen path without changing stored pilots, progress,
inventory, achievements, or backups. The React boundary also fails closed when
an underlying legacy control is missing, so a partial migration cannot make
local gameplay depend on an unavailable adapter. The flag-enabled achievements
surface now evaluates pilot-local facts and mission history directly; the
legacy renderer remains available for rollback.

Run the focused persistence checks with:

```bash
npm run test:unit
npm run typecheck
npx playwright test tests/e2e/feature-flags.spec.cjs --project=chromium
```

For each migrated behavior, record a Chrome DevTools check of the running Vite
application: URL, action, visible result, console errors, and network requests.
Playwright WebKit remains a compatibility signal only. Real iOS Safari
validation is outside the current acceptance scope.

The current gameplay-boundary check on `http://127.0.0.1:5178/` enabled
`VITE_REACT_CORE_SCREENS=true` explicitly and verified mission setup, launch,
answer progression, score, and local fact statistics through the React
gameplay adapter. The running page persisted `cosmotablas-v2`, exposed the
`TTAudio.sfx` hook, made no XHR/fetch requests, and reported no console errors
or warnings in Chrome DevTools.

The accessibility checks passed in Chromium with keyboard activation, Spanish
locale assertions, `prefers-reduced-motion: reduce`, touch-oriented controls,
and `aria-pressed` state changes. The focused Chromium and mobile WebKit suites
also exercised the React mission controls at responsive viewport sizes. This
is not a claim of real iOS Safari equivalence.

## Integration verification

The ownership boundary was verified from the implementation worktree on
2026-10-25:

- `npm run check`: passed; 33 legacy scripts, TypeScript, 104 unit tests, the
  Vite build, and the self-contained distribution check.
- `PLAYWRIGHT_WORKERS=1 npx playwright test --project=chromium`: passed; 39
  tests.
- `PLAYWRIGHT_MOBILE=1 PLAYWRIGHT_WORKERS=1 npx playwright test
  --project=webkit-mobile`: passed; 39 tests.
- `npx playwright test tests/e2e/feature-flags.spec.cjs --project=chromium
  --workers=1`: passed; 13 focused React/flag tests.
- `git diff --check`: passed.
- Chrome DevTools verified the typed gameplay/persistence/audio bridges, local
  mission persistence, responsive/touch controls, no console errors or
  warnings, and no XHR/fetch requests for the running online page. The
  separate Playwright offline scenario verified local play without cloud
  configuration.

The React achievements slice additionally passed the focused Chromium suite
with local facts and mission history, Spanish and English labels, a legacy DOM
removal check, and offline refresh. Its deterministic evaluator unit suite
passed malformed-payload and mastery-threshold cases. No real iOS Safari check
is claimed or required for this migration slice.

The issue remains open because the React core-screen migration is feature-
flagged and legacy-owned gameplay state, persistence, and inventory state
remain authoritative. Full legacy-source retirement belongs to issue #54.
