# Typed Data-Access Decision Record

## Decision

Select Drizzle ORM for evaluation and staged adoption in a trusted Node-compatible
data-access runtime, while retaining reviewed SQL migrations as the authoritative schema
source for PostgreSQL security objects. Do not add Drizzle to the Vite client and do not
use it to replace RLS policies, grants, triggers, or security-definer functions.

This is a boundary decision, not permission to deploy a new backend or migrate
production data. A follow-up implementation must prove the runtime, request-scoped
authentication, migration workflow, and rollback behavior before the browser delegates
to it.

## Options considered

| Option | Strengths | Risks/limitations | Decision |
| --- | --- | --- | --- |
| Drizzle ORM + PostgreSQL driver/tooling | Strong TypeScript inference, small runtime surface, explicit SQL escape hatch, suitable for a small trusted Node service | Edge/Deno support and generated migration workflow must be proven; RLS/security SQL stays manual | **Selected for isolated evaluation** |
| Kysely + migration runner | Excellent typed query-builder model and low runtime overhead; provider boundary is explicit | More application conventions are needed for schema typing, relations, and migration ownership; no ORM model to standardize domain repositories | Rejected for this slice; remains a fallback |
| Prisma | Mature schema/client workflow, generated types, migration tooling | Heavier client, binary/runtime considerations, and more friction for Edge Functions and security-sensitive SQL | Rejected for this runtime |
| SQL-only migrations and typed repositories without an ORM | Lowest dependency risk and best Supabase/RLS transparency | More manual row typing and repository boilerplate; does not provide the requested ORM migration abstraction | Retain as fallback if Drizzle cannot run in the trusted runtime |

## Boundaries

- `src/` remains browser-safe and may depend only on domain contracts or the existing
  compatibility adapter during rollout.
- The trusted runtime owns request-scoped authentication and provider calls. It may use
  a publishable or user-scoped credential as appropriate, but never sends a service-role
  credential to the browser.
- `supabase/migrations/` remains the reviewed, ordered source for RLS, grants, triggers,
  and security-definer functions. Drizzle-generated SQL, if used, must be reviewed and
  committed there rather than maintained in a second untracked history.
- No ORM model may weaken or bypass the current account ownership, explicit pilot grant,
  optimistic version, deletion, or offline-first contracts.

## Adoption and rollback

1. Validate Drizzle in an isolated trusted-runtime package with no browser import.
2. Generate or describe one non-production migration and compare its SQL with the
   existing schema/security tests.
3. Add contract tests and clean-database/drift checks before any runtime delegation.
4. Keep the current browser adapter as the rollback path until hosted and local evidence
   is complete.
5. If Edge/runtime constraints or migration fidelity fail, defer adoption and retain
   SQL-only migrations plus typed repositories; do not introduce two competing sources.
