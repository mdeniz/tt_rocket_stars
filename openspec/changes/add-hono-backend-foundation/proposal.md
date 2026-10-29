# Proposal

## Why

TT Rocket Stars currently has a browser-facing Supabase boundary but no independently runnable application backend. A local-first Hono foundation is needed now so authentication, PostgreSQL persistence, and sync can be migrated behind a versioned API without making gameplay depend on hosted credentials.

## What Changes

- Add a TypeScript Hono API under `apps/api` with versioned routes and a Worker-compatible entrypoint.
- Add validated environment configuration, allowlisted CORS, request correlation, redacted structured logs, typed errors, and health endpoints.
- Add local Wrangler configuration and one-command local API/database startup documentation without production bindings.
- Add credential-free API contract tests and wire API type checking into repository checks.

## Capabilities

### New Capabilities

- `technical/backend-foundation`: Defines the locally runnable, versioned API boundary and its operational safety behavior.

### Modified Capabilities

- None.

## Impact

Adds Hono, Zod, Wrangler, and Cloudflare Worker types; creates `apps/api`; updates TypeScript and npm scripts; and documents local PostgreSQL/Wrangler workflows. It does not change the frontend transport, Supabase project, production traffic, or user data.
