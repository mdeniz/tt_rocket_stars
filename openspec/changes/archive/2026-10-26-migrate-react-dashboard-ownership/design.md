# Design

## Context

The legacy runtime stores fact statistics in `cosmotablas-v2` and mission
history in `cosmotablas-history-v1`. The React shell already has a typed mission
persistence boundary and a reversible `reactCoreScreens` flag, but the visible
dashboard and progress content still comes from legacy rendering.

## Goals / Non-Goals

**Goals:**

- Derive dashboard totals, accuracy, mission count, current level, and per-table
  progress through pure TypeScript functions.
- Render the flag-enabled dashboard and progress panels from those records,
  preserving English/Spanish labels and pilot-local isolation.
- Keep local-first operation, malformed-payload safety, and the legacy fallback.

**Non-Goals:**

- Do not migrate mission history editing, result replay, or legacy mission
  controls in this slice.
- Do not remove legacy scripts or enable the feature in the published default.
- Do not add cloud requests, telemetry, storage migrations, or dependencies.

## Decisions

- Use a pure evaluator over existing storage payloads so tests can cover exact
  metrics without a DOM or browser. Reading typed local persistence is preferred
  to scraping dashboard markup because it removes the legacy renderer from the
  ownership path.
- Keep the existing host and navigation identifiers. The flag hides or bypasses
  only the migrated dashboard/progress content; disabling it restores the
  legacy DOM without changing data.
- Treat malformed facts or history as empty input and never write a recovery
  value. This matches the existing fail-closed persistence contracts.

## Risks / Trade-offs

- [Metric drift] → Unit fixtures will encode the legacy formulas and E2E will
  compare visible React values with known local payloads.
- [Legacy and React DOM overlap] → The enabled flag will mark the legacy
  dashboard/progress content as hidden while the React panels are visible; the
  disabled path remains untouched.
- [Locale change after mount] → The shell will resynchronize labels when the
  document locale changes, while numeric evaluator output remains locale-neutral.

## Migration Plan

1. Add evaluator contracts and unit tests.
2. Mount the dashboard and progress panels behind `reactCoreScreens` and keep
   the legacy path as rollback.
3. Run global checks, focused/full Chromium, mobile WebKit, and Chrome DevTools
   empirical verification.
4. Merge the small PR after CI; leave #53 open for remaining legacy ownership.
