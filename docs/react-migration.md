# React migration boundary

The application currently starts through ordered classic scripts. The hidden `#react-root` element and `src/main.tsx` provide a typed React mount contract for incremental migration, but the bootstrap is intentionally not imported by `index.html` yet.

Legacy navigation, inline handlers, storage keys, translations, offline gameplay, and the self-contained release remain authoritative until each surface has an adapter and compatibility coverage. Future React migrations must mount only into the isolated root or an explicitly migrated surface; they must not reorder or duplicate legacy scripts.

## Persistence ownership boundary

React-owned surfaces use `window.TTPersistenceBoundary` as their single typed
entry point for pilot selection and local backup controls. The boundary keeps
`window.TTPilotAdapter` as a compatibility alias for the existing legacy
integration while the migration is staged. Inventory and achievement state
remain legacy-owned; their React action adapters are explicit typed members of
the same boundary and must fail closed rather than reaching into legacy
globals directly.

The boundary preserves the existing `tt-rocket-profiles-v1`,
`tt-rocket-active-profile-v1`, `cosmotablas-v2`, `cosmotablas-history-v1`,
`tt-rocket-garage-v1`, and `tt-rocket-backups-v1` storage keys. Domain payloads
remain opaque so legacy and future fields survive round trips. Invalid domain
payloads are rejected before writes, and unavailable legacy controls return a
failure value without throwing or deleting local state.

## Rollback and verification

The `reactCoreScreens` feature flag remains disabled by default. Disabling it
restores the legacy screen path without changing stored pilots, progress,
inventory, achievements, or backups. The React boundary also fails closed when
an underlying legacy control is missing, so a partial migration cannot make
local gameplay depend on an unavailable adapter.

Run the focused persistence checks with:

```bash
npm run test:unit
npm run typecheck
npx playwright test tests/e2e/feature-flags.spec.cjs --project=chromium
```

For each migrated behavior, record a Chrome DevTools check of the running Vite
application: URL, action, visible result, console errors, and network requests.
Playwright WebKit remains a compatibility signal only and does not replace
validation on real iOS Safari.

The current gameplay-boundary check on `http://127.0.0.1:5175/` enabled
`reactCoreScreens` explicitly and verified mission setup, launch, answer
progression, score and coin rewards through the React gameplay adapter. The
running page persisted `cosmotablas-v2`, exposed the `TTAudio.sfx` hook, made
no XHR/fetch requests, and reported no console errors or warnings.

The accessibility check also passed in Chromium with keyboard activation,
Spanish locale assertions, `prefers-reduced-motion: reduce`, and
`aria-pressed` state changes. Chrome DevTools emulation at `390x844`, touch
enabled, and reduced motion confirmed the React gameplay adapter remained
available, with no console errors or XHR/fetch requests. This is not a claim
of real iOS Safari equivalence.

## Integration verification

The ownership boundary was verified from the implementation worktree on
2026-10-25:

- `npm run check`: passed; 33 legacy scripts, TypeScript, 92 unit tests, the
  Vite build, and the self-contained distribution check.
- `npm run test:e2e`: 108/114 passed in the parallel desktop run; the six
  Firefox/WebKit timeout cases passed when rerun in isolation with one worker.
- `PLAYWRIGHT_MOBILE=1 PLAYWRIGHT_WORKERS=1 npx playwright test --project=webkit-mobile`: passed; 38 tests.
- `git diff --check`: passed.
- Chrome DevTools verified the typed persistence/gameplay/inventory/achievement
  bridges, mission rewards, local persistence, reduced-motion/touch emulation,
  no console errors, and no XHR/fetch requests.

The issue remains open because the React core-screen migration is feature-
flagged and legacy-owned gameplay state, persistence, inventory state, and
achievement calculation remain authoritative. Full legacy-source retirement
belongs to issue #54, and real iOS Safari validation is still required.
