# Cloud operations and privacy

TT Rocket Stars is offline-first. Cloud access is an optional, invite-only
capability for synchronizing a pilot across devices. A missing provider,
expired link, rejected request, quota exhaustion, or network failure must leave
local gameplay and local backups usable.

## Persistence boundary

- Local pilot profiles, gameplay progress, settings, and JSON backups are stored
  in the browser storage used by the application.
- Cloud data is stored only after an invited user signs in and requests a sync.
- A cloud pilot is owned by the authenticated Supabase user and identified by
  its local pilot identifier. Progress snapshots contain the serialized pilot
  payload and a version.
- The browser receives only the Supabase URL and public anonymous key. Row-level
  security (RLS) and the authenticated deletion function enforce ownership on
  the server.
- The application does not display the account email as part of the gameplay
  profile and does not send gameplay data to analytics or advertising systems.

The schema and ownership policies are defined in
[`docs/supabase-schema.md`](supabase-schema.md) and
[`supabase/migrations/20261023000000_initial_cloud_progress.sql`](../supabase/migrations/20261023000000_initial_cloud_progress.sql).

## Invite-only access and recovery

Public sign-ups remain disabled. A maintainer invites an address from the
Supabase Dashboard (or a future trusted server). The public form requests a
magic link with `create_user: false`, so an unknown address receives a generic
response and is not disclosed as registered or unregistered.

The supported recovery path is to request a new link. Expired or invalid links
are discarded, and signing out removes the local browser session without
removing local pilots or backups.

## Local and cloud failure behavior

Cloud sync is an explicit user action. On a failed request the local payload is
not overwritten and the UI reports that local progress is safe. If Supabase or
SMTP is disabled, continue using the app offline and use the Backups section to
move progress manually between browsers.

Provider quotas, inactivity pauses, network outages, and email delivery
failures are operational conditions, not reasons to block local play. Verify
the current free-tier quota and inactivity policy in each provider dashboard;
free-tier terms can change and are not an application guarantee.

## Deletion and backups

The Cloud access section requires confirmation before calling
`delete_my_cloud_data`. The authenticated function deletes cloud rows owned by
the current user. It does not clear browser storage. Users should export a JSON
backup before deletion when they may need to restore a local pilot.

## Maintainer setup checklist

1. Follow [`docs/supabase-brevo-setup.md`](supabase-brevo-setup.md).
2. Apply the migration and verify RLS policies in the Supabase SQL editor.
3. Configure `https://mdeniz.github.io/tt_rocket_stars/` and
   `http://localhost:5173/` as the production and local authentication origins.
4. Invite a test address from the trusted Supabase environment.
5. Test sign-in, sign-out, local backup/restore, manual sync, deletion
   confirmation, and expired-link recovery without printing tokens or emails.
6. If email delivery or quota fails, leave cloud access disabled and verify that
   `npm run dev`, local gameplay, and backup/restore still work.

Never commit `.env.local`, service-role keys, SMTP passwords, Brevo API keys,
management tokens, access tokens, or private dashboard URLs.

## Traceability

- Product and technical requirements: [`openspec/specs`](../openspec/specs/)
- Cloud sync proposal: [`openspec/changes/define-cloud-progress-sync`](../openspec/changes/define-cloud-progress-sync/)
- Implementation issue: [#12](https://github.com/mdeniz/tt_rocket_stars/issues/12)
- Navigation bug issue: [#21](https://github.com/mdeniz/tt_rocket_stars/issues/21)
- SMTP setup issue: [#7](https://github.com/mdeniz/tt_rocket_stars/issues/7)
- Supabase setup issue: [#6](https://github.com/mdeniz/tt_rocket_stars/issues/6)
