# Design

## Context

The React ownership slices are feature-flagged and the ordered legacy runtime remains loaded for the stable release and rollback. `public/legacy/scripts/02.js`, `03.js`, `04.js`, `05.js`, `26.js`, and `32.js` still provide compatibility globals, inline-handler targets, persistence bridges, and fallback renderers. Existing typed boundaries preserve the legacy storage keys and backup envelopes, but the repository does not yet prove that every legacy consumer has been replaced.

## Goals / Non-Goals

**Goals:**

- Produce an auditable ownership graph from legacy globals and inline handlers to typed adapters, React surfaces, and fallback paths.
- Retire duplicate sources incrementally, one responsibility at a time, only after typed parity and rollback evidence pass.
- Keep local-first gameplay, pilot isolation, backup compatibility, optional cloud access, and self-contained release output unchanged.
- Make stable promotion and rollback explicit and mechanically checkable.

**Non-Goals:**

- Renaming or migrating existing local/session storage keys.
- Making authentication or network access mandatory for gameplay.
- Replacing the ordered legacy runtime wholesale or removing fallback code without a completed ownership row.
- Validating real iOS Safari with Playwright WebKit.

## Decisions

### Ownership graph before deletion

Build a static inventory of global declarations, inline HTML handlers, `window` adapters, React imports, and script ordering. Each candidate removal must name its remaining consumers and have a zero-consumer result for the enabled development path and the disabled stable fallback. Prefer a checked-in inventory over ad-hoc grep output so review can detect regressions.

### Typed boundaries remain the migration seam

All migrated surfaces continue to use typed adapters for persistence, gameplay, inventory, achievements, backups, settings, and cloud operations. React components do not call legacy globals directly. A legacy bridge is removed only after the adapter owns the behavior and the disabled-flag path still resolves to the legacy implementation.

### Keep data contracts opaque and reversible

The implementation continues to capture and apply the existing protected keys without reshaping unknown payload fields. Before any replacement mutation, create the existing recovery backup. A failed typed write or unavailable adapter returns a recoverable failure and leaves the previous raw snapshot readable.

### Separate release promotion from development verification

The build continues to produce `index_next.html` as the current development artifact. The Pages workflow restores the latest GitHub Release asset as `index.html`. Promotion is an explicit release action only after all gates pass; rollback restores the previous release asset and leaves the development artifact available for diagnosis.

### Verification evidence is a release input

Run static checks, unit tests, full desktop browser tests, mobile WebKit compatibility tests, offline/storage/backup/cloud tests, and empirical browser checks when Chrome DevTools MCP is available. Record unavailable provider or device checks as unavailable rather than treating automation as equivalent evidence.

## Risks / Trade-offs

- [Risk] An inline handler or third-party browser path still depends on a removed global → [Mitigation] make the ownership inventory and browser fallback matrix mandatory before each deletion.
- [Risk] A payload shape changes during migration → [Mitigation] preserve raw keys, opaque fields, backup envelopes, and recovery-before-replacement tests.
- [Risk] The development artifact is accidentally promoted → [Mitigation] keep Pages release restoration and distribution checks in CI, and require an explicit promotion gate.
- [Risk] Browser evidence is incomplete → [Mitigation] keep the issue in `status:verification` and do not promote or archive while required evidence is unavailable.
- [Risk] Retaining compatibility code increases bundle size → [Mitigation] remove only proven duplicate code after the stable release has a verified rollback path.

## Migration Plan

1. Inventory and classify each legacy global, inline handler, and duplicate renderer by responsibility.
2. Add or complete typed adapter parity and tests for one responsibility at a time, keeping the flag disabled by default.
3. Run the enabled and disabled browser matrices, including offline, malformed storage, backups, cloud failure, and localized accessibility paths.
4. Remove only the legacy source with no remaining consumers; update the ownership matrix and release assertions in the same change.
5. Build both entrypoints, verify the stable artifact is unchanged, and publish the development artifact only under `index_next.html`.
6. Promote a tested build through the release workflow; retain the previous release for rollback and document the result in #54 and #158.
