# Design

## Context

The ordered profile runtime currently reads and writes the profile collection,
active-pilot reference, and opaque domain payloads. React already consumes
typed mission and backup boundaries, while `TTPersistenceContracts` provides
safe storage, validation, and payload capture primitives. The stable release
must continue to use the legacy path until the opt-in path has equivalent
coverage.

## Goals / Non-Goals

**Goals:**

- Introduce one typed local persistence coordinator for flag-enabled React
  profile operations.
- Preserve all existing storage names, opaque payload fields, backup envelopes,
  storage fallback behavior, and per-pilot isolation.
- Make failures explicit and reversible without deleting or partially applying
  local state.
- Prove offline behavior and disabled-flag rollback in unit, Chromium, mobile
  WebKit signal, and Chrome DevTools checks.

**Non-Goals:**

- Enabling the React persistence path in the published release.
- Removing the ordered legacy profile runtime in this change.
- Changing Supabase authentication, cloud synchronization, migrations, or RLS.
- Renaming storage keys or introducing a second profile/payload format.

## Decisions

### Use the existing validated persistence contracts

The coordinator will compose the current profile, domain-payload, and safe
storage contracts rather than duplicating JSON parsing or storage fallback
logic. This keeps malformed-data behavior and backup compatibility in one
boundary.

Alternative considered: let React read and write `localStorage` directly.
Rejected because it would bypass validation, risk pilot mixing, and create a
second storage implementation.

### Keep legacy integration behind an explicit adapter

React will call typed persistence capabilities. The adapter may delegate to
the legacy runtime while the migration is staged, but React components will
not invoke legacy globals directly. The flag remains the rollback switch.

Alternative considered: remove the legacy profile runtime immediately.
Rejected because the published path and inline handlers still depend on it.

### Commit profile changes atomically at the boundary

Profile selection and creation will validate the candidate collection, capture
the current active payload when required, and apply the target payload only
after validation succeeds. A failed operation returns a bounded result and
leaves the current active state unchanged.

Alternative considered: update the active-pilot key before applying payload
data. Rejected because a partial failure could expose another pilot's state.

### Verify observable behavior, not implementation identity

Tests will assert pilot isolation, unchanged storage keys, malformed payload
handling, offline startup, rollback, and visible profile behavior. Chrome
DevTools will record local storage, console, and network evidence; WebKit
mobile remains a compatibility signal only.

## Risks / Trade-offs

- [Risk] React and legacy profile state diverge during rollback → Mitigation:
  keep the flag disabled by default and test switching through both paths.
- [Risk] A malformed profile payload is partially applied → Mitigation:
  validate the complete candidate before changing the active reference or
  domain keys.
- [Risk] Storage restrictions differ by browser → Mitigation: reuse the
  in-memory safe-storage fallback and verify offline/mobile behavior.
- [Risk] Cloud sync observes an incomplete local switch → Mitigation: keep
  cloud synchronization outside this change and expose only committed local
  snapshots through the existing boundary.

## Migration Plan

1. Add typed profile persistence operations and deterministic unit contracts.
2. Connect the flag-enabled React pilot selector and local save paths through
   the coordinator while retaining legacy aliases.
3. Add offline, malformed-data, pilot-isolation, backup, rollback, and locale
   E2E coverage.
4. Run OpenSpec validation, `npm run check`, full Chromium, mobile WebKit
   signal checks, and Chrome DevTools empirical verification.
5. Keep the flag disabled in the stable release; remove the legacy runtime only
   in a later change after all migrated surfaces consume this boundary.

Rollback is disabling `reactCoreScreens` or removing the coordinator capability;
no storage migration or network operation is required.
