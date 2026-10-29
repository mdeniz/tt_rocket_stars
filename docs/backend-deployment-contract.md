# Backend deployment contract

## Local development

Run `npm run bootstrap:local`. It starts Docker PostgreSQL, applies committed Drizzle migrations, configures local privileges, and runs the integration suite. Local defaults are non-secret and scoped to localhost/test data.

## Staging and production

`API_ENV` must be `staging` or `production`, `AUTH_SECRET` must be supplied as an external secret with at least 32 characters, and CORS origins must be explicit HTTP(S) origins. Secrets must not be committed or bundled. Deployments must use a trusted proxy for client IP and a shared rate-limit store.

## Hosted evidence

Cloudflare deployment, hosted Neon connectivity, dashboards, provider quotas, and traffic checks are unavailable until separately provisioned and approved. They are not required for local verification and no production resources are changed by this workflow.
