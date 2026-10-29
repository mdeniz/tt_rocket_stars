# Local backend development

The backend foundation runs without Neon, Cloudflare, Supabase, email, or production credentials.

## Start the API

Install the committed dependencies, then run:

```bash
npm ci
npm run api:dev
```

The local Worker listens at `http://localhost:8787`. Check it with:

```bash
curl -i http://localhost:8787/api/v1/health
curl -i http://localhost:8787/api/v1/ready
```

The `wrangler.toml` file contains only non-secret local variables. Hosted Cloudflare configuration belongs in environment-specific deployment configuration and must not be copied into this file.

## Run checks

```bash
npm run api:typecheck
npm run api:test
```

The repository check also runs the API typecheck. Database containers, Better Auth test users, and Drizzle migrations will be added by the following backend migration slices; no hosted account is required for this foundation.

## Contract boundary

All future backend operations belong under `/api/v1`. Responses include `X-Request-ID` and a JSON error envelope. Local gameplay remains independent from this service until a later feature flag enables the frontend adapter.
