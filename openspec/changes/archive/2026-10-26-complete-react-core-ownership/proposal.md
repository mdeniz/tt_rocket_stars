# Proposal

## Why

The current React core screens provide a verified presentation and adapter
boundary, but legacy gameplay, inventory, achievement calculation, and pilot
persistence remain authoritative. Completing the ownership migration is needed
to remove duplicate sources of truth safely and unblock the legacy-global
retirement work in issue #54.

## What Changes

- Move core gameplay orchestration, pilot-local inventory state, and achievement
  refresh through tested React-owned boundaries while preserving observable
  behavior.
- Preserve existing local-storage keys, backup envelopes, pilot separation,
  translations, touch/keyboard behavior, and offline operation.
- Keep the React ownership flag disabled by default until every migrated surface
  passes unit, E2E, and Chrome DevTools verification.
- Retain a reversible legacy fallback during each migration stage and remove
  legacy globals only in a later change after parity is demonstrated.

## Capabilities

### New Capabilities

<!-- No new capability; the migration extends existing ownership boundaries. -->

### Modified Capabilities

- `react-core-screens`: React-owned core screens must preserve gameplay,
  inventory, achievement, language, accessibility, and rollback behavior.
- `typed-pilot-persistence`: React-owned persistence must preserve the existing
  pilot, backup, and local-first storage contracts.

## Impact

- Affects `src/shell.tsx`, `src/lib/shell-adapters.ts`, the typed persistence
  boundary, feature-flag wiring, legacy integration adapters, and related unit
  and Playwright tests.
- Adds no dependencies, hosted infrastructure, or public API changes.
- Requires empirical Chrome DevTools verification for each migrated surface and
  treats WebKit as a compatibility signal rather than proof of iOS Safari parity.
