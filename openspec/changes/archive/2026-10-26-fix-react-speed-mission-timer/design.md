# Design

## Context

The React mission state machine already represents speed missions with a 60-second remaining-time value and exposes timer advancement. The React player currently schedules its interval only for timed missions, while the legacy path remains the default and must not change.

## Goals / Non-Goals

**Goals:**

- Schedule React timer updates for timed and speed modes.
- Reuse the existing timer advancement and completion persistence path.
- Verify visible countdown progress, timeout completion, and disabled-flag rollback.

**Non-Goals:**

- Changing speed duration, reward formulas, storage keys, or legacy mission behavior.
- Enabling React ownership in the published default.

## Decisions

- Extend the existing timer-mode guard to include `speed`, because the state machine already defines the correct 60-second limit and completion transition. A second timer implementation would risk diverging semantics.
- Keep completion routed through the existing mission persistence adapter so speed timeout results receive the same validation, duplicate protection, and rollback guarantees as answer-based completion.
- Verify the countdown through browser tests and Chrome DevTools rather than relying only on pure state-machine tests, because the defect is the missing UI scheduling effect.

## Risks / Trade-offs

- [Risk] A timer effect change could alter timed missions. → Mitigation: retain the existing timed path and add regression coverage for both modes.
- [Risk] A timeout could be persisted more than once during React re-renders. → Mitigation: reuse the completion transition guard and duplicate completion identifier.

## Migration Plan

1. Add the OpenSpec delta and regression tests.
2. Update the React timer guard and run unit, browser, build, and empirical checks.
3. Keep the React flag disabled by default and retain the legacy fallback.
4. Roll back by reverting the timer guard change if the flagged browser path regresses.
