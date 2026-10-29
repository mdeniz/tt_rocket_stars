# Design

## Context

The repository is a Vite application with legacy browser scripts and Supabase-specific cloud adapters. The new backend must be additive, compatible with Cloudflare Workers, and testable through standard `Request`/`Response` objects before any hosted account exists.

## Goals / Non-Goals

**Goals:**

- Keep the API runtime independent from Node-only globals so the same app can run in Wrangler and Workers.
- Establish stable error, request-correlation, CORS, and health contracts for later auth, database, and sync modules.
- Make local startup deterministic and credential-free.

**Non-Goals:**

- Implement Better Auth, database schema, sync writes, or frontend cutover in this slice.
- Configure production Cloudflare, Neon, email, DNS, or secrets.

## Decisions

- Use Hono's standard `Request`/`Response` handler and export a Worker-compatible default. This avoids a second server implementation and matches Cloudflare's runtime model.
- Use Zod for environment parsing and keep an injectable `ApiEnv` object. Local defaults are explicit; production requires the same variables through deployment configuration.
- Use a small custom CORS middleware rather than permissive defaults. Credentials are not enabled until auth is introduced.
- Use JSON logs with allowlisted fields and a redaction helper. Request IDs are generated at the edge and included in both responses and logs.
- Keep the initial health endpoint free of database checks. Readiness validates runtime configuration and will gain dependency checks when the database module lands.

## Risks / Trade-offs

- **Risk:** Hono or Wrangler releases can change runtime behavior. → Pin compatible versions in the lockfile and exercise the app with Wrangler locally.
- **Risk:** Local readiness is weaker than production readiness before dependencies exist. → Keep the contract explicit and add database/auth checks in their respective slices.
- **Risk:** CORS configuration can accidentally block local browser tests. → Default only to localhost origins and test both allowed and denied origins.

## Migration Plan

1. Run the API through the local Node-compatible Hono handler and Wrangler.
2. Add database and auth bindings in later changes without changing `/api/v1` error/request contracts.
3. Enable the frontend adapter behind a flag only after local integration tests pass.
4. Keep Supabase transport unchanged as rollback until hosted cutover is explicitly approved.
