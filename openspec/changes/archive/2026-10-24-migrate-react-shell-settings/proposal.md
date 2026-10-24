# Proposal

## Why

The current shell, splash, pilot selector, and settings screens are rendered by a large ordered legacy DOM. This makes incremental UI work difficult and risks regressions when navigation or settings behavior changes, so the next migration must establish a React-owned surface without compromising the offline game.

## What Changes

- Add a React-owned application shell for splash completion, navigation, pilot selection, and settings entry points.
- Preserve the existing pilot storage keys, backup behavior, translations, fullscreen rules, and local-only gameplay.
- Keep legacy gameplay screens available while migrated shell surfaces are introduced incrementally.
- Ensure the migrated shell does not create duplicate controls or competing DOM ownership.
- Add browser coverage for startup, navigation, pilot switching, settings access, and responsive layouts.

## Capabilities

### New Capabilities
- `react-application-shell`: Provides an accessible, responsive React shell for application entry, navigation, pilot selection, and settings.

### Modified Capabilities
- `react-typescript`: The isolated React mount becomes the owner of the migrated shell surface while legacy gameplay remains compatible.
- `splash-fullscreen`: React shell entry preserves the existing device-specific fullscreen and failure fallback behavior.

## Impact

The change affects `src/main.tsx`, the Vite entry integration, shell and settings styles, legacy navigation adapters, and Playwright tests. It does not change Supabase, local storage names, cloud contracts, or external dependencies.
