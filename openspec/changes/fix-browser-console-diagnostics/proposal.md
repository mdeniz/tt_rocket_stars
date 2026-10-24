# Proposal

## Why

Normal startup currently emits a missing-favicon request, and hiding the splash or navigation drawer can leave keyboard focus inside an `aria-hidden` subtree. These diagnostics reduce confidence in the offline mobile experience and represent an accessibility regression that should be fixed before further UI work.

## What Changes

- Embed a small favicon directly in the HTML so startup does not request `/favicon.ico`.
- Move focus to a visible control before hiding the splash or navigation drawer.
- Add unit and browser coverage for the favicon and focus-management contracts.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `technical/offline-web-app`: strengthen self-contained startup and accessible user-gesture transitions.

## Impact

Affected files are the HTML entrypoint, legacy navigation/splash adapters, and automated unit/E2E tests. No dependencies, storage keys, network APIs, or gameplay contracts change.
