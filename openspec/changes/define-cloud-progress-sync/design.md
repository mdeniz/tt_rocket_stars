# Design

## Context

The application is an offline-first Vite distribution whose legacy runtime
stores active game state under `cosmotablas-v2`,
`cosmotablas-history-v1`, and `tt-rocket-garage-v1`, with pilot profiles under
`tt-rocket-profiles-v1`. `TTLocalStore` already provides a memory fallback when
browser storage is unavailable. Manual backups use a versioned JSON payload and
must remain independent from cloud synchronization.

See `proposal.md` for the motivation. The requirements in the accompanying
spec deltas define the observable behavior.

## Goals / Non-Goals

**Goals:**

- Preserve local-first gameplay and existing storage and backup contracts.
- Allow an account holder to access the same pilot on multiple HTTPS devices.
- Keep cloud data scoped to one authenticated account through database policy.
- Make failed requests, stale writes, and deletion failures recoverable and
  visible.
- Keep provider credentials and privileged operations outside the browser.

**Non-Goals:**

- Requiring an account, network access, or cloud synchronization to play.
- Replacing the existing local profile format or manual JSON backups.
- Storing real-world child identity, analytics, telemetry, or social data.
- Building a custom application server before the managed backend contract is
  proven.
- Providing automatic cross-device real-time collaboration.

## Decisions

### Use a managed authentication and database boundary

Use Supabase Auth for invite-only email-and-password authentication and Supabase
Postgres with Row Level Security for account-owned data. Disable public new-user
signups. Invitations are issued from the Supabase Dashboard or a trusted server
using the privileged Auth API; the browser never creates accounts. The invitation
link is used only to establish the initial password. Subsequent access uses the
email-and-password flow, with email links reserved for password recovery. Use an
external transactional SMTP provider for Auth email delivery.
The browser receives only the public Supabase URL and anonymous client key;
service-role credentials remain in provider configuration.

Alternative rejected: a custom Node API would add hosting, authentication,
secret management, and authorization code before the product needs them.

Alternative rejected: public self-registration because this is an account flow
for parent or guardian-managed synchronization, and unrestricted signups would
increase abuse, email quota consumption, and privacy-management obligations.

### Keep local state as the immediate source of playable truth

The adapter reads and writes the existing local profile payload and only
enqueues synchronization after a local change. Authentication and network
requests are integration concerns around `TTLocalStore`, not prerequisites for
gameplay. A failed request leaves the local state and its manual backup path
untouched.

Alternative rejected: making every gameplay write depend on a remote request
would break offline use and increase the risk of losing progress on mobile
networks.

### Synchronize complete per-pilot snapshots first

The first cloud contract stores one versioned snapshot per account-owned pilot.
The snapshot contains the compatible profile metadata and the existing game
payload keys, rather than a new event model. This keeps migration bounded,
supports the current backup format, and is small enough for the expected game
usage.

Alternative rejected: event sourcing would improve merge granularity but would
require a new domain model and migration before the current payload contract is
stable.

### Discover cloud pilots before restoring a second device

After authentication, the client may list only the current account's pilots and
request one pilot by its stable `local_id`. A cloud-only pilot is restored as a
new local profile with the same identifier and complete compatible payload;
existing local profiles are never replaced by discovery. If the identifier is
already local, restoration uses the existing version and recovery-backup
conflict path instead of creating a duplicate.

### Use optimistic concurrency with recoverable conflicts

Each snapshot has a monotonically increasing remote version and an updated-at
value. A write includes the version the device last read. The service rejects a
stale write; the client then preserves the local snapshot, fetches the remote
snapshot, and applies the documented merge or user-selection policy while
creating a recovery backup before replacing local data.

Alternative rejected: last-write-wins because two devices could silently erase
recent progress.

### Treat the authenticated identity as the account holder

The account email belongs to the person managing synchronization. Pilot names
are pseudonyms controlled by that account and are not treated as verified
identity. The database stores only fields required to restore pilots and game
progress.

Alternative rejected: collecting child names, dates of birth, or profiles
outside the game because they are unnecessary for synchronization.

### Enforce ownership in the database

Every cloud row includes the authenticated account identifier, and Row Level
Security policies scope reads, inserts, updates, and deletes to that identifier.
The frontend never trusts a pilot or user identifier supplied by the UI as an
authorization decision.

Alternative rejected: frontend-only filtering because it would expose all
rows to a compromised or modified client.

## Risks / Trade-offs

- [A user can lose local storage before synchronization] → Keep the current
  export/import backup flow, surface sync status, and synchronize after every
  safe local save when a session exists.
- [Two devices can update the same pilot offline] → Use version checks,
  recovery backups, and a deterministic conflict flow; never silently discard
  the stale snapshot.
- [Email delivery can be delayed or links can be prefetched] → Support a
  one-time code fallback, use verified sender configuration, and document
  resend and expiration behavior.
- [The free managed services can pause or exhaust quotas] → Keep all core
  flows local, show synchronization as pending or unavailable, and document
  provider limits.
- [RLS policies can be misconfigured] → Add isolated policy tests and reject
  unauthenticated access before enabling production synchronization.

## Migration Plan

1. Add provider configuration and database migrations without changing local
   storage behavior.
2. Disable public signups, invite controlled test accounts, add authentication
   behind an optional account flow, and verify session restoration on the HTTPS
   deployment.
3. On first sign-in, import the current local pilots as version-one snapshots;
   create a local backup before any remote or local replacement.
4. Add download and upload synchronization with retry and stale-write handling.
5. Enable the account controls and cloud deletion flow after RLS and E2E tests
   pass.
6. Roll back by disabling synchronization while retaining local data and the
   manual backup tools; do not delete cloud or local data during rollback.

## Resolved Decisions

- The first conflict flow presents a local-versus-remote choice after creating
  a recovery backup. Automatic counter merging is deferred until the progress
  model has explicit merge semantics.
- The SMTP provider is deployment-configurable. Brevo is not an acceptable
  production choice while its click tracker rewrites one-time Auth URLs. The
  selected provider must preserve Auth links, or provide a verified way to
  disable rewriting. A verified sender identity is a deployment prerequisite,
  while provider credentials remain outside the repository.
- Account creation is invite-only. The Supabase Dashboard or a trusted server
  is the only place allowed to issue invitations; the public client must not
  contain an Auth admin key.
