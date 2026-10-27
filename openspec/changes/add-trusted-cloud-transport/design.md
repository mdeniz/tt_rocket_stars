# Design

## Context

The browser already exposes a typed cloud boundary, but `src/lib/cloud-provider.js`
still implements the temporary publishable Supabase transport. The checked-in
migrations and RLS policies are the security source of truth. The application is
published as a self-contained GitHub Pages artifact and must remain playable
without cloud configuration or network access.

## Goals / Non-Goals

**Goals:**

- Add a Supabase Edge Function transport for domain-level cloud operations.
- Authenticate every request with the user's Supabase access token.
- Keep service-role credentials exclusively in Supabase Function secrets.
- Reuse existing tables, RPCs, RLS, optimistic concurrency, and local-first rules.
- Keep the compatibility adapter available behind an explicit rollback flag until
  hosted verification proves the new path safe.

**Non-Goals:**

- Replacing Supabase Auth or changing invitation and password flows.
- Moving stable `index.html` or promoting the development artifact.
- Adding public registration, real-time collaboration, or a second database.
- Removing the compatibility adapter in the first transport PR.

## Decisions

### Use one domain-specific Edge Function endpoint

Expose a single function endpoint with an allowlisted operation field such as
`upload`, `download`, `listPilots`, `restorePilot`, and `deleteCloudData`. The
browser transport sends typed domain payloads and never sends table names, SQL,
RPC names, or arbitrary queries. A single endpoint keeps CORS, authentication,
error mapping, and rollout controls consistent.

Alternative rejected: separate browser calls to Supabase tables, because they
would preserve provider-specific access in the client.

Alternative rejected: a new hosted Node service, because it adds hosting and
secret-management infrastructure while the existing Supabase project already
provides the trusted execution boundary.

### Validate the JWT before every operation

The function obtains the bearer token from the request, validates it using the
Supabase server client, and rejects missing or invalid sessions with a generic
unauthorized response. The server client may use the service-role secret only
inside the function, and every data operation still scopes rows to the validated
user id or calls an ownership-preserving security-definer function.

### Preserve provider security contracts

The function validates operation-specific payloads and bounds request size before
calling the typed repository. It maps stale writes to a stable conflict result,
provider failures to retryable errors, and malformed data to a safe validation
error. It never accepts a client-supplied account id as authorization.

The Supabase provider normalizes the all-null composite-row sentinel returned by
PostgREST for zero-row ownership RPCs to `null`. This preserves the ownership-safe
`not-found` contract for missing or non-owned pilots and prevents an empty row
from being serialized as a cloud provider failure.

### Roll out behind a transport flag

The browser selects the Edge Function transport only when the public function URL
and the transport feature flag are enabled. Otherwise it uses the existing
compatibility adapter or reports cloud as unavailable according to the existing
configuration. The flag defaults off until hosted authenticated, RLS, offline,
rollback, and production-browser evidence is recorded.

### Keep local state authoritative during failures

The transport adapter integrates with the existing `cloud-sync` domain layer.
Remote responses pass through the existing snapshot validation, version conflict,
recovery-backup, and local-versus-remote selection logic. The function cannot
directly mutate browser storage, and a failed request cannot delete local data.

### Cancel transport work at session boundaries

The cloud-sync adapter owns a lifecycle generation. Signing out or replacing the
session increments that generation, resolves queued uploads as cancelled, and
asks the provider to abort its active `AbortController` instances. Every upload
checks the generation before publishing status or synchronization metadata. The
trusted provider exposes cancellation without changing its domain operation
payload, so the browser still sends only the user's access token and the
allowlisted operation.

## Risks / Trade-offs

- [Risk] A service-role function could bypass RLS accidentally → prefer the
  authenticated server client and ownership-scoped repository methods; add tests
  that reject cross-account identifiers and inspect the bundle for secrets.
- [Risk] CORS or JWT configuration can fail in production → allow only the known
  GitHub Pages and local development origins, document deployment values, and add
  an authenticated hosted smoke check before enabling the flag.
- [Risk] The Edge Function may be unavailable on the free tier → retain local-first
  behavior, bounded retries, and the compatibility rollback path.
- [Risk] Transport and compatibility adapters may diverge → run the same domain
  contract fixtures against both adapters before removing the fallback.

## Migration Plan

1. Add the Edge Function contract, validation, and local/in-memory tests without
   changing the default browser transport.
2. Implement the browser adapter and configuration validation with the feature flag
   disabled by default; verify generated artifacts contain no privileged secrets.
3. Configure the function URL, service-role secret, JWT/auth settings, CORS, and
   migrations in the Supabase project outside the repository.
4. Run hosted tests for two invited accounts: owned reads/writes, cross-account
   denial, stale writes, retries, deletion, and local preservation.
5. Enable the flag only for controlled verification, record Chrome DevTools and
   CI evidence, and keep the compatibility rollback available.
6. Remove the compatibility adapter only in a later change after all consumers and
   release/rollback gates are proven unused.

Rollback disables the transport flag and leaves local storage, backups, database
rows, and the stable release untouched. Function secrets are revoked or rotated
outside the repository if the hosted deployment is compromised.
