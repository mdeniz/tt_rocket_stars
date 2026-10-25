# Design

## Context

The current React shell renders mission setup controls and delegates gameplay actions through typed adapters, while the ordered legacy scripts still own question state, timer progression, rewards, and persistence. The existing domain rules are framework-agnostic and the existing persistence boundary already preserves legacy keys and backup payloads.

## Goals / Non-Goals

**Goals:**

- Establish one React gameplay state machine for the flag-enabled mission flow.
- Reuse the existing domain rules and persistence contracts rather than duplicating them.
- Keep unsupported legacy integrations behind typed adapters and preserve an immediate rollback path.
- Make mission state deterministic and testable without network access.

**Non-Goals:**

- Removing the ordered legacy scripts or changing the default published flag.
- Changing Supabase authentication, cloud schema, or synchronization semantics.
- Redesigning mission visuals, translations, audio assets, or reward thresholds.
- Claiming real iOS Safari parity from Linux browser automation.

## Decisions

### React owns the mission state machine behind the existing flag

React will own the selected tables, operation, mode, duration, question index, timer state, answer feedback, and mission result for the opt-in flow. The flag remains disabled by default until parity verification passes. Keeping the flag boundary avoids changing the stable release while allowing end-to-end validation.

Alternative considered: enable the current bridge immediately. Rejected because it would leave legacy state authoritative and make failures harder to isolate.

### Domain rules remain the single mathematical source of truth

The React state machine will call the existing framework-agnostic rule contracts for question generation, answer checking, and rewards. It will not copy legacy formulas or mutate persisted data from the domain layer.

Alternative considered: keep calling legacy question generation from React. Rejected because that preserves the ownership ambiguity this change resolves.

### Persistence commits happen through the typed boundary

Mission completion and safe progress updates will use the typed persistence boundary. Invalid payloads fail closed; local save failures report status without blocking the current mission. Legacy persistence remains available only through the boundary's explicit rollback adapter.

Alternative considered: write directly to localStorage from React. Rejected because it risks key drift, invalid backups, and cross-pilot state mixing.

### Compatibility adapters are narrow and observable

Legacy calls that remain necessary for audio or unsupported screen integration will be exposed as typed capabilities with boolean/result failure semantics. The React components will not read or invoke legacy globals directly.

Alternative considered: keep broad global access until the final migration. Rejected because it prevents ownership tests from detecting hidden dependencies.

## Risks / Trade-offs

- [Risk] React and legacy question sequencing diverge → Mitigation: deterministic fixtures cover every operation and mode, plus disabled-flag parity tests.
- [Risk] Timer or audio behavior differs across browsers → Mitigation: use user-gesture-compatible hooks, fake-clock unit tests, Chrome DevTools runtime evidence, and retain the legacy fallback.
- [Risk] A failed local commit could lose progress → Mitigation: validate payloads before writes, preserve the current state on failure, and test backup/restore before enabling the flag.
- [Risk] The migration expands beyond one reviewable slice → Mitigation: keep cloud, settings, garage, achievements, and legacy script deletion out of scope.

## Migration Plan

1. Add the React gameplay contracts and deterministic state transitions behind the existing disabled flag.
2. Connect the mission setup host to the React state machine and typed persistence boundary.
3. Add unit, E2E, accessibility, offline, and rollback coverage for every scenario in the delta specs.
4. Run `npm run check`, full desktop/mobile Playwright suites, and Chrome DevTools empirical verification.
5. Keep the feature disabled in the published release until issue #53 acceptance and review gates are complete.

Rollback consists of disabling `VITE_REACT_CORE_SCREENS`/`reactCoreScreens`; no migration or local-storage rewrite is required.
