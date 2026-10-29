# Local PostgreSQL development

The backend uses PostgreSQL-compatible SQL through Drizzle ORM. Local development
uses Docker PostgreSQL so migrations and integration tests run against the same
database family targeted by Neon. No hosted credentials are required.

## Start the database

```bash
npm run db:local:up
```

The local-only application connection string is:

```text
postgres://tt_app:tt_app_local_only@localhost:54329/tt_rocket_stars
```

The local runtime role is `tt_app` and is deliberately `NOSUPERUSER`,
`NOCREATEDB`, and `NOCREATEROLE`. Migrations use the separate `tt_migrator`
role. The container bootstrap admin role is used only for local role setup and
backup/restore drills; none of these credentials may be reused in hosted
environments.

## Apply migrations

```bash
npm run db:migrate
```

Drizzle migrations are committed under `apps/api/drizzle/`. `DATABASE_URL` may
override the local default for a non-production development database:

```bash
DATABASE_MIGRATION_URL='postgres://...' npm run db:migrate
```

Never point these commands at production data during development.

## Run integration tests

This command starts the local container if needed, waits for PostgreSQL, applies
the committed migrations, and runs tests against the real database:

```bash
npm run test:integration
```

The tests cover clean-room table creation, account isolation through composite
foreign keys, durable idempotency uniqueness, positive snapshot versions, and
transaction rollback. They use synthetic data and remove it when the test exits.

## Reset and backup

To stop the local service while retaining its named volume:

```bash
npm run db:local:down
```

To reset only the disposable local database, removing its Docker volume:

```bash
npm run db:local:reset
```

For a local logical backup and restore drill:

```bash
docker compose -f docker-compose.local.yml exec -T postgres pg_dump -U tt_admin -d tt_rocket_stars > /tmp/tt-rocket-stars-local.sql
docker compose -f docker-compose.local.yml exec -T postgres psql -U tt_admin -d tt_rocket_stars < /tmp/tt-rocket-stars-local.sql
```

The reproducible automated drill uses a temporary database and does not delete
the primary local database:

```bash
npm run db:backup:restore:test
```

Hosted Neon environments are separated by distinct projects or branches and
distinct `DATABASE_URL`/migration credentials: development is disposable,
staging is isolated for release verification, and production is restricted to
deployment automation. Migrations are applied forward-only from Git; rollback
uses a tested follow-up migration or a provider backup restore, never an
unreviewed destructive command. Neon branching and point-in-time restore must
be validated with the provider account before production cutover.

Production backups and restores require a separate, explicitly approved
operations procedure and are not performed by these commands.
