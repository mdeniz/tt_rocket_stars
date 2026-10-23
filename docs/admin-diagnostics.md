# Admin diagnostics boundary

TT Rocket Stars is a static Vite/GitHub Pages application. It MUST NOT implement an admin dashboard or privileged diagnostics API in the browser. The future admin surface belongs behind a trusted Supabase Edge Function or equivalent backend.

## Authorization

- The backend MUST authenticate the administrator with a server-validated identity and an explicit admin role or allowlist.
- Authorization MUST be evaluated for every request, independently of UI state, email text, query parameters, or client-supplied account IDs.
- Unauthorized, unauthenticated, and malformed requests MUST return the same non-revealing denial class and MUST NOT disclose account existence, sync state, tokens, or row counts.
- Service-role keys and administrative credentials MUST remain in backend secrets and MUST never be sent to the browser.

## Minimal diagnostics contract

The response may contain only operational fields needed to support invited account synchronization: account status, last successful sync timestamp, last sync outcome category, retry count bucket, and provider availability category. It MUST NOT contain pilot names, pilot IDs, question answers, mission history, child activity, raw telemetry, access tokens, refresh tokens, email delivery content, or exception messages.

Administrative reads, retention changes, and cloud-deletion requests MUST emit an audit record containing administrator identity, action category, target account pseudonymous identifier, outcome, and timestamp. Audit records MUST use a separate retention policy and MUST NOT copy child or gameplay data.

## Deployment gate

Before implementation, choose the admin identity provider, Edge Function/backend deployment, RLS/service-role boundary, audit store, retention period, deletion workflow, EU processing location, and quota/rate limits. Add unauthorized-access, data-minimization, secret-scanning, audit, and deletion tests before exposing an endpoint. Until then, support remains available through the Supabase Dashboard and no browser admin path is shipped.
