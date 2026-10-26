# Tasks

## 1. Typed local persistence

- [x] 1.1 Add typed profile read, create, select, active-pilot, and payload capture/application operations on the existing persistence boundary; verify unchanged storage keys and per-pilot payload compatibility with unit tests.
- [x] 1.2 Add malformed-profile, invalid-payload, unavailable-storage, atomic-failure, and rollback unit coverage; verify failed operations do not change the active pilot or unrelated local data.

## 2. React integration and compatibility

- [x] 2.1 Route the flag-enabled React pilot selector and profile creation/switching flows through the typed persistence coordinator; verify offline operation, active-pilot isolation, English/Spanish labels, and visible profile state in focused Chromium E2E.
- [x] 2.2 Preserve backup controls, cloud snapshot boundaries, legacy aliases, and disabled-flag behavior; verify backup compatibility, no-account startup, and legacy rollback with unit and focused browser tests.
- [x] 2.3 Update `docs/persistence-contracts.md`, `docs/react-migration.md`, and `CHANGELOG.md` with the ownership boundary and rollback contract; verify documented storage keys, flag names, and commands match the implementation.

## 3. Integration verification

- [x] 3.1 Record Chrome DevTools evidence for profile creation, switching, local storage, console output, and network behavior; verify no authentication or network request is required for local persistence.
- [x] 3.2 Run OpenSpec strict validation, `npm run check`, full Chromium, mobile WebKit signal, and `git diff --check`; verify the React persistence flag remains disabled by default.

## Workflow follow-up

- Keep the published React persistence flag disabled until the migration is reviewed and merged.
- Do not start issue #54 or remove the legacy profile runtime until all migrated surfaces consume the typed persistence coordinator.
