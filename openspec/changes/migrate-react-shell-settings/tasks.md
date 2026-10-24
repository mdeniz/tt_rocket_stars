# Tasks

## 1. Shell foundation

- [x] 1.1 Define typed shell state and adapter contracts for navigation, language, fullscreen, and pilot actions; verify strict TypeScript passes.
- [ ] 1.2 Mount one React shell root without changing legacy startup order; verify the self-contained build still contains ordered legacy scripts.

## 2. Migrated surfaces

- [ ] 2.1 Implement splash entry and fullscreen adapter behavior; verify desktop, touch, unsupported, and rejected fullscreen E2E scenarios.
- [ ] 2.2 Implement pilot selection and creation through the existing persistence adapter; verify per-pilot isolation and local-only startup.
- [ ] 2.3 Implement settings category navigation and translated labels; verify sound, language, theme, backups, reset, pilot, and optional cloud access remain reachable.

## 3. Compatibility and verification

- [ ] 3.1 Add unit contracts for shell adapters and legacy event boundaries; verify malformed or unavailable browser APIs fail safely.
- [ ] 3.2 Add Playwright coverage for shell entry, navigation, pilot switching, settings, responsive viewports, and both locales.
- [ ] 3.3 Run `npm run check`, `npm run test:e2e`, and the configured dev-workflow browser verification; review the diff for duplicate DOM ownership and storage-key regressions.
- [ ] 3.4 Document the migration boundary and update `CHANGELOG.md`; verify technical documentation remains in English.

## Workflow follow-up

- Archive the change after review, CI, and empirical browser verification are complete.
- Close #52 only after all acceptance criteria are met.
