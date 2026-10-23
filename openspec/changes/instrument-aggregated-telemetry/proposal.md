# Proposal

## Why

The telemetry boundary exists but no product event can use it. A consent-gated aggregate event vocabulary is needed to measure mission reliability and broad learning usage without creating learner profiles or sending data by default.

## What Changes

- Add aggregate mission-start, mission-completion, and enum-only runtime-error events.
- Add deterministic sampling and time-based retention pruning to the in-memory queue.
- Expose one browser runtime instance through the Vite self-contained build and add defensive legacy hooks.
- Document provider quotas, EU data handling, and lawful-basis review as deployment prerequisites.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `telemetry`: extend the existing consent-aware telemetry contract with aggregate event types, sampling, retention, and runtime integration.

## Impact

Changes the telemetry module, Vite inline runtime, legacy mission/startup adapters, tests, documentation, changelog, and the telemetry specification. No local-storage keys, game state, dependencies, provider credentials, or default network requests change.
