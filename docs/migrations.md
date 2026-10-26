# Database Migration Workflow

The ordered SQL files in `supabase/migrations/` are the authoritative migration
source. `manifest.json` records the reviewed filename, timestamp, and SHA-256 hash for
each migration; it is a drift guard, not a second schema source.

## Local validation

Run:

```bash
npm run check:migrations
```

This validates deterministic filenames, unique timestamps, ordering, and manifest hashes.
When the Supabase CLI and a local project are available, a clean application can be
attempted with:

```bash
npm run db:migrations:reset
```

The command runs `supabase db reset --local`. It exits with an explicit unavailable
diagnostic when the local Supabase project is not configured; it never pretends that a
clean database was tested.

## CI and hosted application

CI must run `npm run check:migrations` before any schema tests. A maintainer applies the
reviewed migration history to a Supabase preview or project using the Supabase CLI or
SQL editor, then runs the RLS and schema checks against that target. Hosted application
is never performed automatically by a pull request.

## Security and recovery

- Review RLS policies, grants, triggers, security-definer functions, and indexes in every
  migration; an ORM must not silently replace these SQL objects.
- Treat a migration as applied only after the provider records it successfully.
- Transactional DDL may be rolled back by the provider when the transaction fails.
- For non-transactional or already-applied changes, use a forward fix rather than
  deleting migration history.
- Before production changes, capture the provider backup/recovery point and record the
  migration identifier. Restore the backup only through the approved Supabase recovery
  procedure when a forward fix is not safe.
- Never put service-role credentials in Vite environment variables, repository files,
  browser artifacts, or issue comments.
