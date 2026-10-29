# Backend operations and security readiness audit

This audit supports issue #255 and is intentionally local-first. It records the
controls already present in the repository, separates locally verifiable work
from provider-dependent work, and defines the smallest follow-up slices. It does
not authorize production access, hosted deployment, traffic changes, or secret
provisioning.

## Current controls

| Area | Existing local evidence | Remaining gap |
| --- | --- | --- |
| CI/CD | `.github/workflows/ci.yml` runs Node 22 repository checks and the browser matrix with a conservative scope classifier. | Dependency/security scanning and deployment-environment gates need an explicit reviewed contract. |
| Local setup | `docker-compose.local.yml`, Drizzle migrations, `npm run db:local:up`, API typecheck/tests, and backup/restore scripts provide reproducible local infrastructure. | One-command bootstrap and privilege verification need a documented acceptance test. |
| Secrets | `wrangler.toml` contains non-secret local values; `scripts/check-dist.cjs` and existing checks reject privileged markers in frontend artifacts. | CI secret scanning and a hosted secret-manager contract are not yet first-class gates. |
| API logs | `createLogger` emits JSON and redacts authorization, cookies, passwords, secrets, tokens, and keys. API errors use a stable envelope and request IDs. | Correlation propagation, bounded error events, sampling, and incident runbooks need a focused implementation. |
| Authentication | Better Auth is provider-neutral, invitation-only locally, and session-backed; frontend integration remains flag-gated. | Hosted email, durable rate-limit storage, trusted proxy configuration, and provider monitoring remain deployment work. |
| Authorization | Service/repository boundaries derive ownership from the authenticated identity; account, pilot, and crew ownership are explicit. | Least-privilege role evidence and broader cross-account security regression coverage need a dedicated slice. |
| Database | Drizzle schema/migrations and local role/grant scripts exist; migration and backup/restore checks are runnable against Docker PostgreSQL. | Production role inventory and hosted privilege validation are unavailable and must be approval-gated. |
| Privacy | Offline-first gameplay, local backups, consent-aware aggregate telemetry, and child-data exclusion are documented. | Operational dashboards and retention/cost decisions require a reviewed, hosted configuration. |
| Performance | Unit, integration, browser, and build checks exist. | API load limits, quotas, and representative local load tests are not yet defined. |

## Follow-up slices

The implementation issues created from #255 are intentionally independent:

1. Request correlation, privacy-safe error monitoring, and incident runbooks.
2. CI dependency/security gates and committed-file secret scanning.
3. Least-privilege database roles, local rate limiting, and security tests.
4. Reproducible local bootstrap, API load/quotas, deployment environments, and
   hosting configuration documentation.

Existing migration, authentication, cloud-sync, Supabase-security, telemetry,
and React cutover issues remain dependencies rather than duplicate work.

## Hosted limitations and safety gates

The following checks were not performed and must not be inferred from local
tests: production schema/account inventory, hosted Neon or Cloudflare behavior,
provider dashboards, SMTP delivery, durable distributed rate limiting, hosted
error-monitoring ingestion, real traffic/load behavior, quotas/costs, DNS, and
production recovery. Each requires an approved non-production environment,
separate credentials, an evidence artifact that excludes user payloads, and a
rollback owner before implementation is enabled.

No frontend bundle may contain API secrets, service-role credentials, SMTP
credentials, monitoring tokens, or account/pilot/gameplay data. Local gameplay,
profiles, backups, and the current feature-flagged frontend path remain usable
when the backend is unavailable.

## Local verification commands

```bash
npm run api:typecheck
npm run api:test
npm run test:integration
npm run check
npm run test
npm run build
```

Hosted credentials and email delivery are not prerequisites for these commands.
