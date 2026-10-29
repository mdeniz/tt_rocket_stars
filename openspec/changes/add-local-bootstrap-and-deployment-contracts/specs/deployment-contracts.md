# Deployment contracts

## Requirement: Reproducible local bootstrap

The repository MUST provide one local command that starts PostgreSQL, applies migrations and privileges, and runs integration evidence without hosted credentials.

### Scenario: Bootstrap local backend

- **WHEN** a developer runs `npm run bootstrap:local`
- **THEN** local PostgreSQL readiness, migrations, privileges, and integration tests are verified.

## Requirement: Fail-closed hosted configuration

Staging and production MUST require external secrets and explicit origins; hosted infrastructure checks remain documented when unavailable.

### Scenario: Production config lacks secret

- **WHEN** production configuration omits a valid `AUTH_SECRET`
- **THEN** the environment contract rejects it without printing secret values.
