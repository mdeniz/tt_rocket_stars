# Proposal

## Why

The React core-screen bridge currently validates parity while the ordered legacy runtime remains the gameplay source of truth and the React path stays disabled by default. Issue #53 cannot reach completion until mission state, answer progression, timing, rewards, audio hooks, and local persistence have one React-owned orchestration path with a reversible compatibility boundary.

## What Changes

- Make the React gameplay adapter the authoritative orchestration boundary for migrated mission flows when the React core flag is enabled.
- Move mission configuration, question progression, timer and auto-next state, answer feedback, rewards, and local-save scheduling behind typed React-owned contracts.
- Preserve legacy script interoperability through a narrow adapter for unsupported or explicitly rolled-back behavior.
- Add parity fixtures for multiplication, division, mixed questions, practice, exam, speed, and timed missions, including sound-disabled and offline operation.
- Keep the published flag disabled until the complete React path passes unit, E2E, Chrome DevTools, and rollback verification.
- Do not remove legacy scripts, rename persistence keys, change backup formats, or modify the Supabase provider boundary in this change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `react-core-screens`: React-owned mission orchestration becomes authoritative behind the existing feature flag while preserving the typed rollback boundary and offline behavior.
- `game-rules`: The framework-agnostic rules are consumed by the React gameplay orchestration without changing table bounds, answer semantics, or reward thresholds.
- `product/gameplay-and-progress`: Migrated mission flows must preserve the observable gameplay, per-pilot persistence, rewards, accessibility, and offline contracts.

## Impact

- Affected code: `src/shell.tsx`, `src/main.tsx`, `src/domain/`, `src/lib/shell-adapters.ts`, `src/lib/persistence-runtime.js`, legacy gameplay adapters, and related tests.
- Affected documentation: React migration notes, OpenSpec durable specifications, and the unreleased changelog.
- Affected verification: unit contracts, Chromium/Firefox/WebKit E2E, mobile WebKit signal checks, and Chrome DevTools empirical scenarios.
- No hosted database, authentication provider, service-role credential, local-storage key, or published stable entrypoint is changed.
