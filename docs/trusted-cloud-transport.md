# Trusted cloud transport

TT Rocket Stars uses a Supabase Edge Function as the planned trusted transport
for optional cloud synchronization. The browser sends a domain operation and the
authenticated user's access token; it does not send table names, SQL, RPC names,
service-role keys, database passwords, or migration credentials.

## Local development

The function source is under `supabase/functions/trusted-cloud/` and the shared
request contract is under `supabase/functions/_shared/`. Local gameplay does not
require the function, a Supabase project, or network access.

Use the pinned Supabase CLI through `npx` so local and CI commands do not depend
on a globally installed or silently upgraded binary:

```bash
npx --yes supabase@2.122.0 functions serve trusted-cloud --env-file supabase/.env.local
```

The local environment file is not committed. It must contain only local values:

```text
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<local-anon-key>
ALLOWED_ORIGINS=http://localhost:5173
```

The browser transport remains disabled until the public function URL and its
feature flag are explicitly configured.

Trusted browser requests have an eight-second timeout, including response-body
reading. A timeout is reported as a retryable cloud failure and must never
replace local progress or leave the synchronization UI pending indefinitely.
The Edge Function applies the same eight-second bound to authenticated data
operations and returns HTTP `504` with `cloud_timeout` when the provider does
not complete in time. This bounds both sides of the request and does not alter
the normal `not-found` response used for a pilot that is not owned by the
authenticated account.

## Hosted deployment

Apply the checked-in migrations in timestamp order before enabling synchronization:

```bash
npx --yes supabase@2.122.0 db push
npx --yes supabase@2.122.0 functions deploy trusted-cloud
```

Supabase validates the bearer token before invoking the function because
`supabase/config.toml` enables `verify_jwt`. The function derives ownership from
the validated token subject and does not perform a second Auth lookup. Configure the following
non-secret project values in the Supabase dashboard or CLI secrets manager:

```bash
npx --yes supabase@2.122.0 secrets set \
  SUPABASE_URL="https://<project-ref>.supabase.co" \
  SUPABASE_ANON_KEY="<publishable-anon-key>" \
  ALLOWED_ORIGINS="https://mdeniz.github.io,http://localhost:5173"
```

Do not put a service-role key, database password, or any secret in this repository,
the Vite environment, the GitHub Pages artifact, or browser request payloads.
The function may be configured with provider-managed secrets only when a future
implementation requires an administrative operation; the current function uses
the authenticated user context and RLS.

## Verification and rollback

Before enabling the trusted transport, verify two invited accounts against the
hosted function: owned reads and writes, cross-account denial, stale-write
conflicts, bounded retry failures, cloud deletion, and local preservation. Record
the URL, action, result, console output, and network evidence in the PR and issues
#184 and #170.

Rollback is performed by disabling the trusted transport feature flag. This leaves
local pilots, progress, backups, and the stable `index.html` release unchanged.
If a hosted secret is exposed, rotate or revoke it in Supabase and update the
function configuration without committing the replacement value.
