# Tasks

## 1. Typed inventory coordinator

- [x] 1.1 Define the typed inventory state and action contract over the existing `tt-rocket-garage-v1` payload, preserving unknown compatible fields; verify the contract compiles with `npm run typecheck`.
- [x] 1.2 Implement validated active-pilot inventory reads, category selection, preview, purchase, equip, and refresh operations with atomic failure handling; verify malformed and unauthorized operations leave the stored payload unchanged in unit tests.
- [x] 1.3 Select the coordinator only for the enabled `reactCoreScreens` path while retaining the legacy adapter for fallback; verify adapter selection and disabled-flag behavior in unit tests.

## 2. React garage integration

- [x] 2.1 Route flag-enabled React garage controls through the typed inventory boundary and preserve visible rocket, coins, categories, and pilot isolation; verify the focused Chromium E2E scenarios pass offline.
- [x] 2.2 Verify backup compatibility, legacy rollback, English/Spanish labels, and unavailable-storage behavior; verify focused unit and browser tests cover the existing storage keys and no data deletion.
- [x] 2.3 Update `docs/persistence-contracts.md`, `docs/react-migration.md`, and `CHANGELOG.md` with the inventory ownership and rollback contract; verify documented flags and commands match the implementation.

## 3. Empirical and integration verification

- [x] 3.1 Run Chrome DevTools against the Vite app with the React flag enabled and record visible inventory mutation results, console output, storage changes, and network requests; verify no console errors or unexpected XHR/fetch requests.
- [x] 3.2 Run OpenSpec strict validation, `npm run check`, full Chromium E2E, mobile WebKit compatibility checks, and `git diff --check`; verify the React inventory flag remains disabled by default.

## Workflow follow-up

- Keep the published React ownership flag disabled until the slice is reviewed and merged.
- Keep issue #53 open until remaining legacy-owned sources are migrated and the full acceptance review is complete.
