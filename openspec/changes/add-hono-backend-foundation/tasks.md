# Tasks

## 1. API foundation

- [x] 1.1 Add pinned Hono/Zod/Wrangler dependencies and Worker-compatible TypeScript configuration; verify `npm install` and API type checking succeed.
- [x] 1.2 Implement environment validation, typed error envelopes, request IDs, CORS allowlisting, and redacted JSON logging; verify unit contract tests cover allowed/denied origins and secret redaction.
- [x] 1.3 Implement versioned health/readiness routes and a Worker entrypoint; verify credential-free `Request` tests return the documented status and JSON contracts.

## 2. Local developer workflow

- [x] 2.1 Add local Wrangler configuration and npm commands that do not reference production bindings; verify the API starts with `wrangler dev --local`.
- [x] 2.2 Document one-command local API startup and the planned Docker PostgreSQL integration command; verify all documented local paths are reproducible without hosted credentials.

## 3. Repository integration

- [x] 3.1 Include `apps/api` in repository TypeScript checks and add focused API tests to the unit suite; verify the focused tests pass.
- [x] 3.2 Add the API checks to CI and record local verification evidence in the parent issue; verify `npm run check` includes API typecheck/tests and the workflow YAML remains valid.

## Workflow follow-up

- Continue with the Neon/Drizzle schema change after this foundation is reviewed.
- Keep this change open until the CI task and review evidence are complete.
