# Design

## Context

See `proposal.md` for the motivation. The current Vite client creates a publishable
Supabase browser client in `src/lib/supabase.js`, while `src/lib/cloud-sync.js` and the
legacy runtime perform direct `pilots`, `progress_snapshots`, and
`upsert_my_progress_snapshot` operations. The typed repository added by #170 is
provider-neutral but is not yet connected to the browser runtime.

The application must remain offline-first, keep the stable `index.html` release
contract, preserve the development `index_next.html` path, and retain existing local
storage, backup, pilot, authentication, RLS, conflict, and deletion contracts.

## Goals / Non-Goals

**Goals:**

- Define one browser-facing domain contract for optional cloud operations.
- Keep provider-specific query construction out of migrated browser code.
- Preserve authenticated ownership, optimistic concurrency, retries, conflict recovery,
  cloud deletion, local-first fallback, and public-key-only configuration.
- Make the transition reversible until legacy consumers are proven unused.
- Provide artifact, unit, browser, and empirical evidence for each migration step.

**Non-Goals:**

- Replacing Supabase Auth or changing invitation/password behavior.
- Introducing public registration or mandatory accounts.
- Exposing a service-role key or moving administrative operations into the browser.
- Migrating production data or promoting the stable release entrypoint.
- Removing all legacy scripts unrelated to cloud access.

## Decisions

### Use a domain operation contract at the browser boundary

The browser-facing API will express operations such as upload, download, list pilots,
resolve conflicts, and delete cloud data using application types and stable error
categories. It will not expose a generic query builder or accept arbitrary table names.

This is preferred over passing the Supabase client into React or legacy code because it
keeps provider-specific details isolated and makes offline failure behavior testable.

### Keep transport and provider adapters separate

The trusted runtime/provider adapter from #170 will implement the domain contract. The
browser transport will carry authenticated user context and typed request/response
payloads without administrative credentials. During migration, the existing Supabase
compatibility adapter may implement the same contract behind an explicit adapter seam.

The browser must not import the ORM, server repository, service-role credentials, or
provider-management APIs. Public Supabase configuration remains valid only for the
temporary publishable transport path.

### Migrate one operation family at a time

Pilot upload/download and snapshot conflict handling will move together because they
share version and recovery semantics. Discovery and cloud deletion will follow. Each
slice keeps the old adapter as a reversible fallback until contract tests and browser
scenarios prove that no active consumer still depends on it.

### Fail closed for cloud and open for local play

Missing configuration, signed-out state, transport errors, provider errors, and malformed
remote data return bounded domain failures. The local pilot remains authoritative for
continued play, and no failure path may delete or silently replace local data.

### Keep SQL/RLS authoritative

The checked-in Supabase migrations and RLS policies remain the security source of truth.
The boundary must preserve user ownership, explicit grants, security-definer functions,
and optimistic version enforcement. No ORM-generated client query may bypass those
policies.

## Risks / Trade-offs

- [Risk] A dual adapter can diverge during rollout → use shared contract tests and a
  feature flag with explicit fallback telemetry disabled by default.
- [Risk] A transport may accidentally expose provider details → keep request/response
  types domain-specific and add bundle checks for table names, RPC names, and privileged
  markers in the migrated path.
- [Risk] Remote data could overwrite local progress → require recovery backups and the
  existing timestamp/version/conflict decision before applying a remote snapshot.
- [Risk] Provider unavailability could block gameplay → keep all cloud calls optional,
  bounded by retries, and isolated from local mutation.
- [Risk] The full migration may be larger than one PR → split by operation family and
  keep #184 open until the legacy browser query path is demonstrably unused.

## Migration Plan

1. Add domain request/response/error contracts and an adapter seam with no behavior
   change.
2. Implement contract tests against an in-memory provider and the existing cloud
   fixture, including ownership, conflict, retry, deletion, malformed data, and offline
   cases.
3. Migrate upload/download and conflict recovery behind the seam; keep the legacy path
   as a reversible fallback.
4. Migrate discovery and deletion, then remove direct provider query construction from
   the active browser bundle.
5. Run artifact inspection, unit checks, full browser/offline suites, and available
   empirical verification. Record unavailable Chrome DevTools MCP or real Safari checks
   explicitly.
6. Update #170 and the OpenSpec task evidence. Only then remove the fallback or close
   the issue.

Rollback is the feature-flagged compatibility adapter. If a migrated operation fails
verification, disable that operation's flag and retain local-first behavior; do not
rewrite migrations or delete cloud/local data as part of rollback.

## Open Questions

- Which trusted transport implementation is available in the deployment environment
  without introducing a new hosted backend? This can be resolved during task 1 without
  changing the domain requirements or fallback strategy.
