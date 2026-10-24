# Supabase and Gmail SMTP setup

This document describes the external configuration required for optional,
invite-only cloud progress synchronization. The application remains playable
without this configuration.

## Configuration boundary

The browser may receive only these public values:

- `VITE_SUPABASE_URL`: the hosted Supabase project URL.
- `VITE_SUPABASE_ANON_KEY`: the public anonymous client key.
- `VITE_APP_SITE_URL`: the HTTPS production origin or local Vite origin used
  for authentication redirects.

Never place a Supabase service-role key, Supabase secret key, SMTP password,
or Supabase management token in the repository, `.env.example`,
the browser bundle, or GitHub Actions logs.

## Local configuration

1. Copy `.env.example` to `.env.local`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from the Supabase
   project settings.
3. Set `VITE_APP_SITE_URL` to `http://localhost:5173/`.
4. Keep `.env.local` untracked.

The optional browser client is created through `src/lib/supabase.js`. It
returns `null` when the public variables are absent or invalid, so builds with
no Supabase configuration continue to use the offline-first application.
Only the anonymous public key is accepted by this boundary; authentication
admin operations remain outside the browser.

Verify local configuration with `npm run dev` and the Settings > Cloud access
section. Never use a `file://` origin for authentication; magic-link redirects
require an allowed HTTP(S) origin.

## Production URL configuration

The production application is served from:

```text
https://mdeniz.github.io/tt_rocket_stars/
```

Configure this exact URL as the Supabase Site URL and add it to the allowed
authentication redirect URLs. Keep the local URL as a separate development
redirect. Do not use a `file://` URL for authentication.

## Invite-only authentication

Disable public new-user signups in Supabase Auth. The public application never
creates accounts. Issue invitations from the Supabase Dashboard or from a
trusted server using the Auth admin API.

The privileged key required for invitations must never be exposed to the
browser. Initially, dashboard-issued invitations are sufficient; an Edge
Function or other trusted server can automate invitations later.

Use a generic user-facing response for unknown email addresses so the public
form does not reveal whether an account exists. The invitation link is used only
to establish the initial password. Subsequent access uses email and password;
email links are used only for password recovery.

## Gmail SMTP

For the current free setup, configure Gmail as Supabase Auth's custom SMTP
provider:

- Enable two-step verification on the sender Google account.
- Create a Google app password dedicated to Supabase Auth.
- Use `smtp.gmail.com`, port `587`, and the sender Gmail address in Supabase.
- Enter the SMTP host, port, username, password, and sender address only in
  Supabase Auth SMTP settings.
- Do not commit or paste the app password into the repository, issue tracker,
  logs, or browser bundle.

The invitation and recovery templates must send a token hash to the app callback instead of
using `{{ .ConfirmationURL }}`. This avoids relying on a stale Site URL when
the app supplies a path-specific redirect:

```html
<p><a href="{{ if .RedirectTo }}{{ .RedirectTo }}{{ else }}{{ .SiteURL }}{{ end }}?token_hash={{ .TokenHash }}&type={{ .EmailType }}">Continue</a></p>
```

The static app verifies `token_hash` through Supabase Auth and removes it from
the browser URL after verification. Keep email-provider link tracking disabled;
authentication links are single-use and must not be rewritten.

Gmail sender limits and account policies can change. Treat quota exhaustion or
SMTP delivery failure as an authentication-delivery outage; local gameplay and
existing sessions must continue to work.

See [`cloud-operations.md`](cloud-operations.md) for the persistence boundary,
privacy behavior, deletion contract, recovery steps, and provider-failure
fallback.

## Rollback

To disable cloud authentication or synchronization:

1. Disable the application sync configuration.
2. Keep local gameplay and JSON backup/restore enabled.
3. Do not delete local or cloud data as part of the rollback.
4. Re-enable the feature only after provider delivery and RLS checks pass.
