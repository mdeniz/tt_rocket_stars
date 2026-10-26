# React migration boundary

The application keeps ordered classic scripts for compatibility. The hidden
`#react-root` element and `src/main.tsx` provide the typed React mount contract;
the Pages workflow enables it only in `index_next.html`, while stable
`index.html` remains on the legacy release path. The ownership inventory is
maintained in [`docs/react-ownership-matrix.md`](react-ownership-matrix.md).

Legacy navigation, inline handlers, storage keys, translations, and the self-contained release remain authoritative by default. When `reactCoreScreens` is explicitly enabled, React owns the core screen surfaces and their migrated controls through typed boundaries. The legacy runtime remains loaded as a reversible compatibility path, but its screen children are hidden where React owns the visible surface. Future React migrations must mount only into the isolated root or an explicitly migrated surface; they must not reorder or duplicate legacy scripts.

## Persistence ownership boundary

React-owned surfaces use `window.TTPersistenceBoundary` as their single typed
entry point for pilot selection, cloud synchronization, mission persistence, and local backup controls. The boundary keeps
`window.TTPilotAdapter` as a compatibility alias for the existing legacy
integration while the migration is staged. Inventory uses the typed boundary
when the React core flag is enabled and retains its legacy bridge for rollback.

The `cloud` member is a lazy, fail-closed adapter around the legacy cloud
runtime. It exposes profile listing, pilot restoration, upload, download, and
queued upload without exposing a Supabase client or privileged credential to
React code. If the legacy runtime is not ready, the public configuration is
missing, the session is signed out, or the provider fails, operations return a
status result and local persistence remains authoritative.
When the React core flag is enabled, mission setup, gameplay, dashboard,
progress, garage, achievements, pilot persistence, and backup controls use the
typed React boundary. The legacy renderers and bridges remain available for
rollback and compatibility with ordered inline handlers. All typed adapters
must fail closed rather than reaching into legacy globals directly.

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

The dashboard/progress slice additionally renders mission totals, accuracy,
experience level, and per-table progress from the existing pilot-local keys.
Focused Chromium coverage verifies that the legacy dashboard and progress DOM
is hidden only while the flag is enabled, that the panels work offline, and
that the disabled flag restores the original screens.

Chrome DevTools verification of the dashboard/progress slice on
`http://127.0.0.1:5180/` rendered 2 missions, 1,100 correct answers, 98%
accuracy, level 3, and table-specific progress from local storage. The legacy
dashboard and progress hosts had inline `display: none` while their React
panels were visible. Console output contained no errors or warnings, and the
network log contained no XHR or fetch requests.

The issue remains open because the React core-screen migration is feature-
flagged and the remaining legacy bridges still require the ownership matrix,
release-compatibility audit, and promotion review. Full legacy-source retirement
belongs to issue #54.

## Final gameplay ownership audit

The `migrate-react-gameplay-ownership` scenarios are accounted for as follows:

- React-owned mission setup, question progression, timers, feedback, rewards,
  audio hooks, and local fact persistence are covered behind the opt-in flag.
- Disabled-flag startup, legacy mission fallback, backup compatibility, and
  fail-closed adapter behavior remain covered and preserve existing storage
  keys.
- Offline/no-account play, English/Spanish labels, keyboard/touch behavior,
  reduced motion, Chrome DevTools runtime evidence, Chromium E2E, and mobile
  WebKit compatibility checks are complete.
- The flag remains disabled by default in both the Vite runtime and the
  published release path.

The acceptance review does not close issue #53: the remaining legacy gameplay,
persistence, inventory, and achievement sources of truth still require
incremental migration and release compatibility review. Issue #54 remains
blocked until those sources are retired. Real iOS Safari validation is not an
acceptance gate; mobile WebKit remains the recorded compatibility signal.

The next persistence slice adds a typed React coordinator for local profile
creation and switching behind the same flag. It preserves the existing profile,
active-pilot, payload, and backup keys, validates before applying state, and
keeps the legacy profile runtime available for rollback. The published release
still leaves this coordinator disabled by default.

The inventory ownership slice adds a typed coordinator for the flag-enabled
garage. It reads and writes the existing `tt-rocket-garage-v1` payload, keeps
unknown compatible fields, validates purchases and equipment changes, and
refreshes the legacy SVG view as a compatibility mirror. Invalid operations and
unavailable storage fail closed. The disabled-flag path continues to use the
legacy inventory adapter, and the published release remains unchanged.

Chrome DevTools verification of the inventory slice on
`http://127.0.0.1:5182/` enabled `VITE_REACT_CORE_SCREENS=true` and showed the
React garage with categories and inventory controls. Offline preview and
purchase/equip of `body_blue` changed the active garage payload from 500 to 400
coins, equipped the selected part, and updated the active profile payload.
Legacy garage action calls were instrumented and remained at zero. The page
reported no console errors or warnings and no XHR/fetch requests. This is local
Chrome evidence only; real iOS Safari validation is not claimed.

The backup ownership slice adds a typed coordinator for the flag-enabled backup
controls. It preserves `tt-rocket-backups-v1`, the version-1 envelope, the
three existing gameplay payload keys, five-entry retention, localized
confirmations, file export/import, and recovery backups before restore or reset.
Legacy handlers remain as the rollback path while the flag is disabled. Invalid
envelopes and storage failures fail closed without replacing the current local
state.

Chrome DevTools verification of the backup slice on
`http://127.0.0.1:5182/?dev=backup` enabled `reactCoreScreens` through an init
script and verified typed ownership, manual backup creation, restore with a
`Before restore` recovery backup, and File API import. Restored payloads were
visible in local storage, the console had no errors or warnings, and the
network panel had no XHR or fetch requests. Chromium E2E also covered offline
export and reset; mobile WebKit passed the same backup ownership scenarios.
The final verification ran `npm run check` (119 unit tests and a self-contained
build), full Chromium E2E (44/44), full WebKit E2E (44/44), strict OpenSpec
validation, and `git diff --check`. The ownership flag remains disabled by
default. This is local Chrome/WebKit evidence only; real iOS Safari validation
is not claimed.
