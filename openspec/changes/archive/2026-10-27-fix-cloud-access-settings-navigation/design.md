# Design

## Context

The legacy Settings adapter already knows how to conditionally include the
Cloud access panel, but the React shell owns the visible Settings navigation and
currently declares only local categories. The cloud panel is therefore present
in the DOM for flagged builds but has no user-facing React tab.

## Goals / Non-Goals

**Goals:**

- Make the flagged Cloud access panel reachable through the React Settings UI.
- Keep the default/stable flag-off path unchanged and fail closed.
- Verify the behavior through the same cloud fixture used by authenticated E2E tests.

**Non-Goals:**

- Changing Supabase authentication, cloud synchronization, RLS, or data contracts.
- Making cloud access mandatory or enabling it in the stable entrypoint.
- Removing the legacy Settings adapter or changing local persistence.

## Decisions

- Keep the feature-flag decision in the React shell, so the visible navigation
  and panel selection share one source of truth in the enabled development path.
- Derive the Cloud access tab target from the existing `#ttAuthPanel` element
  and delegate selection to `TTSettingsAdapter` for compatibility with the
  legacy panel lifecycle.
- Add the Cloud access tab only when `window.__TT_FEATURES__.cloudAccess` is
  true. This preserves the existing six-category default navigation and its
  hidden-panel assertions.
- Update the cloud E2E fixture to click the tab and assert visibility before
  exercising controls; direct scrolling remains useful only as a fallback
  diagnostic.

## Risks / Trade-offs

- [Risk] A missing or malformed cloud panel could produce a tab with no target
  → Mitigation: render the tab only when the panel element is found and keep
  the existing fail-closed feature guard.
- [Risk] The enabled path could accidentally issue a request while merely
  opening Settings
  → Mitigation: assert no authenticated cloud request during signed-out tab
  activation.
- [Risk] Stable builds could expose the new category
  → Mitigation: preserve the false-by-default flag and retain explicit E2E
  assertions for the flag-off path.

## Migration Plan

Implement on a feature branch, run unit/E2E/build and Chrome DevTools checks,
then merge without changing the stable release promotion procedure. Rollback is
the normal branch revert; the flag-off path remains the compatibility fallback.
