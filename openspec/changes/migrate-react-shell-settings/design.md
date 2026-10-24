# Design

## Context

The repository has a typed React mount point but the ordered legacy scripts still own the visible shell, splash, profiles, and settings DOM. Existing persistence and fullscreen contracts are already accepted and must remain authoritative during migration.

## Goals / Non-Goals

**Goals:**

- Establish one React shell boundary with explicit adapters to legacy behavior.
- Keep local storage, backups, translations, and fullscreen behavior compatible.
- Make each migrated surface independently testable and reversible.

**Non-Goals:**

- Migrating missions, dashboard, garage, achievements, or game logic in this change.
- Replacing legacy globals or deleting legacy DOM before equivalent coverage exists.
- Adding authentication requirements, telemetry, or network dependencies.

## Decisions

- **Use one React root for the shell:** The existing `#react-root` is the only React mount. This avoids two component trees competing for navigation state.
- **Use browser adapters for legacy behavior:** The shell calls narrow adapters for persistence, translation, fullscreen, and navigation. The adapters preserve existing keys and global event contracts while the underlying screens remain legacy-owned.
- **Migrate by surface:** Splash/entry, pilot selection, and settings navigation are migrated as separate surfaces. Legacy game content remains mounted until each surface has equivalent tests.
- **Keep feature-compatible DOM identifiers during transition:** Existing test and integration identifiers remain available through the adapter boundary until dependent legacy scripts are retired.

## Risks / Trade-offs

- [Risk] React and legacy code can both respond to navigation events. → The shell owns only migrated controls and legacy adapters receive one normalized event.
- [Risk] A partial migration can create visual or accessibility regressions. → Add browser tests for each migrated surface before removing any legacy markup.
- [Risk] React rendering can affect self-contained output size. → Build and distribution checks remain required for every migration step.

## Migration Plan

1. Add shell state and adapters without changing persistence keys.
2. Migrate splash entry and verify fullscreen fallback.
3. Migrate pilot selection and settings navigation with English/Spanish coverage.
4. Verify self-contained build and browser flows.
5. Remove superseded legacy shell markup only after dependent scripts and tests no longer require it.

## Open Questions

- None; the migrated surfaces and compatibility boundaries are fixed by the issue scope and existing specs.
