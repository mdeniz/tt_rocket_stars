# Backend authentication and authorization

## Local flow

The API uses Better Auth behind Hono at `/api/v1/auth/*`. Public signup is disabled. Local test users are provisioned only through the development/test invitation endpoint:

```bash
curl -i -X POST http://localhost:8787/api/v1/auth/local/invite \
  -H 'Content-Type: application/json' \
  --data '{"email":"pilot@example.test","name":"Local Pilot","password":"correct-horse-battery-staple","invitationCode":"local-test-invitation"}'
```

The endpoint is unavailable in production. Tests use an in-memory adapter; local PostgreSQL integration uses the Drizzle adapter and the generated Better Auth tables. Reset requests capture a URL locally instead of sending mail.

## Identity boundaries

`User` is the authentication identity. An `Account` is the application ownership boundary and is derived from the authenticated session. A `Pilot` belongs to an Account. `Crew` ownership and membership are separate domain relationships. Repositories receive an authenticated identity and must apply ownership predicates; callers cannot select an account by sending a user or account ID.

## Supabase transition

Supabase password hashes are not assumed compatible with Better Auth and are not copied. Active Supabase sessions are not migrated. Each existing user receives an invitation, re-authenticates through the legacy flow or an approved support flow, creates a new Better Auth password, and explicitly confirms account linking. Invitations are single-use transition actions and do not silently merge accounts.

Hosted deployments must replace the local in-memory rate-limit store with a shared durable store, configure trusted proxy headers, provide a secret through the platform secret manager, and select an approved email provider. None of those credentials belong in this repository or frontend bundle. The frontend remains on its current offline-first Supabase path until a later migration flag is enabled.
