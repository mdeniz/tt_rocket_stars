# Design

## Context

The current build embeds the ordered legacy scripts in both self-contained
entrypoints. The React shell installs typed adapters, but several adapters still
use legacy compatibility bridges for rendering, cloud callbacks, or rollback.
The stable entrypoint must remain untouched while the development artifact proves
that each migrated operation has a complete owner.

## Goals / Non-Goals

**Goals:**

- Produce an explicit ownership matrix for every legacy global used by the
  React-enabled path.
- Make the development entrypoint independently verifiable and keep the stable
  release copy recoverable.
- Retire only proven-unused legacy sources and preserve a tested fallback until
  the promotion gate passes.
- Validate local storage, backups, offline behavior, cloud isolation, and browser
  compatibility at the artifact and running-application levels.

**Non-Goals:**

- Renaming local or session storage keys.
- Changing backup envelopes, Supabase RLS, or authentication semantics.
- Requiring an account or network connection for gameplay.
- Claiming real iOS Safari validation from WebKit automation.

## Decisions

### Use an ownership matrix as the retirement contract

Each global gets one of three dispositions: React owner, retained compatibility
bridge, or stable-only legacy owner. The matrix is reviewed against call sites and
browser evidence before deleting a script. A simple script-count reduction is not
accepted because it cannot prove data or inline-handler compatibility.

### Keep artifact promotion separate from development deployment

The build continues to generate `index_next.html` as the current development
artifact and preserves `index.html` as the last stable copy. A release command
promotes a selected, verified artifact explicitly. This is preferred to changing
the root file on every development deploy because rollback remains a file-level
operation.

### Gate retirement with both static and empirical checks

Static checks inspect script references, storage keys, privileged credentials, and
self-contained output. Playwright covers the browser matrix, while Chrome DevTools
records the running URL, actions, visible results, console, network, and storage
evidence for each cutover scenario. This avoids treating a passing build as proof
that runtime ownership is complete.

### Preserve a reversible fallback during migration

The React flag remains disabled in the stable release until all gates pass. The
development artifact can enable the flag, but any unsupported boundary or failed
local write must leave the last valid snapshot and expose the legacy-compatible
path. Removing a legacy script is a separate reviewed step after its callers are
gone.

## Risks / Trade-offs

- [Risk] A hidden inline handler still depends on a retired global. -> Mitigation:
  scan HTML and legacy scripts, run the full browser matrix, and verify navigation
  and mission flows in DevTools before removal.
- [Risk] React and legacy payloads diverge during the flag transition. ->
  Mitigation: compare storage snapshots and backup round-trips per pilot before
  enabling ownership in the development artifact.
- [Risk] A development deploy accidentally changes the public release. ->
  Mitigation: assert that `index.html` is unchanged and promote only through the
  explicit release command.
- [Risk] Cloud initialization becomes mandatory during script retirement. ->
  Mitigation: test signed-out and offline startup with no Supabase configuration
  and keep cloud access behind its feature flag.

## Migration Plan

1. Generate and review the ownership matrix and identify the smallest removable
   legacy boundary.
2. Add static, unit, browser, and Chrome DevTools evidence for the selected
   development path.
3. Remove only the proven-unused legacy source from `index_next.html`; keep the
   stable copy and fallback scripts unchanged.
4. Run the complete release gate and record the exact evidence in #158 and #54.
5. Promote the verified artifact only by explicit release action; retain the
   previous stable artifact for rollback.

## Open Questions

None. The stable/development entrypoint policy and the supported browser matrix
are already defined by the repository specifications.
