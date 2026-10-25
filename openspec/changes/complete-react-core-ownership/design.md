# Design

## Context

See `proposal.md` for motivation. The current React shell composes dashboard,
mission setup, garage, and achievement surfaces, but legacy scripts still own
gameplay orchestration, pilot persistence, inventory, and achievement
calculation. The published release keeps the React path opt-in, and existing
storage keys and backup envelopes are compatibility contracts.

## Goals / Non-Goals

**Goals:**

- Establish one typed React boundary for migrated screen state and actions.
- Move ownership incrementally while preserving observable behavior and local
  data formats.
- Keep each migration reversible and verifiable in unit tests, Playwright, and
  Chrome DevTools.

**Non-Goals:**

- Removing legacy scripts in this change.
- Changing local-storage keys, backup formats, Supabase schemas, or cloud
  synchronization semantics.
- Enabling React ownership in the stable public release by default.
- Treating WebKit as proof of real iOS Safari compatibility.

## Decisions

### Keep typed adapters as the only bridge

React components will call typed adapters for gameplay, pilot persistence,
inventory, achievements, and backups. The adapters will validate inputs and
fail closed when a legacy implementation is unavailable. Direct access to
ordered legacy globals remains prohibited.

Alternative rejected: importing legacy globals directly into components. That
would make rollback and ownership measurement ambiguous and would preserve
hidden coupling.

### Migrate state domains in dependency order

Pilot persistence and gameplay contracts are established before inventory and
achievement state. Each domain keeps the legacy implementation as a fallback
until its React tests and empirical verification pass.

Alternative rejected: migrating all screens in one change. A large cutover
would make regressions in progress, coins, audio, or backups difficult to
localize.

### Use the existing flag as a release gate

The existing React ownership flag remains disabled by default. Internal tests
enable it explicitly, while production can roll back by disabling the flag
without changing stored data.

Alternative rejected: enabling the new ownership path globally after CI. CI
WebKit does not represent all iOS Safari storage, audio, fullscreen, and
orientation behavior.

### Verify behavior at three levels

Pure contracts use unit tests, user journeys use Playwright across configured
engines, and the running application is checked with Chrome DevTools for each
migrated scenario. Evidence records console and network results, including
offline behavior.

## Risks / Trade-offs

- [Duplicate legacy and React state can diverge] → Keep one adapter boundary,
  compare snapshots in tests, and retain legacy authority until each domain is
  verified.
- [A failed migration could affect progress] → Preserve keys and backup
  envelopes, create recovery backups before replacement, and keep rollback
  enabled.
- [React ownership may expose Safari-only issues] → Keep the flag off by
  default and require real-device validation before release enablement.
- [The change may grow beyond issue #53] → Track each domain as a separate
  task/PR and leave legacy-global removal for issue #54.

## Migration Plan

1. Add or refine typed contracts and adapters without changing the default
   release path.
2. Migrate pilot persistence and gameplay orchestration behind the flag, with
   unit, E2E, and Chrome DevTools evidence.
3. Migrate inventory and achievement state, preserving backup compatibility and
   localized controls.
4. Run the complete check/build/browser suite and verify rollback with the flag
   disabled.
5. Leave the flag disabled in public releases until real iOS Safari validation
   and issue #53 acceptance review are complete.

## Open Questions

- Which minimum iOS Safari version will be included in the release matrix?
