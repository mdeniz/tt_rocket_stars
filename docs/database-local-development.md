# Local PostgreSQL development

The backend uses PostgreSQL-compatible SQL through Drizzle ORM. Local development
uses Docker PostgreSQL so migrations and integration tests run against the same
database family targeted by Neon. No hosted credentials are required.

## Start the database

```bash
npm run db:local:up
```

The local-only connection string is:

```text
postgres://tt_app:tt_app_local_only@localhost:54329/tt_rocket_stars
```

## Apply migrations

```bash
npm run db:migrate
```

Drizzle migrations are committed under `apps/api/drizzle/`. `DATABASE_URL` may
override the local default for a non-production development database:

```bash
DATABASE_URL='postgres://...' npm run db:migrate
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
docker compose -f docker-compose.local.yml exec -T postgres pg_dump -U tt_app -d tt_rocket_stars > /tmp/tt-rocket-stars-local.sql
docker compose -f docker-compose.local.yml exec -T postgres psql -U tt_app -d tt_rocket_stars < /tmp/tt-rocket-stars-local.sql
```

Production backups and restores require a separate, explicitly approved
operations procedure and are not performed by these commands.
