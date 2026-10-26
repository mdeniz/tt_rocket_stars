# Tasks

## 1. Define the typed backup contract

- [x] 1.1 Define typed backup envelope, validation, snapshot, and operation contracts without renaming existing storage keys; verify fixtures preserve `tt-rocket-backups-v1` and unknown compatible fields.
- [x] 1.2 Implement pure validation and restore planning for valid, corrupt, unsupported, and partially malformed payloads; verify invalid inputs produce no storage mutation with unit tests.

## 2. Implement local-first backup ownership

- [x] 2.1 Implement typed create, list, restore, import, export, and reset operations over the existing safe local-store abstraction; verify per-pilot separation and compatible round-trips with unit tests.
- [x] 2.2 Enforce recovery-backup creation before restore and reset replacement; verify injected backup-storage failures prevent replacement and preserve the current state.
- [x] 2.3 Route flagged React backup controls through the typed boundary while retaining the legacy adapter fallback; verify the flag-disabled path invokes existing controls and the flagged path does not duplicate mutations.

## 3. Integrate user-facing backup flows

- [x] 3.1 Preserve localized confirmations, errors, file import limits, downloads, and reload behavior; verify English and Spanish settings flows with Playwright.
- [x] 3.2 Verify offline backup create, restore, import, export, and reset flows plus pilot isolation in Chromium; verify no network request is required and existing local keys remain unchanged.
- [x] 3.3 Verify mobile WebKit compatibility as a signal and perform Chrome DevTools empirical checks for console errors, network activity, storage mutations, and rollback behavior; record evidence in project documentation.

## 4. Release and issue integration

- [x] 4.1 Run `npm run check`, full Chromium E2E, mobile WebKit E2E, and strict OpenSpec validation; verify the self-contained build remains valid.
- [x] 4.2 Update `docs/react-migration.md`, `CHANGELOG.md`, #136, and #54 with ownership boundaries, rollback status, and exact verification results; keep the ownership flag disabled by default.

## Workflow follow-up

- Archive this change only after #136 acceptance is complete and the migration evidence has been reviewed.
- Retire `public/legacy/scripts/05.js` only as part of #54 after every dependent handler and release path has equivalent coverage.
