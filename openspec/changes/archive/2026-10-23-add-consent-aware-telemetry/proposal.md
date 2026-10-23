# Proposal

## Why

TT Rocket Stars has no telemetry boundary, so future product learning could accidentally collect gameplay or child-identifying data. A small, explicit contract is needed before any provider integration is considered.

## What Changes

- Add an opt-in telemetry service with a narrow allowlist of aggregate event data.
- Gate collection on explicit consent and clear queued data on opt-out or deletion.
- Keep the default service in memory with no network activity or provider dependency.
- Bound queued volume and reject identifying, answer, free-text, and replay data.
- Document the privacy boundary and test it in Node and browser contexts.

## Capabilities

### New Capabilities

- `telemetry`: provider-independent, consent-aware collection of minimal aggregate events.

### Modified Capabilities

None.

## Impact

Adds a browser-compatible module, tests, technical documentation, and an OpenSpec contract. It does not instrument gameplay, alter local storage, add dependencies, or configure a provider. Provider delivery and aggregate dashboards remain follow-up changes.
